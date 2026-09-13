/* LEOGO PREMIUM — owner availability tab. Additive only; does not replace Premium dashboard. */
(function(){
  'use strict';
  if(window.__leogoPremiumAvailabilityInstalled)return;
  window.__leogoPremiumAvailabilityInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const STATUSES=['Available Now','Busy','Away','Not Available'];

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function styles(){
    if(document.getElementById('lpaStyles'))return;
    const s=document.createElement('style');
    s.id='lpaStyles';
    s.textContent='.lpa-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;padding:8px;background:#f3f6fb;border-radius:12px}.lpa-tab{border:0;background:transparent;color:#475467;border-radius:9px;padding:10px 13px;font-weight:900;cursor:pointer}.lpa-tab.active{background:#07152f;color:#fff}.lpa-panel{border:1px solid #dbe4f0;border-radius:16px;padding:16px;background:#fff}.lpa-statuses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.lpa-status{border:2px solid #dbe4f0;background:#fff;border-radius:12px;padding:12px;text-align:left;font-weight:900;cursor:pointer;color:#07152f}.lpa-status.selected{border-color:#ff7a00;background:#fff7ed}.lpa-save{margin-top:14px;width:100%}.lpa-note{font-size:12px;color:#667085;line-height:1.5;margin-top:10px}@media(max-width:620px){.lpa-statuses{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  async function getProfile(){
    const q=await sb.rpc('get_my_premium_profile_availability');
    if(q.error)throw new Error(q.error.message||'Unable to load your Premium profile.');
    return q.data?.[0]||null;
  }

  async function saveStatus(status,msg,saveBtn){
    saveBtn.disabled=true;saveBtn.textContent='SAVING…';
    const q=await sb.rpc('update_my_premium_availability',{p_availability:status});
    if(q.error){msg.innerHTML='<div class="notice error">'+esc(q.error.message||'Unable to update availability.')+'</div>';saveBtn.disabled=false;saveBtn.textContent='SAVE AVAILABILITY';return;}
    msg.innerHTML='<div class="notice success"><b>Availability updated.</b> Customers will now see <b>'+esc(status)+'</b> on your Premium profile.</div>';
    saveBtn.disabled=false;saveBtn.textContent='SAVE AVAILABILITY';
  }

  async function render(){
    const modal=document.getElementById('leogoPremiumModal');
    if(!modal||modal.dataset.lpaReady==='1')return;
    styles();
    let profile=null;
    try{profile=await getProfile();}catch(e){console.warn('LEOGO Premium availability:',e);return;}
    if(!profile)return;

    modal.dataset.lpaReady='1';
    const head=modal.querySelector('.modal-head');
    const body=modal.querySelector('.modal-card');
    if(!head||!body)return;

    const tabs=document.createElement('div');
    tabs.className='lpa-tabs';
    tabs.innerHTML='<button type="button" class="lpa-tab active" data-lpa-tab="premium">🏠 PREMIUM</button><button type="button" class="lpa-tab" data-lpa-tab="availability">📍 MY AVAILABILITY</button>';
    head.insertAdjacentElement('afterend',tabs);

    const existingContent=[...body.children].filter(el=>el!==head&&el!==tabs);
    const homeWrap=document.createElement('div');
    homeWrap.id='lpaHomeWrap';
    homeWrap.style.display='contents';
    existingContent.forEach(el=>homeWrap.appendChild(el));
    body.appendChild(homeWrap);

    const panel=document.createElement('div');
    panel.id='lpaAvailabilityPanel';
    panel.className='lpa-panel';
    panel.style.display='none';
    const current=profile.availability||'Not specified';
    panel.innerHTML='<h3 style="margin:0;color:#07152f">📍 My Availability</h3><p class="muted" style="margin:6px 0 0">Set your current availability. This status is shown to eligible Premium customers on your profile.</p><div class="lpa-statuses">'+STATUSES.map(x=>'<button type="button" class="lpa-status '+(current===x?'selected':'')+'" data-lpa-status="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div><div class="lpa-note">Choose <b>Available Now</b> when you are currently available. You can change this anytime from this tab.</div><div id="lpaMsg" style="margin-top:10px"></div><button type="button" class="btn orange lpa-save" id="lpaSave">SAVE AVAILABILITY</button>';
    body.appendChild(panel);

    let selected=current;
    panel.querySelectorAll('[data-lpa-status]').forEach(b=>b.onclick=()=>{selected=b.dataset.lpaStatus;panel.querySelectorAll('[data-lpa-status]').forEach(x=>x.classList.toggle('selected',x===b));});
    const saveBtn=panel.querySelector('#lpaSave'),msg=panel.querySelector('#lpaMsg');
    saveBtn.onclick=()=>saveStatus(selected,msg,saveBtn);

    const home=()=>{tabs.querySelectorAll('.lpa-tab').forEach(b=>b.classList.toggle('active',b.dataset.lpaTab==='premium'));homeWrap.style.display='contents';panel.style.display='none';};
    const availability=()=>{tabs.querySelectorAll('.lpa-tab').forEach(b=>b.classList.toggle('active',b.dataset.lpaTab==='availability'));homeWrap.style.display='none';panel.style.display='block';};
    tabs.querySelector('[data-lpa-tab="premium"]').onclick=home;
    tabs.querySelector('[data-lpa-tab="availability"]').onclick=availability;
  }

  const obs=new MutationObserver(()=>{clearTimeout(window.__lpaTimer);window.__lpaTimer=setTimeout(render,100);});
  function start(){obs.observe(document.body,{childList:true,subtree:true});render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
