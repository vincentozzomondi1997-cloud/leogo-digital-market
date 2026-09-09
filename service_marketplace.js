/* LEOGO SERVICE MARKETPLACE - isolated customer-side service workflow.
   Reads only approved + available services and creates customer service requests.
   Does not modify existing product/cart/auth logic. */
(function(){
  if(window.__leogoServiceMarketplaceInstalled) return;
  window.__leogoServiceMarketplaceInstalled = true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const money=v=>Number(v||0)>0?'KSh '+Number(v).toLocaleString('en-KE',{minimumFractionDigits:0,maximumFractionDigits:2}):'Price on request';

  function inject(){
    if(document.getElementById('leogoServicesSection')) return document.getElementById('leogoServicesSection');
    const section=document.createElement('section');
    section.id='leogoServicesSection';
    section.innerHTML=`<div class="container">
      <div class="section-head"><div><h2>🛠️ Services Near You</h2><div class="muted">Real services from approved LEOGO service providers</div></div><button class="btn light" id="leogoRefreshServices">Refresh</button></div>
      <div class="grid" id="leogoServiceGrid"><div class="empty">Loading services…</div></div>
    </div>`;
    const productSection=document.querySelector('#productGrid')?.closest('section');
    if(productSection) productSection.parentNode.insertBefore(section,productSection);
    else document.querySelector('#storefront')?.appendChild(section);
    document.getElementById('leogoRefreshServices')?.addEventListener('click',load);
    return section;
  }

  async function load(){
    const section=inject(), grid=document.getElementById('leogoServiceGrid');
    if(!grid) return;
    grid.innerHTML='<div class="empty">Loading services…</div>';
    const q=await sb.from('services').select('id,provider_id,name,category,description,price,recommended').eq('approved',true).eq('available',true).order('recommended',{ascending:false}).order('created_at',{ascending:false});
    if(q.error){grid.innerHTML=`<div class="empty">Unable to load services right now.</div>`;return;}
    const services=q.data||[];
    if(!services.length){grid.innerHTML='<div class="empty">No services are currently available. Please check again soon.</div>';return;}

    const providerIds=[...new Set(services.map(x=>x.provider_id).filter(Boolean))];
    let providers=[];
    if(providerIds.length){
      const p=await sb.from('profiles').select('id,full_name,location').in('id',providerIds);
      if(!p.error) providers=p.data||[];
    }
    const pm=new Map(providers.map(p=>[p.id,p]));

    grid.innerHTML=services.map(s=>{
      const p=pm.get(s.provider_id)||{};
      const provider=p.full_name||'LEOGO Service Provider';
      const location=p.location||'Local provider';
      return `<article class="product"><div class="product-img"><div class="placeholder">🛠️</div></div><div class="product-body">
        <div class="pill orange">${esc(s.category)}</div>
        <h3 style="margin-top:8px">${esc(s.name)}</h3>
        <div class="product-meta">${esc(provider)} · ${esc(location)}</div>
        <div class="product-meta">${esc(s.description||'Professional service available through LEOGO.')}</div>
        <div class="price">${money(s.price)}</div>
        <div class="product-actions" style="margin-top:10px"><button class="btn orange" data-service-id="${esc(s.id)}">Request Service</button></div>
      </div></article>`;
    }).join('');

    grid.querySelectorAll('[data-service-id]').forEach(btn=>btn.addEventListener('click',()=>openRequest(services.find(s=>s.id===btn.dataset.serviceId))));
  }

  async function openRequest(service){
    if(!service) return;
    const auth=await sb.auth.getSession();
    if(!auth.data?.session){
      if(typeof window.openAuth==='function') window.openAuth();
      else alert('Please log in as a customer to request a service.');
      return;
    }
    const existing=document.getElementById('leogoServiceRequestModal');
    existing?.remove();
    const modal=document.createElement('div');
    modal.id='leogoServiceRequestModal';
    modal.className='modal';
    modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2>Request Service</h2><div class="muted">${esc(service.name)} · ${money(service.price)}</div></div><button class="close" id="closeServiceRequest">✕</button></div>
      <div class="notice">Your request will be sent to the service provider for acceptance and scheduling.</div>
      <div class="field"><label>Service Location</label><input id="serviceLocation" placeholder="Where should the service be provided?" required></div>
      <div class="field"><label>Landmark</label><input id="serviceLandmark" placeholder="Nearby landmark (optional)"></div>
      <div id="serviceRequestMsg"></div>
      <button class="btn orange" id="submitServiceRequest" style="width:100%">Submit Service Request</button>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('closeServiceRequest').onclick=()=>modal.remove();
    document.getElementById('submitServiceRequest').onclick=async()=>{
      const location=document.getElementById('serviceLocation').value.trim();
      const landmark=document.getElementById('serviceLandmark').value.trim();
      const msg=document.getElementById('serviceRequestMsg');
      if(!location){msg.innerHTML='<div class="notice error">Please enter the service location.</div>';return;}
      const user=(await sb.auth.getSession()).data?.session?.user;
      if(!user){modal.remove();if(typeof window.openAuth==='function')window.openAuth();return;}
      const button=document.getElementById('submitServiceRequest');button.disabled=true;button.textContent='Submitting…';
      const ins=await sb.from('service_jobs').insert({customer_id:user.id,provider_id:service.provider_id,service_id:service.id,location,landmark:landmark||null,price:service.price,status:'Requested'}).select('id,status').maybeSingle();
      if(ins.error){button.disabled=false;button.textContent='Submit Service Request';msg.innerHTML=`<div class="notice error">${esc(ins.error.message)}</div>`;return;}
      msg.innerHTML='<div class="notice success">Service request submitted successfully.</div>';
      button.textContent='Request Submitted';
      setTimeout(()=>modal.remove(),900);
    };
  }

  function start(){load();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
