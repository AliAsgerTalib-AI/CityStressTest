/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StressTestReport, HorizonProjection, Specialists, SpecialistVerdict, MetricUncertainty, MetricProvenance, GeographicSignal } from '../types';

// Helper to create LOW-confidence procedural uncertainty
function createProceduralUncertainty(
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string = 'Procedural simulation'
): MetricUncertainty {
  return {
    confidenceLevel: 'LOW',
    lowScenario: lowValue,
    baselineScenario: baselineValue,
    highScenario: highValue,
    failureChainNarrative: narrative,
    provenance: {
      source,
      verified: false,
      uncertainty: '±20%',
    },
  };
}

// Helper for MEDIUM confidence (mix of data + model)
function createMixedUncertainty(
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string,
  uncertainty: string = '±10%'
): MetricUncertainty {
  return {
    confidenceLevel: 'MEDIUM',
    lowScenario: lowValue,
    baselineScenario: baselineValue,
    highScenario: highValue,
    failureChainNarrative: narrative,
    provenance: {
      source,
      verified: false,
      uncertainty,
    },
  };
}

// Helper to create LOW-confidence procedural geographic signal
function createProceduregeographicSignal(
  name: string,
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string = 'Procedural simulation'
): GeographicSignal {
  return {
    name,
    value: baselineValue,
    uncertainty: {
      confidenceLevel: 'LOW',
      lowScenario: lowValue,
      baselineScenario: baselineValue,
      highScenario: highValue,
      failureChainNarrative: narrative,
      provenance: {
        source,
        verified: false,
        uncertainty: '±20%',
      },
    },
  };
}

// Helper for MEDIUM confidence geographic signal
function createMixedGeographicSignal(
  name: string,
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string,
  uncertainty: string = '±10%'
): GeographicSignal {
  return {
    name,
    value: baselineValue,
    uncertainty: {
      confidenceLevel: 'MEDIUM',
      lowScenario: lowValue,
      baselineScenario: baselineValue,
      highScenario: highValue,
      failureChainNarrative: narrative,
      provenance: {
        source,
        verified: false,
        uncertainty,
      },
    },
  };
}

function generateDynamicSpecialistNarrative(
  specialist: string,
  location: string,
  horizon: number,
  metrics: any,
  isCoastal: boolean,
  isDesert: boolean
): string {
  // Generate location-specific narratives based on actual metrics
  const tempVal = parseFloat(metrics.averageTemp);
  const wetBulbVal = parseFloat(metrics.wetBulbTemp);
  const foundationVal = parseInt(metrics.foundationIntegrity);
  const floodVal = parseInt(metrics.floodProb);

  switch (specialist) {
    case 'macroEconomist':
      if (horizon <= 10) return `Near-term fundamentals remain sound with stable market absorption rates, but long-term cash flow models face headwinds from climate-driven insurance cost escalation.`;
      if (horizon <= 25) return `Mid-term viability strained as property tax escalations and insurance premium inflation exceed typical income growth trajectories in this micro-market.`;
      return `Long-term cash flow models collapse entirely; premium escalations and municipal debt levels render rental yields economically unsustainable.`;

    case 'structuralEngineer':
      if (horizon <= 15) return `Foundation integrity at ${foundationVal}%. Moisture intrusion in coastal areas accelerates concrete degradation and rebar corrosion pathways.`;
      if (horizon <= 50) return `Foundation integrity declining to ${foundationVal}%. Repeated wet-dry cycles compromise structural integrity; concrete alkalinity buffers depleted.`;
      return `Foundation integrity critically compromised at ${foundationVal}%. Structural repair costs exceed property residual value; total structural remediation required.`;

    case 'hydrogeologist':
      if (isCoastal) {
        if (horizon <= 15) return `Coastal aquifer salinity rising steadily. Groundwater intrusion threatens building foundations and subsurface utilities.`;
        if (horizon <= 50) return `Severe saltwater intrusion documented. Local bearing capacities degraded; subterranean materials experiencing accelerated corrosion.`;
        return `Aquifer completely depleted and contaminated with seawater. No viable freshwater source available; total reliance on tank-imported water.`;
      }
      return `Groundwater table stable but facing rising contamination risks from surface runoff concentration.`;

    case 'publicHealthEpidemiologist':
      if (wetBulbVal >= 29) return `CRITICAL: Wet-bulb temperature at ${wetBulbVal}°C exceeds human thermoregulation limits. Sustained outdoor exposure becomes lethal; indoor cooling mandatory for survival.`;
      if (wetBulbVal >= 27) return `Wet-bulb temperature at ${wetBulbVal}°C poses severe heat stress. Vulnerable populations face elevated heat-stroke and mortality risk.`;
      return `Wet-bulb temperature at ${wetBulbVal}°C remains manageable but rising. Mold and vector-borne disease risk increasing with sustained humidity.`;

    case 'gridUtilityEngineer':
      if (horizon <= 20) return `Grid capacity adequate but thermal stress on transformers increasing. Air-conditioning demand during peak seasons approaches local transformer limits.`;
      if (horizon <= 50) return `Critical grid instability: cooling demand exceeds transformer capacity. Rolling brownouts and blackouts occurring during heat waves.`;
      return `Grid failure risk extreme. Peak cooling demand permanently exceeds available generation capacity; blackouts become systemic.`;

    case 'zoningAttorney':
      if (horizon <= 20) return `Zoning stable but climate-driven flood zone remapping underway. Properties may face down-zoning in revised flood boundary updates.`;
      if (horizon <= 50) return `Flood plane boundary shifts triggering mandatory down-zoning. Regulatory setbacks reduce allowable building density and property usage.`;
      return `Property reclassified as uninhabitable flood zone. Zoning restrictions effectively prohibit residential rebuilding or new construction.`;

    case 'municipalPolicy':
      if (horizon <= 15) return `Municipal credit stable but storm defense costs rising. Property tax rates tracking upward to fund expanding coastal/flood defense infrastructure.`;
      if (horizon <= 50) return `Municipal debt level: ${metrics.municipalDebt}. Storm defense maintenance and repair budgets consuming majority of local tax base.`;
      return `Municipality in or near fiscal default. Tax base collapse; essential services (water, roads) severely degraded or non-functional.`;

    default:
      return `Data indicates horizon-dependent viability risks consistent with climate stress modeling.`;
  }
}

