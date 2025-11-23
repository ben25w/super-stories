exports.handler = async (event) => {
  const fileId = event.queryStringParameters.id;
  
  if (!fileId) {
    return { statusCode: 400, body: 'Missing file ID' };
  }
  
  try {
    const response = await fetch(`https://drive.google.com/uc?export=view&id=${fileId}`);
    const buffer = await response.arrayBuffer();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type'),
        'Cache-Control': 'public, max-age=86400'
      },
      isBase64Encoded: true,
      body: Buffer.from(buffer).toString('base64')
    };
  } catch (error) {
    return { statusCode: 500, body: 'Error fetching image' };
  }
};
