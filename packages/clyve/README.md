# Clyve
A lightweight client for using either AWS S3 or the filesystem as a database via adapters. Perfect for quick MVPs or prototypes, it lets you store, retrieve, and manage JSON objects without a full database setup. While not suited for production, it takes advantage of S3’s scalability or the simplicity of the filesystem, enabling easy CRUD operations on structured data.

## Key Features
- 🕒 Quick to prototype and iterate with.
- ✨ No migrations.
- 💸 Low cost.
- 👨‍💻 Simple and developer friendly client.
- 📠 No code generation or build step.
- 📦 No third-party dependencies.
- 🔐 Fully type-safe with strong TypeScript support.

## Notes
- Since this package simply stores JSON files, any schema changes after inserting entries will require you to manually update the existing entries or clear the database.

## Installation
Install required packages
```bash
npm install clyve
```

Install the S3 client if you want to use the S3 adapter
```bash
npm install @aws-sdk/client-s3
```

## Usage with S3 Adapter
```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "clyve";
import { S3Adapter } from "clyve/adapters";

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

// Create Clyve client.
const bucketName = "my-bucket";
const adapter = new S3Adapter(s3Client, bucketName);
const db = createClient<MySchema>(adapter);
```

## Usage with file system adapter
```typescript
import { createClient } from "clyve";
import { FileSystemAdapter } from "clyve/adapters";

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

// Create Clyve client.
const adapter = new FileSystemAdapter("./data");
const db = createClient<MySchema>(adapter);
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
