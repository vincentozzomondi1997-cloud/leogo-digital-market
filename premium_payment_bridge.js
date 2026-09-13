/* LEOGO PREMIUM — CUSTOMER PAYMENT BRIDGE
   Safely replaces the old "payment gateway not connected" action with the
   existing Supabase Premium membership + payment-reference workflow.
*/
(function(){
  'use strict';
  if(window.__leogoPremiumPaymentBridge)return;
  window.__leogoPremiumPaymentBridge=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString();
  let modal=null;

  async function session(){const q=await sb.auth.getSession();return q.data?.session||null;}
  function close(){if(modal){modal.remove();modal=null;}}
  function shell(title,body){
    close();
    modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:9999;display:grid;place-items:center;padding:18px';
    modal.innerHTML='<div style="width:min(560px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px"><h2 style="margin:0;color:#07152f">'+esc(title)+'</h2><button type="button" data-pb-close style="border:0;background:#eef3fb;border-radius:10px;width:38px;height:38px;font-size:20px">×</button></div>'+body+'</div>';
    document.body.appendChild(modal);
    modal.querySelector('[data-pb-close]').onclick=close;
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    return modal;
  }

  async function getCurrent(){
    const s=await session();
    if(!s)return {session:null,membership:null,payment:null};
    const q=await sb.from('premium_memberships').select('id,plan_code,plan_name,price,duration_days,status,starts_at,expires_at,created_at').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(10);
    if(q.error)throw q.error;
    const membership=(q.data||[]).find(m=>m.status==='pending')||(q.data||[])[0]||null;
    let payment=null;
    if(membership){const p=await sb.from('premium_payments').select('id,membership_id,amount,reference,status,created_at').eq('membership_id',membership.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(!p.error)payment=p.data||null;}
    return {session:s,membership,payment};
  }
  async function plans(){const q=await sb.rpc('get_premium_pricing');if(q.error)throw q.error;return q.data||[];}

  function paymentForm(membership,payment){
    if(payment?.status==='pending'){
      return '<div style="padding:14px;border-radius:12px;background:#fff7ed;color:#9a3412"><b>Payment already submitted.</b><br>Reference: <b>'+esc(payment.reference||'—')+'</b><br><br>Your payment is waiting for LEOGO Admin verification. You do not need to submit it again.</div><div style="padding:14px;border-radius:12px;background:#eef3fb;color:#07152f;margin-top:12px"><b>'+esc(membership.plan_name)+'</b><br>'+money(membership.price)+' · '+esc(membership.duration_days)+' days<br>Status: <b>Awaiting Admin Approval</b></div>';
    }
    return '<div style="padding:12px 14px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:13px;margin-bottom:14px"><b>Pay by M-Pesa Till: 5494825</b><br>Send exactly <b>'+money(membership.price)+'</b>, then enter the M-Pesa transaction reference below. Your payment will remain pending until an admin verifies it.</div><div style="padding:14px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:14px"><b>'+esc(membership.plan_name)+'</b><br><span style="font-size:24px;font-weight:900;color:#07152f">'+money(membership.price)+'</span><br><span style="color:#667085">'+esc(membership.duration_days)+' days Premium access</span></div><label style="display:block;font-size:13px;font-weight:800;margin-bottom:6px">M-Pesa Transaction Reference</label><input id="pbReference" maxlength="40" placeholder="e.g. QGH12356UY" style="width:100%;box-sizing:border-box;border:1px solid #d7dce4;border-radius:11px;padding:12px;outline:none;text-transform:uppercase"><div id="pbMsg" style="margin-top:10px;font-size:13px"></div><button id="pbSubmit" type="button" style="width:100%;border:0;border-radius:12px;padding:13px;background:#ff7a00;color:#fff;font-weight:900;margin-top:10px">I HAVE PAID — SUBMIT FOR APPROVAL</button>';
  }

  async function showPayment(membership,payment){
    const m=shell('Premium Payment',paymentForm(membership,payment));
    if(payment?.status==='pending')return;
    const input=m.querySelector('#pbReference'),msg=m.querySelector('#pbMsg'),btn=m.querySelector('#pbSubmit');
    btn.onclick=async()=>{
      const ref=String(input.value||'').trim().toUpperCase();
      if(ref.length<6){msg.innerHTML='<span style="color:#991b1b">Enter a valid M-Pesa transaction reference.</span>';return;}
      btn.disabled=true;btn.textContent='Submitting…';
      const q=await sb.rpc('submit_premium_payment',{p_membership_id:membership.id,p_reference:ref});
      if(q.error){msg.innerHTML='<span style="color:#991b1b">'+esc(q.error.message)+'</span>';btn.disabled=false;btn.textContent='I HAVE PAID — SUBMIT FOR APPROVAL';return;}
      await showPayment(membership,{status:'pending',reference:ref});
    };
  }

  async function choose(plan){
    const s=await session();
    if(!s){close();if(typeof window.openAuth==='function')window.openAuth();else alert('Please log in first.');return;}
    const current=await getCurrent();
    if(current.membership?.status==='pending')return showPayment(current.membership,current.payment);
    const q=await sb.rpc('start_premium_checkout',{p_plan_code:plan.plan_code});
    if(q.error)throw q.error;
    const membership=(q.data||[])[0];
    if(!membership?.id)throw new Error('Premium membership request could not be created');
    await showPayment(membership,null);
  }

  async function open(){
    try{
      const s=await session();
      if(!s){if(typeof window.openAuth==='function')window.openAuth();else alert('Please log in first.');return;}
      const current=await getCurrent();
      if(current.membership?.status==='pending')return showPayment(current.membership,current.payment);
      const pricing=await plans();
      const active=(current.membership?.status==='active'&&current.membership.expires_at&&new Date(current.membership.expires_at)>new Date());
      if(active){shell('Premium Membership','<div style="padding:14px;border-radius:12px;background:#ecfdf3;color:#166534"><b>Premium is active.</b><br>Expires: '+esc(new Date(current.membership.expires_at).toLocaleString())+'</div>');return;}
      const cards=pricing.map(p=>'<div style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b style="font-size:17px">'+esc(p.plan_name)+'</b><br><span style="color:#667085">'+esc(p.duration_days)+' days access</span></div><b style="font-size:20px;color:#07152f">'+money(p.price)+'</b></div><button type="button" data-plan="'+esc(p.plan_code)+'" style="width:100%;margin-top:12px;border:0;border-radius:11px;padding:12px;background:#ff7a00;color:#fff;font-weight:900">CHOOSE PLAN</button></div>').join('');
      const m=shell('Premium Membership','<div style="padding:12px 14px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:13px">Your previous Premium access has expired. Choose a new plan to renew.</div><div style="margin-top:12px">'+cards+'</div>');
      m.querySelectorAll('[data-plan]').forEach(b=>b.onclick=async()=>{try{b.disabled=true;b.textContent='Creating payment request…';const p=pricing.find(x=>x.plan_code===b.dataset.plan);await choose(p);}catch(e){const msg=document.createElement('div');msg.style='color:#991b1b;font-size:13px;margin-top:10px';msg.textContent=e.message||'Could not start Premium renewal';b.parentElement.appendChild(msg);b.disabled=false;b.textContent='CHOOSE PLAN';}});
    }catch(e){alert(e.message||'Could not open Premium membership');}
  }

  function intercept(e){
    const b=e.target.closest?.('button');
    if(!b)return;
    const t=(b.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
    // A plan button must execute the selected plan, not reopen the plan picker.
    if(b.dataset?.plan || b.classList.contains('lpChoose')){
      const planCode=b.dataset.plan;
      if(planCode){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        choose({plan_code:planCode}).catch(err=>alert(err.message||'Premium renewal could not be started'));
        return;
      }
    }
    if(t==='CHOOSE MEMBERSHIP'||t==='MEMBERSHIP'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      open();
    }
  }
  document.addEventListener('click',intercept,true);
  window.LEOGOPremiumPaymentBridge={open,showPayment,choose};
})();