export function getSocialSentimentSpecialist(location: string, horizon: number): { verdict: 'BULLISH' | 'STABLE' | 'WATCH' | 'BEARISH' | 'DIVEST'; narrative: string } {
  const norm = location.toLowerCase();
  const isDesert = norm.includes("phoenix") || norm.includes("vegas") || norm.includes("dubai") || norm.includes("desert") || norm.includes("arizona") || norm.includes("texas") || norm.includes("houston") || norm.includes("austin");
  const isCoastal = norm.includes("miami") || norm.includes("beach") || norm.includes("florida") || norm.includes("fl") || norm.includes("ny") || norm.includes("york") || norm.includes("hk") || norm.includes("hong") || norm.includes("kong") || norm.includes("london") || norm.includes("coast") || norm.includes("sea") || norm.includes("san fran") || norm.includes("tokyo") || norm.includes("singapore") || norm.includes("sydney") || norm.includes("mumbai") || norm.includes("india");
  
  let verdict: 'BULLISH' | 'STABLE' | 'WATCH' | 'BEARISH' | 'DIVEST' = 'BULLISH';
  let narrative = "";

  if (horizon <= 10) {
    verdict = 'STABLE';
    if (isCoastal) {
      narrative = "NLP scoring of local media and resident forums shows 18% 'climate risk' mention density. Real estate hashtags are overwhelmingly positive (#dreamhome, #beachfront), though a minor rising trend is noted in search queries for 'sea wall maintenance fees' and 'high-tide street bypasses'. Fear factor remains structurally contained at 15%.";
    } else if (isDesert) {
      narrative = "Community boards hold positive outlooks but highlight summer temperature records. 'Drought' and 'HVAC' keyword clusters are high-volume but secondary to job market growth metrics. Sentiment scoring shows standard optimism; fear factor is a low 20%.";
    } else {
      narrative = "Discourse is dominated by standard local developments. Environmental keywords are rare (less than 5% density). Sentiment is robustly positive, with stable property investment mentions. Fear factor remains negligible at 10%.";
    }
  } else if (horizon <= 25) {
    verdict = 'WATCH';
    if (isCoastal) {
      narrative = "High anxiety clusters emerge. NLP semantic analysis reveals a 3.5x rise in 'storm surge' and 'reinsurance premiums' mentions on homeowner associations and neighborhood forums. Citizen action coalitions advocate for public beach defenses. Fear factor elevated to 42%.";
    } else if (isDesert) {
      narrative = "Public anxiety around municipal water allocations is climbing. Keyword trends 'groundwater drawdown' and 'heat dome' migrate into local planning debates. Discourse shifts to proactive defense; fear factor stabilizes at 48%.";
    } else {
      narrative = "Localized storm runoff debates and property tax hikes to fund culverts generate negative sentiment spikes. Keyword tracking shows rising user anxiety on basement moisture and flash flooding. Fear factor is 32%.";
    }
  } else if (horizon <= 50) {
    verdict = 'BEARISH';
    if (isCoastal) {
      narrative = "Significant negativity. Real estate review scrapings exhibit intense fear patterns ('uninsurable homes', 'mortgage denial'). Local property groups discuss managed relocation pathways. The discourse has turned highly emotional and skeptical. Fear factor stands at 72%.";
    } else if (isDesert) {
      narrative = "Severe climate stress and power brownout complaints plague civic forums. NLP models classify 75% of local property posts as 'frustrated' or 'hopeless' regarding high water costs. Panic buying shifts to Northern regions. Fear factor reaches 78%.";
    } else {
      narrative = "Intense discussions around drainage failure and utility rate hikes degrade standard optimism indices. Online forums carry constant mentions of 'municipal debt downgrades' and 'stormwater hazards'. Fear factor rises to 60%.";
    }
  } else {
    verdict = 'DIVEST';
    if (isCoastal) {
      narrative = "Complete capitulation. Public discourse is defined by existential panic and flight planning. Top crawled terms include 'abandoned dikes', 'stranded equity', and 'unhabitable zone'. Positive sentiment is practically non-existent. Fear factor is a critical 96%.";
    } else if (isDesert) {
      narrative = "Systemic exodus discussions. Community groups list dynamic relocation timelines as water supplies dry out. High volume of keyword triggers regarding 'grid failure blackouts' and 'mortal heat stroke'. Sentiment indices are deeply negative. Fear factor: 98%.";
    } else {
      narrative = "Sustained economic flight sentiment. Community forums have dissolved or pivoted entirely to managing retreat strategies. Key discussions focus on county bailout funds and building demolition orders. Fear factor remains high at 88%.";
    }
  }

  return { verdict, narrative };
}

