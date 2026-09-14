/* LEOGO PREMIUM PROFILE CATALOGUE — standalone Premium page connector.
   Uses the existing approved-profile RPC and existing profile viewer/acceptance modules. */
(function(){
  if(window.__leogoPremiumProfilesCatalogue)return;
  window.__leogoPremiumProfilesCatalogue=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const photo=p=>p?sb.storage.from('premium-profile-public').getPublicUrl(p).data?.publicUrl||'':'';
  function ensureScripts(){
    const add=(src,id)=>{if(document.querySelector('script[data-leogo-cat="'+id+'"]'))return;const s=document.createElement('script');s.src=src;s.dataset.leogoCat=id;s.async=true;document.body.appendChild(s)};
    add('premium_profile_view.js?v=20260914-4','view');
    add('premium_acceptance_customer.js?v=20260914-1','accept');
  }
  async function discover(){
    const box=document.getElementById('premiumProfilesBox');
    if(!box)return;
    box.innerHTML='<div class="notice">Loading approved Premium profiles…</div>';
    ensureScripts();
    const q=await sb.rpc('get_premium_profiles_public');
    if(q.error){box.innerHTML='<div class="notice error">Unable to load Premium profiles right now. Please try again.</div>';return;}
    const rows=Array.isArray(q.data)?q.data:[];
    if(!rows.length){box.innerHTML='<div class="notice">No approved Premium profiles are currently available.</div>';return;}
    box.innerHTML='<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">'+rows.map(p=>{
      const img=photo(p.profile_picture_path);
      return '<article class="profile-card" style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px">'+(img?'<img src="'+esc(img)+'" alt="'+esc(p.username)+'" loading="lazy" style="width:120px;height:120px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #ff7a00">':'<div style="width:120px;height:120px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 12px">👤</div>')+'<div style="display:flex;justify-content:space-between;gap:8px"><div><h3 style="margin:0">'+esc(p.username)+'</h3><div class="muted">'+esc(p.age||'')+(p.sex?' • '+esc(p.sex):'')+'</div></div>'+(p.verified?'<span class="pill green">✓ VERIFIED</span>':'')+'</div><div class="muted" style="margin-top:5px">📍 '+esc(p.location||'Location not specified')+'</div>'+(p.availability?'<div style="margin-top:8px;font-size:13px"><b>Availability:</b> '+esc(p.availability)+'</div>':'')+'<div class="actions" style="margin-top:12px"><button class="btn navy" type="button" data-view="'+esc(p.id)+'">👤 VIEW PROFILE</button><button class="btn orange" type="button" data-interest="'+esc(p.id)+'">EXPRESS INTEREST</button><button class="btn light" type="button" data-book="'+esc(p.id)+'">REQUEST BOOKING</button></div></article>';
    }).join('')+'</div>';
    box.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(window.LEOGOPremiumProfileView?.open)window.LEOGOPremiumProfileView.open(b.dataset.view);else alert('Profile viewer is still loading. Please try again.');});
    box.querySelectorAll('[data-interest]').forEach(b=>b.onclick=()=>request(b.dataset.interest,'interest'));
    box.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>request(b.dataset.book,'booking'));
  }
  function request(id,type){if(window.LEOGOPremiumAcceptance?.request){window.LEOGOPremiumAcceptance.request(id,type);return}setTimeout(()=>{if(window.LEOGOPremiumAcceptance?.request)window.LEOGOPremiumAcceptance.request(id,type);else alert('Premium connection service is still loading. Please try again.');},700)}
  window.LEOGOPremiumCatalogue={discover};
  window.addEventListener('load',discover);
})();
