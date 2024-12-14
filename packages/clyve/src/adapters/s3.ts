import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Adapter } from "./types.js";
import {
  DuplicateKeyError,
  KeyDoesNotExistError,
  NoBodyError,
} from "../errors.js";
import { Model } from "../model.js";

export type S3AdapterConstructorParams = [s3Client: S3Client, bucket: string];

export class S3Adapter implements Adapter {
  private client: S3Client;
  private bucket: string;

  constructor(...args: S3AdapterConstructorParams) {
    const [s3Client, bucket] = args;
    this.client = s3Client;
    this.bucket = bucket;
  }

  async getByKey(key: string) {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new NoBodyError("S3 response did not have a body");
    }

    const string = await response.Body.transformToString();
    return JSON.parse(string);
  }

  async getById(collection: string, id: string) {
    return await this.getByKey(`${collection}/${id}.json`);
  }

  async exists(collection: string, id: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: `${collection}/${id}.json`,
        })
      );
      return true;
    } catch (error) {
      if (error instanceof NotFound) {
        return false;
      }
      throw error;
    }
  }

  async listEntries(collection: string) {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `${collection}/`,
      })
    );
    const files = response.Contents ?? [];
    return files;
  }

  async count(collection: string) {
    const files = await this.listEntries(collection);
    return files.length;
  }

  async all(collection: string) {
    const files = await this.listEntries(collection);
    return await Promise.all(files.map((file) => this.getByKey(file.Key!)));
  }

  async upsert(collection: string, data: Model) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `${collection}/${data.id}.json`,
        Body: JSON.stringify(data),
        ContentType: "application/json",
      })
    );
  }

  async create(collection: string, data: Model) {
    const doesKeyAlreadyExist = await this.exists(collection, data.id);
    if (doesKeyAlreadyExist) {
      throw new DuplicateKeyError(
        `Key ${collection}/${data.id}.json already exists`
      );
    }

    await this.upsert(collection, data);
  }

  async update(collection: string, data: Model) {
    const doesKeyAlreadyExist = await this.exists(collection, data.id);
    if (!doesKeyAlreadyExist) {
      throw new KeyDoesNotExistError(
        `Key ${collection}/${data.id}.json does not exist`
      );
    }

    await this.upsert(collection, data);
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

    await Promise.all(data.map((data) => this.upsert(collection, data)));
  }

  async deleteObject(collection: string, id: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: `${collection}/${id}.json`,
      })
    );
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
      files.map((file) => this.deleteObject(collection, file.Key!))
    );
  }
}
