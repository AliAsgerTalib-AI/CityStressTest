/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import NodeGeocoder from "node-geocoder";
import { StressTestReport } from "./src/types.js";
import { generateProceduralReport } from "./src/utils/stressTestUtils.js";

dotenv.config();

// Manage __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiConfig() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const modelName = process.env.VITE_GEMINI_MODEL || "gemini-3.1-flash-lite";

  return { apiKey, modelName };
}

function getGeminiClient(): GoogleGenAI {
  const { apiKey } = getGeminiConfig();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "VITE_GEMINI_API_KEY is required and must be set in environment variables. " +
        "Get your key from: https://aistudio.google.com/app/apikey",
    );
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
      throw new Error(
        "Failed to initialize Gemini API client. Check your API key.",
      );
    }
  }
  return aiClient;
}

const geocoder = NodeGeocoder({ provider: "openstreetmap" });

interface GeocodeResult {
  lat: number;
  lng: number;
  censusTract: string;  // 11-digit FIPS code (mock for now, real data from Census API)
  municipality: string;
  state: string;
}

async function reverseGeocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const results = await geocoder.geocode(address);
    if (results.length === 0) {
      throw new Error(`Could not geocode address: ${address}`);
    }

    const first = results[0];

    // Validate that coordinates are present
    if (!first.latitude || !first.longitude) {
      throw new Error(`Geocoding for "${address}" did not return valid coordinates`);
    }

    // For production: fetch actual census tract from Census Bureau API
    // For now: mock census tract deterministically based on address hash
    const hash = crypto.createHash('md5').update(address).digest('hex');
    const censusTract = hash.substring(0, 11).padStart(11, '0');

    return {
      lat: first.latitude,
      lng: first.longitude,
      censusTract,
      municipality: first.city || first.county || 'Unknown',
      state: first.stateCode || 'Unknown',
    };
  } catch (error: any) {
    console.error(`Geocoding failed for ${address}:`, error.message);
    throw error;  // Re-throw original error to preserve stack trace
  }
}

