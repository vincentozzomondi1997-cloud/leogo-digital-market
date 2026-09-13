/* LEOGO PREMIUM PROFILE VIEW — customer profile + approved gallery access for active Premium members. */
(function(){
  'use strict';
  if(window.__leogoPremiumProfileViewInstalled)return;
  window.__leogoPremiumProfileViewInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const publicUrl=path=>path?sb.storage.from('premium-profile-public').getPublicUrl(path).data.publicUrl:'';
  let busy=false;
  function styles(){if(document.getElementById('lpvStyles'))return;const s=document.createElement('style');s.id='lpvStyles';s.textContent='.lpv-backdrop{position:fixed;inset:0;background:rgba(7,21,47,.68);z-index:100000;display:flex;align-items:center;justify-content:center;padding:14px}.lpv-card{width:min(760px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 80px rgba(0,0,0,.32)}.lpv-head{padding:17px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}.lpv-body{padding:20px}.lpv-hero{display:grid;grid-template-columns:190px 1fr;gap:20px;align-items:start}.lpv-photo{width:190px;height:230px;border-radius:18px;object-fit:cover;background:#eef2f7}.lpv-meta{display:grid;gap:7px}.lpv-title{font-size:26px;font-weight:900;color:#07152f}.lpv-pill{display:inline-flex;width:max-content;padding:5px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:900}.lpv-section{margin-top:22px}.lpv-section h4{margin:0 0 10px;color:#07152f}.lpv-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.lpv-gallery img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;cursor:pointer;background:#eef2f7}.lpv-empty{padding:18px;border:1px dashed #d0d5dd;border-radius:14px;color:#667085;text-align:center}.lpv-close{border:0;background:#eef3fb;color:#07152f;border-radius:10px;padding:9px 12px;font-weight:900;cursor:pointer}.lpv-view{border:0;background:#07152f;color:#fff;border-radius:10px;padding:9px 12px;font-weight:900;cursor:pointer;margin-top:8px}.lpv-view:hover{background:#0d2349}.lpv-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:100001;display:grid;place-items:center;padding:20px}.lpv-lightbox img{max-width:94vw;max-height:90vh;object-fit:contain;border-radius:12px}.lpv-lightbox button{position:absolute;top:18px;right:18px;border:0;background:#fff;color:#07152f;border-radius:10px;padding:10px 13px;font-weight:900}@media(max-width:620px){.lpv-hero{grid-template-columns:1fr}.lpv-photo{width:150px;height:180px}.lpv-gallery{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
  async function session(){const q=await sb.auth.getSession();return q.data?.session?.user||null}
  async function active(){const u=await session();if(!u)return false;const q=await sb.rpc('is_premium_active',{p_user_id:u.id});return !q.error&&q.data===true}
  async function openProfile(profileId){
    if(busy)return; busy=true; styles();
    try{
      if(!(await session())){alert('Please log in to view Premium profiles.');return}
      if(!(await active())){alert('Active Premium membership is required to view the Premium profile gallery.');return}
      const p=await sb.from('premium_profiles').select('id,username,location,age,sex,availability,verified,profile_picture_path,orientation,description,fee').eq('id',profileId).eq('approved',true).maybeSingle();
      if(p.error||!p.data)throw new Error(p.error?.message||'Premium profile not found.');
      const g=await sb.rpc('get_premium_profile_gallery',{p_profile_id:profileId});
      if(g.error)throw new Error(g.error.message);
      render(p.data,g.data||[]);
    }catch(e){alert(e.message||'Unable to open Premium profile.')}finally{busy=false}
  }
  function render(p,gallery){
    document.getElementById('lpvModal')?.remove();
    const photo=p.profile_picture_path?publicUrl(p.profile_picture_path):'';
    const m=document.createElement('div');m.id='lpvModal';m.className='lpv-backdrop';
    const imgs=gallery.map(g=>publicUrl(g.image_path)).filter(Boolean);
    m.innerHTML='<div class="lpv-card"><div class="lpv-head"><div><div style="font-size:10px;font-weight:900;color:#ff7a00;letter-spacing:.8px">LEOGO PREMIUM</div><b>VIEW PROFILE</b></div><button class="lpv-close" id="lpvClose">✕</button></div><div class="lpv-body"><div class="lpv-hero">'+(photo?'<img class="lpv-photo" src="'+esc(photo)+'" alt="Premium profile">':'<div class="lpv-photo"></div>')+'<div class="lpv-meta"><div class="lpv-title">'+esc(p.username||'Premium Member')+'</div>'+(p.verified?'<span class="lpv-pill">✓ VERIFIED</span>':'')+'<div><b>Age:</b> '+esc(p.age??'—')+'</div><div><b>Sex:</b> '+esc(p.sex??'—')+'</div><div><b>Location:</b> 📍 '+esc(p.location??'—')+'</div><div><b>Availability:</b> '+esc(p.availability||'Not specified')+'</div>'+(p.orientation?'<div><b>Orientation:</b> '+esc(p.orientation)+'</div>':'')+(p.fee!=null?'<div><b>Profile fee:</b> KSh '+Number(p.fee).toLocaleString()+'</div>':'')+(p.description?'<div class="lpv-section"><b>About:</b><div class="muted" style="margin-top:5px;line-height:1.5">'+esc(p.description)+'</div></div>':'')+'</div></div><div class="lpv-section"><h4>🔒 Premium Gallery</h4>'+(imgs.length?'<div class="lpv-gallery">'+imgs.map((u,i)=>'<img src="'+esc(u)+'" alt="Premium gallery '+(i+1)+'" data-gallery="'+i+'">').join('')+'</div>':'<div class="lpv-empty">No approved gallery photos are available yet.</div>')+'</div></div></div>';
    document.body.appendChild(m);document.getElementById('lpvClose').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};m.querySelectorAll('[data-gallery]').forEach(img=>img.onclick=()=>lightbox(img.src));
  }
  function lightbox(src){const x=document.createElement('div');x.className='lpv-lightbox';x.innerHTML='<button>✕</button><img src="'+esc(src)+'" alt="Premium gallery image">';document.body.appendChild(x);x.onclick=e=>{if(e.target===x||e.target.tagName==='BUTTON')x.remove()}}
  async function decorate(){
    if(document.getElementById('leogoPremiumModal')){
      const q=await sb.rpc('get_premium_profiles');
      if(q.error||!q.data?.length)return;
      q.data.forEach(p=>{
        if(!p.id||!p.username)return;
        const nodes=Array.from(document.querySelectorAll('#leogoPremiumModal *')).filter(el=>el.children.length===0&&el.textContent.trim()===p.username);
        nodes.forEach(name=>{const card=name.closest('.panel,.card,[style*="border"],div')||name.parentElement;if(!card||card.querySelector('[data-lpv-profile="'+p.id+'"]'))return;const b=document.createElement('button');b.className='lpv-view';b.type='button';b.textContent='👤 VIEW PROFILE';b.dataset.lpvProfile=p.id;b.dataset.lpvProfile=''+p.id;b.setAttribute('data-lpv-profile',p.id);b.onclick=()=>openProfile(p.id);card.appendChild(b)})
      });
    }
  }
  window.LEOGOPremiumProfileView={open:openProfile};
  const obs=new MutationObserver(()=>{clearTimeout(window.__lpvTimer);window.__lpvTimer=setTimeout(decorate,120)});
  function start(){obs.observe(document.body,{childList:true,subtree:true});decorate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
