import { createClient } from 'redis';

class RedisService {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Connected to Redis'));
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis Get Error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    try {
      await this.client.set(key, value);
      if (expireSeconds) {
        await this.client.expire(key, expireSeconds);
      }
    } catch (error) {
      console.error('Redis Set Error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis Delete Error:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expireSeconds: number = 3600
  ): Promise<T | null> {
    try {
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const data = await fetchFn();
      await this.set(key, JSON.stringify(data), expireSeconds);
      return data;
    } catch (error) {
      console.error('Redis GetOrSet Error:', error);
      return null;
    }
  }

  // Helper method to generate cache keys
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }
}

export const redisService = new RedisService(); 