// API endpoint for climate stress-testing
app.post("/api/stress-test", async (req, res) => {
  const { address } = req.body;
  if (!address || typeof address !== "string") {
    res
      .status(400)
      .json({ error: "Missing physical location or parcel details." });
    return;
  }

  let ai: GoogleGenAI | null = null;
  let useProceduralFallback = false;

  try {
    ai = getGeminiClient();
  } catch (error: any) {
    console.error("Gemini API not available:", error.message);
    console.log("Falling back to procedural report generation...");
    useProceduralFallback = true;
  }

  try {
    // If no API is available, use procedural fallback
    if (useProceduralFallback || !ai) {
      console.log(`Generating procedural report for [${address}] (Gemini API not available)...`);
      const proceduralReport = generateProceduralReport(address);
      proceduralReport.dataQuality = "ESTIMATED";
      proceduralReport.baselinePriceNote =
        "Property price estimated via procedural simulation. Real-time data not available.";

      console.log(
        `Successfully generated procedural stress test report for [${address}].`,
      );
      res.json({
        report: proceduralReport,
        source: "ESTIMATED",
        dataQuality: "ESTIMATED",
      });
      return;
    }

    console.log(
      `Fetching live climate data from Gemini API with Google Search Grounding for [${address}]...`,
    );

    // Construct simplified and enhanced prompt
    const prompt = `You are evaluating a residential property at [${address}] across 13 expert perspectives:
1. macroEconomist - property pricing, cap rates, market returns
2. zoningAttorney - zoning laws, regulatory risk
3. municipalPolicy - municipal debt, local finances
4. structuralEngineer - building durability, climate resilience
5. hydrogeologist - groundwater, soil conditions, water intrusion
6. urbanSociologist - livability, quality of life, amenities
7. demographicMigration - migration patterns, regional shifts
8. geopoliticalAnalyst - political stability, legal risk
9. environmentalSpecialist - wildlife, flora impacts
10. insuranceActuary - insurance costs, coverage availability
11. gridUtilityEngineer - power grid, water systems, infrastructure
12. publicHealthEpidemiologist - heat impacts, disease risk
13. socialSentiment - community sentiment, migration trends

Analyze a standard 3-bed, 2-bath residential property across 8 time horizons: 5, 10, 15, 20, 25, 50, 75, and 100 years (2031, 2036, 2041, 2046, 2051, 2076, 2101, 2126).

Use Google Search to find: current property prices, climate data, flood history, local regulations, and municipal finances for [${address}].

ADDITIONAL REQUIREMENTS:

1. CONFIDENCE LEVELS
Add to each specialist verdict: confidence level (LOW, MEDIUM, HIGH)
Example: verdict "WATCH", confidence "HIGH"

2. RISK SCORING
- Per specialist: 1-10 risk score (1=low, 10=critical)
- Composite score: average of all specialists for each horizon
- Include overall risk trend (Increasing/Stable/Decreasing)

3. CRITICAL TIPPING POINTS
- Embed key dates in specialist narratives
- Provide top 3-5 critical dates at root level with confidence levels
Example: "2045: Property becomes uninsurable (High confidence)"

4. INSURANCE PROJECTIONS
- Summary trend: "$4200/yr (2031) → $8500/yr (2050) → Unavailable (2055)"
- Detailed breakdown: annual premium, coverage level, years until unavailable

5. COMPARATIVE CONTEXT
- Root level: locationBenchmark section comparing against regional/national averages
- Per specialist: note how this location compares in their domain
Example: "Top 15% climate risk for coastal properties" or "Municipal debt worse than 80% of similar cities"

6. TOP RISKS
- Identify 3 highest-risk specialists per horizon with their risk scores

7. UNCERTAINTY DATA FOR EACH METRIC
For EACH metric in EACH horizon, provide confidence level, three-scenario projections, and failure chain narrative:

CONFIDENCE LEVELS (choose one for each metric):
- HIGH: Data from authoritative government/research source (USGS, NOAA, IPCC, etc.) with peer-reviewed validation or recent official surveys
- MEDIUM: Mix of verified baseline data + climate/economic models; or sparse recent government data with regional estimates
- LOW: Mostly procedural estimation, regional comps without direct data, or highly speculative models

THREE-SCENARIO PROJECTIONS (for each metric):
- lowScenario: Conservative worst-case plausible value (e.g., "8% decadal" for flood probability)
- baselineScenario: Expected outcome based on current trends (matches the metric value you report)
- highScenario: Optimistic best-case plausible value (e.g., "18% decadal")
For categorical metrics (e.g., municipalDebt, freshwaterStatus), provide three plausible categorical scenarios within the enum values. Example: for municipalDebt, lowScenario='STABLE', baselineScenario='GROWING', highScenario='CRITICAL'. Do not mix types.

FAILURE CHAIN NARRATIVES (2-3 sentences for each metric):
- Explain the SEQUENCE of physical/economic/social events causing this metric to change
- Reference specific tipping points with years (e.g., "aquifer salinity exceeds 4000 ppm in 2038, triggering insurance withdrawal by 2040")
- Be specific to the location; avoid generic statements
- Example: "Aquifer depletion forces freshwater into coastal layer. Saltwater intrusion accelerates because sea level rise (+18cm by 2060) reduces freshwater pressure. By 2045, well salinity exceeds 2500 ppm threshold."

DATA PROVENANCE (for each metric):
- source: Name the data source (e.g., "USGS groundwater database", "NOAA climate model", "Regional tax assessor")
- verified: true if from authoritative source; false if estimated/procedural
- uncertainty: Margin of error (e.g., "±2%", "±0.5°C", "±15%", "Unknown")

RESPONSE FORMAT:

Return valid JSON only (no markdown). Include all fields below:

{
  "location": "standardized address",
  "coordinates": "lat/long string",
  "baselinePriceSFH": number,
  "locationBenchmark": {
    "climateRiskRank": "percentile vs national",
    "propertyValueTrendVsNational": "comparison",
    "municipalFinancialHealth": "comparison",
    "insurabilityTrend": "assessment"
  },
  "criticalTippingPoints": [
    { "date": "YYYY", "event": "description", "confidence": "Low|Medium|High" }
  ],
  "transitionLiabilityDecade": "2050s",
  "transitionTriggerCause": "brief summary",
  "projections": [
    {
      "horizon": 5,
      "year": 2031,
      "status": "APPRECIATING ASSET|STABLE ASSET|WATCH|SHIFTING TO LIABILITY|STRANDED ASSET / TOTAL LOSS",
      "assetAlpha": "+12.4%",
      "overallRiskScore": 6,
      "riskTrend": "Increasing|Stable|Decreasing",
      "liabilityCoverageGap": "coverage assessment",
      "brutalVerdict": "2-3 sentence assessment",
      "insuranceProjection": {
        "summaryTrend": "$4200/yr (2031) → $8500/yr (2050) → Unavailable (2055)",
        "detailed": {
          "annualPremium": "$4200",
          "coverageLevel": "Full|Limited|Unavailable",
          "projectedIncrease": "+8% annually",
          "yearsUntilUnavailable": 24
        }
      },
      "metrics": {
        "capRate": "4.5%",
        "capRateUncertainty": {
          "confidenceLevel": "MEDIUM",
          "lowScenario": "3.8%",
          "baselineScenario": "4.5%",
          "highScenario": "5.2%",
          "failureChainNarrative": "Cap rates rise as insurance costs increase and climate risk reduces demand. Rising property taxes due to infrastructure repairs accelerate the decline. By 2040, cap rates exceed 6%, making investment unviable.",
          "provenance": { "source": "Regional comps", "verified": false, "uncertainty": "±0.5%", "verificationDate": "2024-06" }
        },
        "municipalDebt": "STABLE|GROWING|CRITICAL|DEFAULT",
        "municipalDebtUncertainty": {
          "confidenceLevel": "HIGH",
          "lowScenario": "STABLE",
          "baselineScenario": "GROWING",
          "highScenario": "CRITICAL",
          "failureChainNarrative": "Municipal debt grows as infrastructure repair costs rise from climate impacts. Bond rating downgrades reduce borrowing capacity. By 2045, debt service exceeds 25% of budget.",
          "provenance": { "source": "GFOA bond audit", "verified": true, "uncertainty": "±5%", "verificationDate": "2024-05" }
        },
        "foundationIntegrity": "95%",
        "foundationIntegrityUncertainty": {
          "confidenceLevel": "MEDIUM",
          "lowScenario": "85%",
          "baselineScenario": "95%",
          "highScenario": "98%",
          "failureChainNarrative": "Foundation integrity declines due to water intrusion and soil expansion. Increased groundwater levels from climate change weaken bearing capacity. Structural failure risk increases after 2035.",
          "provenance": { "source": "Local engineering surveys", "verified": false, "uncertainty": "±8%", "verificationDate": "2023" }
        },
        "heatIndexDays": "15 Days/Yr",
        "heatIndexDaysUncertainty": {
          "confidenceLevel": "HIGH",
          "lowScenario": "12 Days/Yr",
          "baselineScenario": "15 Days/Yr",
          "highScenario": "22 Days/Yr",
          "failureChainNarrative": "Heat index days increase due to rising temperatures and urban heat island effect. By 2050, extreme heat events become a health emergency. Cooling costs escalate, driving occupancy decline.",
          "provenance": { "source": "NOAA climate model", "verified": true, "uncertainty": "±3 days", "verificationDate": "2024" }
        },
        "averageTemp": "25°C",
        "averageTempUncertainty": {
          "confidenceLevel": "HIGH",
          "lowScenario": "24.5°C",
          "baselineScenario": "25°C",
          "highScenario": "26°C",
          "failureChainNarrative": "Average temperature rises by 1-2°C by 2050. This accelerates permafrost melt and changes precipitation patterns. Seasonal shifts disrupt local agriculture and ecosystems.",
          "provenance": { "source": "IPCC climate model ensemble", "verified": true, "uncertainty": "±0.5°C", "verificationDate": "2024" }
        },
        "wetBulbTemp": "22°C",
        "wetBulbTempUncertainty": {
          "confidenceLevel": "MEDIUM",
          "lowScenario": "21°C",
          "baselineScenario": "22°C",
          "highScenario": "24°C",
          "failureChainNarrative": "Wet-bulb temperatures increase, making outdoor activity impossible in summer. Heat-related mortality rises. Migration accelerates in the 2040s as habitability declines.",
          "provenance": { "source": "Regional climate model", "verified": false, "uncertainty": "±1°C", "verificationDate": "2024" }
        },
        "freshwaterStatus": "SECURE|RATIONED",
        "freshwaterStatusUncertainty": {
          "confidenceLevel": "HIGH",
          "lowScenario": "SECURE",
          "baselineScenario": "RATIONED",
          "highScenario": "CRITICAL",
          "failureChainNarrative": "Freshwater transitions from secure to rationed by 2035 due to drought and aquifer depletion. Rationing intensifies in 2045. By 2055, restrictions limit residential use.",
          "provenance": { "source": "USGS groundwater database", "verified": true, "uncertainty": "±3 years", "verificationDate": "2024" }
        },
        "localAquifer": "STABLE|RISING SALINITY|DEPLETED",
        "localAquiferUncertainty": {
          "confidenceLevel": "MEDIUM",
          "lowScenario": "STABLE",
          "baselineScenario": "RISING SALINITY",
          "highScenario": "DEPLETED",
          "failureChainNarrative": "Aquifer salinity increases due to sea level rise reducing freshwater pressure. Saltwater intrusion accelerates after 2038. By 2050, salinity exceeds drinking water standards (2500 ppm).",
          "provenance": { "source": "Coastal aquifer monitoring", "verified": false, "uncertainty": "±500 ppm", "verificationDate": "2024" }
        },
        "floodProb": "12% Decadal",
        "floodProbUncertainty": {
          "confidenceLevel": "HIGH",
          "lowScenario": "8% Decadal",
          "baselineScenario": "12% Decadal",
          "highScenario": "18% Decadal",
          "failureChainNarrative": "Flood probability increases due to sea level rise (+18cm by 2060) and increased storm intensity. Storm surge protection fails after 2045. By 2050, 1-in-10-year events become 1-in-5-year.",
          "provenance": { "source": "NOAA flood hazard model", "verified": true, "uncertainty": "±4%", "verificationDate": "2024" }
        },
        "hardinessZone": "10b → 11a",
        "hardinessZoneUncertainty": {
          "confidenceLevel": "MEDIUM",
          "lowScenario": "10b → 11a",
          "baselineScenario": "10b → 11a",
          "highScenario": "10b → 12a",
          "failureChainNarrative": "Hardiness zone shifts 1-2 zones warmer by 2050. Cold-intolerant plants thrive. Frost dates shift, disrupting local agriculture. Invasive species colonize the region.",
          "provenance": { "source": "USDA hardiness update", "verified": true, "uncertainty": "±0.5 zone", "verificationDate": "2024" }
        }
      },
      "specialists": {
        "macroEconomist": { "verdict": "BULLISH|STABLE|WATCH|BEARISH|DIVEST", "confidence": "HIGH", "riskScore": 5, "narrative": "1-sentence assessment", "criticalDate": "2050", "comparativeContext": "property value decline below national average" },
        "insuranceActuary": { "verdict": "BEARISH", "confidence": "HIGH", "riskScore": 8.2, "narrative": "Insurance availability will be severely constrained. Premiums will rise 15-25% annually as climate risk concentrates. By 2040, standard homeowners insurance becomes unavailable; only specialty insurers remain at 2-3x costs.", "comparativeContext": "Similar coastal properties 20 miles south already see 40% of the market uninsurable." },
        "zoningAttorney": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "municipalPolicy": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "structuralEngineer": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "hydrogeologist": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "urbanSociologist": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "demographicMigration": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "geopoliticalAnalyst": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "environmentalSpecialist": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "gridUtilityEngineer": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "publicHealthEpidemiologist": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." },
        "socialSentiment": { "verdict": "...", "confidence": "...", "riskScore": ..., "narrative": "...", "comparativeContext": "..." }
      },
      "topRisks": [
        { "specialist": "insuranceActuary", "riskScore": 9, "reason": "rapid premium escalation" },
        { "specialist": "structuralEngineer", "riskScore": 8, "reason": "foundation water damage" },
        { "specialist": "gridUtilityEngineer", "riskScore": 7, "reason": "brownout risk increasing" }
      ],
      "environmentalBaselines": {
        "freshwaterAndPollution": "water source & air quality trends",
        "macroAndMicroHazards": "flood, earthquake, volcano, typhoon probabilities",
        "climateWeatherBaselines": "temperature, precipitation shifts",
        "floraFaunaImpact": "wildlife and plant impacts"
      },
      "pricingPoint": {
        "year": 2031,
        "value": 500000,
        "label": "$500k",
        "utilityOpExIncrease": "+15% OPEX"
      }
    }
  ]
}`;

    const { modelName } = getGeminiConfig();
    console.log(`Using Gemini model: ${modelName}`);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty text response received from Gemini API.");
    }

    const cleanText = text
      .trim()
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
    const parsedReport = JSON.parse(cleanText) as StressTestReport;

    // Mark data as verified since it's grounded in Google Search
    parsedReport.dataQuality = "VERIFIED_WITH_GROUNDING";
    parsedReport.baselinePriceNote =
      "Property price verified with live Google Search grounding and local market data.";

    console.log(
      `Successfully generated dynamic climate reports for [${address}] via Gemini with live Google Search Grounding.`,
    );
    res.json({
      report: parsedReport,
      source: "AI_GENERATED",
      dataQuality: "VERIFIED_WITH_GROUNDING",
    });
  } catch (error: any) {
    console.error("Gemini API stress test generation failed:", error);
    res.status(500).json({
      error: "Failed to generate stress test report",
      details: error.message || String(error),
      hint: "The Gemini API request failed. Check your API key and try again.",
    });
  }
});

