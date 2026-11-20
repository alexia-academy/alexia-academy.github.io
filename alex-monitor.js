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

/* Paiement : si le visiteur est connecté, son e-mail est pré-rempli chez Stripe (l'achat est alors rattaché au bon compte). */
document.addEventListener("click",function(e){
  try{
    var a=e.target.closest&&e.target.closest('a[href^="https://buy.stripe.com/"]');
    if(!a||a.href.indexOf("prefilled_email")>-1)return;
    var k=Object.keys(localStorage).filter(function(x){return /^sb-.*-auth-token$/.test(x)})[0];
    var em=k&&JSON.parse(localStorage.getItem(k)).user.email;
    if(em)a.href+=(a.href.indexOf("?")>-1?"&":"?")+"prefilled_email="+encodeURIComponent(em);
  }catch(x){}
},true);
