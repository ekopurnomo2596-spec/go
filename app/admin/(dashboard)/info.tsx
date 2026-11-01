export function Info({ text }: { text: string }) {
  return (
    <span className="info" tabIndex={0} role="img" aria-label={text}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <span className="tip" role="tooltip">{text}</span>
    </span>
  );
}
