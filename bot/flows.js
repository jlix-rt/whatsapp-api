const sessions = require('./sessions');
const menus = require('./menus');
const products = require('./products');
const { sendInteractive, sendText } = require('../services/whatsapp');

module.exports.handleMessage = async (req, res) => {
  const from = req.body.From;
  const button = req.body.ButtonReply?.id;
  const list = req.body.ListReply?.id;

  if (!sessions[from]) {
    sessions[from] = { step: 'MENU' };
    await sendInteractive(from, menus.mainMenu());
    return res.status(200).end();
  }

  const s = sessions[from];

  // MENÚ PRINCIPAL
  if (s.step === 'MENU') {
    if (button === 'ORDER') {
      s.step = 'PRODUCTS';
      await sendInteractive(from, menus.productMenu());
    } else if (button === 'HUMAN') {
      await sendText(from, 'Alguien se comunicará contigo');
      delete sessions[from];
    }
    return res.status(200).end();
  }

  // PRODUCTOS
  if (s.step === 'PRODUCTS' && products[list]) {
    s.product = list;
    s.step = 'OPTION';
    const opts = products[list].options
      .map((o, i) => `${i + 1}. ${o}`)
      .join('\n');

    await sendText(from, `Seleccionaste ${products[list].name}\n\n${opts}`);
    return res.status(200).end();
  }

  // FINAL (prueba)
  if (s.step === 'OPTION') {
    await sendText(
      from,
      'Pronto una persona se comunicará contigo para confirmar tu pedido y darte más detalles, gracias.'
    );
    delete sessions[from];
    return res.status(200).end();
  }

  res.status(200).end();
};
