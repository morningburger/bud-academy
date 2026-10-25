import ExcelJS from "exceljs";
import { JOB_TITLES } from "./format";

export interface LegacyRow {
  email: string;
  raw_name: string | null;
  name: string | null;
  phone: string | null;
  org_type: "gohair" | "external" | null;
  branch: string | null;
  job_title: string | null;
  marketing_agreed: boolean | null;
  enrolled: boolean | null;
  joined_on: string | null;
  last_seen_on: string | null;
}

const TITLE_RE = new RegExp(
  `\\s*(${["본부장", "부원장", "원장", "인턴", "디자이너", "팀장", "실장", "점장", "대표", "매니저", "사원", "대리", "과장", "차장", "이사", ...JOB_TITLES]
    .filter((t, i, a) => a.indexOf(t) === i && t !== "기타" && t !== "본사 직원")
    .sort((a, b) => b.length - a.length)
    .join("|")})\\s*$`,
);

const norm = (s: string) => s.replace(/[\s.·()]/g, "").replace(/점$/, "");

/** "(검단신도시점) 하나 팀장" → 지점 / 이름 / 직급. 지점이 목록과 맞으면 고정현헤어 소속으로 본다 */
export function splitLegacyName(raw: string, branches: string[]) {
  let rest = raw.trim().replace(/^["'\s]+|["'\s]+$/g, "");
  let branch: string | null = null;
  const m = rest.match(/^[(\[]\s*([^)\]]+?)\s*[)\]]\s*(.*)$/);
  if (m) {
    branch = m[1].trim();
    rest = m[2].trim();
  }
  if (!branch) {
    const hq = rest.match(/^(고헤어|고정현헤어|고정현)\s+(.*)$/);
    if (hq) {
      branch = "본사";
      rest = hq[2].trim();
    }
  }
  let title: string | null = null;
  const t = rest.match(TITLE_RE);
  if (t && t.index! > 0) {
    title = t[1];
    rest = rest.slice(0, t.index).trim();
  }
  let org: "gohair" | "external" | null = null;
  if (branch) {
    const nb = norm(branch);
    const hit = branches.find((b) => norm(b) === nb) ?? branches.find((b) => nb.length >= 2 && (norm(b).includes(nb) || nb.includes(norm(b))));
    if (hit) {
      branch = hit;
      org = "gohair";
    }
  }
  return { name: rest || null, branch, title, org };
}

function toDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/(\d{2,4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
  if (!m) return null;
  const y = m[1].length === 2 ? `20${m[1]}` : m[1];
  return `${y}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string };
    if (o.richText) return o.richText.map((r) => r.text).join("");
    if (o.text) return String(o.text);
    if (o.result !== undefined) return String(o.result);
    if (o.hyperlink) return o.hyperlink.replace(/^mailto:/, "");
  }
  return String(v);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export async function readSheet(file: File): Promise<unknown[][]> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    return parseCsv(buf.toString("utf8").replace(/^﻿/, ""));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const out: unknown[][] = [];
  ws?.eachRow({ includeEmpty: false }, (r) => {
    const vals = (r.values as unknown[]).slice(1);
    out.push(vals);
  });
  return out;
}

/** 머리글로 열을 찾아 회원 행으로 바꾼다 (라이브클래스 회원 내보내기 형식 기준, 다른 엑셀도 머리글만 맞으면 됨) */
export function toLegacyRows(table: unknown[][], branches: string[]) {
  const headerIdx = table.findIndex((r) => r.some((c) => cellText(c).includes("이메일")));
  if (headerIdx < 0) throw new Error("‘이메일’ 머리글이 있는 엑셀(또는 CSV)을 올려 주세요.");
  const header = table[headerIdx].map((c) => cellText(c).replace(/\s/g, ""));
  const col = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  const ci = {
    email: col("이메일"),
    name: col("이름", "성명"),
    phone: col("연락처", "휴대폰", "전화"),
    marketing: col("마케팅"),
    enrolled: col("수강이력", "수강여부"),
    joined: col("등록일", "가입일"),
    seen: col("최근접속"),
  };
  const rows = new Map<string, LegacyRow>();
  let skipped = 0;
  for (const r of table.slice(headerIdx + 1)) {
    const get = (i: number) => (i >= 0 ? cellText(r[i]).trim() : "");
    const email = get(ci.email).toLowerCase().replace(/^mailto:/, "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { skipped++; continue; }
    const raw = get(ci.name);
    const parts = raw ? splitLegacyName(raw, branches) : { name: null, branch: null, title: null, org: null };
    const phone = get(ci.phone).replace(/[^0-9]/g, "") || null;
    const mk = get(ci.marketing);
    const en = get(ci.enrolled);
    rows.set(email, {
      email,
      raw_name: raw || null,
      name: parts.name,
      phone: phone && phone.length >= 10 && phone.length <= 11 ? phone : null,
      org_type: parts.org,
      branch: parts.branch,
      job_title: parts.title,
      marketing_agreed: mk ? /동의|^y|true|o$/i.test(mk) && !/안\s*함|미동의|거부|^n/i.test(mk) : null,
      enrolled: en ? !/미수강|없음|^0/.test(en) : null,
      joined_on: toDate(ci.joined >= 0 ? r[ci.joined] : null),
      last_seen_on: toDate(ci.seen >= 0 ? r[ci.seen] : null),
    });
  }
  return { rows: [...rows.values()], skipped };
}

export interface LegacyApplicant {
  email: string | null;
  phone: string | null;
  raw_name: string | null;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

/** 강좌별 수강생 목록(라이브클래스 수강생 내보내기 등)에서 이메일·휴대폰·이름을 뽑는다. 열 순서는 상관없음 */
export function toLegacyApplicants(table: unknown[][]) {
  const headerIdx = table.findIndex((r) => r.some((c) => /이름|이메일|연락처|휴대폰|신청자/.test(cellText(c))));
  const header = headerIdx >= 0 ? table[headerIdx].map((c) => cellText(c).replace(/\s/g, "")) : [];
  const nameCol = header.findIndex((h) => /이름|성명|신청자/.test(h));
  const out = new Map<string, LegacyApplicant>();
  let skipped = 0;
  for (const r of table.slice(headerIdx + 1)) {
    const cells = r.map(cellText);
    const joined = cells.join(" ");
    const email = joined.match(EMAIL_RE)?.[0].toLowerCase() ?? null;
    const phoneRaw = joined.match(PHONE_RE)?.[0] ?? null;
    const phone = phoneRaw ? phoneRaw.replace(/[^0-9]/g, "") : null;
    if (!email && !phone) { skipped++; continue; }
    let name = nameCol >= 0 ? cells[nameCol]?.trim() || null : null;
    if (name) name = name.replace(EMAIL_RE, "").replace(PHONE_RE, "").trim() || null;
    out.set(email ?? `tel:${phone}`, { email, phone, raw_name: name });
  }
  return { rows: [...out.values()], skipped };
}
