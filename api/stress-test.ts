import NodeGeocoder from 'node-geocoder';
import { generateProceduralReport } from '../src/utils/stressTestUtils.js';

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

async function geocodeAddress(address: string) {
  try {
    const results = await geocoder.geocode(address);
    if (results.length === 0) {
      return null;
    }
    const first = results[0];
    if (!first.latitude || !first.longitude) {
      return null;
    }
    return {
      lat: first.latitude,
      lng: first.longitude,
      city: first.city || first.county || 'Unknown',
      state: first.state || 'Unknown',
      country: first.country || 'Unknown',
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

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

    // Geocode the address to get real coordinates
    const geocoded = await geocodeAddress(address);

    // Generate procedural report (use actual address, not hardcoded cities)
    const report = generateProceduralReport(address);
    report.dataQuality = 'ESTIMATED';
    report.baselinePriceNote = 'Property price estimated via procedural simulation.';

    // If geocoding succeeded, use real coordinates
    if (geocoded) {
      report.location = `${geocoded.city}, ${geocoded.state}, ${geocoded.country}`;
      report.coordinates = `${geocoded.lat.toFixed(4)}° N, ${geocoded.lng.toFixed(4)}° E`;
    }

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
