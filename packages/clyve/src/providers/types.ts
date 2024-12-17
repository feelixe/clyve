import { Model } from "model.js";

export interface Provider {
  getByKey: (key: string) => Promise<Model>;
  exists: (collection: string, id: string) => Promise<boolean>;
  keys: (collection: string) => Promise<string[]>;
  upsert: (collection: string, data: Model) => Promise<Model>;
  deleteObject: (collection: string, id: string) => Promise<void>;
}
