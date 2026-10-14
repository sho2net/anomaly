// ANOMALY のサービスワーカー（ホーム画面から起動したときの読み込みを速くし、通信がなくても遊べるようにする）
// ・ゲーム本体（index.html）は「まず通信で最新を取りに行き、だめなら保存分」→ 更新はすぐ届く
// ・絵・曲・アイコンは「保存分があればそれ、なければ取って保存」
// ・別サイト（Firebase など）と fates フォルダ（THREE FATES）には触らない
const V='anomaly-v3.28', FONTS='anomaly-fonts';
const CORE=['./','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('anomaly-')&&k!==V&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin){
    if(/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(caches.open(FONTS).then(c=>c.match(req).then(hit=>{ const net=fetch(req).then(r=>{ if(r.ok) c.put(req,r.clone()); return r; }).catch(()=>hit); return hit||net; })));
    return;
  }
  if(url.pathname.includes('/fates/')) return;
  const page = req.mode==='navigate' || /\/(index\.html)?$/.test(url.pathname);
  if(page){
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(V).then(c=>c.put('./',cp)); } return r; }).catch(()=>caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(V).then(c=>c.put(req,cp)); } return r; })));
});
