/* LEOGO CUSTOMER — Activity History + completed-transaction cleanup. */
(function(){
  'use strict';
  if(window.__leogoCustomerActivityHistory)return;
  window.__leogoCustomerActivityHistory=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString('en-KE');
  const $=id=>document.getElementById(id);
  const finalOrder=s=>/^(completed|delivered|cancelled|canceled)$/i.test(String(s||'').trim()) || /completed|delivered/i.test(String(s||''));
  const finalTransport=s=>/^(completed|delivered|cancelled|canceled)$/i.test(String(s||'').trim()) || /completed|delivered/i.test(String(s||''));
  function styles(){
    if($('leogoActivityHistoryStyles'))return;
    const s=document.createElement('style');s.id='leogoActivityHistoryStyles';s.textContent=`
      .lah-hidden-completed{display:none!important}
      .lah-note{margin:0 0 16px;padding:12px 14px;border-radius:12px;background:#eef3fb;color:#07152f;font-size:13px}
      .lah-item{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-top:12px}
      .lah-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
      .lah-meta{font-size:12px;color:#667085;margin-top:4px}
      .lah-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#eef3fb;color:#07152f;font-size:11px;font-weight:900}
      .lah-status.done{background:#dcfce7;color:#166534}
      .lah-status.warn{background:#fff7ed;color:#9a3412}
      .lah-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin-top:12px;font-size:13px}
      .lah-delete{margin-top:12px}
      @media(max-width:650px){.lah-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  async function session(){return (await sb.auth.getSession()).data?.session||null}
  async function hiddenIds(uid){const q=await sb.from('customer_hidden_activity').select('activity_type,activity_id').eq('user_id',uid);if(q.error)throw q.error;return new Set((q.data||[]).map(x=>x.activity_type+':'+x.activity_id))}
  function fmtDate(v){try{return new Date(v).toLocaleString('en-KE')}catch(_){return String(v||'')}}
  function statusClass(s){return /completed|delivered/i.test(String(s||''))?'done':/pending|placed|progress|assigned/i.test(String(s||''))?'warn':''}
  async function history(){
    const host=$('dashContent');if(!host)return;
    const s=await session();if(!s){host.innerHTML='<div class="panel"><div class="notice error">Please log in to view your Activity History.</div></div>';return}
    host.innerHTML='<div class="panel"><h2 style="margin-top:0">Activity History</h2><div class="muted">Loading your previous orders and transport requests…</div></div>';
    try{
      const [o,t,h]=await Promise.all([
        sb.from('orders').select('id,status,total_amount,payment_method,payment_status,delivery_location,created_at,updated_at').eq('customer_id',s.user.id).order('created_at',{ascending:false}).limit(200),
        sb.from('transport_requests').select('id,status,transport_service,other_service,pickup_location,destination,price,customer_total,preferred_date,preferred_time,created_at,updated_at,status_note').eq('customer_id',s.user.id).order('created_at',{ascending:false}).limit(200),
        hiddenIds(s.user.id)
      ]);
      if(o.error&&t.error)throw o.error;
      const rows=[];
      (o.data||[]).forEach(x=>rows.push({...x,type:'order'}));
      (t.data||[]).forEach(x=>rows.push({...x,type:'transport'}));
      rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      const visible=rows.filter(r=>!h.has(r.type+':'+r.id));
      if(!visible.length){host.innerHTML='<div class="panel"><h2 style="margin-top:0">Activity History</h2><div class="lah-note">Completed and previous transactions you keep will appear here.</div><div class="empty">No transaction history to display.</div></div>';return}
      const cards=visible.map(r=>{
        const done=r.type==='order'?finalOrder(r.status):finalTransport(r.status);
        const title=r.type==='order'?'🛒 Order':'🚚 Transport Request';
        const amount=r.type==='order'?money(r.total_amount):money(r.customer_total??r.price);
        const details=r.type==='order'
          ?`<div><b>Delivery:</b> ${esc(r.delivery_location||'Not specified')}</div><div><b>Payment:</b> ${esc(r.payment_method||'Not specified')} · ${esc(r.payment_status||'')}</div>`
          :`<div><b>Route:</b> ${esc(r.pickup_location||'')} → ${esc(r.destination||'')}</div><div><b>Service:</b> ${esc(r.transport_service||r.other_service||'Transport')}</div>${r.preferred_date?`<div><b>Scheduled:</b> ${esc(r.preferred_date)}${r.preferred_time?' · '+esc(r.preferred_time):''}</div>`:''}`;
        return `<div class="lah-item"><div class="lah-head"><div><b>${title}</b><div class="lah-meta">${esc(r.id.slice(0,8))} · ${esc(fmtDate(r.created_at))}</div></div><span class="lah-status ${statusClass(r.status)}">${esc(r.status||'Unknown')}</span></div><div class="lah-grid"><div><b>Amount:</b> ${esc(amount)}</div>${details}</div>${r.status_note?`<div class="lah-meta" style="margin-top:10px"><b>Latest update:</b> ${esc(r.status_note)}</div>`:''}${done?`<button class="btn danger lah-delete" type="button" data-type="${r.type}" data-id="${esc(r.id)}">🗑️ REMOVE FROM HISTORY</button>`:''}</div>`;
      }).join('');
      host.innerHTML=`<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h2 style="margin:0">Activity History</h2><div class="muted">Your previous orders and transport requests.</div></div><button id="lahRefresh" class="btn light" type="button">REFRESH</button></div><div class="lah-note" style="margin-top:14px">Completed transactions are kept out of your main dashboard. You can remove completed items from <b>your history view</b>; this does not erase LEOGO's operational record.</div>${cards}</div>`;
      $('lahRefresh')?.addEventListener('click',history);
      host.querySelectorAll('.lah-delete').forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm('Remove this completed transaction from your Activity History?'))return;
        btn.disabled=true;btn.textContent='REMOVING…';
        const q=await sb.from('customer_hidden_activity').insert({user_id:s.user.id,activity_type:btn.dataset.type,activity_id:btn.dataset.id});
        if(q.error){alert(q.error.message);btn.disabled=false;btn.textContent='🗑️ REMOVE FROM HISTORY';return}
        await history();
      }));
    }catch(e){host.innerHTML='<div class="panel"><h2 style="margin-top:0">Activity History</h2><div class="notice error">Could not load your Activity History: '+esc(e.message||String(e))+'</div></div>'}
  }
  function hideCompleted(){
    const content=$('dashContent');if(!content||content.dataset.leogoHistory==='1')return;
    content.querySelectorAll('.panel').forEach(panel=>{
      if(panel.closest('#leogoActivityHistoryRoot'))return;
      const badges=[...panel.querySelectorAll('.pill,.status,.badge')].map(x=>String(x.textContent||'').trim()).join(' ');
      const text=String(panel.textContent||'');
      if(/\b(delivered|completed)\b/i.test(badges) || /Latest update:\s*(?:.*?\bcompleted\b)/i.test(text))panel.classList.add('lah-hidden-completed');
    });
  }
  function inject(){
    styles();
    const side=$('sideNav');if(!side)return;
    let b=$('leogoActivityHistoryBtn');
    if(!b){
      b=document.createElement('button');b.id='leogoActivityHistoryBtn';b.type='button';b.textContent='🕘 Activity History';b.title='View previous transactions';
      b.onclick=async()=>{side.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const c=$('dashContent');if(c)c.dataset.leogoHistory='1';await history();};
      const logout=[...side.querySelectorAll('button')].find(x=>/logout/i.test(x.textContent||''));
      if(logout)logout.insertAdjacentElement('beforebegin',b);else side.appendChild(b);
    }
    side.querySelectorAll('button').forEach(x=>{if(x===b||x.dataset.lahBound==='1')return;x.dataset.lahBound='1';x.addEventListener('click',()=>{b.classList.remove('active');const c=$('dashContent');if(c)c.dataset.leogoHistory='0';setTimeout(hideCompleted,50)})});
    setTimeout(hideCompleted,50);
  }
  const obs=new MutationObserver(()=>setTimeout(inject,80));
  function start(){styles();obs.observe(document.body,{childList:true,subtree:true});inject();setInterval(inject,5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
