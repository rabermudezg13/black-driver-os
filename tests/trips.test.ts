import test from "node:test";
import assert from "node:assert/strict";
import { parseTrip } from "../lib/trips";
const trip = { zone: " Brickell ", service: "Black SUV", fare: "62.50", miles: 12, tripMinutes: 30 };
test("Shortcuts numeric strings and defaults", () => {
  assert.deepEqual(parseTrip(trip), { zone: "Brickell", service: "Black SUV", fare: 62.5, miles: 12, tripMinutes: 30, tip: 0, waitingMinutes: 0 });
});
test("reject malformed bodies", () => {
  for (const value of [null, [], "text", {}, { ...trip, zone: " " }, { ...trip, service: "invalid" }]) assert.throws(() => parseTrip(value));
});
test("reject invalid numbers rather than silently recording zero or NaN", () => {
  for (const key of ["fare", "tip", "miles", "waitingMinutes", "tripMinutes"]) {
    for (const value of [null, true, "", " ", "abc", "1,25", -1, Infinity, NaN, {}, [], 1000001]) assert.throws(() => parseTrip({ ...trip, [key]: value }));
  }
});
