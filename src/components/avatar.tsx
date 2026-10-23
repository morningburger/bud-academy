export function Avatar({ name, url, size = 56 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} className="rounded-full object-cover shrink-0 bg-surface-strong" style={{ width: size, height: size }} />;
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
