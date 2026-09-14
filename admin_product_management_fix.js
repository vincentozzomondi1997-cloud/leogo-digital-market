/* LEOGO Product Management reliability fix.
   Additive only: keeps the existing Admin Control Center layout and authentication.
   Uses simple table reads instead of nested Supabase relationships, which can fail
   when the relationship metadata is unavailable. */
(function(){
  'use strict';
  if(window.__leogoProductManagementFix) return;
  window.__leogoProductManagementFix = true;

  const state = { rows: [], filter: 'pending', loaded: false, loading: false };
  const escLocal = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const moneyLocal = v => 'KSh ' + Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const statusOf = p => String(p.approval_status || (p.approved ? 'approved' : 'pending')).toLowerCase();
  const sellerMap = {};

  function area(){ return document.getElementById('productsArea'); }
  function setMessage(text, ok){
    const a=area(); if(!a) return;
    a.innerHTML='<div class="msg '+(ok?'success':'error')+'">'+escLocal(text)+'</div>';
  }
  function setFilterButtons(){
    ['pending','approved','rejected','all'].forEach(f=>{
      const b=document.getElementById('pf-'+f);
      if(b){ b.classList.toggle('active',state.filter===f); b.classList.toggle('orange',state.filter===f); b.classList.toggle('light',state.filter!==f); }
    });
  }

  function render(){
    const a=area(); if(!a) return;
    setFilterButtons();
    const list=state.filter==='all' ? state.rows : state.rows.filter(p=>statusOf(p)===state.filter);
    if(!list.length){
      a.innerHTML='<div class="empty">No '+escLocal(state.filter)+' products found.</div>';
      return;
    }
    a.innerHTML='<div class="table-wrap"><table class="table"><thead><tr>'+
      '<th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th><th>Approval</th><th>Created</th><th>Action</th>'+
      '</tr></thead><tbody>'+list.map(p=>{
        const st=statusOf(p), s=sellerMap[p.seller_id]||{};
        return '<tr>'+ 
          '<td><b>'+escLocal(p.name)+'</b><br><span class="muted">'+escLocal(String(p.description||'').slice(0,90))+'</span></td>'+ 
          '<td><b>'+escLocal(s.business_name||'Unknown seller')+'</b><br>'+escLocal(s.owner_name||s.email||'')+'</td>'+ 
          '<td>'+escLocal(p.category||'')+'</td>'+ 
          '<td>'+moneyLocal(p.price)+'</td>'+ 
          '<td>'+escLocal(p.stock_qty ?? 0)+'</td>'+ 
          '<td><span class="pill '+(p.available?'green':'red')+'">'+(p.available?'AVAILABLE':'UNAVAILABLE')+'</span></td>'+ 
          '<td><span class="pill '+(st==='approved'?'green':st==='rejected'?'red':'')+'">'+escLocal(st.toUpperCase())+'</span></td>'+ 
          '<td>'+ (p.created_at ? new Date(p.created_at).toLocaleString() : '') +'</td>'+ 
          '<td><div class="actions"><button class="light" data-product-view="'+escLocal(p.id)+'">VIEW</button>'+ 
          (st==='pending' ? '<button class="approve" data-product-action="approved" data-product-id="'+escLocal(p.id)+'">APPROVE</button><button class="danger" data-product-action="rejected" data-product-id="'+escLocal(p.id)+'">REJECT</button>' : '')+ 
          '</div></td></tr>';
      }).join('')+'</tbody></table></div>';

    a.querySelectorAll('[data-product-action]').forEach(b=>b.addEventListener('click',()=>changeApproval(b.dataset.productId,b.dataset.productAction)));
    a.querySelectorAll('[data-product-view]').forEach(b=>b.addEventListener('click',()=>viewProductSafe(b.dataset.productView)));
  }

  async function load(){
    const a=area(); if(!a || state.loading) return;
    state.loading=true; a.innerHTML='<div class="empty">Loading products…</div>';
    try{
      if(!window.supabase || !window.supabase.createClient) throw new Error('Supabase client is unavailable.');
      const q=await sb.from('products').select('*').order('created_at',{ascending:false});
      if(q.error) throw q.error;
      state.rows=q.data||[];
      const ids=[...new Set(state.rows.map(p=>p.seller_id).filter(Boolean))];
      Object.keys(sellerMap).forEach(k=>delete sellerMap[k]);
      if(ids.length){
        const s=await sb.from('sellers').select('*').in('id',ids);
        if(!s.error) (s.data||[]).forEach(x=>sellerMap[x.id]=x);
      }
      state.loaded=true; state.loading=false; window.products=state.rows;
      render();
    }catch(e){
      state.loading=false;
      setMessage('Could not load products: '+(e?.message||e),false);
      console.error('LEOGO Product Management:',e);
    }
  }

  async function ensureLoaded(){ if(!state.loaded) await load(); }

  window.setProductFilter = async function(f){
    state.filter=f; setFilterButtons();
    await ensureLoaded();
    render();
  };
  window.loadProducts = load;

  async function changeApproval(id,status){
    const p=state.rows.find(x=>String(x.id)===String(id)); if(!p) return;
    if(!confirm((status==='approved'?'Approve':'Reject')+' “'+(p.name||'this product')+'”?')) return;
    try{
      const patch={approval_status:status,approved:status==='approved',updated_at:new Date().toISOString()};
      const q=await sb.from('products').update(patch).eq('id',id);
      if(q.error) throw q.error;
      await load();
    }catch(e){ alert('Product update failed: '+(e?.message||e)); }
  }

  async function viewProductSafe(id){
    const p=state.rows.find(x=>String(x.id)===String(id)); if(!p) return;
    let variations=[];
    try{ const q=await sb.from('product_variations').select('*').eq('product_id',id).order('created_at',{ascending:true}); if(!q.error) variations=q.data||[]; }catch(e){}
    const s=sellerMap[p.seller_id]||{};
    const body=document.getElementById('modalBody'), title=document.getElementById('modalTitle'), modal=document.getElementById('modal');
    if(!body||!title||!modal) return;
    title.textContent='Product Details';
    body.innerHTML='<div class="detail">'+
      '<div><b>Product</b>'+escLocal(p.name)+'</div>'+
      '<div><b>Seller</b>'+escLocal(s.business_name||'Unknown seller')+'</div>'+ 
      '<div><b>Owner</b>'+escLocal(s.owner_name||'')+'</div>'+ 
      '<div><b>Category</b>'+escLocal(p.category||'')+'</div>'+ 
      '<div><b>Price</b>'+moneyLocal(p.price)+'</div>'+ 
      '<div><b>Stock</b>'+escLocal(p.stock_qty??0)+'</div>'+ 
      '<div><b>Available</b>'+escLocal(p.available?'Yes':'No')+'</div>'+ 
      '<div><b>Approval</b>'+escLocal(statusOf(p))+'</div>'+ 
      '</div><div class="card" style="margin-top:14px"><b>Description</b><div style="margin-top:5px">'+escLocal(p.description||'No description')+'</div></div>'+ 
      (variations.length ? '<div class="variation-list"><div class="variation-title">Product Variations ('+variations.length+')</div>'+variations.map(v=>'<div class="variation"><div>'+(v.image_url?'<img src="'+escLocal(v.image_url)+'">':'')+'</div><div><b>'+escLocal(v.name||'Variation')+'</b><div class="muted">'+(v.available?'Available':'Unavailable')+'</div></div><div>'+moneyLocal(v.price)+'</div><div>Stock: '+escLocal(v.stock_qty??0)+'</div></div>').join('')+'</div>' : '<div class="notice">No product variations saved.</div>');
    modal.classList.remove('hidden');
  }

  function boot(){
    if(!area()) return;
    // Replace only the product-management data handlers, not the Admin shell.
    const old=document.getElementById('pf-pending');
    if(old){
      ['pending','approved','rejected','all'].forEach(f=>{
        const b=document.getElementById('pf-'+f); if(b) b.onclick=()=>window.setProductFilter(f);
      });
    }
    const refresh=area().closest('.card')?.querySelector('button[onclick="loadProducts()"]');
    if(refresh) refresh.onclick=load;
    if(document.getElementById('page-products')?.classList.contains('active')) load();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
