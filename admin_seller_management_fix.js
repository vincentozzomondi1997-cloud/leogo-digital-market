/* LEOGO Seller Management — direct sellers-table admin repair. */
(function(){
  'use strict';
  if(window.__leogoSellerManagementRepair)return;
  window.__leogoSellerManagementRepair=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  let currentFilter='pending';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const pill=(v,kind='')=>'<span class="pill '+kind+'">'+esc(v||'—')+'</span>';
  const kind=v=>{
    const x=norm(v);
    if(['active','approved'].includes(x))return 'green';
    if(['rejected','suspended'].includes(x))return 'red';
    return 'blue';
  };

  function setBusy(btn,text){if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent=text;}}
  function clearBusy(btn){if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||btn.textContent;}}

  async function loadSellers(){
    const area=document.getElementById('sellersArea');
    if(!area)return;
    area.innerHTML='<div class="empty">Loading seller accounts…</div>';
    try{
      const q=await sb.rpc('admin_list_sellers',{p_status:currentFilter});
      if(q.error)throw q.error;
      const rows=q.data||[];
      if(!rows.length){
        area.innerHTML='<div class="empty">No seller accounts found for <b>'+esc(currentFilter.toUpperCase())+'</b>.</div>';
        return;
      }
      area.innerHTML=rows.map(s=>{
        const status=s.seller_status||'Pending';
        const verification=s.verification_status||'Pending';
        const profileRole=s.profile_role||'—';
        return '<div class="card" style="border:1px solid #e5e7eb;box-shadow:none;margin-top:12px">'
          +'<div class="toolbar"><div><h3 style="margin:0">'+esc(s.business_name||'Unnamed Seller')+'</h3>'
          +'<div class="muted">Owner: '+esc(s.owner_name||'—')+' · Registered '+esc(s.created_at?new Date(s.created_at).toLocaleString('en-KE'):'—')+'</div></div>'
          +'<div class="actions">'+pill(status,kind(status))+' '+pill(verification,kind(verification))+'</div></div>'
          +'<div class="detail">'
          +'<div><b>CONTACT</b>'+esc(s.email||'—')+'<br>'+esc(s.phone||'—')+'</div>'
          +'<div><b>BUSINESS</b>'+esc(s.category||'—')+'<br>'+esc(s.location||'—')+(s.address?' · '+esc(s.address):'')+'</div>'
          +'<div><b>PRODUCTS</b>'+esc(s.product_count??0)+' catalogue product(s)<br>Recommended: '+esc(s.recommended?'Yes':'No')+'</div>'
          +'<div><b>ACCOUNT LINK</b>Auth: '+esc(s.auth_user_id||'—')+'<br>Profile role: '+pill(profileRole,profileRole==='seller'?'green':'blue')+'</div>'
          +'<div><b>DOCUMENTS / REGISTRATION</b>Registration: '+esc(s.registration_number||'Not provided')+'<br>Licence: '+esc(s.licence_number||'Not provided')+'</div>'
          +'<div><b>DESCRIPTION</b>'+esc(s.description||'No business description provided.')+'</div>'
          +'</div>'
          +'<div class="actions" style="margin-top:12px">'
          +(norm(status)==='pending'||norm(verification)==='pending'?'<button class="approve" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'approve\',this)">✓ APPROVE SELLER</button>':'')
          +(norm(status)!=='rejected'&&norm(status)!=='suspended'?'<button class="danger" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'reject\',this)">REJECT</button>':'')
          +(norm(status)==='active'?'<button class="danger" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'suspend\',this)">SUSPEND</button>':'')
          +(norm(status)==='suspended'||norm(status)==='rejected'?'<button class="approve" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'reactivate\',this)">REACTIVATE</button>':'')
          +'</div></div>';
      }).join('');
    }catch(e){
      area.innerHTML='<div class="notice error">Could not load seller accounts: '+esc(e.message||e)+'</div>';
    }
  }

  window.setSellerFilter=function(filter){
    currentFilter=filter||'pending';
    ['pending','active','suspended','all'].forEach(x=>{
      const b=document.getElementById('sf-'+x);
      if(b){b.classList.toggle('active',x===currentFilter);b.classList.toggle('orange',x===currentFilter);b.classList.toggle('light',x!==currentFilter);}
    });
    loadSellers();
  };

  window.__leogoReviewSeller=async function(id,decision,btn){
    const labels={approve:'approve this seller',reject:'reject this seller',suspend:'suspend this seller',reactivate:'reactivate this seller'};
    if(!confirm('Are you sure you want to '+(labels[decision]||decision)+'?'))return;
    setBusy(btn,'Saving…');
    try{
      const q=await sb.rpc('admin_review_seller',{p_seller_id:id,p_decision:decision});
      if(q.error)throw q.error;
      await loadSellers();
    }catch(e){
      alert(e.message||'Seller review failed.');
      clearBusy(btn);
    }
  };

  window.loadSellers=loadSellers;
  setTimeout(()=>{ if(document.getElementById('page-sellers')&&document.getElementById('sellersArea'))loadSellers(); },400);
})();
