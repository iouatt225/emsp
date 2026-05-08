import axiosInstance from "./axiosConfig";
import type {
  AdminAcademicOverviewData,
  AdminDashboardData,
  AdminLegacyStudentPayload,
  AdminPortalStudentPayload,
  AdminStudentsData,
  AdminStudentOptionsData,
  AdminTeacher,
  EtudiantProfile,
  ForumDiscussion,
  NotesSemesterGroup,
  PaymentInitiationPayload,
  ScheduleItem,
  StudentDashboardData,
  StudentDocumentItem,
  StudentForumPayload,
  StudentPaymentsData,
} from "../types";

interface RawEtudiantProfile {
  id: number;
  matricule: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: EtudiantProfile["user"]["role"];
    phone?: string;
    avatar_url?: string;
  };
  formation_name: string;
  formation_code: string;
  promotion?: {
    id: number;
    label: string;
    year_start: number;
    year_end: number;
    academic_year: string;
  };
  pays: string;
  photo?: {
    id: number;
    title: string;
    url: string;
    type: "image" | "video" | "document";
    category: string;
    created_at: string;
    alt_text?: string;
    description?: string;
  };
  rang_promotion: number;
  solde_scolarite: string;
}

interface RawScheduleItem {
  id: number;
  matiere: string;
  enseignant: string;
  salle: string;
  type: ScheduleItem["type"];
  debut: string;
  fin: string;
  color: string;
}

interface RawStudentDashboard {
  moyenne_generale: number | string;
  rang_promotion: number;
  prochain_examen: string;
  solde_scolarite: string;
  trend: Array<{ label: string; average: number | string }>;
  prochains_cours: RawScheduleItem[];
  actualites: Array<{
    id: number;
    titre: string;
    slug?: string;
    extrait: string;
    category?: string;
    publie_le: string;
    cover?: {
      id: number;
      title: string;
      url: string;
      type: "image" | "video" | "document";
      category: string;
      created_at: string;
      alt_text?: string;
    };
    tags: Array<{ nom: string }>;
  }>;
}

interface RawNoteRow {
  id: number;
  matiere: string;
  coefficient: number | string;
  credits: number;
  note: number | string;
  semestre: string;
  annee_academique: string;
  mention: string;
  validation: boolean;
  moyenne_promotion?: number | string;
}

interface RawNotesGroup {
  key: string;
  label: string;
  semester: string;
  academic_year: string;
  rows: RawNoteRow[];
  totals: {
    average: number | string;
    credits: number;
    result: string;
  };
  download_url: string;
}

interface RawDocument {
  id: number;
  title: string;
  type_document: string;
  semester?: string;
  academic_year?: string;
  is_generated: boolean;
  generated_at?: string;
  download_url?: string;
}

interface RawForumPayload {
  categories: Array<{ key: string; label: string; count: number }>;
  discussions: Array<{
    id: number;
    category: string;
    title: string;
    content: string;
    author_name: string;
    replies_count: number;
    created_at: string;
  }>;
}

interface RawPaymentsPayload {
  amount_due: string;
  amount_paid: string;
  remaining_balance: string;
  transactions: Array<{
    id: number;
    student_name: string;
    matricule: string;
    montant: string | number;
    operateur: "orange" | "mtn" | "moov" | "wave";
    phone_number: string;
    reference: string;
    statut: "pending" | "confirmed" | "failed" | "refunded";
    description: string;
    created_at: string;
    confirmed_at?: string;
  }>;
}

interface RawAdminDashboard {
  kpis: {
    total_students: number;
    recovery_rate: number;
    success_rate: number;
    pending_applications: number;
  };
  country_distribution: Array<{ pays: string; total: number }>;
  formation_distribution: Array<{ formation__nom: string; total: number }>;
  yearly_enrolments: Array<{ year: string; total: number }>;
  monthly_finance: Array<{ label: string; paid: number; due: number }>;
  latest_inscriptions: Array<{
    id: number;
    name: string;
    country: string;
    formation: string;
    date: string;
    status: string;
    matricule: string;
    photo_url?: string;
  }>;
}

interface RawAdminStudentsResponse {
  dataset_mode: "portal" | "legacy";
  summary: {
    total: number;
    active: number;
    inactive: number;
    promotions: number;
    outstanding_balance: number;
  };
  results: Array<{
    id: number;
    matricule: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    email: string;
    phone?: string;
    formation_id?: number;
    formation_name: string;
    formation_code: string;
    promotion_id?: number | null;
    promotion_label: string;
    academic_year: string;
    country: string;
    country_label: string;
    date_naissance?: string | null;
    lieu_naissance?: string;
    rank: number;
    balance: number;
    balance_label: string;
    is_active: boolean;
    status_label: string;
    enrolled_at: string;
    photo_url?: string;
    gender?: string;
    gender_label?: string;
    age?: number | null;
    hobbies?: string;
    source?: "django_portal" | "emsp_legacy";
  }>;
}

