import { Model } from "../model.js";
import { KeyDoesNotExistError } from "../errors.js";
import { Provider } from "./types.js";
import { promises as fs } from "node:fs";
import path from "node:path";

export class FileSystemProvider implements Provider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private async writeFileWithDirs(filePath: string, data: string) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  }

  private isEnoentError(error: unknown): error is Error {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }

  async getByKey(key: string) {
    const filePath = path.resolve(this.basePath, key);
    let content;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch (error) {
      if (this.isEnoentError(error)) {
        throw new KeyDoesNotExistError(`Key ${key} does not exist`, {
          cause: error,
        });
      }
      throw error;
    }

    return JSON.parse(content);
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

  async keys(collection: string) {
    const directoryPath = path.resolve(this.basePath, collection);
    let files;
    try {
      files = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
      if (this.isEnoentError(error)) {
        return [];
      }
      throw error;
    }
    return files
      .filter((file) => !file.isDirectory())
      .map((file) => path.posix.join(collection, file.name));
  }

  async upsert(collection: string, data: Model) {
    const filePath = path.resolve(
      this.basePath,
      `${collection}/${data.id}.json`
    );
    await this.writeFileWithDirs(filePath, JSON.stringify(data));
    return data;
  }

  async deleteObject(collection: string, id: string) {
    const filePath = path.resolve(this.basePath, collection, `${id}.json`);
    await fs.unlink(filePath);
  }
}
