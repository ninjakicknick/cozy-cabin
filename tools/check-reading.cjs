const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=spawn('python3',['-m','http.server','8080'],{stdio:'ignore'});
const errors=[];
(async()=>{
  fs.mkdirSync('reading-checks',{recursive:true});
  for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:8080');break}catch{await new Promise(r=>setTimeout(r,100))}}
  const browser=await chromium.launch();
  try{
    const context=await browser.newContext({viewport:{width:1365,height:900}});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cozy-cabin.memory.v1')).reading);
    const enter=async()=>{await page.locator('[data-id=books]').click();await page.locator('[data-action=shelf]').click()};
    const open=async id=>{await page.locator('.book-spine').nth(id).click();await page.waitForFunction(()=>!document.querySelector('.novel-next').disabled)};
    await page.goto('http://127.0.0.1:8080');await enter();
    await page.screenshot({path:'reading-checks/shelf-desktop.png'});await open(0);
    for(let i=0;i<5;i++)await page.locator('.novel-next').click();
    const first=(await saved()).willows;assert.ok(first>1000);
    const passage=await page.locator('.novel-text').first().innerText();
    await page.screenshot({path:'reading-checks/reading-desktop.png'});
    assert.ok(await page.locator('.novel-text').evaluateAll(es=>es.every(e=>e.scrollHeight<=e.clientHeight+1)));
    await page.keyboard.press('Escape');await open(8);
    for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');
    const second=(await saved()).dracula;assert.ok(second>0);assert.equal((await saved()).willows,first);
    await page.keyboard.press('Escape');await open(0);assert.equal(await page.locator('.novel-text').first().innerText(),passage);
    await page.reload();await enter();await open(0);assert.equal((await saved()).willows,first);
    assert.equal(await page.locator('.novel-text').first().innerText(),passage);
    await page.keyboard.press('ArrowLeft');assert.ok((await saved()).willows<first);
    await page.keyboard.press('ArrowRight');
    for(const [width,height] of [[390,844],[844,390],[1280,720]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(250);
      const before=(await saved()).willows;
      await page.keyboard.press('ArrowRight');assert.ok((await saved()).willows>before);
      assert.ok(await page.locator('.novel-text').evaluateAll(es=>es.filter(e=>e.parentElement.getClientRects().length).every(e=>e.scrollHeight<=e.clientHeight+1)));
      await page.screenshot({path:`reading-checks/reader-${width}.png`});
      await page.keyboard.press('Escape');await page.screenshot({path:`reading-checks/shelf-${width}.png`});await open(0);
    }
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.locator('#lights').click();await page.locator('[data-action=shelf]').click();await open(0);
    assert.ok(await page.locator('#reading').evaluate(e=>e.classList.contains('firelit')));
    await page.screenshot({path:'reading-checks/firelight.png'});
    // Fullscreen uses the stage, which contains the dialog.
    await page.keyboard.press('f');assert.ok(await page.evaluate(()=>!!document.fullscreenElement));await page.keyboard.press('f');
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    // Notebook and clock route still exist.
    await page.locator('[data-action=book]').click();await page.locator('#next-page').click();await page.keyboard.press('Escape');await page.locator('[data-action=clockView]').click();await page.locator('[data-id=clock]').waitFor();await page.locator('#back').click();
    // Actual gamepad poll path with a synthetic controller.
    await page.evaluate(()=>{window.testPad={connected:true,buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0]};navigator.getGamepads=()=>[window.testPad]});
    async function pad(i){await page.evaluate(i=>window.testPad.buttons[i].pressed=true,i);await page.waitForTimeout(60);await page.evaluate(i=>window.testPad.buttons[i].pressed=false,i);await page.waitForTimeout(60)}
    await pad(0);await page.locator('#reading[open]').waitFor();await pad(15);await pad(0);await page.waitForFunction(()=>!document.querySelector('.novel-next').disabled);await pad(15);await pad(15);assert.ok(Object.keys(await saved()).length>=3);await pad(1);assert.ok(await page.locator('.shelf-view').isVisible());await pad(1);assert.equal(await page.locator('#reading').evaluate(e=>e.open),false);
    // Installation precaches unread books as well as the module graph.
    await page.waitForFunction(async()=>{const cache=await caches.open('cozy-cabin-books-v1');return (await cache.keys()).length===12});
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForSelector('[data-id=books]');
    await context.setOffline(true);await page.reload();await enter();await open(4);await page.keyboard.press('ArrowRight');assert.ok((await page.locator('.novel-text').first().innerText()).length>100);
    await page.screenshot({path:'reading-checks/offline-unread-book.png'});
    assert.deepEqual(errors,[]);fs.writeFileSync('reading-checks/result.json',JSON.stringify({passed:true,errors,checks:['independent bookmarks','reload','previous after reload','responsive portrait/landscape','lights off','fullscreen','notebook','clock route','synthetic gamepad','offline reload and unread book']},null,2));
  }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync('reading-checks/failure.txt',String(e.stack));console.error(e);process.exitCode=1}).finally(()=>server.kill());
