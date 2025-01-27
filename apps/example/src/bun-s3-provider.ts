import { S3Client } from "bun";
import { createClient } from "clyve";
import { BunS3Provider } from "clyve/providers";
import "dotenv/config";

type MySchema = {
  users: {
    id: string;
    name: string;
  };
  products: {
    id: string;
    name: string;
    price: number;
  };
};

export const s3Client = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  bucket: "scoreboard-app",
  endpoint: process.env.S3_ENDPOINT,
});

const provider = new BunS3Provider(s3Client);

const hej = await provider.exists("bikes", "123");

console.log(hej);

// const db = createClient<MySchema>(provider);

// await db.users.upsert({
//   id: "1",
//   name: "Wall-e",
// });

// await db.users.deleteAll();
