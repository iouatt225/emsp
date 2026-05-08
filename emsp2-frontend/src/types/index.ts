export interface MediaItem {
  id: number;
  title: string;
  url: string;
  type: "image" | "video" | "document";
  category: string;
  createdAt: string;
  altText?: string;
  description?: string;
  videoType?: "upload" | "youtube";
  videoUrl?: string;
  fileName?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: MediaItem;
  publishedAt: string;
  tags: string[];
  category?: string;
  slug?: string;
}

export interface Formation {
  id: number;
  name: string;
  code: string;
  level: "FSP" | "Licence" | "Master" | "Certifiante";
  duration: string;
  description: string;
  coverImage?: MediaItem;
  type?: string;
  programType: "FSP" | "FS-MENUM" | "FCQ";
}

export interface User {
  id: number;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "etudiant" | "enseignant" | "staff" | "compta" | "admin" | "direction" | "chauffeur";
  phone?: string;
  avatarUrl?: string;
}

export interface Etudiant {
  id: number;
  matricule: string;
  user: User;
  filiere: Formation;
  promotion: string;
  pays: string;
  photo?: MediaItem;
}

export interface Promotion {
  id: number;
  label: string;
  yearStart: number;
  yearEnd: number;
  academicYear: string;
}

export interface EtudiantProfile {
  id: number;
  matricule: string;
  user: User;
  formationName: string;
  formationCode: string;
  promotion?: Promotion;
  pays: string;
  photo?: MediaItem;
  rangPromotion: number;
  soldeScolarite: string;
}

export interface ScheduleItem {
  id: number;
  matiere: string;
  enseignant: string;
  salle: string;
  type: "cours" | "td" | "examen" | "ferie";
  debut: string;
  fin: string;
  color: string;
}

export interface StudentDashboardData {
  moyenneGenerale: number;
  rangPromotion: number;
  prochainExamen: string;
  soldeScolarite: string;
  trend: Array<{ label: string; average: number }>;
  prochainsCours: ScheduleItem[];
  actualites: NewsItem[];
}

export interface NoteRow {
  id: number;
  matiere: string;
  coefficient: number;
  credits: number;
  note: number;
  semestre: string;
  anneeAcademique: string;
  mention: string;
  validation: boolean;
  moyennePromotion?: number;
}

export interface NotesSemesterGroup {
  key: string;
  label: string;
  semester: string;
  academicYear: string;
  rows: NoteRow[];
  totals: {
    average: number;
    credits: number;
    result: string;
  };
  downloadUrl: string;
}

export interface StudentDocumentItem {
  id: number;
  title: string;
  typeDocument: string;
  semester?: string;
  academicYear?: string;
  isGenerated: boolean;
  generatedAt?: string;
  downloadUrl?: string;
}

export interface ForumCategory {
  key: string;
  label: string;
  count: number;
}

export interface ForumDiscussion {
  id: number;
  category: string;
  title: string;
  content: string;
  authorName: string;
  repliesCount: number;
  createdAt: string;
}

export interface StudentForumPayload {
  categories: ForumCategory[];
  discussions: ForumDiscussion[];
}

