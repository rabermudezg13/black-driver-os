import test from "node:test";
import assert from "node:assert/strict";
import { POST, GET } from "../app/api/trips/route";

test("API fails closed and rejects invalid requests before storage", async () => {
  const names = ["SHORTCUTS_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
  const saved = names.map(name => process.env[name]);
  const request = (body: string, authorized = true, key = "trip-1") => new Request("http://localhost/api/trips", { method: "POST", headers: { Authorization: authorized ? "Bearer test-key" : "Bearer wrong", "Idempotency-Key": key }, body });
  try {
    for (const name of names) delete process.env[name];
    assert.equal((await GET()).status, 503);
    assert.equal((await POST(request("{}"))).status, 503);
    process.env.SHORTCUTS_API_KEY = "test-key";
    assert.equal((await POST(request("{}", false))).status, 401);
    assert.equal((await POST(request("{}"))).status, 503);
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "fake@example.com";
    process.env.FIREBASE_PRIVATE_KEY = "fake";
    assert.equal((await POST(request("{"))).status, 400);
    assert.equal((await POST(request("null"))).status, 400);
    assert.equal((await POST(request("{}", true, "bad/path"))).status, 400);
    assert.equal((await POST(request(" ".repeat(16385)))).status, 413);
    const response = await POST(request(JSON.stringify({ zone: "MIA", service: "Black", fare: 10, miles: 1, tripMinutes: 5 })));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  } finally {
    names.forEach((name, index) => { if (saved[index] === undefined) delete process.env[name]; else process.env[name] = saved[index]; });
  }
});