// Generates procedural reports for any general urban location
export function generateProceduralReport(rawLocation: string): StressTestReport {
  const norm = rawLocation.trim().toLowerCase();
  
  // Choose standard base parameters based on keywords
  const isDesert = norm.includes("phoenix") || norm.includes("vegas") || norm.includes("dubai") || norm.includes("desert") || norm.includes("arizona") || norm.includes("texas") || norm.includes("houston") || norm.includes("austin");
  const isCoastal = norm.includes("miami") || norm.includes("beach") || norm.includes("florida") || norm.includes("fl") || norm.includes("ny") || norm.includes("york") || norm.includes("hk") || norm.includes("hong") || norm.includes("kong") || norm.includes("london") || norm.includes("coast") || norm.includes("sea") || norm.includes("san fran") || norm.includes("tokyo") || norm.includes("singapore") || norm.includes("sydney") || norm.includes("mumbai") || norm.includes("india") || norm.includes("rotterdam") || norm.includes("netherlands");

  let locationName = rawLocation;
  let coordinates = "40.7128° N, 74.0060° W";
  let startPrice = 450000;
  let transitionDecade = "2060s";
  let transitionCause = "Frequent severe storm surges and coastal aquifer salt contamination driving complete private reinsurance evacuation.";

  // Geo-specific high-fidelity values
  if (norm.includes("miami")) {
    locationName = "Miami Beach, Coastal Florida";
    coordinates = "25.7907° N, 80.1300° W";
    startPrice = 780000;
    transitionDecade = "2050s";
    transitionCause = "Extreme marine flooding combined with complete collapse of localized reinsurance markets and rapid groundwater limestone intrusion.";
  } else if (norm.includes("phoenix")) {
    locationName = "Desert Foothills, Phoenix, AZ";
    coordinates = "33.4484° N, 112.0740° W";
    startPrice = 420000;
    transitionDecade = "2070s";
    transitionCause = "Sustained sub-aquifer depletion combined with seasonal extreme heat waves breaking residential substation grid capacities.";
  } else if (norm.includes("mumbai") || norm.includes("india")) {
    locationName = "Mumbai Coastal Margin, Maharashtra, India";
    coordinates = "19.0760° N, 72.8777° E";
    startPrice = 0; // No verified market data available
    transitionDecade = "2060s";
    transitionCause = "Severe monsoon drainage overload, coupled with regional sea-level rise breaching coastal tidal barriers and driving civil water sanitization crises.";
  } else if (norm.includes("rotterdam")) {
    locationName = "Rotterdam Delta, Netherlands";
    coordinates = "51.9244° N, 4.4777° E";
    startPrice = 410000;
    transitionDecade = "2080s";
    transitionCause = "Slow dike maintenance cost escalation rendering local tax bases distressed, forcing a managed migration pathway internally.";
  } else if (norm.includes("sai kung") || norm.includes("hong kong")) {
    locationName = "Sai Kung Coastal Buffer, Hong Kong";
    coordinates = "22.3813° N, 114.2706° E";
    startPrice = 850000;
    transitionDecade = "2060s";
    transitionCause = "Severe storm-induced mudslides, repeated super typhoon damage to building structural basements, and steep premium hikes.";
  } else if (norm.includes("lahore")) {
    locationName = "Lahore Metropolitan Area, Punjab, Pakistan";
    coordinates = "31.5204° N, 74.3587° E";
    startPrice = 0; // No verified market data available for Pakistani real estate
    transitionDecade = "2055s";
    transitionCause = "Extreme heat waves exceeding wet-bulb limits, groundwater depletion, and monsoon intensification creating compounded climate stress on water security and urban habitability.";
  } else if (norm.includes("karachi")) {
    locationName = "Karachi Metropolitan Area, Sindh, Pakistan";
    coordinates = "24.8607° N, 67.0011° E";
    startPrice = 0; // No verified market data available for Pakistani real estate
    transitionDecade = "2050s";
    transitionCause = "Severe monsoon-driven flooding, coupled with sea-level rise inundating coastal infrastructure and urban water systems. Aquifer salinization renders freshwater resources non-viable.";
  } else if (norm.includes("pakistan")) {
    // Default Pakistan location (use Karachi as fallback)
    locationName = "Karachi Metropolitan Area, Sindh, Pakistan";
    coordinates = "24.8607° N, 67.0011° E";
    startPrice = 0;
    transitionDecade = "2050s";
    transitionCause = "Severe monsoon-driven flooding, coupled with sea-level rise inundating coastal infrastructure and urban water systems. Aquifer salinization renders freshwater resources non-viable.";
  } else {
    // Elegant procedural fallback based on length hashing to create beautiful variation
    const hash = rawLocation.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lat = (30 + (hash % 20)).toFixed(4);
    const lon = (-(60 + (hash % 60))).toFixed(4);
    coordinates = `${lat}° N, ${lon}° W`;
    startPrice = 280000 + (hash % 50) * 10000;
    transitionDecade = hash % 2 === 0 ? "2060s" : "2070s";
    
    if (isCoastal) {
      transitionCause = "Coastal high tide road submergence and repeated pluvial inundations forcing property insurers to permanently cancel standard policies.";
    } else if (isDesert) {
      transitionCause = "Unmitigated heat dome trends pushing local utility air conditioning electricity rates and cooling water limits past residential viability.";
    } else {
      transitionCause = "Escalating drainage system load demands leading to persistent basement sewer backups and regional water management surcharges.";
    }
  }

  const horizons = [5, 10, 15, 20, 25, 50, 75, 100];
  const projections = horizons.map((h): HorizonProjection => {
    const year = 2026 + h;
    
    // Status definitions over horizons
    let status: 'APPRECIATING ASSET' | 'STABLE ASSET' | 'WATCH' | 'SHIFTING TO LIABILITY' | 'STRANDED ASSET / TOTAL LOSS' = 'APPRECIATING ASSET';
    let assetAlpha = "+8.4%";
    let liabilityGap = "-2.1% Gap";

    if (h <= 10) {
      status = 'APPRECIATING ASSET';
      assetAlpha = h === 5 ? "+10.2%" : "+6.4%";
      liabilityGap = "No coverage gap";
    } else if (h <= 20) {
      status = 'STABLE ASSET';
      assetAlpha = "+2.1%";
      liabilityGap = "-8.5% Gap";
    } else if (h <= 25) {
      status = 'WATCH';
      assetAlpha = "-1.4%";
      liabilityGap = "-18.0% Gap";
    } else if (h <= 50) {
      status = 'SHIFTING TO LIABILITY';
      assetAlpha = "-6.2%";
      liabilityGap = "-42.0% Gap";
    } else {
      status = 'STRANDED ASSET / TOTAL LOSS';
      assetAlpha = "N/A";
      liabilityGap = "100% Uninsured";
    }

    // Pricing models
    let priceValue = startPrice;
    if (h <= 10) {
      priceValue = Math.floor(startPrice * (1 + h * 0.035));
    } else if (h <= 20) {
      priceValue = Math.floor(startPrice * (1.35 * (1 - (h - 10) * 0.015)));
    } else if (h <= 50) {
      priceValue = Math.floor(startPrice * 0.85 * Math.pow(0.96, h - 20));
    } else {
      priceValue = Math.floor(startPrice * 0.35 * Math.pow(0.92, h - 50));
    }
    
    // Safety clamp
    if (priceValue < 50000) priceValue = 0;
    
    const priceLabel = priceValue > 0 ? `$${(priceValue / 1000).toFixed(0)}k` : "$0 (Stranded Assets)";
    const utilityOpex = `+${(h * 3.2).toFixed(0)}% OPEX`;

    // Climate Metrics - location-specific
    let baseTemp = isDesert ? 38.5 : isCoastal ? 27.2 : 21.0;
    if (norm.includes("lahore")) {
      baseTemp = 24.6; // Lahore averages 24-25°C annually, summer peaks to 45+°C
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      baseTemp = 28.2; // Karachi averages 28-29°C, with summer peaks to 40+°C
    }
    const avgTemp = `${(baseTemp + h * 0.048).toFixed(1)}°C`;

    // Wet-bulb temperature - location-specific
    let baseWetBulb = 16.5;
    if (norm.includes("lahore")) {
      baseWetBulb = 21.5; // Lahore monsoon wet-bulb peaks at 25-28°C; continental climate
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      baseWetBulb = 25.0; // Karachi monsoon wet-bulb peaks at 28-30°C; avg is high
    } else if (norm.includes("mumbai") || norm.includes("india")) {
      baseWetBulb = 27.5; // Mumbai tropical monsoon peaks at ~28-29°C
    } else if (isCoastal) {
      baseWetBulb = 22.5;
    } else if (isDesert) {
      baseWetBulb = 19.0;
    }
    const wetBulb = `${(Math.min(32, baseWetBulb + h * 0.052)).toFixed(1)}°C`;

    // Heat index days - Karachi has 50+ extreme heat days/year
    let heatDaysBase = isDesert ? 45 : isCoastal ? 14 : 4;
    if (norm.includes("lahore")) {
      heatDaysBase = 48; // Lahore experiences 45-50 days of extreme heat annually
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      heatDaysBase = 52; // Karachi experiences 50+ days of extreme heat annually
    }
    const heatDays = `${Math.floor(heatDaysBase + h * 0.75)} Days/Yr`;

    const foundation = `${Math.max(15, Math.floor(100 - h * 0.68))}%`;

    // Flood probability - Karachi has severe monsoon flooding risk
    let floodBase = isCoastal ? 8 : 3;
    let floodMultiplier = isCoastal ? 0.88 : 0.35;
    if (norm.includes("lahore")) {
      floodBase = 12; // Lahore has monsoon and riverine flood risk, less severe than Karachi
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      floodBase = 15; // Karachi has documented major floods (2010: 20% of city, 2022: severe)
      floodMultiplier = 1.2; // Higher escalation due to monsoon risk
    }
    const flood = `${Math.min(100, Math.floor(floodBase + h * floodMultiplier))}% Decadal`;

    const hardiness = isCoastal ? "10b -> 11a" : isDesert ? "9a -> 10b" : "7b -> 8a";
    
    // Determine climate classification for hardiness zone
    let climateZone = hardiness;
    if (norm.includes("mumbai") || norm.includes("india")) {
      // Mumbai is tropical monsoon (Köppen: Aw) - using descriptive classification instead of USDA hardiness
      climateZone = "Tropical Monsoon (Aw) → Arid (BSh)";
    } else if (norm.includes("lahore")) {
      // Lahore is humid subtropical with monsoon influence (Köppen: Cwa) - continental variant
    } else if (norm.includes("karachi")) {
      // Karachi is semi-arid with monsoon influence (Köppen: BSh/Csa) - coastal variant
      climateZone = "Semi-Arid Coastal (BSh) → Arid (BWh)";
    }

    // Extract numeric values for uncertainty calculations
    const capRateValue = h > 50 ? "N/A" : `${(4.2 + h * 0.08).toFixed(1)}%`;
    const municipalDebtStatus = h <= 15 ? "STABLE" : h <= 25 ? "GROWING" : h <= 50 ? "CRITICAL" : "DEFAULT";
    const foundationIntegrityStr = foundation;
    const heatIndexDaysStr = heatDays;
    const heatIndexDaysNum = Math.floor(heatDaysBase + h * 0.75);
    const avgTempStr = avgTemp;
    const tempC = baseTemp + h * 0.048;
    const wetBulbTempStr = wetBulb;
    const wetBulbC = Math.min(32, baseWetBulb + h * 0.052);
    const freshwaterStatusStr = h <= 20 ? "SECURE" : h <= 50 ? "RATIONED" : "TANK-IMPORTED";
    const localAquiferStr = h <= 15 ? "SECURE" : h <= 50 ? "SALINITY RISING" : "DEPLETED";
    const floodProbStr = flood;
    const floodProbNum = Math.min(100, Math.floor(floodBase + h * floodMultiplier));
    const hardinessZoneStr = climateZone;

    const metricsState = {
      capRate: capRateValue,
      capRateUncertainty: h > 50 ? undefined : createProceduralUncertainty(
        capRateValue,
        `${(parseFloat(capRateValue) * 0.85).toFixed(1)}%`,
        `${(parseFloat(capRateValue) * 1.1).toFixed(1)}%`,
        `Cap rates adjust based on market risk perception and climate insurance costs. ` +
        `If municipal services remain stable, rates stabilize; if infrastructure fails, rates rise sharply.`
      ),

      municipalDebt: municipalDebtStatus,
      municipalDebtUncertainty: createProceduralUncertainty(
        municipalDebtStatus,
        municipalDebtStatus, // Low scenario same as baseline
        'CRITICAL', // High scenario worse
        `Municipal debt grows as climate adaptation and infrastructure repair costs accumulate. ` +
        `Fiscal pressure increases if property tax base shrinks due to out-migration or devaluation.`
      ),

      foundationIntegrity: foundationIntegrityStr,
      foundationIntegrityUncertainty: createProceduralUncertainty(
        foundationIntegrityStr,
        `${Math.max(5, parseFloat(foundationIntegrityStr) - 10)}%`,
        `${Math.min(100, parseFloat(foundationIntegrityStr) + 5)}%`,
        `Foundation integrity depends on soil stability and water table fluctuation. ` +
        `Saltwater intrusion and subsidence accelerate degradation; proper drainage slows it.`
      ),

      heatIndexDays: heatIndexDaysStr,
      heatIndexDaysUncertainty: createProceduralUncertainty(
        heatIndexDaysStr,
        `${Math.floor(heatIndexDaysNum * 0.7)} Days/Yr`,
        `${Math.floor(heatIndexDaysNum * 1.4)} Days/Yr`,
        `Heat index days increase as global temperatures rise and urban heat island effects intensify. ` +
        `Local cooling strategies (vegetation, reflective surfaces) can reduce this; paved sprawl accelerates it.`
      ),

      averageTemp: avgTempStr,
      averageTempUncertainty: createProceduralUncertainty(
        avgTempStr,
        `${(tempC - 0.5).toFixed(1)}°C`,
        `${(tempC + 1.2).toFixed(1)}°C`,
        `Average temperature rises as atmospheric CO2 accumulates. Exact warming rate depends on global emissions and regional climate feedback loops.`
      ),

      wetBulbTemp: wetBulbTempStr,
      wetBulbTempUncertainty: createProceduralUncertainty(
        wetBulbTempStr,
        `${(wetBulbC - 0.3).toFixed(1)}°C`,
        `${(wetBulbC + 0.8).toFixed(1)}°C`,
        `Wet-bulb temperature (perceived temperature and humidity combined) increases, making outdoor work and recreation dangerous at high values. ` +
        `Thresholds above 32°C become lethal for sustained exertion; above 35°C are dangerous for anyone.`
      ),

      freshwaterStatus: freshwaterStatusStr,
      freshwaterStatusUncertainty: createProceduralUncertainty(
        freshwaterStatusStr,
        freshwaterStatusStr, // Low scenario same as baseline
        freshwaterStatusStr === 'SECURE' ? 'TANK-IMPORTED' : 'CRITICAL',
        `Freshwater availability depends on aquifer recharge rates and regional groundwater competition. ` +
        `Drought, population growth, and sea level rise all reduce available freshwater; conservation policies can extend supply.`
      ),

      localAquifer: localAquiferStr,
      localAquiferUncertainty: createProceduralUncertainty(
        localAquiferStr,
        localAquiferStr,
        localAquiferStr === 'SECURE' ? 'SALINITY RISING' : 'CONTAMINATED',
        `Aquifer salinity rises as sea level rises and coastal groundwater is pulled inland. ` +
        `Inland aquifers face contamination from agricultural runoff and industrial activity. Salinity exceeding 2500 ppm triggers well abandonment.`
      ),

      floodProb: floodProbStr,
      floodProbUncertainty: createProceduralUncertainty(
        floodProbStr,
        `${Math.max(1, Math.floor(floodProbNum * 0.6))}% decadal`,
        `${Math.floor(floodProbNum * 1.8)}% decadal`,
        `Flood probability increases with sea level rise (+${h / 20}cm by ${2026 + h}) and intensified storm rainfall. ` +
        `Compound events (high tide + storm surge + rainfall) become more likely. Coastal protection investments can reduce this risk locally.`
      ),

      hardinessZone: hardinessZoneStr,
      hardinessZoneUncertainty: createProceduralUncertainty(
        hardinessZoneStr,
        hardinessZoneStr, // Low scenario same
        hardinessZoneStr, // High scenario same (zone shifts are gradual)
        `USDA hardiness zones shift as temperature increases. Zones move approximately 100 miles north per 1°C warming. ` +
        `This affects which plants/trees survive; species adapted to cooler zones may fail.`
      ),
    };

    let microBio = isCoastal
      ? "Increasing coastal salinity alters native brackish marshes, leading to loss of mangrove filtration buffers."
      : "Sustained high summer dry indexes stress native vegetation, expanding regional brush fire boundaries significantly.";

    if (norm.includes("lahore")) {
      microBio = "Lahore's riverine ecosystem and agricultural plains face water stress and salinization. Native migratory bird populations threatened by habitat loss and pollution; invasive species colonize degraded wetlands.";
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      microBio = "Mangrove forests in Karachi's deltas face saline intrusion and erosion. Native avifauna and marine species face habitat loss; invasive species proliferate in disturbed wetlands.";
    }

    let geoHazard = isCoastal
      ? "Low-lying tidal shelf is subject to combined spring high tide surges and frequent coastal pluvial backflows."
      : "Structural soil subsidence occurs due to rapid seasonal soil moisture dry-out, destabilizing building concrete piles.";

    if (norm.includes("lahore")) {
      geoHazard = "Lahore faces monsoon flooding (July-September with intense precipitation) and riverine overflow from Ravi River. Urban flooding disrupts low-lying neighborhoods. Heat extremes (45°C+) degrade urban infrastructure and water quality.";
    } else if (norm.includes("karachi") || norm.includes("pakistan")) {
      geoHazard = "Karachi faces compound monsoon flooding (June-September with 100+ mm rainfall events) and cyclonic storm surge. Low-lying coastal areas vulnerable to 1-2m inundation. Urban drainage systems regularly overwhelmed.";
    }

    // Specialists - dynamic narratives based on actual metrics
    const specialists = {
      macroEconomist: {
        verdict: h <= 15 ? 'BULLISH' : h <= 25 ? 'WATCH' : h <= 50 ? 'BEARISH' : 'DIVEST',
        narrative: generateDynamicSpecialistNarrative('macroEconomist', locationName, h, metricsState, isCoastal, isDesert)
      },
      zoningAttorney: {
        verdict: h <= 20 ? 'STABLE' : h <= 50 ? 'WATCH' : 'DIVEST',
        narrative: generateDynamicSpecialistNarrative('zoningAttorney', locationName, h, metricsState, isCoastal, isDesert)
      },
      municipalPolicy: {
        verdict: h <= 15 ? 'STABLE' : h <= 50 ? 'BEARISH' : 'DIVEST',
        narrative: generateDynamicSpecialistNarrative('municipalPolicy', locationName, h, metricsState, isCoastal, isDesert)
      },
      structuralEngineer: {
        verdict: h <= 25 ? 'STABLE' : h <= 50 ? 'WATCH' : 'BEARISH',
        narrative: generateDynamicSpecialistNarrative('structuralEngineer', locationName, h, metricsState, isCoastal, isDesert)
      },
      hydrogeologist: {
        verdict: h <= 15 ? 'STABLE' : h <= 50 ? 'WATCH' : 'DIVEST',
        narrative: generateDynamicSpecialistNarrative('hydrogeologist', locationName, h, metricsState, isCoastal, isDesert)
      },
      urbanSociologist: {
        verdict: h <= 25 ? 'BULLISH' : h <= 50 ? 'WATCH' : 'BEARISH',
        narrative: "Quality of life ratings dip as seasonal premium infrastructure fees rise, driving high-income households toward cooler, inland plateaus."
      },
      demographicMigration: {
        verdict: h <= 15 ? 'BULLISH' : h <= 50 ? 'WATCH' : 'DIVEST',
        narrative: "Proactive families relocate earlier to hedge educational portfolios, causing a gradual multi-decade neighborhood demographic hollow-out."
      },
      geopoliticalAnalyst: {
        verdict: h <= 25 ? 'BULLISH' : h <= 50 ? 'STABLE' : 'WATCH',
        narrative: "Constitutional security buffers remain mostly sound, though localized funding shortfalls stimulate civic litigation over municipal defense dikes."
      },
      environmentalSpecialist: {
        verdict: h <= 15 ? 'BULLISH' : h <= 25 ? 'STABLE' : h <= 50 ? 'WATCH' : 'BEARISH',
        narrative: "Wildlife counts decline while weed and insect distribution bounds shift northward, creating local structural infestation risks."
      },
      insuranceActuary: {
        verdict: h <= 10 ? 'BULLISH' : h <= 20 ? 'WATCH' : h <= 50 ? 'BEARISH' : 'DIVEST',
        narrative: "Loss performance curves show an exponential trend. Selected top-tier reinsurance carriers plan to permanently restrict standard writing by mid-century."
      },
      gridUtilityEngineer: {
        verdict: h <= 20 ? 'BULLISH' : h <= 50 ? 'WATCH' : 'BEARISH',
        narrative: generateDynamicSpecialistNarrative('gridUtilityEngineer', locationName, h, metricsState, isCoastal, isDesert)
      },
      publicHealthEpidemiologist: {
        verdict: h <= 15 ? 'BULLISH' : h <= 50 ? 'WATCH' : 'BEARISH',
        narrative: generateDynamicSpecialistNarrative('publicHealthEpidemiologist', locationName, h, metricsState, isCoastal, isDesert)
      },
      socialSentiment: getSocialSentimentSpecialist(locationName, h)
    } as Specialists;

    let brutalVerdict = `The asset exhibits strong near-term performance with premium yield potentials. However, long-term climate vulnerability vectors indicate steep transition risks to liability as local insurance systems degrade significantly.`;
    if (h >= 50) {
      brutalVerdict = `**[CRITICAL VIABILITY THRESHOLD SURPASSED]** Long-term climatic damage renders the residential asset functionally illiquid. Severe structural erosion, extreme utility cost surges, and the withdrawal of private insurance backfills drive a permanent structural devaluation write-down.`;
    }

    return {
      horizon: h,
      year,
      status,
      assetAlpha,
      liabilityCoverageGap: liabilityGap,
      brutalVerdict,
      metrics: metricsState,
      specialists,
      environmentalBaselines: {
        freshwaterAndPollution: "Local water tables remain within stable parameters but face rising filtration costs as runoff loads increase.",
        macroAndMicroHazards: geoHazard,
        climateWeatherBaselines: "Rainfall cycles show increased variance, with heavier episodic bursts separated by extended warm dry stretches.",
        floraFaunaImpact: microBio
      },
      pricingPoint: {
        year,
        value: priceValue,
        label: priceLabel,
        utilityOpExIncrease: utilityOpex
      }
    };
  });

  // Determine data quality
  let dataQuality: 'VERIFIED_WITH_GROUNDING' | 'ESTIMATED' | 'NO_DATA_AVAILABLE' = 'ESTIMATED';
  let baselinePriceNote = 'Estimated baseline based on procedural simulation';

  if (norm.includes("mumbai") || norm.includes("india")) {
    dataQuality = 'NO_DATA_AVAILABLE';
    baselinePriceNote = 'No verified property market data available. Baseline price set to 0. Requires real estate market input or Gemini API with Google Search grounding.';
  } else if (norm.includes("karachi") || norm.includes("pakistan")) {
    dataQuality = 'NO_DATA_AVAILABLE';
    baselinePriceNote = 'No verified property market data available. Baseline price set to 0. Pakistani real estate market data requires live research. Climate projections based on monsoon patterns and documented flooding history. Requires Gemini API with Google Search grounding for verified property valuations.';
  }

  return {
    location: locationName,
    coordinates,
    baselinePriceSFH: startPrice,
    baselinePriceNote,
    dataQuality,
    transitionLiabilityDecade: transitionDecade,
    transitionTriggerCause: transitionCause,
    projections
  };
}

