/* LEOGO ADMIN — PREMIUM CUSTOMER PAYMENT APPROVAL QUEUE */
(function(){
  'use strict';
  if(window.__leogoPremiumPaymentAdminQueue)return;
  window.__leogoPremiumPaymentAdminQueue=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.__leogoAdminSB||window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString();
  const date=v=>v?new Date(v).toLocaleString():'—';
  const $=id=>document.getElementById(id);

  async function load(){
    const host=$('premiumPaymentApprovalArea');
    if(!host)return;
    host.innerHTML='<div class="muted">Loading Premium payment submissions…</div>';
    const p=await sb.from('premium_payments').select('id,membership_id,user_id,amount,reference,status,created_at').in('status',['pending','paid','rejected']).order('created_at',{ascending:false}).limit(100);
    if(p.error){host.innerHTML='<div class="msg error">'+esc(p.error.message)+'</div>';return;}
    const rows=p.data||[];
    const ids=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];
    const mids=[...new Set(rows.map(x=>x.membership_id).filter(Boolean))];
    const [profiles,memberships]=await Promise.all([
      ids.length?sb.from('profiles').select('id,username,full_name,email,phone,location').in('id',ids):Promise.resolve({data:[],error:null}),
      mids.length?sb.from('premium_memberships').select('id,user_id,plan_name,plan_code,price,duration_days,status,starts_at,expires_at,created_at').in('id',mids):Promise.resolve({data:[],error:null})
    ]);
    if(profiles.error||memberships.error){host.innerHTML='<div class="msg error">'+esc(profiles.error?.message||memberships.error?.message||'Could not load Premium payment details.')+'</div>';return;}
    const pmap={};(profiles.data||[]).forEach(x=>pmap[x.id]=x);
    const mmap={};(memberships.data||[]).forEach(x=>mmap[x.id]=x);
    const pending=rows.filter(x=>x.status==='pending');
    let html='<div class="cards" style="margin-top:12px"><div class="stat"><span class="muted">Pending Payments</span><b>'+pending.length+'</b></div><div class="stat"><span class="muted">Paid</span><b>'+rows.filter(x=>x.status==='paid').length+'</b></div><div class="stat"><span class="muted">Rejected</span><b>'+rows.filter(x=>x.status==='rejected').length+'</b></div></div>';
    if(!rows.length){html+='<div class="empty">No Premium payment submissions yet.</div>';host.innerHTML=html;return;}
    html+='<div class="table-wrap"><table class="table" style="min-width:1100px"><thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>M-Pesa Reference</th><th>Submitted</th><th>Membership</th><th>Action</th></tr></thead><tbody>';
    rows.forEach(r=>{
      const p=pmap[r.user_id]||{};const m=mmap[r.membership_id]||{};
      html+='<tr>';
      html+='<td><b>'+esc(p.username||p.full_name||'—')+'</b><br>'+esc(p.full_name||'')+'<br><span class="muted">'+esc(p.phone||p.email||'')+'</span><br><span class="muted">'+esc(p.location||'')+'</span></td>';
      html+='<td><b>'+esc(m.plan_name||'—')+'</b><br>'+esc(m.duration_days||'—')+' days</td>';
      html+='<td>'+money(r.amount)+'</td>';
      html+='<td><b style="font-size:16px">'+esc(r.reference||'—')+'</b></td>';
      html+='<td>'+esc(date(r.created_at))+'</td>';
      html+='<td><span class="pill '+(m.status==='active'?'green':m.status==='rejected'?'red':'')+'">'+esc(m.status||'—')+'</span>'+(m.expires_at?'<br><span class="muted">Expires '+esc(date(m.expires_at))+'</span>':'')+'</td>';
      if(r.status==='pending')html+='<td><div class="actions"><button class="approve" data-pid="'+esc(r.id)+'" data-decision="paid">✓ APPROVE PAYMENT</button><button class="danger" data-pid="'+esc(r.id)+'" data-decision="rejected">REJECT</button></div></td>';
      else if(r.status==='paid')html+='<td><span class="pill green">PAID / ACTIVE</span></td>';
      else html+='<td><span class="pill red">REJECTED</span></td>';
      html+='</tr>';
    });
    html+='</tbody></table></div>';
    host.innerHTML=html;
  }

  async function review(id,decision){
    if(decision==='rejected'&&!confirm('Reject this Premium payment reference?'))return;
    const q=await sb.rpc('admin_review_premium_payment',{p_payment_id:id,p_decision:decision});
    if(q.error){alert(q.error.message);return;}
    await load();
    if(typeof window.loadPremium==='function')window.loadPremium();
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-pid]');
    if(!b)return;
    review(b.dataset.pid,b.dataset.decision);
  });

  function ensure(){
    const area=$('premiumArea');
    if(!area)return;
    if($('premiumPaymentApprovalCard')){load();return;}
    const card=document.createElement('div');
    card.id='premiumPaymentApprovalCard';card.className='card';card.style.marginTop='16px';
    card.innerHTML='<div class="toolbar"><div><h2 style="margin:0">Premium Customer Payment Approval</h2><div class="muted">Verify customer M-Pesa references before activating or renewing Premium access.</div></div><button class="light" id="refreshPremiumPaymentApproval">↻ REFRESH</button></div><div id="premiumPaymentApprovalArea" style="margin-top:12px"></div>';
    area.appendChild(card);$('refreshPremiumPaymentApproval').onclick=load;load();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,0));else setTimeout(ensure,0);
  if(window.MutationObserver)new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});
  window.initPremiumPaymentApproval=ensure;
})();