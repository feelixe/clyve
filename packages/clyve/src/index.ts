import { CollectionObjectReadOnlyError } from "./errors.js";
import { Adapter } from "./adapters/types.js";
import { Model } from "./model.js";

type Schema = Record<string, Model>;

type OmitId<TModel> = Omit<TModel, "id">;

type ClyveClient<T extends Schema, TId extends boolean> = {
  [K in keyof T]: {
    get: (id: string) => Promise<T[K]>;
    all: () => Promise<Array<T[K]>>;
    count: () => Promise<number>;
    create: (data: TId extends true ? OmitId<T[K]> : T[K]) => Promise<T[K]>;
    createMany: (data: Array<T[K]>) => Promise<Array<T[K]>>;
    delete: (id: string) => Promise<void>;
    deleteMany: (id: Array<string>) => Promise<void>;
    deleteAll: () => Promise<void>;
    exists: (id: string) => Promise<boolean>;
    update: (data: T[K]) => Promise<T[K]>;
    upsert: (data: T[K]) => Promise<T[K]>;
  };
};

export type CreateClientOptions = {
  getId: () => string;
};

export function createClient<T extends Schema>(
  adapter: Adapter
): ClyveClient<T, false>;
export function createClient<T extends Schema>(
  adapter: Adapter,
  options: CreateClientOptions
): ClyveClient<T, true>;
export function createClient<T extends Schema>(
  adapter: Adapter,
  opts?: CreateClientOptions
): ClyveClient<T, boolean> {
  console.log(opts);
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
  ) as ClyveClient<T, boolean>;
}
