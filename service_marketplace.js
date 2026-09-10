/* LEOGO SERVICE MARKETPLACE - isolated customer-side service workflow.
   Reads only approved + available services and creates customer service requests.
   Includes a separate Request for Quotation (RFQ) workflow.
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
    const q=await sb.rpc('get_public_service_marketplace');
    if(q.error){grid.innerHTML='<div class="empty">Unable to load services right now.</div>';return;}
    const services=(q.data||[]).map(s=>({
      id:s.service_id, provider_id:s.provider_id, name:s.service_name,
      category:s.category, description:s.description, price:s.price,
      recommended:s.recommended, provider_name:s.provider_name,
      provider_location:s.provider_location
    }));
    if(!services.length){grid.innerHTML='<div class="empty">No services are currently available. Please check again soon.</div>';return;}

    grid.innerHTML=services.map(s=>{
      const provider=s.provider_name||'LEOGO Service Provider';
      const location=s.provider_location||'Local provider';
      return `<article class="product"><div class="product-img"><div class="placeholder">🛠️</div></div><div class="product-body">
        <div class="pill orange">${esc(s.category)}</div>
        <h3 style="margin-top:8px">${esc(s.name)}</h3>
        <div class="product-meta">${esc(provider)} · ${esc(location)}</div>
        <div class="product-meta">${esc(s.description||'Professional service available through LEOGO.')}</div>
        <div class="price">${money(s.price)}</div>
        <div class="product-actions" style="margin-top:10px;flex-wrap:wrap"><button class="btn orange" data-service-id="${esc(s.id)}" data-action="request">Request Service</button><button class="btn light" data-service-id="${esc(s.id)}" data-action="quote">Request Quotation</button></div>
      </div></article>`;
    }).join('');

    grid.querySelectorAll('[data-action="request"]').forEach(btn=>btn.addEventListener('click',()=>openRequest(services.find(s=>s.id===btn.dataset.serviceId))));
    grid.querySelectorAll('[data-action="quote"]').forEach(btn=>btn.addEventListener('click',()=>openQuotation(services.find(s=>s.id===btn.dataset.serviceId))));
  }

  async function requireCustomer(){
    const auth=await sb.auth.getSession();
    if(auth.data?.session) return auth.data.session.user;
    if(typeof window.openAuth==='function') window.openAuth();
    else alert('Please log in as a customer to continue.');
    return null;
  }

  async function openRequest(service){
    if(!service) return;
    const user=await requireCustomer();
    if(!user) return;
    document.getElementById('leogoServiceRequestModal')?.remove();
    const modal=document.createElement('div');
    modal.id='leogoServiceRequestModal'; modal.className='modal';
    modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2>Request Service</h2><div class="muted">${esc(service.name)} · ${money(service.price)}</div></div><button class="close" id="closeServiceRequest">✕</button></div>
      <div class="notice">Your request will be sent to the service provider for acceptance and scheduling.</div>
      <div class="field"><label>Service Location</label><input id="serviceLocation" placeholder="Where should the service be provided?" required></div>
      <div class="field"><label>Landmark</label><input id="serviceLandmark" placeholder="Nearby landmark (optional)"></div>
      <div id="serviceRequestMsg"></div><button class="btn orange" id="submitServiceRequest" style="width:100%">Submit Service Request</button>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('closeServiceRequest').onclick=()=>modal.remove();
    document.getElementById('submitServiceRequest').onclick=async()=>{
      const location=document.getElementById('serviceLocation').value.trim();
      const landmark=document.getElementById('serviceLandmark').value.trim();
      const msg=document.getElementById('serviceRequestMsg');
      if(!location){msg.innerHTML='<div class="notice error">Please enter the service location.</div>';return;}
      const current=(await sb.auth.getSession()).data?.session?.user;
      if(!current){modal.remove();if(typeof window.openAuth==='function')window.openAuth();return;}
      const button=document.getElementById('submitServiceRequest');button.disabled=true;button.textContent='Submitting…';
      const ins=await sb.from('service_jobs').insert({customer_id:current.id,provider_id:service.provider_id,service_id:service.id,location,landmark:landmark||null,price:service.price,status:'Requested',request_type:'service_request'}).select('id,status').maybeSingle();
      if(ins.error){button.disabled=false;button.textContent='Submit Service Request';msg.innerHTML=`<div class="notice error">${esc(ins.error.message)}</div>`;return;}
      msg.innerHTML='<div class="notice success">Service request submitted successfully.</div>'; button.textContent='Request Submitted';
      setTimeout(()=>modal.remove(),900);
    };
  }

  async function openQuotation(service){
    if(!service) return;
    const user=await requireCustomer();
    if(!user) return;
    document.getElementById('leogoServiceQuotationModal')?.remove();
    const modal=document.createElement('div');
    modal.id='leogoServiceQuotationModal'; modal.className='modal';
    modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2>Request for Quotation</h2><div class="muted">${esc(service.name)} · ${esc(service.category)}</div></div><button class="close" id="closeServiceQuotation">✕</button></div>
      <div class="notice">Tell the provider exactly what you need. The provider can review your requirements and send a quotation before you commit to the job.</div>
      <div class="field"><label>Service Location *</label><input id="rfqLocation" placeholder="Where should the service be provided?" required></div>
      <div class="field"><label>Landmark</label><input id="rfqLandmark" placeholder="Nearby landmark (optional)"></div>
      <div class="field"><label>Service Description *</label><textarea id="rfqDescription" placeholder="Describe the work you need, the problem, size/quantity, materials if known, and any important requirements."></textarea></div>
      <div class="field"><label>Preferred Date</label><input id="rfqDate" type="date"></div>
      <div class="field"><label>Preferred Time</label><input id="rfqTime" type="time"></div>
      <div class="field"><label>Urgency</label><select id="rfqUrgency"><option value="">Select urgency</option><option>Flexible</option><option>Within a few days</option><option>Urgent</option><option>Emergency</option></select></div>
      <div class="field"><label>Budget (KSh, optional)</label><input id="rfqBudget" type="number" min="0" step="1" placeholder="Your expected budget, if you have one"></div>
      <div class="field"><label>Contact Phone *</label><input id="rfqPhone" type="tel" placeholder="Phone number for the provider to contact you" required></div>
      <div id="serviceQuotationMsg"></div><button class="btn orange" id="submitServiceQuotation" style="width:100%">Submit Request for Quotation</button>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('closeServiceQuotation').onclick=()=>modal.remove();

    const profile=await sb.from('profiles').select('phone').eq('id',user.id).maybeSingle();
    if(profile.data?.phone) document.getElementById('rfqPhone').value=profile.data.phone;

    document.getElementById('submitServiceQuotation').onclick=async()=>{
      const location=document.getElementById('rfqLocation').value.trim();
      const landmark=document.getElementById('rfqLandmark').value.trim();
      const description=document.getElementById('rfqDescription').value.trim();
      const preferredDate=document.getElementById('rfqDate').value||null;
      const preferredTime=document.getElementById('rfqTime').value||null;
      const urgency=document.getElementById('rfqUrgency').value||null;
      const budgetRaw=document.getElementById('rfqBudget').value;
      const budget=budgetRaw?Number(budgetRaw):null;
      const phone=document.getElementById('rfqPhone').value.trim();
      const msg=document.getElementById('serviceQuotationMsg');
      if(!location){msg.innerHTML='<div class="notice error">Please enter the service location.</div>';return;}
      if(!description){msg.innerHTML='<div class="notice error">Please describe the service you need.</div>';return;}
      if(!phone){msg.innerHTML='<div class="notice error">Please enter a contact phone number.</div>';return;}
      if(budget!==null && (!Number.isFinite(budget)||budget<0)){msg.innerHTML='<div class="notice error">Please enter a valid budget or leave it blank.</div>';return;}
      const current=(await sb.auth.getSession()).data?.session?.user;
      if(!current){modal.remove();if(typeof window.openAuth==='function')window.openAuth();return;}
      const button=document.getElementById('submitServiceQuotation');button.disabled=true;button.textContent='Submitting…';
      const ins=await sb.from('service_jobs').insert({customer_id:current.id,provider_id:service.provider_id,service_id:service.id,location,landmark:landmark||null,price:null,status:'Requested',request_type:'quotation_request',service_description:description,contact_phone:phone,preferred_date:preferredDate,preferred_time:preferredTime,budget,urgency}).select('id,status').maybeSingle();
      if(ins.error){button.disabled=false;button.textContent='Submit Request for Quotation';msg.innerHTML=`<div class="notice error">${esc(ins.error.message)}</div>`;return;}
      msg.innerHTML='<div class="notice success">Your quotation request has been submitted successfully.</div>'; button.textContent='Quotation Requested';
      setTimeout(()=>modal.remove(),1100);
    };
  }

  function start(){load();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
