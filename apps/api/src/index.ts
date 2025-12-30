import * as dotenv from 'dotenv';
import * as path from 'path';
import express from 'express';
import webhookRoutes from './routes/webhook';
import inboxRoutes from './routes/inbox';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import { initSchema } from './db/pool';

// Variables de entorno ya cargadas en pool.ts

const app = express();

// Middleware de CORS para permitir solicitudes desde el frontend Angular
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// IMPORTANTE: Los middlewares de body parsing deben ir ANTES de las rutas
// Twilio envía datos como application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// También soportar JSON para testing
app.use(express.json());

// Middleware de logging para debug (después del body parsing)
app.use((req, res, next) => {
  if (req.url.startsWith('/webhook')) {
    console.log('📨 Webhook recibido:', {
      method: req.method,
      url: req.url,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      bodySample: req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body'
    });
  }
  next();
});

// Rutas
app.use('/webhook', webhookRoutes);
app.use('/inbox', inboxRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/health', (_, res) => res.send('OK'));

const PORT = process.env.PORT || 3333;

// Inicializar esquema y luego iniciar servidor
initSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`WhatsApp API corriendo en puerto ${PORT}`);
    const storeSlug = process.env.STORE_ID || 'crunchypaws';
    console.log(`Store Slug: ${storeSlug}`);
  });
}).catch((error) => {
  console.error('Error inicializando aplicación:', error);
  process.exit(1);
});

