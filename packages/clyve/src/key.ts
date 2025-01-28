export function toKey(collection: string, id: string) {
  return `${collection}/${id}.json`;
}

export function parseKey(key: string) {
  const [collection, file] = key.split("/");
  const id = file.split(".")[0];
  if (!collection || !id) {
    throw new Error(`Invalid key: "${key}"`);
  }
  return { collection, id };
}
