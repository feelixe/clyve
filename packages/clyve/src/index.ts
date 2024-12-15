import { CollectionObjectReadOnlyError } from "./errors.js";
import { Adapter } from "./adapters/types.js";
import { Model } from "./model.js";

type Schema = Record<string, Model>;

type ClyveClient<T extends Schema> = {
  [K in keyof T]: {
    get: (id: string) => Promise<T[K]>;
    all: () => Promise<Array<T[K]>>;
    count: () => Promise<number>;
    create: (data: T[K]) => Promise<T[K]>;
    createMany: (data: Array<T[K]>) => Promise<Array<T[K]>>;
    delete: (id: string) => Promise<void>;
    deleteMany: (id: Array<string>) => Promise<void>;
    deleteAll: () => Promise<void>;
    exists: (id: string) => Promise<boolean>;
    update: (data: T[K]) => Promise<T[K]>;
    upsert: (data: T[K]) => Promise<T[K]>;
    edit: (
      id: string,
      fn: (entity: T[K]) => T[K] | Promise<T[K]>
    ) => Promise<T[K]>;
  };
};

export function createClient<T extends Schema>(adapter: Adapter) {
  return new Proxy(
    {},
    {
      get(_, key) {
        const collection = key.toString();
        return {
          get: (id: string) => adapter.getById(collection, id),
          all: () => adapter.all(collection),
          create: (data: Model) => adapter.create(collection, data),
          delete: (id: string) => adapter.deleteObject(collection, id),
          deleteMany: (id: Array<string>) => adapter.deleteMany(collection, id),
          deleteAll: () => adapter.deleteAll(collection),
          createMany: (data: Array<Model>) =>
            adapter.createMany(collection, data),
          count: () => adapter.count(collection),
          exists: (id: string) => adapter.exists(collection, id),
          update: (data: Model) => adapter.update(collection, data),
          upsert: (data: Model) => adapter.upsert(collection, data),
          edit: (id: string, fn: (entity: Model) => Model | Promise<Model>) =>
            adapter.edit(collection, id, fn),
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
