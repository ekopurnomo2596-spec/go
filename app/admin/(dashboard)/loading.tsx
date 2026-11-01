export default function Loading() {
  return (
    <main className="wrap">
      <div className="pageload" role="status" aria-label="Memuat">
        <span className="spin" aria-hidden="true" />
      </div>
    </main>
  );
}
