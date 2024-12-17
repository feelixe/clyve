import { createClient } from "clyve";
import { FileSystemProvider } from "clyve/providers";
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

const provider = new FileSystemProvider("./data");
const db = createClient<MySchema>(provider);

await db.users.upsert({
  id: "1",
  name: "Wall-e",
});

await db.users.deleteAll();
