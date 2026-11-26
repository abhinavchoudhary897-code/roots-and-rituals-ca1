"use strict";
const $=id=>document.getElementById(id);
const exhibits=window.EXHIBITS;
const milestones=window.MILESTONES;
const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n};
function link(txt,url){const a=make("a",txt);a.href=url;return a}
function button(txt,handler,cls="secondary"){const b=make("button",txt,cls);b.type="button";b.addEventListener("click",handler);return b}
function add(el,...nodes){el.append(...nodes);return el}
// External artwork references: show the source and file licence even when the image fails.
const media=window.EXHIBIT_MEDIA||{};
const imageFailures=new Set();
function artwork(item,priority=false,compact=false){
 const m=media[item.id];if(!m)return make("p","No reference photograph available.","note");
 const fig=make("figure",undefined,"exhibit-media"),img=make("img",undefined,"media-image");
 img.alt=m.alt;
 img.loading=priority?"eager":"lazy";img.decoding="async";
 img.width=500;img.height=500;
 if(!priority)img.fetchPriority="low";
 const candidates=[m.local,m.preview].filter((u,i,a)=>u&&a.indexOf(u)===i&&!imageFailures.has(u));let next=0;
 function fallback(){if(!img.isConnected)return;const box=make("div",undefined,"media-fallback");box.append(make("span","Image unavailable","eyebrow"),make("strong",item.name),link("View the original reference photograph",m.source));img.replaceWith(box);fig.dispatchEvent(new Event("reference-unavailable"))}
 function loadNext(){if(next<candidates.length)img.src=candidates[next++];else fallback()}
 img.addEventListener("error",()=>{if(img.getAttribute("src"))imageFailures.add(img.getAttribute("src"));loadNext()});
 img.addEventListener("load",()=>fig.dispatchEvent(new Event("reference-ready")));
 const cap=add(make("figcaption",undefined,"media-credit"),document.createTextNode(compact?"Photo: ":m.alt+" — "),link(m.credit,m.source),document.createTextNode(" · "),link(m.license,m.licenseURL),document.createTextNode(compact?"":" · Uncropped reference. "+m.note));
 fig.append(img,cap);queueMicrotask(loadNext);return fig
}
// Keep the lightweight homepage illustration stable. Real photographs load in the collection.

const menu=$("menu");menu.addEventListener("click",()=>{const open=$("navigation").classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});$("navigation").addEventListener("click",e=>{if(e.target.closest("a")){$("navigation").classList.remove("open");menu.setAttribute("aria-expanded","false")}});
// Artwork inspection: original file resolution is requested explicitly; zoom never implies extra image detail.
function artworkViewer(item,priority=true){
 const m=media[item.id];if(!m)return make("p","No reference image available.");
 const panel=make("section",undefined,"artwork-viewer");
 const viewport=make("div",undefined,"artwork-viewport"),fig=artwork(item,priority,true),status=make("p","Loading image…","status");
 const img=fig.querySelector("img"),caption=fig.querySelector("figcaption");
 status.setAttribute("role","status");
 const controls=make("div",undefined,"actions viewer-controls"),level=make("span","Fit view","view-level");level.setAttribute("aria-live","polite");
 const roomNote=make("p","Illustrative room preview; not to scale.","note");roomNote.hidden=true;
 let scale=1,room=false,originalRequested=false,available=true;
 const sync=()=>{
  level.textContent=room?"Room view":scale===1?"Fit view":Math.round(scale*100)+"%";
  viewport.style.setProperty("--zoom",String(scale));
  viewport.classList.toggle("room-mode",room);
  roomNote.hidden=!room;
  zoomOut.disabled=!available||room||scale<=1;
  zoomIn.disabled=!available||room||scale>=4;
  reset.disabled=!available||room||scale===1;
  roomBtn.disabled=!available;
 };
 const fit=()=>{scale=1;sync();viewport.scrollLeft=0;viewport.scrollTop=0};
 const zoomIn=button("Zoom in",()=>{scale=Math.min(4,scale+.25);sync()});
 const zoomOut=button("Zoom out",()=>{scale=Math.max(1,scale-.25);if(scale===1)fit();else sync()});
 const reset=button("Fit view",fit);
 const original=button("Load original image",()=>{if(!img?.isConnected)return;originalRequested=true;original.disabled=true;status.textContent="Loading original image…";img.src=m.original});
 const roomBtn=button("Room preview",()=>{room=!room;roomBtn.setAttribute("aria-pressed",String(room));roomBtn.textContent=room?"Exit room preview":"Room preview";fit()});roomBtn.setAttribute("aria-pressed","false");
 if(img){
  fig.insertBefore(viewport,img);viewport.append(img);
  img.addEventListener("load",()=>{
   viewport.style.setProperty("--aspect",String(img.naturalWidth/img.naturalHeight));
   status.textContent=(originalRequested&&img.getAttribute("src")===m.original?"Original":"Preview")+" · "+img.naturalWidth+" × "+img.naturalHeight+" px";
  });
 }
 if(caption){caption.append(document.createTextNode(" · "),link("Source record",m.source));}
 const imageInfo=make("details",undefined,"image-information");
 imageInfo.append(make("summary","About this reference image"),make("p",m.note,"note"),make("p","Zoom magnifies the image; loading the original may provide more detail.","note"));
 fig.addEventListener("reference-unavailable",()=>{available=false;status.textContent="Image unavailable. See the source record.";original.disabled=true;sync()});
 controls.append(zoomOut,level,zoomIn,reset,original,roomBtn);
 panel.append(controls,fig,status,roomNote,imageInfo);
 sync();return panel
}

