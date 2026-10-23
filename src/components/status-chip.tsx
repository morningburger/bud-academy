import type { CourseStatus, EnrollmentStatus, InstructorStatus } from "@/lib/types";
import { COURSE_STATUS_LABEL, ENROLLMENT_STATUS_LABEL, INSTRUCTOR_STATUS_LABEL } from "@/lib/format";

const COURSE: Record<CourseStatus, string> = {
  draft: "chip-gray", pending_review: "chip-orange", published: "chip-blue", rejected: "chip-red", closed: "chip-gray",
};
const INSTRUCTOR: Record<InstructorStatus, string> = {
  pending: "chip-orange", approved: "chip-blue", rejected: "chip-red", suspended: "chip-gray",
};
const ENROLL: Record<EnrollmentStatus, string> = {
  requested: "chip-orange", approved: "chip-blue", canceled: "chip-gray", completed: "chip-green",
};

export const CourseStatusChip = ({ s }: { s: CourseStatus }) => <span className={COURSE[s]}>{COURSE_STATUS_LABEL[s]}</span>;
export const InstructorStatusChip = ({ s }: { s: InstructorStatus }) => <span className={INSTRUCTOR[s]}>{INSTRUCTOR_STATUS_LABEL[s]}</span>;
export const EnrollmentStatusChip = ({ s }: { s: EnrollmentStatus }) => <span className={ENROLL[s]}>{ENROLLMENT_STATUS_LABEL[s]}</span>;
