import { generateProceduralReport } from '../src/utils/stressTestUtils.js';

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = {};

    // Handle both string and object body
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (req.body) {
      body = req.body;
    }

    const { address } = body;

    if (!address) {
      return res.status(400).json({ error: 'Missing address' });
    }

    // Generate procedural report (no Gemini API on serverless)
    const report = generateProceduralReport(address);
    report.dataQuality = 'ESTIMATED';
    report.baselinePriceNote = 'Property price estimated via procedural simulation.';

    return res.status(200).json({
      report,
      source: 'ESTIMATED',
      dataQuality: 'ESTIMATED'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
};
