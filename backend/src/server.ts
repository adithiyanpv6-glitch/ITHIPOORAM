import http from 'http';
import { createApp } from './app';
import { initSockets } from './sockets';
import { CONFIG } from './config';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSockets
  initSockets(server);

  server.listen(CONFIG.PORT, () => {
    console.log(`=======================================================`);
    console.log(`  ITHI POORAM (ഇത്തിപ്പൂരം) POS & KDS CORE SERVER`);
    console.log(`  Status: ACTIVE & LISTENING on http://localhost:${CONFIG.PORT}`);
    console.log(`  Timezone: ${CONFIG.TIMEZONE} (Asia/Kolkata)`);
    console.log(`  Health Check: http://localhost:${CONFIG.PORT}/health`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
