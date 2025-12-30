import { Router } from 'express';
import { getConversations, getMessages, getConversationById, markConversationAsHandled, saveMessage, getStoreBySlug, updateConversationMode } from '../services/message.service';
import { sendText } from '../services/twilio.service';
import { pool } from '../db/pool';

const router = Router();

// GET /api/stores - Lista de tiendas desde la base de datos
router.get('/stores', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug as id, name, twilio_account_sid, twilio_auth_token, whatsapp_from, environment 
       FROM stores ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo tiendas:', error);
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
});

// GET /api/conversations - Lista de conversaciones por tienda
router.get('/conversations', async (req, res) => {
  try {
    const storeSlug = req.query.storeId as string;
    
    if (!storeSlug) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    // Buscar la tienda por slug para obtener su ID numérico
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return res.status(404).json({ error: `Tienda con slug '${storeSlug}' no encontrada` });
    }

    // Usar el ID numérico para filtrar conversaciones
    const conversations = await getConversations(store.id);
    res.json(conversations);
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// GET /api/conversations/:conversationId/messages - Mensajes de una conversación
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'conversationId inválido' });
    }

    // Verificar que la conversación existe
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const messages = await getMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// POST /api/conversations/:conversationId/reply - Responder a una conversación
router.post('/conversations/:conversationId/reply', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { text } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'conversationId inválido' });
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text es requerido y debe ser una cadena no vacía' });
    }

    // Verificar que la conversación existe
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Asegurar que conversationId sea un número válido
    const numericId = Number(conversationId);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({ error: `conversationId inválido: ${conversationId}` });
    }

    // Cambiar conversación a modo HUMAN ANTES de enviar el mensaje
    // Esto desactiva el bot para esta conversación inmediatamente
    console.log(`🔄 Intentando cambiar conversación ${numericId} a modo HUMAN (modo actual: ${conversation.mode})`);
    const updatedConversation = await updateConversationMode(numericId, 'HUMAN');
    console.log(`✅ Conversación ${numericId} cambiada a modo HUMAN (modo anterior: ${conversation.mode}, modo nuevo: ${updatedConversation.mode})`);

    // Enviar mensaje usando el servicio (mock en desarrollo)
    await sendText(conversation.phone_number, text.trim());

    // Guardar mensaje como outbound
    const message = await saveMessage(conversationId, 'outbound', text.trim());

    // Marcar conversación como manejada por humano
    await markConversationAsHandled(conversationId);

    res.json({
      success: true,
      message: {
        id: message.id,
        conversation_id: message.conversation_id,
        direction: message.direction,
        body: message.body,
        created_at: message.created_at
      }
    });
  } catch (error) {
    console.error('Error enviando respuesta:', error);
    res.status(500).json({ error: 'Error al enviar respuesta' });
  }
});

// POST /api/conversations/:conversationId/reset-bot - Resetear conversación a modo BOT
router.post('/conversations/:conversationId/reset-bot', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'conversationId inválido' });
    }

    // Verificar que la conversación existe
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Cambiar conversación a modo BOT
    const updatedConversation = await updateConversationMode(conversationId, 'BOT');

    console.log(`🤖 Conversación ${conversationId} reseteada a modo BOT`);

    res.json({
      success: true,
      conversation: {
        id: updatedConversation.id,
        mode: updatedConversation.mode,
        store_id: updatedConversation.store_id,
        phone_number: updatedConversation.phone_number
      }
    });
  } catch (error) {
    console.error('Error reseteando bot:', error);
    res.status(500).json({ error: 'Error al resetear bot' });
  }
});

export default router;