export function modulateReportWithSensitivity(report: StressTestReport, sensitivity: number): StressTestReport {
  if (sensitivity === 50) return report;

  const isNetNegative = sensitivity < 25;
  const isTargeted = sensitivity >= 25 && sensitivity < 45;
  const isDelayed = sensitivity > 55 && sensitivity <= 75;
  const isRunaway = sensitivity > 75;

  const modulatedProjections = report.projections.map((proj) => {
    const h = proj.horizon;

    let value = proj.pricingPoint.value;
    const baselinePrice = report.baselinePriceSFH;

    if (sensitivity < 50) {
      const scale = (50 - sensitivity) / 50;
      const devalueAmount = baselinePrice - value;
      if (devalueAmount > 0) {
        value = Math.round(value + (devalueAmount * scale * 0.65));
      } else {
        value = Math.round(value * (1 + (scale * 0.10)));
      }
    } else {
      const scale = (sensitivity - 50) / 50;
      if (h >= 15) {
        value = Math.round(value * (1 - (scale * 0.75)));
      } else {
        value = Math.round(value * (1 - (scale * 0.20)));
      }
    }

    const priceLabel = value > 0 ? `$${(value / 1000).toFixed(0)}k` : "$0 (Stranded / Toxic)";

    const originalAvgTempMatch = proj.metrics.averageTemp.match(/([0-9.]+)/);
    const originalAvgTemp = originalAvgTempMatch ? parseFloat(originalAvgTempMatch[1]) : 25;
    const tempDeltaPerYear = ((sensitivity - 50) / 50) * 0.06; 
    const tempOffset = tempDeltaPerYear * h;
    const newAvgTemp = Math.max(10, originalAvgTemp + tempOffset);
    const averageTempStr = `${newAvgTemp.toFixed(1)}°C`;

    const originalWetBulbMatch = proj.metrics.wetBulbTemp.match(/([0-9.]+)/);
    const originalWetBulb = originalWetBulbMatch ? parseFloat(originalWetBulbMatch[1]) : 20;
    const wetBulbOffset = tempDeltaPerYear * 0.75 * h; 
    const newWetBulb = Math.max(8, originalWetBulb + wetBulbOffset);
    const isMortal = newWetBulb >= 29; 
    const wetBulbTempStr = `${newWetBulb.toFixed(1)}°C${isMortal ? ' (CRITICAL HEAT)' : ' (Manageable)'}`;

    const opexMultiplier = 1 + ((sensitivity - 50) / 100);
    const rawOpexNumberMatch = proj.pricingPoint.utilityOpExIncrease.match(/([0-9.]+)/);
    const rawOpexNumber = rawOpexNumberMatch ? parseFloat(rawOpexNumberMatch[1]) : h * 2.2;
    const newOpexNumber = Math.max(0, Math.round(rawOpexNumber * opexMultiplier * 100) / 100);
    const utilityOpExIncreaseStr = `+${newOpexNumber.toFixed(0)}% OPEX`;

    const originalFloodMatch = proj.metrics.floodProb.match(/([0-9.]+)/);
    const originalFlood = originalFloodMatch ? parseFloat(originalFloodMatch[1]) : 15;
    const floodMultiplier = 0.4 + (sensitivity / 83.3); 
    const newFlood = Math.min(100, Math.max(0, originalFlood * floodMultiplier));
    const floodProbStr = proj.metrics.floodProb.toLowerCase().includes("decadal") 
      ? `${newFlood.toFixed(0)}% Decadal`
      : `${newFlood.toFixed(0)}% Year`;

    const originalFoundationMatch = proj.metrics.foundationIntegrity.match(/([0-9.]+)/);
    const originalFoundation = originalFoundationMatch ? parseFloat(originalFoundationMatch[1]) : 95;
    let foundationDelta = 0;
    if (sensitivity < 50) {
      foundationDelta = ((50 - sensitivity) / 50) * (100 - originalFoundation) * 0.5;
    } else {
      foundationDelta = -((sensitivity - 50) / 50) * originalFoundation * 0.4;
    }
    const newFoundation = Math.min(100, Math.max(0, Math.round((originalFoundation + foundationDelta) * 10) / 10));
    const foundationIntegrityStr = `${Number.isNaN(newFoundation) ? '0' : newFoundation.toFixed(0)}% (${newFoundation > 80 ? 'Good' : newFoundation > 50 ? 'Stressed' : 'Compromised'})`;

    let status = proj.status;
    let assetAlpha = proj.assetAlpha;
    let liabilityCoverageGap = proj.liabilityCoverageGap;

    if (sensitivity < 25) {
      if (h <= 25) {
        status = 'APPRECIATING ASSET';
        assetAlpha = "+11.8%";
        liabilityCoverageGap = "-1.5% Gap";
      } else if (h <= 75) {
        status = 'STABLE ASSET';
        assetAlpha = "+3.1%";
        liabilityCoverageGap = "-8.0% Gap";
      } else {
        status = 'WATCH';
        assetAlpha = "-0.8%";
        liabilityCoverageGap = "-15.0% Gap";
      }
    } else if (sensitivity >= 25 && sensitivity < 50) {
      if (h <= 15) {
        status = 'APPRECIATING ASSET';
        assetAlpha = "+10.4%";
        liabilityCoverageGap = "-2.0% Gap";
      } else if (h <= 50) {
        status = 'STABLE ASSET';
        assetAlpha = "+2.1%";
        liabilityCoverageGap = "-14.0% Gap";
      } else {
        status = 'SHIFTING TO LIABILITY';
        assetAlpha = "-4.5%";
        liabilityCoverageGap = "-35.0% Gap";
      }
    } else if (sensitivity > 50 && sensitivity <= 75) {
      if (h <= 10) {
        status = 'STABLE ASSET';
        assetAlpha = "+1.2%";
        liabilityCoverageGap = "-18.5% Gap";
      } else if (h <= 25) {
        status = 'WATCH';
        assetAlpha = "-2.0%";
        liabilityCoverageGap = "-38.0% Gap";
      } else {
        status = 'STRANDED ASSET / TOTAL LOSS';
        assetAlpha = "N/A";
        liabilityCoverageGap = "100% Uninsured";
      }
    } else if (sensitivity > 75) {
      if (h <= 5) {
        status = 'WATCH';
        assetAlpha = "-1.8%";
        liabilityCoverageGap = "-45.0% Gap";
      } else {
        status = 'STRANDED ASSET / TOTAL LOSS';
        assetAlpha = "N/A";
        liabilityCoverageGap = "100% Uninsured";
      }
    }

    let brutalVerdict = proj.brutalVerdict;
    if (sensitivity < 25) {
      brutalVerdict = `**[COOPERATIVE CARBON NET-NEGATIVE ACTIVATED]** Global warming index stabilized below +1.3°C. The local sovereign authority receives direct ecological preservation payouts. Standard properties are sheltered from sudden sea level surges and retain real asset monetization channels up to a century.`;
    } else if (sensitivity < 45) {
      brutalVerdict = `**[MANAGED STABILIZATION PATHWAY]** Global transition successfully adheres to carbon tax compliance bounds. Chronic temperature climbs are restricted to +1.6°C, preserving structural integrity of foundational beds. Property values hold robust long-term resistance.`;
    } else if (sensitivity > 75) {
      brutalVerdict = `**[RUNAWAY EMISSIONS / CLIMATE CHAOS]** Fossil expansion generates localized thermal heat storms (${newWetBulb.toFixed(1)}°C wet bulb). Municipal sewer lines are structurally abandoned as the city retreats. Standard mortgage/actuarial lines completely withdraw. Asset valuation wrote down to zero.`;
    }

    const originalSpecialists = proj.specialists;
    const modulatedSpecialists = {} as Specialists;

    (Object.keys(originalSpecialists) as Array<keyof Specialists>).forEach((key) => {
      const spec = originalSpecialists[key];
      if (!spec) return;
      const originalVerdict = spec.verdict;
      
      const scoreMap: Record<string, number> = { BULLISH: 5, STABLE: 4, WATCH: 3, BEARISH: 2, DIVEST: 1 };
      const reverseMap: Record<number, 'BULLISH' | 'STABLE' | 'WATCH' | 'BEARISH' | 'DIVEST'> = {
        5: 'BULLISH', 4: 'STABLE', 3: 'WATCH', 2: 'BEARISH', 1: 'DIVEST'
      };

      let numericScore = scoreMap[originalVerdict] || 3;

      if (sensitivity < 25) {
        numericScore += 2;
      } else if (sensitivity < 45) {
        numericScore += 1;
      } else if (sensitivity > 55 && sensitivity <= 75) {
        numericScore -= 1;
      } else if (sensitivity > 75) {
        numericScore -= 2;
      }

      numericScore = Math.max(1, Math.min(5, numericScore));
      const newVerdict = reverseMap[numericScore];

      let narrativeComment = "";
      if (isNetNegative) {
        narrativeComment = ` [Net-Negative Carbon Action resolves standard systemic risk. Sub-sea intrusion is arrested, supporting long-term valuation holds.]`;
      } else if (isTargeted) {
        narrativeComment = ` [Successful global carbon tax targets reduce severe weather surge volatility. Value channels hold stable.]`;
      } else if (isDelayed) {
        narrativeComment = ` [Delayed policy compliance triggers earlier insurance rate hikes and mild grid overload cycles during seasonal dry days.]`;
      } else if (isRunaway) {
        narrativeComment = ` [CRITICAL ALERT: Runaway carbon levels trigger hyper-extreme weather spikes, complete loss of power utility grids, and absolute capital write-down.]`;
      }

      modulatedSpecialists[key] = {
        verdict: newVerdict,
        narrative: `${spec.narrative}${narrativeComment}`
      };
    });

    return {
      ...proj,
      status,
      assetAlpha,
      liabilityCoverageGap,
      brutalVerdict,
      pricingPoint: {
        ...proj.pricingPoint,
        value,
        label: priceLabel,
        utilityOpExIncrease: utilityOpExIncreaseStr
      },
      metrics: {
        ...proj.metrics,
        averageTemp: averageTempStr,
        wetBulbTemp: wetBulbTempStr,
        floodProb: floodProbStr,
        foundationIntegrity: foundationIntegrityStr,
        heatIndexDays: isNetNegative ? "4 Days/Yr" : isTargeted ? "8 Days/Yr" : isRunaway ? "120 Days/Yr" : proj.metrics.heatIndexDays
      },
      specialists: modulatedSpecialists
    } as HorizonProjection;
  });

  return {
    ...report,
    projections: modulatedProjections
  };
}

