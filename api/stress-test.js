module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    let body = '';

    // Parse request body from stream
    for await (const chunk of req) {
      body += chunk;
    }

    const data = body ? JSON.parse(body) : {};
    const { address } = data;

    if (!address) {
      res.status(400).end(JSON.stringify({ error: 'Missing address' }));
      return;
    }

    res.status(200).end(JSON.stringify({
      message: 'API is working!',
      address: address,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
};
