/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeographicScaleContext, GeographicSignal, MetricUncertainty } from '../../types';

export class InfrastructureResilienceProvider {
  async fetchCity(city: string, state: string): Promise<GeographicScaleContext | null> {
    try {
      const broadbandData = await this.fetchBroadbandAvailability(city, state);

      return {
        scale: 'city',
        location: city,
        economicViability: {
          medianHouseholdIncome: this.createEmptySignal(),
          povertyRate: this.createEmptySignal(),
          unemploymentRate: this.createEmptySignal(),
        },
        demographicTrends: {
          population: this.createEmptySignal(),
          ageDistribution: this.createEmptySignal(),
          educationLevel: this.createEmptySignal(),
          netMigrationRate: this.createEmptySignal(),
        },
        infrastructureResilience: {
          broadbandAvailability: broadbandData || this.createEmptySignal(),
          utilitySystemAge: this.createEmptySignal(),
        },
      };
    } catch (error) {
      console.error(`InfrastructureResilienceProvider.fetchCity failed for ${city}:`, error);
      return null;
    }
  }

  async fetchRegion(state: string): Promise<GeographicScaleContext | null> {
    try {
      return {
        scale: 'region',
        location: state,
        economicViability: {
          medianHouseholdIncome: this.createEmptySignal(),
          povertyRate: this.createEmptySignal(),
          unemploymentRate: this.createEmptySignal(),
        },
        demographicTrends: {
          population: this.createEmptySignal(),
          ageDistribution: this.createEmptySignal(),
          educationLevel: this.createEmptySignal(),
          netMigrationRate: this.createEmptySignal(),
        },
        infrastructureResilience: {
          broadbandAvailability: this.createEmptySignal(),
          utilitySystemAge: this.createEmptySignal(),
        },
      };
    } catch (error) {
      console.error(`InfrastructureResilienceProvider.fetchRegion failed for ${state}:`, error);
      return null;
    }
  }

  private async fetchBroadbandAvailability(city: string, state: string): Promise<GeographicSignal | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const query = `[bbox:${this.getStateBbox(state)}];(node["communication"="broadband"];);out count;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const text = await response.text();
      const count = parseInt(text.match(/Count: (\d+)/)?.[1] || '0');
      const coverage = count > 1000 ? 'Good' : count > 100 ? 'Moderate' : 'Limited';

      return {
        name: 'Broadband Availability',
        value: coverage,
        uncertainty: {
          confidenceLevel: 'MEDIUM',
          lowScenario: coverage,
          baselineScenario: coverage,
          highScenario: coverage,
          failureChainNarrative: 'Broadband coverage estimated from OpenStreetMap data.',
          provenance: {
            source: 'OpenStreetMap',
            verified: false,
            uncertainty: '±20%',
            verificationDate: '2024',
          },
        },
      };
    } catch (error) {
      console.error('fetchBroadbandAvailability failed:', error);
      return null;
    }
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

  private getStateBbox(state: string): string {
    const bboxMap: Record<string, string> = {
      CA: '32.5,-124.5,42,-114.1',
      NY: '40.5,-79.8,45.1,-71.9',
      TX: '25.8,-106.6,36.5,-93.5',
      FL: '24.4,-87.6,30.8,-80.0',
      PA: '39.7,-80.5,42.3,-74.7',
      IL: '36.9,-91.5,42.5,-87.0',
      OH: '38.4,-84.8,41.7,-80.5',
      GA: '30.3,-85.6,35.0,-80.8',
      NC: '33.8,-84.3,36.6,-75.4',
      MI: '41.7,-90.4,48.2,-83.3',
      NJ: '38.9,-75.6,41.4,-73.9',
      VA: '36.5,-83.7,39.5,-75.2',
      WA: '45.6,-124.7,49.0,-116.9',
      AZ: '31.3,-114.8,37.0,-109.0',
      MA: '41.2,-73.5,42.9,-69.9',
      TN: '35.0,-90.3,36.7,-81.6',
      IN: '37.8,-88.0,41.8,-84.8',
      MD: '37.9,-79.5,39.7,-75.0',
      MO: '36.0,-95.8,40.6,-89.1',
      WI: '42.5,-92.9,47.3,-86.8',
      CO: '37.0,-109.1,41.0,-102.0',
      MN: '43.5,-97.2,49.4,-89.5',
      SC: '32.0,-83.4,34.8,-78.5',
      AL: '30.2,-88.5,35.0,-84.9',
      LA: '29.0,-94.0,33.0,-88.8',
      KY: '36.5,-89.6,39.1,-81.9',
      OR: '42.0,-124.6,46.3,-116.5',
      OK: '33.6,-103.0,37.0,-94.4',
      CT: '41.1,-73.7,42.1,-71.8',
      UT: '37.0,-114.0,42.0,-109.0',
      NV: '35.0,-120.0,42.0,-114.6',
      AR: '33.0,-94.4,36.5,-89.6',
      MS: '29.6,-91.7,34.9,-88.1',
      KS: '37.0,-102.0,40.0,-94.6',
      NM: '31.8,-109.0,37.0,-103.0',
      NE: '40.0,-104.0,43.0,-95.3',
      ID: '42.0,-117.2,49.0,-111.0',
      HI: '18.9,-160.1,22.2,-154.8',
      NH: '42.7,-72.6,45.3,-70.7',
      ME: '43.0,-71.1,47.5,-66.9',
      MT: '45.0,-116.0,49.0,-104.0',
      RI: '41.1,-71.9,42.0,-71.1',
      DE: '38.5,-75.8,39.8,-75.0',
      SD: '42.5,-104.0,45.9,-96.4',
      ND: '46.3,-104.0,49.0,-96.6',
      AK: '51.3,-180.0,71.4,-130.0',
      VT: '42.7,-73.4,45.0,-71.5',
      WY: '41.0,-111.0,45.0,-104.0',
      IA: '40.4,-96.6,43.5,-90.1',
      WV: '37.2,-82.6,40.6,-77.7',
      DC: '38.7,-77.1,38.9,-76.9',
    };
    return bboxMap[state.toUpperCase()] || '25,-125,49,-66';
  }
}
