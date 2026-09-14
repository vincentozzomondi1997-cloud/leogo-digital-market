/* LEOGO Seller Management — compact admin list + seller details/documents. */
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
    if(['active','approved','verified'].includes(x))return 'green';
    if(['rejected','suspended'].includes(x))return 'red';
    return 'blue';
  };
  const fmt=v=>v?new Date(v).toLocaleString('en-KE'):'—';

  function setBusy(btn,text){if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent=text;}}
  function clearBusy(btn){if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||btn.textContent;}}

  async function openDocument(path,name,btn){
    if(!path)return;
    setBusy(btn,'Opening…');
    try{
      const r=await sb.storage.from('business-documents').createSignedUrl(path,600);
      if(r.error)throw r.error;
      if(!r.data||!r.data.signedUrl)throw new Error('Document link could not be created.');
      window.open(r.data.signedUrl,'_blank','noopener');
    }catch(e){alert('Unable to open '+(name||'document')+': '+(e.message||e));}
    finally{clearBusy(btn);}
  }

  function openSellerDetails(s){
    const modal=document.getElementById('modal');
    const title=document.getElementById('modalTitle');
    const body=document.getElementById('modalBody');
    if(!modal||!title||!body)return;
    const docs=Array.isArray(s.documents)?s.documents:[];
    title.textContent='Seller Details';
    body.innerHTML='<div class="detail">'
      +'<div><b>BUSINESS NAME</b>'+esc(s.business_name||'—')+'</div>'
      +'<div><b>OWNER</b>'+esc(s.owner_name||'—')+'</div>'
      +'<div><b>PHONE</b>'+esc(s.phone||'—')+'</div>'
      +'<div><b>EMAIL</b>'+esc(s.email||'—')+'</div>'
      +'<div><b>CATEGORY</b>'+esc(s.category||'—')+'</div>'
      +'<div><b>LOCATION</b>'+esc(s.location||'—')+'</div>'
      +'<div><b>ADDRESS</b>'+esc(s.address||'—')+'</div>'
      +'<div><b>SELLER STATUS</b>'+pill(s.status,kind(s.status))+'</div>'
      +'<div><b>VERIFICATION</b>'+pill(s.verification_status,kind(s.verification_status))+'</div>'
      +'<div><b>REGISTRATION NUMBER</b>'+esc(s.registration_number||'Not provided')+'</div>'
      +'<div><b>LICENCE NUMBER</b>'+esc(s.licence_number||'Not provided')+'</div>'
      +'<div><b>CREATED</b>'+esc(fmt(s.created_at))+'</div>'
      +'<div><b>UPDATED</b>'+esc(fmt(s.updated_at))+'</div>'
      +'<div><b>AUTH USER ID</b>'+esc(s.auth_user_id||'—')+'</div>'
      +'<div><b>PRODUCTS</b>'+esc(s.product_count??0)+' catalogue product(s) · Recommended: '+esc(s.recommended?'Yes':'No')+'</div>'
      +'<div style="grid-column:1/-1"><b>DESCRIPTION</b>'+esc(s.description||'No business description provided.')+'</div>'
      +'</div>'
      +'<div class="variation-list" style="margin-top:16px">'
      +'<div class="variation-title">📄 REGISTRATION DOCUMENTS</div>'
      +(docs.length?docs.map((d,i)=>'<div class="variation" style="grid-template-columns:1fr auto;align-items:center">'
        +'<div><b style="font-size:12px;color:#101828">'+esc(d.label||'Business document')+'</b><div class="muted" style="font-size:12px;margin-top:3px">'+esc(d.name||'Document '+(i+1))+'</div></div>'
        +'<button class="blue" data-doc-index="'+i+'">VIEW DOCUMENT</button>'
        +'</div>').join(''):'<div class="empty">No registration documents were submitted.</div>')
      +'</div>';
    modal.classList.remove('hidden');
    body.querySelectorAll('[data-doc-index]').forEach(btn=>btn.addEventListener('click',()=>{
      const d=docs[Number(btn.dataset.docIndex)];
      openDocument(d&&d.path,d&&d.name,btn);
    }));
  }

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
      area.innerHTML='<div class="table-wrap"><table class="table" style="min-width:980px">'
        +'<thead><tr><th>BUSINESS</th><th>OWNER</th><th>CONTACT</th><th>CATEGORY</th><th>STATUS</th><th>VERIFICATION</th><th>CREATED</th><th>ACTION</th></tr></thead>'
        +'<tbody>'+rows.map((s,i)=>{
          const status=s.seller_status||s.status||'Pending';
          const verification=s.verification_status||'Pending';
          const encoded=encodeURIComponent(JSON.stringify(s));
          return '<tr>'
            +'<td><b>'+esc(s.business_name||'Unnamed Seller')+'</b><br><span class="muted">'+esc(s.location||'—')+'</span></td>'
            +'<td>'+esc(s.owner_name||'—')+'</td>'
            +'<td>'+esc(s.phone||'—')+'<br><span class="muted">'+esc(s.email||'—')+'</span></td>'
            +'<td>'+esc(s.category||'—')+'</td>'
            +'<td>'+pill(status,kind(status))+'</td>'
            +'<td>'+pill(verification,kind(verification))+'</td>'
            +'<td>'+esc(s.created_at?new Date(s.created_at).toLocaleDateString('en-KE'):'—')+'</td>'
            +'<td><div class="actions">'
            +'<button class="blue" onclick="window.__leogoViewSellerDetails(\''+encoded+'\')">VIEW DETAILS</button>'
            +(norm(status)==='pending'||norm(verification)==='pending'?'<button class="approve" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'approve\',this)">✓ APPROVE</button>':'')
            +(norm(status)!=='rejected'&&norm(status)!=='suspended'?'<button class="danger" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'reject\',this)">REJECT</button>':'')
            +(norm(status)==='active'?'<button class="danger" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'suspend\',this)">SUSPEND</button>':'')
            +(norm(status)==='suspended'||norm(status)==='rejected'?'<button class="approve" onclick="window.__leogoReviewSeller(\''+esc(s.seller_id)+'\',\'reactivate\',this)">REACTIVATE</button>':'')
            +'</div></td></tr>';
        }).join('')+'</tbody></table></div>';
    }catch(e){
      area.innerHTML='<div class="notice error">Could not load seller accounts: '+esc(e.message||e)+'</div>';
    }
  }

  window.__leogoViewSellerDetails=function(raw){
    try{openSellerDetails(JSON.parse(decodeURIComponent(raw)));}
    catch(e){alert('Unable to open seller details.');}
  };

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
