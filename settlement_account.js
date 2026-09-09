(() => {
  const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const roleAllowed=['seller','service_provider','premium_provider','vehicle_owner','driver','rider'];
  function style(){
    if(document.getElementById('settlementAccountStyle'))return;
    const s=document.createElement('style');s.id='settlementAccountStyle';s.textContent=`#settlementAccountPanel{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin:18px 0}.sa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sa-field{display:flex;flex-direction:column;gap:6px}.sa-field label{font-size:12px;font-weight:800;color:#667085}.sa-field input,.sa-field select{width:100%;padding:10px 11px;border:1px solid #d0d5dd;border-radius:9px;background:#fff;font:inherit}.sa-wide{grid-column:1/-1}.sa-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.sa-note{font-size:13px;color:#667085;margin:6px 0 12px}.sa-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;text-transform:capitalize;background:#fff4cc}.sa-status.verified{background:#dcfce7;color:#166534}.sa-status.rejected{background:#fee2e2;color:#991b1b}.sa-message{margin-top:10px;font-size:13px}.sa-message.ok{color:#166534}.sa-message.bad{color:#991b1b}@media(max-width:600px){.sa-grid{grid-template-columns:1fr}}`;document.head.appendChild(s);
  }
  function inject(){
    if(document.getElementById('settlementAccountPanel'))return document.getElementById('settlementAccountPanel');
    style();
    const panel=document.createElement('section');panel.id='settlementAccountPanel';
    panel.innerHTML=`<h2 style="margin:0 0 8px;color:#07152f">Settlement Account</h2><div class="sa-note">Add or edit where LEOGO should send your approved earnings. For security, any change to your settlement details is sent back for verification.</div><div id="saCurrent" class="sa-note">Loading settlement account…</div><form id="saForm"><div class="sa-grid"><div class="sa-field"><label>Preferred payout method</label><select id="saMethod"><option value="mpesa">M-Pesa</option><option value="airtel_money">Airtel Money</option><option value="bank">Bank</option></select></div><div class="sa-field"><label>Account status</label><div id="saStatus" class="sa-note" style="padding-top:10px">Not submitted</div></div><div class="sa-field sa-mpesa"><label>M-Pesa registered name</label><input id="saMpesaName" maxlength="120"></div><div class="sa-field sa-mpesa"><label>M-Pesa number</label><input id="saMpesaNumber" maxlength="30" inputmode="tel" placeholder="07XXXXXXXX"></div><div class="sa-field sa-mpesa"><label>PayBill / Till (optional)</label><input id="saMpesaTill" maxlength="40"></div><div class="sa-field sa-airtel"><label>Airtel Money registered name</label><input id="saAirtelName" maxlength="120"></div><div class="sa-field sa-airtel"><label>Airtel Money number</label><input id="saAirtelNumber" maxlength="30" inputmode="tel" placeholder="07XXXXXXXX"></div><div class="sa-field sa-bank"><label>Bank name</label><input id="saBankName" maxlength="120"></div><div class="sa-field sa-bank"><label>Bank account name</label><input id="saBankAccountName" maxlength="120"></div><div class="sa-field sa-bank"><label>Bank account number</label><input id="saBankAccountNumber" maxlength="60" inputmode="numeric"></div></div><div class="sa-actions"><button class="btn" type="submit">SAVE / UPDATE SETTLEMENT ACCOUNT</button></div><div id="saMessage" class="sa-message"></div></form>`;
    const account=document.getElementById('account')?.closest('.panel');
    const cards=document.querySelector('.cards');
    if(account)account.parentNode.insertBefore(panel,account);else if(cards)cards.parentNode.insertBefore(panel,cards.nextSibling);else document.querySelector('main.wrap')?.prepend(panel);
    document.getElementById('saForm').addEventListener('submit',save);
    document.getElementById('saMethod').addEventListener('change',toggle);
    return panel;
  }
  function toggle(){
    const m=document.getElementById('saMethod').value;
    document.querySelectorAll('.sa-mpesa').forEach(x=>x.style.display=m==='mpesa'?'flex':'none');
    document.querySelectorAll('.sa-airtel').forEach(x=>x.style.display=m==='airtel_money'?'flex':'none');
    document.querySelectorAll('.sa-bank').forEach(x=>x.style.display=m==='bank'?'flex':'none');
  }
  async function load(){
    const panel=inject();
    const q=await sb.auth.getSession();const session=q.data?.session;
    if(!session){panel.style.display='none';return;}
    const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
    if(profile?.role&&!roleAllowed.includes(String(profile.role).toLowerCase())){panel.style.display='none';return;}
    panel.style.display='block';
    const {data:a,error}=await sb.from('settlement_accounts').select('preferred_method,mpesa_name,mpesa_number,mpesa_paybill_till,airtel_name,airtel_number,bank_name,bank_account_name,bank_account_number,status').eq('user_id',session.user.id).maybeSingle();
    if(error){document.getElementById('saCurrent').textContent='Could not load settlement account.';return;}
    if(a){
      document.getElementById('saMethod').value=a.preferred_method||'mpesa';
      document.getElementById('saMpesaName').value=a.mpesa_name||'';document.getElementById('saMpesaNumber').value=a.mpesa_number||'';document.getElementById('saMpesaTill').value=a.mpesa_paybill_till||'';
      document.getElementById('saAirtelName').value=a.airtel_name||'';document.getElementById('saAirtelNumber').value=a.airtel_number||'';
      document.getElementById('saBankName').value=a.bank_name||'';document.getElementById('saBankAccountName').value=a.bank_account_name||'';document.getElementById('saBankAccountNumber').value=a.bank_account_number||'';
      const st=String(a.status||'pending').toLowerCase();document.getElementById('saStatus').innerHTML='<span class="sa-status '+esc(st)+'">'+esc(st)+'</span>';document.getElementById('saCurrent').textContent='Settlement account on file. You can update it below.';
    }else{document.getElementById('saCurrent').textContent='No settlement account has been submitted yet.';document.getElementById('saStatus').textContent='Not submitted';}
    toggle();
  }
  async function save(e){
    e.preventDefault();const msg=document.getElementById('saMessage');msg.className='sa-message';msg.textContent='Saving…';
    const q=await sb.auth.getSession();const session=q.data?.session;if(!session){msg.classList.add('bad');msg.textContent='Please sign in again.';return;}
    const method=document.getElementById('saMethod').value;
    const payload={user_id:session.user.id,preferred_method:method,mpesa_name:document.getElementById('saMpesaName').value.trim()||null,mpesa_number:document.getElementById('saMpesaNumber').value.trim()||null,mpesa_paybill_till:document.getElementById('saMpesaTill').value.trim()||null,airtel_name:document.getElementById('saAirtelName').value.trim()||null,airtel_number:document.getElementById('saAirtelNumber').value.trim()||null,bank_name:document.getElementById('saBankName').value.trim()||null,bank_account_name:document.getElementById('saBankAccountName').value.trim()||null,bank_account_number:document.getElementById('saBankAccountNumber').value.trim()||null};
    if(method==='mpesa'&&!payload.mpesa_number){msg.classList.add('bad');msg.textContent='Enter your M-Pesa number.';return;}if(method==='airtel_money'&&!payload.airtel_number){msg.classList.add('bad');msg.textContent='Enter your Airtel Money number.';return;}if(method==='bank'&&(!payload.bank_name||!payload.bank_account_name||!payload.bank_account_number)){msg.classList.add('bad');msg.textContent='Complete the bank details.';return;}
    const {error}=await sb.from('settlement_accounts').upsert(payload,{onConflict:'user_id'});
    if(error){msg.classList.add('bad');msg.textContent='Could not save: '+error.message;return;}
    msg.classList.add('ok');msg.textContent='Settlement account saved. It is now awaiting LEOGO verification.';await load();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
