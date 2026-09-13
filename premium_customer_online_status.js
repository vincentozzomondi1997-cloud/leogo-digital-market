/* LEOGO PREMIUM CUSTOMER — owner online/offline indicator for profile view. */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerOnlineStatus)return;
  window.__leogoPremiumCustomerOnlineStatus=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let currentProfileId=null;

  function addStyles(){
    if(document.getElementById('lposStyles'))return;
    const s=document.createElement('style');s.id='lposStyles';
    s.textContent='.lpos-online{display:inline-flex;align-items:center;gap:6px;width:max-content;padding:5px 9px;border-radius:999px;background:#ecfdf3;color:#166534;font-size:11px;font-weight:900}.lpos-offline{display:inline-flex;align-items:center;gap:6px;width:max-content;padding:5px 9px;border-radius:999px;background:#f2f4f7;color:#667085;font-size:11px;font-weight:900}.lpos-dot{width:8px;height:8px;border-radius:50%;background:#16a34a}.lpos-offdot{width:8px;height:8px;border-radius:50%;background:#98a2b3}';
    document.head.appendChild(s);
  }

  async function decoratePresence(){
    if(!currentProfileId)return;
    const modal=document.getElementById('lpvModal');
    if(!modal)return;
    const old=modal.querySelector('[data-lpos-presence]');
    if(old)old.remove();
    const q=await sb.rpc('get_premium_profile_presence',{p_profile_id:currentProfileId});
    if(q.error)return;
    const row=q.data?.[0];
    const online=!!row?.is_online;
    const badge=document.createElement('span');
    badge.setAttribute('data-lpos-presence','1');
    badge.className=online?'lpos-online':'lpos-offline';
    badge.innerHTML=online?'<span class="lpos-dot"></span> ONLINE NOW':'<span class="lpos-offdot"></span> OFFLINE';
    const meta=modal.querySelector('.lpv-meta');
    if(meta)meta.insertBefore(badge,meta.firstChild.nextSibling||meta.firstChild);
  }

  function hook(){
    addStyles();
    const api=window.LEOGOPremiumProfileView;
    if(!api||typeof api.open!=='function'||api.open.__lposWrapped)return false;
    const original=api.open;
    const wrapped=async function(profileId){
      currentProfileId=profileId;
      const result=await original(profileId);
      setTimeout(decoratePresence,120);
      return result;
    };
    wrapped.__lposWrapped=true;
    api.open=wrapped;
    return true;
  }

  const obs=new MutationObserver(()=>{
    if(!hook())return;
    if(document.getElementById('lpvModal'))setTimeout(decoratePresence,100);
  });
  function start(){hook();obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
