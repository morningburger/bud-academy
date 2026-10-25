export function Avatar({ name, url, size = 56 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} className="rounded-full object-cover object-[50%_18%] shrink-0 bg-surface-strong" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="rounded-full bg-blue-weak text-blue font-bold grid place-items-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 강사 프로필 사진 (세로 4:5). 사진이 없으면 이름 첫 글자 */
export function Portrait({ name, url, className = "" }: { name: string; url: string | null; className?: string }) {
  return (
    <div className={`aspect-[4/5] overflow-hidden bg-surface-strong ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover object-[50%_15%] transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
      ) : (
        <div className="h-full w-full grid place-items-center text-[40px] font-extrabold text-muted">{name.slice(0, 1)}</div>
      )}
    </div>
  );
}
