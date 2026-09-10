/* LEOGO ORDER STATUS / PAYMENT FIX ONLY.
   Keeps authentication, customer marketplace, seller products and other admin modules untouched.
   Fixes repeated order-status changes while the Admin page remains open and adds a safe
   admin payment-status update so sellers can see when an order is paid.
*/
(function(){
  if(window.__leogoOrderStatusFixInstalled)return;
  window.__leogoOrderStatusFixInstalled=true;

  const allowedStatuses=['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered','Cancelled'];
  const pending={};

  async function refreshOrders(){
    if(typeof window.loadOrders==='function') await window.loadOrders();
    else if(typeof window.renderOrders==='function') window.renderOrders();
  }

  window.updateOrderStatus=async function(id,status){
    if(!id || allowedStatuses.indexOf(status)<0)return false;
    if(pending[id])return pending[id];
    const run=(async function(){
      try{
        const q=await sb.from('orders').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).select('id,status,updated_at').maybeSingle();
        if(q.error){alert('Order update failed: '+(q.error.message||'Unknown error'));return false;}
        if(!q.data){alert('Order status was not updated. Please refresh and try again.');return false;}
        await refreshOrders();
        return true;
      }finally{delete pending[id];}
    })();
    pending[id]=run;
    return run;
  };

  window.updateOrderPaymentStatus=async function(id,paymentStatus){
    if(!id || paymentStatus!=='paid')return false;
    if(!confirm('Confirm that this order payment has been received and mark it as PAID?'))return false;
    const q=await sb.from('orders').update({payment_status:'paid',updated_at:new Date().toISOString()}).eq('id',id).select('id,payment_status,updated_at').maybeSingle();
    if(q.error){alert('Payment update failed: '+(q.error.message||'Unknown error'));return false;}
    if(!q.data){alert('Payment status was not updated. Please refresh and try again.');return false;}
    await refreshOrders();
    return true;
  };

  function addPaymentControls(){
    const area=document.getElementById('ordersArea');
    if(!area)return;
    const table=area.querySelector('table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    rows.forEach(row=>{
      if(row.dataset.paymentControlAdded==='1')return;
      const first=row.querySelector('td');
      const action=row.querySelector('td:last-child .actions');
      if(!first||!action)return;
      const match=(first.textContent||'').match(/#?([0-9a-f]{8})/i);
      if(!match)return;
      const shortId=match[1].toLowerCase();
      const order=(orders||[]).find(o=>String(o.id).toLowerCase().startsWith(shortId));
      if(!order)return;
      const paid=String(order.payment_status||'pending').toLowerCase()==='paid';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className=paid?'approve':'blue';
      btn.style.marginTop='5px';
      btn.textContent=paid?'PAID':'MARK PAID';
      btn.disabled=paid;
      if(!paid)btn.onclick=()=>window.updateOrderPaymentStatus(order.id,'paid');
      action.appendChild(btn);
      row.dataset.paymentControlAdded='1';
    });
  }

  const originalLoadOrders=window.loadOrders;
  if(typeof originalLoadOrders==='function'){
    window.loadOrders=async function(){
      const result=await originalLoadOrders();
      addPaymentControls();
      return result;
    };
  }

  const originalViewOrder=window.viewOrder;
  if(typeof originalViewOrder==='function'){
    window.viewOrder=async function(id){
      if(pending[id])await pending[id];
      await originalViewOrder(id);
      const body=document.getElementById('modalBody');
      const order=(orders||[]).find(o=>o.id===id);
      if(!body||!order)return;
      const existing=document.getElementById('adminPaymentUpdateCard');
      if(existing)existing.remove();
      const card=document.createElement('div');
      card.id='adminPaymentUpdateCard';
      card.className='card';
      card.style.marginTop='14px';
      const isPaid=String(order.payment_status||'pending').toLowerCase()==='paid';
      card.innerHTML='<h3 style="margin-top:0">Payment Status</h3><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><div>Current payment: <b>'+orderEsc(order.payment_status||'pending')+'</b></div><button id="adminMarkPaidBtn" class="'+(isPaid?'approve':'blue')+'" '+(isPaid?'disabled':'')+'>'+ (isPaid?'PAID':'MARK AS PAID') +'</button></div>';
      body.appendChild(card);
      if(!isPaid)document.getElementById('adminMarkPaidBtn').onclick=async()=>{const ok=await window.updateOrderPaymentStatus(id,'paid');if(ok){await window.viewOrder(id);}};
    };
  }

  if(typeof originalViewOrder==='function'){
    const wrappedView=window.viewOrder;
    window.viewOrder=async function(id){
      if(pending[id])await pending[id];
      return wrappedView(id);
    };
  }

  const observer=new MutationObserver(()=>addPaymentControls());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    const area=document.getElementById('ordersArea');
    if(area)observer.observe(area,{childList:true,subtree:true});
    addPaymentControls();
  });else{
    const area=document.getElementById('ordersArea');
    if(area)observer.observe(area,{childList:true,subtree:true});
    addPaymentControls();
  }

  // Load the isolated pre-approval review module without changing Admin authentication or core pages.
  if(!window.__leogoProviderReviewAccessLoader){
    window.__leogoProviderReviewAccessLoader=true;
    const s=document.createElement('script');
    s.src='admin_provider_review_access.js';
    s.async=false;
    document.head.appendChild(s);
  }
})();