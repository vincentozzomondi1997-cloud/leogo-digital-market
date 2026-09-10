/* LEOGO TRANSPORT REGISTRATION - multi-vehicle add-on. */
(function(){
  if(window.__leogoTransportRegistrationInstalled)return;
  window.__leogoTransportRegistrationInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sbx=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const types=['Motorcycle','Passenger Tuk Tuk','Luggage Tuk Tuk','Pickup','Canter','Lorry','Trailer','Other'];
  let count=0;
  function card(type='',reg='',cap=''){
    count++;
    const d=document.createElement('div');d.className='vehicle-entry box';d.style.cssText='margin-top:12px;position:relative';
    d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">Vehicle '+count+'</h3>'+(count>1?'<button type="button" class="secondary" data-remove>REMOVE</button>':'')+'</div><div class="grid" style="margin-top:8px"><div><label>Vehicle Type</label><select data-type>'+types.map(x=>'<option '+(x===type?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select><input data-other class="hidden" placeholder="Specify vehicle type" style="margin-top:8px"></div><div><label>Vehicle Registration</label><input data-reg value="'+esc(reg)+'" placeholder="e.g. KMEU750X"></div></div><div style="margin-top:8px"><label>Capacity (kg)</label><input data-cap type="number" min="0" value="'+esc(cap)+'" placeholder="e.g. 2"></div>';
    d.querySelector('[data-type]').addEventListener('change',function(){d.querySelector('[data-other]').classList.toggle('hidden',this.value!=='Other');});
    d.querySelector('[data-remove]')?.addEventListener('click',()=>{d.remove();renumber();});
    return d;
  }
  function renumber(){document.querySelectorAll('#leogoVehicleList .vehicle-entry h3').forEach((h,i)=>h.textContent='Vehicle '+(i+1));}
  function build(){
    const f=document.getElementById('transportFields');if(!f||document.getElementById('leogoVehicleList'))return;
    const mode=document.getElementById('transport_mode'),oldType=document.getElementById('vehicle_type'),oldGrid=oldType?.closest('.grid');
    const modeCell=mode?.closest('div');
    const holder=document.createElement('div');holder.id='leogoVehicleList';
    const title=document.createElement('div');title.innerHTML='<h2 style="margin-top:18px">Vehicles</h2><p class="muted">Add every vehicle you want to offer on LEOGO. Each vehicle will be reviewed separately by Admin.</p>';holder.appendChild(title);holder.appendChild(card());
    const add=document.createElement('button');add.type='button';add.className='secondary';add.textContent='＋ ADD ANOTHER VEHICLE';add.style.marginTop='12px';add.onclick=()=>holder.insertBefore(card(),add);holder.appendChild(add);
    if(oldGrid){
      // The original mode and vehicle fields share one grid. Preserve the real mode control before removing that grid.
      const modeGrid=document.createElement('div');modeGrid.className='grid';
      if(modeCell)modeGrid.appendChild(modeCell);
      f.insertBefore(modeGrid,oldGrid);
      oldGrid.remove();
      f.insertBefore(holder,modeGrid.nextSibling);
    }else f.appendChild(holder);
  }
  function settlement(){const val=id=>document.getElementById(id)?.value.trim()||'';if(!val('mpesa_number')&&!val('airtel_number')&&!val('bank_account_number'))throw new Error('Please provide at least one settlement account.');return {preferred_method:val('preferred_method')||null,mpesa_name:val('mpesa_name')||null,mpesa_number:val('mpesa_number')||null,mpesa_paybill_till:val('mpesa_paybill_till')||null,airtel_name:val('airtel_name')||null,airtel_number:val('airtel_number')||null,bank_name:val('bank_name')||null,bank_account_name:val('bank_account_name')||null,bank_account_number:val('bank_account_number')||null};}
  async function upload(uid,file,label){if(!file)return null;if(!['application/pdf','image/jpeg','image/png'].includes(file.type)||file.size>5242880)throw new Error(label+' must be PDF, JPG, JPEG or PNG and no larger than 5 MB.');const ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=uid+'/'+crypto.randomUUID()+'.'+ext,q=await sbx.storage.from('business-documents').upload(path,file,{upsert:false,contentType:file.type});if(q.error)throw new Error('Could not upload '+label+': '+q.error.message);return {label,path,name:file.name,type:file.type,size:file.size};}
  async function submit(e){e.preventDefault();e.stopImmediatePropagation();const btn=document.getElementById('submit'),msg=document.getElementById('msg');btn.disabled=true;btn.textContent='SUBMITTING…';msg.className='error';msg.textContent='';try{const sess=(await sbx.auth.getSession()).data?.session;if(!sess?.user)throw new Error('Your session has expired. Please sign in again.');const val=id=>document.getElementById(id)?.value.trim()||'',owner=val('owner'),phone=val('phone'),location=val('location'),mode=val('transport_mode');if(!owner||!phone||!location)throw new Error('Full name, phone number and location are required.');if(!mode)throw new Error('Transport / Delivery mode is required.');const entries=[...document.querySelectorAll('#leogoVehicleList .vehicle-entry')].map(d=>{const t=d.querySelector('[data-type]').value,o=d.querySelector('[data-other]').value.trim(),r=d.querySelector('[data-reg]').value.trim(),c=d.querySelector('[data-cap]').value;return {vehicle_type:t==='Other'?o:t,registration:r||null,capacity_kg:c?Number(c):null};});if(!entries.length||entries.some(v=>!v.vehicle_type))throw new Error('Please specify a vehicle type for every vehicle.');if(entries.some(v=>v.capacity_kg!==null&&(!Number.isFinite(v.capacity_kg)||v.capacity_kg<0)))throw new Error('Please enter valid vehicle capacities.');const docs=[];for(const x of [['driving_licence_doc','Driving licence'],['vehicle_document_doc','Vehicle document'],['transport_other_doc','Other transport document']]){const d=await upload(sess.user.id,document.getElementById(x[0])?.files[0],x[1]);if(d)docs.push(d);}const s=settlement();const q=await sbx.rpc('submit_provider_application',{p_role:'vehicle_owner',p_full_name:owner,p_phone:phone,p_location:location,p_vehicle_type:entries[0].vehicle_type,p_vehicle_registration:entries[0].registration,p_vehicle_capacity_kg:entries[0].capacity_kg,p_transport_mode:mode,p_documents:docs,p_vehicles:entries,...s});if(q.error)throw new Error(q.error.message);msg.className='success';msg.textContent=(q.data?.vehicles_added||entries.length)+' vehicle(s) submitted for Admin review. Your dashboard will show the progress.';setTimeout(()=>location.href='provider_dashboard.html',900);}catch(x){msg.className='error';msg.textContent=x.message||String(x);btn.disabled=false;btn.textContent='SUBMIT APPLICATION FOR REVIEW';}}
  function init(){build();document.getElementById('form')?.addEventListener('submit',submit,true);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
