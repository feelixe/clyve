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

export type CreateS3AdapterParams = [s3Client: S3Client, bucket: string];

export function createS3Adapter(...args: CreateS3AdapterParams): Adapter {
  const [client, bucket] = args;

  async function getByKey(key: string) {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new NoBodyError("S3 response did not have a body");
    }

    const string = await response.Body.transformToString();
    return JSON.parse(string);
  }

  async function getById(collection: string, id: string) {
    return await getByKey(`${collection}/${id}.json`);
  }

  async function exists(collection: string, id: string) {
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
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

  async function listEntries(collection: string) {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${collection}/`,
      })
    );
    const files = response.Contents ?? [];
    return files;
  }

  async function count(collection: string) {
    const files = await listEntries(collection);
    return files.length;
  }

  async function all(collection: string) {
    const files = await listEntries(collection);
    return await Promise.all(files.map((file) => getByKey(file.Key!)));
  }

  async function upsert(collection: string, data: Model) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${collection}/${data.id}.json`,
        Body: JSON.stringify(data),
        ContentType: "application/json",
      })
    );
  }

  async function create(collection: string, data: Model) {
    const doesKeyAlreadyExist = await exists(collection, data.id);
    if (doesKeyAlreadyExist) {
      throw new DuplicateKeyError(
        `Key ${collection}/${data.id}.json already exists`
      );
    }

    await upsert(collection, data);
  }

  async function update(collection: string, data: Model) {
    const doesKeyAlreadyExist = await exists(collection, data.id);
    if (!doesKeyAlreadyExist) {
      throw new KeyDoesNotExistError(
        `Key ${collection}/${data.id}.json does not exist`
      );
    }

    await upsert(collection, data);
  }

  async function createMany(collection: string, data: Array<Model>) {
    const entriesExist = await Promise.all(
      data.map((data) => exists(collection, data.id))
    );

    const someExist = entriesExist.some((exists) => exists);

    if (someExist) {
      throw new DuplicateKeyError(
        "Cannot create items because some key already exist"
      );
    }

    await Promise.all(data.map((data) => upsert(collection, data)));
  }

  async function deleteObject(collection: string, id: string) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `${collection}/${id}.json`,
      })
    );
  }

  async function deleteMany(collection: string, ids: Array<string>) {
    const entriesExist = await Promise.all(
      ids.map((id) => exists(collection, id))
    );

    const someExist = entriesExist.some((exists) => exists);

    if (someExist) {
      throw new DuplicateKeyError(
        "Cannot delete items because some key already exist"
      );
    }

    await Promise.all(ids.map((id) => deleteObject(collection, id)));
  }

  async function deleteAll(collection: string) {
    const files = await listEntries(collection);
    await Promise.all(files.map((file) => deleteObject(collection, file.Key!)));
  }

  return {
    getByKey,
    getById,
    exists,
    count,
    all,
    upsert,
    create,
    update,
    createMany,
    deleteObject,
    deleteMany,
    deleteAll,
  };
}
