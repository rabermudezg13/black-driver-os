import { test } from "node:test";
import assert from "node:assert/strict";
import { miamiDay, parsePrediction } from "../lib/predictions";
import { GET, POST } from "../app/api/predictions/route";
test("predictions validate dates and reject invalid revenue", () => {
  const input = { date: "2026-10-04", plan: " Brickell por la tarde ", expectedRevenue: 200, notes: "" };
  assert.equal(parsePrediction(input).plan, "Brickell por la tarde");
  for (const change of [{ date: "2026-02-30" }, { expectedRevenue: -1 }, { expectedRevenue: Infinity }, { plan: " " }]) assert.throws(() => parsePrediction({ ...input, ...change }));
});
test("comparison groups trip timestamps by Miami day across daylight savings", () => {
  assert.equal(miamiDay(new Date("2026-10-05T03:59:00Z")), "2026-10-04");
  assert.equal(miamiDay(new Date("2026-10-05T04:00:00Z")), "2026-10-05");
  assert.equal(miamiDay(new Date("2026-12-05T04:59:00Z")), "2026-12-04");
  assert.equal(miamiDay(new Date("2026-12-05T05:00:00Z")), "2026-12-05");
});
test("journal rejects unauthorized reads and writes before accessing storage", async () => {
  const previous = { ...process.env };
  try {
    process.env.SHORTCUTS_API_KEY = "test-key";
    process.env.FIREBASE_PROJECT_ID = "test";
    process.env.FIREBASE_CLIENT_EMAIL = "test@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "test";
    assert.equal((await GET(new Request("http://localhost/api/predictions"))).status, 401);
    assert.equal((await POST(new Request("http://localhost/api/predictions", { method: "POST" }))).status, 401);
    assert.equal((await POST(new Request("http://localhost/api/predictions", { method: "POST", headers: { Authorization: "Bearer test-key" }, body: "{}" }))).status, 400);
  } finally { process.env = previous; }
});