export interface StudentPaymentsData {
  amountDue: string;
  amountPaid: string;
  remainingBalance: string;
  transactions: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: number;
  studentName: string;
  matricule: string;
  montant: number;
  operateur: "orange" | "mtn" | "moov" | "wave";
  phoneNumber: string;
  reference: string;
  statut: "pending" | "confirmed" | "failed" | "refunded";
  description: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface PaymentInitiationPayload {
  operateur: "orange" | "mtn" | "moov";
  phone: string;
  montant: number;
  description: string;
}

export interface AdminDashboardData {
  kpis: {
    totalStudents: number;
    recoveryRate: number;
    successRate: number;
    pendingApplications: number;
  };
  countryDistribution: Array<{ pays: string; total: number }>;
  formationDistribution: Array<{ formationName: string; total: number }>;
  yearlyEnrolments: Array<{ year: string; total: number }>;
  monthlyFinance: Array<{ label: string; paid: number; due: number }>;
  latestInscriptions: Array<{
    id: number;
    name: string;
    country: string;
    formation: string;
    date: string;
    status: string;
    matricule: string;
    photoUrl?: string;
  }>;
  advanced: {
    forceGraph: {
      nodes: Array<{
        id: string;
        name: string;
        type: string;
        value: number;
        color: string;
      }>;
      links: Array<{
        source: string;
        target: string;
        value: number;
      }>;
    };
    sunburst: {
      name: string;
      children?: Array<{
        name: string;
        value?: number;
        children?: Array<{
          name: string;
          value?: number;
          children?: Array<{
            name: string;
            value?: number;
          }>;
        }>;
      }>;
    };
    globe: {
      hub: {
        name: string;
        city: string;
        lat: number;
        lng: number;
      };
      nodes: Array<{
        name: string;
        city: string;
        lat: number;
        lng: number;
        value: number;
        kind: "hub" | "country";
      }>;
      arcs: Array<{
        fromName: string;
        toName: string;
        fromLat: number;
        fromLng: number;
        toLat: number;
        toLng: number;
        value: number;
        students: number;
        candidatures: number;
      }>;
    };
    streamSeed: Array<{
      timestamp: string;
      label: string;
      revenue: number;
      pendingPayments: number;
      pendingApplications: number;
      activeStudents: number;
    }>;
  };
}

export interface AdminTeacher {
  id: number;
  fullName: string;
  specialite: string;
  email: string;
  phone: string;
  statut: "disponible" | "occupe" | "mission";
  disponibilite: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStudent {
  id: number;
  matricule: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  formationId?: number;
  formationName: string;
  formationCode: string;
  promotionId?: number | null;
  promotionLabel: string;
  academicYear: string;
  country: string;
  countryLabel: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  rank: number;
  balance: number;
  balanceLabel: string;
  isActive: boolean;
  statusLabel: string;
  enrolledAt: string;
  photoUrl?: string;
  gender?: string;
  genderLabel?: string;
  age?: number | null;
  hobbies?: string;
  source?: "django_portal" | "emsp_legacy";
}

export interface AdminStudentsData {
  datasetMode: "portal" | "legacy";
  summary: {
    total: number;
    active: number;
    inactive: number;
    promotions: number;
    outstandingBalance: number;
  };
  results: AdminStudent[];
}

export interface AdminStudentFormationOption {
  id: number;
  code: string;
  name: string;
}

export interface AdminStudentPromotionOption {
  id: number;
  label: string;
  academicYear: string;
  formationId: number;
  formationCode: string;
}

export interface AdminStudentCountryOption {
  value: string;
  label: string;
}

export interface AdminStudentOptionsData {
  formations: AdminStudentFormationOption[];
  promotions: AdminStudentPromotionOption[];
  countries: AdminStudentCountryOption[];
}

export interface AdminLegacyStudentPayload {
  matricule: string;
  fullName: string;
  gender: "" | "M" | "F";
  age?: number | null;
  phone?: string;
  hobbies?: string;
}

export interface AdminPortalStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  matricule: string;
  formationId: number;
  promotionId?: number | null;
  pays: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  rangPromotion?: number;
  soldeScolarite?: number;
  isActive?: boolean;
  password?: string;
}

export interface AdminApplication {
  id: number;
  dossierNumber: string;
  status: "submitted" | "under_review" | "accepted" | "rejected";
  statusLabel: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  nationalityLabel: string;
  formationName: string;
  formationCode: string;
  createdAt: string;
  updatedAt: string;
  acknowledgementUrl: string;
}

export interface AdminApplicationDocument {
  id: number;
  originalName: string;
  createdAt: string;
  url: string;
}

export interface AdminApplicationsData {
  summary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  results: AdminApplication[];
}

export interface AdminApplicationDetail extends AdminApplication {
  dateOfBirth: string;
  placeOfBirth: string;
  residenceCountry: string;
  address: string;
  whatsapp?: string;
  photoUrl: string;
  highestDegree: string;
  highestDegreeLabel: string;
  institutionName: string;
  graduationYear: number;
  diplomaCountry: string;
  transcriptUrl: string;
  diplomaUrl: string;
  motivationFileUrl: string;
  professionalExperience?: string;
  motivationText?: string;
  accuracyCertified: boolean;
  termsAccepted: boolean;
  additionalDocuments: AdminApplicationDocument[];
}

export interface AdminAcademicPromotion {
  id: number;
  label: string;
  academicYear: string;
  formationName: string;
  formationCode: string;
  studentsCount: number;
}

export interface AdminAcademicCourse {
  id: number;
  matiere: string;
  enseignant: string;
  salle: string;
  type: ScheduleItem["type"];
  debut: string;
  fin: string;
  promotionLabel: string;
  formationName: string;
}

export interface AdminAcademicDocument {
  id: number;
  title: string;
  typeDocument: string;
  semester?: string;
  academicYear?: string;
  isGenerated: boolean;
  generatedAt?: string;
  studentName: string;
  matricule: string;
  promotionLabel: string;
}

export interface AdminStandingStudent {
  id: number;
  fullName: string;
  matricule: string;
  formationName: string;
  promotionLabel: string;
  rank: number;
  average: number;
}

export interface AdminAcademicOverviewData {
  summary: {
    promotions: number;
    scheduledCourses: number;
    generatedDocuments: number;
    averageScore: number;
  };
  promotions: AdminAcademicPromotion[];
  upcomingCourses: AdminAcademicCourse[];
  recentDocuments: AdminAcademicDocument[];
  topStudents: AdminStandingStudent[];
}

export interface AdminFinancePayment extends PaymentTransaction {
  formationName: string;
  studentCountry: string;
  statusLabel: string;
}

export interface AdminFinancePaymentsData {
  summary: {
    totalTransactions: number;
    confirmedCount: number;
    pendingCount: number;
    failedCount: number;
    confirmedTotal: number;
  };
  results: AdminFinancePayment[];
}

export interface AdminMediaItem extends MediaItem {
  isActive: boolean;
}

export interface AdminMediaPayload {
  title: string;
  description?: string;
  altText?: string;
  type: "image" | "video" | "document";
  category?: string;
  isActive: boolean;
  videoType?: "upload" | "youtube";
  videoUrl?: string;
  file?: File | null;
}

export interface AdminNewsPayload {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  coverId?: number | null;
}

export interface AdminNewsArticle {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  tags: string[];
  status: string;
  isPublished: boolean;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  coverImage?: MediaItem;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NewsTag {
  id: number;
  name: string;
  slug: string;
}

export interface SiteConfig {
  siteName: string;
  slogan: string;
  logoAlt: string;
  logoUrl: string;
  phone1: string;
  phone2: string;
  emailContact: string;
  emailInfo: string;
  address: string;
  showHomepageBanner: boolean;
  homepageBannerText: string;
  aboutText: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  footerText: string;
}

export interface SiteConfigUpdatePayload {
  siteName: string;
  slogan: string;
  logoAlt: string;
  phone1: string;
  phone2: string;
  emailContact: string;
  emailInfo: string;
  address: string;
  showHomepageBanner: boolean;
  homepageBannerText: string;
  aboutText: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  footerText: string;
  logoFile?: File | null;
  clearLogo?: boolean;
}

export interface ContactMessagePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: "inscription" | "information" | "partenariat" | "autre";
  message: string;
  honeypot?: string;
}

export interface InscriptionFormData {
  formationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  residenceCountry: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  confirmEmail: string;
  photo: File | undefined;
  highestDegree: string;
  institutionName: string;
  graduationYear: string;
  diplomaCountry: string;
  transcriptFile: File | undefined;
  diplomaFile: File | undefined;
  motivationFile: File | undefined;
  professionalExperience: string;
  motivationText: string;
  additionalDocuments: File[];
  accuracyCertified: boolean;
  termsAccepted: boolean;
}

export interface InscriptionSubmissionResponse {
  id: number;
  dossier_number: string;
  status: string;
  acknowledgement_url: string;
  created_at: string;
  message: string;
}
