import twilio from 'twilio';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno si no están cargadas
if (!process.env.TWILIO_ACCOUNT_SID) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const isProduction = process.env.NODE_ENV === 'production';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client: any = null;

// Solo inicializar cliente de Twilio en producción
if (isProduction) {
  if (!accountSid || !authToken) {
    console.error('❌ Error: TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN deben estar configurados en .env para producción');
    throw new Error('Credenciales de Twilio no configuradas');
  }
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio inicializado para producción');
  } catch (error) {
    console.error('❌ Error inicializando Twilio:', error);
    throw error;
  }
} else {
  console.log('🔧 Modo desarrollo: Twilio deshabilitado, mensajes se simularán');
}

export const sendInteractive = async (to: string, interactive: any): Promise<boolean> => {
  const bodyText = interactive.body?.text || 'Selecciona una opción';

  // En desarrollo: solo loguear, NO enviar a Twilio
  if (!isProduction) {
    console.log('[MOCK SEND]', bodyText);
    console.log('   To:', to);
    console.log('   Type: Interactive');
    return false; // Indica que fue simulado
  }

  // En producción: enviar mensaje real
  if (!client) {
    throw new Error('Cliente de Twilio no inicializado');
  }

  try {
    await client.messages.create({
      from: process.env.WHATSAPP_FROM,
      to,
      body: bodyText,
      interactive
    } as any);
    return true; // Indica que fue enviado realmente
  } catch (error: any) {
    console.error('❌ Error enviando mensaje interactivo por Twilio:', error.message);
    throw error;
  }
};

export const sendText = async (to: string, text: string): Promise<boolean> => {
  // En desarrollo: solo loguear, NO enviar a Twilio
  if (!isProduction) {
    console.log('[MOCK SEND]', text);
    console.log('   To:', to);
    return false; // Indica que fue simulado
  }

  // En producción: enviar mensaje real
  if (!client) {
    throw new Error('Cliente de Twilio no inicializado');
  }

  try {
    await client.messages.create({
      from: process.env.WHATSAPP_FROM,
      to,
      body: text
    });
    return true; // Indica que fue enviado realmente
  } catch (error: any) {
    console.error('❌ Error enviando mensaje por Twilio:', error.message);
    throw error;
  }
};

