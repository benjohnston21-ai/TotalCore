import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// File storage behind a small interface: local disk in development,
// Cloudflare R2 in production (STORAGE_DRIVER=r2).
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

// Cloudflare R2, through the FILES bucket binding in wrangler.jsonc.
class R2Storage implements StorageDriver {
  private bucket() {
    return getCloudflareContext().env.FILES;
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.bucket().put(key, body, { httpMetadata: { contentType } });
  }

  async get(key: string) {
    const object = await this.bucket().get(key);
    if (!object) throw new Error(`File not found in storage: ${key}`);
    return Buffer.from(await object.arrayBuffer());
  }

  async delete(key: string) {
    await this.bucket().delete(key);
  }
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  if (!driver) {
    const kind = process.env.STORAGE_DRIVER ?? "local";
    if (kind === "r2") driver = new R2Storage();
    else if (kind === "local") driver = new LocalDiskStorage(process.env.STORAGE_DIR ?? "./storage");
    else throw new Error(`Unsupported STORAGE_DRIVER: ${kind}`);
  }
  return driver;
}

export function newStorageKey(companyId: string, fileName: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${companyId}/${randomUUID()}${ext}`;
}
