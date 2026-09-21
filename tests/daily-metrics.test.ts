import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyMetrics } from '../lib/daily-metrics';
test('daily rate includes tips and gaps, independent of order', () => {
 const result = dailyMetrics([{fare:70,tip:10,timestamp:'2026-09-21T17:00:00Z'},{fare:30,tip:10,timestamp:'2026-09-21T13:00:00Z'}]);
 assert.equal(result.total,120); assert.equal(result.hours,4); assert.equal(result.hourly,30);
});
test('empty, single, simultaneous and invalid timestamps do not show a misleading rate', () => {
 const trip={fare:10,tip:2,timestamp:'2026-09-21T13:00:00Z'};
 for(const trips of [[],[trip],[trip,trip],[trip,{...trip,timestamp:'invalid'}]]) assert.equal(dailyMetrics(trips).hourly,null);
});
test('rate uses elapsed time across daylight saving changes', () => {
 const result=dailyMetrics([{fare:10,tip:0,timestamp:'2026-11-01T01:30:00-04:00'},{fare:10,tip:0,timestamp:'2026-11-01T01:30:00-05:00'}]);
 assert.equal(result.hours,1); assert.equal(result.hourly,20);
});
