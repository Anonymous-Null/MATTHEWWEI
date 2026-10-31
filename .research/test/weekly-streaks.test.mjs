import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../../index.html',import.meta.url),'utf8'),ctx=vm.createContext({});
vm.runInContext(html.slice(html.indexOf('const TIME_ZONE ='),html.indexOf('const DEFAULT_SHEET_URL ='))+';globalThis.habit=weeklyHabitStreak;',ctx);
const habit=ctx.habit, records=dates=>dates.map(date=>({date}));
test('run streak counts 2 runs/week, includes a finished current week and preserves an unfinished one',()=>{
 const r=records(['2026-11-03','2026-11-04','2026-11-10','2026-11-12','2026-11-16']);
 assert.equal(habit(r,2,'2026-11-20').streak,2);r.push({date:'2026-11-18'});assert.equal(habit(r,2,'2026-11-20').streak,3);
 assert.equal(habit(r,2,'2026-11-23').streak,3);assert.equal(habit(r,2,'2026-11-30').streak,0);
});
test('lifting needs distinct days, any exercise counts, and deleting the final set on a date changes the streak',()=>{
 const r=records(['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-16','2026-11-16','2026-11-17','2026-11-18']);
 assert.equal(habit(r,4,'2026-11-20',true).current,3);assert.equal(habit(r,4,'2026-11-20',true).streak,1);
 r.push({date:'2026-11-19'});assert.equal(habit(r,4,'2026-11-20',true).streak,2);
 assert.equal(habit(r.filter(x=>x.date!=='2026-11-19'),4,'2026-11-20',true).streak,1);
});
test('missing weeks reset, multiple runs on one date count, future dates are ignored, and weeks cross years',()=>{
 const r=records(['2026-12-28','2026-12-28','2027-01-04','2027-01-04','2027-01-06']);
 assert.equal(habit(r,2,'2027-01-04').current,2);assert.equal(habit(r,2,'2027-01-04').streak,2);
 assert.equal(habit([],2,'2027-01-04').streak,0);assert.equal(habit(r,2,'2027-01-18').streak,0);
 assert.equal(habit([...r].reverse(),2,'2027-01-04').streak,2);
});
