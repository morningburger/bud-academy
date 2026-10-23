export type CourseTrack = "level" | "guest" | "brand" | "leadership" | "trend" | "etc";
export type CourseFormat = "offline" | "online" | "hybrid";
export type CourseStatus = "draft" | "pending_review" | "published" | "rejected" | "closed";
export type InstructorStatus = "pending" | "approved" | "rejected" | "suspended";
export type EnrollmentStatus = "requested" | "approved" | "canceled" | "completed";

export interface Instructor {
  id: string;
  user_id: string | null;
  name: string;
  headline: string | null;
  bio: string | null;
  career: string | null;
  photo_url: string | null;
  instagram: string | null;
  affiliation: "gohair" | "external";
  branch_name: string | null;
  status: InstructorStatus;
  approved_at: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  instructor_id: string | null;
  is_official: boolean;
  track: CourseTrack;
  level: number | null;
  format: CourseFormat;
  title: string;
  summary: string | null;
  description: string | null;
  audience: string | null;
  price: number | null;
  thumbnail_url: string | null;
  location: string | null;
  curriculum: CurriculumItem[];
  materials: string[];
  eligibility: string | null;
  price_note: string | null;
  gallery: string[];
  schedule_summary: string | null;
  sort_order: number;
  status: CourseStatus;
  review_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseSession {
  id: string;
  course_id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  schedule_text: string | null;
  location: string | null;
  capacity: number | null;
  status: "open" | "closed" | "canceled";
}

export interface Enrollment {
  id: string;
  course_id: string;
  session_id: string | null;
  user_id: string;
  status: EnrollmentStatus;
  applicant_name: string;
  applicant_phone: string;
  message: string | null;
  access_expires_at: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface CurriculumItem {
  title: string;
  detail?: string;
}

export interface LineupEntry {
  role: string | null;
  position: number;
  instructor: Pick<Instructor, "id" | "name" | "headline" | "photo_url" | "affiliation" | "branch_name"> | null;
}

export type CourseWithInstructor = Course & { instructor: Instructor | null; lineup?: LineupEntry[] };
