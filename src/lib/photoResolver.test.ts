import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { createPhotoResolver } from "./photoResolver";

describe("Photo request sharing", () => {
  test("batches overlapping requests and preserves image order", async () => {
    const batches: string[][] = [];
    const resolve = createPhotoResolver(async (paths) => {
      batches.push(paths);
      return Object.fromEntries(paths.map((path) => [path, `signed:${path}`]));
    });
    const result = await Promise.all([resolve(["a", "b"]), resolve(["b", "c", ""])]);
    assert.deepEqual(batches, [["a", "b", "c"]]);
    assert.deepEqual(result, [["signed:a", "signed:b"], ["signed:b", "signed:c", ""]]);
  });
  test("reuses successful links only before cache expiry", async () => {
    let time = 0;
    let calls = 0;
    const resolve = createPhotoResolver(async () => ({ a: `url:${++calls}` }), () => time);
    assert.deepEqual(await resolve(["a"]), ["url:1"]);
    time = 299999;
    assert.deepEqual(await resolve(["a"]), ["url:1"]);
    time = 300000;
    assert.deepEqual(await resolve(["a"]), ["url:2"]);
  });
  test("unresolved photos are retried rather than cached", async () => {
    let calls = 0;
    const resolve = createPhotoResolver(async () => ++calls === 1 ? {} : { a: "available" });
    assert.deepEqual(await resolve(["a"]), [""]);
    assert.deepEqual(await resolve(["a"]), ["available"]);
  });
  test("separate identities do not reuse photo links", async () => {
    const admin = createPhotoResolver(async () => ({ a: "private-preview" }));
    const guest = createPhotoResolver(async () => ({}));
    assert.deepEqual(await admin(["a"]), ["private-preview"]);
    assert.deepEqual(await guest(["a"]), [""]);
  });
  test("saved links are reused across visits until they expire", async () => {
    const mem: Record<string, string> = {};
    const storage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    let time = 0, calls = 0;
    const opts = { ttlMs: 1000, storage, storageKey: "k" };
    const first = createPhotoResolver(async () => ({ a: `url:${++calls}` }), () => time, opts);
    assert.deepEqual(await first(["a"]), ["url:1"]);
    const nextVisit = createPhotoResolver(async () => ({ a: `url:${++calls}` }), () => time, opts);
    assert.deepEqual(await nextVisit(["a"]), ["url:1"]);
    time = 1000;
    const later = createPhotoResolver(async () => ({ a: `url:${++calls}` }), () => time, opts);
    assert.deepEqual(await later(["a"]), ["url:2"]);
  });
});
