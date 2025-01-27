import { Provider } from "./types.js";
import { KeyDoesNotExistError, NoBodyError } from "../errors.js";
import { Model } from "../model.js";
import type { S3Client } from "bun";

export type BunS3ProviderConstructorParams = [s3Client: S3Client];

export class BunS3Provider implements Provider {
  private client: S3Client;

  constructor(...args: BunS3ProviderConstructorParams) {
    const [s3Client] = args;
    this.client = s3Client;
  }

  async getByKey(key: string) {
    const s3File = await this.client.file(key);

    try {
      return await s3File.json();
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "NoSuchKey"
      ) {
        throw new KeyDoesNotExistError(`Key ${key} does not exist`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  async getById(collection: string, id: string) {
    return await this.getByKey(`${collection}/${id}.json`);
  }

  async exists(collection: string, id: string) {
    return await this.client.exists(`${collection}/${id}.json`);
  }

  async keys(collection: string) {
    this.client.

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `${collection}/`,
      })
    );
    const files = response.Contents ?? [];
    return files
      .filter((file) => file.Key !== undefined)
      .map((file) => file.Key!);
  }

  // async upsert(collection: string, data: Model) {
  //   await this.client.send(
  //     new PutObjectCommand({
  //       Bucket: this.bucket,
  //       Key: `${collection}/${data.id}.json`,
  //       Body: JSON.stringify(data),
  //       ContentType: "application/json",
  //     })
  //   );
  //   return data;
  // }

  // async deleteObject(collection: string, id: string) {
  //   await this.client.send(
  //     new DeleteObjectCommand({
  //       Bucket: this.bucket,
  //       Key: `${collection}/${id}.json`,
  //     })
  //   );
  // }
}
