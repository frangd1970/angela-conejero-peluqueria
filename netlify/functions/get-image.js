const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const key = params.key;
  if (!key) {
    return { statusCode: 400, body: 'Falta el parámetro key' };
  }

  try {
    const store = getStore('fotos');
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
