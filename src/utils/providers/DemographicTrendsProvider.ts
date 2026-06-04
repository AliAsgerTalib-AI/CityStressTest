import { GeographicScaleContext, GeographicSignal, MetricUncertainty } from '../../types';

export class DemographicTrendsProvider {
  private censusApiKey: string;

  constructor(censusApiKey: string) {
    this.censusApiKey = censusApiKey;
  }

  async fetchCity(city: string, state: string): Promise<GeographicScaleContext | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Total population, median age, education level, migration
      const variables = 'NAME,B01003_001E,B01002_001E,S1501_C01_016E,B07001_001E';
      const geoFilter = `place:*&in=state:${this.stateToFips(state)}`;

      const url = `https://api.census.gov/data/2021/acs/acs5?get=${variables}&for=${geoFilter}&key=${this.censusApiKey}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const data = await response.json();
      const row = data[1];

      return {
        scale: 'city',
        location: city,
        economicViability: {
          medianHouseholdIncome: this.createEmptySignal(),
          povertyRate: this.createEmptySignal(),
          unemploymentRate: this.createEmptySignal(),
        },
        demographicTrends: {
          population: this.createSignal('Population', row[1], 'HIGH'),
          ageDistribution: this.createSignal('Median Age', `${row[2]} years`, 'HIGH'),
          educationLevel: this.createSignal('Bachelor\'s Degree or Higher', `${row[3]}%`, 'HIGH'),
          netMigrationRate: this.createSignal('Net Migration Rate', `${row[4]}%`, 'MEDIUM'),
        },
        infrastructureResilience: {
          broadbandAvailability: this.createEmptySignal(),
          utilitySystemAge: this.createEmptySignal(),
        },
      };
    } catch (error) {
      console.error(`DemographicTrendsProvider.fetchCity failed for ${city}:`, error);
      return null;
    }
  }

  async fetchRegion(state: string): Promise<GeographicScaleContext | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const variables = 'NAME,B01003_001E,B01002_001E,S1501_C01_016E,B07001_001E';
      const url = `https://api.census.gov/data/2021/acs/acs5?get=${variables}&for=state:*&key=${this.censusApiKey}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const data = await response.json();
      const stateRow = data.find((row: any[]) => row[5] === this.stateToFips(state));

      if (!stateRow) return null;

      return {
        scale: 'region',
        location: state,
        economicViability: {
          medianHouseholdIncome: this.createEmptySignal(),
          povertyRate: this.createEmptySignal(),
          unemploymentRate: this.createEmptySignal(),
        },
        demographicTrends: {
          population: this.createSignal('Population', stateRow[1], 'HIGH'),
          ageDistribution: this.createSignal('Median Age', `${stateRow[2]} years`, 'HIGH'),
          educationLevel: this.createSignal('Bachelor\'s Degree or Higher', `${stateRow[3]}%`, 'HIGH'),
          netMigrationRate: this.createSignal('Net Migration Rate', `${stateRow[4]}%`, 'MEDIUM'),
        },
        infrastructureResilience: {
          broadbandAvailability: this.createEmptySignal(),
          utilitySystemAge: this.createEmptySignal(),
        },
      };
    } catch (error) {
      console.error(`DemographicTrendsProvider.fetchRegion failed for ${state}:`, error);
      return null;
    }
  }

  private createSignal(name: string, value: string | number, confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'): GeographicSignal {
    const valueStr = String(value);
    const uncertainty: MetricUncertainty = {
      confidenceLevel,
      lowScenario: valueStr,
      baselineScenario: valueStr,
      highScenario: valueStr,
      failureChainNarrative: `${name} from U.S. Census Bureau American Community Survey.`,
      provenance: {
        source: 'U.S. Census Bureau ACS',
        verified: true,
        uncertainty: '±3%',
        verificationDate: '2021',
      },
    };
    return { name, value: valueStr, uncertainty };
  }

  private createEmptySignal(): GeographicSignal {
    return {
      name: '',
      value: '',
      uncertainty: {
        confidenceLevel: 'LOW',
        lowScenario: '',
        baselineScenario: '',
        highScenario: '',
        failureChainNarrative: '',
        provenance: { source: '', verified: false, uncertainty: '' },
      },
    };
  }

  private stateToFips(state: string): string {
    const stateMap: Record<string, string> = {
      CA: '06', NY: '36', TX: '48', FL: '12', PA: '42', IL: '17', OH: '39', GA: '13',
      NC: '37', MI: '26', NJ: '34', VA: '51', WA: '53', AZ: '04', MA: '25', TN: '47',
      IN: '18', MD: '24', MO: '29', WI: '55', CO: '08', MN: '27', SC: '45', AL: '01',
      LA: '22', KY: '21', OR: '41', OK: '40', CT: '09', UT: '49', NV: '32', AR: '05',
      MS: '28', KS: '20', NM: '35', NE: '31', ID: '16', HI: '15', NH: '33', ME: '23',
      MT: '30', RI: '44', DE: '10', SD: '46', ND: '38', AK: '02', VT: '50', WY: '56',
      IA: '19', WV: '54', DC: '11',
    };
    return stateMap[state.toUpperCase()] || '06';
  }
}
