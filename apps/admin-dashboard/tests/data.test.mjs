import test from 'node:test';import assert from 'node:assert/strict';
import {csv,riskForEvent,scanRisk,totals,demo} from '../src/data.js';
import {normalizeBase,createApi,ApiError} from '../src/api.js';
test('risk only when explicitly classified',()=>{
  assert.equal(riskForEvent({category:'process'}),'unassessed');
  assert.equal(riskForEvent({payload:{risk_level:'High'}}),'high');
  assert.equal(scanRisk({result:'Suspicious'}),'review');
  assert.equal(scanRisk({result:'No rules triggered'}),'unassessed');
});
test('CSV escapes formulas and delimiters',()=>{
  const value=csv([{device:'=SUM(1,2)',note:'a,"b"'}],[{key:'device',label:'Device'},{key:'note',label:'Note'}]);
  assert.ok(value.includes("'="));assert.ok(value.includes('a,""b""'));
});
test('demo labels are fictional and categorized',()=>{
  assert.equal(demo.devices.length,6);assert.equal(totals(demo.events).agent,1);
  assert.equal(demo.integrity.filter(x=>x.status==='Mismatch').length,1);
});
test('backend URL requires HTTPS off localhost',()=>{
  assert.throws(()=>normalizeBase('http://insecure.example'),/HTTPS/);
  assert.equal(normalizeBase('https://lab.example/api/'),'https://lab.example/api');
});
test('unauthenticated live calls fail closed without contacting server',async()=>{
  await assert.rejects(()=>createApi('',()=>null).devices(),e=>e instanceof ApiError&&e.status===401);
});
