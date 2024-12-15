import { createClient } from "clyve";
import { FileSystemAdapter } from "clyve/adapters";
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
const adapter = new FileSystemAdapter("./data");
const db = createClient<MySchema>(adapter);

await db.users.upsert({
  id: "1",
  name: "Wall-e",
});

const user = await db.users.get("1");

console.log(user);
