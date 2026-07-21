import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeNetworkError } from "./sanitized-network-error.ts";

test("sanitizes network errors using an explicit field allowlist", () => {
  const cause = Object.assign(new Error("connect failed"), {
    code: "UND_ERR_CONNECT",
    errno: -4_042,
    syscall: "connect",
    address: "203.0.113.1",
    port: 443,
    authorization: "must-not-leak",
  });
  const error = new TypeError("fetch failed", { cause });

  assert.deepEqual(sanitizeNetworkError(error), {
    errorName: "TypeError",
    causeCode: "UND_ERR_CONNECT",
    causeMessage: "connect failed",
    errno: -4_042,
    syscall: "connect",
    address: "203.0.113.1",
    port: 443,
  });
  assert.equal("authorization" in sanitizeNetworkError(error), false);
});

