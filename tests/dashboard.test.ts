import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/dashboard/route';
test('dashboard protects private trips and never caches responses', async () => {
 const before = process.env.SHORTCUTS_API_KEY;
 try {
  delete process.env.SHORTCUTS_API_KEY;
  assert.equal((await GET(new Request('https://example.com/api/dashboard'))).status,503);
  process.env.SHORTCUTS_API_KEY='private-test';
  const result=await GET(new Request('https://example.com/api/dashboard'));
  assert.equal(result.status,401);
  assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal('trips' in await result.json(),false);
 } finally {if(before===undefined)delete process.env.SHORTCUTS_API_KEY;else process.env.SHORTCUTS_API_KEY=before;}
});
