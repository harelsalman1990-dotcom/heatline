/* ===== אלף מילים — אוצר מילים, שדרוג שפה ושכתוב ===== */
(function(){
"use strict";

/* ---------- כלים ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const strip = s => (s||"").replace(/[֑-ׇ]/g,"");
const FIN = {"ך":"כ","ם":"מ","ן":"נ","ף":"פ","ץ":"צ"};
const norm = s => strip(s).replace(/[ךםןףץ]/g, c=>FIN[c]);
const rnd  = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const DAY = 864e5;
const todayKey = (d=new Date()) => d.toISOString().slice(0,10);
const daysBetween = (a,b)=>Math.round((new Date(b)-new Date(a))/DAY);

const WORDS = (window.WORDS||[]).map(w=>({...w, id:strip(w.w)}));
const CATS = window.CATS, LEVELS = window.LEVELS;

/* ---------- אחסון והתקדמות ---------- */
const KEY = "otzar.v1";
const DEFAULTS = {words:{},days:{},streak:{cur:0,best:0,last:null},goal:20,exam:null,
                  theme:"ink",reveal:true,cats:[],levels:[],xp:0,seenIntro:false};
let P = load();
function load(){
  try{ const raw = JSON.parse(localStorage.getItem(KEY)||"{}");
       return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), raw); }
  catch(e){ return JSON.parse(JSON.stringify(DEFAULTS)); }
}
let saveT=null;
function save(){ clearTimeout(saveT); saveT=setTimeout(()=>{ try{localStorage.setItem(KEY,JSON.stringify(P));}catch(e){} },120); }

const IVL = [0,1,2,4,8,16,32,64];            // ימים לפי תיבה (שיטת לייטנר)
function rec(id){ return P.words[id] || (P.words[id]={box:0,due:0,seen:0,ok:0,bad:0,star:0,last:0}); }
function grade(id,g){                         // 0=לא ידעתי 1=כמעט 2=ידעתי
  const r = rec(id); r.seen++; r.last = Date.now();
  if(g===0){ r.bad++; r.box = Math.max(0, r.box-2); }
  else if(g===1){ r.ok++; r.box = Math.max(1, r.box); }
  else { r.ok++; r.box = Math.min(IVL.length-1, r.box+1); }
  r.due = Date.now() + IVL[r.box]*DAY;
  save();
}
function mastery(id){ const r=P.words[id]; if(!r) return 0; return Math.min(1, r.box/6); }
function isDue(id){ const r=P.words[id]; return !r || r.box===0 || r.due<=Date.now(); }

function logAnswer(correct){
  const k = todayKey(), d = P.days[k] || (P.days[k]={a:0,c:0});
  d.a++; if(correct) d.c++;
  P.xp += correct?10:2;
  const s = P.streak;
  if(s.last !== k){
    s.cur = (s.last && daysBetween(s.last,k)===1) ? s.cur+1 : 1;
    s.last = k; s.best = Math.max(s.best||0, s.cur);
  }
  save();
}
const todayCount = ()=> (P.days[todayKey()]||{a:0}).a;

/* ---------- אייקונים ---------- */
const I = {
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3Z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.2"/>',
  share:'<path d="M12 16V4M8 8l4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/>',
  check:'<path d="M4 12.5 9.5 18 20 6"/>',
  book:'<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>',
  sound:'<path d="M5 9.5h3l4-3.5v12l-4-3.5H5z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  cap:'<path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
  back:'<path d="M9 5l7 7-7 7"/>',
  fwd:'<path d="M15 5l-7 7 7 7"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  flame:'<path d="M12 3s5 4 5 8a5 5 0 0 1-10 0c0-1.5.8-2.6.8-2.6S9 11 10 11c0-2.6 2-5.4 2-8Z"/>',
  star:'<path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.3L12 16l-4.6 2.6.9-5.3-3.8-3.7 5.2-.7L12 4Z"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-.7 4.3M20 5v6h-6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
  home:'<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 14 9 5 9-5"/>',
  up:'<path d="M12 20V5M6 11l6-6 6 6"/>',
  play:'<path d="M8 5.5 19 12 8 18.5z"/>'
};
const svg = (n,cls="")=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const ibtn = (n,act,extra="")=>`<button class="icon-btn ${extra}" data-act="${act}" aria-label="${act}">${svg(n)}</button>`;

/* ---------- אמנות לכרטיסי תרגול ---------- */
const ART = {
  cards:'<svg viewBox="0 0 100 70"><rect class="b" x="14" y="30" width="62" height="30" rx="5"/><rect class="a" x="20" y="20" width="62" height="30" rx="5"/><rect class="c" x="26" y="10" width="62" height="30" rx="5" stroke="var(--line)"/></svg>',
  abc:'<svg viewBox="0 0 100 70"><rect class="c" x="18" y="8" width="64" height="54" rx="8" stroke="var(--line)"/><rect class="b" x="26" y="18" width="48" height="7" rx="3.5"/><rect class="a" x="26" y="31" width="48" height="7" rx="3.5"/><rect class="b" x="26" y="44" width="34" height="7" rx="3.5"/></svg>',
  blank:'<svg viewBox="0 0 100 70"><rect class="c" x="12" y="12" width="76" height="46" rx="7" stroke="var(--line)"/><rect class="b" x="22" y="24" width="26" height="5" rx="2.5"/><rect class="a" x="52" y="24" width="24" height="5" rx="2.5"/><rect class="b" x="22" y="38" width="16" height="5" rx="2.5"/><rect class="b" x="60" y="38" width="16" height="5" rx="2.5"/><path class="s" d="M42 44h14"/></svg>',
  grid:'<svg viewBox="0 0 100 70"><rect class="c" x="20" y="6" width="60" height="58" rx="5" stroke="var(--line)"/><rect class="a" x="20" y="6" width="20" height="19"/><rect class="b" x="60" y="25" width="20" height="19"/><rect class="a" x="40" y="45" width="20" height="19"/><rect class="b" x="20" y="45" width="20" height="19"/></svg>',
  bug:'<svg viewBox="0 0 100 70"><rect class="c" x="16" y="12" width="68" height="40" rx="8" stroke="var(--line)"/><path class="s" d="M36 26l12 12M48 26L36 38" stroke="var(--bad)"/><rect class="a" x="58" y="28" width="18" height="6" rx="3"/></svg>',
  mark:'<svg viewBox="0 0 100 70"><rect class="c" x="18" y="10" width="64" height="48" rx="6" stroke="var(--line)"/><path class="a" d="M40 10h20v26l-10-7-10 7z"/></svg>',
  timer:'<svg viewBox="0 0 100 70"><circle class="c" cx="50" cy="38" r="22" stroke="var(--line)"/><path class="s" d="M50 24v14l9 6"/><rect class="a" x="44" y="8" width="12" height="7" rx="3"/></svg>',
  perfect:'<svg viewBox="0 0 100 70"><rect class="b" x="18" y="40" width="52" height="10" rx="5"/><rect class="a" x="26" y="26" width="52" height="10" rx="5"/><path class="s" d="M62 30l8 8 16-18" stroke="var(--good)" stroke-width="4"/></svg>',
  elim:'<svg viewBox="0 0 100 70"><rect class="b" x="16" y="12" width="56" height="10" rx="5"/><rect class="a" x="16" y="28" width="56" height="10" rx="5"/><rect class="b" x="16" y="44" width="56" height="10" rx="5"/><path class="s" d="M76 14l10 10M86 14l-10 10" stroke="var(--bad)"/></svg>',
  pairs:'<svg viewBox="0 0 100 70"><rect class="a" x="14" y="14" width="30" height="18" rx="4"/><rect class="b" x="56" y="14" width="30" height="18" rx="4"/><rect class="b" x="14" y="40" width="30" height="18" rx="4"/><rect class="a" x="56" y="40" width="30" height="18" rx="4"/><path class="s" d="M44 23h12M44 49h12"/></svg>',
  opp:'<svg viewBox="0 0 100 70"><rect class="a" x="14" y="18" width="34" height="10" rx="5"/><rect class="b" x="52" y="42" width="34" height="10" rx="5"/><path class="s" d="M52 23h14M48 47H34"/></svg>',
  gallows:'<svg viewBox="0 0 100 70"><path class="s" d="M30 60V12h26v10"/><circle class="a" cx="56" cy="30" r="7"/><rect class="b" x="24" y="58" width="52" height="6" rx="3"/></svg>',
  due:'<svg viewBox="0 0 100 70"><circle class="c" cx="50" cy="35" r="23" stroke="var(--line)"/><path class="s" d="M50 20v15l10 5"/><circle class="a" cx="72" cy="16" r="8"/></svg>'
};

/* ---------- מצב ---------- */
const S = { route:"hub", idx:0, deck:[], reveal:false, sess:null, q:"", smode:"up", sent:"", segs:null };

function applyTheme(){ document.documentElement.setAttribute("data-theme", P.theme||"ink");
  const c = getComputedStyle(document.body).getPropertyValue("--bg").trim();
  const m = $('meta[name="theme-color"]'); if(m) m.setAttribute("content", c||"#0F1012"); }

function deckAll(){
  let d = WORDS;
  if(P.cats.length)   d = d.filter(w=>P.cats.includes(w.c));
  if(P.levels.length) d = d.filter(w=>P.levels.includes(w.l));
  return d.length ? d : WORDS;
}
const deckDue    = ()=> deckAll().filter(w=>isDue(w.id));
const deckReview = ()=> deckAll().filter(w=>{ const r=P.words[w.id]; return r && r.seen>0 && r.due<=Date.now(); });
const deckNew    = ()=> deckAll().filter(w=>!(P.words[w.id]||{}).seen);
const deckStar   = ()=> WORDS.filter(w=>(P.words[w.id]||{}).star);
const deckWrong  = ()=> WORDS.filter(w=>{const r=P.words[w.id]; return r && r.bad>0 && r.bad>=r.ok;})
                             .sort((a,b)=>(P.words[b.id].bad-P.words[b.id].ok)-(P.words[a.id].bad-P.words[a.id].ok));

/* ---------- הודעות קצרות ---------- */
let toastT=null;
function toast(msg){
  let t=$("#toast"); if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; t.innerHTML="<span></span>"; document.body.appendChild(t); }
  t.firstChild.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1700);
}

/* ---------- גיליון תחתון ---------- */
function sheet(html){
  closeSheet();
  const bg=document.createElement("div"); bg.className="sheet-bg"; bg.id="sheetbg";
  const sh=document.createElement("div"); sh.className="sheet"; sh.id="sheet";
  sh.innerHTML='<div class="handle"></div>'+html;
  document.body.append(bg,sh);
  requestAnimationFrame(()=>{bg.classList.add("show");sh.classList.add("show");});
  bg.addEventListener("click",closeSheet);
  return sh;
}
function closeSheet(){
  const bg=$("#sheetbg"), sh=$("#sheet"); if(!sh)return;
  bg.classList.remove("show"); sh.classList.remove("show");
  setTimeout(()=>{bg.remove();sh.remove();},260);
}

