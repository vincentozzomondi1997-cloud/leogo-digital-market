/* LEOGO PREMIUM PAYMENT - manual M-Pesa reference submission with protected server-side verification. */
(function(){
  if(window.__leogoPremiumPaymentInstalled)return;
  window.__leogoPremiumPaymentInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const till='5494825';

  async function session(){return (await sb.auth.getSession()).data?.session||null;}

  async function loadState(){
    const s=await session(); if(!s)return null;
    const q=await sb.from('premium_memberships').select('id,plan_code,plan_name,price,duration_days,starts_at,expires_at,status,created_at').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
    return q.error?null:q.data;
  }

  async function inject(){
    const modal=document.getElementById('leogoPremiumModal');
    if(!modal||modal.dataset.paymentUi==='1')return;
    const area=Array.from(modal.querySelectorAll('.panel')).find(x=>/Premium Membership/i.test(x.textContent||''));
    if(!area)return;
    modal.dataset.paymentUi='1';
    const box=document.createElement('div'); box.id='leogoPremiumPaymentBox'; box.style.cssText='margin-top:14px'; area.appendChild(box);
    await renderState(box);
  }

  async function renderState(box){
    const state=await loadState();
    if(state?.status==='active'){
      const expiry=state.expires_at?new Date(state.expires_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'}):'No expiry';
      box.innerHTML='<div class="notice success"><b>Premium is active.</b><br>'+esc(state.plan_name)+' • KSh '+Number(state.price).toLocaleString()+'<br>Valid until: <b>'+esc(expiry)+'</b></div>';
      return;
    }
    if(state?.status==='pending'){
      box.innerHTML='<div class="panel" style="background:#fff7ed;border:1px solid #fed7aa"><h4 style="margin:0 0 8px">Complete your payment</h4><p class="muted" style="margin:0 0 10px">Pay <b>KSh '+Number(state.price).toLocaleString()+'</b> to the LEOGO M-Pesa Till below, then enter the M-Pesa transaction code.</p><div style="font-size:24px;font-weight:950;letter-spacing:1px;margin:8px 0">Till: '+till+'</div><div class="field" style="margin-top:10px"><label>M-Pesa transaction code</label><input id="lpmReference" maxlength="40" autocomplete="off" placeholder="e.g. QGH7ABC123"></div><div id="lpmMsg"></div><button class="btn orange" id="lpmSubmit" style="width:100%;margin-top:8px">I HAVE PAID — SUBMIT REFERENCE</button></div>';
      document.getElementById('lpmSubmit').onclick=()=>submitReference(state.id);
      return;
    }
    if(state?.status==='rejected'){
      box.innerHTML='<div class="notice error"><b>Previous payment was not approved.</b> You can choose a Premium plan again below.</div>';
      return;
    }
  }

  async function submitReference(membershipId){
    const input=document.getElementById('lpmReference'),msg=document.getElementById('lpmMsg'),btn=document.getElementById('lpmSubmit');
    const ref=input?.value.trim().toUpperCase();
    if(!ref){msg.innerHTML='<div class="notice error">Please enter the M-Pesa transaction code.</div>';return;}
    btn.disabled=true;btn.textContent='SUBMITTING…';
    const q=await sb.rpc('submit_premium_payment',{p_membership_id:membershipId,p_reference:ref});
    if(q.error){btn.disabled=false;btn.textContent='I HAVE PAID — SUBMIT REFERENCE';msg.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return;}
    msg.innerHTML='<div class="notice success"><b>Payment reference submitted.</b> Your payment is now pending LEOGO verification. Premium access will activate after the payment is approved.</div>';
    btn.remove(); input.disabled=true;
  }

  const observer=new MutationObserver(()=>{if(document.getElementById('leogoPremiumModal'))inject();});
  function start(){observer.observe(document.body,{childList:true,subtree:true});inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
