import test from "node:test";
import assert from "node:assert/strict";
import { activityDays, monthRange } from "../lib/activity";
import { GET } from "../app/api/activity/route";
test("calendar combines trips and prediction-only dates by Miami day", () => {
  assert.deepEqual(activityDays("2026-10", [
    { timestamp: "2026-10-01T03:59:00Z" },
    { timestamp: "2026-10-01T04:00:00Z" },
    { timestamp: "2026-10-02T03:59:00Z" },
    { timestamp: "2026-11-01T03:59:00Z" },
  ], [{ date: "2026-10-03" }, { date: "2026-10-01" }, { date: "2026-11-01" }]), [
    { date: "2026-10-01", trips: 2, predictions: 1 },
    { date: "2026-10-03", trips: 0, predictions: 1 },
    { date: "2026-10-31", trips: 1, predictions: 0 },
  ]);
  assert.deepEqual(activityDays("2026-10", [], []), []);
});
test("month query covers rollover and late Miami timestamps", () => {
  assert.deepEqual(monthRange("2026-12"), { start: "2026-12-01T00:00:00.000Z", end: "2027-01-02T00:00:00.000Z", nextMonth: "2027-01" });
  for (const month of ["", "2026-13", "2026-2", "bad"]) assert.throws(() => monthRange(month));
});
test("activity dates require authentication and reject malformed months", async () => {
  const saved = process.env.SHORTCUTS_API_KEY;
  try {
    process.env.SHORTCUTS_API_KEY = "test";
    const denied = await GET(new Request("https://example.com/api/activity?month=2026-10"));
    assert.equal(denied.status, 401);
    assert.equal(denied.headers.get("cache-control"), "no-store");
    assert.equal((await GET(new Request("https://example.com/api/activity?month=2026-13", { headers: { Authorization: "Bearer test" } }))).status, 400);
  } finally { if (saved === undefined) delete process.env.SHORTCUTS_API_KEY; else process.env.SHORTCUTS_API_KEY = saved; }
});
