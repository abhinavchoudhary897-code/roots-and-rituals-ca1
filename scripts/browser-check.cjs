// Run with Node and Playwright installed, against the local static server.
// Tests use a deterministic image fixture; authentic image loading has a separate test.
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const base=process.env.TEST_URL||"http://127.0.0.1:8080/";
const fixture='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#e8d9c5"/></svg>';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report=[];
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 // Deliberately isolate third-party networks. Image fixture tests UI mechanics only.
 await page.route("https://**/*",r=>r.request().resourceType()==="image"?r.fulfill({status:200,contentType:"image/svg+xml",body:fixture}):r.abort());
 const check=async(name,fn)=>{try{await fn();report.push({name,status:"pass"})}catch(e){report.push({name,status:"fail",detail:String(e)});}};
 await page.goto(base,{waitUntil:"domcontentloaded"});
 await check("initial collection and category names",async()=>{await page.locator("#exhibits .card").first().waitFor();assert.equal(await page.locator("#exhibits .card").count(),5);assert.deepEqual(await page.locator("#category-filter option").allTextContents(),["All categories","Warli","Gond","Bastar Dokra","Santhal","Pithora"])});
 await check("all category filters",async()=>{for(const c of ["Warli","Gond","Bastar Dokra","Santhal","Pithora"]){await page.locator("#category-filter").selectOption({label:c});assert.equal(await page.locator("#exhibits .card").count(),1)}await page.locator("#category-filter").selectOption("all")});
 await check("search and empty state",async()=>{await page.locator("#search").fill("Gautam Markam");assert.equal(await page.locator("#exhibits .card").count(),1);await page.locator("#search").fill("zzzznotfound");assert.equal(await page.locator("#exhibits .card").count(),0);await page.locator("#search").fill("")});
 await check("each artwork detail has story, profile and provenance",async()=>{for(let i=0;i<5;i++){await page.locator("#exhibits .card button").nth(i).click();const d=page.locator("#detail");await d.waitFor({state:"visible"});assert.equal(await d.locator(".story-player").count(),1);assert.equal(await d.locator(".profile-card dt").count(),3);assert.equal(await d.locator(".record-card").count(),1);await page.locator("#close-detail").click();await d.waitFor({state:"hidden"})}});
 await check("zoom, original request, room preview, reset (fixture)",async()=>{await page.locator("#exhibits .card button").first().click();const d=page.locator("#detail");await d.locator(".artwork-viewport img").waitFor();await d.getByRole("button",{name:"Zoom in",exact:true}).click();assert.match(await d.locator(".artwork-viewer .actions").innerText(),/150%/);await d.getByRole("button",{name:"Reset zoom"}).click();assert.match(await d.locator(".artwork-viewer .actions").innerText(),/100%/);await d.getByRole("button",{name:"Room preview",exact:true}).click();assert.equal(await d.locator(".room-mode").count(),1);await d.getByRole("button",{name:"Exit room preview"}).click();await d.getByRole("button",{name:"Load original image"}).click();await page.keyboard.press("Escape");await d.waitFor({state:"hidden"})});
 await check("gallery next / previous",async()=>{const a=await page.locator("#gallery-info h3").innerText();await page.locator("#next-exhibit").click();assert.notEqual(await page.locator("#gallery-info h3").innerText(),a);await page.locator("#prev-exhibit").click();assert.equal(await page.locator("#gallery-info h3").innerText(),a)});
 await check("fair-trade calculation and reset",async()=>{await page.locator("#labour").fill("750");assert.match(await page.locator("#total").innerText(),/1,250/);await page.locator("#reset-price").click();assert.match(await page.locator("#total").innerText(),/1,000/);for(const id of ["materials","labour","logistics","overhead"])await page.locator("#"+id).fill("0");assert.match(await page.locator("#total").innerText(),/₹0/);await page.locator("#reset-price").click()});
 await check("prepared audio files are present",async()=>{for(const key of ["warli","gond","dhokra","sohrai","pithora"]){const res=await page.request.get(new URL("assets/audio/"+key+".mp3",base).href);assert.equal(res.status(),200);assert.ok((await res.body()).length>1000)}});
 await check("responsive layout and mobile navigation",async()=>{for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Horizontal overflow at "+width)}await page.setViewportSize({width:390,height:844});await page.locator("#menu").click();assert.equal(await page.locator("#menu").getAttribute("aria-expanded"),"true");await page.locator("#navigation a").first().click();assert.equal(await page.locator("#menu").getAttribute("aria-expanded"),"false")});
 await check("direct story entry and audio playback",async()=>{
   assert.equal(await page.locator("#story-list li").count(),5);
   await page.locator("#story-list button").first().click();
   const d=page.locator("#detail");await d.waitFor({state:"visible"});
   assert.equal(await d.locator("audio").getAttribute("preload"),"none");
   await d.getByRole("button",{name:"Play narration",exact:true}).click();
   await page.waitForFunction(()=>document.querySelector("#detail audio")?.currentTime>0.1,{},{timeout:12000});
   await d.getByRole("button",{name:"Stop",exact:true}).click();
   await d.getByRole("button",{name:"References",exact:true}).click();
   assert.ok(await d.locator(".exhibit-references").evaluate(el=>el.open));
   await page.locator("#close-detail").click();
 });
 await check("inline gallery room preview",async()=>{
   const gallery=page.locator("#gallery-info");
   await gallery.getByRole("button",{name:"Room preview",exact:true}).click();
   assert.equal(await gallery.locator(".room-mode").count(),1);
   await gallery.getByRole("button",{name:"Exit room preview",exact:true}).click();
 });
 await check("no uncaught page errors with network blocked",async()=>assert.deepEqual(errors,[]));
 console.log(JSON.stringify({environment:"Chromium; third-party requests blocked; synthetic test image fixture",report},null,2));
 await browser.close();if(report.some(r=>r.status==="fail"))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