interface RawAdminStudentOptionsResponse {
  formations: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  promotions: Array<{
    id: number;
    label: string;
    academic_year: string;
    formation_id: number;
    formation_code: string;
  }>;
  countries: Array<{
    value: string;
    label: string;
  }>;
}

interface RawAdminAcademicOverview {
  summary: {
    promotions: number;
    scheduled_courses: number;
    generated_documents: number;
    average_score: number;
  };
  promotions: Array<{
    id: number;
    label: string;
    academic_year: string;
    formation_name: string;
    formation_code: string;
    students_count: number;
  }>;
  upcoming_courses: Array<{
    id: number;
    matiere: string;
    enseignant: string;
    salle: string;
    type: ScheduleItem["type"];
    debut: string;
    fin: string;
    promotion_label: string;
    formation_name: string;
  }>;
  recent_documents: Array<{
    id: number;
    title: string;
    type_document: string;
    semester?: string;
    academic_year?: string;
    is_generated: boolean;
    generated_at?: string;
    student_name: string;
    matricule: string;
    promotion_label: string;
  }>;
  top_students: Array<{
    id: number;
    full_name: string;
    matricule: string;
    formation_name: string;
    promotion_label: string;
    rank: number;
    average: number;
  }>;
}

interface RawAdminTeacher {
  id: number;
  full_name: string;
  specialite: string;
  email: string;
  phone: string;
  statut: AdminTeacher["statut"];
  disponibilite: string;
  is_active: boolean;
  created_at: string;
}

const mapUser = (user: RawEtudiantProfile["user"]) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
  phone: user.phone,
  avatarUrl: user.avatar_url,
});

const mapMedia = (item?: RawEtudiantProfile["photo"]) =>
  item
    ? {
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type,
        category: item.category,
        createdAt: item.created_at,
        altText: item.alt_text,
        description: item.description,
      }
    : undefined;

const fetchEtudiantProfileFromRaw = (data: RawEtudiantProfile): EtudiantProfile => ({
  id: data.id,
  matricule: data.matricule,
  user: mapUser(data.user),
  formationName: data.formation_name,
  formationCode: data.formation_code,
  promotion: data.promotion
    ? {
        id: data.promotion.id,
        label: data.promotion.label,
        yearStart: data.promotion.year_start,
        yearEnd: data.promotion.year_end,
        academicYear: data.promotion.academic_year,
      }
    : undefined,
  pays: data.pays,
  photo: mapMedia(data.photo),
  rangPromotion: data.rang_promotion,
  soldeScolarite: data.solde_scolarite,
});

export async function fetchEtudiantProfile() {
  const response = await axiosInstance.get<RawEtudiantProfile>("/scolarite/me/");
  return fetchEtudiantProfileFromRaw(response.data);
}

export async function fetchStudentDashboard() {
  const response = await axiosInstance.get<RawStudentDashboard>("/scolarite/me/dashboard/");
  return {
    moyenneGenerale: Number(response.data.moyenne_generale),
    rangPromotion: response.data.rang_promotion,
    prochainExamen: response.data.prochain_examen,
    soldeScolarite: response.data.solde_scolarite,
    trend: response.data.trend.map((item) => ({
      label: item.label,
      average: Number(item.average),
    })),
    prochainsCours: response.data.prochains_cours.map((item) => ({
      id: item.id,
      matiere: item.matiere,
      enseignant: item.enseignant,
      salle: item.salle,
      type: item.type,
      debut: item.debut,
      fin: item.fin,
      color: item.color,
    })),
    actualites: response.data.actualites.map((item) => ({
      id: item.id,
      title: item.titre,
      slug: item.slug,
      excerpt: item.extrait,
      content: item.extrait,
      coverImage: item.cover
        ? {
            id: item.cover.id,
            title: item.cover.title,
            url: item.cover.url,
            type: item.cover.type,
            category: item.cover.category,
            createdAt: item.cover.created_at,
            altText: item.cover.alt_text,
          }
        : undefined,
      publishedAt: item.publie_le,
      tags: item.tags.map((tag) => tag.nom),
      category: item.category,
    })),
  } satisfies StudentDashboardData;
}

