import test from "node:test";
import assert from "node:assert/strict";
import { isRateLimited } from "../lib/rate-limit";

test("Rate Limiter - permite peticiones dentro del límite", () => {
  const key = "test_user_allowed";
  assert.equal(isRateLimited(key, 5, 10000), false);
  assert.equal(isRateLimited(key, 5, 10000), false);
  assert.equal(isRateLimited(key, 5, 10000), false);
});

test("Rate Limiter - bloquea al exceder la cuota permitida", () => {
  const key = "test_user_exceeded";
  for (let i = 0; i < 5; i++) {
    isRateLimited(key, 5, 10000);
  }
  assert.equal(isRateLimited(key, 5, 10000), true);
});
