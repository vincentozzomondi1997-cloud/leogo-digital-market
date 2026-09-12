/* LEOGO PREMIUM PROFILE WORKFLOW — isolated integration bridge.
   Keeps registration/dashboard modules separate while exposing one safe workflow API.
*/
(function(){
  'use strict';
  if(window.__leogoPremiumWorkflowInstalled)return;
  window.__leogoPremiumWorkflowInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  async function session(){return (await sb.auth.getSession()).data?.session||null}
  async function approvedOwner(){
    const s=await session();
    if(!s)return null;
    const q=await sb.from('premium_profiles').select('*').eq('user_id',s.user.id).eq('approved',true).maybeSingle();
    if(q.error)throw q.error;
    return q.data||null;
  }
  async function publicProfiles(){
    const q=await sb.rpc('get_premium_profiles_public');
    if(q.error)throw q.error;
    return q.data||[];
  }
  window.LEOGOPremiumWorkflow={
    session,approvedOwner,publicProfiles,
    async ownerDashboardUrl(){return (await approvedOwner())?'premium_profile_owner_dashboard.html':'premium_profile_dashboard.html'}
  };
  function injectCustomer(){
    const host=document.getElementById('leogoPremiumMarketplaceArea');
    if(!host||host.dataset.workflow==='1')return;
    host.dataset.workflow='1';
    host.innerHTML='<div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><h3 style="margin:0">LEOGO Premium Profiles</h3><div class="muted">Approved Premium Profiles available on the customer marketplace.</div></div><button id="lpwBrowse" class="btn primary">BROWSE PREMIUM PROFILES</button></div><div id="lpwGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:14px"></div><div id="lpwMsg" class="muted" style="margin-top:10px"></div></div>';
    document.getElementById('lpwBrowse').onclick=renderCustomer;
    renderCustomer();
  }
  async function renderCustomer(){
    const grid=document.getElementById('lpwGrid'),msg=document.getElementById('lpwMsg');
    if(!grid)return;
    grid.innerHTML='<div class="empty">Loading approved Premium Profiles…</div>';
    try{
      const rows=await publicProfiles();
      grid.innerHTML=rows.length?rows.map(p=>'<div class="panel" style="margin:0"><div style="position:relative">'+(p.profile_picture_path?'<img src="'+esc(sb.storage.from('premium-profile-public').getPublicUrl(p.profile_picture_path).data.publicUrl)+'" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px">':'<div style="width:100%;aspect-ratio:1;display:grid;place-items:center;background:#eef3fb;border-radius:14px">NO PHOTO</div>')+'</div><h3 style="margin:10px 0 4px">'+esc(p.username)+'</h3><div class="muted">'+esc(p.age)+' · '+esc(p.sex)+' · '+esc(p.location||'Location not specified')+'</div>'+(p.verified?'<div style="margin-top:7px"><span class="pill green">✓ VERIFIED</span></div>':'')+(p.availability?'<div style="margin-top:7px"><b>Availability:</b> '+esc(p.availability)+'</div>':'')+(p.orientation?'<div style="margin-top:7px"><b>Orientation:</b> '+esc(p.orientation)+'</div>':'')+(p.description?'<div style="margin-top:7px">'+esc(p.description)+'</div>':'')+'<button class="btn orange lpwRequest" data-id="'+esc(p.id)+'" style="width:100%;margin-top:12px">REQUEST</button></div>').join(''):'<div class="empty">No approved Premium Profiles are available yet.</div>';
      grid.querySelectorAll('.lpwRequest').forEach(b=>b.onclick=()=>window.dispatchEvent(new CustomEvent('leogo:premium-profile-request',{detail:{profileId:b.dataset.id}})));
      msg.textContent='Sensitive identity information is never displayed in the public marketplace.';
    }catch(e){grid.innerHTML='<div class="notice error">'+esc(e.message||'Could not load Premium Profiles.')+'</div>';}
  }
  function boot(){
    injectCustomer();
    const owner=document.getElementById('premiumProfileOwnerDashboardArea');
    if(owner&&!owner.dataset.workflow){owner.dataset.workflow='1';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
})();
