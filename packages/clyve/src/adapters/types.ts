import { Model } from "model.js";

export interface Adapter {
  getByKey: (key: string) => Promise<Model>;
  getById: (collection: string, id: string) => Promise<Model>;
  exists: (collection: string, id: string) => Promise<boolean>;
  count: (collection: string) => Promise<number>;
  all: (collection: string) => Promise<Model[]>;
  upsert: (collection: string, data: Model) => Promise<Model>;
  create: (collection: string, data: Model) => Promise<Model>;
  update: (collection: string, data: Model) => Promise<Model>;
  createMany: (collection: string, data: Model[]) => Promise<Model[]>;
  deleteObject: (collection: string, id: string) => Promise<void>;
  deleteMany: (collection: string, ids: string[]) => Promise<void>;
  deleteAll: (collection: string) => Promise<void>;
  edit: (
    collection: string,
    id: string,
    fn: (entity: Model) => Model | Promise<Model>
  ) => Promise<Model>;
}
