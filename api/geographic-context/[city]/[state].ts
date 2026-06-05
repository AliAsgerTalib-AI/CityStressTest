import type { IncomingMessage, ServerResponse } from 'http';
import { apiCacheManager } from '../../../src/utils/ApiCacheManager';
import {
  generateEconomicViability,
  generateInfrastructureResilience,
  generateDemographicTrends,
} from '../../../src/utils/stressTestUtils';
import { EconomicViabilityProvider } from '../../../src/utils/providers/EconomicViabilityProvider';
import { DemographicTrendsProvider } from '../../../src/utils/providers/DemographicTrendsProvider';
import { InfrastructureResilienceProvider } from '../../../src/utils/providers/InfrastructureResilienceProvider';

const censusApiKey = process.env.CENSUS_API_KEY || '';
const economicViabilityProvider = new EconomicViabilityProvider(censusApiKey);
const demographicTrendsProvider = new DemographicTrendsProvider(censusApiKey);
const infrastructureResilienceProvider = new InfrastructureResilienceProvider();

function mergeResults(
  econ: any,
  demo: any,
  infra: any,
  scale: 'city' | 'region',
): any {
  if (!econ && !demo && !infra) return null;

  const result: any = {
    scale,
    location: econ?.location || demo?.location || infra?.location || '',
    economicViability: econ?.economicViability || {},
    demographicTrends: demo?.demographicTrends || {},
    infrastructureResilience: infra?.infrastructureResilience || {},
  };

  return result;
}

async function mergeRegionResults(state: string): Promise<any> {
  const [econ, demo, infra] = await Promise.all([
    economicViabilityProvider.fetchRegion(state),
    demographicTrendsProvider.fetchRegion(state),
    infrastructureResilienceProvider.fetchRegion(state),
  ]);

  return mergeResults(econ, demo, infra, 'region');
}

const handler = async (req: IncomingMessage & { query?: any }, res: ServerResponse) => {
  try {
    const { city, state } = req.query;

    if (!city || !state) {
      res.status(400).json({ error: 'Missing city or state parameter' });
      return;
    }

    const cacheKey = `${city}_${state}`;

    const cached = apiCacheManager.get(cacheKey as string);
    if (cached) {
      console.log(`Geographic context cache hit for ${cacheKey}`);
      res.status(200).json(cached);
      return;
    }

    console.log(`Fetching geographic context for ${city}, ${state}...`);

    const [econ, demo, infra] = await Promise.all([
      economicViabilityProvider.fetchCity(city as string, state as string),
      demographicTrendsProvider.fetchCity(city as string, state as string),
      infrastructureResilienceProvider.fetchCity(city as string, state as string),
    ]);

    const merged = {
      city: mergeResults(econ, demo, infra, 'city'),
      region: await mergeRegionResults(state as string),
    };

    apiCacheManager.set(cacheKey as string, merged);

    console.log(
      `Successfully generated geographic context for ${city}, ${state}`,
    );
    res.status(200).json(merged);
  } catch (error) {
    console.error('Error fetching geographic context:', error);
    res.status(500).json({ error: 'Geographic data unavailable' });
  }
};

export default handler;