// Cultural record cards distinguish archive provenance from artwork certification.
const heritage=window.HERITAGE_RECORDS;
let currentNarration=null,narrationToken=0,currentAudio=null;
function stopNarration(message="Narration stopped."){
 narrationToken++;window.speechSynthesis?.cancel();if(currentAudio){currentAudio.pause();currentAudio=null;}
 if(currentNarration){currentNarration.status.textContent=message;currentNarration=null}
}
function storyPlayer(record){
 const box=make("article",undefined,"story-player"),status=make("p","Listen to the narration or read the transcript.","status");
 status.setAttribute("role","status");
 const key=Object.keys(heritage).find(k=>heritage[k]===record);
 const audio=make("audio");audio.controls=true;audio.setAttribute("controls","");audio.preload="none";audio.src="assets/audio/"+key+".mp3";audio.setAttribute("aria-label","Educational narration: "+record.storyTitle);
 const rate=make("select");rate.setAttribute("aria-label","Narration speed");
 for(const speed of [.8,1,1.2]){const opt=make("option",speed+"×");opt.value=String(speed);if(speed===1)opt.selected=true;rate.append(opt)}
 rate.addEventListener("change",()=>{audio.playbackRate=Number(rate.value)});
 function speakFallback(){
  stopNarration();
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){status.textContent="Read-aloud is unavailable. The transcript remains available.";return}
  const token=++narrationToken,utterance=new SpeechSynthesisUtterance(record.story+" "+record.symbolism);
  utterance.lang="en-IN";utterance.rate=Number(rate.value);currentNarration={status,utterance};
  status.textContent="Starting browser read-aloud…";
  utterance.onstart=()=>{if(token===narrationToken)status.textContent="Playing browser read-aloud."};
  utterance.onend=()=>{if(token===narrationToken){status.textContent="Narration finished.";currentNarration=null}};
  utterance.onerror=()=>{if(token===narrationToken){status.textContent="Browser read-aloud is unavailable. Use the transcript.";currentNarration=null}};
  window.speechSynthesis.speak(utterance)
 }
 const play=button("Play narration",async()=>{
  stopNarration();const token=++narrationToken;currentAudio=audio;audio.playbackRate=Number(rate.value);status.textContent="Loading narration…";
  try{await audio.play();if(token===narrationToken)status.textContent="Playing narration."}catch(e){if(token===narrationToken){currentAudio=null;status.textContent="Audio unavailable. Try browser read-aloud below or read the transcript."}}
 });
 const stop=button("Stop",()=>{if(currentAudio===audio||currentNarration?.status===status){stopNarration();try{audio.currentTime=0}catch{}status.textContent="Narration stopped."}});
 audio.addEventListener("play",()=>{if(currentAudio!==audio){stopNarration();currentAudio=audio}status.textContent="Playing narration."});
 audio.addEventListener("pause",()=>{if(currentAudio===audio&&!audio.ended)status.textContent="Narration paused."});
 audio.addEventListener("ended",()=>{if(currentAudio===audio)currentAudio=null;status.textContent="Narration finished."});
 audio.addEventListener("error",()=>{if(currentAudio===audio)currentAudio=null;status.textContent="Audio unavailable. Try browser read-aloud below or read the transcript."});
 const transcript=make("details");transcript.open=false;transcript.append(make("summary","Transcript and spiritual context"),make("p",record.story),make("h4","Cultural symbolism"),make("p",record.symbolism),link("Narrative source",record.storySource));if(record.symbolSource)transcript.append(add(make("p"),link("Symbolism reference",record.symbolSource)));
 const alternate=make("details");alternate.append(make("summary","Browser read-aloud alternative"),button("Read aloud",speakFallback));
 box.append(make("p",record.storyType,"eyebrow"),make("h3",record.storyTitle),make("p","Listen to the story. A synthetic voice reads the educational summary.","note"),audio,add(make("div",undefined,"actions"),play,stop,add(make("label", "Speed "),rate)),status,alternate,transcript);
 return box
}
function provenanceCard(record){
 const box=add(make("section",undefined,"record-card"),make("h3","Artwork documentation"),make("p",record.title),make("p",record.archive),link("View institutional record",record.record));
 if(record.masterwork)box.append(make("h3","Documented masterwork"),make("p",record.masterwork),link("View masterwork record",record.masterworkSource));
 if(record.openCollection)box.append(make("h3","Museum collection and usage terms"),make("p",record.openCollection),link("View museum artwork and usage terms",record.openCollectionSource));
 box.append(make("h3","Craft registration"),make("p",record.certification));
 if(record.giSource)box.append(link("Official GI Registry record",record.giSource));
 return box
}
function profileCard(record){
 const box=make("article",undefined,"profile-card"),dl=make("dl");
 for(const [label,value] of [["Village and community",record.village],["Artistic lineage and training",record.lineage],["National honours",record.honours]])dl.append(make("dt",label),make("dd",value));
 box.append(make("h3",record.artisan),make("p",record.bio),dl,make("p","Related heritage profile; not necessarily the maker of the reference photograph.","note"),link("Profile reference",record.profileSource));if(record.awardSource)box.append(add(make("p"),link("Award reference",record.awardSource)));return box
}

