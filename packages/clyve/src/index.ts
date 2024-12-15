import { CollectionObjectReadOnlyError } from "./errors.js";
import { Adapter } from "./adapters/types.js";
import { Model } from "./model.js";
import { Operations } from "./operations.js";

type Schema = Record<string, Model>;

export type ClyveClient<T extends Schema> = {
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
  const operations = new Operations(adapter);

  return new Proxy(
    {},
    {
      get(_, key) {
        const collection = key.toString();
        return {
          get: (id: string) => operations.get(collection, id),
          all: () => operations.all(collection),
          create: (data: Model) => operations.create(collection, data),
          createMany: (data: Array<Model>) =>
            operations.createMany(collection, data),
          delete: (id: string) => operations.deleteObject(collection, id),
          deleteMany: (id: Array<string>) =>
            operations.deleteMany(collection, id),
          deleteAll: () => operations.deleteAll(collection),
          count: () => operations.count(collection),
          exists: (id: string) => operations.exists(collection, id),
          update: (data: Model) => operations.update(collection, data),
          upsert: (data: Model) => operations.upsert(collection, data),
          edit: (id: string, fn: (entity: Model) => Model | Promise<Model>) =>
            operations.edit(collection, id, fn),
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
