/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpecialistVerdict {
  verdict: 'BULLISH' | 'STABLE' | 'WATCH' | 'BEARISH' | 'DIVEST';
  narrative: string;
}

export interface MetricProvenance {
  source: string;           // e.g. "USGS", "NOAA", "Climate model ensemble", "Regional comps"
  verified: boolean;        // true = authoritative source; false = estimated/procedural
  uncertainty: string;      // e.g. "±2%", "±0.5°C", "±15%"
  verificationDate?: string; // ISO format e.g. "2024-03"
}

export interface MetricUncertainty {
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lowScenario: string;       // Worst-case value
  baselineScenario: string;  // Expected value
  highScenario: string;      // Best-case value
  failureChainNarrative: string; // 2-3 sentences explaining why it changes
  provenance: MetricProvenance;
}

export interface HorizonMetrics {
  capRate: string;
  capRateUncertainty?: MetricUncertainty;

  municipalDebt: string; // "STABLE", "GROWING", "CRITICAL", "DEFAULT"
  municipalDebtUncertainty?: MetricUncertainty;

  foundationIntegrity: string; // e.g. "95%", "12%"
  foundationIntegrityUncertainty?: MetricUncertainty;

  heatIndexDays: string; // e.g. "12 Days/Yr"
  heatIndexDaysUncertainty?: MetricUncertainty;

  averageTemp: string; // e.g. "24°C"
  averageTempUncertainty?: MetricUncertainty;

  wetBulbTemp: string; // e.g. "21°C"
  wetBulbTempUncertainty?: MetricUncertainty;

  freshwaterStatus: string; // e.g. "SECURE", "TANK-IMPORTED"
  freshwaterStatusUncertainty?: MetricUncertainty;

  localAquifer: string; // e.g. "SECURE", "SALINITY RISING", "CONTAMINATED"
  localAquiferUncertainty?: MetricUncertainty;

  floodProb: string; // e.g. "12% decadal"
  floodProbUncertainty?: MetricUncertainty;

  hardinessZone: string; // e.g. "10b -> 11a"
  hardinessZoneUncertainty?: MetricUncertainty;
}

export interface Specialists {
  macroEconomist: SpecialistVerdict;
  zoningAttorney: SpecialistVerdict;
  municipalPolicy: SpecialistVerdict;
  structuralEngineer: SpecialistVerdict;
  hydrogeologist: SpecialistVerdict;
  urbanSociologist: SpecialistVerdict;
  demographicMigration: SpecialistVerdict;
  geopoliticalAnalyst: SpecialistVerdict;
  environmentalSpecialist: SpecialistVerdict;
  insuranceActuary: SpecialistVerdict;
  gridUtilityEngineer: SpecialistVerdict;
  publicHealthEpidemiologist: SpecialistVerdict;
  socialSentiment?: SpecialistVerdict;
}

export interface EnvironmentalBaselines {
  freshwaterAndPollution: string;
  macroAndMicroHazards: string;
  climateWeatherBaselines: string;
  floraFaunaImpact: string;
}

export interface PricingPoint {
  year: number;
  value: number; // Inflation-adjusted price of a standard 3B/2B SFH
  label: string;  // e.g. "$520k"
  utilityOpExIncrease: string; // e.g. "+15% OPEX"
}

export interface GeographicSignal {
  name: string;                    // e.g. "Municipal Debt Ratio"
  value: string;                   // e.g. "45%", "CRITICAL", "Declining"
  uncertainty: MetricUncertainty;  // Reuse Phase 1 type
}

export interface GeographicScaleContext {
  scale: 'city' | 'region';
  location: string;  // e.g. "San Francisco", "California"

  // Economic Viability (3 signals)
  economicViability: {
    medianHouseholdIncome: GeographicSignal;
    povertyRate: GeographicSignal;
    unemploymentRate: GeographicSignal;
  };

  // Demographic Trends (4 signals)
  demographicTrends: {
    population: GeographicSignal;
    ageDistribution: GeographicSignal;
    educationLevel: GeographicSignal;
    netMigrationRate: GeographicSignal;
  };

  // Infrastructure Resilience (2 signals)
  infrastructureResilience: {
    broadbandAvailability: GeographicSignal;
    utilitySystemAge: GeographicSignal;
  };
}

export interface GeographicContext {
  city: GeographicScaleContext;
  region: GeographicScaleContext;
}

export interface HorizonProjection {
  horizon: number; // 5, 10, 15, 20, 25, 50, 75, 100
  year: number; // e.g. 2031, 2036, ..., 2126
  status: 'APPRECIATING ASSET' | 'STABLE ASSET' | 'WATCH' | 'SHIFTING TO LIABILITY' | 'STRANDED ASSET / TOTAL LOSS';
  assetAlpha: string; // e.g. "+12.4%", "-5.2%", "N/A"
  liabilityCoverageGap: string; // e.g. "-$10.2M" (meaning the insurance gap)
  brutalVerdict: string; // An unsentimental summaries block
  metrics: HorizonMetrics;
  specialists: Specialists;
  environmentalBaselines: EnvironmentalBaselines;
  pricingPoint: PricingPoint;
  geographicContext?: GeographicContext;  // NEW: optional for backward compatibility
}

export interface StressTestReport {
  location: string;
  coordinates: string; // e.g., Lat/Lng
  baselinePriceSFH: number; // Initial price of a standard 3B/2B SFH in the micro-market
  baselinePriceNote?: string; // e.g. "No market data available" or "Estimated based on regional averages"
  dataQuality?: 'VERIFIED_WITH_GROUNDING' | 'ESTIMATED' | 'NO_DATA_AVAILABLE'; // Indicates confidence in price and climate data
  transitionLiabilityDecade: string; // e.g. "2060s" or "2070s"
  transitionTriggerCause: string; // e.g. "Aquifer breach and withdrawal of structural insurance coverage."
  projections: HorizonProjection[];
}

export interface WeatherData {
  source: string;
  locationName: string;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    description: string;
  };
}

export interface HistoricalWeatherData {
  latitude: number;
  longitude: number;
  years: number[];
  temp: number[];
  precip: number[];
}

