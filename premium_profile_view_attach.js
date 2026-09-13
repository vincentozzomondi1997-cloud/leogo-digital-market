/* LEOGO PREMIUM — safely attaches VIEW PROFILE to the existing Premium member cards. */
(function(){
  'use strict';
  if(window.__leogoPremiumProfileAttachInstalled)return;
  window.__leogoPremiumProfileAttachInstalled=true;
  function attach(){
    const modal=Array.from(document.querySelectorAll('div')).find(el=>{
      const t=(el.textContent||'').trim();
      return t.includes('Find Premium Members') && t.includes('EXPRESS INTEREST') && t.includes('REQUEST BOOKING');
    });
    if(!modal)return;
    const open=()=>window.LEOGOPremiumProfileView&&window.LEOGOPremiumProfileView.open;
    if(!open())return;
    const map=window.__leogoPremiumProfileIdMap||{};
    Object.keys(map).forEach(name=>{
      Array.from(modal.querySelectorAll('*')).filter(el=>el.children.length===0&&el.textContent.trim()===name).forEach(label=>{
        let card=label.parentElement;
        for(let i=0;i<10&&card;i++,card=card.parentElement){
          const buttons=Array.from(card.querySelectorAll('button'));
          if(buttons.some(b=>(b.textContent||'').includes('EXPRESS INTEREST'))&&buttons.some(b=>(b.textContent||'').includes('REQUEST BOOKING'))){
            if(card.querySelector('.leogo-view-profile-btn'))return;
            const profileId=map[name];
            if(!profileId)return;
            const b=document.createElement('button');
            b.type='button';
            b.className='lpv-view leogo-view-profile-btn';
            b.textContent='👤 VIEW PROFILE';
            b.style.cssText='border:0;background:#07152f;color:#fff;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer;margin:8px 0 0 0;display:block;width:100%';
            b.onclick=()=>open()(profileId);
            card.appendChild(b);
            return;
          }
        }
      });
    });
  }
  async function buildMap(){
    try{
      if(!window.supabase)return;
      const sb=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX');
      // Use the same customer-safe RPC as the Premium discovery catalogue.
      // The profile-view RPC performs the real active-Premium authorization check.
      const q=await sb.rpc('get_premium_profiles_public');
      if(q.error||!Array.isArray(q.data)){
        console.warn('LEOGO Premium View Profile map unavailable:',q.error?.message||'No data');
        return;
      }
      window.__leogoPremiumProfileIdMap={};
      q.data.forEach(p=>{if(p.username&&p.id)window.__leogoPremiumProfileIdMap[p.username]=p.id});
      attach();
    }catch(e){
      console.warn('LEOGO Premium View Profile attachment error:',e);
    }
  }
  const obs=new MutationObserver(()=>{
    clearTimeout(window.__lpvAttachTimer);
    window.__lpvAttachTimer=setTimeout(attach,100);
  });
  function start(){
    obs.observe(document.body,{childList:true,subtree:true});
    buildMap();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
