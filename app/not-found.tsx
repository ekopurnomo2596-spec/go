import { Logo } from "@/lib/logo";
import NotFoundContent from "./not-found-content";

export default function NotFound() {
  return (
    <main className="public" style={{ paddingTop: "56px" }}>
      <Logo center />
      <NotFoundContent />
    </main>
  );
}
