import { Router } from 'express';
import { getConversations, getMessages, getStoreBySlug } from '../services/message.service';
import { sendText } from '../services/twilio.service';
import { getOrCreateConversation, saveMessage } from '../services/message.service';

const router = Router();

router.get('/conversations', async (req, res) => {
  try {
    const storeSlug = process.env.STORE_ID || 'crunchypaws';
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return res.status(404).json({ error: `Tienda con slug '${storeSlug}' no encontrada` });
    }
    const conversations = await getConversations(store.id);
    res.json(conversations);
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

router.get('/messages/:conversationId', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const messages = await getMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const storeSlug = process.env.STORE_ID || 'crunchypaws';

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber y message son requeridos' });
    }

    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return res.status(404).json({ error: `Tienda con slug '${storeSlug}' no encontrada` });
    }

    const conversation = await getOrCreateConversation(store.id, phoneNumber);
    await sendText(phoneNumber, message);
    await saveMessage(conversation.id, 'outbound', message);

    res.json({ success: true, conversationId: conversation.id });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

export default router;

