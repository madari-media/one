import { CatalogRenderer } from '../features/catalog/catalog-renderer';
import { ContinueWatchingSection } from '../features/catalog/continue-watching-section';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-900">
      <div className="p-2 md:p-4 !pt-18">
        <ContinueWatchingSection />
        <CatalogRenderer />
      </div>
    </main>
  );
}
