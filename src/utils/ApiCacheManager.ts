import { GeographicContext } from '../types';

export class ApiCacheManager {
  private cache: Map<string, { data: GeographicContext; expiresAt: number }> = new Map();

  get(key: string): GeographicContext | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: GeographicContext, ttlMinutes: number = 10): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    });
  }

  private isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCacheManager = new ApiCacheManager();
