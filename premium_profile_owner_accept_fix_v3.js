/* LEOGO PREMIUM OWNER ACCEPTANCE — authoritative frontend bridge v3 */
(function(){
  'use strict';
  if(window.__leogoOwnerAcceptFixV3Installed)return;
  window.__leogoOwnerAcceptFixV3Installed=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);

  async function status(){
    const q=await sb.rpc('premium_profile_owner_acceptance_status');
    if(q.error)throw q.error;
    return q.data?.[0]||null;
  }
  async function refresh(){
    if(typeof window.__leogoOwnerRefresh==='function')return window.__leogoOwnerRefresh();
    $('refresh')?.click();
  }
  async function accept(type,id,button){
    if(button)button.disabled=true;
    try{
      const session=(await sb.auth.getSession()).data?.session;
      if(!session)throw new Error('Please log in again.');
      let q=await sb.rpc('premium_profile_owner_respond',{p_request_id:id,p_type:type,p_decision:'accepted'});
      if(q.error){
        const s=await status();
        if(s && Number(s.accepted_today||0)===0){
          q=await sb.rpc('premium_profile_owner_respond',{p_request_id:id,p_type:type,p_decision:'accepted'});
        }
      }
      if(q.error){
        const s=await status().catch(()=>null);
        if(s && Number(s.accepted_today||0)===0){
          alert('The first acceptance is FREE, but the server did not complete the acceptance. No payment is required. Please refresh and try ACCEPT again.');
        }else{
          alert(q.error.message||'Unable to accept this request.');
        }
        return;
      }
      alert(type==='booking'?'Booking accepted successfully.':'Interest accepted successfully.');
      await refresh();
    }catch(e){alert(e?.message||'Unable to accept this request.');}
    finally{if(button)button.disabled=false;}
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-action="accept"]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    accept(b.dataset.type,b.dataset.id,b);
  },true);
})();