let lastFocus=null;
function openDetail(item,focusStory=false){
 stopNarration();
 lastFocus=document.activeElement;
 const record=heritage[item.id];
 const title=make("h2",item.name);title.id="detail-title";
 const story=storyPlayer(record);story.id="detail-story";
 const artist=profileCard(record);artist.id="detail-artist";
 const documentation=provenanceCard(record);documentation.id="detail-references";
 const references=make("details",undefined,"exhibit-references");
 references.append(make("summary","Artwork record and references"),documentation,link(item.sourceName,item.source));
 const jump=(label,target)=>button(label,()=>{if(target.tagName==="DETAILS")target.open=true;target.scrollIntoView({block:"start"})});
 const shortcuts=add(make("div",undefined,"actions detail-shortcuts"),jump("Listen to story",story),jump("Meet the artisan",artist),jump("References",references));
 $("detail-content").replaceChildren(make("p",item.region,"eyebrow"),title,make("p",item.detail),shortcuts,artworkViewer(item),story,make("h3","Related artisan"),artist,references);
 $("detail").showModal();
 if(focusStory){story.querySelector("button")?.focus({preventScroll:true});story.scrollIntoView({block:"start"})}
 else $("close-detail").focus();
}
$("close-detail").addEventListener("click",()=>$("detail").close());$("detail").addEventListener("close",()=>{stopNarration();lastFocus?.focus()});$("detail").addEventListener("click",e=>{if(e.target===$("detail"))$("detail").close()});
function renderCollection(){const query=$("search").value.trim().toLowerCase(),category=$("category-filter").value;const items=exhibits.filter(x=>(category==="all"||category===x.category)&&[x.category,x.name,x.region,x.artisan,x.material,x.place,heritage[x.id].artisan,heritage[x.id].title].join(" ").toLowerCase().includes(query));$("exhibits").replaceChildren(...items.map(x=>{const card=make("article",undefined,"card");return add(card,artwork(x,false,true),make("p",x.region,"eyebrow"),make("h3",x.name),make("p",x.summary),add(make("div",undefined,"actions card-actions"),button("Explore artwork",()=>openDetail(x)),button("Listen to story",()=>openDetail(x,true))))}));$("results").textContent=items.length+" tradition"+(items.length===1?"":"s")+" found.";if(!items.length)$("exhibits").append(make("p","No matching exhibits. Try another search or filter."))}
// The initial cards already exist in HTML, so they do not jump into place after loading.
function connectInitialCards(){
 const cards=$("exhibits").querySelectorAll("[data-exhibit]");
 if(cards.length!==exhibits.length){renderCollection();return}
 for(const card of cards){
  const item=exhibits.find(x=>x.id===card.dataset.exhibit);
  if(!item){renderCollection();return}
  card.querySelector('[data-action="artwork"]').addEventListener("click",()=>openDetail(item));
  card.querySelector('[data-action="story"]').addEventListener("click",()=>openDetail(item,true));
  const img=card.querySelector("img"),m=media[item.id];
  const onError=()=>{
   if(!img.isConnected)return;
   imageFailures.add(img.getAttribute("src"));
   const box=make("div",undefined,"media-fallback");
   box.append(make("span","Image unavailable","eyebrow"),make("strong",item.name),link("View the original reference photograph",m.source));
   img.replaceWith(box);
  };
  img.addEventListener("error",onError);
  if(img.complete&&img.naturalWidth===0)onError();
 }
}
$("search").addEventListener("input",renderCollection);$("category-filter").addEventListener("change",renderCollection);connectInitialCards();
// Browse the virtual exhibition with ordinary HTML and JavaScript.
let current=0;
function showGallery(){
 const x=exhibits[current];
 $("gallery-position").textContent="Artwork "+(current+1)+" of "+exhibits.length;
 $("gallery-info").replaceChildren(make("h3",x.name),make("p",x.region+" · "+x.material),artworkViewer(x,false),button("Story and artisan",()=>openDetail(x,true)));
}
function navigate(delta){current=(current+delta+exhibits.length)%exhibits.length;showGallery()}
$("prev-exhibit").addEventListener("click",()=>navigate(-1));
$("next-exhibit").addEventListener("click",()=>navigate(1));
showGallery();
for(const x of exhibits)$("artisan-list").append(profileCard(heritage[x.id]));
// Fair trade: values always have a textual equivalent and CSS fallback.
const priceIds=["materials","labour","logistics","overhead"],labels=["Materials","Artisan labour","Packaging & logistics","Retail & overhead"],colors=["#a34d34","#435a44","#e8d9c5","#594132"],defaults=[250,500,100,150];const moneyFormat=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});const money=n=>moneyFormat.format(n);
function prices(){return priceIds.map(id=>{const n=Number($(id).value);return Number.isFinite(n)?Math.min(100000,Math.max(0,Math.round(n))):0})}
function renderPrice(){const values=prices(),total=values.reduce((a,b)=>a+b,0);$("total").textContent=money(total);$("price-warning").textContent=total===0?"Enter a positive cost to see a breakdown.":priceIds.some((id,i)=>Number($(id).value)!==values[i])?"Values are rounded and limited to ₹0–₹100,000 per component.":"";$("price-bar").replaceChildren(...values.map((n,i)=>{const s=make("span");s.style.background=colors[i];s.style.width=(total?n/total*100:0)+"%";return s}));$("legend").replaceChildren(...values.map((n,i)=>{const sw=make("i");sw.style.background=colors[i];sw.setAttribute("aria-hidden","true");return add(make("div"),add(make("span"),sw,document.createTextNode(labels[i])),make("strong",money(n)+" · "+(total?(n/total*100).toFixed(1):"0.0")+"%"))}));}
for(const id of priceIds){$(id).addEventListener("input",renderPrice);$(id).addEventListener("change",()=>{$(id).value=prices()[priceIds.indexOf(id)];renderPrice()})}$("reset-price").addEventListener("click",()=>{priceIds.forEach((id,i)=>$(id).value=defaults[i]);renderPrice()});renderPrice();

const sources=new Map(exhibits.map(x=>[x.source,x.sourceName]));milestones.forEach(x=>sources.set(x.url,"PIB — "+x.title));sources.set("https://tribex.tribal.gov.in/repository/details/MTA0","Tribex — Sohrai works and livelihoods");sources.set("https://ignca.gov.in/divisionss/janapada-sampada/tribal-art-culture/adivasi-art-culture/the-gond-of-madhya-pradesh/","IGNCA — The Gond of Madhya Pradesh");sources.set("https://trifed.tribal.gov.in/en/division/retail-marketing","TRIFED — Retail marketing");for(const rec of Object.values(heritage)){for(const [key,label] of [["record","Artwork record"],["storySource","Narrative"],["symbolSource","Symbolism"],["profileSource","Artisan profile"],["awardSource","Honours"],["giSource","GI registration"],["masterworkSource","Masterwork record"],["openCollectionSource","Museum collection and usage terms"]])if(rec[key]&&!sources.has(rec[key]))sources.set(rec[key],label+" — "+rec.title)}for(const m of Object.values(media))sources.set(m.source,"Wikimedia Commons — "+m.alt+" ("+m.credit+", "+m.license+")");for(const [url,title] of sources)$("source-list").append(add(make("li"),link(title,url)));
