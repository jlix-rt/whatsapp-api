import { Router } from 'express';
import { handleMessage as handleCrunchypaws } from '../flows/crunchypaws.flow';
import { handleMessage as handleDkape } from '../flows/dkape.flow';
import { getStoreBySlug } from '../services/message.service';

const router = Router();

router.post('/whatsapp', async (req, res) => {
  const storeSlug = process.env.STORE_ID || 'crunchypaws';
  
  // Debug: ver qué está llegando
  console.log('📥 Webhook recibido:', {
    contentType: req.headers['content-type'],
    body: req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'undefined'
  });
  
  try {
    // Buscar la tienda por slug
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return res.status(400).json({ error: `Tienda con slug '${storeSlug}' no encontrada` });
    }

    // Determinar qué flow usar basado en el slug
    if (storeSlug === 'crunchypaws') {
      await handleCrunchypaws(req, res, store.id);
    } else if (storeSlug === 'dkape') {
      await handleDkape(req, res, store.id);
    } else {
      // Flow genérico para otras tiendas
      await handleCrunchypaws(req, res, store.id);
    }
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

