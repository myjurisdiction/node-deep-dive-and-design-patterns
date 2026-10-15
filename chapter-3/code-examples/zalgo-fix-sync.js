import { readFileSync } from "node:fs";

const cache = new Map();

export function consistentReadSync(filename) {
  if (cache.has(filename)) {
    return cache.get(filename);
  }
  const data = readFileSync(filename, "utf8");
  cache.set(filename, data);
  return data;
}