/* ---------- הקראה ---------- */
let voices=[];
function loadVoices(){ try{ voices = speechSynthesis.getVoices()||[]; }catch(e){} }
if("speechSynthesis" in window){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function say(text){
  if(!("speechSynthesis" in window)) return toast("אין תמיכה בהקראה במכשיר");
  const u = new SpeechSynthesisUtterance(strip(text));
  u.lang="he-IL"; u.rate=.88;
  const v = voices.find(v=>(v.lang||"").toLowerCase().startsWith("he"));
  if(v) u.voice=v;
  try{ speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
  if(!v) toast("אין קול עברי מותקן במכשיר");
}

/* =======================================================
   מסך ראשי — כרטיס מילה
   ======================================================= */
const app = ()=>$("#app");

function daysToExam(){ return P.exam ? daysBetween(todayKey(), P.exam) : null; }

function screenCards(){
  S.deck = deckAll();
  if(S.idx >= S.deck.length) S.idx = 0;
  const dte = daysToExam();
  app().innerHTML = `
  <div class="topbar">
    <button class="pill" data-act="goal" style="padding:8px 14px;font-size:13px">
      ${svg("flame")}<span>${P.streak.cur||0}</span>
      <span style="color:var(--muted);font-weight:500">&nbsp;· ${todayCount()}/${P.goal} היום</span>
    </button>
    <div style="display:flex;gap:8px">${ibtn("search","search","sm")}${ibtn("palette","theme","sm")}</div>
  </div>
  <div class="deckbar">
    <button class="deck-pill" data-act="filter">${svg("filter")}
      <b>${deckName()}</b><span>· ${S.deck.length} מילים</span>
    </button>
  </div>
  <div class="card-area" id="cardArea"></div>
  <div class="progress-line"><i style="width:${S.deck.length?((S.idx+1)/S.deck.length*100):0}%"></i></div>
  <div class="actions">
    ${ibtn("info","info")}${ibtn("share","share")}${ibtn("check","known")}${ibtn("book","star")}
  </div>
  ${tabbar("cards")}`;
  drawCard();
  bindHome();
}

function deckName(){
  if(!P.cats.length && !P.levels.length) return "כל המילים";
  const parts=[];
  if(P.cats.length)   parts.push(P.cats.map(c=>CATS[c].name).join(" + "));
  if(P.levels.length) parts.push(P.levels.map(l=>LEVELS[l]).join(" + "));
  return parts.join(" · ");
}

function drawCard(dir){
  const area = $("#cardArea"); if(!area) return;
  const w = S.deck[S.idx];
  if(!w){ area.innerHTML = '<div class="sub">אין מילים בסינון הזה</div>'; return; }
  const r = rec(w.id);
  const show = P.reveal || S.reveal;
  const long = strip(w.w).length > 11;
  area.innerHTML = `
    <div class="card" id="card">
      <div class="word ${long?"long":""}">${esc(w.w)}</div>
      <div class="reveal ${show?"":"off"}">
        <div class="def"><span class="tag">(${esc(w.p)})</span> ${esc(w.d)}</div>
      </div>
      ${show?"":'<div class="tap-hint">הקישו כדי לחשוף את הפירוש</div>'}
      <div class="say">${ibtn("sound","say","sm")}</div>
      <div class="chips">
        <span class="chip">${LEVELS[w.l]}</span>
        <span class="chip">${CATS[w.c].name}</span>
        ${r.box?`<span class="chip ok">תיבה ${r.box}/7</span>`:""}
        ${r.star?`<span class="chip">מסומנת</span>`:""}
      </div>
    </div>`;
  const c = $("#card");
  if(dir){ c.style.transition="none"; c.style.transform=`translateX(${dir*70}px)`; c.style.opacity="0";
    requestAnimationFrame(()=>{ c.style.transition="transform .22s ease, opacity .22s ease";
      c.style.transform="translateX(0)"; c.style.opacity="1"; }); }
  $$('.icon-btn[data-act="star"]').forEach(b=>b.classList.toggle("on", !!r.star));
}

function move(step){
  if(!S.deck.length) return;
  S.idx = (S.idx + step + S.deck.length) % S.deck.length;
  S.reveal = false;
  drawCard(step>0 ? 1 : -1);
  const pl = $(".progress-line i"); if(pl) pl.style.width = ((S.idx+1)/S.deck.length*100)+"%";
}

function bindHome(){
  const area = $("#cardArea");
  let x0=null,y0=null,dx=0,drag=false;
  area.addEventListener("pointerdown",e=>{ x0=e.clientX;y0=e.clientY;dx=0;drag=true; });
  area.addEventListener("pointermove",e=>{
    if(!drag||x0===null) return;
    dx = e.clientX-x0;
    if(Math.abs(dx) > Math.abs(e.clientY-y0)){
      const c=$("#card"); if(c){ c.style.transition="none"; c.style.transform=`translateX(${dx}px)`;
        c.style.opacity = String(1-Math.min(.6,Math.abs(dx)/320)); }
    }
  });
  const end = ()=>{
    if(!drag) return; drag=false;
    const c=$("#card");
    if(Math.abs(dx)>58){ move(dx<0 ? 1 : -1); }
    else if(c){ c.style.transition="transform .2s, opacity .2s"; c.style.transform="translateX(0)"; c.style.opacity="1";
      if(Math.abs(dx)<6){ S.reveal=!S.reveal; drawCard(); } }
    x0=null;dx=0;
  };
  area.addEventListener("pointerup",end);
  area.addEventListener("pointercancel",end);
  area.addEventListener("pointerleave",end);
}

/* פעולות מסך ראשי */
function homeAction(act){
  const w = S.deck[S.idx];
  switch(act){
    case "say": if(w) say(w.w); break;
    case "known": if(w){ grade(w.id,2); toast("נשמר — נחזור לזה בעוד "+IVL[rec(w.id).box]+" ימים"); move(1); } break;
    case "star": if(w){ const r=rec(w.id); r.star = r.star?0:1; save(); drawCard(); toast(r.star?"נוספה לאוסף":"הוסרה מהאוסף"); } break;
    case "info": if(w) wordSheet(w); break;
    case "share": if(w) shareWord(w); break;
    case "theme": themeSheet(); break;
    case "filter": filterSheet(); break;
    case "progress": go("progress"); break;
    case "practice": go("practice"); break;
    case "exam": examSheet(); break;
    case "goal": goalSheet(); break;
  }
}

function wordSheet(w){
  const r = rec(w.id);
  const acc = r.seen ? Math.round(r.ok/(r.ok+r.bad||1)*100) : null;
  sheet(`
    <h3 style="font-family:'Frank Ruhl Libre',serif">${esc(w.w)}</h3>
    <div class="sub">${esc(w.p)} · ${CATS[w.c].name} · ${LEVELS[w.l]}</div>
    <div class="row" style="display:block">
      <div class="lbl">${esc(w.d)}</div>
      <div class="hint" style="font-size:14px;margin-top:8px;font-style:italic">״${esc(w.e)}״</div>
    </div>
    ${w.s&&w.s.length?`<div class="row"><div><div class="hint">נרדפות</div><div class="lbl">${w.s.map(esc).join(" · ")}</div></div></div>`:""}
    ${w.a&&w.a.length?`<div class="row"><div><div class="hint">ניגודים</div><div class="lbl">${w.a.map(esc).join(" · ")}</div></div></div>`:""}
    <div class="row">
      <div><div class="lbl">הביצועים שלך</div>
      <div class="hint">${r.seen?`${r.ok} נכון · ${r.bad} שגוי${acc!==null?` · ${acc}% דיוק`:""}`:"עדיין לא תרגלת את המילה"}</div></div>
      <div class="hint">תיבה ${r.box}/7</div>
    </div>
    <div class="row" style="gap:8px">
      <button class="pill" data-sheet="say">${svg("sound")} הקראה</button>
      <button class="pill" data-sheet="star">${svg("book")} ${r.star?"הסרה מהאוסף":"הוספה לאוסף"}</button>
      <button class="pill" data-sheet="reset">${svg("refresh")} איפוס</button>
    </div>`).addEventListener("click",e=>{
      const b=e.target.closest("[data-sheet]"); if(!b)return;
      const a=b.dataset.sheet;
      if(a==="say") say(w.w);
      if(a==="star"){ const r2=rec(w.id); r2.star=r2.star?0:1; save(); closeSheet(); drawCard(); }
      if(a==="reset"){ delete P.words[w.id]; save(); closeSheet(); drawCard(); toast("ההתקדמות במילה אופסה"); }
    });
}

async function shareWord(w){
  const text = `${w.w} — ${w.d}\n״${w.e}״\n\nנלמד באפליקציית אלף מילים`;
  try{
    if(navigator.share){ await navigator.share({title:strip(w.w), text}); return; }
    await navigator.clipboard.writeText(text); toast("הועתק ללוח");
  }catch(e){ /* המשתמש ביטל */ }
}

/* גיליונות הגדרה */
function themeSheet(){
  const THEMES=[["ink","#17181C"],["paper","#F6F2EA"],["oled","#000"],["sage","#1E2622"]];
  const NAMES={ink:"דיו",paper:"נייר",oled:"לילה",sage:"מרווה"};
  sheet(`<h3>עיצוב</h3><div class="sub">בוחרים ערכת צבעים</div>
    <div class="row"><div class="lbl">ערכה</div>
      <div class="theme-dots">${THEMES.map(([t,c])=>`<button class="tdot ${P.theme===t?"on":""}" data-theme="${t}" title="${NAMES[t]}"><i style="background:${c};border:1px solid #8886"></i></button>`).join("")}</div>
    </div>
    <div class="row"><div><div class="lbl">מצב מבחן</div><div class="hint">הפירוש מוסתר עד להקשה על הכרטיס</div></div>
      <button class="tog ${!P.reveal?"on":""}" data-toggle="reveal">${!P.reveal?"פעיל":"כבוי"}</button></div>
  `).addEventListener("click",e=>{
    const t=e.target.closest("[data-theme]");
    if(t){ P.theme=t.dataset.theme; save(); applyTheme(); closeSheet(); themeSheet(); return; }
    if(e.target.closest('[data-toggle="reveal"]')){ P.reveal=!P.reveal; save(); closeSheet(); themeSheet(); render(); }
  });
}

function filterSheet(){
  const counts = {};
  Object.keys(CATS).forEach(c=>counts[c]=WORDS.filter(w=>w.c===c).length);
  sheet(`<h3>סינון הלימוד</h3><div class="sub">${deckAll().length} מילים נבחרו</div>
    <div class="row" style="display:block">
      <div class="lbl">סוג</div>
      <div class="opt-list">${Object.keys(CATS).map(c=>
        `<button class="tog ${P.cats.includes(c)?"on":""}" data-cat="${c}">${CATS[c].name} · ${counts[c]}</button>`).join("")}</div>
    </div>
    <div class="row" style="display:block">
      <div class="lbl">רמה</div>
      <div class="opt-list">${[1,2,3].map(l=>
        `<button class="tog ${P.levels.includes(l)?"on":""}" data-lvl="${l}">${LEVELS[l]}</button>`).join("")}</div>
    </div>
    <div class="row"><div class="hint">בלי בחירה — כל המילים</div>
      <button class="pill" data-clear="1">ניקוי</button></div>
  `).addEventListener("click",e=>{
    const c=e.target.closest("[data-cat]"), l=e.target.closest("[data-lvl]");
    if(c){ const k=c.dataset.cat; P.cats.includes(k)?P.cats.splice(P.cats.indexOf(k),1):P.cats.push(k); }
    else if(l){ const k=+l.dataset.lvl; P.levels.includes(k)?P.levels.splice(P.levels.indexOf(k),1):P.levels.push(k); }
    else if(e.target.closest("[data-clear]")){ P.cats=[]; P.levels=[]; }
    else return;
    save(); S.idx=0; closeSheet(); filterSheet(); render();
  });
}

function examSheet(){
  sheet(`<h3>תאריך המבחן</h3><div class="sub">נציג ספירה לאחור ונתאים את יעד היום</div>
    <div class="row"><div class="lbl">תאריך</div>
      <input type="date" id="examDate" value="${P.exam||""}" min="${todayKey()}"></div>
    <div class="row"><button class="pill" data-x="clear">ביטול תאריך</button>
      <button class="pill primary" data-x="save">שמירה</button></div>
  `).addEventListener("click",e=>{
    const b=e.target.closest("[data-x]"); if(!b)return;
    if(b.dataset.x==="clear") P.exam=null; else P.exam=$("#examDate").value||null;
    save(); closeSheet(); render();
  });
}

function goalSheet(){
  const d=P.days[todayKey()]||{a:0,c:0};
  sheet(`<h3>היעד היומי</h3>
    <div class="sub">היום: ${d.a} תשובות · ${d.c} נכונות · רצף של ${P.streak.cur||0} ימים (שיא: ${P.streak.best||0})</div>
    <div class="row"><div class="lbl">תשובות ביום</div>
      <input type="number" id="goalN" min="5" max="300" step="5" value="${P.goal}"></div>
    <div class="row"><div class="hint">היעד מזין את הטבעת במסך ההתקדמות</div>
      <button class="pill primary" data-x="save">שמירה</button></div>
  `).addEventListener("click",e=>{
    if(!e.target.closest('[data-x="save"]'))return;
    P.goal = Math.max(5, Math.min(300, +$("#goalN").value||20)); save(); closeSheet(); render();
  });
}


/* =======================================================
   מסך הבית — לוח מחוונים
   ======================================================= */
function greet(){
  const h = new Date().getHours();
  return h<5 ? "לילה טוב" : h<12 ? "בוקר טוב" : h<17 ? "צהריים טובים" : h<21 ? "ערב טוב" : "לילה טוב";
}
function wordOfDay(){
  const k = todayKey(); let h=0;
  for(let i=0;i<k.length;i++) h = (h*31 + k.charCodeAt(i)) >>> 0;
  return WORDS[h % WORDS.length];
}
function recommendations(){
  const rev=deckReview().length, fresh=deckNew().length, wrong=deckWrong().length, done=todayCount();
  const recs=[];
  if(rev) recs.push({t:`חזרה יומית · ${rev} מילים`, d:"המילים שהגיע זמנן לפי מרווחי הזמן", art:"due", run:"flash", src:"due"});
  if(fresh) recs.push({t:`מילים חדשות · ${fresh} ממתינות`, d:"ללמוד מילים שעוד לא ראית", art:"cards", run:"flash", src:"all"});
  if(wrong>=4) recs.push({t:`תיקון טעויות · ${wrong} מילים`, d:"רק המילים שנפלת בהן", art:"bug", run:"quiz", src:"wrong"});
  if(done<P.goal) recs.push({t:"להשלים את היעד היומי", d:`נשארו ${P.goal-done} תשובות להיום`, art:"abc", run:"quiz", src:"all"});
  const byCat = Object.keys(CATS).map(c=>{ const ws=WORDS.filter(w=>w.c===c);
    return {c, m:ws.reduce((s,w)=>s+mastery(w.id),0)/ws.length}; }).sort((a,b)=>a.m-b.m);
  recs.push({t:`תרגול ממוקד · ${CATS[byCat[0].c].name}`, d:`הקטגוריה החלשה שלך (${Math.round(byCat[0].m*100)}% שליטה)`,
             art:"perfect", run:"quiz", src:"all", cat:byCat[0].c});
  recs.push({t:"תשבץ יומי", d:"שמונה הגדרות מתוך המאגר", art:"grid", run:"xword", src:"all"});
  return recs.slice(0,3);
}
function screenHub(){
  const dte = daysToExam();
  const rev = deckReview().length, fresh = deckNew().length;
  const done = todayCount(), goalPct = Math.min(1, done/P.goal);
  const wod = wordOfDay();
  const started = Object.keys(P.words).filter(k=>(P.words[k].seen||0)>0).length;
  const mastered = Object.keys(P.words).filter(k=>P.words[k].box>=5).length;
  const recs = recommendations();
  const C=2*Math.PI*26;
  app().innerHTML = `
  <div class="topbar">
    <div><div class="screen-title">${greet()}</div>
      <div class="sub">${dte===null ? "אפשר לקבוע תאריך מבחן" :
        (dte>0?`המבחן בעוד ${dte} ימים`:"יום המבחן — בהצלחה!")}</div></div>
    <div style="display:flex;gap:8px">${ibtn("palette","theme","sm")}${ibtn("target","exam","sm")}</div>
  </div>
  <div class="wrap">
    <section class="hero">
      <div class="hero-ring">
        <svg viewBox="0 0 64 64"><circle class="bgc" cx="32" cy="32" r="26" fill="none" stroke-width="6"/>
          <circle class="fg" cx="32" cy="32" r="26" fill="none" stroke-width="6"
            stroke-dasharray="${C}" stroke-dashoffset="${C*(1-goalPct)}"/></svg>
        <b>${done}<i>/${P.goal}</i></b>
      </div>
      <div class="hero-txt">
        <div class="hero-t">${rev ? `${rev} מילים מחכות לחזרה`
          : done>=P.goal ? "היעד היומי הושלם — כל הכבוד"
          : fresh ? `${fresh} מילים חדשות מחכות לך` : "הכול בשליטה כרגע"}</div>
        <div class="hero-d">${svg("flame")} רצף של ${P.streak.cur||0} ימים · ${started}/${WORDS.length} מילים נלמדו</div>
        <button class="pill primary" data-run="flash" data-src="${rev?"due":"all"}">
          ${svg("play")} ${rev ? "להתחיל חזרה" : "להתחיל ללמוד"}</button>
      </div>
    </section>

    <button class="searchbar" data-act="search">${svg("search")}
      <span>חיפוש מילה · שדרוג · שכתוב משפט</span></button>

    <div class="sec-title">מה כדאי עכשיו</div>
    ${recs.map(r=>`<button class="row-card" style="margin-bottom:10px" data-run="${r.run}" data-src="${r.src}"
        ${r.cat?`data-cat-run="${r.cat}"`:""}>
      <div class="art">${ART[r.art]}</div>
      <div><div class="nm">${r.t}</div><div class="ds">${r.d}</div></div>
      <div class="cnt">${svg("fwd")}</div></button>`).join("")}

    <div class="sec-title">מילת היום</div>
    <section class="wod">
      <div class="wod-w">${esc(wod.w)}</div>
      <div class="wod-d">(${esc(wod.p)}) ${esc(wod.d)}</div>
      <div class="wod-e">״${esc(wod.e)}״</div>
      <div class="wod-b">
        <button class="pill" data-wod="say">${svg("sound")} הקראה</button>
        <button class="pill" data-wod="open">${svg("layers")} לכרטיס</button>
      </div>
    </section>

    <div class="sec-title">מבט מהיר</div>
    <div class="tile3">
      <div class="stat"><div class="v">${mastered}</div><div class="l">בשליטה מלאה</div></div>
      <div class="stat"><div class="v">${rev}</div><div class="l">לחזרה היום</div></div>
      <div class="stat"><div class="v">${P.streak.best||0}</div><div class="l">שיא הרצף</div></div>
    </div>

    <div class="sec-title">כל האפשרויות</div>
    <div class="grid2">
      <button class="mode-card" data-act="cards"><div class="art">${ART.cards}</div>
        <div class="nm">כרטיסי מילים</div><div class="ds">מעבר מילה־מילה עם הקראה</div></button>
      <button class="mode-card" data-act="practice"><div class="art">${ART.abc}</div>
        <div class="nm">תרגולים</div><div class="ds">עשרה מצבי אימון</div></button>
      <button class="mode-card" data-act="rw"><div class="art">${ART.blank}</div>
        <div class="nm">שכתוב משפט</div><div class="ds">משפה יומיומית לעברית תקנית</div></button>
      <button class="mode-card" data-act="progress"><div class="art">${ART.perfect}</div>
        <div class="nm">ההתקדמות שלי</div><div class="ds">שליטה, דיוק ורצף</div></button>
    </div>
    <div class="sec-title">הלימוד שלי</div>
    <button class="row-card" data-act="filter">
      <div class="art">${ART.mark}</div>
      <div><div class="nm">${deckName()}</div><div class="ds">סינון לפי סוג ורמה — משפיע על כל התרגולים</div></div>
      <div class="cnt">${deckAll().length}</div></button>
    <div class="mark">אֶלֶף מִילִים</div>
  </div>
  ${tabbar("hub")}`;

  const w=$(".wrap");
  w.addEventListener("click",e=>{
    const b=e.target.closest("[data-wod]"); if(!b) return;
    if(b.dataset.wod==="say") say(wod.w); else openWord(wod.id);
  });
}

/* =======================================================
   חיפוש ושדרוג שפה
   ======================================================= */
const UPG = (window.UPGRADES||[]).map(u=>({...u, n:norm(u.k)}));
const WIDX = WORDS.map(w=>({w, nw:norm(w.w), nd:norm(w.d), ne:norm(w.e),
                            ns:norm([...(w.s||[]),...(w.a||[])].join(" "))}));

function searchBank(q){
  const out=[];
  WIDX.forEach(x=>{
    let sc=0;
    if(x.nw===q) sc=100;
    else if(x.nw.startsWith(q)) sc=80;
    else if(x.nw.includes(q)) sc=60;
    else if(new RegExp("(^|\\s)"+q).test(x.ns)) sc=45;
    else if(x.ns.includes(q)) sc=35;
    else if(x.nd.includes(q)) sc=25;
    else if(x.ne.includes(q)) sc=12;
    if(sc) out.push({w:x.w, sc});
  });
  return out.sort((a,b)=>b.sc-a.sc).slice(0,40).map(x=>x.w);
}
function searchUpgrade(q){
  const hits=[];
  UPG.forEach(u=>{
    const sc = u.n===q ? 100 : u.n.startsWith(q) ? 70 : u.n.includes(q) ? 50 : 0;
    if(sc) hits.push({k:u.k, sc, items:u.u.map(([w,d])=>({w,d,id:strip(w)}))});
  });
  // מהמאגר: מילים שהמילה הפשוטה מופיעה בנרדפות שלהן
  let fromBank=[];
  const wordRe = new RegExp("(^|[\\s,־])"+q+"($|[\\s,.־])");
  WIDX.forEach(x=>{
    const syn = (x.w.s||[]).map(norm);
    let sc = 0;
    if(syn.some(t=>t===q)) sc=3;
    else if(syn.some(t=>t.split(" ").includes(q))) sc=2;
    else if(wordRe.test(x.nd)) sc=1;
    if(sc) fromBank.push({w:x.w.w, d:x.w.d, id:x.w.id, sc});
  });
  fromBank.sort((a,b)=>b.sc-a.sc);
  if(fromBank.length) hits.push({k:q, sc:40, bank:true, items:fromBank.slice(0,8)});
  return hits.sort((a,b)=>b.sc-a.sc).slice(0,4);
}


/* =======================================================
   שכתוב משפט — משפה יומיומית לעברית תקנית
   ======================================================= */
const RW = new Map();
(window.PHRASES||[]).forEach(e=>RW.set(norm(e.k), {...e, ph:true}));
(window.FORMS||[]).forEach(e=>RW.set(norm(e.k), e));
(window.UPGRADES||[]).forEach(e=>{ const k=norm(e.k);
  if(!RW.has(k)) RW.set(k, {k:e.k, to:e.u.map(x=>[x[0],x[1]])}); });

const PUNCT = /^[\s"'׳״(\[]+|[\s"'׳״),.;:!?\]]+$/g;
function splitPunct(tok){
  const m = tok.match(/^([("'״׳\[]*)(.*?)([,.;:!?)"'״׳\]]*)$/);
  return m ? {pre:m[1]||"", core:m[2]||"", post:m[3]||""} : {pre:"",core:tok,post:""};
}
const DAGESH = "\u05BC";
function marksOf(w){ const m=w.match(/^(.)([\u0591-\u05C7]*)/); return m ? (m[2]||"") : ""; }
function dropDagesh(w){                        // דגש קל נושר אחרי תנועה
  if(!"בגדכפת".includes(w[0])) return w;
  const mk = marksOf(w);
  return mk.includes(DAGESH) ? w[0] + mk.split(DAGESH).join("") + w.slice(1+mk.length) : w;
}
function addVav(w){
  const m = w.match(/^(.)([\u0591-\u05C7]*)/);
  if(!m) return "וְ"+w;
  const shuruk = "בומפ".includes(m[1]) || marksOf(w).includes("\u05B0");
  return shuruk ? "וּ"+dropDagesh(w) : "וְ"+w;
}
function addHe(w){                             // ה"א הידיעה
  const f = w[0];
  if("אער".includes(f)) return "הָ"+w;
  if("הח".includes(f))  return "הַ"+w;
  const mk = marksOf(w);
  return "הַ" + (mk.includes(DAGESH) ? w : f + DAGESH + w.slice(1));
}
function addPrefix(w,pfx){
  if(pfx==="ו")  return addVav(w);
  if(pfx==="ה")  return addHe(w);
  if(pfx==="וה") return addVav(addHe(w));
  return w;
}
function rewriteText(text){
  const parts = text.split(/(\s+)/);
  const wi = []; parts.forEach((p,i)=>{ if(p && !/^\s+$/.test(p)) wi.push(i); });
  const segs = []; const used = new Set();
  let j = 0;
  while(j < wi.length){
    let hit = null;
    for(let n = Math.min(3, wi.length-j); n >= 1 && !hit; n--){
      const toks = [];
      for(let t=0;t<n;t++) toks.push(splitPunct(parts[wi[j+t]]));
      // סימני פיסוק פנימיים חוסמים צירוף
      if(n>1 && toks.slice(0,-1).some(t=>t.post)) continue;
      const core = toks.map(t=>t.core).join(" ");
      let pfx = "", e = RW.get(norm(core));
      if(!e) for(const cand of ["וה","ו","ה"]){
        if(core.startsWith(cand) && norm(core).length > cand.length+2){
          const x = RW.get(norm(core.slice(cand.length)));
          if(x){ pfx = cand; e = x; break; }
        }
      }
      if(e) hit = {n, e, pfx, pre:toks[0].pre, post:toks[n-1].post, orig:core};
    }
    if(hit){
      for(let k=0;k<hit.n;k++) used.add(wi[j+k]);
      for(let x=wi[j]+1; x<wi[j+hit.n-1]; x++) used.add(x);   // הרווחים שבתוך הצירוף
      segs.push({t:"r", at:wi[j], span:hit.n, orig:hit.orig, pre:hit.pre, post:hit.post,
                 pfx:hit.pfx, alts:hit.e.to, pick:0, off:false});
      j += hit.n;
    } else { segs.push({t:"w", at:wi[j], v:parts[wi[j]]}); j++; }
  }
  // הרכבה מחדש לפי סדר המקור, כולל רווחים
  const out = []; const byAt = new Map(segs.map(x=>[x.at,x]));
  for(let i=0;i<parts.length;i++){
    if(byAt.has(i)){ out.push(byAt.get(i)); }
    else if(!used.has(i) && /^\s+$/.test(parts[i])) out.push({t:"s", v:parts[i]});
    else if(!used.has(i) && parts[i]) out.push({t:"w", v:parts[i]});
  }
  return out;
}
function segText(sg){
  if(sg.t!=="r") return sg.v;
  if(sg.off) return sg.pre + (sg.pfx||"") + sg.orig + sg.post;
  return sg.pre + addPrefix(sg.alts[sg.pick][0], sg.pfx) + sg.post;
}
const rewriteOut = ()=> (S.segs||[]).map(segText).join("");

function drawRewrite(){
  const box = $("#rwout"); if(!box) return;
  if(!S.segs){ box.innerHTML = `<div class="empty">${svg("up")}
      <p>כותבים משפט בשפה יומיומית ומקבלים אותו בעברית תקנית. אפשר להקיש על כל מילה שהוחלפה ולראות את הפירוש או לבחור חלופה אחרת.</p>
      <div class="sugg"><button class="tog" data-sentex="1">משפט לדוגמה</button></div></div>`; return; }
  const n = S.segs.filter(x=>x.t==="r" && !x.off).length;
  box.innerHTML = `
    <div class="sec-title">${n ? `${n} החלפות` : "לא נמצאו מילים לשדרוג"}</div>
    <div class="rwcard">${S.segs.map((sg,i)=> sg.t==="r"
      ? `<button class="sw ${sg.off?"off":""}" data-seg="${i}">${esc(segText(sg))}</button>`
      : `<span>${esc(sg.v)}</span>`).join("")}</div>
    <div class="rwb">
      <button class="pill" data-act="rwcopy">${svg("share")} העתקה</button>
      <button class="pill" data-act="rwsrc">${svg("refresh")} המקור</button>
    </div>
    ${S.showSrc?`<div class="rwsrc">${S.segs.map(sg=> sg.t==="r"
        ? `<mark>${esc(sg.pre+(sg.pfx||"")+sg.orig+sg.post)}</mark>` : esc(sg.v)).join("")}</div>`:""}`;
}
function segSheet(i){
  const sg = S.segs[i]; if(!sg) return;
  const inBank = w => WORDS.find(x=>norm(x.w)===norm(w));
  sheet(`<h3>במקום ״${esc((sg.pfx||"")+sg.orig)}״</h3>
    <div class="sub">בוחרים חלופה — או משאירים את המילה המקורית</div>
    ${sg.alts.map((a,k)=>{ const b=inBank(a[0]);
      return `<button class="row alt ${!sg.off&&sg.pick===k?"on":""}" data-pick="${k}">
        <div><div class="lbl" style="font-family:'Frank Ruhl Libre',serif;font-size:19px">${esc(a[0])}</div>
        <div class="hint">${esc(a[1])}${b?" · יש כרטיס במאגר":""}</div></div>
        <div>${!sg.off&&sg.pick===k?svg("check"):""}</div></button>`; }).join("")}
    <button class="row alt ${sg.off?"on":""}" data-pick="-1">
      <div><div class="lbl">${esc(sg.orig)}</div><div class="hint">להשאיר את המילה המקורית</div></div>
      <div>${sg.off?svg("check"):""}</div></button>
  `).addEventListener("click",e=>{
    const b=e.target.closest("[data-pick]"); if(!b) return;
    const k=+b.dataset.pick;
    if(k<0) sg.off=true; else { sg.off=false; sg.pick=k; }
    closeSheet(); drawRewrite();
  });
}
const SENT_EX = "קמתי בבוקר והלכתי לעבודה, במהלך היום עשיתי הרבה מאוד דברים";

function screenSearch(){
  app().innerHTML = `
  <div class="topbar"><div class="screen-title">חיפוש ושדרוג</div></div>
  <div class="wrap">
    <div class="seg" id="smode" style="width:100%;justify-content:stretch">
      <button data-mode="up" class="${S.smode==="up"?"on":""}" style="flex:1">שדרוג מילה</button>
      <button data-mode="sent" class="${S.smode==="sent"?"on":""}" style="flex:1">שכתוב משפט</button>
      <button data-mode="dict" class="${S.smode==="dict"?"on":""}" style="flex:1">מילון</button>
    </div>
    ${S.smode==="sent" ? `
      <div class="sentbox">
        <textarea id="sent" rows="3" placeholder="למשל: קמתי בבוקר והלכתי לעבודה…">${esc(S.sent||"")}</textarea>
      </div>
      <div class="rwb" style="margin-top:10px">
        <button class="pill primary" data-act="dorw">${svg("up")} שכתוב</button>
        <button class="pill" data-act="sentex">משפט לדוגמה</button>
      </div>
      <div id="rwout"></div>`
    : `
      <div class="searchfield">
        ${svg("search")}
        <input id="q" type="text" autocomplete="off" value="${esc(S.q||"")}"
          placeholder="${S.smode==="dict"?"מילה, פירוש או משפט…":"מילה פשוטה, למשל: חזק"}">
        <button class="icon-btn sm" data-act="clearq">${svg("close")}</button>
      </div>
      <div id="results"></div>`}
  </div>
  ${tabbar("search")}`;
  $("#smode").addEventListener("click",e=>{
    const b=e.target.closest("[data-mode]"); if(!b)return;
    S.smode=b.dataset.mode; screenSearch();
  });
  if(S.smode==="sent"){ drawRewrite(); return; }
  const inp=$("#q");
  inp.addEventListener("input",()=>{ S.q=inp.value; drawResults(); });
  drawResults();
  if(S.q) inp.focus();
}
function wordRow(w,extra=""){
  return `<button class="wrow tap" data-open="${w.id}">
    <div class="w">${esc(w.w)}</div>
    <div class="d">${esc(w.d)}</div>${extra}
    <div class="go">${svg("fwd")}</div></button>`;
}
function drawResults(){
  const box=$("#results"); if(!box) return;
  const q = norm((S.q||"").trim());
  if(q.length<2){
    box.innerHTML = S.smode==="dict"
      ? `<div class="empty">${svg("search")}<p>חיפוש בכל 300 המילים — לפי מילה, פירוש, מילה נרדפת או משפט לדוגמה.</p></div>`
      : `<div class="empty">${svg("up")}<p>כותבים מילה יומיומית ומקבלים את החלופות בשפה גבוהה.</p>
         <div class="sugg">${["חזק","בעיה","להגיד","כעס","חשוב","אבל","טעות","מהר"].map(t=>
           `<button class="tog" data-sugg="${t}">${t}</button>`).join("")}</div></div>`;
    return;
  }
  if(S.smode==="dict"){
    const res=searchBank(q);
    box.innerHTML = res.length
      ? `<div class="sec-title">${res.length} תוצאות</div><div class="wlist">${res.map(w=>wordRow(w)).join("")}</div>`
      : `<div class="empty"><p>לא נמצאה מילה. אפשר לנסות חלק מהמילה, או לעבור ללשונית שדרוג שפה.</p></div>`;
    return;
  }
  const hits=searchUpgrade(q);
  if(!hits.length){
    const near=searchBank(q).slice(0,6);
    box.innerHTML = `<div class="empty"><p>אין עדיין שדרוג למילה הזו במילון.</p></div>`+
      (near.length?`<div class="sec-title">אולי התכוונת</div><div class="wlist">${near.map(w=>wordRow(w)).join("")}</div>`:"");
    return;
  }
  box.innerHTML = hits.map(h=>`
    <div class="sec-title">${h.bank?`מילים שבמאגר מציעות במקום ״${esc(h.k)}״`:`במקום ״${esc(h.k)}״`}</div>
    <div class="upg">${h.items.map(it=>{
      const inBank = WORDS.some(w=>w.id===it.id);
      return `<div class="up ${inBank?"tap":""}" ${inBank?`data-open="${it.id}"`:""}>
        <div class="uw">${esc(it.w)}</div><div class="ud">${esc(it.d)}</div>
        <div class="ua">${inBank?svg("fwd"):""}</div></div>`;
    }).join("")}</div>`).join("");
}
function openWord(id){
  let d = deckAll(), i = d.findIndex(w=>w.id===id);
  if(i<0){ P.cats=[]; P.levels=[]; save(); i = deckAll().findIndex(w=>w.id===id); }
  if(i<0) return toast("המילה לא נמצאה");
  S.idx=i; S.reveal=true; go("cards");
}

/* =======================================================
   ניווט תחתון
   ======================================================= */
const TABS = [["hub","home","בית"],["cards","layers","כרטיסים"],["practice","cap","תרגול"],
              ["search","search","חיפוש"],["progress","chart","מעקב"]];
function tabbar(active){
  return `<nav class="tabbar">${TABS.map(([r,ic,nm])=>
    `<button class="tab ${active===r?"on":""}" data-act="${r}">${svg(ic)}<span>${nm}</span></button>`).join("")}</nav>`;
}

/* =======================================================
   מרכז התרגול
   ======================================================= */
const MODES = {
  flash:  {t:"כרטיסיות",       d:"למידה עם דירוג עצמי", art:"cards",   n:20},
  quiz:   {t:"אמריקאי",         d:"ארבע אפשרויות",       art:"abc",     n:12, kinds:["w2d","d2w","syn"]},
  cloze:  {t:"השלמת משפטים",    d:"המילה החסרה בהקשר",   art:"blank",   n:10, kinds:["cloze"]},
  xword:  {t:"תשבץ",            d:"הגדרות ואותיות",      art:"grid"},
  sprint: {t:"ספרינט",          d:"60 שניות, כמה שיותר", art:"timer",   time:60, kinds:["w2d","d2w"]},
  perfect:{t:"שלמות",           d:"15 שאלות, בלי טעות",  art:"perfect", n:15, lives:1, kinds:["w2d","d2w","cloze"]},
  elim:   {t:"אלימינציה",       d:"פסילת התשובות השגויות",art:"elim",   n:10},
  pairs:  {t:"התאמה",           d:"חיבור מילה לפירוש",   art:"pairs",   n:5},
  ant:    {t:"הפכים",            d:"איזו מילה הפוכה?",    art:"opp",     n:12, kinds:["ant"]},
  gallows:{t:"גרדום",            d:"ניחוש אותיות לפי הגדרה", art:"gallows", n:5}
};

function screenPractice(){
  const due=deckReview().length, star=deckStar().length, wrong=deckWrong().length;
  const card = (m,src)=>`<button class="mode-card" data-run="${m}" data-src="${src||"all"}">
      <div class="art">${ART[MODES[m].art]}</div>
      <div class="nm">${MODES[m].t}</div><div class="ds">${MODES[m].d}</div></button>`;
  app().innerHTML = `
  <div class="topbar">
    <div class="screen-title">תרגול</div>
    <div class="sub">${deckAll().length} מילים · ${deckName()}</div>
  </div>
  <div class="wrap">
    <div class="grid2">${card("flash")}${card("quiz")}${card("cloze")}${card("xword")}</div>
    <div class="sec-title">בשבילך</div>
    <button class="row-card" data-run="flash" data-src="due">
      <div class="art">${ART.due}</div>
      <div><div class="nm">לחזרה היום</div><div class="ds">מילים שהגיע זמנן לפי מרווחי הזמן</div></div>
      <div class="cnt">${due}</div></button>
    <button class="row-card" data-run="quiz" data-src="wrong" style="margin-top:10px">
      <div class="art">${ART.bug}</div>
      <div><div class="nm">הטעויות שלי</div><div class="ds">המילים שנפלתי בהן הכי הרבה</div></div>
      <div class="cnt">${wrong}</div></button>
    <button class="row-card" data-run="flash" data-src="star" style="margin-top:10px">
      <div class="art">${ART.mark}</div>
      <div><div class="nm">האוסף שלי</div><div class="ds">מילים שסימנתי בכרטיס</div></div>
      <div class="cnt">${star}</div></button>
    <div class="sec-title">אתגרים</div>
    <div class="grid2">${card("sprint")}${card("perfect")}${card("elim")}${card("pairs")}</div>
    <div class="sec-title">משחקים</div>
    <div class="grid2">${card("gallows")}${card("ant")}</div>
  </div>
  ${tabbar("practice")}`;
}

/* =======================================================
   מנוע שאלות
   ======================================================= */
function lcs(a,b){                      // אורך המחרוזת המשותפת הארוכה ביותר
  a=norm(a); b=norm(b); let best=0;
  const dp=Array(b.length+1).fill(0);
  for(let i=1;i<=a.length;i++){ let prev=0;
    for(let j=1;j<=b.length;j++){ const tmp=dp[j];
      dp[j] = a[i-1]===b[j-1] ? prev+1 : 0;
      if(dp[j]>best) best=dp[j];
      prev=tmp; } }
  return best;
}
function clozeOf(w){
  if(strip(w.w).includes(" ")) return null;
  const plain = strip(w.w);
  const parts = w.e.split(/(\s+)/);
  let bi=-1, bs=0;
  parts.forEach((t,i)=>{
    if(/^\s*$/.test(t)) return;
    const clean = t.replace(/[.,;:!?״"'()]/g,"");
    if(clean.length<2) return;
    const sc = lcs(clean, plain);
    if(sc>bs){ bs=sc; bi=i; }
  });
  if(bi<0 || bs<3 || bs < plain.length*0.5) return null;
  const html = parts.map((t,i)=> i===bi
      ? '<span class="blank"></span>'
      : esc(t)).join("");
  return html;
}
function distractors(w, field, pool, n=3){
  let same = pool.filter(x=>x.id!==w.id && x.c===w.c);
  if(same.length<n) same = pool.filter(x=>x.id!==w.id);
  const picked = shuffle(same).slice(0,n);
  return picked.map(x=>field==="d" ? x.d : x.w);
}
function makeQ(w, kinds, pool){
  const opts = shuffle(kinds.filter(k=>{
    if(k==="cloze") return !!clozeOf(w);
    if(k==="syn")   return w.s && w.s.length>0;
    if(k==="ant")   return w.a && w.a.length>0;
    return true;
  }));
  const kind = opts[0] || "w2d";
  if(kind==="d2w"){
    const answer = w.w;
    return {kind, w, label:"איזו מילה מתאימה להגדרה?", body:`<div class="qtext">${esc(w.d)}</div>`,
            answer, options:shuffle([answer, ...distractors(w,"w",pool)]), serif:true};
  }
  if(kind==="cloze"){
    return {kind, w, label:"השלימו את המשפט", body:`<div class="qtext">${clozeOf(w)}</div>`,
            answer:w.w, options:shuffle([w.w, ...distractors(w,"w",pool)]), serif:true};
  }
  if(kind==="ant"){
    const raw = rnd(w.a);
    const hit = pool.find(x=>norm(x.w)===norm(raw));
    const answer = hit ? hit.w : raw;
    const bad = [...new Set(shuffle(pool.filter(x=>x.id!==w.id &&
                 !w.a.some(t=>norm(t)===norm(x.w)) && !(w.s||[]).some(t=>norm(t)===norm(x.w))))
                 .slice(0,6).map(x=>x.w))].filter(t=>norm(t)!==norm(answer)).slice(0,3);
    if(bad.length<3) return {kind:"w2d", w, label:"מה פירוש המילה?", body:`<div class="qword">${esc(w.w)}</div>`,
            answer:w.d, options:shuffle([w.d, ...distractors(w,"d",pool)])};
    return {kind, w, label:"איזו מילה הפוכה במשמעות?", body:`<div class="qword">${esc(w.w)}</div>`,
            answer, options:shuffle([answer, ...bad]), serif:true};
  }
  if(kind==="syn"){
    const answer = rnd(w.s);
    const bad = [...new Set(shuffle(pool.filter(x=>x.id!==w.id && x.s && x.s.length))
                 .slice(0,6).map(x=>rnd(x.s)))].filter(t=>t!==answer && !w.s.includes(t)).slice(0,3);
    if(bad.length<3) return {kind:"w2d", w, label:"מה פירוש המילה?", body:`<div class="qword">${esc(w.w)}</div>`,
            answer:w.d, options:shuffle([w.d, ...distractors(w,"d",pool)])};
    return {kind, w, label:"איזו מילה קרובה במשמעות?", body:`<div class="qword">${esc(w.w)}</div>`,
            answer, options:shuffle([answer, ...bad])};
  }
  return {kind:"w2d", w, label:"מה פירוש המילה?", body:`<div class="qword">${esc(w.w)}</div>`,
          answer:w.d, options:shuffle([w.d, ...distractors(w,"d",pool)])};
}

function pickWords(src, n){
  let d = src==="due" ? deckDue() : src==="star" ? deckStar() : src==="wrong" ? deckWrong() : deckAll();
  if(!d.length) d = deckAll();
  const scored = d.map(w=>{ const r=P.words[w.id]||{box:0,bad:0,ok:0};
    return {w, s:(isDue(w.id)?0:12) + r.box*2 - Math.min(6,(r.bad-r.ok)) + Math.random()*3}; });
  scored.sort((a,b)=>a.s-b.s);
  const take = scored.slice(0, Math.max(n, Math.min(scored.length, n*2))).map(x=>x.w);
  return shuffle(take).slice(0, n);
}

/* =======================================================
   הרצת תרגול
   ======================================================= */
function startRun(mode, src){
  const M = MODES[mode];
  if(src==="star" && !deckStar().length)  return toast("האוסף ריק — סמנו מילים בכרטיס");
  if(src==="wrong" && !deckWrong().length) return toast("אין עדיין טעויות לתרגל — התחילו בתרגול");
  if(src==="due" && !deckDue().length)     return toast("אין מילים לחזרה כרגע");
  clearInterval(S.timer); S.timer=null;
  const pool = deckAll();
  if(mode==="xword") return startXword(pickWords(src, 40));
  if(mode==="pairs"){
    S.sess = {mode, src, pool, round:1, right:0, wrong:0, misses:[], words:pickWords(src, M.n)};
    S.route="run"; return renderPairs();
  }
  const n = M.n || 20;
  const words = pickWords(src, mode==="sprint" ? 40 : n);
  if(!words.length){ toast("אין מילים מתאימות"); return; }
  S.sess = {mode, src, pool, words, i:0, right:0, wrong:0, misses:[], lives:M.lives||0,
            total: mode==="sprint" ? 0 : words.length, answered:false, elim:[],
            endAt: M.time ? Date.now()+M.time*1000 : 0, startAt:Date.now()};
  if(mode==="gallows"){
    const ok = deckAll().filter(x=>{ const p=norm(x.w); return p.length>=3 && p.length<=8 && /^[\u05D0-\u05EA]+$/.test(p); });
    words.length=0; shuffle(ok).slice(0,5).forEach(x=>words.push(x));
    if(!words.length){ toast("אין מילים מתאימות למשחק"); return; }
  }
  if(mode!=="flash" && mode!=="elim" && mode!=="gallows"){
    S.sess.qs = words.map(w=>makeQ(w, M.kinds, pool));
  }
  S.route="run";
  renderRun();
  if(M.time){ S.timer = setInterval(()=>{
      const left = S.sess.endAt - Date.now();
      const bar = $("#tmeter"); if(bar) bar.style.width = Math.max(0,left/(M.time*1000)*100)+"%";
      const lb = $("#tleft"); if(lb) lb.textContent = Math.max(0,Math.ceil(left/1000));
      if(left<=0){ clearInterval(S.timer); S.timer=null; finishRun(); }
    }, 200); }
}

function runHead(){
  const s=S.sess, M=MODES[s.mode];
  const pct = M.time ? 100 : (s.total? ((s.i+(s.answered?1:0))/s.total*100):0);
  return `<div class="qhead">
    ${ibtn("close","quit","sm")}
    <div class="meter"><i id="tmeter" style="width:${pct}%"></i></div>
    <div class="score">${M.time?`<span id="tleft">${M.time}</span>ש׳`:`${s.i+1}/${s.total}`}</div>
    <div class="score" style="color:var(--good)">${s.right}</div>
  </div>`;
}

function renderRun(){
  const s=S.sess;
  if(s.mode==="flash")   return renderFlash();
  if(s.mode==="elim")    return renderElim();
  if(s.mode==="gallows") return renderGallows();
  if(s.mode==="sprint" && s.i>=s.qs.length){      // מחזור נוסף לספרינט
    s.qs = s.qs.concat(pickWords(s.src,20).map(w=>makeQ(w, MODES.sprint.kinds, s.pool)));
  }
  if(s.i>=s.qs.length) return finishRun();
  const q = s.qs[s.i];
  app().innerHTML = `<div class="quiz">
    ${runHead()}
    <div class="qbody">
      <div class="qprompt"><div class="qkind">${q.label}</div>${q.body}</div>
      <div class="opts" id="opts">
        ${q.options.map((o,i)=>`<button class="opt" data-opt="${i}" ${q.serif?'style="font-family:\'Frank Ruhl Libre\',serif;font-size:20px;font-weight:700"':""}>${esc(o)}</button>`).join("")}
      </div>
    </div>
    <div class="qfoot" id="qfoot"></div>
  </div>`;
}

function answer(i){
  const s=S.sess, q=s.qs[s.i];
  if(s.answered) return;
  s.answered = true;
  const chosen = q.options[i];
  const ok = chosen === q.answer;
  const btns = $$("#opts .opt");
  btns.forEach((b,j)=>{ if(q.options[j]===q.answer) b.classList.add("ok");
                        else if(j===i) b.classList.add("no"); });
  if(ok){ s.right++; grade(q.w.id,2); }
  else  { s.wrong++; grade(q.w.id,0); s.misses.push(q.w); }
  logAnswer(ok);
  if(s.lives && !ok) s.lives--;
  $("#qfoot").innerHTML = ok
    ? `<div class="verdict ok">נכון</div>`
    : `<div style="text-align:center"><div class="verdict no">${esc(q.answer)}</div>
       <div class="sub" style="margin-top:4px">${esc(q.w.w)} — ${esc(q.w.d)}</div></div>`;
  if(s.lives===0 && MODES[s.mode].lives && !ok){ setTimeout(finishRun, 1400); return; }
  const wait = ok ? 420 : 1500;
  setTimeout(()=>{ s.i++; s.answered=false;
    if(s.mode!=="sprint" && s.i>=s.qs.length) finishRun(); else renderRun(); }, wait);
}

/* --- כרטיסיות עם דירוג עצמי --- */
function renderFlash(){
  const s=S.sess;
  if(s.i>=s.words.length) return finishRun();
  const w=s.words[s.i];
  app().innerHTML = `<div class="quiz">
    ${runHead()}
    <div class="qbody" style="justify-content:center">
      <div class="qprompt" id="fcard">
        <div class="qword">${esc(w.w)}</div>
        <div class="reveal ${s.answered?"":"off"}" style="margin-top:18px">
          <div class="def" style="color:var(--muted);font-size:18px">(${esc(w.p)}) ${esc(w.d)}</div>
          <div class="ex" style="color:var(--dim);font-style:italic;margin-top:10px">״${esc(w.e)}״</div>
        </div>
        ${s.answered?"":'<div class="tap-hint">הקישו כדי לראות את הפירוש</div>'}
      </div>
    </div>
    <div class="qfoot">${ s.answered ? `<div class="grade">
        <button class="g0" data-grade="0">לא ידעתי<small>נחזור מיד</small></button>
        <button class="g1" data-grade="1">כמעט<small>מחר</small></button>
        <button class="g2" data-grade="2">ידעתי<small>בעוד ${IVL[Math.min(7,(P.words[w.id]||{box:0}).box+1)]} ימים</small></button>
      </div>` : `<button class="pill" data-flip="1">הצגת הפירוש</button>` }</div>
  </div>`;
}
function flashGrade(g){
  const s=S.sess, w=s.words[s.i];
  grade(w.id,g); logAnswer(g===2);
  if(g===2) s.right++; else { s.wrong++; if(g===0) s.misses.push(w); }
  if(g===0) s.words.push(w);                 // חזרה בסוף הסבב
  s.i++; s.answered=false; s.total=s.words.length;
  renderFlash();
}

/* --- אלימינציה --- */
function renderElim(){
  const s=S.sess;
  if(s.i>=s.words.length) return finishRun();
  const w=s.words[s.i];
  if(!s.q || s.qIdx!==s.i){
    s.q = {answer:w.d, options:shuffle([w.d, ...distractors(w,"d",s.pool)])};
    s.qIdx=s.i; s.elim=[];
  }
  const q=s.q;
  app().innerHTML = `<div class="quiz">
    ${runHead()}
    <div class="qbody">
      <div class="qprompt"><div class="qkind">פסלו את שלוש ההגדרות השגויות</div>
        <div class="qword">${esc(w.w)}</div></div>
      <div class="opts" id="opts">
        ${q.options.map((o,i)=>`<button class="opt ${s.elim.includes(i)?"gone":""}" data-elim="${i}">${esc(o)}</button>`).join("")}
      </div>
    </div>
    <div class="qfoot" id="qfoot">${s.answered?`<div class="verdict ok">${esc(q.answer)}</div>`:
      `<div class="sub">נותרו ${3-s.elim.length} לפסילה</div>`}</div>
  </div>`;
}
function elimTap(i){
  const s=S.sess, q=s.q;
  if(s.answered || s.elim.includes(i)) return;
  if(q.options[i]===q.answer){                       // פסלו את הנכונה
    s.answered=true; s.wrong++; grade(s.words[s.i].id,0); logAnswer(false); s.misses.push(s.words[s.i]);
    $$("#opts .opt")[i].classList.add("no");
    $("#qfoot").innerHTML = `<div style="text-align:center"><div class="verdict no">זו הייתה ההגדרה הנכונה</div>
      <div class="sub">${esc(s.words[s.i].w)} — ${esc(q.answer)}</div></div>`;
    setTimeout(()=>{ s.i++; s.answered=false; renderElim(); },1700);
    return;
  }
  s.elim.push(i);
  const b=$$("#opts .opt")[i]; b.classList.add("gone");
  if(s.elim.length===3){
    s.answered=true; s.right++; grade(s.words[s.i].id,2); logAnswer(true);
    $$("#opts .opt").forEach((x,j)=>{ if(q.options[j]===q.answer) x.classList.add("ok"); });
    $("#qfoot").innerHTML = `<div class="verdict ok">נכון</div>`;
    setTimeout(()=>{ s.i++; s.answered=false; renderElim(); },800);
  } else {
    $("#qfoot").innerHTML = `<div class="sub">נותרו ${3-s.elim.length} לפסילה</div>`;
  }
}

/* --- התאמה --- */
function renderPairs(){
  const s=S.sess;
  if(!s.tiles){
    s.tiles = shuffle([
      ...s.words.map(w=>({k:"w",id:w.id,txt:w.w})),
      ...s.words.map(w=>({k:"d",id:w.id,txt:w.d}))
    ]);
    s.sel=null; s.left=s.words.length; s.t0=Date.now();
  }
  app().innerHTML = `<div class="quiz">
    <div class="qhead">${ibtn("close","quit","sm")}
      <div class="meter"><i style="width:${(1-s.left/s.words.length)*100}%"></i></div>
      <div class="score">סבב ${s.round}</div></div>
    <div class="qbody">
      <div class="qkind" style="text-align:center;margin-bottom:14px">חברו כל מילה לפירוש שלה</div>
      <div class="match" id="match">
        ${s.tiles.map((t,i)=>`<button class="m ${t.k==="w"?"w":""} ${t.done?"done":""} ${s.sel===i?"sel":""}"
           data-tile="${i}">${esc(t.txt)}</button>`).join("")}
      </div>
    </div>
    <div class="qfoot" id="qfoot"><div class="sub">נותרו ${s.left} צמדים</div></div>
  </div>`;
}
function pairTap(i){
  const s=S.sess, t=s.tiles[i];
  if(t.done) return;
  if(s.sel===null){ s.sel=i; return renderPairs(); }
  if(s.sel===i){ s.sel=null; return renderPairs(); }
  const a=s.tiles[s.sel];
  if(a.id===t.id && a.k!==t.k){
    a.done=t.done=true; s.left--; s.sel=null; s.right++;
    grade(t.id,2); logAnswer(true);
    if(s.left===0){
      const secs=Math.round((Date.now()-s.t0)/1000);
      s.round++; s.words=pickWords(s.src,MODES.pairs.n); s.tiles=null;
      if(s.round>3) return finishRun();
      toast(`סבב הושלם ב־${secs} שניות`);
    }
    return renderPairs();
  }
  s.wrong++; grade(t.id,0); logAnswer(false);
  const w = WORDS.find(x=>x.id===(a.k==="w"?a.id:t.id));
  if(w) s.misses.push(w);
  s.sel=null; renderPairs();
  const q=$("#qfoot"); if(q) q.innerHTML='<div class="verdict no">לא מתאים</div>';
}

/* --- גרדום --- */
const HEB = "אבגדהוזחטיכלמנסעפצקרשת".split("");
function renderGallows(){
  const s=S.sess;
  if(s.i>=s.words.length) return finishRun();
  const w=s.words[s.i];
  if(!s.g || s.gIdx!==s.i){ s.g={word:norm(w.w), disp:strip(w.w), got:new Set(), miss:new Set(), lives:6, over:false}; s.gIdx=s.i; }
  const g=s.g;
  const shown = [...g.word].map((c,i)=> (g.got.has(c)||g.over) ? g.disp[i] : "·").join(" ");
  const solved = [...g.word].every(c=>g.got.has(c));
  app().innerHTML = `<div class="quiz">
    ${runHead()}
    <div class="qbody">
      <div class="qprompt">
        <div class="qkind">${w.p} · ${g.word.length} אותיות</div>
        <div class="qtext" style="margin-bottom:20px">${esc(w.d)}</div>
        <div class="gword ${g.over?(solved?"ok":"no"):""}">${shown}</div>
        <div class="lives">${"♥".repeat(g.lives)}<span>${"♡".repeat(6-g.lives)}</span></div>
      </div>
      ${g.over ? `<div style="text-align:center">
          <div class="verdict ${solved?"ok":"no"}">${solved?"כל הכבוד":"המילה הייתה"}</div>
          <div class="qword" style="font-size:30px;margin-top:6px">${esc(w.w)}</div>
          <div class="sub" style="margin-top:8px">״${esc(w.e)}״</div>
          <button class="pill primary" style="margin-top:18px" data-gnext="1">המילה הבאה</button>
        </div>`
        : `<div class="keys">${HEB.map(c=>`<button class="key ${g.got.has(c)?"ok":g.miss.has(c)?"no":""}"
             data-key="${c}" ${g.got.has(c)||g.miss.has(c)?"disabled":""}>${c}</button>`).join("")}</div>`}
    </div>
    <div class="qfoot"></div>
  </div>`;
}
function gallowsKey(c){
  const s=S.sess, g=s.g, w=s.words[s.i];
  if(g.over || g.got.has(c) || g.miss.has(c)) return;
  if(g.word.includes(c)){
    g.got.add(c);
    if([...g.word].every(x=>g.got.has(x))){ g.over=true; s.right++; grade(w.id,2); logAnswer(true); }
  } else {
    g.miss.add(c); g.lives--;
    if(g.lives<=0){ g.over=true; s.wrong++; grade(w.id,0); logAnswer(false); s.misses.push(w); }
  }
  renderGallows();
}

/* --- סיום --- */
function finishRun(){
  clearInterval(S.timer); S.timer=null;
  const s=S.sess; if(!s) return go("practice");
  const tot = s.right+s.wrong;
  const pct = tot? Math.round(s.right/tot*100):0;
  const msg = pct>=90?"מצוין":pct>=70?"יפה מאוד":pct>=50?"בדרך הנכונה":"ממשיכים לתרגל";
  const misses = [...new Map(s.misses.map(w=>[w.id,w])).values()].slice(0,6);
  S.route="done";
  app().innerHTML = `<div class="quiz"><div class="topbar"><div></div>${ibtn("close","hub","sm")}</div>
    <div class="done">
      <div class="big" style="color:var(--accent)">${pct}%</div>
      <div class="ttl">${msg}</div>
      <div class="sub2">${s.right} נכונות מתוך ${tot} · ${MODES[s.mode].t}<br>
        ${Math.round(s.right*10+s.wrong*2)} נקודות ניסיון</div>
      ${misses.length?`<div style="width:100%;max-width:460px;margin-top:22px;text-align:right">
        <div class="sec-title" style="margin:0 4px 8px">לחזור על אלה</div>
        <div class="wlist">${misses.map(w=>`<div class="wrow"><div class="w">${esc(w.w)}</div>
          <div class="d">${esc(w.d)}</div></div>`).join("")}</div></div>`:""}
      <div class="btns">
        <button class="pill primary" data-act="again">${svg("refresh")} עוד סבב</button>
        <button class="pill" data-act="practice">תרגולים</button>
        <button class="pill" data-act="hub">מסך הבית</button>
      </div>
    </div></div>`;
}

/* =======================================================
   תשבץ
   ======================================================= */
const SIZE = 13;
function buildXword(cands, want=8){
  const pool = shuffle(cands.filter(w=>{ const p=norm(w.w);
      return p.length>=3 && p.length<=8 && /^[א-ת]+$/.test(p); }))
      .sort((a,b)=>norm(b.w).length-norm(a.w).length).slice(0,60);
  if(!pool.length) return null;
  const cell = {};                                 // "r,c" -> אות
  const entries = [];
  const at=(r,c)=>cell[r+","+c];
  function fits(word,r,c,dir,first){
    const L=word.length; let cross=0;
    const dr = dir==="D"?1:0, dc = dir==="A"?1:0;
    if(at(r-dr, c-dc) || at(r+dr*L, c+dc*L)) return -1;
    for(let i=0;i<L;i++){
      const rr=r+dr*i, cc=c+dc*i;
      if(rr<0||cc<0||rr>=SIZE||cc>=SIZE) return -1;
      const cur = at(rr,cc);
      if(cur){ if(cur!==word[i]) return -1; cross++; }
      else{
        if(dir==="A"){ if(at(rr-1,cc)||at(rr+1,cc)) return -1; }
        else          { if(at(rr,cc-1)||at(rr,cc+1)) return -1; }
      }
    }
    if(!first && cross===0) return -1;
    return cross;
  }
  function put(w,word,r,c,dir){
    const dr=dir==="D"?1:0, dc=dir==="A"?1:0;
    for(let i=0;i<word.length;i++) cell[(r+dr*i)+","+(c+dc*i)] = word[i];
    entries.push({w, word, r, c, dir});
  }
  const f = pool.shift(), fw = strip(f.w);
  put(f, fw, Math.floor(SIZE/2), Math.floor((SIZE-fw.length)/2), "A");
  for(const cand of pool){
    if(entries.length>=want) break;
    const word = strip(cand.w);
    if(entries.some(e=>e.word===word)) continue;
    let best=null;
    for(const e of entries){
      for(let i=0;i<e.word.length;i++){
        for(let j=0;j<word.length;j++){
          if(e.word[i]!==word[j]) continue;
          const dir = e.dir==="A" ? "D" : "A";
          const r = e.dir==="A" ? e.r - j : e.r + i;
          const c = e.dir==="A" ? e.c + i : e.c - j;
          const sc = fits(word, r, c, dir, false);
          if(sc>0 && (!best || sc>best.sc)) best={r,c,dir,sc};
        }
      }
    }
    if(best) put(cand, word, best.r, best.c, best.dir);
  }
  if(entries.length<4) return null;
  // נרמול גבולות + מספור
  let minR=99,minC=99,maxR=-1,maxC=-1;
  Object.keys(cell).forEach(k=>{ const [r,c]=k.split(",").map(Number);
    minR=Math.min(minR,r);minC=Math.min(minC,c);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c); });
  entries.forEach(e=>{ e.r-=minR; e.c-=minC; });
  const grid={}; Object.keys(cell).forEach(k=>{ const [r,c]=k.split(",").map(Number);
    grid[(r-minR)+","+(c-minC)] = cell[k]; });
  entries.sort((a,b)=> a.r-b.r || a.c-b.c);
  let n=0; const numAt={};
  entries.forEach(e=>{ const k=e.r+","+e.c;
    if(!numAt[k]) numAt[k]=++n;
    e.n = numAt[k]; });
  return {grid, entries, rows:maxR-minR+1, cols:maxC-minC+1, numAt};
}

function startXword(words){
  const X = buildXword(words);
  if(!X){ toast("לא הצלחתי לבנות תשבץ — נסו סינון אחר"); return go("practice"); }
  S.sess = {mode:"xword", X, cur:null, dir:"A", right:0, wrong:0, misses:[], solved:new Set()};
  S.route="run";
  renderXword();
}
function renderXword(){
  const s=S.sess, X=s.X;
  let cells="";
  for(let r=0;r<X.rows;r++) for(let c=0;c<X.cols;c++){
    const k=r+","+c, on=X.grid[k];
    if(!on){ cells+='<div class="cell"></div>'; continue; }
    const num = X.numAt[k] ? `<span class="n">${X.numAt[k]}</span>` : "";
    cells += `<div class="cell on" id="c${r}_${c}">${num}<input inputmode="text" maxlength="2" data-r="${r}" data-c="${c}" autocomplete="off"></div>`;
  }
  const list = d => X.entries.filter(e=>e.dir===d)
      .map(e=>`<div class="${s.solved.has(e.n+e.dir)?"solved":""}"><b>${e.n}.</b> ${esc(e.w.d)}</div>`).join("");
  app().innerHTML = `<div class="quiz">
    <div class="qhead">${ibtn("close","quit","sm")}
      <div class="meter"><i id="xmeter" style="width:${s.solved.size/X.entries.length*100}%"></i></div>
      <div class="score">${s.solved.size}/${X.entries.length}</div></div>
    <div class="wrap" style="padding-top:4px">
      <div class="xw-wrap"><div class="xw" style="grid-template-columns:repeat(${X.cols},var(--cs));--cs:${Math.max(22,Math.min(36,Math.floor((Math.min(window.innerWidth,640)-44)/X.cols)))}px">${cells}</div></div>
      <div class="clue-box" id="clue"><div class="lbl">בחרו משבצת</div><div class="txt">ההגדרה תופיע כאן</div></div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="pill" data-x="hint">${svg("target")} רמז</button>
        <button class="pill" data-x="check">${svg("check")} בדיקה</button>
      </div>
      <div class="clue-list">
        <h4>מאוזן</h4>${list("A")}
        <h4>מאונך</h4>${list("D")}
      </div>
    </div></div>`;
  bindXword();
}
function entriesAt(r,c){
  return S.sess.X.entries.filter(e=> e.dir==="A"
      ? (e.r===r && c>=e.c && c<e.c+e.word.length)
      : (e.c===c && r>=e.r && r<e.r+e.word.length));
}
function showClue(){
  const s=S.sess, e=s.cur; const box=$("#clue"); if(!box) return;
  if(!e){ box.innerHTML='<div class="lbl">בחרו משבצת</div><div class="txt">ההגדרה תופיע כאן</div>'; return; }
  box.innerHTML = `<div class="lbl">${e.n}. ${e.dir==="A"?"מאוזן":"מאונך"} · ${e.word.length} אותיות · ${e.w.p}</div>
                   <div class="txt">${esc(e.w.d)}</div>`;
  $$(".xw .cell").forEach(c=>c.classList.remove("cur"));
  for(let i=0;i<e.word.length;i++){
    const rr = e.dir==="D"? e.r+i : e.r, cc = e.dir==="A"? e.c+i : e.c;
    const el=$("#c"+rr+"_"+cc); if(el) el.classList.add("cur");
  }
}
function checkEntry(e){
  const s=S.sess;
  let filled="";
  for(let i=0;i<e.word.length;i++){
    const rr=e.dir==="D"?e.r+i:e.r, cc=e.dir==="A"?e.c+i:e.c;
    const inp=$(`input[data-r="${rr}"][data-c="${cc}"]`);
    filled += norm(inp?inp.value:"") || " ";
  }
  if(filled.includes(" ")) return;
  const key = e.n+e.dir;
  if(filled===norm(e.word)){
    if(!s.solved.has(key)){
      s.solved.add(key); s.right++; grade(e.w.id,2); logAnswer(true);
      for(let i=0;i<e.word.length;i++){
        const rr=e.dir==="D"?e.r+i:e.r, cc=e.dir==="A"?e.c+i:e.c;
        const el=$("#c"+rr+"_"+cc); if(el) el.classList.add("ok");
      }
      const m=$("#xmeter"); if(m) m.style.width = s.solved.size/s.X.entries.length*100+"%";
      toast(`${e.w.w} ✓`);
      if(s.solved.size===s.X.entries.length) setTimeout(finishRun,700);
      else renderClues();
    }
  }
}
function renderClues(){
  const s=S.sess, X=s.X;
  const box=$(".clue-list"); if(!box) return;
  const list = d => X.entries.filter(e=>e.dir===d)
      .map(e=>`<div class="${s.solved.has(e.n+e.dir)?"solved":""}"><b>${e.n}.</b> ${esc(e.w.d)}</div>`).join("");
  box.innerHTML = `<h4>מאוזן</h4>${list("A")}<h4>מאונך</h4>${list("D")}`;
}
function bindXword(){
  const s=S.sess;
  $$(".xw input").forEach(inp=>{
    inp.addEventListener("focus",()=>{
      const r=+inp.dataset.r, c=+inp.dataset.c, es=entriesAt(r,c);
      if(!es.length) return;
      s.cur = es.find(e=>e.dir===s.dir) || es[0];
      s.dir = s.cur.dir; showClue();
    });
    inp.addEventListener("input",()=>{
      const v = norm(inp.value).slice(-1);
      inp.value = v;
      const r=+inp.dataset.r, c=+inp.dataset.c;
      const e = s.cur || entriesAt(r,c)[0];
      if(e) checkEntry(e);
      if(v && e){
        const nr = e.dir==="D"? r+1 : r, nc = e.dir==="A"? c+1 : c;
        const nx = $(`input[data-r="${nr}"][data-c="${nc}"]`);
        if(nx) nx.focus();
      }
    });
    inp.addEventListener("keydown",ev=>{
      const r=+inp.dataset.r, c=+inp.dataset.c;
      const jump=(nr,nc)=>{ const n=$(`input[data-r="${nr}"][data-c="${nc}"]`); if(n){n.focus();ev.preventDefault();} };
      if(ev.key==="Backspace" && !inp.value){ const e=s.cur;
        if(e) jump(e.dir==="D"?r-1:r, e.dir==="A"?c-1:c); }
      if(ev.key==="ArrowRight") jump(r,c-1);
      if(ev.key==="ArrowLeft")  jump(r,c+1);
      if(ev.key==="ArrowDown")  jump(r+1,c);
      if(ev.key==="ArrowUp")    jump(r-1,c);
    });
  });
  const w=$(".wrap"); if(!w) return;
  w.addEventListener("click",e=>{
    const b=e.target.closest("[data-x]"); if(!b) return;
    if(b.dataset.x==="hint"){
      const cur=s.cur; if(!cur) return toast("בחרו קודם הגדרה");
      for(let i=0;i<cur.word.length;i++){
        const rr=cur.dir==="D"?cur.r+i:cur.r, cc=cur.dir==="A"?cur.c+i:cur.c;
        const inp=$(`input[data-r="${rr}"][data-c="${cc}"]`);
        if(inp && !norm(inp.value)){ inp.value=cur.word[i]; s.wrong++; checkEntry(cur); return; }
      }
      toast("המילה כבר מלאה");
    }
    if(b.dataset.x==="check"){
      let bad=0;
      s.X.entries.forEach(en=>{
        for(let i=0;i<en.word.length;i++){
          const rr=en.dir==="D"?en.r+i:en.r, cc=en.dir==="A"?en.c+i:en.c;
          const inp=$(`input[data-r="${rr}"][data-c="${cc}"]`);
          if(inp && norm(inp.value) && norm(inp.value)!==en.word[i]){ inp.value=""; bad++; }
        }
      });
      toast(bad?`נוקו ${bad} אותיות שגויות`:"הכול תקין עד כה");
    }
  });
}

/* =======================================================
   מסך התקדמות
   ======================================================= */
function ring(pct,label,val){
  const R=32, C=2*Math.PI*R;
  return `<div class="ring"><div class="pc">
    <svg viewBox="0 0 78 78"><circle class="bgc" cx="39" cy="39" r="${R}" fill="none" stroke-width="7"/>
      <circle class="fg" cx="39" cy="39" r="${R}" fill="none" stroke-width="7"
        stroke-dasharray="${C}" stroke-dashoffset="${C*(1-Math.min(1,pct))}"/></svg>
    <span>${val}</span></div><div class="lb">${label}</div></div>`;
}
function screenProgress(){
  const all = WORDS.length;
  const started = Object.keys(P.words).filter(k=>(P.words[k].seen||0)>0).length;
  const mastered = Object.keys(P.words).filter(k=>P.words[k].box>=5).length;
  const totA = Object.values(P.days).reduce((s,d)=>s+d.a,0);
  const totC = Object.values(P.days).reduce((s,d)=>s+d.c,0);
  const acc = totA? Math.round(totC/totA*100):0;
  const dayN = todayCount();
  const dte = daysToExam();
  const days=[]; const now=new Date();
  for(let i=67;i>=0;i--){ const d=new Date(now.getTime()-i*DAY); const k=todayKey(d);
    const a=(P.days[k]||{a:0}).a; days.push(a===0?0:a<8?1:a<25?2:3); }
  const byCat = Object.keys(CATS).map(c=>{
    const ws=WORDS.filter(w=>w.c===c);
    const m = ws.reduce((s,w)=>s+mastery(w.id),0)/ws.length;
    return {c, pct:Math.round(m*100), n:ws.length};
  });
  const weak = Object.keys(P.words)
     .map(id=>({id, r:P.words[id]}))
     .filter(x=>x.r.bad>0)
     .sort((a,b)=>(b.r.bad-b.r.ok)-(a.r.bad-a.r.ok)).slice(0,8)
     .map(x=>({w:WORDS.find(w=>w.id===x.id), r:x.r})).filter(x=>x.w);
  const overall = WORDS.reduce((s,w)=>s+mastery(w.id),0)/all;

  app().innerHTML = `
  <div class="topbar"><div class="screen-title">ההתקדמות שלי</div></div>
  <div class="wrap">
    <div class="rings">
      ${ring(overall,"שליטה כוללת",Math.round(overall*100)+"%")}
      ${ring(dayN/P.goal,"יעד יומי",dayN+"/"+P.goal)}
      ${ring(acc/100,"דיוק",acc+"%")}
    </div>
    <div class="stat-grid" style="margin-top:12px">
      <div class="stat"><div class="v">${started}<span style="font-size:15px;color:var(--muted)">/${all}</span></div><div class="l">מילים שנלמדו</div></div>
      <div class="stat"><div class="v">${mastered}</div><div class="l">מילים בשליטה מלאה</div></div>
      <div class="stat"><div class="v">${P.streak.cur||0}</div><div class="l">רצף ימים (שיא ${P.streak.best||0})</div></div>
      <div class="stat"><div class="v">${deckReview().length}</div><div class="l">ממתינות לחזרה היום</div></div>
    </div>
    ${dte!==null?`<div class="stat" style="margin-top:12px"><div class="v">${dte>0?dte:0}</div>
      <div class="l">ימים למבחן · כ־${dte>0?Math.ceil((all-mastered)/Math.max(1,dte)):all-mastered} מילים חדשות ביום כדי לסיים את המאגר</div></div>`:""}
    <div class="sec-title">פעילות ב־68 הימים האחרונים</div>
    <div class="heat">${days.map(l=>`<i class="${l?"l"+l:""}"></i>`).join("")}</div>
    <div class="sec-title">שליטה לפי סוג</div>
    ${byCat.map(b=>`<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:13.5px">
        <span>${CATS[b.c].name}</span><span style="color:var(--muted)">${b.pct}% · ${b.n} מילים</span></div>
      <div class="bar"><i style="width:${b.pct}%"></i></div></div>`).join("")}
    ${weak.length?`<div class="sec-title">המילים הקשות שלי</div>
      <div class="wlist">${weak.map(x=>`<div class="wrow"><div class="w">${esc(x.w.w)}</div>
        <div class="d">${esc(x.w.d)}</div><div class="m">${x.r.bad}✗</div></div>`).join("")}</div>
      <button class="pill" style="margin-top:14px" data-run="quiz" data-src="wrong">${svg("refresh")} תרגול הטעויות</button>`:""}
    <div class="sec-title">נתונים</div>
    <div class="row-card" style="justify-content:space-between">
      <div><div class="nm">איפוס ההתקדמות</div><div class="ds">מוחק את כל הנתונים במכשיר הזה</div></div>
      <button class="pill" data-act="reset">איפוס</button>
    </div>
  </div>
  ${tabbar("progress")}`;
}

/* =======================================================
   ניווט ואירועים
   ======================================================= */
function go(route){
  clearInterval(S.timer); S.timer=null;
  S.route = route;
  render();
  window.scrollTo(0,0);
}
function render(){
  if(S.route==="hub")      return screenHub();
  if(S.route==="cards")    return screenCards();
  if(S.route==="search")   return screenSearch();
  if(S.route==="practice") return screenPractice();
  if(S.route==="progress") return screenProgress();
  if(S.route==="run")      return renderRun();
  if(S.route==="done")     return finishRun();
  screenHub();
}

document.addEventListener("click", e=>{
  const op = e.target.closest("[data-open]");
  if(op){ openWord(op.dataset.open); return; }
  const sq = e.target.closest("[data-seg]");
  if(sq){ segSheet(+sq.dataset.seg); return; }
  if(e.target.closest("[data-sentex]")){ S.sent=SENT_EX; S.segs=rewriteText(SENT_EX);
    const t=$("#sent"); if(t) t.value=SENT_EX; drawRewrite(); return; }
  const sg = e.target.closest("[data-sugg]");
  if(sg){ S.q=sg.dataset.sugg; const i=$("#q"); if(i) i.value=S.q; drawResults(); return; }
  const run = e.target.closest("[data-run]");
  if(run){ closeSheet();
    if(run.dataset.catRun){ P.cats=[run.dataset.catRun]; P.levels=[]; save(); }
    startRun(run.dataset.run, run.dataset.src||"all"); return; }
  const opt = e.target.closest("[data-opt]");   if(opt){ answer(+opt.dataset.opt); return; }
  const gr  = e.target.closest("[data-grade]"); if(gr){ flashGrade(+gr.dataset.grade); return; }
  const gk  = e.target.closest("[data-key]");   if(gk){ gallowsKey(gk.dataset.key); return; }
  if(e.target.closest("[data-gnext]")){ S.sess.i++; renderGallows(); return; }
  const el  = e.target.closest("[data-elim]");  if(el){ elimTap(+el.dataset.elim); return; }
  const tl  = e.target.closest("[data-tile]");  if(tl){ pairTap(+tl.dataset.tile); return; }
  if(e.target.closest("[data-flip]")){ S.sess.answered=true; renderFlash(); return; }
  if(e.target.closest("#fcard") && S.sess && S.sess.mode==="flash" && !S.sess.answered){
    S.sess.answered=true; renderFlash(); return; }
  const act = e.target.closest("[data-act]");
  if(!act) return;
  const a = act.dataset.act;
  if(a==="quit"){ clearInterval(S.timer); S.timer=null; go("practice"); return; }
  if(a==="again"){ startRun(S.sess.mode, S.sess.src||"all"); return; }
  if(a==="hub"){ go("hub"); return; }
  if(a==="cards"){ go("cards"); return; }
  if(a==="search"){ S.smode=S.smode||"up"; go("search"); return; }
  if(a==="rw"){ S.smode="sent"; go("search"); return; }
  if(a==="dorw"){ const t=$("#sent"); S.sent=t?t.value:""; S.showSrc=false;
    S.segs = S.sent.trim() ? rewriteText(S.sent.trim()) : null; drawRewrite();
    if(S.segs && !S.segs.some(x=>x.t==="r")) toast("לא נמצאו מילים לשדרוג במשפט הזה");
    return; }
  if(a==="sentex"){ S.sent=SENT_EX; S.showSrc=false; S.segs=rewriteText(SENT_EX);
    const t=$("#sent"); if(t) t.value=SENT_EX; drawRewrite(); return; }
  if(a==="rwsrc"){ S.showSrc=!S.showSrc; drawRewrite(); return; }
  if(a==="rwcopy"){ const txt=rewriteOut();
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(()=>toast("הועתק ללוח")).catch(()=>toast("ההעתקה לא נתמכת כאן")); return; }
  if(a==="clearq"){ S.q=""; const i=$("#q"); if(i){i.value="";i.focus();} drawResults(); return; }
  if(a==="home"){ go("hub"); return; }
  if(a==="practice"){ go("practice"); return; }
  if(a==="reset"){
    if(confirm("לאפס את כל ההתקדמות? אי אפשר לבטל.")){
      P = JSON.parse(JSON.stringify(DEFAULTS)); save(); applyTheme(); go("hub"); toast("הכול אופס");
    } return; }
  homeAction(a);
});

document.addEventListener("keydown", e=>{
  if(S.route==="cards"){
    if(e.key==="ArrowLeft")  move(1);
    if(e.key==="ArrowRight") move(-1);
    if(e.key===" "){ e.preventDefault(); S.reveal=!S.reveal; drawCard(); }
  }
  if(S.route==="run" && S.sess && S.sess.qs && !S.sess.answered && /^[1-4]$/.test(e.key)){
    const b=$$("#opts .opt")[+e.key-1]; if(b) b.click();
  }
  if(e.key==="Escape"){ if($("#sheet")) closeSheet(); else if(S.route!=="hub") go("hub"); }
});

/* ---------- הפעלה ---------- */
applyTheme();
S.idx = 0;
render();
window.addEventListener("load",()=>{ if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("./sw.js").catch(()=>{}); }});
})();
