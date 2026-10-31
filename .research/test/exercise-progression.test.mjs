import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(html.slice(html.indexOf("const TIME_ZONE ="),html.indexOf("const DEFAULT_SHEET_URL ="))+';globalThis.api={exerciseProgression,exerciseTotals,roundExerciseTarget,checkInWindow,shiftDate};',context);
const {exerciseProgression:plan,exerciseTotals:totals,roundExerciseTarget:round,checkInWindow,shiftDate}=context.api;
function days(count,start='2026-10-31') {const s={};for(let i=0;i<count;i++)for(const p of ['am','pm'])s[`${shiftDate(start,i)}-${p}`]={pushups:true,situps:true};return s;}
test('3% increases rounded per adjustment every three completed days; next-morning activation',()=>{
 for(const [n,expected] of [[0,25],[2,25],[3,26],[6,27],[9,28]])assert.equal(plan(days(n),`${shiftDate('2026-10-31',n)}-am`).target,expected);
 const p=plan(days(3),'2026-11-02-pm');assert.equal(p.target,25);assert.equal(p.fullDays,3);assert.equal(p.nextTarget,26);assert.equal(p.earnedTonight,true);
});
test('a gap undoes one increase once, resets streak, and never decays below baseline',()=>{
 const s=days(6);assert.equal(plan(s,'2026-11-06-am').target,27);
 assert.equal(plan(s,'2026-11-07-am').target,26);assert.equal(plan(s,'2026-11-10-am').target,26);assert.equal(plan(s,'2026-11-10-am').fullDays,0);
 assert.equal(plan(days(2),'2026-11-10-am').target,25);
 Object.assign(s,days(3,'2026-11-10'));assert.equal(plan(s,'2026-11-13-am').target,27);
});
test('partial or absent check-ins fail the day, pending windows preserve streak, and old logs remain 25',()=>{
 const s=days(3);s['2026-11-01-pm'].situps=false;
 assert.equal(plan(s,'2026-11-03-am').target,25);
 assert.equal(plan(days(3),'2026-11-03-am').fullDays,3);
 assert.equal(plan(days(3),'2026-11-03-pm').fullDays,0);
 const old=days(3,'2026-10-27');assert.equal(totals(old,'2026-11-03-am').pushups,150);assert.equal(plan(old,'2026-11-03-am').target,25);
 const reversed=Object.fromEntries(Object.entries(days(6)).reverse());assert.equal(plan(reversed,'2026-11-06-am').target,27);
});
test('round half up on each adjustment; history uses the dated goal',()=>{
 assert.equal(round(26.5),27);assert.equal(round(26.49999),26);assert.equal(round(26.50001),27);
 const s=days(4);assert.equal(totals(s,'2026-11-03-pm').pushups,202);assert.equal(totals(s,'2026-11-03-pm').situps,202);
});
test('Eastern 7AM day boundary follows daylight saving change',()=>{
 assert.equal(checkInWindow(new Date('2026-11-01T11:59:00Z')).key,'2026-10-31-pm');
 assert.equal(checkInWindow(new Date('2026-11-01T12:00:00Z')).key,'2026-11-01-am');
});
