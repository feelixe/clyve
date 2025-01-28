import { Model } from "model.js";
import { Provider } from "../providers/types.js";
import { parseKey } from "../key.js";

export type CacheConstructorParams = {
  provider: Provider;
};

type CacheKey = Array<string>;

type CacheEntry = {
  key: CacheKey;
  value: unknown;
};

export class Cache implements Provider {
  private provider: Provider;
  private cacheStore: Array<CacheEntry>;

  constructor(args: CacheConstructorParams) {
    this.provider = args.provider;
    this.cacheStore = [];
  }

  public debugGetStore() {
    return this.cacheStore;
  }

  private invalidate(key: CacheKey, exact: boolean) {
    this.cacheStore = this.cacheStore.filter((entry) => {
      if (exact) {
        const isLengthMatch = entry.key.length === key.length;
        return (
          isLengthMatch &&
          entry.key.every((keyPart, index) => keyPart === entry.key[index])
        );
      }
      const match = key.every((keyPart, index) => entry.key[index] === keyPart);
      return !match;
    });
  }

  private getCachedValueByKey(key: CacheKey) {
    return this.cacheStore.find((entry) => {
      const isLengthMatch = entry.key.length === key.length;
      return (
        isLengthMatch &&
        entry.key.every((keyPart, index) => keyPart === entry.key[index])
      );
    });
  }

  private pushToCache(entry: CacheEntry) {
    this.cacheStore.push(entry);
  }

  private getRetrieveCacheKey(collection: string, id: string) {
    return [collection, "retrieve", id];
  }

  private getKeysCacheKey(collection: string) {
    return [collection, "keys"];
  }

  private setCachedRetrieveValue(
    collection: string,
    id: string,
    value: unknown
  ) {
    const key = this.getRetrieveCacheKey(collection, id);
    this.invalidate(key, true);
    this.pushToCache({ key, value });
  }

  private getCachedRetrieveValue(
    collection: string,
    id: string
  ): Model | undefined {
    const key = this.getRetrieveCacheKey(collection, id);
    return this.getCachedValueByKey(key)?.value as Model;
  }

  private clearCachedRetrieveValue(collection: string, id: string) {
    const key = this.getRetrieveCacheKey(collection, id);
    this.invalidate(key, true);
  }

  private setCachedKeysValue(collection: string, keys: Array<string>) {
    const key = this.getKeysCacheKey(collection);
    this.invalidate(key, true);
    this.pushToCache({ key, value: keys });
  }

  private getCachedKeysValue(collection: string): Array<string> | undefined {
    const key = this.getKeysCacheKey(collection);
    return this.getCachedValueByKey(key)?.value as Array<string>;
  }

  private clearCachedKeysValue(collection: string) {
    const key = this.getKeysCacheKey(collection);
    this.invalidate(key, true);
  }

  async getByKey(key: string) {
    const { collection, id } = parseKey(key);
    const cachedValue = this.getCachedRetrieveValue(collection, id);
    if (cachedValue !== undefined) {
      console.log("CACHE HIT");
      return cachedValue;
    }

    console.log("CACHE MISS");
    const value = await this.provider.getByKey(key);
    const retrieveKey = this.getRetrieveCacheKey(collection, id);
    this.pushToCache({ key: retrieveKey, value });
    return value;
  }

  async deleteObject(collection: string, id: string) {
    await this.provider.deleteObject(collection, id);
    this.clearCachedRetrieveValue(collection, id);
    this.clearCachedKeysValue(collection);
  }

  async exists(collection: string, id: string) {
    return await this.provider.exists(collection, id);
  }

  async upsert(collection: string, data: Model) {
    const result = await this.provider.upsert(collection, data);
    this.clearCachedKeysValue(collection);
    this.setCachedRetrieveValue(collection, data.id, data);
    return result;
  }

  async keys(collection: string) {
    const cachedKeys = this.getCachedKeysValue(collection);
    if (cachedKeys !== undefined) {
      console.log("CACHE HIT");
      return cachedKeys;
    }

    console.log("CACHE MISS");
    const keys = await this.provider.keys(collection);
    this.setCachedKeysValue(collection, keys);
    return keys;
  }
}
