/* Surveillance du site : toute erreur est enregistrée dans Supabase (table alex_errors) pour qu'Ali soit prévenu. */
(function(){
  var URL="https://phqfpqzrpdfvpewkvqdh.supabase.co/rest/v1/alex_errors",KEY="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA",sent=0,seen={};
  function report(kind,msg,detail){
    try{
      msg=String(msg||"erreur").slice(0,480);var k=kind+msg;
      if(sent>=5||seen[k])return;seen[k]=1;sent++;
      fetch(URL,{method:"POST",keepalive:true,headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({kind:kind,message:msg,page:location.pathname,detail:String(detail||"").slice(0,1900),ua:navigator.userAgent.slice(0,200)})}).catch(function(){});
    }catch(e){}
  }
  window.alexReport=report;
  window.addEventListener("error",function(e){
    if(e.target&&e.target!==window&&(e.target.src||e.target.href)){report("ressource","Fichier introuvable : "+(e.target.src||e.target.href));return}
    report("js",e.message,(e.filename||"")+":"+(e.lineno||"")+":"+(e.colno||""));
  },true);
  window.addEventListener("unhandledrejection",function(e){
    var r=e.reason;report("promesse",(r&&r.message)||r,(r&&r.stack)||"");
  });
})();

/* Mesure d'audience anonyme : aucun cookie, aucune adresse IP, aucune donnée personnelle. Respecte "Ne pas me suivre". */
(function(){
  try{
    if(navigator.doNotTrack==="1"||navigator.globalPrivacyControl||/^\/admin/.test(location.pathname)||location.hostname==="localhost"||location.protocol==="file:")return;
    var URL="https://phqfpqzrpdfvpewkvqdh.supabase.co/rest/v1/alex_events",KEY="sb_publishable_W-z46a0Mhkojf2X8YkTJ8A_QJNKWmHA";
    var w=innerWidth,dev=w<700?"mobile":(w<1100?"tablette":"ordinateur");
    var q=new URLSearchParams(location.search),src=q.get("utm_source")||"";
    if(!src&&document.referrer){try{var h=new URL_(document.referrer).hostname.replace(/^www\./,"");if(h!==location.hostname)src=h}catch(e){}}
    function URL_(u){return new window.URL(u)}
    function send(type,cible){
      fetch(URL,{method:"POST",keepalive:true,headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({type:type,page:(location.pathname.replace(/\.html$/,"")||"/").slice(0,190),cible:cible?String(cible).slice(0,190):null,source:src?src.slice(0,90):null,appareil:dev})}).catch(function(){});
    }
    send("vue");
    document.addEventListener("click",function(e){
      var a=e.target.closest&&e.target.closest("a.btn,button.btn,[data-open],a[href*='ventes/'],a[href*='#reserver-'],#dsend");
      if(!a)return;
      var c=a.getAttribute("data-title")||(a.textContent||"").trim().replace(/\s+/g," ")||a.getAttribute("href");
      send("clic",c);
    },true);
  }catch(e){}
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
    var old=document.getElementById("alexOffre");if(old)old.remove();clearInterval(tm);var o=offre();if(!o)return;
    var b=document.createElement("div");b.id="alexOffre";b.setAttribute("role","status");
    b.style.cssText="position:fixed;left:0;right:0;bottom:64px;z-index:99998;display:flex;justify-content:center;pointer-events:none";
    var i=document.createElement("div");i.style.cssText="pointer-events:auto;background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#fff;font:700 14px system-ui;padding:10px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.4);margin:0 10px;text-align:center";
    b.appendChild(i);document.body.appendChild(b);
    function maj(){var r=Math.max(0,Math.floor((new Date(o.expires_at)-Date.now())/1000));if(r<=0){localStorage.removeItem("alex_offre");bandeau();return}
      var h=Math.floor(r/3600),m=Math.floor(r%3600/60),s=r%60,tt=(h?h+" h ":"")+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
      i.textContent="-"+o.pourcentage+" % appliqué à ton paiement · il te reste "+tt}
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
    e.preventDefault();var link=a.getAttribute("href");localStorage.setItem("alex_pay_click",String(Date.now()));
    if(!tok()){localStorage.setItem("alex_next",link);location.href="/espace?inscription=1";return}
    location.href=finalUrl(link)},true);
  if(ESPACE||/^\/(cgv|mentions-legales|confidentialite)/.test(P)||location.protocol==="file:")return;
  bandeau();
  /* 2) Comptage des produits regardés */
  if(/^\/ventes\//.test(P)){try{var v=JSON.parse(localStorage.getItem("alex_vues")||"[]");if(v.indexOf(P)<0){v.push(P);localStorage.setItem("alex_vues",JSON.stringify(v.slice(-20)))}}catch(e){}}
  function recent(k,ms){return Date.now()-Number(localStorage.getItem(k)||0)<ms}
  var t0=Date.now();
  /* 3) Réactions selon le comportement */
  function proposerConnecte(decl){
    if(offre()||recent("alex_pop_flash",3600*1000))return;
    get("flash",decl).then(function(o){if(!o)return;localStorage.setItem("alex_pop_flash",String(Date.now()));
      popup("-"+o.pourcentage+" % rien que pour toi","Offre personnelle valable 30 minutes, appliquée automatiquement à ton paiement.","Profiter de -"+o.pourcentage+" %",function(){var l=document.querySelector('a[href^="https://buy.stripe.com/"]');if(l)l.scrollIntoView({behavior:"smooth",block:"center"})})})}
  function proposerInvite(){
    if(recent("alex_pop_invite",7*86400000))return;localStorage.setItem("alex_pop_invite",String(Date.now()));
    popup("Avant de partir : -10 %","Crée ton compte gratuit et reçois -10 % sur ta première commande (valable 48 h).","Créer mon compte",function(){location.href="/espace?inscription=1"})}
  var vues=0;try{vues=JSON.parse(localStorage.getItem("alex_vues")||"[]").length}catch(e){}
  var aCliquePaiement=recent("alex_pay_click",24*3600*1000);
  document.addEventListener("mouseout",function(e){
    if(e.clientY>0||e.relatedTarget||Date.now()-t0<8000||sessionStorage.getItem("alex_sortie"))return;sessionStorage.setItem("alex_sortie","1");
    if(tok()){if(aCliquePaiement||vues>=2)proposerConnecte("sortie")}else{proposerInvite()}});
  /* retour après un clic sur « Payer » sans achat */
  if(tok()&&aCliquePaiement&&!recent("alex_achat",24*3600*1000)){setTimeout(function(){proposerConnecte("retour")},4000)}
  /* visiteur non connecté qui regarde 3 produits : on lui propose le compte + -10 % */
  if(!tok()&&vues>=3){setTimeout(proposerInvite,15000)}
})();
