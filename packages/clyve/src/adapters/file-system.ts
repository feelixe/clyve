import { Model } from "../model.js";
import { DuplicateKeyError, KeyDoesNotExistError } from "../errors.js";
import { Adapter } from "./types.js";
import { promises as fs } from "node:fs";
import path from "node:path";

export class FileSystemAdapter implements Adapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private async writeFileWithDirs(filePath: string, data: string) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async getByKey(key: string) {
    const filePath = path.resolve(this.basePath, key);
    const string = await fs.readFile(filePath, "utf-8");

    return JSON.parse(string);
  }

  async getById(collection: string, id: string) {
    return await this.getByKey(`${collection}/${id}.json`);
  }

  async exists(collection: string, id: string) {
    const filePath = path.resolve(this.basePath, `${collection}/${id}.json`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private isEnoentError(error: unknown): error is Error {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }

  private async listEntries(collection: string) {
    try {
      const directoryPath = path.resolve(this.basePath, collection);
      const files = await fs.readdir(directoryPath, { withFileTypes: true });
      return files.filter((file) => !file.isDirectory());
    } catch (error) {
      if (this.isEnoentError(error)) {
        return [];
      }
      throw error;
    }
  }

  async count(collection: string) {
    const files = await this.listEntries(collection);
    return files.length;
  }

  async all(collection: string) {
    const files = await this.listEntries(collection);
    return await Promise.all(
      files.map((file) => this.getByKey(`${collection}/${file.name}`))
    );
  }

  async upsert(collection: string, data: Model) {
    const filePath = path.resolve(
      this.basePath,
      `${collection}/${data.id}.json`
    );
    await this.writeFileWithDirs(filePath, JSON.stringify(data));
    return data;
  }

  async create(collection: string, data: Model) {
    const doesKeyAlreadyExist = await this.exists(collection, data.id);
    if (doesKeyAlreadyExist) {
      throw new DuplicateKeyError(
        `Key ${collection}/${data.id}.json already exists`
      );
    }

    return await this.upsert(collection, data);
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

  async createMany(collection: string, data: Array<Model>) {
    const entriesExist = await Promise.all(
      data.map((data) => this.exists(collection, data.id))
    );

    const someExist = entriesExist.some((exists) => exists);
    if (someExist) {
      throw new DuplicateKeyError(
        "Cannot create items because some key already exist"
      );
    }

    return await Promise.all(data.map((data) => this.upsert(collection, data)));
  }

  async deleteObject(collection: string, id: string) {
    const filePath = path.resolve(this.basePath, `${collection}/${id}.json`);
    await fs.unlink(filePath);
  }

  async deleteMany(collection: string, ids: Array<string>) {
    const entriesExist = await Promise.all(
      ids.map((id) => this.exists(collection, id))
    );

    const allExist = entriesExist.every((exists) => exists);

    if (!allExist) {
      throw new KeyDoesNotExistError(
        "Cannot delete items because some key does not exist"
      );
    }

    await Promise.all(ids.map((id) => this.deleteObject(collection, id)));
  }

  async deleteAll(collection: string) {
    const files = await this.listEntries(collection);

    await Promise.all(
      files.map((file) =>
        this.deleteObject(collection, `${collection}/${file.name}`)
      )
    );
  }
}
