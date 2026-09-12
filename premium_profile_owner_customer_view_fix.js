/* LEOGO PREMIUM PROFILE OWNER — CUSTOMER VIEW FIX */
(function(){
  'use strict';
  if(window.__leogoPremiumOwnerCustomerViewFix)return;
  window.__leogoPremiumOwnerCustomerViewFix=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function ensureModal(){
    if($('ownerCustomerViewModal'))return;
    const m=document.createElement('div');
    m.id='ownerCustomerViewModal';
    m.style.cssText='position:fixed;inset:0;background:rgba(7,21,47,.65);display:none;align-items:center;justify-content:center;padding:20px;z-index:99999';
    m.innerHTML='<div style="background:#fff;border-radius:18px;max-width:620px;width:100%;max-height:90vh;overflow:auto;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h2 style="margin:0">Customer Profile</h2><div id="ownerCustomerViewStatus" style="font-size:12px;color:#667085;margin-top:4px"></div></div><button id="ownerCustomerViewClose" class="btn light" type="button">CLOSE</button></div><div id="ownerCustomerViewBody" style="margin-top:16px"></div></div>';
    document.body.appendChild(m);
    $('ownerCustomerViewClose').onclick=()=>m.style.display='none';
    m.addEventListener('click',e=>{if(e.target===m)m.style.display='none'});
  }

  async function signed(path){
    if(!path)return '';
    const q=await sb.storage.from('premium-private').createSignedUrl(path,300);
    if(q.error)return '';
    return q.data?.signedUrl||'';
  }

  async function showCustomer(id,type){
    ensureModal();
    const m=$('ownerCustomerViewModal'),body=$('ownerCustomerViewBody'),status=$('ownerCustomerViewStatus');
    m.style.display='flex';
    status.textContent='Loading customer information…';
    body.innerHTML='<div class="notice">Loading…</div>';
    const q=await sb.rpc('premium_profile_owner_requester_profile',{p_request_id:id,p_type:type});
    if(q.error){status.textContent='';body.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return}
    const r=q.data?.[0]||q.data;
    if(!r){body.innerHTML='<div class="notice error">Customer profile is not available.</div>';return}
    const image=await signed(r.profile_picture_path);
    const accepted=!!r.contact;
    status.textContent=accepted?'Accepted request — contact details are now available.':'Pending request — contact details remain private until acceptance.';
    body.innerHTML='<div style="display:grid;grid-template-columns:150px 1fr;gap:20px;align-items:start">'
      +'<div>'+(image?'<img src="'+esc(image)+'" alt="Customer profile picture" style="width:150px;height:150px;object-fit:cover;border-radius:16px;border:1px solid #e5e7eb">':'<div style="width:150px;height:150px;border-radius:16px;background:#eef3fb;display:grid;place-items:center;color:#667085;font-size:12px;text-align:center">No profile picture available</div>')+'</div>'
      +'<div style="display:grid;gap:10px">'
      +'<div><b>Customer</b><br>'+esc(r.username||'—')+'</div>'
      +'<div><b>Age</b><br>'+esc(r.age??'—')+'</div>'
      +'<div><b>Sex</b><br>'+esc(r.sex||'—')+'</div>'
      +'<div><b>Location</b><br>'+esc(r.location||'—')+'</div>'
      +'<div><b>Contact</b><br>'+(accepted?esc(r.contact||'—'):'<span style="color:#991b1b;font-weight:700">Available after accepted booking</span>')+'</div>'
      +'</div></div>';
  }

  async function decorateAcceptedRows(){
    const session=(await sb.auth.getSession()).data.session;
    if(!session)return;
    const p=await sb.from('premium_profiles').select('id').eq('user_id',session.user.id).eq('approved',true).maybeSingle();
    if(p.error||!p.data)return;
    const [interests,bookings]=await Promise.all([
      sb.from('premium_profile_interests').select('id,status').eq('premium_profile_id',p.data.id).order('created_at',{ascending:false}),
      sb.from('premium_profile_bookings').select('id,status').eq('premium_profile_id',p.data.id).order('created_at',{ascending:false})
    ]);
    if(!interests.error)decorate('interestArea','interest',interests.data||[]);
    if(!bookings.error)decorate('bookingArea','booking',bookings.data||[]);
  }

  function decorate(areaId,type,rows){
    const area=$(areaId);if(!area)return;
    const trs=area.querySelectorAll('tbody tr');
    rows.forEach((r,index)=>{
      if(r.status!=='accepted')return;
      const tr=trs[index];if(!tr)return;
      const cell=tr.lastElementChild;if(!cell||cell.querySelector('[data-owner-customer-view]'))return;
      const wrap=cell.querySelector('div')||cell;
      const b=document.createElement('button');
      b.type='button';b.className='btn light';b.textContent='VIEW CUSTOMER';
      b.dataset.ownerCustomerView='1';b.dataset.type=type;b.dataset.id=r.id;
      wrap.appendChild(b);
    });
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-action="view"],[data-owner-customer-view]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showCustomer(b.dataset.id,b.dataset.type);
  },true);

  const observer=new MutationObserver(()=>setTimeout(decorateAcceptedRows,50));
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorateAcceptedRows,300));
  else setTimeout(decorateAcceptedRows,300);
})();
