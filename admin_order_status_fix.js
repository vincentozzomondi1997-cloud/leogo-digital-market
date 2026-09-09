/* LEOGO ORDER STATUS FIX ONLY.
   Keeps authentication, customer marketplace, seller products and all other admin modules untouched.
   Fixes repeated order-status changes while the Admin page remains open.
*/
(function(){
  if(window.__leogoOrderStatusFixInstalled)return;
  window.__leogoOrderStatusFixInstalled=true;

  const allowedStatuses=['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered','Cancelled'];
  const pending={};

  async function refreshOrders(){
    if(typeof window.loadOrders==='function'){
      await window.loadOrders();
    }else if(typeof window.renderOrders==='function'){
      window.renderOrders();
    }
  }

  window.updateOrderStatus=async function(id,status){
    if(!id || allowedStatuses.indexOf(status)<0)return false;
    if(pending[id])return pending[id];

    const run=(async function(){
      try{
        const q=await sb.from('orders')
          .update({status:status,updated_at:new Date().toISOString()})
          .eq('id',id)
          .select('id,status,updated_at')
          .maybeSingle();

        if(q.error){
          alert('Order update failed: '+(q.error.message||'Unknown error'));
          return false;
        }
        if(!q.data){
          alert('Order status was not updated. Please refresh and try again.');
          return false;
        }

        // The database has confirmed the new status. Refresh the open page immediately.
        await refreshOrders();
        return true;
      }finally{
        delete pending[id];
      }
    })();

    pending[id]=run;
    return run;
  };

  // The existing modal buttons call updateOrderStatus() and then open the order again
  // after 400ms. Wait for any active update first so an older cached order cannot overwrite
  // the new status in the modal.
  const originalViewOrder=window.viewOrder;
  if(typeof originalViewOrder==='function'){
    window.viewOrder=async function(id){
      if(pending[id])await pending[id];
      return originalViewOrder(id);
    };
  }
})();
