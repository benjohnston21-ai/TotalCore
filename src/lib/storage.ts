import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// File storage behind a small interface so the local-disk driver used in
// development can be swapped for S3-compatible storage in production.
export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalDiskStorage implements StorageDriver {
  constructor(private root: string) {}

  private resolve(key: string) {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, body: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async get(key: string) {
    return readFile(this.resolve(key));
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  if (!driver) {
    const kind = process.env.STORAGE_DRIVER ?? "local";
    if (kind !== "local") throw new Error(`Unsupported STORAGE_DRIVER: ${kind}`);
    driver = new LocalDiskStorage(process.env.STORAGE_DIR ?? "./storage");
  }
  return driver;
}

export function newStorageKey(companyId: string, fileName: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${companyId}/${randomUUID()}${ext}`;
}
