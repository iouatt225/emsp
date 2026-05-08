import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, GraduationCap, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { submitInscription } from "../../api/inscriptionsApi";
import { useFormations } from "../../hooks/useFormations";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import type { InscriptionFormData, InscriptionSubmissionResponse } from "../../types";
import {
  degreeOptions,
  getFormationRequirement,
  groupFormationsByProgram,
  inscriptionDefaultValues,
  inscriptionStepTitles,
  memberCountries,
  serializeInscriptionDraft,
} from "../../utils/inscription";

const DRAFT_KEY = "emsp-inscription-draft-v1";
const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const DOCUMENT_EXTENSIONS = [".pdf"];
const ADDITIONAL_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

const currentYear = new Date().getFullYear();

const createFileSchema = (
  label: string,
  allowedExtensions: string[],
  maxSizeInBytes: number,
  required = true,
) =>
  z
    .custom<File | undefined>(
      (value) => {
        if (value === undefined) {
          return !required;
        }
        return value instanceof File;
      },
      { message: required ? `${label} est requis.` : `${label} est invalide.` },
    )
    .superRefine((value, context) => {
      if (!(value instanceof File)) {
        return;
      }

      const extension = `.${value.name.split(".").pop()?.toLowerCase() || ""}`;
      if (!allowedExtensions.includes(extension)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} doit etre dans un format autorise (${allowedExtensions.join(", ")}).`,
        });
      }

      if (value.size > maxSizeInBytes) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} depasse la taille maximale autorisee.`,
        });
      }
    });

const inscriptionSchema = z
  .object({
    formationId: z.string().min(1, "Choisissez une formation."),
    firstName: z.string().trim().min(1, "Le prenom est requis."),
    lastName: z.string().trim().min(1, "Le nom est requis."),
    dateOfBirth: z
      .string()
      .min(1, "La date de naissance est requise.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Date invalide.")
      .refine((value) => new Date(value) < new Date(), "La date de naissance doit etre anterieure a aujourd'hui."),
    placeOfBirth: z.string().trim().min(1, "Le lieu de naissance est requis."),
    nationality: z.string().min(1, "La nationalite est requise."),
    residenceCountry: z.string().trim().min(1, "Le pays de residence est requis."),
    address: z.string().trim().min(1, "L'adresse complete est requise."),
    phone: z.string().trim().min(8, "Le telephone est requis."),
    whatsapp: z.string().trim(),
    email: z.string().trim().email("Adresse email invalide."),
    confirmEmail: z.string().trim().email("Adresse email invalide."),
    photo: createFileSchema("La photo d'identite", PHOTO_EXTENSIONS, 2 * 1024 * 1024),
    highestDegree: z.string().min(1, "Le diplome le plus eleve est requis."),
    institutionName: z.string().trim().min(1, "L'etablissement d'obtention est requis."),
    graduationYear: z
      .string()
      .regex(/^\d{4}$/, "L'annee d'obtention doit contenir 4 chiffres.")
      .refine((value) => Number(value) >= 1970 && Number(value) <= currentYear + 1, "Annee d'obtention invalide."),
    diplomaCountry: z.string().trim().min(1, "Le pays d'obtention est requis."),
    transcriptFile: createFileSchema("Le releve de notes", DOCUMENT_EXTENSIONS, 5 * 1024 * 1024),
    diplomaFile: createFileSchema("Le diplome ou l'attestation", DOCUMENT_EXTENSIONS, 5 * 1024 * 1024),
    motivationFile: createFileSchema("La lettre de motivation", DOCUMENT_EXTENSIONS, 5 * 1024 * 1024, false),
    professionalExperience: z.string().trim(),
    motivationText: z.string().trim(),
    additionalDocuments: z
      .array(z.custom<File>((value) => value instanceof File, { message: "Document supplementaire invalide." }))
      .max(5, "Vous pouvez ajouter au maximum 5 documents supplementaires.")
      .superRefine((files, context) => {
        files.forEach((file, index) => {
          const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
          if (!ADDITIONAL_DOCUMENT_EXTENSIONS.includes(extension)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index],
              message: "Format non supporte pour ce document supplementaire.",
            });
          }
          if (file.size > 5 * 1024 * 1024) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index],
              message: "Chaque document supplementaire doit peser 5 Mo maximum.",
            });
          }
        });
      }),
    accuracyCertified: z.boolean().refine((value) => value, {
      message: "Vous devez certifier l'exactitude des informations fournies.",
    }),
    termsAccepted: z.boolean().refine((value) => value, {
      message: "Vous devez accepter les conditions d'admission.",
    }),
  })
  .superRefine((values, context) => {
    if (values.email.toLowerCase() !== values.confirmEmail.toLowerCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmEmail"],
        message: "Les deux adresses email doivent correspondre.",
      });
    }

    if (!values.motivationText && !(values.motivationFile instanceof File)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivationText"],
        message: "Ajoutez un texte de motivation ou joignez une lettre en PDF.",
      });
    }
  });

