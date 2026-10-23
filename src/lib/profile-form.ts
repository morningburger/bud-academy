import type { OrgType } from "./types";

/** 서버에서 폼 값 꺼내기 */
export function readProfileForm(form: FormData) {
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const org = s("org_type") === "external" ? "external" : "gohair";
  const title = s("job_title") === "기타" ? s("job_title_etc") || "기타" : s("job_title");
  return {
    name: s("name"),
    phone: s("phone").replace(/[^0-9]/g, ""),
    org_type: org as OrgType,
    branch: s("branch").slice(0, 60),
    job_title: title.slice(0, 30),
  };
}

export function profileFormError(p: ReturnType<typeof readProfileForm>) {
  if (!p.name) return "이름을 입력해 주세요.";
  if (p.phone.length < 10 || p.phone.length > 11) return "휴대폰 번호를 정확히 입력해 주세요.";
  if (!p.branch) return p.org_type === "gohair" ? "지점을 골라 주세요." : "살롱 이름을 입력해 주세요.";
  if (!p.job_title) return "직급을 골라 주세요.";
  return null;
}
