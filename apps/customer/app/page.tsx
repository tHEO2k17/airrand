import { HomeBrowse } from "../components/home-browse";
import { AppShell } from "../components/ui/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="store-main store-main--no-sticky">
        <HomeBrowse />
      </main>
    </AppShell>
  );
}