const stepFields: FieldPath<InscriptionFormData>[][] = [
  ["formationId"],
  [
    "firstName",
    "lastName",
    "dateOfBirth",
    "placeOfBirth",
    "nationality",
    "residenceCountry",
    "address",
    "phone",
    "email",
    "confirmEmail",
    "photo",
  ],
  [
    "highestDegree",
    "institutionName",
    "graduationYear",
    "diplomaCountry",
    "transcriptFile",
    "diplomaFile",
    "motivationFile",
    "motivationText",
    "additionalDocuments",
  ],
  ["accuracyCertified", "termsAccepted"],
];

const backendFieldMap: Partial<Record<string, FieldPath<InscriptionFormData>>> = {
  formation: "formationId",
  first_name: "firstName",
  last_name: "lastName",
  date_of_birth: "dateOfBirth",
  place_of_birth: "placeOfBirth",
  nationality: "nationality",
  residence_country: "residenceCountry",
  address: "address",
  phone: "phone",
  whatsapp: "whatsapp",
  email: "email",
  confirm_email: "confirmEmail",
  photo: "photo",
  highest_degree: "highestDegree",
  institution_name: "institutionName",
  graduation_year: "graduationYear",
  diploma_country: "diplomaCountry",
  transcript_file: "transcriptFile",
  diploma_file: "diplomaFile",
  motivation_file: "motivationFile",
  professional_experience: "professionalExperience",
  motivation_text: "motivationText",
  additional_documents: "additionalDocuments",
  accuracy_certified: "accuracyCertified",
  terms_accepted: "termsAccepted",
};

function getStoredDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return inscriptionDefaultValues;
    }

    return {
      ...inscriptionDefaultValues,
      ...JSON.parse(raw),
      additionalDocuments: [],
      photo: undefined,
      transcriptFile: undefined,
      diplomaFile: undefined,
      motivationFile: undefined,
    } satisfies InscriptionFormData;
  } catch {
    return inscriptionDefaultValues;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-2 text-sm text-red-600">{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 sm:grid-cols-[220px_1fr]">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm text-dark">{value || "-"}</span>
    </div>
  );
}

