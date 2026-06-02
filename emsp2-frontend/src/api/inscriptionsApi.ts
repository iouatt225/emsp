import axiosInstance from "./axiosConfig";
import type {
  AdminApplicationDetail,
  AdminApplicationsData,
  InscriptionFormData,
  InscriptionSubmissionResponse,
} from "../types";

function appendIfPresent(formData: FormData, key: string, value?: File | string) {
  if (value === undefined || value === "") {
    return;
  }
  formData.append(key, value);
}

export async function submitInscription(payload: InscriptionFormData) {
  const formData = new FormData();

  formData.append("formation", payload.formationId);
  formData.append("first_name", payload.firstName);
  formData.append("last_name", payload.lastName);
  formData.append("date_of_birth", payload.dateOfBirth);
  formData.append("place_of_birth", payload.placeOfBirth);
  formData.append("nationality", payload.nationality);
  formData.append("residence_country", payload.residenceCountry);
  formData.append("address", payload.address);
  formData.append("phone", payload.phone);
  appendIfPresent(formData, "whatsapp", payload.whatsapp);
  formData.append("email", payload.email);
  formData.append("confirm_email", payload.confirmEmail);
  if (payload.photo) {
    formData.append("photo", payload.photo);
  }
  formData.append("highest_degree", payload.highestDegree);
  formData.append("institution_name", payload.institutionName);
  formData.append("graduation_year", payload.graduationYear);
  formData.append("diploma_country", payload.diplomaCountry);
  if (payload.transcriptFile) {
    formData.append("transcript_file", payload.transcriptFile);
  }
  if (payload.diplomaFile) {
    formData.append("diploma_file", payload.diplomaFile);
  }
  appendIfPresent(formData, "professional_experience", payload.professionalExperience);
  appendIfPresent(formData, "motivation_text", payload.motivationText);
  if (payload.motivationFile) {
    formData.append("motivation_file", payload.motivationFile);
  }
  payload.additionalDocuments.forEach((document) => {
    formData.append("additional_documents", document);
  });
  formData.append("accuracy_certified", String(payload.accuracyCertified));
  formData.append("terms_accepted", String(payload.termsAccepted));

  const response = await axiosInstance.post<InscriptionSubmissionResponse>(
    "/inscriptions/",
    formData,
  );

  return response.data;
}

interface RawAdminApplicationsResponse {
  summary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  results: Array<{
    id: number;
    dossier_number: string;
    status: "submitted" | "under_review" | "accepted" | "rejected";
    status_label: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    nationality: string;
    nationality_label: string;
    formation_name: string;
    formation_code: string;
    created_at: string;
    updated_at: string;
    acknowledgement_url: string;
  }>;
}

interface RawAdminApplicationDetail {
  id: number;
  dossier_number: string;
  status: "submitted" | "under_review" | "accepted" | "rejected";
  status_label: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  nationality_label: string;
  formation_name: string;
  formation_code: string;
  created_at: string;
  updated_at: string;
  acknowledgement_url: string;
  date_of_birth: string;
  place_of_birth: string;
  residence_country: string;
  address: string;
  whatsapp?: string;
  photo_url: string;
  highest_degree: string;
  highest_degree_label: string;
  institution_name: string;
  graduation_year: number;
  diploma_country: string;
  transcript_url: string;
  diploma_url: string;
  motivation_file_url: string;
  professional_experience?: string;
  motivation_text?: string;
  accuracy_certified: boolean;
  terms_accepted: boolean;
  additional_documents: Array<{
    id: number;
    original_name: string;
    created_at: string;
    url: string;
  }>;
}

const mapAdminApplication = (item: RawAdminApplicationsResponse["results"][number]) => ({
  id: item.id,
  dossierNumber: item.dossier_number,
  status: item.status,
  statusLabel: item.status_label,
  firstName: item.first_name,
  lastName: item.last_name,
  fullName: `${item.first_name} ${item.last_name}`.trim(),
  email: item.email,
  phone: item.phone,
  nationality: item.nationality,
  nationalityLabel: item.nationality_label,
  formationName: item.formation_name,
  formationCode: item.formation_code,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  acknowledgementUrl: item.acknowledgement_url,
});

export async function fetchAdminApplications(params?: {
  status?: "submitted" | "under_review" | "accepted" | "rejected";
  search?: string;
}) {
  const response = await axiosInstance.get<RawAdminApplicationsResponse>("/inscriptions/admin/candidatures/", {
    params,
  });

  return {
    summary: response.data.summary,
    results: response.data.results.map(mapAdminApplication),
  } satisfies AdminApplicationsData;
}

export async function fetchAdminApplicationDetail(id: number) {
  const response = await axiosInstance.get<RawAdminApplicationDetail>(`/inscriptions/admin/candidatures/${id}/`);
  const item = response.data;

  return {
    ...mapAdminApplication(item),
    dateOfBirth: item.date_of_birth,
    placeOfBirth: item.place_of_birth,
    residenceCountry: item.residence_country,
    address: item.address,
    whatsapp: item.whatsapp,
    photoUrl: item.photo_url,
    highestDegree: item.highest_degree,
    highestDegreeLabel: item.highest_degree_label,
    institutionName: item.institution_name,
    graduationYear: item.graduation_year,
    diplomaCountry: item.diploma_country,
    transcriptUrl: item.transcript_url,
    diplomaUrl: item.diploma_url,
    motivationFileUrl: item.motivation_file_url,
    professionalExperience: item.professional_experience,
    motivationText: item.motivation_text,
    accuracyCertified: item.accuracy_certified,
    termsAccepted: item.terms_accepted,
    additionalDocuments: item.additional_documents.map((document) => ({
      id: document.id,
      originalName: document.original_name,
      createdAt: document.created_at,
      url: document.url,
    })),
  } satisfies AdminApplicationDetail;
}

export async function updateAdminApplicationStatus(
  id: number,
  status: "submitted" | "under_review" | "accepted" | "rejected",
) {
  const response = await axiosInstance.patch<RawAdminApplicationDetail>(`/inscriptions/admin/candidatures/${id}/`, {
    status,
  });
  return response.data;
}
