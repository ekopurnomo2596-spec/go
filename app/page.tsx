import { listLinks } from "@/lib/links";
import { LinkIcon } from "@/lib/icons";
import { Logo } from "@/lib/logo";

export const dynamic = "force-dynamic";

export default async function Home() {
  let links: Awaited<ReturnType<typeof listLinks>> = [];
  try {
    links = (await listLinks()).filter((l) => l.listed).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    links = [];
  }

  return (
    <main className="public">
      <Logo center />
      <p className="lead">
        Satu tautan untuk semua kanal resmi EMAHAIRSHOP &mdash; pilih salah satu di bawah ini.
      </p>

      {links.length === 0 ? (
        <p className="empty">Belum ada tautan yang ditampilkan.</p>
      ) : (
        <ul className="linklist">
          {links.map((l) => (
            <li key={l.slug}>
              <a href={`/${l.slug}`}>
                <span className="ico">
                  <LinkIcon slug={l.slug} title={l.title} />
                </span>
                <span className="t">
                  {l.title}
                  <small className="dm">go.emahairshop.com/{l.slug}</small>
                </span>
                <svg className="ch" viewBox="0 0 24 24">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="foot">
        &copy; 2026 EMAHAIRSHOP &middot; <a href="https://emahairshop.com">emahairshop.com</a>
      </p>
    </main>
  );
}
