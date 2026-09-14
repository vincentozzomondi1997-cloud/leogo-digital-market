/* LEOGO: bridge seller details to stored registration documents. */
(function(){
  'use strict';
  if(window.__leogoSellerDocumentsBridge)return;
  window.__leogoSellerDocumentsBridge=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const pill=(v,k='')=>'<span class="pill '+k+'">'+esc(v||'—')+'</span>';
  const kind=v=>{const x=norm(v);if(['active','approved','verified'].includes(x))return 'green';if(['rejected','suspended'].includes(x))return 'red';return 'blue';};
  const fmt=v=>v?new Date(v).toLocaleString('en-KE'):'—';
  async function view(raw){
    let s;try{s=JSON.parse(decodeURIComponent(raw));}catch(e){alert('Unable to open seller details.');return;}
    const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
    if(!modal||!title||!body)return;
    const docs=Array.isArray(s.documents)?s.documents:[];
    const status=s.seller_status||s.status||'Pending';
    title.textContent='Seller Details';
    body.innerHTML='<div class="detail">'
      +'<div><b>BUSINESS NAME</b>'+esc(s.business_name||'—')+'</div><div><b>OWNER</b>'+esc(s.owner_name||'—')+'</div>'
      +'<div><b>PHONE</b>'+esc(s.phone||'—')+'</div><div><b>EMAIL</b>'+esc(s.email||'—')+'</div>'
      +'<div><b>CATEGORY</b>'+esc(s.category||'—')+'</div><div><b>LOCATION</b>'+esc(s.location||'—')+'</div>'
      +'<div><b>ADDRESS</b>'+esc(s.address||'—')+'</div><div><b>SELLER STATUS</b>'+pill(status,kind(status))+'</div>'
      +'<div><b>VERIFICATION</b>'+pill(s.verification_status,kind(s.verification_status))+'</div>'
      +'<div><b>REGISTRATION NUMBER</b>'+esc(s.registration_number||'Not provided')+'</div><div><b>LICENCE NUMBER</b>'+esc(s.licence_number||'Not provided')+'</div>'
      +'<div><b>CREATED</b>'+esc(fmt(s.created_at))+'</div><div><b>UPDATED</b>'+esc(fmt(s.updated_at))+'</div>'
      +'<div><b>AUTH USER ID</b>'+esc(s.auth_user_id||'—')+'</div><div><b>PRODUCTS</b>'+esc(s.product_count??0)+' catalogue product(s) · Recommended: '+esc(s.recommended?'Yes':'No')+'</div>'
      +'<div style="grid-column:1/-1"><b>DESCRIPTION</b>'+esc(s.description||'No business description provided.')+'</div></div>'
      +'<div class="variation-list" style="margin-top:16px"><div class="variation-title">📄 REGISTRATION DOCUMENTS</div>'
      +(docs.length?docs.map((d,i)=>'<div class="variation" style="grid-template-columns:1fr auto;align-items:center"><div><b style="font-size:12px;color:#101828">'+esc(d.label||'Business document')+'</b><div class="muted" style="font-size:12px;margin-top:3px">'+esc(d.name||'Document '+(i+1))+'</div></div><button class="blue" data-doc-index="'+i+'">VIEW DOCUMENT</button></div>').join(''):'<div class="empty">No registration documents were submitted.</div>')+'</div>';
    modal.classList.remove('hidden');
    body.querySelectorAll('[data-doc-index]').forEach(btn=>btn.addEventListener('click',async()=>{
      const d=docs[Number(btn.dataset.docIndex)]; if(!d||!d.path)return;
      const old=btn.textContent;btn.disabled=true;btn.textContent='OPENING…';
      try{const r=await sb.storage.from('business-documents').createSignedUrl(d.path,600);if(r.error)throw r.error;if(!r.data?.signedUrl)throw new Error('Secure document link unavailable.');window.open(r.data.signedUrl,'_blank','noopener');}
      catch(e){alert('Unable to open document: '+(e.message||e));}
      finally{btn.disabled=false;btn.textContent=old;}
    }));
  }
  window.__leogoViewSellerDetails=view;
})();