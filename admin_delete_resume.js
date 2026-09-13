/* Resume the existing selected-delete flow after the Admin login completes. */
(function(){
'use strict';
const sb=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX');
function resume(){let p=null;try{p=JSON.parse(sessionStorage.getItem('leogo_pending_delete')||'null')}catch(e){}if(!p||p.action!=='delete_disposable')return;if(p.created_at&&Date.now()-Number(p.created_at)>600000){sessionStorage.removeItem('leogo_pending_delete');return}window.location.reload()}
function init(){sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(resume,500)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
