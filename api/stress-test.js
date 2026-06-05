module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { address } = req.body || {};
  if (!address) {
    res.status(400).json({ error: 'Missing address' });
    return;
  }

  res.status(200).json({
    message: 'API is working!',
    address: address,
    timestamp: new Date().toISOString()
  });
};