export function generateEconomicViability(municipality: string, horizons: number[]): {
  medianHouseholdIncome: GeographicSignal;
  povertyRate: GeographicSignal;
  unemploymentRate: GeographicSignal;
} {
  return {
    medianHouseholdIncome: createProceduregeographicSignal(
      'Median Household Income',
      '$75,000',
      '$68,000',
      '$82,000',
      'Median household income declines as job losses accelerate from climate-related business closures. Out-migration of higher-income households amplifies this effect.'
    ),
    povertyRate: createProceduregeographicSignal(
      'Poverty Rate',
      '14%',
      '10%',
      '22%',
      'Poverty rate rises as employment opportunities shrink and property values decline. Climate stress disproportionately impacts vulnerable populations.'
    ),
    unemploymentRate: createProceduregeographicSignal(
      'Unemployment Rate',
      '5.2%',
      '3.8%',
      '8.5%',
      'Unemployment increases as businesses relocate and the economy contracts. Labor force participation declines as people leave the region.'
    ),
  };
}

export function generateInfrastructureResilience(municipality: string, horizons: number[]): {
  broadbandAvailability: GeographicSignal;
  utilitySystemAge: GeographicSignal;
} {
  return {
    broadbandAvailability: createProceduregeographicSignal(
      'Broadband Availability',
      '88% population covered',
      '85%',
      '92%',
      'Broadband expansion depends on municipal investment. Climate disasters can disrupt service and reduce future investment as fiscal stress increases.'
    ),
    utilitySystemAge: createProceduregeographicSignal(
      'Utility System Age',
      '35 years avg',
      '28 years',
      '42 years',
      'Aging utility infrastructure requires increasing maintenance. Climate stress (floods, heat) accelerates degradation and failures.'
    ),
  };
}

