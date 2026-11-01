// Bendera negara dari flagcdn.com (emoji bendera tidak tampil di Windows).
export function Flag({ code }: { code: string }) {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") {
    return (
      <svg className="flag flag-na" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  }
  const c = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="flag"
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w80/${c}.png 2x`}
      width={20}
      height={15}
      alt=""
      loading="lazy"
    />
  );
}
