const { getStore } = require('@netlify/blobs');

function fotosStore() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'fotos', siteID: siteID, token: token });
  }
  return getStore('fotos');
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const key = params.key;
  if (!key) {
    return { statusCode: 400, body: 'Falta el parámetro key' };
  }

  try {
    const store = fotosStore();
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!result) {
      return { statusCode: 404, body: 'No encontrada' };
    }
    const contentType = (result.metadata && result.metadata.contentType) || 'image/jpeg';
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      body: Buffer.from(result.data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error al leer la foto: ' + String(err) };
  }
};
