import { pool } from '../db/pool';

export interface Store {
  id: number;
  slug: string;
  name: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  whatsapp_from?: string;
  environment?: 'sandbox' | 'production';
}

export interface Conversation {
  id: number;
  store_id: number;
  phone_number: string;
  mode: 'BOT' | 'HUMAN';
  human_handled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  direction: 'inbound' | 'outbound';
  body: string;
  twilio_message_sid?: string;
  created_at: Date;
}

// Obtener tienda por slug
export const getStoreBySlug = async (slug: string): Promise<Store | null> => {
  const result = await pool.query(
    `SELECT id, slug, name, twilio_account_sid, twilio_auth_token, whatsapp_from, environment 
     FROM stores WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] || null;
};

// Obtener tienda por ID
export const getStoreById = async (id: number): Promise<Store | null> => {
  const result = await pool.query(
    `SELECT id, slug, name, twilio_account_sid, twilio_auth_token, whatsapp_from, environment 
     FROM stores WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const getOrCreateConversation = async (
  storeId: number,
  phoneNumber: string
): Promise<Conversation> => {
  const result = await pool.query(
    `INSERT INTO conversations (store_id, phone_number, mode)
     VALUES ($1, $2, 'BOT')
     ON CONFLICT (store_id, phone_number)
     DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [storeId, phoneNumber]
  );
  return result.rows[0];
};

export const getConversation = async (
  storeId: number,
  phoneNumber: string
): Promise<Conversation | null> => {
  const result = await pool.query(
    `SELECT * FROM conversations
     WHERE store_id = $1 AND phone_number = $2`,
    [storeId, phoneNumber]
  );
  return result.rows[0] || null;
};

export const updateConversationMode = async (
  conversationId: number,
  mode: 'BOT' | 'HUMAN'
): Promise<Conversation> => {
  // Asegurar que conversationId sea un número
  const id = Number(conversationId);
  
  if (isNaN(id) || id <= 0) {
    throw new Error(`ID de conversación inválido: ${conversationId}`);
  }

  const result = await pool.query(
    `UPDATE conversations
     SET mode = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [mode, id]
  );
  
  // Loggear cuántas filas fueron afectadas para debug
  console.log(`📊 UPDATE conversations SET mode = '${mode}' WHERE id = ${id}: ${result.rowCount} fila(s) afectada(s)`);
  
  if (result.rowCount === 0) {
    throw new Error(`No se encontró la conversación con id ${id}`);
  }
  
  if (result.rows.length === 0) {
    throw new Error(`UPDATE ejecutado pero no se retornaron filas para id ${id}`);
  }
  
  return result.rows[0];
};

export const saveMessage = async (
  conversationId: number,
  direction: 'inbound' | 'outbound',
  body: string,
  twilioMessageSid?: string
): Promise<Message> => {
  const result = await pool.query(
    `INSERT INTO messages (conversation_id, direction, body, twilio_message_sid)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [conversationId, direction, body, twilioMessageSid]
  );
  return result.rows[0];
};

export const getConversations = async (storeId: number): Promise<any[]> => {
  const result = await pool.query(
    `SELECT c.*, 
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
            (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
            (SELECT m.direction FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_direction
     FROM conversations c
     WHERE c.store_id = $1
     ORDER BY c.updated_at DESC`,
    [storeId]
  );
  
  // Debug: log para conversaciones con +50277777777
  result.rows.forEach((row: any) => {
    if (row.phone_number && row.phone_number.includes('77777777')) {
      console.log('🔍 Debug getConversations para +50277777777:', {
        id: row.id,
        phone_number: row.phone_number,
        last_message: row.last_message,
        last_message_direction: row.last_message_direction,
        human_handled: row.human_handled
      });
    }
  });
  
  return result.rows;
};

export const getConversationById = async (conversationId: number): Promise<Conversation | null> => {
  const result = await pool.query(
    `SELECT * FROM conversations WHERE id = $1`,
    [conversationId]
  );
  return result.rows[0] || null;
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
};

export const markConversationAsHandled = async (conversationId: number): Promise<Conversation> => {
  const result = await pool.query(
    `UPDATE conversations
     SET human_handled = true, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [conversationId]
  );
  return result.rows[0];
};

