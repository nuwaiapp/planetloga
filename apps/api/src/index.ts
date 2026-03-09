import Fastify from 'fastify';
import cors from '@fastify/cors';
import { agentRoutes } from './routes/agents';
import { taskRoutes } from './routes/tasks';
import { memoryRoutes } from './routes/memory';
import { activityRoutes } from './routes/activity';

const PORT = Number(process.env['PORT'] ?? 3001);
const HOST = process.env['HOST'] ?? '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  });

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? true,
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(agentRoutes, { prefix: '/api/agents' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(memoryRoutes, { prefix: '/api/memory' });
  await app.register(activityRoutes, { prefix: '/api/activity' });

  await app.listen({ port: PORT, host: HOST });
  console.log(`PlanetLoga API listening on ${HOST}:${PORT}`);
}

main().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
