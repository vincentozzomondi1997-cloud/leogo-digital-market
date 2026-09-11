/* LEOGO VEHICLE IMAGE ADD-ON - isolated from the existing transporter workflow. */
(function(){
  if(window.__leogoVehicleImageAddonInstalled)return;
  window.__leogoVehicleImageAddonInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sbx=window.supabase.createClient(URL,KEY);
  const MAX=5*1024*1024;
  const TYPES=['Van','Taxi'];

  function addTypeOptions(){
    const select=document.getElementById('tdType');
    if(!select)return;
    TYPES.forEach(type=>{
      if(!Array.from(select.options).some(o=>o.value===type||o.textContent===type)){
        const o=document.createElement('option');o.value=type;o.textContent=type;select.appendChild(o);
      }
    });
  }

  function installField(){
    const modal=document.getElementById('tdVehicleModal');
    if(!modal)return;
    addTypeOptions();
    if(modal.querySelector('[data-td-vehicle-image-field]'))return;
    const cap=document.getElementById('tdCap');
    if(!cap)return;
    const field=document.createElement('div');
    field.className='td-field';
    field.setAttribute('data-td-vehicle-image-field','1');
    field.innerHTML='<label>Vehicle / Motor Cycle Image <span style="font-weight:400;color:#667085">(optional)</span></label>'+
      '<input id="tdVehicleImage" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%;padding:9px;border:1px solid #d7dce4;border-radius:9px;background:#fff">'+
      '<div style="font-size:12px;color:#667085;margin-top:5px">Upload a clear photo of this vehicle. JPG, PNG or WEBP · Maximum 5 MB. If no photo is uploaded, LEOGO will show the correct default vehicle image to customers.</div>'+
      '<img id="tdVehicleImagePreview" alt="Vehicle preview" style="display:none;width:150px;height:95px;object-fit:cover;border-radius:9px;margin-top:9px;border:1px solid #ddd">';
    cap.closest('.td-field').insertAdjacentElement('afterend',field);
    const input=field.querySelector('#tdVehicleImage'),preview=field.querySelector('#tdVehicleImagePreview');
    input.addEventListener('change',function(){
      const f=this.files?.[0];
      if(!f){preview.removeAttribute('src');preview.style.display='none';return;}
      if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>MAX){
        preview.removeAttribute('src');preview.style.display='none';
        return;
      }
      preview.src=URL.createObjectURL(f);preview.style.display='block';
    });
  }

  async function uploadVehicleImage(uid,file){
    if(!file)return null;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Vehicle image must be JPG, JPEG, PNG or WEBP.');
    if(file.size>MAX)throw new Error('Vehicle image must not be larger than 5 MB.');
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
    const path=uid+'/'+crypto.randomUUID()+'.'+ext;
    const q=await sbx.storage.from('vehicle-images').upload(path,file,{upsert:false,contentType:file.type});
    if(q.error)throw new Error('Could not upload the vehicle image: '+q.error.message);
    return path;
  }

  async function submitWithImage(button){
    const modal=document.getElementById('tdVehicleModal');
    if(!modal)return;
    const type=document.getElementById('tdType');
    const other=document.getElementById('tdOther');
    const regInput=document.getElementById('tdReg');
    const capInput=document.getElementById('tdCap');
    const msg=document.getElementById('tdMsg');
    const file=document.getElementById('tdVehicleImage')?.files?.[0];
    if(!file)return;

    const session=(await sbx.auth.getSession()).data?.session;
    const uid=session?.user?.id;
    if(!uid){msg.className='td-msg td-error';msg.textContent='Your session has expired. Please log in again.';return;}

    const t=type.value==='Other'?(other.value.trim()):type.value;
    const reg=regInput.value.trim()||null;
    const capRaw=capInput.value;
    const cap=capRaw?Number(capRaw):null;
    if(!t){msg.className='td-msg td-error';msg.textContent='Please specify the vehicle type.';return;}
    if(cap!==null&&(!Number.isFinite(cap)||cap<0)){msg.className='td-msg td-error';msg.textContent='Please enter a valid capacity.';return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>MAX){msg.className='td-msg td-error';msg.textContent='Vehicle image must be JPG, JPEG, PNG or WEBP and no larger than 5 MB.';return;}

    if(reg){
      const existing=await sbx.from('vehicles').select('id').eq('owner_id',uid).eq('registration',reg).maybeSingle();
      if(existing.error){msg.className='td-msg td-error';msg.textContent=existing.error.message;return;}
      if(existing.data){msg.className='td-msg td-error';msg.textContent='You already have a vehicle with this registration.';return;}
    }

    button.disabled=true;button.textContent='SUBMITTING…';msg.className='td-msg';msg.textContent='Submitting vehicle and uploading photo…';
    try{
      const q=await sbx.from('vehicles').insert({owner_id:uid,vehicle_type:t,registration:reg,capacity_kg:cap,approval_status:'pending',available:true,documents:[]}).select('id').maybeSingle();
      if(q.error)throw new Error(q.error.message);
      const vehicleId=q.data?.id;
      if(!vehicleId)throw new Error('Vehicle was submitted but its ID could not be confirmed.');
      const path=await uploadVehicleImage(uid,file);
      const u=await sbx.from('vehicles').update({vehicle_image_path:path}).eq('id',vehicleId).eq('owner_id',uid);
      if(u.error)throw new Error('Vehicle was submitted, but the photo could not be linked: '+u.error.message);
      msg.className='td-msg td-success';msg.textContent='Vehicle and photo submitted for Admin review.';button.textContent='SUBMITTED';
      setTimeout(()=>{modal.remove();location.reload();},800);
    }catch(e){
      button.disabled=false;button.textContent='SUBMIT VEHICLE';msg.className='td-msg td-error';msg.textContent=e.message||String(e);
    }
  }

  function observe(){
    const observer=new MutationObserver(()=>installField());
    observer.observe(document.body,{childList:true,subtree:true});
    installField();
    document.addEventListener('click',function(e){
      const button=e.target.closest('#tdSave');
      if(!button)return;
      const file=document.getElementById('tdVehicleImage')?.files?.[0];
      if(!file)return;
      e.preventDefault();e.stopImmediatePropagation();
      submitWithImage(button);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();