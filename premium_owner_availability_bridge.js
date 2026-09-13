/* LEOGO PREMIUM OWNER — availability bridge. Additive fix for legacy dashboard availability control. */
(function(){
  'use strict';
  if(window.__leogoOwnerAvailabilityBridge)return;
  window.__leogoOwnerAvailabilityBridge=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const OPTIONS=['Available Now','Busy','Away','Not Available','Available today','Available this week','By appointment'];
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let lastSelect=null,lastValue='';
  function get(){return {box:document.getElementById('availabilityBox'),select:document.getElementById('availabilitySelect'),button:document.getElementById('availabilityBtn')}}
  function normalizeSelect(select){
    if(!select)return;
    const old=select.value;
    const desired=OPTIONS;
    const values=[...select.options].map(o=>o.value);
    if(desired.every(v=>values.includes(v)) && values.length===desired.length+1)return;
    select.innerHTML='<option value="">Select availability</option>'+desired.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');
    if(old==='Available')select.value='Available Now';
    else if(desired.includes(old))select.value=old;
  }
  function message(text,ok){
    const box=document.getElementById('availabilityMsg');
    if(box)box.innerHTML='<div class="notice '+(ok?'success':'error')+'" style="margin-top:10px">'+esc(text)+'</div>';
  }
  async function save(){
    const {select,button}=get();
    if(!select)return;
    const value=(select.value||'').trim();
    if(!value){message('Select your availability first.',false);return}
    if(button){button.disabled=true;button.textContent='SAVING…'}
    try{
      const s=await sb.auth.getSession();
      if(!s.data?.session)throw new Error('Please log in again.');
      const q=await sb.rpc('premium_profile_owner_set_availability',{p_availability:value});
      if(q.error)throw new Error(q.error.message||'Unable to update availability.');
      lastValue=value;
      const stat=document.getElementById('sAvail'); if(stat)stat.textContent=value;
      message('Availability updated successfully. Customers will now see '+value+' on your Premium profile.',true);
    }catch(e){message(e.message||'Unable to update availability.',false)}
    finally{if(button){button.disabled=false;button.textContent='SAVE AVAILABILITY'}}
  }
  function prepare(){
    const {select,button}=get();
    if(!select||!button)return;
    normalizeSelect(select);
    if(select!==lastSelect){
      lastSelect=select;
      if(lastValue)select.value=lastValue;
    }
    // Capture-phase handler prevents the legacy dashboard's competing click handler.
    if(!button.dataset.lpaBridge){
      button.dataset.lpaBridge='1';
      button.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();save();},true);
    }
  }
  const obs=new MutationObserver(()=>{clearTimeout(window.__leogoAvailBridgeTimer);window.__leogoAvailBridgeTimer=setTimeout(prepare,80)});
  function start(){prepare();obs.observe(document.body,{childList:true,subtree:true});setInterval(prepare,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
