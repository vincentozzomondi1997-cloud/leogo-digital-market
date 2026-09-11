/* LEOGO PREMIUM PAYMENT - customer M-Pesa reference submission with admin verification. */
(function(){
  if(window.__leogoPremiumPaymentInstalled)return;
  window.__leogoPremiumPaymentInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const till='5494825';
  let lastStateKey='';
  let rendering=false;

  function ensureIdentityModule(){
    if(window.__leogoPremiumIdentityInstalled)return;
    if(document.querySelector('script[data-leogo-premium-identity]'))return;
    const script=document.createElement('script');
    script.src='premium_identity.js';
    script.dataset.leogoPremiumIdentity='1';
    script.async=true;
    document.head.appendChild(script);
  }
  async function session(){return (await sb.auth.getSession()).data?.session||null;}
  async function loadState(){const s=await session();if(!s)return null;const q=await sb.from('premium_memberships').select('id,plan_code,plan_name,price,duration_days,starts_at,expires_at,status,created_at').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();return q.error?null:q.data;}
  async function getStateKey(){const state=await loadState();return state?[(state.id||''),state.status,state.created_at||'',state.expires_at||''].join('|'):'none';}

  async function inject(){
    const modal=document.getElementById('leogoPremiumModal');
    if(!modal)return;
    ensureIdentityModule();
    const area=Array.from(modal.querySelectorAll('.panel')).find(x=>/Premium Membership/i.test(x.textContent||''));
    if(!area)return;
    let box=document.getElementById('leogoPremiumPaymentBox');
    if(!box){box=document.createElement('div');box.id='leogoPremiumPaymentBox';box.style.cssText='margin-top:14px';area.appendChild(box);lastStateKey='';}
    const key=await getStateKey();if(key===lastStateKey)return;lastStateKey=key;await renderState(box);
  }

  async function renderState(box){
    if(rendering)return;rendering=true;
    try{
      const state=await loadState();
      if(state?.status==='active'){
        const expiry=state.expires_at?new Date(state.expires_at).toLocaleString('en-KE',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}):'No expiry';
        box.innerHTML='<div class="notice success"><b>Premium is active.</b><br>'+esc(state.plan_name)+' • KSh '+Number(state.price).toLocaleString()+'<br>Valid until: <b>'+esc(expiry)+'</b></div>';return;
      }
      if(state?.status==='pending'){
        box.innerHTML='<div class="panel" style="background:#fff7ed;border:1px solid #fed7aa"><h4 style="margin:0 0 8px">Payment confirmation</h4><p class="muted" style="margin:0 0 10px">Pay <b>KSh '+Number(state.price).toLocaleString()+'</b> to the LEOGO M-Pesa Till below. After payment, paste or type your M-Pesa transaction reference in the box and mark it as paid. Your reference will be sent to LEOGO Admin for verification.</p><div style="font-size:24px;font-weight:950;letter-spacing:1px;margin:8px 0">Till: '+till+'</div><div class="field" style="margin-top:10px"><label for="lpmReference">M-Pesa transaction reference</label><input id="lpmReference" maxlength="40" autocomplete="off" placeholder="Paste or type M-Pesa code (e.g. QGH7ABC123)"></div><div id="lpmMsg"></div><button class="btn orange" id="lpmSubmit" style="width:100%;margin-top:8px">✓ I HAVE PAID — SEND TO ADMIN</button><div class="muted" style="font-size:12px;margin-top:8px">Your membership will only become active after an Admin confirms the payment reference.</div></div>';
        document.getElementById('lpmSubmit').onclick=()=>submitReference(state.id);return;
      }
      if(state?.status==='rejected'){box.innerHTML='<div class="notice error"><b>Payment not approved.</b><br>The submitted payment reference was not approved by LEOGO Admin. Please choose a Premium plan again if you still want access.</div>';return;}
      box.innerHTML='';
    }finally{rendering=false;}
  }

  async function submitReference(membershipId){
    const input=document.getElementById('lpmReference'),msg=document.getElementById('lpmMsg'),btn=document.getElementById('lpmSubmit');
    const ref=input?.value.trim().toUpperCase();if(!ref){msg.innerHTML='<div class="notice error">Please paste or type your M-Pesa transaction reference first.</div>';return;}
    btn.disabled=true;btn.textContent='SENDING TO ADMIN…';
    const q=await sb.rpc('submit_premium_payment',{p_membership_id:membershipId,p_reference:ref});
    if(q.error){btn.disabled=false;btn.textContent='✓ I HAVE PAID — SEND TO ADMIN';msg.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return;}
    lastStateKey='';await inject();
    const box=document.getElementById('leogoPremiumPaymentBox');if(box)box.insertAdjacentHTML('afterbegin','<div class="notice success"><b>Payment reference sent to LEOGO Admin.</b><br>Your payment is marked as paid/submitted for verification. Premium access will activate after Admin confirms the reference.</div>');
  }

  const observer=new MutationObserver(()=>{if(document.getElementById('leogoPremiumModal')){ensureIdentityModule();inject();}});
  function start(){observer.observe(document.body,{childList:true,subtree:true});ensureIdentityModule();inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