export function generateDemographicTrends(censusTract: string, horizons: number[]): {
  population: GeographicSignal;
  ageDistribution: GeographicSignal;
  educationLevel: GeographicSignal;
  netMigrationRate: GeographicSignal;
} {
  return {
    population: createProceduregeographicSignal(
      'Population',
      '245,000',
      '220,000',
      '270,000',
      'Population declines as out-migration exceeds natural increase. This compounds fiscal stress: shrinking tax base, fewer workers.'
    ),
    ageDistribution: createProceduregeographicSignal(
      'Age Distribution',
      'Median age 41 years',
      '38 years',
      '44 years',
      'Population aging accelerates as young adults migrate away. Higher dependency ratios increase municipal service costs.'
    ),
    educationLevel: createProceduregeographicSignal(
      'Education Level',
      '32% Bachelor\'s degree or higher',
      '28%',
      '38%',
      'Education levels may rise in-place (remaining population more educated) or stagnate if out-migration is selective. Trend depends on local economy.'
    ),
    netMigrationRate: createProceduregeographicSignal(
      'Net Migration Rate',
      '-0.5%/year',
      '-2.0%/year',
      '+0.8%/year',
      'Net migration turns negative as climate stress increases. People relocate to safer regions; this accelerates as climate impacts worsen.'
    ),
  };
}

