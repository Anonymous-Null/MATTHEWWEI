import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(html.slice(html.indexOf("const TIME_ZONE ="),html.indexOf("const DEFAULT_SHEET_URL ="))+';globalThis.api={exerciseProgression,exerciseTotals,roundExerciseTarget,checkInWindow,shiftDate,weeklyReflection,exerciseWindow};',context);
const {exerciseProgression:plan,exerciseTotals:totals,roundExerciseTarget:round,checkInWindow,shiftDate}=context.api;
function days(count,start='2026-10-31') {const s={};for(let i=0;i<count;i++)for(const p of ['am','pm'])s[`${shiftDate(start,i)}-${p}`]={pushups:true,situps:true};return s;}
test('+2 after every three full days, applied next morning, capped at 65',()=>{
 for(const [n,expected] of [[0,25],[2,25],[3,27],[6,29],[9,31],[59,63],[60,65],[120,65]])assert.equal(plan(days(n),`${shiftDate('2026-10-31',n)}-am`).target,expected);
 const p=plan(days(3),'2026-11-02-pm');assert.equal(p.target,25);assert.equal(p.fullDays,3);assert.equal(p.nextTarget,27);assert.equal(p.earnedTonight,true);
 const max=plan(days(63),`${shiftDate('2026-10-31',62)}-pm`);assert.equal(max.target,65);assert.equal(max.nextTarget,65);assert.equal(max.earnedTonight,false);
});
test('miss penalties are 2, 2, 6, 6 onward, with floor 25; a complete day resets penalties',()=>{
 const s=days(30),start='2026-10-31';
 for(const [n,expected] of [[30,45],[31,43],[32,41],[33,35],[34,29],[35,25],[40,25]])assert.equal(plan(s,`${shiftDate(start,n)}-am`).target,expected);
 assert.equal(plan(s,`${shiftDate(start,33)}-am`).missedDays,3);
 Object.assign(s,days(1,shiftDate(start,33)));
 assert.equal(plan(s,`${shiftDate(start,34)}-am`).target,35);
 assert.equal(plan(s,`${shiftDate(start,35)}-am`).target,33,'A full day resets a later miss to -2');
 const recovered={...days(30),...days(3,shiftDate(start,33))};
 assert.equal(plan(recovered,`${shiftDate(start,36)}-am`).target,37);
 assert.equal(plan({},'2026-12-20-am').target,25);
});
test('partial or absent check-ins fail the day, pending windows preserve streak, and old logs remain 25',()=>{
 const s=days(3);s['2026-11-01-pm'].situps=false;
 assert.equal(plan(s,'2026-11-03-am').target,25);
 assert.equal(plan(days(3),'2026-11-03-am').fullDays,3);
 assert.equal(plan(days(3),'2026-11-03-pm').fullDays,0);
 const old=days(3,'2026-10-27');assert.equal(totals(old,'2026-11-03-am').pushups,150);assert.equal(plan(old,'2026-11-03-am').target,25);
 const reversed=Object.fromEntries(Object.entries(days(6)).reverse());assert.equal(plan(reversed,'2026-11-06-am').target,29);
});
test('round half up on each adjustment; history uses the dated goal',()=>{
 assert.equal(round(26.5),27);assert.equal(round(26.49999),26);assert.equal(round(26.50001),27);
 const s=days(4);assert.equal(totals(s,'2026-11-03-pm').pushups,204);assert.equal(totals(s,'2026-11-03-pm').situps,204);
});
test('Eastern 7AM day boundary follows daylight saving change',()=>{
 assert.equal(checkInWindow(new Date('2026-11-01T11:59:00Z')).key,'2026-10-31-pm');
 assert.equal(checkInWindow(new Date('2026-11-01T12:00:00Z')).key,'2026-11-01-am');
});

test('Sunday recap counts yellow check-ins as half, excludes other weeks and unopened windows',()=>{
 const state={sessions:{
  '2026-10-30-am':{pushups:true,situps:true},
  '2026-10-30-pm':{pushups:false,situps:true},
  '2026-10-31-am':{pushups:false,situps:false},
  '2026-11-01-am':{pushups:true,situps:false},
  '2026-11-01-pm':{pushups:true,situps:true},
  '2026-10-25-am':{pushups:true,situps:true},
  '2026-11-02-am':{pushups:true,situps:true}
 }};
 const recap=context.api.weeklyReflection;
 assert.equal(recap(state,'2026-11-01',new Date('2026-11-01T20:00:00Z')).exercise,2);
 state.sessions['2026-11-01-am'].situps=true;
 assert.equal(recap(state,'2026-11-01',new Date('2026-11-01T20:00:00Z')).exercise,2.5);
 assert.equal(recap(state,'2026-11-01',new Date('2026-11-02T02:00:00Z')).exercise,3.5);
});

test('recap weight uses dated reps, 60% of body weight, partial credit, and selected unit',()=>{
 const state={bodyWeight:{value:165,unit:'lb'},sessions:days(4)};
 const recap=context.api.weeklyReflection;
 let result=recap(state,'2026-11-08',new Date('2026-11-04T15:00:00Z'));
 // Monday Nov 2: 100 reps; Tuesday Nov 3: 108 reps at the increased target of 27.
 assert.equal(result.exerciseReps,208);assert.equal(result.weightMoved,20592);assert.equal(result.weightUnit,'lb');
 state.sessions['2026-11-03-pm'].situps=false;
 result=recap(state,'2026-11-08',new Date('2026-11-04T15:00:00Z'));
 assert.equal(result.exerciseReps,181);assert.equal(result.exercise,3.5);assert.equal(result.weightMoved,17919);
 state.bodyWeight={value:75,unit:'kg'};assert.equal(recap(state,'2026-11-08',new Date('2026-11-04T15:00:00Z')).weightMoved,8145);
 delete state.bodyWeight;assert.equal(recap(state,'2026-11-08',new Date('2026-11-04T15:00:00Z')).weightMoved,null);
});

test('exercise day changes at 3AM Eastern across midnight, fall-back, and spring-forward',()=>{
 const window=context.api.exerciseWindow;
 for(const time of ['2026-11-03T05:01:00Z','2026-11-03T07:59:59Z']){assert.equal(window(new Date(time)).key,'2026-11-02-pm');assert.equal(window(new Date(time)).today,'2026-11-02');}
 assert.equal(window(new Date('2026-11-03T08:00:00Z')).key,'2026-11-03-am');
 assert.equal(window(new Date('2026-11-03T12:00:00Z')).key,'2026-11-03-am');
 assert.equal(checkInWindow(new Date('2026-11-03T08:00:00Z')).key,'2026-11-02-pm','General dashboard stays on its 7AM schedule');
 for(const time of ['2026-11-01T05:30:00Z','2026-11-01T06:30:00Z','2026-11-01T07:59:59Z'])assert.equal(window(new Date(time)).key,'2026-10-31-pm');
 assert.equal(window(new Date('2026-11-01T08:00:00Z')).key,'2026-11-01-am');
 assert.equal(window(new Date('2027-03-14T06:59:59Z')).key,'2027-03-13-pm');assert.equal(window(new Date('2027-03-14T07:00:00Z')).key,'2027-03-14-am');
});
