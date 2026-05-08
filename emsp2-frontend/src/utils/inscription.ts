import type { Formation, InscriptionFormData } from "../types";

export const memberCountries = [
  { value: "BJ", label: "Benin" },
  { value: "BF", label: "Burkina Faso" },
  { value: "CI", label: "Cote d'Ivoire" },
  { value: "ML", label: "Mali" },
  { value: "MR", label: "Mauritanie" },
  { value: "NE", label: "Niger" },
  { value: "SN", label: "Senegal" },
  { value: "TG", label: "Togo" },
  { value: "OTHER", label: "Autre" },
] as const;

export const degreeOptions = [
  { value: "BAC", label: "Bac" },
  { value: "BAC_1", label: "Bac+1" },
  { value: "BAC_2", label: "Bac+2" },
  { value: "BTS_DUT", label: "BTS / DUT" },
  { value: "LICENCE", label: "Licence" },
  { value: "MASTER", label: "Master" },
  { value: "DOCTORAT", label: "Doctorat" },
  { value: "OTHER", label: "Autre" },
] as const;

export const inscriptionStepTitles = [
  "Choix de la formation",
  "Informations personnelles",
  "Dossier academique",
  "Recapitulatif",
] as const;

export const inscriptionDefaultValues: InscriptionFormData = {
  formationId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  nationality: "CI",
  residenceCountry: "Cote d'Ivoire",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  confirmEmail: "",
  photo: undefined,
  highestDegree: "",
  institutionName: "",
  graduationYear: "",
  diplomaCountry: "Cote d'Ivoire",
  transcriptFile: undefined,
  diplomaFile: undefined,
  motivationFile: undefined,
  professionalExperience: "",
  motivationText: "",
  additionalDocuments: [],
  accuracyCertified: false,
  termsAccepted: false,
};

export function getFormationRequirement(formation?: Formation) {
  if (!formation) {
    return {
      title: "Pre-requis de la formation",
      lines: ["Selectionnez une formation pour afficher les conditions d'admission."],
    };
  }

  const code = formation.code.toUpperCase();

  if (code === "ADM") {
    return {
      title: "Conditions d'admission ADM",
      lines: ["Diplome minimal: Bac+2", "Profil vise: cadres superieurs des Postes", "Debouches: direction, ministeres, UPU, UPAP"],
    };
  }
  if (code === "INP") {
    return {
      title: "Conditions d'admission INP",
      lines: ["Diplome minimal: Bac+1", "Profil vise: cadres moyens et supervision postale", "Duree indicative: 1 an"],
    };
  }
  if (code === "CTR") {
    return {
      title: "Conditions d'admission CTR",
      lines: ["Diplome minimal: Bac", "Orientation: operations postales et guichets", "Duree indicative: 6 mois"],
    };
  }
  if (formation.programType === "FS-MENUM" && formation.level === "Licence") {
    return {
      title: "Conditions d'admission Licence FS-MENUM",
      lines: ["Acces apres bac, bts ou equivalent", "Orientation vers les metiers du numerique", `Duree: ${formation.duration}`],
    };
  }
  if (formation.programType === "FS-MENUM" && formation.level === "Master") {
    return {
      title: "Conditions d'admission Master FS-MENUM",
      lines: ["Acces apres une licence ou equivalent", "Orientation cadres et experts du numerique", `Duree: ${formation.duration}`],
    };
  }

  return {
    title: "Conditions d'admission FCQ",
    lines: ["Formation continue ouverte selon les sessions publiees", "Public vise: professionnels en activite", `Duree: ${formation.duration}`],
  };
}

export function groupFormationsByProgram(formations: Formation[]) {
  return formations.reduce<Record<Formation["programType"], Formation[]>>(
    (groups, formation) => {
      groups[formation.programType].push(formation);
      return groups;
    },
    { FSP: [], "FS-MENUM": [], FCQ: [] },
  );
}

export function serializeInscriptionDraft(values: InscriptionFormData) {
  return JSON.stringify({
    formationId: values.formationId,
    firstName: values.firstName,
    lastName: values.lastName,
    dateOfBirth: values.dateOfBirth,
    placeOfBirth: values.placeOfBirth,
    nationality: values.nationality,
    residenceCountry: values.residenceCountry,
    address: values.address,
    phone: values.phone,
    whatsapp: values.whatsapp,
    email: values.email,
    confirmEmail: values.confirmEmail,
    highestDegree: values.highestDegree,
    institutionName: values.institutionName,
    graduationYear: values.graduationYear,
    diplomaCountry: values.diplomaCountry,
    professionalExperience: values.professionalExperience,
    motivationText: values.motivationText,
    accuracyCertified: values.accuracyCertified,
    termsAccepted: values.termsAccepted,
  });
}
