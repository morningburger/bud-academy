/** 취소·환불 규정 (강좌별 취소 마감 일수 반영). 무료 과정은 환불 문구 없이 안내 */
export function CancelPolicy({ days, multiSession = false, free = false, compact = false }: { days: number; multiSession?: boolean; free?: boolean; compact?: boolean }) {
  const after = days - 1 > 0 ? `${days - 1}일 전부터는` : "그 이후에는";
  const items = [
    "신청하면 바로 수강이 확정돼요.",
    "취소는 내 강의실에서 ‘취소 요청’을 누르고, 운영진이 승인하면 처리돼요.",
    free
      ? days > 0
        ? `수업일 ${days}일 전까지 취소 요청할 수 있어요. ${after} 취소가 안 되고 양도만 가능해요.`
        : "수업 전날까지 취소 요청할 수 있어요."
      : days > 0
        ? `수업일 ${days}일 전까지 취소 요청하면 전액 환불돼요. ${after} 취소·환불이 안 되고 양도만 가능해요.`
        : "수업 전날까지 취소 요청할 수 있어요.",
    "양도는 수업 1일 전까지 받는 분의 지점·이름·직급을 기획본부팀에 알려 주세요.",
    "수업일이 정해지지 않은 반은 날짜가 확정되면 그 날짜를 기준으로 적용해요.",
    ...(multiSession && !free ? ["여러 회차로 진행되는 교육은 중간에 불참하거나 그만둬도 환불되지 않아요."] : []),
  ];
  return (
    <ul className={`flex flex-col ${compact ? "gap-1 text-[12px]" : "gap-1.5 text-[14px]"} leading-relaxed text-sub`}>
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span aria-hidden className="mt-[0.6em] size-1 rounded-full bg-muted shrink-0" />
          {t}
        </li>
      ))}
    </ul>
  );
}
