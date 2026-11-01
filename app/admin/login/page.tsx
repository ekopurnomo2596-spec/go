import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { login } from "../actions";
import { Logo } from "@/lib/logo";

export const dynamic = "force-dynamic";

const ERR: Record<string, string> = {
  bad: "Password salah.",
  limit: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { err } = await searchParams;

  return (
    <main className="login">
      <Logo center />
      <div className="card">
        <h1>Masuk ke dashboard</h1>
        {err && ERR[err] && <div className="msg err">{ERR[err]}</div>}
        <form action={login}>
          <div className="row">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          </div>
          <button type="submit">Masuk</button>
        </form>
      </div>
    </main>
  );
}
