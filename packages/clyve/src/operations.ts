import { Adapter } from "./adapters/types.js";
import { DuplicateKeyError, KeyDoesNotExistError } from "./errors.js";
import { Model } from "./model.js";

export class Operations {
  private adapter: Adapter;

  constructor(adapter: Adapter) {
    this.adapter = adapter;
  }

  async getById(collection: string, id: string) {
    return await this.adapter.getByKey(`${collection}/${id}.json`);
  }

  async get(collection: string, id: string) {
    return await this.getById(collection, id);
  }

  async all(collection: string) {
    const keys = await this.adapter.keys(collection);
    return await Promise.all(keys.map((key) => this.adapter.getByKey(key)));
  }

  async create(collection: string, data: Model) {
    const doesKeyAlreadyExist = await this.adapter.exists(collection, data.id);
    if (doesKeyAlreadyExist) {
      throw new DuplicateKeyError(
        `Key ${collection}/${data.id}.json already exists`
      );
    }

    return await this.adapter.upsert(collection, data);
  }

  async createMany(collection: string, data: Array<Model>) {
    const entriesExist = await Promise.all(
      data.map((data) => this.adapter.exists(collection, data.id))
    );
    const someExist = entriesExist.some((exists) => exists);
    if (someExist) {
      throw new DuplicateKeyError(
        "Cannot create items because some key already exist"
      );
    }

    return await Promise.all(
      data.map((data) => this.adapter.upsert(collection, data))
    );
  }

  async deleteObject(collection: string, id: string) {
    await this.adapter.deleteObject(collection, id);
  }

  async deleteMany(collection: string, ids: Array<string>) {
    const entriesExist = await Promise.all(
      ids.map((id) => this.adapter.exists(collection, id))
    );

    const allExist = entriesExist.every((exists) => exists);

    if (!allExist) {
      throw new KeyDoesNotExistError(
        "Cannot delete items because some key does not exist"
      );
    }

    await Promise.all(
      ids.map((id) => this.adapter.deleteObject(collection, id))
    );
  }

  async allIds(collection: string) {
    const keys = await this.adapter.keys(collection);
    const fileNames = keys.map((key) => key.split("/")[1]);
    const ids = fileNames.map((fileName) => fileName.split(".")[0]);
    return ids;
  }

  async deleteAll(collection: string) {
    const ids = await this.allIds(collection);
    await Promise.all(
      ids.map((id) => this.adapter.deleteObject(collection, id))
    );
  }

  async count(collection: string) {
    const keys = await this.adapter.keys(collection);
    return keys.length;
  }

  async exists(collection: string, id: string) {
    return await this.adapter.exists(collection, id);
  }

  async update(collection: string, data: Model) {
    const doesKeyAlreadyExist = await this.exists(collection, data.id);
    if (!doesKeyAlreadyExist) {
      throw new KeyDoesNotExistError(
        `Key ${collection}/${data.id}.json does not exist`
      );
    }

    return await this.upsert(collection, data);
  }

  async upsert(collection: string, data: Model) {
    return await this.adapter.upsert(collection, data);
  }

  async edit(
    collection: string,
    id: string,
    fn: (entity: Model) => Model | Promise<Model>
  ) {
    const data = await this.getById(collection, id);
    const modified = await fn(data);
    return await this.update(collection, modified);
  }
}
