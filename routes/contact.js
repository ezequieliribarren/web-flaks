// POST /api/contacto: honeypot + validación + rate limit + nodemailer.
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 5 : 50, // en desarrollo, holgado para las pruebas
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Recibimos muchos envíos desde tu conexión. Probá en unos minutos o escribinos por WhatsApp.' },
});

const ALLOWED_ORIGINS = ['/', '/landing-page', '/sitio-web', '/tienda-digital', '/redes-sociales', '/pauta-publicitaria'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

const clean = (v, max = 500) =>
  String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

router.post(
  '/api/contacto',
  limiter,
  express.urlencoded({ extended: false, limit: '20kb' }),
  express.json({ limit: '20kb' }),
  async (req, res) => {
    const b = req.body || {};

    // Honeypot: los bots completan "website". Respondemos OK para no darles pistas.
    if (clean(b.website)) return res.json({ ok: true });

    const origen = clean(b.origen, 60);
    const data = {
      nombre: clean(b.nombre, 120),
      email: clean(b.email, 160),
      telefono: clean(b.telefono, 40),
      servicio: clean(b.servicio, 120),
      detalle: clean(b.detalle, 300),
      mensaje: clean(b.mensaje, 2000),
      origen: ALLOWED_ORIGINS.includes(origen) ? origen : '/',
    };

    const errors = {};
    if (data.nombre.length < 2) errors.nombre = 'Contanos tu nombre.';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
      errors.email = 'Revisá el email: parece incompleto.';
    }
    const digits = data.telefono.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      errors.telefono = 'Dejanos un teléfono con código de área, por ejemplo 11 5745 5803.';
    }
    if (Object.keys(errors).length) {
      return res.status(422).json({ ok: false, errors, error: 'Revisá los campos marcados.' });
    }

    const utm = {};
    for (const k of UTM_KEYS) if (b[k]) utm[k] = clean(b[k], 200);

    const rows = [
      ['Nombre', data.nombre],
      ['Email', data.email || '—'],
      ['Teléfono', data.telefono],
      ['Servicio', data.servicio || '—'],
      ['Detalle', data.detalle || '—'],
      ['Mensaje', data.mensaje || '—'],
      ['Página de origen', data.origen],
      ...Object.entries(utm),
    ];
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    const html =
      '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
      rows
        .map(([k, v]) =>
          `<tr><td style="color:#666;border-bottom:1px solid #eee"><b>${esc(k)}</b></td>` +
          `<td style="border-bottom:1px solid #eee">${esc(String(v)).replace(/\n/g, '<br>')}</td></tr>`)
        .join('') +
      '</table>';

    const t = getTransporter();
    if (!t) {
      // Sin SMTP configurado (desarrollo): se loguea y se responde OK.
      console.log('[contacto] SMTP no configurado. Lead recibido:\n' + text);
      return res.json({ ok: true, dev: true });
    }

    try {
      await t.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.MAIL_TO || 'info@flaks.com.ar',
        replyTo: data.email || undefined,
        subject: `Nueva consulta web — ${data.servicio || 'General'} — ${data.nombre}`,
        text,
        html,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('[contacto] Error enviando mail:', err.message);
      res.status(502).json({
        ok: false,
        error: 'No pudimos enviar tu consulta. Escribinos por WhatsApp y te respondemos enseguida.',
      });
    }
  }
);

module.exports = router;