export function generateClimateMigration(lat: number, lng: number, horizons: number[]): {
  climateRefugeeInflowProjection: GeographicSignal;
  climateRefugeeOutflowProjection: GeographicSignal;
  temperatureExposure: GeographicSignal;
  floodExposureOfOriginRegions: GeographicSignal;
} {
  return {
    climateRefugeeInflowProjection: createProceduregeographicSignal(
      'Climate Refugee Inflow Projection',
      '+1.2% population/decade from climate stress',
      '+0.3%',
      '+3.5%',
      'Climate refugees flow toward climate havens. This region may receive refugees from hotter/wetter areas, increasing population pressure.'
    ),
    climateRefugeeOutflowProjection: createProceduregeographicSignal(
      'Climate Refugee Outflow Projection',
      '-0.8% population/decade to safer regions',
      '-0.2%',
      '-2.1%',
      'Local residents leave for safer climates as hazards intensify. This compounds population decline and fiscal stress.'
    ),
    temperatureExposure: createProceduregeographicSignal(
      'Temperature Exposure',
      '+2.8°C by 2075 (vs. 2020 baseline)',
      '+2.0°C',
      '+3.8°C',
      'Temperature rise drives heat stress, cooling demand, and agricultural stress. Extreme heat days increase exponentially above 2°C warming.'
    ),
    floodExposureOfOriginRegions: createProceduregeographicSignal(
      'Flood Exposure of Climate Refugee Origin Regions',
      '22% of potential origin regions face >20% flood risk by 2075',
      '15%',
      '35%',
      'Rising sea levels and intense precipitation push flooding in origin regions. Flood-stressed regions send climate refugees to inland safe zones.'
    ),
  };
}

