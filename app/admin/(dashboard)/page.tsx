import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { listLinks, totals } from "@/lib/links";
import { createLink, deleteLink, seedLinks, updateLink } from "../actions";
import { ConfirmButton, SubmitButton } from "../confirm-button";
import { EditLink } from "./edit-link";

export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  slug: "Slug tidak valid. Pakai huruf kecil, angka, - atau _ (maksimal 40 karakter).",
  reserved: "Slug itu dipakai sistem. Pilih yang lain.",
  url: "URL tujuan harus diawali http:// atau https://.",
  exists: "Slug itu sudah ada.",
};
const OK: Record<string, string> = {
  created: "Link dibuat.",
  updated: "Link diperbarui.",
  deleted: "Link dihapus beserta datanya.",
  seeded: "Link awal ditambahkan.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const links = await listLinks();
  const counts = await totals(links.map((l) => l.slug));
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="wrap">
      <div className="top">
        <h1>Semua tautan</h1>
      </div>

      {sp.err && ERR[sp.err] && <div className="msg err">{ERR[sp.err]}</div>}
      {sp.ok && OK[sp.ok] && <div className="msg ok">{OK[sp.ok]}</div>}

      <section className="card">
        <h2>Buat link baru</h2>
        <form action={createLink}>
          <div className="grid">
            <div>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" type="text" placeholder="promo" required maxLength={40} />
            </div>
            <div>
              <label htmlFor="url">URL tujuan</label>
              <input id="url" name="url" type="url" placeholder="https://..." required />
            </div>
            <div>
              <label htmlFor="title">Judul</label>
              <input id="title" name="title" type="text" placeholder="Promo November" maxLength={80} />
            </div>
            <SubmitButton>Buat</SubmitButton>
          </div>
        </form>
      </section>

      <p className="sum">
        {links.length} link &middot; {sum.toLocaleString("id-ID")} klik total
      </p>

      {links.length === 0 ? (
        <div className="empty">
          <p>Belum ada link.</p>
          <form action={seedLinks}>
            <SubmitButton className="ghost">Tambahkan 7 link awal (wa, tg, shop, blog, help, chat, web)</SubmitButton>
          </form>
        </div>
      ) : (
        <div className="tablewrap">
          <table className="linktable">
            <thead>
              <tr>
                <th>Link</th>
                <th>Tujuan</th>
                <th className="num">Klik</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.slug}>
                  <td>
                    <a className="short" href={`/${l.slug}`} target="_blank" rel="noreferrer">
                      {host}/{l.slug}
                    </a>
                    <div className="sum">{l.title}</div>
                  </td>
                  <td className="dest">{l.url}</td>
                  <td className="num">{(counts[l.slug] ?? 0).toLocaleString("id-ID")}</td>
                  <td>
                    <div className="actions">
                      <EditLink
                        key={`${l.slug}:${l.title}:${l.url}`}
                        slug={l.slug}
                        title={l.title}
                        url={l.url}
                        action={updateLink}
                      />
                      <form action={deleteLink}>
                        <input type="hidden" name="slug" value={l.slug} />
                        <ConfirmButton
                          className="danger"
                          message={`Hapus /${l.slug}? Link dan semua data kliknya akan hilang permanen.`}
                        >
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
