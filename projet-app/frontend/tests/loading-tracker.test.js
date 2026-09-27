import assert from "node:assert/strict";
import test from "node:test";
import { installFetchTracking, isWriteMethod, loadingState, trackRequest } from "../src/utils/loadingTracker.js";

test("reads and writes are counted apart, and each end counts once", () => {
  const endRead = trackRequest("get");
  const endWrite = trackRequest("POST");
  assert.equal(loadingState.reads, 1);
  assert.equal(loadingState.writes, 1);
  endWrite();
  endWrite();
  assert.equal(loadingState.writes, 0);
  endRead();
  assert.equal(loadingState.reads, 0);
  assert.ok(isWriteMethod("patch") && isWriteMethod("DELETE") && !isWriteMethod(undefined));
});

test("fetch tracking only covers backend API calls and settles on failure", async () => {
  let resolveApi;
  globalThis.window = {
    fetch: (input) =>
      String(input).startsWith("https://api.test")
        ? new Promise((resolve, reject) => (resolveApi = { resolve, reject }))
        : Promise.resolve("asset"),
  };
  installFetchTracking("https://api.test/");

  await window.fetch("/docs/guide.md");
  assert.equal(loadingState.reads, 0);

  const pending = window.fetch("https://api.test/sessions/1/submit", { method: "POST" });
  assert.equal(loadingState.writes, 1);
  resolveApi.reject(new Error("network"));
  await assert.rejects(pending);
  assert.equal(loadingState.writes, 0);
});
