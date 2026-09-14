/* LEOGO PREMIUM CUSTOMER — show accepted request + released contact inside Premium discovery. */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerDiscoveryStatus)return;
  window.__leogoPremiumCustomerDiscoveryStatus=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const normalizePhone=v=>{let p=String(v||'').replace(/[^0-9+]/g,'');if(/^0/.test(p))p='+254'+p.slice(1);return p};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function load(){
    const modal=document.getElementById('leogoPremiumDiscoveryModal');
    if(!modal||modal.dataset.customerStatusLoaded==='1')return;
    const session=(await sb.auth.getSession()).data?.session;
    if(!session)return;
    modal.dataset.customerStatusLoaded='1';
    const [ir,br]=await Promise.all([
      sb.from('premium_profile_interests').select('id,premium_profile_id,status,created_at').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(50),
      sb.from('premium_profile_bookings').select('id,premium_profile_id,status,created_at').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(50)
    ]);
    const requests=[...(ir.data||[]).map(x=>({...x,type:'interest'})),...(br.data||[]).map(x=>({...x,type:'booking'}))];
    requests.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    const byProfile=new Map();
    for(const r of requests){
      const key=r.premium_profile_id;
      if(!byProfile.has(key))byProfile.set(key,r);
      else if(r.status==='accepted'&&!byProfile.get(key).status==='accepted')byProfile.set(key,r);
    }
    const cards=modal.querySelectorAll('[data-id]');
    for(const card of cards){
      const profileId=card.getAttribute('data-id');
      if(!profileId||card.dataset.connectionDecorated==='1')continue;
      const req=byProfile.get(profileId);
      if(!req)continue;
      card.dataset.connectionDecorated='1';
      const actions=card.querySelector('.lpInterestBtn')?.parentElement;
      if(req.status==='accepted'){
        const q=await sb.rpc('get_premium_customer_accepted_contact',{p_request_id:req.id,p_type:req.type});
        const x=!q.error?(q.data?.[0]||q.data):null;
        const phone=normalizePhone(x?.owner_phone);
        const box=document.createElement('div');
        box.style.cssText='margin-top:12px;padding:12px;border-radius:12px;background:#ecfdf3;border:1px solid #bbf7d0;color:#166534';
        box.innerHTML='<div style="font-weight:900">✓ YOUR '+(req.type==='booking'?'BOOKING':'INTEREST')+' HAS BEEN ACCEPTED</div>'+
          '<div style="font-size:12px;margin-top:4px">The Premium Profile owner has accepted your request. Contact details are now released.</div>'+
          (x?.owner_phone?'<div style="font-size:18px;font-weight:900;margin-top:8px">📞 '+esc(x.owner_phone)+'</div>':'<div style="font-size:13px;margin-top:8px">Contact number is not available yet.</div>')+
          (x?.owner_location?'<div style="font-size:12px;margin-top:3px">📍 '+esc(x.owner_location)+'</div>':'')+
          (phone?'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px"><a href="tel:'+esc(phone)+'" class="btn primary" style="text-decoration:none">📞 CALL</a><a href="https://wa.me/'+esc(phone.replace(/^\+/,''))+'" target="_blank" rel="noopener" class="btn orange" style="text-decoration:none">💬 WHATSAPP</a></div>':'');
        const first=actions||card.firstElementChild;
        if(first)first.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
        const interestBtn=card.querySelector('.lpInterestBtn');
        if(interestBtn){interestBtn.textContent='✓ INTEREST ACCEPTED';interestBtn.style.background='#16a34a';interestBtn.style.color='#fff'}
      }else if(req.status==='pending'){
        const box=document.createElement('div');
        box.style.cssText='margin-top:10px;padding:10px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:12px';
        box.textContent='Your '+(req.type==='booking'?'booking':'interest')+' request is pending. Contact details will appear here after the owner accepts.';
        const first=actions||card.firstElementChild;
        if(first)first.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
      }
    }
  }
  const obs=new MutationObserver(()=>{if(document.getElementById('leogoPremiumDiscoveryModal'))setTimeout(load,80)});
  function start(){obs.observe(document.body,{childList:true,subtree:true});setInterval(()=>{const m=document.getElementById('leogoPremiumDiscoveryModal');if(m){m.dataset.customerStatusLoaded='';load()}},30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
