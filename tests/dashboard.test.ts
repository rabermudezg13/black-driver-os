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

test('delete requires authentication and rejects invalid document paths', async () => {
 const { DELETE } = await import('../app/api/dashboard/route');
 const before = process.env.SHORTCUTS_API_KEY;
 try {
  process.env.SHORTCUTS_API_KEY='private-test';
  assert.equal((await DELETE(new Request('https://example.com/api/dashboard?id=trip-1', {method:'DELETE'}))).status,401);
  for(const id of ['', '../other', 'a/b', '.']) {
   const result=await DELETE(new Request('https://example.com/api/dashboard?id='+encodeURIComponent(id),{method:'DELETE',headers:{Authorization:'Bearer private-test'}}));
   assert.equal(result.status,400);
  }
 } finally {if(before===undefined)delete process.env.SHORTCUTS_API_KEY;else process.env.SHORTCUTS_API_KEY=before;}
});
