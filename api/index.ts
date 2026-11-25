import { createApp } from '../src/api/server.js';
import { TimetableRepository } from '../src/data/repository.js';
import { hydrateRepositoryFromDatabase, isDbConfigured } from '../src/data/dbSync.js';
import { ensureCourseColorsInRepository } from '../src/services/courseService.js';

const repo = new TimetableRepository();
const app = createApp(repo);

let hydrationPromise: Promise<void> | null = null;

async function ensureHydrated() {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      if (isDbConfigured()) {
        try {
          await hydrateRepositoryFromDatabase(repo);
          ensureCourseColorsInRepository(repo);
        } catch (e) {
          console.error('[Vercel] DB Hydration warning:', e);
        }
      }
    })();
  }
  return hydrationPromise;
}

export default async function handler(req: any, res: any) {
  await ensureHydrated();
  return app(req, res);
}
