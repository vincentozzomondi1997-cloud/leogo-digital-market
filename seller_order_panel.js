const LEOGO_SELLER_ORDER_PANEL = (() => {
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const money=n=>'KSh '+Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cancelled=s=>['cancelled','canceled','failed'].includes(String(s||'').toLowerCase());
  const paid=s=>['paid','completed','success','successful'].includes(String(s||'').toLowerCase());
  const statusPill=s=>{const x=String(s||'').toLowerCase();let cls='pending';if(['paid','completed','successful','success','ready to pack','packed','delivered'].includes(x))cls='approved';if(['cancelled','canceled','failed','rejected'].includes(x))cls='rejected';return `<span class="pill ${cls}">${esc(s||'Pending')}</span>`};
  function injectShell(){
    if(document.getElementById('sellerOrderPanel')) return document.getElementById('sellerOrderPanel');
    const panel=document.createElement('div');
    panel.id='sellerOrderPanel';
    panel.className='panel';
    panel.innerHTML=`<h2>Seller Orders & Expected Earnings</h2><div id="sellerOrderSummary" class="muted">Checking your sales…</div><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Order</th><th>Items to Pack</th><th>Customer / Delivery</th><th>Payment</th><th>Order Status</th><th>Your Expected Earnings</th></tr></thead><tbody id="sellerOrderRows"><tr><td colspan="6" class="empty">Loading…</td></tr></tbody></div>`;
    const progress=document.querySelector('#statusGrid')?.closest('.panel');
    if(progress) progress.parentNode.insertBefore(panel,progress); else document.querySelector('main.wrap')?.appendChild(panel);
    return panel;
  }
  async function load(){
    const panel=injectShell();
    const rows=document.getElementById('sellerOrderRows');
    if(!rows) return;
    const s=await sb.auth.getSession();
    if(!s.data?.session){panel.style.display='none';return;}
    const uid=s.data.session.user.id;
    const sellerQ=await sb.from('sellers').select('id,business_name,status').eq('auth_user_id',uid).maybeSingle();
    if(sellerQ.error||!sellerQ.data||String(sellerQ.data.status).toLowerCase()!=='active'){panel.style.display='none';return;}
    panel.style.display='block';
    const sellerId=sellerQ.data.id;
    const itemQ=await sb.from('order_items').select('order_id,product_id,product_name,quantity,unit_price,line_total,variation_id').eq('seller_id',sellerId).order('order_id',{ascending:false});
    if(itemQ.error){rows.innerHTML=`<tr><td colspan="6" class="empty">Could not load seller orders: ${esc(itemQ.error.message)}</td></tr>`;return;}
    const items=itemQ.data||[];
    const ids=[...new Set(items.map(x=>x.order_id).filter(Boolean))];
    if(!ids.length){rows.innerHTML='<tr><td colspan="6" class="empty">No customer orders for your products yet.</td></tr>';document.getElementById('sellerOrderSummary').textContent='No sales yet.';return;}
    const orderQ=await sb.from('orders').select('id,receiver_name,receiver_phone,delivery_location,landmark,subtotal,total_amount,payment_status,status,created_at').in('id',ids).order('created_at',{ascending:false});
    if(orderQ.error){rows.innerHTML=`<tr><td colspan="6" class="empty">Could not load order details: ${esc(orderQ.error.message)}</td></tr>`;return;}
    const orders=orderQ.data||[];const byId=new Map();items.forEach(x=>{if(!byId.has(x.order_id))byId.set(x.order_id,[]);byId.get(x.order_id).push(x)});
    let expected=0,packCount=0,soldCount=0;
    const html=orders.map(o=>{
      const mine=byId.get(o.id)||[];
      const sellerAmount=mine.reduce((a,x)=>a+Number(x.line_total||Number(x.unit_price||0)*Number(x.quantity||0)),0);
      const isPaid=paid(o.payment_status);const isCancelled=cancelled(o.status)||cancelled(o.payment_status);
      if(isPaid&&!isCancelled){expected+=sellerAmount;soldCount++;if(!['packed','ready for pickup','ready','out for delivery','delivered'].includes(String(o.status||'').toLowerCase()))packCount++;}
      const itemsText=mine.map(x=>`${esc(x.product_name)} × ${esc(x.quantity)}${x.variation_id?' (variation)':''}`).join('<br>');
      const delivery=[o.receiver_name,o.receiver_phone,o.delivery_location,o.landmark].filter(Boolean).map(esc).join('<br>');
      const packing=isCancelled?'Do not pack':!isPaid?'WAITING FOR PAYMENT':(['packed','ready for pickup','ready','out for delivery','delivered'].includes(String(o.status||'').toLowerCase())?'Already processed':'READY TO PACK');
      return `<tr><td><b>${esc(o.id.slice(0,8))}</b><br><span class="muted">${esc(new Date(o.created_at).toLocaleString('en-KE'))}</span></td><td>${itemsText}<br><span class="pill ${packing==='READY TO PACK'?'pending':''}">${esc(packing)}</span></td><td>${delivery||'Delivery details not set'}</td><td>${statusPill(o.payment_status||'pending')}</td><td>${statusPill(o.status||'Order Placed')}</td><td><b>${isPaid&&!isCancelled?money(sellerAmount):'KSh 0.00'}</b></td></tr>`;
    }).join('');
    rows.innerHTML=html||'<tr><td colspan="6" class="empty">No seller orders yet.</td></tr>';
    const pendingQ=await sb.from('seller_settlements').select('gross_amount,status').eq('seller_id',sellerId);
    let pending=0,settled=0;if(!pendingQ.error)(pendingQ.data||[]).forEach(x=>{if(['pending','processing'].includes(String(x.status||'').toLowerCase()))pending+=Number(x.gross_amount||0);if(String(x.status||'').toLowerCase()==='settled')settled+=Number(x.gross_amount||0)});
    document.getElementById('sellerOrderSummary').innerHTML=`<b>${soldCount}</b> paid order${soldCount===1?'':'s'} · <b>${packCount}</b> requiring packing · <b>${money(expected)}</b> expected from paid sales · <b>${money(pending)}</b> pending payout · <b>${money(settled)}</b> already settled`;
    const ordersCard=document.getElementById('orders');if(ordersCard)ordersCard.textContent=String(orders.length);
    const earningsCard=document.getElementById('earnings');if(earningsCard)earningsCard.textContent=money(expected);
    const pendingCard=document.getElementById('pendingEarnings');if(pendingCard)pendingCard.textContent=money(pending);
  }
  function start(){load();setInterval(load,30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  return {load};
})();
