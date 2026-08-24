const { getStore } = require('@netlify/blobs');

const ADMIN_KEY = 'Tijeras2026!';
const MAX_BASE64_LENGTH = 6 * 1024 * 1024; // ~4.5MB de imagen real

function fotosStore() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'fotos', siteID: siteID, token: token });
  }
  return getStore('fotos');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  const headers = event.headers || {};
  const key = headers['x-admin-key'] || headers['X-Admin-Key'];
  if (key !== ADMIN_KEY) {
    return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'No autorizado' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const campo = payload.campo;
  const dataBase64 = payload.dataBase64;
  const contentType = payload.contentType || 'image/jpeg';

  if (!campo || !dataBase64) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Falta campo o imagen' }) };
  }
  if (dataBase64.length > MAX_BASE64_LENGTH) {
    return { statusCode: 413, headers: corsHeaders(), body: JSON.stringify({ error: 'La foto pesa demasiado (máximo aprox. 4MB)' }) };
  }

  try {
    const store = fotosStore();
    const safeCampo = String(campo).replace(/[^a-zA-Z0-9_-]/g, '');
    const blobKey = safeCampo + '-' + Date.now();
    const buffer = Buffer.from(dataBase64, 'base64');
    await store.set(blobKey, buffer, { metadata: { contentType: contentType } });

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const url = 'https://' + host + '/.netlify/functions/get-image?key=' + encodeURIComponent(blobKey);

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true, url: url }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'No se pudo guardar la foto', detail: String(err) }) };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