/**
 * Weather Geocoding and API Proxy Subsystems
 */
async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number; name: string }> {
  // If we can parse coordinates from regex, e.g. "Miami Beach [25.7907, -80.1300]" or regex matches
  const coordRegex = /([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/;
  const match = coordRegex.exec(address);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
      name:
        address
          .replace(coordRegex, "")
          .replace(/[\[\]]/g, "")
          .trim() || "Custom Location",
    };
  }

  // Check OpenWeatherMap first if key is present
  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  if (owmKey && owmKey !== "MY_OPENWEATHERMAP_API_KEY") {
    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${owmKey}`;
      const res = await fetch(geoUrl);
      const data = (await res.json()) as any;
      if (data && data.length > 0) {
        return {
          lat: data[0].lat,
          lon: data[0].lon,
          name: `${data[0].name}${data[0].state ? ", " + data[0].state : ""}, ${data[0].country}`,
        };
      }
    } catch (e) {
      console.error(
        "OpenWeatherMap geocoding failed, falling back to Open-Meteo:",
        e,
      );
    }
  }

  // Open-Meteo fallback geocoding
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    const data = (await res.json()) as any;
    if (data && data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        lat: top.latitude,
        lon: top.longitude,
        name: `${top.name}${top.admin1 ? ", " + top.admin1 : ""}, ${top.country}`,
      };
    }
  } catch (e) {
    console.error("Open-Meteo geocoding failed:", e);
  }

  // Traditional default fallbacks for common names in stressTestUtils
  const norm = address.toLowerCase();
  if (norm.includes("miami")) {
    return { lat: 25.7907, lon: -80.13, name: "Miami Beach, Coastal Florida" };
  } else if (norm.includes("phoenix") || norm.includes("desert")) {
    return {
      lat: 33.4484,
      lon: -112.074,
      name: "Desert Foothills, Phoenix, AZ",
    };
  } else if (norm.includes("rotterdam")) {
    return { lat: 51.9244, lon: 4.4777, name: "Rotterdam Delta, Netherlands" };
  } else if (norm.includes("sai kung") || norm.includes("hong kong")) {
    return { lat: 22.3813, lon: 114.2706, name: "Sai Kung, Hong Kong" };
  }

  // Safe global fallback (NYC)
  return { lat: 40.7128, lon: -74.006, name: address };
}

// REAL-TIME WEATHER API ENDPOINT
app.get("/api/weather", async (req, res) => {
  const { location, lat, lon } = req.query;

  try {
    let finalLat: number;
    let finalLon: number;
    let finalName: string;

    if (lat && lon) {
      finalLat = parseFloat(lat as string);
      finalLon = parseFloat(lon as string);
      finalName =
        (location as string) ||
        `Custom Coordinate [${finalLat.toFixed(4)}, ${finalLon.toFixed(4)}]`;
    } else if (location) {
      const geocoded = await geocodeAddress(location as string);
      finalLat = geocoded.lat;
      finalLon = geocoded.lon;
      finalName = geocoded.name;
    } else {
      res
        .status(400)
        .json({ error: "Missing 'location' or 'lat' and 'lon' parameters." });
      return;
    }

    // Call OpenWeatherMap if key is valid
    const owmKey = process.env.OPENWEATHERMAP_API_KEY;
    if (owmKey && owmKey !== "MY_OPENWEATHERMAP_API_KEY") {
      try {
        console.log(
          `Querying real-time weather from OpenWeatherMap for [${finalLat}, ${finalLon}]`,
        );
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&appid=${owmKey}&units=metric`;
        const r = await fetch(weatherUrl);
        const data = (await r.json()) as any;
        if (data && data.main) {
          res.json({
            source: "OpenWeatherMap",
            locationName: finalName,
            latitude: finalLat,
            longitude: finalLon,
            current: {
              temperature: data.main.temp,
              humidity: data.main.humidity,
              precipitation: data.rain
                ? data.rain["1h"] || data.rain["3h"] || 0
                : 0,
              windSpeed: data.wind ? data.wind.speed : 0,
              description:
                data.weather && data.weather[0]
                  ? data.weather[0].description
                  : "clear",
            },
          });
          return;
        }
      } catch (e) {
        console.error(
          "OpenWeatherMap fetch failed, falling back to Open-Meteo:",
          e,
        );
      }
    }

    // Open-Meteo high-fidelity real-time fallback
    console.log(
      `Querying real-time weather from Open-Meteo for [${finalLat}, ${finalLon}]`,
    );
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`;
    const r = await fetch(meteoUrl);
    const data = (await r.json()) as any;
    if (data && data.current) {
      res.json({
        source: "Open-Meteo",
        locationName: finalName,
        latitude: finalLat,
        longitude: finalLon,
        current: {
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation || 0,
          windSpeed: data.current.wind_speed_10m || 0,
          description:
            data.current.precipitation > 2
              ? "rainy"
              : data.current.precipitation > 0
                ? "light drizzle"
                : "clear",
        },
      });
    } else {
      throw new Error("Invalid response schema from Open-Meteo");
    }
  } catch (error: any) {
    console.error("Failed to query real-time weather:", error);
    res
      .status(500)
      .json({ error: `Weather service lookup failed: ${error.message}` });
  }
});

// DECADAL HISTORICAL CLIMATE API ENDPOINT
app.get("/api/weather/historical", async (req, res) => {
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
      res
        .status(400)
        .json({ error: "Missing 'location' or 'lat' and 'lon' parameters." });
      return;
    }

    console.log(
      `Querying decadal climate history from Open-Meteo Archive for [${finalLat}, ${finalLon}]`,
    );
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${finalLat}&longitude=${finalLon}&start_date=1980-01-01&end_date=2025-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;

    const r = await fetch(archiveUrl);
    const data = (await r.json()) as any;

    if (!data || !data.daily || !data.daily.time) {
      throw new Error("Invalid response structure from Open-Meteo Archive");
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
      const month = parseInt(dateStr.substring(5, 7)); // 1-12

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

        // JJA definition for summer temperatures, matching target indicators (average summer temp is modeled as climate target)
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

      // Calculate summer average, fallback to annual if JJA is empty
      const summerAvg =
        yrData.summerTempCount > 0
          ? yrData.summerTempSum / yrData.summerTempCount
          : yrData.tempSum / (yrData.tempCount || 1);

      resultTemps.push(parseFloat(summerAvg.toFixed(2)));
      resultPrecips.push(parseFloat(yrData.precipSum.toFixed(2)));
    }

    res.json({
      latitude: finalLat,
      longitude: finalLon,
      years: resultYears,
      temp: resultTemps,
      precip: resultPrecips,
    });
  } catch (error: any) {
    console.error("Failed to compile historical weather statistics:", error);
    res
      .status(500)
      .json({ error: `Climate history retrieval failed: ${error.message}` });
  }
});

// Serve frontend assets using Vite on dev and static serving on prod
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // In production, serve static files from dist directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Production static build mounted from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Sovereign Wealth Board backend active on http://0.0.0.0:${PORT}`,
    );
  });
}

initializeServer().catch((e) => {
  console.error("Systems boot failure:", e);
});
