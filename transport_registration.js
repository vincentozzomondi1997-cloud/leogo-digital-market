/* LEOGO TRANSPORT REGISTRATION - multi-vehicle + document separation + vehicle image add-on. */
(function(){
  if(window.__leogoTransportRegistrationInstalled)return;
  window.__leogoTransportRegistrationInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sbx=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const types=['Motorcycle','Passenger Tuk Tuk','Luggage Tuk Tuk','Van','Taxi','Pickup','Canter','Lorry','Trailer','Other'];
  let count=0;
  function fileInput(label,key){return '<div class="doc"><label>'+esc(label)+'</label><input type="file" accept="application/pdf,image/jpeg,image/png" data-doc="'+esc(key)+'"></div>';}
  function vehicleImageInput(){return '<div style="margin-top:10px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa"><label>Vehicle / Motor Cycle Image <span class="muted" style="font-weight:400">(optional)</span></label><input type="file" accept="image/jpeg,image/png,image/webp" data-vehicle-image style="margin-top:6px"><div class="muted" style="font-size:12px;margin-top:5px">Upload a clear photo of this vehicle. Maximum 5 MB. If no photo is uploaded, LEOGO will show a default vehicle image to customers.</div><img data-vehicle-image-preview alt="Vehicle preview" style="display:none;width:120px;height:80px;object-fit:cover;border-radius:8px;margin-top:8px;border:1px solid #ddd"></div>';}
  function card(type='',reg='',cap=''){
    count++;
    const d=document.createElement('div');
    d.className='vehicle-entry box';
    d.style.cssText='margin-top:12px;position:relative';
    d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">Vehicle '+count+'</h3>'+(count>1?'<button type="button" class="secondary" data-remove>REMOVE</button>':'')+'</div>'+ 
      '<div class="grid" style="margin-top:8px"><div><label>Vehicle Type</label><select data-type><option value="">Select vehicle type</option>'+types.map(x=>'<option '+(x===type?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select><input data-other class="hidden" placeholder="Specify vehicle type" style="margin-top:8px"></div><div><label>Vehicle Registration</label><input data-reg value="'+esc(reg)+'" placeholder="e.g. KMEU750X"></div></div>'+ 
      '<div style="margin-top:8px"><label>Capacity (kg)</label><input data-cap type="number" min="0" value="'+esc(cap)+'" placeholder="e.g. 2000"></div>'+ 
      vehicleImageInput()+
      '<h4 style="margin:16px 0 4px">Documents for Vehicle '+count+'</h4><p class="muted" style="margin:0 0 8px">These documents belong to this vehicle only.</p>'+ 
      fileInput('Vehicle / Ownership Document','vehicle_document')+
      fileInput('Inspection / Permit / Other Vehicle Document','vehicle_permit')+
      fileInput('Other Vehicle Document','vehicle_other');
    d.querySelector('[data-type]').addEventListener('change',function(){const o=d.querySelector('[data-other]');o.classList.toggle('hidden',this.value!=='Other');if(this.value!=='Other')o.value='';});
    d.querySelector('[data-vehicle-image]').addEventListener('change',function(){const p=d.querySelector('[data-vehicle-image-preview]');const f=this.files?.[0];if(!f){p.removeAttribute('src');p.style.display='none';return;}if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5242880){p.removeAttribute('src');p.style.display='none';return;}p.src=URL.createObjectURL(f);p.style.display='block';});
    d.querySelector('[data-remove]')?.addEventListener('click',()=>{d.remove();renumber();});
    return d;
  }
  function renumber(){document.querySelectorAll('#leogoVehicleList .vehicle-entry h3').forEach((h,i)=>{h.textContent='Vehicle '+(i+1);const title=h.parentElement?.parentElement?.querySelector('h4');if(title)title.textContent='Documents for Vehicle '+(i+1);});}
  function build(){
    const f=document.getElementById('transportFields');
    if(!f||document.getElementById('leogoVehicleList'))return;
    const mode=document.getElementById('transport_mode');
    const oldType=document.getElementById('vehicle_type');
    const oldReg=document.getElementById('vehicle_registration');
    const modeGrid=mode?.closest('.grid');
    const vehicleGrid=oldReg?.closest('.grid');
    const oldDocIds=['driving_licence_doc','vehicle_document_doc','transport_other_doc'];
    const oldDocParents=oldDocIds.map(id=>document.getElementById(id)?.closest('.doc')).filter(Boolean);
    if(vehicleGrid)vehicleGrid.remove();
    if(oldType){const cell=oldType.closest('div');if(cell)cell.remove();}
    oldDocParents.forEach(x=>x.remove());
    const ownerBox=document.createElement('div');
    ownerBox.className='box';
    ownerBox.style.marginTop='14px';
    ownerBox.innerHTML='<h3 style="margin-top:0">Transporter / Owner Documents</h3><p class="muted">These documents identify or qualify the transporter. They are separate from vehicle documents.</p>'+fileInput('Driving Licence','driving_licence')+fileInput('National ID / Passport','owner_id')+fileInput('Other Owner / Transport Document','owner_other');
    const holder=document.createElement('div');
    holder.id='leogoVehicleList';
    const title=document.createElement('div');
    title.innerHTML='<h2 style="margin-top:18px">Vehicles</h2><p class="muted">Add every vehicle you want to offer on LEOGO. Each vehicle and its documents will be reviewed separately by Admin.</p>';
    holder.appendChild(title);
    holder.appendChild(card());
    const add=document.createElement('button');
    add.type='button';add.className='secondary';add.textContent='＋ ADD ANOTHER VEHICLE';add.style.marginTop='12px';
    add.onclick=()=>holder.insertBefore(card(),add);
    holder.appendChild(add);
    if(modeGrid){modeGrid.insertAdjacentElement('afterend',ownerBox);ownerBox.insertAdjacentElement('afterend',holder);}else{f.insertBefore(ownerBox,f.firstChild);ownerBox.insertAdjacentElement('afterend',holder);}
  }
  function validFile(file,label){if(!file)return true;if(!['application/pdf','image/jpeg','image/png'].includes(file.type)||file.size>5242880)throw new Error(label+' must be PDF, JPG, JPEG or PNG and no larger than 5 MB.');return true;}
  function validImage(file,label){if(!file)return true;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)throw new Error(label+' must be JPG, JPEG, PNG or WEBP and no larger than 5 MB.');return true;}
  async function upload(uid,file,label,bucket='business-documents'){if(!file)return null;validFile(file,label);const ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=uid+'/'+crypto.randomUUID()+'.'+ext,q=await sbx.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});if(q.error)throw new Error('Could not upload '+label+': '+q.error.message);return {label,path,name:file.name,type:file.type,size:file.size};}
  async function uploadVehicleImage(uid,file){if(!file)return null;validImage(file,'Vehicle / Motor Cycle Image');const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path=uid+'/'+crypto.randomUUID()+'.'+ext,q=await sbx.storage.from('vehicle-images').upload(path,file,{upsert:false,contentType:file.type});if(q.error)throw new Error('Could not upload Vehicle / Motor Cycle Image: '+q.error.message);return {path,name:file.name,type:file.type,size:file.size};}
  function settlement(){const val=id=>document.getElementById(id)?.value.trim()||'';if(!val('mpesa_number')&&!val('airtel_number')&&!val('bank_account_number'))throw new Error('Please provide at least one settlement account.');return {preferred_method:val('preferred_method')||null,mpesa_name:val('mpesa_name')||null,mpesa_number:val('mpesa_number')||null,mpesa_paybill_till:val('mpesa_paybill_till')||null,airtel_name:val('airtel_name')||null,airtel_number:val('airtel_number')||null,bank_name:val('bank_name')||null,bank_account_name:val('bank_account_name')||null,bank_account_number:val('bank_account_number')||null};}
  async function submit(e){e.preventDefault();e.stopImmediatePropagation();const btn=document.getElementById('submit'),msg=document.getElementById('msg');btn.disabled=true;btn.textContent='SUBMITTING…';msg.className='error';msg.textContent='';try{
    const sess=(await sbx.auth.getSession()).data?.session;if(!sess?.user)throw new Error('Your session has expired. Please sign in again.');
    const val=id=>document.getElementById(id)?.value.trim()||'',owner=val('owner'),phone=val('phone'),townLocation=val('location'),mode=val('transport_mode');
    if(!owner||!phone||!townLocation)throw new Error('Full name, phone number and location are required.');
    if(!mode)throw new Error('Transport / Delivery mode is required.');
    const ownerDocs=[];
    for(const x of [['driving_licence','Driving licence'],['owner_id','National ID / Passport'],['owner_other','Other owner document']]){const d=await upload(sess.user.id,document.querySelector('[data-doc="'+x[0]+'"]')?.files[0],x[1]);if(d)ownerDocs.push(d);}
    if(!ownerDocs.length)throw new Error('Please upload at least one transporter / owner document.');
    const entries=[];
    for(const d of document.querySelectorAll('#leogoVehicleList .vehicle-entry')){
      const t=d.querySelector('[data-type]').value,o=d.querySelector('[data-other]').value.trim(),r=d.querySelector('[data-reg]').value.trim(),c=d.querySelector('[data-cap]').value;
      const vehicleType=t==='Other'?o:t;
      if(!vehicleType)throw new Error('Please specify a vehicle type for every vehicle.');
      if(c&&(!Number.isFinite(Number(c))||Number(c)<0))throw new Error('Please enter valid vehicle capacities.');
      const vehicleDocs=[];
      for(const x of [['vehicle_document','Vehicle / Ownership document'],['vehicle_permit','Inspection / Permit / Other vehicle document'],['vehicle_other','Other vehicle document']]){const file=d.querySelector('[data-doc="'+x[0]+'"]')?.files[0],doc=await upload(sess.user.id,file,x[1]);if(doc)vehicleDocs.push(doc);}
      if(!vehicleDocs.length)throw new Error('Please upload at least one document for vehicle '+(entries.length+1)+'.');
      const vehicleImage=await uploadVehicleImage(sess.user.id,d.querySelector('[data-vehicle-image]')?.files?.[0]);
      entries.push({vehicle_type:vehicleType,registration:r||null,capacity_kg:c?Number(c):null,documents:vehicleDocs,vehicle_image_path:vehicleImage?.path||null});
    }
    if(!entries.length)throw new Error('Please add at least one vehicle.');
    const s=settlement();
    const q=await sbx.rpc('submit_provider_application',{p_role:'vehicle_owner',p_full_name:owner,p_phone:phone,p_location:townLocation,p_transport_mode:mode,p_documents:ownerDocs,p_vehicles:entries,preferred_method:s.preferred_method,p_mpesa_name:s.mpesa_name,p_mpesa_number:s.mpesa_number,p_mpesa_paybill_till:s.mpesa_paybill_till,p_airtel_name:s.airtel_name,p_airtel_number:s.airtel_number,p_bank_name:s.bank_name,p_bank_account_name:s.bank_account_name,p_bank_account_number:s.bank_account_number});
    if(q.error)throw new Error(q.error.message);msg.className='success';msg.textContent=(q.data?.vehicles_added||entries.length)+' vehicle(s) submitted for Admin review. Vehicle photos are optional; vehicles without a photo will use LEOGO default imagery on the customer website.';setTimeout(()=>window.location.assign('provider_dashboard.html'),900);
  }catch(x){msg.className='error';msg.textContent=x.message||String(x);btn.disabled=false;btn.textContent='SUBMIT APPLICATION FOR REVIEW';}}
  function init(){build();document.getElementById('form')?.addEventListener('submit',submit,true);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();