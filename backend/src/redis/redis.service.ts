import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;
  private readonly memStore = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>('REDIS_DISABLED') === 'true') {
      this.logger.warn('Redis disabled — using in-memory fallback (dev only)');
      return;
    }
    this.client = createClient({
      socket: {
        host: this.config.get<string>('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
      },
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
    }) as RedisClientType;

    this.client.on('error', (err) => this.logger.error('Redis error', err));
    this.client.on('connect', () => this.logger.log('Redis connected'));

    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      const entry = this.memStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) { this.memStore.delete(key); return null; }
      return entry.value;
    }
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      this.memStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
      return;
    }
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) { this.memStore.delete(key); return; }
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return this.memStore.has(key);
    return (await this.client.exists(key)) > 0;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) {
      const entry = this.memStore.get(key);
      if (entry) this.memStore.set(key, { ...entry, expiresAt: Date.now() + ttlSeconds * 1000 });
      return;
    }
    await this.client.expire(key, ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      const val = parseInt(this.memStore.get(key)?.value ?? '0', 10) + 1;
      this.memStore.set(key, { value: String(val) });
      return val;
    }
    return this.client.incr(key);
  }

  /** Pub/sub — publish a message to a channel */
  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.publish(channel, message);
  }

  /** Raw client for advanced use cases */
  getClient(): RedisClientType {
    return this.client;
  }
}
