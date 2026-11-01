import { listLinks } from "@/lib/links";

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
      <h1>
        EMAHAIRSHOP
        <small>Extension 2019</small>
      </h1>
      <p className="lead">
        Pemasok human hair extension dari Indonesia. Pilih tautan di bawah untuk menghubungi kami atau melihat produk.
      </p>
      <ul className="linklist">
        {links.map((l) => (
          <li key={l.slug}>
            <a href={`/${l.slug}`}>
              <span className="name">{l.title}</span>
              <span className="slug">/{l.slug}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="foot">
        &copy; 2026 EMAHAIRSHOP. <a href="https://emahairshop.com">emahairshop.com</a>
      </p>
    </main>
  );
}
