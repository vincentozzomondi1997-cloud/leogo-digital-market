/* LEOGO ADMIN PROVIDER / VEHICLE REVIEW ACCESS ONLY.
   Adds explicit pre-approval detail/document review buttons.
   Uses the existing secure reviewService() and reviewVehicle() functions.
   Does not change authentication, approval logic, RFQ, orders or dispatch.
*/
(function(){
  if(window.__leogoProviderReviewAccessInstalled)return;
  window.__leogoProviderReviewAccessInstalled=true;

  function addServiceReviewButtons(){
    const area=document.getElementById('servicesArea');
    if(!area)return;
    const table=area.querySelector('table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    rows.forEach(function(row){
      if(row.dataset.leogoReviewAdded==='1')return;
      const action=row.querySelector('td:last-child');
      if(!action)return;
      const buttons=action.querySelectorAll('button');
      let id=null;
      buttons.forEach(function(b){
        const h=b.getAttribute('onclick')||'';
        const m=h.match(/service(?:Approve|Decision)\(['\"]([^'\"]+)/i);
        if(m)id=m[1];
      });
      if(!id && window.services){
        const name=(row.querySelector('td')?.textContent||'').trim().split(/\n/)[0];
        const x=(window.services||[]).find(function(s){return String(s.name||'').trim()===name;});
        if(x)id=x.id;
      }
      if(!id)return;
      const b=document.createElement('button');
      b.type='button';b.className='orange';b.textContent='VIEW PROVIDER & DOCUMENTS';
      b.onclick=function(){
        if(typeof window.reviewService==='function')window.reviewService(id);
        else alert('Provider review is temporarily unavailable. Please refresh the Admin page.');
      };
      action.insertBefore(b,action.firstChild);
      row.dataset.leogoReviewAdded='1';
    });
  }

  function addVehicleReviewButtons(){
    const area=document.getElementById('vehiclesArea');
    if(!area)return;
    const table=area.querySelector('table');
    if(!table)return;
    const rows=table.querySelectorAll('tbody tr');
    rows.forEach(function(row){
      if(row.dataset.leogoReviewAdded==='1')return;
      const action=row.querySelector('td:last-child');
      if(!action)return;
      const buttons=action.querySelectorAll('button');
      let id=null;
      buttons.forEach(function(b){
        const h=b.getAttribute('onclick')||'';
        const m=h.match(/vehicleApprove\(['\"]([^'\"]+)/i);
        if(m)id=m[1];
      });
      if(!id && window.vehicles){
        const cells=row.querySelectorAll('td');
        const reg=(cells[1]?.textContent||'').trim();
        const x=(window.vehicles||[]).find(function(v){return String(v.registration||'').trim()===reg;});
        if(x)id=x.id;
      }
      if(!id)return;
      const b=document.createElement('button');
      b.type='button';b.className='orange';b.textContent='VIEW OWNER & DOCUMENTS';
      b.onclick=function(){
        if(typeof window.reviewVehicle==='function')window.reviewVehicle(id);
        else alert('Vehicle review is temporarily unavailable. Please refresh the Admin page.');
      };
      action.insertBefore(b,action.firstChild);
      row.dataset.leogoReviewAdded='1';
    });
  }

  function run(){addServiceReviewButtons();addVehicleReviewButtons();}

  function observe(id){
    const area=document.getElementById(id);
    if(!area)return;
    new MutationObserver(run).observe(area,{childList:true,subtree:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){run();observe('servicesArea');observe('vehiclesArea');});
  }else{
    run();observe('servicesArea');observe('vehiclesArea');
  }
})();
