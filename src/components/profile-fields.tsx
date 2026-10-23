"use client";

import { useState } from "react";
import { JOB_TITLES } from "@/lib/format";
import type { OrgType } from "@/lib/types";

export interface ProfileDefaults {
  name?: string | null;
  phone?: string | null;
  orgType?: OrgType | null;
  branch?: string | null;
  jobTitle?: string | null;
}

/** 이름·휴대폰·소속·지점·직급 입력 (가입, 회원 정보 수정에서 같이 사용) */
export function ProfileFields({ branches, defaults = {} }: { branches: string[]; defaults?: ProfileDefaults }) {
  const [org, setOrg] = useState<OrgType>(defaults.orgType ?? "gohair");
  const knownBranch = defaults.branch && branches.includes(defaults.branch) ? defaults.branch : "";
  const titleKnown = defaults.jobTitle && JOB_TITLES.includes(defaults.jobTitle);
  const [title, setTitle] = useState(titleKnown ? defaults.jobTitle! : defaults.jobTitle ? "기타" : "");

  return (
    <>
      <fieldset>
        <legend className="field-label">소속</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["gohair", "external"] as const).map((v) => (
            <label
              key={v}
              className={`flex h-12 items-center justify-center rounded-xl border text-[15px] font-semibold cursor-pointer transition-colors ${
                org === v ? "border-blue bg-blue-weak text-blue" : "border-line text-sub hover:bg-surface"
              }`}
            >
              <input type="radio" name="org_type" value={v} checked={org === v} onChange={() => setOrg(v)} className="sr-only" />
              {v === "gohair" ? "고정현헤어" : "다른 살롱"}
            </label>
          ))}
        </div>
      </fieldset>

      {org === "gohair" ? (
        <div>
          <label className="field-label" htmlFor="branch">지점</label>
          <select id="branch" name="branch" className="input" required defaultValue={knownBranch}>
            <option value="" disabled>지점을 골라 주세요</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <p className="mt-1 text-[12px] text-muted">사업자등록증 기준 지점명이에요. 목록에 없으면 기획본부팀에 알려 주세요.</p>
        </div>
      ) : (
        <div>
          <label className="field-label" htmlFor="branch">살롱 이름</label>
          <input id="branch" name="branch" className="input" required defaultValue={knownBranch ? "" : defaults.branch ?? ""} placeholder="예: OO헤어 강남점" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label" htmlFor="name">이름 (실명)</label>
          <input id="name" name="name" className="input" required autoComplete="name" defaultValue={defaults.name ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="job_title">직급</label>
          <select id="job_title" name="job_title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)}>
            <option value="" disabled>선택</option>
            {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {title === "기타" && (
        <div>
          <label className="field-label" htmlFor="job_title_etc">직급 직접 입력</label>
          <input id="job_title_etc" name="job_title_etc" className="input" required defaultValue={titleKnown ? "" : defaults.jobTitle ?? ""} />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="phone">휴대폰</label>
        <input id="phone" name="phone" className="input" required inputMode="tel" autoComplete="tel" placeholder="01012345678" defaultValue={defaults.phone ?? ""} />
      </div>
    </>
  );
}
