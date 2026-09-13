/* LEOGO PREMIUM OWNER — availability save fix + online presence heartbeat. */
(function(){
  'use strict';
  if(window.__leogoOwnerAvailabilityPresenceFix)return;
  window.__leogoOwnerAvailabilityPresenceFix=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let heartbeatTimer=null, hooked=false;

  async function heartbeat(){
    try{
      const s=await sb.auth.getSession();
      if(!s.data?.session)return;
      const q=await sb.rpc('heartbeat_my_premium_presence');
      if(q.error)console.debug('LEOGO presence:',q.error.message);
    }catch(e){console.debug('LEOGO presence:',e.message)}
  }
  function startHeartbeat(){
    if(heartbeatTimer)clearInterval(heartbeatTimer);
    heartbeat();
    heartbeatTimer=setInterval(heartbeat,30000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')heartbeat()});
    window.addEventListener('beforeunload',()=>clearInterval(heartbeatTimer),{once:true});
  }

  async function installAvailability(){
    for(let i=0;i<80;i++){
      const box=$('availabilityBox'),select=$('availabilitySelect'),save=$('availabilityBtn');
      if(box&&select&&save){
        // Remove the old listener(s) by replacing the button with a clean clone.
        const clean=save.cloneNode(true);
        save.replaceWith(clean);
        const old=select.value;
        const map={'Available':'Available Now','Available today':'Available today','Available this week':'Available this week','By appointment':'By appointment'};
        const current=map[old]||old;
        const options=[['','Select availability'],['Available Now','Available Now'],['Busy','Busy'],['Away','Away'],['Not Available','Not Available'],['Available today','Available today'],['Available this week','Available this week'],['By appointment','By appointment']];
        select.innerHTML=options.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+'</option>').join('');
        if(current)select.value=current;
        $('sAvail')&&( $('sAvail').textContent=current||'—' );
        clean.textContent='SAVE AVAILABILITY';
        clean.className='btn orange';
        clean.style.marginLeft='8px';
        clean.onclick=async function(){
          const value=(select.value||'').trim();
          const msg=$('availabilityMsg');
          if(!value){if(msg)msg.innerHTML='<div class="notice error">Select your availability first.</div>';return;}
          clean.disabled=true;clean.textContent='SAVING…';
          const q=await sb.rpc('premium_profile_owner_set_availability',{p_availability:value});
          if(q.error){if(msg)msg.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';clean.disabled=false;clean.textContent='SAVE AVAILABILITY';return;}
          select.value=value;
          $('sAvail')&&( $('sAvail').textContent=value );
          if(msg)msg.innerHTML='<div class="notice success"><b>Availability updated.</b> Customers will now see <b>'+esc(value)+'</b> on your Premium profile.</div>';
          clean.disabled=false;clean.textContent='SAVE AVAILABILITY';
        };
        hooked=true;
        return true;
      }
      await sleep(250);
    }
    return false;
  }

  async function start(){
    await installAvailability();
    startHeartbeat();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
