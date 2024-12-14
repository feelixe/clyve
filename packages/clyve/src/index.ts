import { CollectionObjectReadOnlyError } from "./errors.js";
import { Model } from "./model.js";
import { Adapter } from "./adapters/types.js";

type Schema = Record<string, Model>;

type ClyveClient<T extends Schema> = {
  [K in keyof T]: {
    get: (id: string) => Promise<T[K]>;
    all: () => Promise<Array<T[K]>>;
    count: () => Promise<number>;
    create: (data: T[K]) => Promise<void>;
    createMany: (data: Array<T[K]>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    deleteMany: (id: Array<string>) => Promise<void>;
    deleteAll: () => Promise<void>;
    exists: (id: string) => Promise<boolean>;
    update: (data: T[K]) => Promise<void>;
    upsert: (data: T[K]) => Promise<void>;
  };
};

export type CreateClientParams = [adapter: Adapter];

export function createClient<T extends Schema>(
  ...args: CreateClientParams
): ClyveClient<T> {
  const [adapter] = args;

  return new Proxy(
    {},
    {
      get(_, key) {
        return {
          get: (id: string) => adapter.getById(key.toString(), id),
          all: () => adapter.all(key.toString()),
          create: (data: Model) => adapter.create(key.toString(), data),
          delete: (id: string) => adapter.deleteObject(key.toString(), id),
          deleteMany: (id: Array<string>) =>
            adapter.deleteMany(key.toString(), id),
          deleteAll: () => adapter.deleteAll(key.toString()),
          createMany: (data: Array<Model>) =>
            adapter.createMany(key.toString(), data),
          count: () => adapter.count(key.toString()),
          exists: (id: string) => adapter.exists(key.toString(), id),
          update: (data: Model) => adapter.update(key.toString(), data),
          upsert: (data: Model) => adapter.upsert(key.toString(), data),
        };
      },
      set() {
        throw new CollectionObjectReadOnlyError(
          "Database collections are read-only"
        );
      },
    }
  ) as ClyveClient<T>;
}