const InscriptionPage = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [successData, setSuccessData] = useState<InscriptionSubmissionResponse | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");

  const { data: site } = useSiteConfig();
  const { data: formations = [] } = useFormations();

  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    mode: "onBlur",
    shouldFocusError: true,
    defaultValues: getStoredDraft(),
  });

  const watchedValues = watch() as InscriptionFormData;
  const selectedFormation = formations.find(
    (formation) => String(formation.id) === watchedValues.formationId,
  );
  const groupedFormations = useMemo(
    () => groupFormationsByProgram(formations),
    [formations],
  );
  const requirementInfo = useMemo(
    () => getFormationRequirement(selectedFormation),
    [selectedFormation],
  );

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, serializeInscriptionDraft(watchedValues));
  }, [watchedValues]);

  useEffect(() => {
    const preselectedCode = searchParams.get("filiere");
    if (!preselectedCode || watchedValues.formationId) {
      return;
    }

    const match = formations.find(
      (formation) => formation.code.toLowerCase() === preselectedCode.toLowerCase(),
    );
    if (match) {
      setValue("formationId", String(match.id), { shouldDirty: true });
    }
  }, [formations, searchParams, setValue, watchedValues.formationId]);

  useEffect(() => {
    if (!(watchedValues.photo instanceof File)) {
      setPhotoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(watchedValues.photo);
    setPhotoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [watchedValues.photo]);

  const mutation = useMutation({
    mutationFn: submitInscription,
    onSuccess: (data) => {
      setSuccessData(data);
      setServerError("");
      localStorage.removeItem(DRAFT_KEY);
      reset(inscriptionDefaultValues);
      setCurrentStep(0);
    },
    onError: (error: any) => {
      const payload = error?.response?.data;
      if (!payload || typeof payload !== "object") {
        setServerError("La soumission a echoue. Veuillez reessayer.");
        return;
      }

      setServerError("Le dossier contient des erreurs. Corrigez-les puis relancez l'envoi.");
      Object.entries(payload).forEach(([key, value]) => {
        const fieldName = backendFieldMap[key];
        if (!fieldName) {
          return;
        }

        const message = Array.isArray(value) ? value.join(" ") : String(value);
        setError(fieldName, { type: "server", message });
      });
    },
  });

  const handleStepForward = async () => {
    const isValid = await trigger(stepFields[currentStep], { shouldFocus: true });
    if (!isValid) {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, inscriptionStepTitles.length - 1));
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    await mutation.mutateAsync(values);
  });

  const formationSelectGroups = [
    { label: "FSP", items: groupedFormations.FSP },
    { label: "FS-MENUM", items: groupedFormations["FS-MENUM"] },
    { label: "FCQ", items: groupedFormations.FCQ },
  ];

  if (successData) {
    return (
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-[32px] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold text-dark">Votre dossier a ete soumis avec succes</h1>
            <p className="mt-4 text-slate-600">
              Numero de dossier: <span className="font-semibold text-dark">{successData.dossier_number}</span>
            </p>
            <p className="mt-3 text-slate-600">
              Conservez ce numero pour tout suivi ulterieur avec l'administration de l'EMSP.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={successData.acknowledgement_url}
                className="rounded-md bg-primary px-5 py-3 font-semibold text-dark"
                target="_blank"
                rel="noreferrer"
              >
                Telecharger l'accuse de reception
              </a>
              <button
                type="button"
                className="rounded-md border border-secondary px-5 py-3 font-semibold text-secondary"
                onClick={() => setSuccessData(null)}
              >
                Soumettre un autre dossier
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-slate-50">
      <section className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#fef9c3_100%)] py-16 text-dark">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">Inscription</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold sm:text-5xl">
            Deposez votre candidature EMSP en quelques etapes
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Remplissez le formulaire ci-dessous pour soumettre votre candidature à l'EMSP. Assurez-vous de fournir des informations exactes et de joindre tous les documents requis pour maximiser vos chances d'admission.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-10 grid gap-6 md:grid-cols-4">
            {inscriptionStepTitles.map((title, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={title} className="relative">
                  {index < inscriptionStepTitles.length - 1 ? (
                    <div className="absolute left-8 top-5 hidden h-[2px] w-[calc(100%-1rem)] bg-slate-200 md:block">
                      <div
                        className="h-full bg-secondary transition-all"
                        style={{ width: isCompleted ? "100%" : "0%" }}
                      />
                    </div>
                  ) : null}
                  <div className="relative z-10 flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                        isCompleted
                          ? "border-secondary bg-secondary text-white"
                          : isActive
                            ? "border-secondary bg-white text-secondary"
                            : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : index + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-dark" : "text-slate-500"}`}>{title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="space-y-10" onSubmit={onSubmit}>
            {serverError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            ) : null}

            {currentStep === 0 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-dark">Choix de la formation</h2>
                  <p className="mt-3 text-slate-600">
                    Selectionnez la formation visee pour precharger les conditions d'admission.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Formation*</span>
                  <select
                    value={watchedValues.formationId}
                    onChange={(event) => {
                      setValue("formationId", event.target.value, { shouldDirty: true, shouldValidate: true });
                      clearErrors("formationId");
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                  >
                    <option value="">Choisir une formation</option>
                    {formationSelectGroups.map((group) =>
                      group.items.length > 0 ? (
                        <optgroup key={group.label} label={group.label}>
                          {group.items.map((formation) => (
                            <option key={formation.id} value={formation.id}>
                              {formation.code} - {formation.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null,
                    )}
                  </select>
                  <FieldError message={errors.formationId?.message} />
                </label>

                <div className="rounded-3xl border border-secondary/20 bg-secondary/10 p-6">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="text-secondary" size={24} />
                    <h3 className="font-display text-2xl font-semibold text-dark">{requirementInfo.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {requirementInfo.lines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-secondary">*</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-dark">Informations personnelles</h2>
                  <p className="mt-3 text-slate-600">
                    Renseignez les informations du candidat et joignez une photo d'identite.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Prenom*</span>
                    <input {...register("firstName")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.firstName?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Nom*</span>
                    <input {...register("lastName")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.lastName?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Date de naissance*</span>
                    <input type="date" {...register("dateOfBirth")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.dateOfBirth?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Lieu de naissance*</span>
                    <input {...register("placeOfBirth")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.placeOfBirth?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Nationalite*</span>
                    <select {...register("nationality")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary">
                      {memberCountries.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.nationality?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Pays de residence*</span>
                    <input {...register("residenceCountry")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.residenceCountry?.message} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-dark">Adresse complete*</span>
                    <textarea rows={3} {...register("address")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.address?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Telephone*</span>
                    <input {...register("phone")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.phone?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">WhatsApp</span>
                    <input {...register("whatsapp")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.whatsapp?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Email*</span>
                    <input type="email" {...register("email")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.email?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Confirmation email*</span>
                    <input type="email" {...register("confirmEmail")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.confirmEmail?.message} />
                  </label>
                </div>

                <div className="rounded-3xl border border-dashed border-secondary/40 p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400">
                      {photoPreviewUrl ? (
                        <img src={photoPreviewUrl} alt="Apercu de la photo" className="h-full w-full object-cover" />
                      ) : (
                        <Upload size={28} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-dark">Photo d'identite*</p>
                      <p className="mt-2 text-sm text-slate-500">Formats JPG ou PNG - taille maximale 2 Mo.</p>
                      <input
                        type="file"
                        accept={PHOTO_EXTENSIONS.join(",")}
                        className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-white"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          setValue("photo", file, { shouldDirty: true, shouldValidate: true });
                          clearErrors("photo");
                        }}
                      />
                      <FieldError message={errors.photo?.message as string | undefined} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-dark">Dossier academique</h2>
                  <p className="mt-3 text-slate-600">
                    Ajoutez votre parcours, les pieces obligatoires et les documents complementaires.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Diplome le plus eleve*</span>
                    <select {...register("highestDegree")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary">
                      <option value="">Choisir un niveau</option>
                      {degreeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.highestDegree?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Annee d'obtention*</span>
                    <input {...register("graduationYear")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.graduationYear?.message} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-dark">Etablissement d'obtention*</span>
                    <input {...register("institutionName")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.institutionName?.message} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Pays d'obtention*</span>
                    <input {...register("diplomaCountry")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.diplomaCountry?.message} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-dark">Experience professionnelle</span>
                    <textarea rows={4} {...register("professionalExperience")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.professionalExperience?.message} />
                  </label>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {[
                    {
                      label: "Releve de notes*",
                      accept: DOCUMENT_EXTENSIONS.join(","),
                      field: "transcriptFile" as const,
                      value: watchedValues.transcriptFile,
                    },
                    {
                      label: "Diplome ou attestation*",
                      accept: DOCUMENT_EXTENSIONS.join(","),
                      field: "diplomaFile" as const,
                      value: watchedValues.diplomaFile,
                    },
                    {
                      label: "Lettre de motivation (PDF)",
                      accept: DOCUMENT_EXTENSIONS.join(","),
                      field: "motivationFile" as const,
                      value: watchedValues.motivationFile,
                    },
                  ].map((item) => (
                    <div key={item.field} className="rounded-3xl border border-dashed border-secondary/35 p-5">
                      <p className="text-sm font-semibold text-dark">{item.label}</p>
                      <p className="mt-2 text-sm text-slate-500">Format PDF - taille maximale 5 Mo.</p>
                      <input
                        type="file"
                        accept={item.accept}
                        className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-white"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          setValue(item.field, file, { shouldDirty: true, shouldValidate: true });
                          clearErrors(item.field);
                        }}
                      />
                      {item.value ? (
                        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span>{item.value.name}</span>
                          <button
                            type="button"
                            className="text-red-500"
                            onClick={() => setValue(item.field, undefined, { shouldDirty: true, shouldValidate: true })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                      <FieldError message={errors[item.field]?.message as string | undefined} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Texte de motivation</span>
                    <textarea rows={5} {...register("motivationText")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-secondary" />
                    <FieldError message={errors.motivationText?.message} />
                  </label>
                </div>

                <div className="rounded-3xl border border-dashed border-secondary/35 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-dark">Documents supplementaires</p>
                      <p className="mt-2 text-sm text-slate-500">Jusqu'a 5 fichiers additionnels: PDF, DOC, DOCX, JPG ou PNG.</p>
                    </div>
                    <label className="inline-flex cursor-pointer rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white">
                      Ajouter
                      <input
                        type="file"
                        multiple
                        accept={ADDITIONAL_DOCUMENT_EXTENSIONS.join(",")}
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          setValue(
                            "additionalDocuments",
                            [...watchedValues.additionalDocuments, ...files].slice(0, 5),
                            { shouldDirty: true, shouldValidate: true },
                          );
                          clearErrors("additionalDocuments");
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {watchedValues.additionalDocuments.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {watchedValues.additionalDocuments.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="text-red-500"
                            onClick={() =>
                              setValue(
                                "additionalDocuments",
                                watchedValues.additionalDocuments.filter((_, currentIndex) => currentIndex !== index),
                                { shouldDirty: true, shouldValidate: true },
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <FieldError
                    message={
                      (errors.additionalDocuments?.message as string | undefined) ||
                      (errors.additionalDocuments?.root?.message as string | undefined)
                    }
                  />
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-dark">Recapitulatif avant soumission</h2>
                  <p className="mt-3 text-slate-600">
                    Verifiez vos informations avant d'envoyer definitivement votre candidature.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 p-6">
                  <h3 className="font-display text-2xl font-semibold text-dark">Formation choisie</h3>
                  <div className="mt-4">
                    <SummaryRow
                      label="Formation"
                      value={selectedFormation ? `${selectedFormation.code} - ${selectedFormation.name}` : ""}
                    />
                    <SummaryRow label="Niveau" value={selectedFormation?.level} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-6">
                  <h3 className="font-display text-2xl font-semibold text-dark">Informations personnelles</h3>
                  <div className="mt-4">
                    <SummaryRow label="Nom complet" value={`${watchedValues.firstName} ${watchedValues.lastName}`} />
                    <SummaryRow label="Date de naissance" value={watchedValues.dateOfBirth} />
                    <SummaryRow label="Lieu de naissance" value={watchedValues.placeOfBirth} />
                    <SummaryRow label="Nationalite" value={memberCountries.find((item) => item.value === watchedValues.nationality)?.label || watchedValues.nationality} />
                    <SummaryRow label="Residence" value={watchedValues.residenceCountry} />
                    <SummaryRow label="Telephone" value={watchedValues.phone} />
                    <SummaryRow label="Email" value={watchedValues.email} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-6">
                  <h3 className="font-display text-2xl font-semibold text-dark">Dossier academique</h3>
                  <div className="mt-4">
                    <SummaryRow
                      label="Diplome"
                      value={degreeOptions.find((option) => option.value === watchedValues.highestDegree)?.label || watchedValues.highestDegree}
                    />
                    <SummaryRow label="Etablissement" value={watchedValues.institutionName} />
                    <SummaryRow label="Annee d'obtention" value={watchedValues.graduationYear} />
                    <SummaryRow label="Pays d'obtention" value={watchedValues.diplomaCountry} />
                    <SummaryRow label="Releve de notes" value={watchedValues.transcriptFile?.name} />
                    <SummaryRow label="Diplome/Attestation" value={watchedValues.diplomaFile?.name} />
                    <SummaryRow label="Lettre de motivation" value={watchedValues.motivationFile?.name || (watchedValues.motivationText ? "Texte saisi dans le formulaire" : "")} />
                    <SummaryRow
                      label="Documents supplementaires"
                      value={
                        watchedValues.additionalDocuments.length > 0
                          ? watchedValues.additionalDocuments.map((file) => file.name).join(", ")
                          : "Aucun"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-3xl bg-primary/20 p-6">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 text-dark" size={22} />
                    <div>
                      <p className="font-semibold text-dark">Avant l'envoi final</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Les frais de dossier et les prochaines etapes vous seront communiques par l'administration apres reception et examen du dossier.
                        Contact: {site?.emailContact || "contact@emsp.int"}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" {...register("accuracyCertified")} className="mt-1 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary" />
                    <span className="text-sm text-slate-700">Je certifie l'exactitude des informations fournies.</span>
                  </label>
                  <FieldError message={errors.accuracyCertified?.message} />

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" {...register("termsAccepted")} className="mt-1 h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary" />
                    <span className="text-sm text-slate-700">J'accepte les conditions d'admission de l'EMSP.</span>
                  </label>
                  <FieldError message={errors.termsAccepted?.message} />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-6">
              <div>
                {currentStep > 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-5 py-3 font-semibold text-slate-600"
                    onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                  >
                    <ChevronLeft size={16} />
                    Retour
                  </button>
                ) : null}
              </div>

              {currentStep < inscriptionStepTitles.length - 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-3 font-semibold text-white"
                  onClick={handleStepForward}
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={mutation.isPending || isSubmitting}
                  className="rounded-md bg-primary px-6 py-3 font-semibold text-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending || isSubmitting ? "Soumission en cours..." : "Soumettre ma candidature"}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Besoin d'aide ? Ecrivez a <Link to="/contact" className="font-semibold text-secondary">l'equipe EMSP</Link>.
          </div>
        </div>
      </section>
    </div>
  );
};

export default InscriptionPage;
