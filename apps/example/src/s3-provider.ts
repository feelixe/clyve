import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "clyve";
import { S3Provider } from "clyve/providers";
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
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const provider = new S3Provider(s3Client, "scoreboard-app");
const db = createClient<MySchema>(provider);

const users = await db.users.all();

console.log(users);