export function generateSocialFabric(municipality: string, horizons: number[]): {
  civicParticipationRate: GeographicSignal;
  communityStabilityIndex: GeographicSignal;
  politicalAlignmentWithAdaptation: GeographicSignal;
  resilienceNewsSentiment: GeographicSignal;
} {
  return {
    civicParticipationRate: createProceduregeographicSignal(
      'Civic Participation Rate',
      '56% voter turnout (2020)',
      '48%',
      '64%',
      'Civic participation declines with out-migration and reduced optimism. Declining participation reduces political will for climate adaptation.'
    ),
    communityStabilityIndex: createProceduregeographicSignal(
      'Community Stability Index',
      '62/100 (moderate)',
      '45/100',
      '75/100',
      'Community stability depends on economic opportunity and perceived safety. Climate stress erodes both. Stability declines as out-migration accelerates.'
    ),
    politicalAlignmentWithAdaptation: createProceduregeographicSignal(
      'Political Alignment with Climate Adaptation',
      '58% population in climate-aligned districts',
      '42%',
      '72%',
      'Political will for adaptation varies by district. Migration patterns shift political alignment. Without political will, adaptation investment lags.'
    ),
    resilienceNewsSentiment: createProceduregeographicSignal(
      'Community Resilience News Sentiment',
      '38% positive, 42% negative, 20% neutral',
      '25% positive',
      '55% positive',
      'News sentiment reflects community perception of climate risk. Negative sentiment reduces optimism and adaptation investment. Risk spirals.'
    ),
  };
}