export async function fetchStudentNotes() {
  const response = await axiosInstance.get<RawNotesGroup[]>("/scolarite/me/notes/");
  return response.data.map(
    (group) =>
      ({
        key: group.key,
        label: group.label,
        semester: group.semester,
        academicYear: group.academic_year,
        rows: group.rows.map((row) => ({
          id: row.id,
          matiere: row.matiere,
          coefficient: Number(row.coefficient),
          credits: row.credits,
          note: Number(row.note),
          semestre: row.semestre,
          anneeAcademique: row.annee_academique,
          mention: row.mention,
          validation: row.validation,
          moyennePromotion: row.moyenne_promotion === undefined ? undefined : Number(row.moyenne_promotion),
        })),
        totals: {
          average: Number(group.totals.average),
          credits: group.totals.credits,
          result: group.totals.result,
        },
        downloadUrl: group.download_url,
      }) satisfies NotesSemesterGroup,
  );
}

export async function fetchStudentSchedule(limit?: number) {
  const response = await axiosInstance.get<RawScheduleItem[]>("/scolarite/me/edt/", {
    params: limit ? { limit } : undefined,
  });
  return response.data.map(
    (item) =>
      ({
        id: item.id,
        matiere: item.matiere,
        enseignant: item.enseignant,
        salle: item.salle,
        type: item.type,
        debut: item.debut,
        fin: item.fin,
        color: item.color,
      }) satisfies ScheduleItem,
  );
}

export async function fetchStudentDocuments() {
  const response = await axiosInstance.get<RawDocument[]>("/scolarite/me/documents/");
  return response.data.map(
    (item) =>
      ({
        id: item.id,
        title: item.title,
        typeDocument: item.type_document,
        semester: item.semester,
        academicYear: item.academic_year,
        isGenerated: item.is_generated,
        generatedAt: item.generated_at,
        downloadUrl: item.download_url,
      }) satisfies StudentDocumentItem,
  );
}

export async function fetchStudentForum() {
  const response = await axiosInstance.get<RawForumPayload>("/scolarite/me/forum/");
  return {
    categories: response.data.categories,
    discussions: response.data.discussions.map(
      (item) =>
        ({
          id: item.id,
          category: item.category,
          title: item.title,
          content: item.content,
          authorName: item.author_name,
          repliesCount: item.replies_count,
          createdAt: item.created_at,
        }) satisfies ForumDiscussion,
    ),
  } satisfies StudentForumPayload;
}

export async function createForumPost(payload: { category: string; title: string; content: string }) {
  await axiosInstance.post("/scolarite/me/forum/", payload);
}

export async function fetchStudentPayments() {
  const response = await axiosInstance.get<RawPaymentsPayload>("/comptabilite/me/");
  return {
    amountDue: response.data.amount_due,
    amountPaid: response.data.amount_paid,
    remainingBalance: response.data.remaining_balance,
    transactions: response.data.transactions.map((item) => ({
      id: item.id,
      studentName: item.student_name,
      matricule: item.matricule,
      montant: Number(item.montant),
      operateur: item.operateur,
      phoneNumber: item.phone_number,
      reference: item.reference,
      statut: item.statut,
      description: item.description,
      createdAt: item.created_at,
      confirmedAt: item.confirmed_at,
    })),
  } satisfies StudentPaymentsData;
}

export async function initiateStudentPayment(payload: PaymentInitiationPayload) {
  const response = await axiosInstance.post("/comptabilite/payments/initiate/", payload);
  return response.data;
}

export async function downloadAuthenticatedBlob(url: string) {
  const response = await axiosInstance.get<Blob>(url, { responseType: "blob" });
  return response.data;
}

export async function updateEtudiantProfile(payload: { firstName: string; lastName: string; phone?: string; pays?: string }) {
  const response = await axiosInstance.patch<RawEtudiantProfile>("/scolarite/me/", {
    first_name: payload.firstName,
    last_name: payload.lastName,
    phone: payload.phone || "",
    pays: payload.pays || "",
  });
  return fetchEtudiantProfileFromRaw(response.data);
}

