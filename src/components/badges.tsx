import type { Instructor } from "@/lib/types";

export function SellerBadge({ isOfficial, instructor }: { isOfficial: boolean; instructor: Pick<Instructor, "affiliation"> | null }) {
  if (isOfficial) return <span className="chip-blue">직영</span>;
  if (instructor?.affiliation === "gohair") return <span className="chip-green">고정현헤어 소속</span>;
  return null;
}

export function sellerName(isOfficial: boolean, instructor: Pick<Instructor, "name"> | null) {
  return isOfficial ? "버드아카데미" : instructor?.name ?? "";
}
