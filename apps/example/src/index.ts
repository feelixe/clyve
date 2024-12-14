import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "clyve";
import { DuplicateKeyError } from "clyve/errors";
import "dotenv/config";

new DuplicateKeyError();

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

const db = createClient<MySchema>(s3Client, "scoreboard-app");

await db.users.exists("1");

const exists = await db.users.exists("1");

console.log(exists);

await db.users.deleteAll();

await db.users.deleteMany(["1", "2"]);

// db.users.create({
//   "id": "1",
//   "name": "Truls"
// })

// await db.users.create({
//   id: "1",
//   name: "Truls",
// });

// await db.users.createMany([
//   {
//     id: "1",
//     name: "Truls",
//   },
//   {
//     id: "2",
//     name: "Jan-Ove Waldner",
//   }
// ]);

// const all = await db.products.all();
// console.log(all);

// const ps3 = await db.products.get("ps3");
// console.log(ps3);

// await db.products.createMany([
//   {
//     id: "ps5",
//     name: "Playstation 5",
//     price: 499,
//   },
//   {
//     id: "xbox",
//     name: "Xbox Series X",
//     price: 499,
//   },
// ]);

// const all2 = await db.products.all();
// console.log(all2);

// await db.products.delete("ps5");

// const numProds = await db.products.count();
// console.log(numProds);

// const jan = await db.users.get("1");

// const users = await db.users.all();

// await db.users.delete("1");
