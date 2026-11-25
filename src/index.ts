import { createApp } from './api/server.js';
import { TimetableRepository } from './data/repository.js';
import { hydrateRepositoryFromDatabase, isDbConfigured } from './data/dbSync.js';
import { ensureCourseColorsInRepository } from './services/courseService.js';

const repo = new TimetableRepository();
const app = createApp(repo);
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  if (isDbConfigured()) {
    console.log('[Startup] Hydrating timetable repository from Supabase PostgreSQL...');
    await hydrateRepositoryFromDatabase(repo);
  }
  ensureCourseColorsInRepository(repo);
  app.listen(PORT, () => {
    console.log(`University Timetable Management System running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);