export async function uploadEtudiantPhoto(file: File) {
  const formData = new FormData();
  formData.append("photo", file);
  const response = await axiosInstance.post<RawEtudiantProfile>("/scolarite/me/photo/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return fetchEtudiantProfileFromRaw(response.data);
}

export async function changeEtudiantPassword(payload: { currentPassword: string; newPassword: string }) {
  await axiosInstance.post("/auth/change-password/", {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  });
}

export async function fetchAdminDashboard() {
  const response = await axiosInstance.get<RawAdminDashboard>("/scolarite/dashboard/");
  return {
    kpis: {
      totalStudents: response.data.kpis.total_students,
      recoveryRate: response.data.kpis.recovery_rate,
      successRate: response.data.kpis.success_rate,
      pendingApplications: response.data.kpis.pending_applications,
    },
    countryDistribution: response.data.country_distribution,
    formationDistribution: response.data.formation_distribution.map((item) => ({
      formationName: item["formation__nom"],
      total: item.total,
    })),
    yearlyEnrolments: response.data.yearly_enrolments,
    monthlyFinance: response.data.monthly_finance,
    latestInscriptions: response.data.latest_inscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country,
      formation: item.formation,
      date: item.date,
      status: item.status,
      matricule: item.matricule,
      photoUrl: item.photo_url,
    })),
  } satisfies AdminDashboardData;
}

export async function fetchAdminStudents(params?: {
  search?: string;
  status?: "active" | "inactive";
  country?: string;
  formation?: string;
}) {
  const response = await axiosInstance.get<RawAdminStudentsResponse>("/scolarite/admin/etudiants/", {
    params,
  });
  return {
    datasetMode: response.data.dataset_mode,
    summary: {
      total: response.data.summary.total,
      active: response.data.summary.active,
      inactive: response.data.summary.inactive,
      promotions: response.data.summary.promotions,
      outstandingBalance: response.data.summary.outstanding_balance,
    },
    results: response.data.results.map((item) => ({
      id: item.id,
      matricule: item.matricule,
      firstName: item.first_name,
      lastName: item.last_name,
      fullName: item.full_name,
      email: item.email,
      phone: item.phone,
      formationId: item.formation_id,
      formationName: item.formation_name,
      formationCode: item.formation_code,
      promotionId: item.promotion_id,
      promotionLabel: item.promotion_label,
      academicYear: item.academic_year,
      country: item.country,
      countryLabel: item.country_label,
      dateNaissance: item.date_naissance,
      lieuNaissance: item.lieu_naissance,
      rank: item.rank,
      balance: item.balance,
      balanceLabel: item.balance_label,
      isActive: item.is_active,
      statusLabel: item.status_label,
      enrolledAt: item.enrolled_at,
      photoUrl: item.photo_url,
      gender: item.gender,
      genderLabel: item.gender_label,
      age: item.age,
      hobbies: item.hobbies,
      source: item.source,
    })),
  } satisfies AdminStudentsData;
}

export async function fetchAdminStudentOptions() {
  const response = await axiosInstance.get<RawAdminStudentOptionsResponse>("/scolarite/admin/etudiants/options/");
  return {
    formations: response.data.formations.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
    })),
    promotions: response.data.promotions.map((item) => ({
      id: item.id,
      label: item.label,
      academicYear: item.academic_year,
      formationId: item.formation_id,
      formationCode: item.formation_code,
    })),
    countries: response.data.countries,
  } satisfies AdminStudentOptionsData;
}

export async function createAdminStudent(payload: AdminLegacyStudentPayload | AdminPortalStudentPayload) {
  const response = await axiosInstance.post("/scolarite/admin/etudiants/", {
    matricule: payload.matricule,
    ...(Object.prototype.hasOwnProperty.call(payload, "fullName")
      ? {
          full_name: (payload as AdminLegacyStudentPayload).fullName,
          gender: (payload as AdminLegacyStudentPayload).gender,
          age: (payload as AdminLegacyStudentPayload).age,
          phone: (payload as AdminLegacyStudentPayload).phone,
          hobbies: (payload as AdminLegacyStudentPayload).hobbies,
        }
      : {
          first_name: (payload as AdminPortalStudentPayload).firstName,
          last_name: (payload as AdminPortalStudentPayload).lastName,
          email: (payload as AdminPortalStudentPayload).email,
          phone: (payload as AdminPortalStudentPayload).phone,
          formation_id: (payload as AdminPortalStudentPayload).formationId,
          promotion_id: (payload as AdminPortalStudentPayload).promotionId || null,
          pays: (payload as AdminPortalStudentPayload).pays,
          date_naissance: (payload as AdminPortalStudentPayload).dateNaissance || null,
          lieu_naissance: (payload as AdminPortalStudentPayload).lieuNaissance || "",
          rang_promotion: (payload as AdminPortalStudentPayload).rangPromotion,
          solde_scolarite: (payload as AdminPortalStudentPayload).soldeScolarite,
          is_active: (payload as AdminPortalStudentPayload).isActive,
          password: (payload as AdminPortalStudentPayload).password || undefined,
        }),
  });
  return response.data;
}

