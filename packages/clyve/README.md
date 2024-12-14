# Clyve
A simple client that allows you to use AWS S3 as a database. It’s a lightweight solution for quick MVPs or proof-of-concepts, letting you store, retrieve, and manage JSON objects without a complex database setup. While it’s not ideal for production-grade requirements, it leverages S3’s low cost, durability, and scalability, making it easy to handle structured data directly in a bucket using straightforward CRUD operations.

## Key Features
- 🕒 Quick to prototype and iterate with.
- ✨ No migrations.
- 💸 Low cost.
- 👨‍💻 Simple and developer friendly client.
- 📠 No code generation or build step.
- 📦 No third-party dependencies (relies on AWS SDK as a peer dependency).
- 🔐 Fully type-safe with strong TypeScript support.

## Notes
- Since this package simply stores JSON files, any schema changes after inserting entries will require you to manually update the existing entries or clear the database.

## Installation
Install required packages
```bash
npm install clyve @aws-sdk/client-s3
```

## Usage
```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "clyve";

// Create an S3 client.
export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

// Create your schema type, id is required in every model.
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

const bucketName = "my-bucket";

// Create Clyve client.
const db = createClient<MySchema>(s3Client, bucketName);
```

## Operations
Create a single entry, will throw `DuplicateKeyError` if the id already exists:
```typescript
await db.users.create({
  id: "1",
  name: "Wall-e",
});
```

Update a single entry, will throw `KeyDoesNotExistError` if the id doesn't exist:
```typescript
await db.users.update({
  id: "1",
  name: "Nemo",
});
```

Create multiple, will throw `DuplicateKeyError` if at least one entry with same id already exists:
```typescript
await db.users.createMany([
  {
    id: "1",
    name: "Nemo",
  },
  {
    id: "2",
    name: "Wall-e",
  }
]);
```

Upsert a single entry, will create the entry if it doesn't exist, otherwise replace it:
```typescript
await db.users.upsert({
  id: "1",
  name: "Woody",
});
```

Check if a entry exists:
```typescript
const exists = await db.users.exists("1");
```

Retrieve a single entry by id:
```typescript
const user = await db.users.get("1");
```

List all entries:
```typescript
const users = await db.users.all();
```

Count entries in a collection:
```typescript
const numberOfUsers = await db.users.count();
```

Delete an entry:
```typescript
await db.users.delete("1");
```

Delete multiple entries:
```typescript
await db.users.deleteMany(["1", "2"]);
```

Delete all entries in a collection:
```typescript
await db.users.deleteAll();
```
