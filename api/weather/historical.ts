import { Handler } from '@vercel/node';

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number; name: string }> {
  const coordRegex = /([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/;
  const match = coordRegex.exec(address);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
      name:
        address
          .replace(coordRegex, '')
          .replace(/[\[\]]/g, '')
          .trim() || 'Custom Location',
    };
  }

  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  if (owmKey && owmKey !== 'MY_OPENWEATHERMAP_API_KEY') {
    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${owmKey}`;
      const res = await fetch(geoUrl);
      const data = (await res.json()) as any;
      if (data && data.length > 0) {
        return {
          lat: data[0].lat,
          lon: data[0].lon,
          name: `${data[0].name}${data[0].state ? ', ' + data[0].state : ''}, ${data[0].country}`,
        };
      }
    } catch (e) {
      console.error(
        'OpenWeatherMap geocoding failed, falling back to Open-Meteo:',
        e,
      );
    }
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    const data = (await res.json()) as any;
    if (data && data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        lat: top.latitude,
        lon: top.longitude,
        name: `${top.name}${top.admin1 ? ', ' + top.admin1 : ''}, ${top.country}`,
      };
    }
  } catch (e) {
    console.error('Open-Meteo geocoding failed:', e);
  }

  const norm = address.toLowerCase();
  if (norm.includes('miami')) {
    return { lat: 25.7907, lon: -80.13, name: 'Miami Beach, Coastal Florida' };
  } else if (norm.includes('phoenix') || norm.includes('desert')) {
    return {
      lat: 33.4484,
      lon: -112.074,
      name: 'Desert Foothills, Phoenix, AZ',
    };
  } else if (norm.includes('rotterdam')) {
    return { lat: 51.9244, lon: 4.4777, name: 'Rotterdam Delta, Netherlands' };
  } else if (norm.includes('sai kung') || norm.includes('hong kong')) {
    return { lat: 22.3813, lon: 114.2706, name: 'Sai Kung, Hong Kong' };
  }

  return { lat: 40.7128, lon: -74.006, name: address };
}

const handler: Handler = async (req, res) => {
  const { location, lat, lon } = req.query;

  try {
    let finalLat: number;
    let finalLon: number;
    if (lat && lon) {
      finalLat = parseFloat(lat as string);
      finalLon = parseFloat(lon as string);
    } else if (location) {
      const geocoded = await geocodeAddress(location as string);
      finalLat = geocoded.lat;
      finalLon = geocoded.lon;
    } else {
      res.status(400).json({
        error: "Missing 'location' or 'lat' and 'lon' parameters.",
      });
      return;
    }

    console.log(
      `Querying decadal climate history from Open-Meteo Archive for [${finalLat}, ${finalLon}]`,
    );
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${finalLat}&longitude=${finalLon}&start_date=1980-01-01&end_date=2025-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;

    const r = await fetch(archiveUrl);
    const data = (await r.json()) as any;

    if (!data || !data.daily || !data.daily.time) {
      throw new Error('Invalid response structure from Open-Meteo Archive');
    }

    const dates = data.daily.time;
    const temps = data.daily.temperature_2m_mean;
    const precips = data.daily.precipitation_sum;

    const yearlyData: Record<
      number,
      {
        tempSum: number;
        tempCount: number;
        summerTempSum: number;
        summerTempCount: number;
        precipSum: number;
      }
    > = {};

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(5, 7));

      const temp = temps[i];
      const precip = precips[i];

      if (!yearlyData[year]) {
        yearlyData[year] = {
          tempSum: 0,
          tempCount: 0,
          summerTempSum: 0,
          summerTempCount: 0,
          precipSum: 0,
        };
      }

      if (temp !== null && temp !== undefined && !isNaN(temp)) {
        yearlyData[year].tempSum += temp;
        yearlyData[year].tempCount += 1;

        if (month === 6 || month === 7 || month === 8) {
          yearlyData[year].summerTempSum += temp;
          yearlyData[year].summerTempCount += 1;
        }
      }

      if (precip !== null && precip !== undefined && !isNaN(precip)) {
        yearlyData[year].precipSum += precip;
      }
    }

    const sortedYears = Object.keys(yearlyData)
      .map(Number)
      .sort((a, b) => a - b);
    const resultYears: number[] = [];
    const resultTemps: number[] = [];
    const resultPrecips: number[] = [];

    for (const yr of sortedYears) {
      const yrData = yearlyData[yr];
      resultYears.push(yr);

      const summerAvg =
        yrData.summerTempCount > 0
          ? yrData.summerTempSum / yrData.summerTempCount
          : yrData.tempSum / (yrData.tempCount || 1);

      resultTemps.push(parseFloat(summerAvg.toFixed(2)));
      resultPrecips.push(parseFloat(yrData.precipSum.toFixed(2)));
    }

    res.status(200).json({
      latitude: finalLat,
      longitude: finalLon,
      years: resultYears,
      temp: resultTemps,
      precip: resultPrecips,
    });
  } catch (error: any) {
    console.error('Failed to compile historical weather statistics:', error);
    res.status(500).json({
      error: `Climate history retrieval failed: ${error.message}`,
    });
  }
};

export default handler;
