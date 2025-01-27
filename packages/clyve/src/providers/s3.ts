import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Provider } from "./types.js";
import { KeyDoesNotExistError, NoBodyError } from "../errors.js";
import { Model } from "../model.js";

export type S3ProviderConstructorParams = [s3Client: S3Client, bucket: string];

export class S3Provider implements Provider {
  private client: S3Client;
  private bucket: string;

  constructor(...args: S3ProviderConstructorParams) {
    const [s3Client, bucket] = args;
    this.client = s3Client;
    this.bucket = bucket;
  }

  async getByKey(key: string) {
    let response;
    try {
      response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      if (error instanceof NoSuchKey) {
        throw new KeyDoesNotExistError(`Key ${key} does not exist`, {
          cause: error,
        });
      }
      throw error;
    }

    if (!response.Body) {
      throw new NoBodyError("S3 response did not have a body");
    }

    const string = await response.Body.transformToString();
    return JSON.parse(string);
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

  async keys(collection: string) {
    const accumulatedKeys: string[] = [];
    let continuationToken: string | undefined;

    while (true) {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `${collection}/`,
          MaxKeys: 50,
          ContinuationToken: continuationToken,
        })
      );

      const files = response.Contents ?? [];
      const keys = files
        .filter((file) => file.Key !== undefined)
        .map((file) => file.Key!);
      accumulatedKeys.push(...keys);

      if (response.IsTruncated) {
        continuationToken = response.NextContinuationToken;
        continue;
      }
      break;
    }
    return accumulatedKeys;
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
    return data;
  }

  async deleteObject(collection: string, id: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: `${collection}/${id}.json`,
      })
    );
  }
}
