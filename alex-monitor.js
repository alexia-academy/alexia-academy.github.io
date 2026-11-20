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