export async function updateAdminLegacyStudent(matricule: string, payload: AdminLegacyStudentPayload) {
  const response = await axiosInstance.patch(`/scolarite/admin/etudiants/legacy/${encodeURIComponent(matricule)}/`, {
    matricule: payload.matricule,
    full_name: payload.fullName,
    gender: payload.gender,
    age: payload.age,
    phone: payload.phone,
    hobbies: payload.hobbies,
  });
  return response.data;
}

export async function updateAdminPortalStudent(id: number, payload: AdminPortalStudentPayload) {
  const response = await axiosInstance.patch(`/scolarite/admin/etudiants/${id}/`, {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    matricule: payload.matricule,
    formation_id: payload.formationId,
    promotion_id: payload.promotionId || null,
    pays: payload.pays,
    date_naissance: payload.dateNaissance || null,
    lieu_naissance: payload.lieuNaissance || "",
    rang_promotion: payload.rangPromotion,
    solde_scolarite: payload.soldeScolarite,
    is_active: payload.isActive,
    password: payload.password || undefined,
  });
  return response.data;
}

export async function fetchAdminAcademicOverview() {
  const response = await axiosInstance.get<RawAdminAcademicOverview>("/scolarite/admin/scolarite/");
  return {
    summary: {
      promotions: response.data.summary.promotions,
      scheduledCourses: response.data.summary.scheduled_courses,
      generatedDocuments: response.data.summary.generated_documents,
      averageScore: response.data.summary.average_score,
    },
    promotions: response.data.promotions.map((item) => ({
      id: item.id,
      label: item.label,
      academicYear: item.academic_year,
      formationName: item.formation_name,
      formationCode: item.formation_code,
      studentsCount: item.students_count,
    })),
    upcomingCourses: response.data.upcoming_courses.map((item) => ({
      id: item.id,
      matiere: item.matiere,
      enseignant: item.enseignant,
      salle: item.salle,
      type: item.type,
      debut: item.debut,
      fin: item.fin,
      promotionLabel: item.promotion_label,
      formationName: item.formation_name,
    })),
    recentDocuments: response.data.recent_documents.map((item) => ({
      id: item.id,
      title: item.title,
      typeDocument: item.type_document,
      semester: item.semester,
      academicYear: item.academic_year,
      isGenerated: item.is_generated,
      generatedAt: item.generated_at,
      studentName: item.student_name,
      matricule: item.matricule,
      promotionLabel: item.promotion_label,
    })),
    topStudents: response.data.top_students.map((item) => ({
      id: item.id,
      fullName: item.full_name,
      matricule: item.matricule,
      formationName: item.formation_name,
      promotionLabel: item.promotion_label,
      rank: item.rank,
      average: item.average,
    })),
  } satisfies AdminAcademicOverviewData;
}

export async function fetchAdminTeachers() {
  const response = await axiosInstance.get<RawAdminTeacher[]>("/scolarite/admin/enseignants/");
  return response.data.map(
    (item) =>
      ({
        id: item.id,
        fullName: item.full_name,
        specialite: item.specialite,
        email: item.email,
        phone: item.phone,
        statut: item.statut,
        disponibilite: item.disponibilite,
        isActive: item.is_active,
        createdAt: item.created_at,
      }) satisfies AdminTeacher,
  );
}

export async function createAdminTeacher(payload: {
  fullName: string;
  specialite?: string;
  email?: string;
  phone?: string;
  statut?: AdminTeacher["statut"];
  disponibilite?: string;
  isActive?: boolean;
}) {
  const response = await axiosInstance.post<RawAdminTeacher>("/scolarite/admin/enseignants/", {
    full_name: payload.fullName,
    specialite: payload.specialite || "",
    email: payload.email || "",
    phone: payload.phone || "",
    statut: payload.statut || "disponible",
    disponibilite: payload.disponibilite || "",
    is_active: payload.isActive ?? true,
  });
  return {
    id: response.data.id,
    fullName: response.data.full_name,
    specialite: response.data.specialite,
    email: response.data.email,
    phone: response.data.phone,
    statut: response.data.statut,
    disponibilite: response.data.disponibilite,
    isActive: response.data.is_active,
    createdAt: response.data.created_at,
  } satisfies AdminTeacher;
}

export async function deleteAdminTeacher(id: number) {
  await axiosInstance.delete(`/scolarite/admin/enseignants/${id}/`);
}
