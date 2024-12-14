import { Model } from "model.js";

export type Adapter = {
  getByKey: (key: string) => Promise<Model>;
  getById: (collection: string, id: string) => Promise<Model>;
  exists: (collection: string, id: string) => Promise<boolean>;
  count: (collection: string) => Promise<number>;
  all: (collection: string) => Promise<Model[]>;
  upsert: (collection: string, data: Model) => Promise<void>;
  create: (collection: string, data: Model) => Promise<void>;
  update: (collection: string, data: Model) => Promise<void>;
  createMany: (collection: string, data: Model[]) => Promise<void>;
  deleteObject: (collection: string, id: string) => Promise<void>;
  deleteMany: (collection: string, ids: string[]) => Promise<void>;
  deleteAll: (collection: string) => Promise<void>;
};
