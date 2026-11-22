/* Ouverture en local (fichier sur l'ordinateur) : les liens sans extension (espace, cgv, pourquoi-ia…) pointent vers le bon fichier .html. Sans effet en ligne. */
(function(){if(location.protocol!=="file:")return;
  function cible(h,base){if(!h||/^(https?:|mailto:|tel:|javascript:|#)/i.test(h))return null;var m=h.match(/^([^?#]*)(.*)$/),p=m[1],rest=m[2],root=base.replace(/\/(ventes\/)?[^\/]*$/,"/");if(base.indexOf("/ventes/")>-1)root=base.slice(0,base.indexOf("/ventes/")+1);
    var url=p.charAt(0)==="/"?root+p.replace(/^\/+/,""):new URL(p||".",base).href.split(/[?#]/)[0];
    if(url.slice(-1)==="/"||p===""||p==="/")url=(p.charAt(0)==="/"?root:url.replace(/[^\/]*$/,""))+"index.html";
    else if(!/\.[a-z0-9]+$/i.test(url.split("/").pop()))url+=".html";
    return url+rest}
  window.__cibleLocale=cible;
  document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var c=cible(a.getAttribute("href"),location.href);if(c&&c!==a.href&&!a.target){e.preventDefault();location.href=c}},true)})();
/* Surveillance du site : toute erreur est enregistrée dans Supabase (table alex_errors) pour qu'Ali soit prévenu. */
(function(){
  var URL="https://phqfpqzrpdfvpewkvqdh.supabase.co/rest/v1/alex_errors",KEY="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA",sent=0,seen={};
  function report(kind,msg,detail){
    try{
      if(location.protocol==="file:")return;
      msg=String(msg||"erreur").slice(0,480);var k=kind+msg;
      if(sent>=5||seen[k])return;seen[k]=1;sent++;
      fetch(URL,{method:"POST",keepalive:true,headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({kind:kind,message:msg,page:location.pathname,detail:String(detail||"").slice(0,1900),ua:navigator.userAgent.slice(0,200)})}).catch(function(){});
    }catch(e){}
  }
  window.alexReport=report;
  window.addEventListener("error",function(e){
    if(e.target&&e.target!==window&&(e.target.src||e.target.href)){var fu=e.target.src||e.target.href;if(location.protocol==="file:"||document.visibilityState==="hidden")return;fetch(fu,{method:"HEAD",cache:"no-store"}).then(function(r){if(r.status===404||r.status===410)report("ressource","Fichier introuvable : "+fu)}).catch(function(){});return}
    report("js",e.message,(e.filename||"")+":"+(e.lineno||"")+":"+(e.colno||""));
  },true);
  window.addEventListener("unhandledrejection",function(e){
    var r=e.reason;report("promesse",(r&&r.message)||r,(r&&r.stack)||"");
  });
})();

/* Mesure d'audience (sans cookie, sans IP) + suivi des étapes (paiement, inscription, achat) + pixels publicitaires UNIQUEMENT après accord (bandeau RGPD). */
(function(){
  var SBR="https://phqfpqzrpdfvpewkvqdh.supabase.co/rest/v1/",KEY="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA",LP=location.pathname;
  var ADM=/^\/admin/.test(LP),DNT=navigator.doNotTrack==="1"||!!navigator.globalPrivacyControl,OFF=DNT||location.hostname==="localhost"||location.protocol==="file:";
  var PAYMAP={"6oUdR2bdgb7nbaR6D76EU00": "m11", "bJe14g0yCejz1AhgdH6EU01": "m01", "3cI14g6X06R72ElbXr6EU0j": "m15", "fZuaEQdlo1wN2El5z36EU02": "m03", "4gMaEQ6X04IZbaR3qV6EU03": "m07", "cNiaEQchk4IZ92JbXr6EU04": "m02", "eVq6oAdloejzfr74uZ6EU05": "m12", "aFaeV6chkejz4MtaTn6EU06": "m06", "9B6eV66X0cbr4Mt4uZ6EU07": "m04", "28E3cogxAcbren3d1v6EU08": "m08", "4gM5kw2GKgrHen31iN6EU09": "m13", "00w5kw4OSdfvceVd1v6EU0a": "m14", "cNi00c0yC2AR92J7Hb6EU0b": "m05", "5kQeV60yC4IZen38Lf6EU0c": "m09", "aFacMY0yC7Vbfr74uZ6EU0d": "m10", "9B6cMY4OSdfven36D76EU0e": "guide-andorre", "14A9AM3KOejz7YF1iN6EU0f": "guide-mentorat", "fZufZaeps1wN4Mt0eJ6EU0g": "guide-suisse", "fZubIU6X0grHdiZ2mR6EU0h": "pack", "9B66oAchk7Vb2El8Lf6EU0i": "vip"};
  window.alexPayId=function(link){return PAYMAP[String(link||"").split("?")[0].split("/").pop()]||""};
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
  function tok(){try{var k=Object.keys(localStorage).filter(function(x){return /^sb-.*-auth-token$/.test(x)})[0];var j=k&&JSON.parse(localStorage.getItem(k));return j&&j.access_token&&j.user?j:null}catch(e){return null}}
  var w=innerWidth,dev=w<700?"mobile":(w<1100?"tablette":"ordinateur"),q=new URLSearchParams(location.search);
  var src=q.get("utm_source")||"",camp=q.get("utm_campaign")||"";
  if(!src&&document.referrer){try{var h=new URL(document.referrer).hostname.replace(/^www\./,"");if(h!==location.hostname)src=h}catch(e){}}
  if(src)ss("alex_src",src);else src=ss("alex_src")||"";if(camp)ss("alex_camp",camp);else camp=ss("alex_camp")||"";
  var sid=ss("alex_sid");if(!sid){sid=(window.crypto&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,36);ss("alex_sid",sid)}
  var page=(LP.replace(/\.html$/,"")||"/").slice(0,190);
  function send(type,cible,valeur,avecCompte){
    if(OFF||ADM)return;try{var s=avecCompte?tok():null;
    fetch(SBR+"alex_events",{method:"POST",keepalive:true,headers:{apikey:KEY,Authorization:"Bearer "+(s?s.access_token:KEY),"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify({type:type,page:page,cible:cible?String(cible).slice(0,190):null,source:src?src.slice(0,90):null,appareil:dev,session:sid,campagne:camp?camp.slice(0,90):null,valeur:valeur==null?null:Math.max(0,Math.min(100,Math.round(valeur))),user_id:s?s.user.id:null})}).catch(function(){})}catch(e){}}
  window.alexTrack=send;
  send("vue");
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a.btn,button.btn,[data-open],a[href*='ventes/'],a[href*='#reserver-'],#dsend");
    if(!a)return;var c=a.getAttribute("data-title")||(a.textContent||"").trim().replace(/\s+/g," ")||a.getAttribute("href");send("clic",c)},true);
  /* profondeur de lecture (en %), envoyée une fois quand on quitte la page */
  var maxS=0,fini=0;function sc(){var H=document.documentElement.scrollHeight-innerHeight;var p=H>0?scrollY/H*100:100;if(p>maxS)maxS=p}
  addEventListener("scroll",sc,{passive:true});function fin(){if(fini)return;fini=1;sc();send("defilement",null,maxS)}
  addEventListener("pagehide",fin);document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")fin()});
  /* inscription (e-mail ou Google) : détectée une seule fois, compte créé il y a moins d'1 h ; connexion : une fois par session */
  window.alexAuthCheck=function(){var s=tok();if(!s)return;var u=s.user,k="alex_ins_"+u.id;
    if(!localStorage.getItem(k)){localStorage.setItem(k,"1");if(u.created_at&&Date.now()-new Date(u.created_at).getTime()<3600*1000){send("inscription",null,null,true);px("CompleteRegistration")}}
    if(!ss("alex_cx")){ss("alex_cx","1");send("connexion",null,null,true)}};

  /* ---------- Pixels (Meta, TikTok, Google Analytics, Microsoft Clarity) : chargés seulement après « Accepter » ---------- */
  var CFG={},PXON=false,RX=/^[A-Za-z0-9_-]{4,40}$/;
  function consent(){try{var c=JSON.parse(localStorage.getItem("alex_consent")||"null");return c&&Date.now()-c.t<180*864e5?c.v:null}catch(e){return null}}
  function px(ev,data){if(!PXON){if(ev!=="ViewContent")try{var pd=JSON.parse(sessionStorage.getItem("alex_px_pend")||"[]");pd.push([ev,data||{}]);sessionStorage.setItem("alex_px_pend",JSON.stringify(pd.slice(-5)))}catch(e){}return}
    try{data=data||{};
    var fb={ViewContent:"ViewContent",InitiateCheckout:"InitiateCheckout",CompleteRegistration:"CompleteRegistration",Purchase:"Purchase"}[ev];
    var tt={ViewContent:"ViewContent",InitiateCheckout:"InitiateCheckout",CompleteRegistration:"CompleteRegistration",Purchase:"CompletePayment"}[ev];
    var ga={ViewContent:"view_item",InitiateCheckout:"begin_checkout",CompleteRegistration:"sign_up",Purchase:"purchase"}[ev];
    var d={content_type:"product"};if(data.id)d.content_ids=[data.id];if(data.value!=null){d.value=data.value;d.currency="EUR"}
    if(window.fbq&&CFG.meta_pixel)fbq("track",fb,d);
    if(window.ttq&&CFG.tiktok_pixel)ttq.track(tt,d);
    if(window.gtag&&CFG.ga4){var g={currency:"EUR"};if(data.value!=null)g.value=data.value;if(data.id)g.items=[{item_id:data.id}];gtag("event",ga,g)}}catch(e){}}
  window.alexPixel=px;window.alexPixelsActifs=function(){return PXON};
  function charger(){if(PXON||ADM)return;PXON=true;var id;
    if(RX.test(id=CFG.meta_pixel||"")){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/fr_FR/fbevents.js");fbq("init",id);fbq("track","PageView")}
    if(RX.test(id=CFG.tiktok_pixel||"")){!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=d.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)}}(window,document,"ttq");ttq.load(id);ttq.page()}
    if(RX.test(id=CFG.ga4||"")){var gs=document.createElement("script");gs.async=1;gs.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);document.head.appendChild(gs);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",id)}
    if(RX.test(id=CFG.clarity||"")){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",id)}
    if(/^\/ventes\//.test(LP))px("ViewContent",{id:page.split("/").pop()});
    try{var pend=JSON.parse(sessionStorage.getItem("alex_px_pend")||"[]");sessionStorage.removeItem("alex_px_pend");pend.forEach(function(x){px(x[0],x[1])})}catch(e){}}
  function choisir(v){localStorage.setItem("alex_consent",JSON.stringify({v:v,t:Date.now()}));send("consentement",v==="oui"?"accepte":"refuse");var b=document.getElementById("alexCookies");if(b)b.remove();if(v==="oui")charger();else{try{sessionStorage.removeItem("alex_px_pend")}catch(e){}if(PXON)location.reload()}}
  function bandeau(){if(document.getElementById("alexCookies"))return;var b=document.createElement("div");b.id="alexCookies";b.setAttribute("role","dialog");b.setAttribute("aria-label","Cookies");
    b.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;display:flex;justify-content:center;pointer-events:none";
    b.innerHTML='<div style="pointer-events:auto;max-width:720px;width:100%;background:#0d1230;color:#f2f4ff;border:1px solid rgba(124,92,255,.55);border-radius:18px;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.55);font:14px/1.5 system-ui;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:230px"><b style="display:block;font-size:15px;margin-bottom:2px">Cookies de mesure</b>Avec ton accord, on utilise des cookies (Meta, TikTok, Google, Microsoft) pour savoir quelles publicités t’amènent ici et améliorer le site. Rien n’est activé si tu refuses. <a href="/confidentialite" style="color:#22d3ee">En savoir plus</a></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-c="non" style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:11px;padding:10px 18px;font:700 14px system-ui;cursor:pointer">Refuser</button><button type="button" data-c="oui" style="background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#fff;border:0;border-radius:11px;padding:10px 18px;font:700 14px system-ui;cursor:pointer">Accepter</button></div></div>';
    b.addEventListener("click",function(e){var c=e.target.getAttribute&&e.target.getAttribute("data-c");if(c)choisir(c)});document.body.appendChild(b)}
  window.alexCookies=function(){bandeau()};
  function lien(){document.querySelectorAll('a[href*="confidentialite"]').forEach(function(a){if(a.dataset.ck||a.closest("#alexCookies"))return;a.dataset.ck=1;var x=document.createElement("a");x.href="#";x.textContent="Gérer les cookies";x.className=a.className;x.setAttribute("style",a.getAttribute("style")||"");x.style.marginLeft="14px";x.onclick=function(e){e.preventDefault();bandeau()};a.parentNode.insertBefore(x,a.nextSibling)})}
  window.alexAuthCheck();
  if(OFF||ADM)return;
  function go(c){CFG=c||{};var any=["meta_pixel","tiktok_pixel","ga4","clarity"].some(function(k){return RX.test(CFG[k]||"")});if(!any)return;
    var run=function(){lien();var v=consent();if(v==="oui")charger();else if(!v)bandeau()};if(document.body)run();else addEventListener("DOMContentLoaded",run)}
  try{var cc=JSON.parse(ss("alex_cfg")||"null");if(cc&&Date.now()-cc.t<600000){go(cc.d);return}}catch(e){}
  fetch(SBR+"alex_config?select=cle,valeur",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}}).then(function(r){return r.json()}).then(function(j){var d={};(j||[]).forEach(function(x){d[x.cle]=x.valeur});ss("alex_cfg",JSON.stringify({t:Date.now(),d:d}));go(d)}).catch(function(){});
})();

/* Paiement et offres liés au COMPTE : il faut être connecté pour payer ; offres de bienvenue (-10 %) et personnelle (-25 %, 30 min) réelles. */
(function(){
  var SB="https://phqfpqzrpdfvpewkvqdh.supabase.co",KEY="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA",FN=SB+"/functions/v1/offre-flash",P=location.pathname;
  function tok(){try{var k=Object.keys(localStorage).filter(function(x){return /^sb-.*-auth-token$/.test(x)})[0];var j=k&&JSON.parse(localStorage.getItem(k));return j&&j.access_token&&j.user?j:null}catch(e){return null}}
  function offre(){try{var o=JSON.parse(localStorage.getItem("alex_offre")||"null");return o&&new Date(o.expires_at)>new Date()?o:null}catch(e){return null}}
  function finalUrl(link){var s=tok();if(!s)return link;var u=link+(link.indexOf("?")>-1?"&":"?")+"prefilled_email="+encodeURIComponent(s.user.email)+"&client_reference_id="+encodeURIComponent(s.user.id),o=offre();if(o)u+="&prefilled_promo_code="+encodeURIComponent(o.code);return u}
  function get(type,decl){var s=tok();if(!s)return Promise.resolve(null);
    return fetch(FN,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token,apikey:KEY},body:JSON.stringify({type:type,declencheur:decl})}).then(function(r){return r.json()}).then(function(j){if(j&&j.code){localStorage.setItem("alex_offre",JSON.stringify(j));bandeau();return j}return null}).catch(function(){return null})}
  var tm;
  function bandeau(){
    var old=document.getElementById("alexOffre");if(old)old.remove();clearInterval(tm);var o=offre();if(!o||localStorage.getItem("alex_offre_ferme")===o.code)return;
    var b=document.createElement("div");b.id="alexOffre";b.setAttribute("role","status");
    b.style.cssText="position:fixed;left:0;right:0;bottom:64px;z-index:99998;display:flex;justify-content:center;pointer-events:none";
    var i=document.createElement("div");i.style.cssText="pointer-events:auto;background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#fff;font:700 14px system-ui;padding:10px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.4);margin:0 10px;text-align:center";
    var xb=document.createElement("button");xb.type="button";xb.setAttribute("aria-label","Fermer le bandeau");xb.textContent="×";xb.style.cssText="background:rgba(0,0,0,.25);border:0;color:#fff;border-radius:50%;width:24px;height:24px;margin-left:12px;cursor:pointer;font:700 15px/22px system-ui";xb.onclick=function(){localStorage.setItem("alex_offre_ferme",o.code);b.remove();clearInterval(tm)};var tx=document.createElement("span");i.appendChild(tx);i.appendChild(xb);b.appendChild(i);document.body.appendChild(b);
    function maj(){var r=Math.max(0,Math.floor((new Date(o.expires_at)-Date.now())/1000));if(r<=0){localStorage.removeItem("alex_offre");bandeau();return}
      var h=Math.floor(r/3600),m=Math.floor(r%3600/60),s=r%60,tt=(h?h+" h ":"")+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
      tx.textContent=(o.type==="bienvenue"?"Bienvenue : -":"Content de te revoir ! Cadeau de retour : -")+o.pourcentage+" % appliqué à ton paiement · il te reste "+tt}
    maj();tm=setInterval(maj,1000)}
  function popup(titre,texte,bouton,action){
    if(document.getElementById("alexPop"))return;
    var w=document.createElement("div");w.id="alexPop";w.setAttribute("role","dialog");w.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(3,5,16,.75);display:grid;place-items:center;padding:16px";
    var c=document.createElement("div");c.style.cssText="max-width:420px;width:100%;background:#0d1230;color:#f2f4ff;border:1px solid rgba(124,92,255,.5);border-radius:20px;padding:26px;text-align:center;font:16px/1.5 system-ui;box-shadow:0 30px 80px rgba(124,92,255,.35)";
    var h=document.createElement("div");h.style.cssText="font:800 1.5rem system-ui;margin-bottom:8px";h.textContent=titre;
    var p=document.createElement("p");p.style.cssText="color:#c9cfee;margin:0 0 18px";p.textContent=texte;
    var bt=document.createElement("button");bt.style.cssText="background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#fff;border:0;border-radius:12px;padding:13px 22px;font:800 1rem system-ui;cursor:pointer;width:100%";bt.textContent=bouton;
    var x=document.createElement("button");x.textContent="Non merci";x.style.cssText="background:none;border:0;color:#aab1d8;margin-top:12px;cursor:pointer;font:14px system-ui";
    function fermer(){w.remove()}bt.onclick=function(){fermer();action()};x.onclick=fermer;
    c.appendChild(h);c.appendChild(p);c.appendChild(bt);c.appendChild(x);w.appendChild(c);document.body.appendChild(w)}
  window.alexOffre={get:get,bandeau:bandeau,url:finalUrl,actif:offre};

  var ESPACE=/^\/(espace|admin)/.test(P);
  /* 1) Porte : pour payer il faut un compte connecté (e-mail pré-rempli, achat rattaché au compte, code appliqué) */
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest('a[href^="https://buy.stripe.com/"]');if(!a||ESPACE)return;
    e.preventDefault();var link=a.getAttribute("href");localStorage.setItem("alex_pay_click",String(Date.now()));var pid=window.alexPayId?alexPayId(link):"";if(window.alexTrack)alexTrack("paiement",pid,null,true);if(window.alexPixel)alexPixel("InitiateCheckout",{id:pid});
    if(link==="https://buy.stripe.com/fZubIU6X0grHdiZ2mR6EU0h"){var sp=tok();if(!sp){localStorage.setItem("alex_next_vip","pack");location.href="/espace?inscription=1";return}fetch(SB+"/functions/v1/paiement-vip",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+sp.access_token,apikey:KEY},body:JSON.stringify({action:"checkout",module:"pack"})}).then(function(r){return r.json()}).then(function(j){location.href=(j&&j.url)?j.url:finalUrl(link)}).catch(function(){location.href=finalUrl(link)});return}
    if(!tok()){localStorage.setItem("alex_next",link);location.href="/espace?inscription=1";return}
    var fu=finalUrl(link);if(window.alexPixelsActifs&&alexPixelsActifs())setTimeout(function(){location.href=fu},350);else location.href=fu},true);
  if(ESPACE||/^\/(cgv|mentions-legales|confidentialite)/.test(P)||location.protocol==="file:")return;
  bandeau();
  if(tok()){localStorage.setItem("alex_connu","1")}
  else if(localStorage.getItem("alex_connu")&&!recentK("alex_revenir",24*3600*1000)){
    localStorage.setItem("alex_revenir",String(Date.now()));
    var rb=document.createElement("div");rb.setAttribute("role","status");rb.style.cssText="position:fixed;left:0;right:0;bottom:64px;z-index:99998;display:flex;justify-content:center;pointer-events:none";
    var ri=document.createElement("div");ri.style.cssText="pointer-events:auto;background:#0d1230;color:#fff;border:1px solid rgba(124,92,255,.6);font:600 14px system-ui;padding:10px 16px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.4);margin:0 10px;text-align:center";
    var ra=document.createElement("a");ra.href="/espace";ra.textContent="Me connecter";ra.style.cssText="color:#22d3ee;margin-left:10px;font-weight:800";
    var rx=document.createElement("button");rx.type="button";rx.setAttribute("aria-label","Fermer");rx.textContent="×";rx.style.cssText="background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:50%;width:24px;height:24px;margin-left:12px;cursor:pointer";rx.onclick=function(){rb.remove()};
    var rt=document.createElement("span");rt.textContent="Content de te revoir ! Connecte-toi : une offre de retour peut t’attendre.";
    ri.appendChild(rt);ri.appendChild(ra);ri.appendChild(rx);rb.appendChild(ri);document.body.appendChild(rb)}
  /* 2) Comptage des produits regardés */
  if(/^\/ventes\//.test(P)){try{var v=JSON.parse(localStorage.getItem("alex_vues")||"[]");if(v.indexOf(P)<0){v.push(P);localStorage.setItem("alex_vues",JSON.stringify(v.slice(-20)))}}catch(e){}}
  function recentK(k,ms){return Date.now()-Number(localStorage.getItem(k)||0)<ms}
  function recent(k,ms){return Date.now()-Number(localStorage.getItem(k)||0)<ms}
  var t0=Date.now();
  /* 3) Réactions selon le comportement */
  function proposerConnecte(decl){
    if(offre()||recent("alex_pop_flash",3600*1000))return;
    get("flash",decl).then(function(o){if(!o)return;localStorage.setItem("alex_pop_flash",String(Date.now()));
      popup("-"+o.pourcentage+" % rien que pour toi","Offre personnelle valable 4 heures, appliquée automatiquement à ton paiement. Passé ce délai, le prix normal s’applique.","Profiter de -"+o.pourcentage+" %",function(){var l=document.querySelector('a[href^="https://buy.stripe.com/"]');if(l)l.scrollIntoView({behavior:"smooth",block:"center"})})})}
  function proposerInvite(){
    if(recent("alex_pop_invite",7*86400000))return;localStorage.setItem("alex_pop_invite",String(Date.now()));
    popup("Avant de partir : -10 %","Crée ton compte gratuit et reçois -10 % sur ta première commande (valable 24 h).","Créer mon compte",function(){location.href="/espace?inscription=1"})}
  var vues=0;try{vues=JSON.parse(localStorage.getItem("alex_vues")||"[]").length}catch(e){}
  var aCliquePaiement=recent("alex_pay_click",24*3600*1000);
  document.addEventListener("mouseout",function(e){
    if(e.clientY>0||e.relatedTarget||Date.now()-t0<8000||sessionStorage.getItem("alex_sortie"))return;sessionStorage.setItem("alex_sortie","1");
    if(tok()){if(aCliquePaiement||vues>=2)proposerConnecte("sortie")}else{proposerInvite()}});
  /* retour : si l'offre de bienvenue a expiré sans achat, le serveur accorde -25 % pendant 4 h (une fois tous les 7 jours) */
  if(tok()&&!offre()&&!recent("alex_achat",24*3600*1000)&&!recent("alex_verif_retour",3600*1000)){localStorage.setItem("alex_verif_retour",String(Date.now()));
    get("flash","retour").then(function(o){if(o&&o.type==="flash"&&!recent("alex_pop_flash",3600*1000)){localStorage.setItem("alex_pop_flash",String(Date.now()));
      popup("Content de te revoir ! On t’offre -"+o.pourcentage+" %","Cadeau de retour valable 4 heures, appliquée automatiquement à ton paiement. Passé ce délai, le prix normal s’applique.","Voir les compétences",function(){if(!/^\/ventes\//.test(P))location.href="/#catalogue"})}})}
  /* retour après un clic sur « Payer » sans achat */
  if(tok()&&aCliquePaiement&&!recent("alex_achat",24*3600*1000)){setTimeout(function(){proposerConnecte("retour")},4000)}
  /* visiteur non connecté qui regarde 3 produits : on lui propose le compte + -10 % */
  if(!tok()&&vues>=3){setTimeout(proposerInvite,15000)}
})();

/* === Protections de base (ajout 21/11) : vidéos non téléchargeables, anti-iframe, anti-copie des médias === */
(function(){
 try{ if(window.top!==window.self){ window.top.location=window.self.location; } }catch(e){ document.documentElement.style.display="none"; }
 function proteger(v){
  if(v.__alexP) return; v.__alexP=1;
  v.setAttribute("controlsList","nodownload noremoteplayback noplaybackrate".replace(" noplaybackrate",""));
  v.setAttribute("disablePictureInPicture","");
  v.setAttribute("disableRemotePlayback","");
  v.addEventListener("contextmenu",function(e){e.preventDefault();});
 }
 function tout(){ var l=document.querySelectorAll("video"); for(var i=0;i<l.length;i++) proteger(l[i]); }
 tout();
 new MutationObserver(tout).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener("contextmenu",function(e){ var t=e.target; if(t&&(t.tagName==="VIDEO"||t.tagName==="IMG"||(t.closest&&t.closest(".pl")))) e.preventDefault(); });
 document.addEventListener("dragstart",function(e){ var t=e.target; if(t&&(t.tagName==="IMG"||t.tagName==="VIDEO")) e.preventDefault(); });
})();
