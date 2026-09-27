import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {shelf,readBookmarks} from '../library.js';
import {readMemory,saveMemory} from '../state.js';
test('each complete local edition matches its pinned source digest and shelf identity',()=>{
  const sources=JSON.parse(fs.readFileSync(new URL('../assets/books/sources.json',import.meta.url)));
  assert.equal(shelf.length,12);
  for(const book of shelf){
    const raw=fs.readFileSync(new URL(`../assets/books/${book.id}.json`,import.meta.url));const data=JSON.parse(raw);
    const source=sources.find(s=>s.id===book.id);
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),source.sha256);
    assert.equal(data.title,book.title);assert.equal(data.author,book.author);assert.ok(source.words>10000);
    assert.ok(data.headings.every(([a,b])=>a>=0&&b>a&&b<=data.text.length));
    assert.ok(!data.text.includes('PROJECT GUTENBERG'));
  }
  assert.equal(sources.find(s=>s.id==='poe').files.filter(f=>!f.includes('endnotes')).length,8);
  assert.ok(sources.find(s=>s.id==='little-women').words>180000);
});
test('independent book offsets survive reload and migration without touching notebook or secrets',()=>{
  let raw=JSON.stringify({page:2,secretOpen:true,clockKey:'clock',reading:{willows:15000,dracula:22000}});
  const storage={getItem:()=>raw,setItem:(_,s)=>raw=s};let memory=readMemory(storage);
  memory.reading.willows=18000;saveMemory(storage,memory);memory=readMemory(storage);
  assert.deepEqual(memory.reading,{willows:18000,dracula:22000});assert.equal(memory.page,2);assert.equal(memory.secretOpen,true);
  assert.deepEqual(readBookmarks({willows:NaN,dracula:-2,poe:1.5,alice:-1,anne:0,unknown:20}),{anne:0,alice:-1});
  assert.deepEqual(readBookmarks(null),{});
});
