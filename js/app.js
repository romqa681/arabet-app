const tg=window.Telegram.WebApp;tg.ready();tg.expand();
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString('ru-RU');

let balance=15000,coupon=[],curTab='line',curSport='all';

document.addEventListener('DOMContentLoaded',()=>{
  updateBalance();renderMatches();updateCoupon();
  setInterval(()=>{$('online').textContent=fmt(Math.floor(1000+Math.random()*500));},5000);
});

function updateBalance(){$('balance').textContent=fmt(balance);}

function switchTab(tab,el){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const navMap={line:0,live:1,casino:2};
  if(navMap[tab]!==undefined)document.querySelectorAll('.nav-item')[navMap[tab]].classList.add('active');
  if(tab==='casino')renderCasino();else renderMatches();
}

function filterSport(sport,el){
  curSport=sport;
  document.querySelectorAll('.sport-chip').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  renderMatches();
}

function renderMatches(){
  let m=curTab==='live'?MATCHES.filter(x=>x.live):MATCHES;
  if(curSport!=='all')m=m.filter(x=>x.sport===curSport);
  const c=$('content');
  if(!m.length){c.innerHTML='<div class="empty"><div class="icon">📭</div><p>Нет матчей</p></div>';return;}
  let h='';
  m.forEach(x=>{
    const ti=x.live?`<span class="live-tag">🔴 LIVE ${x.min}'</span>`:`🕐 ${x.tm}`;
    const s1=x.live&&x.sc?`<div class="team-score live">${x.sc[0]}</div>`:'';
    const s2=x.live&&x.sc?`<div class="team-score live">${x.sc[1]}</div>`:'';
    const xb=x.odd.x?`<div class="odd-btn" data-id="${x.id}" data-tp="x" data-od="${x.odd.x}" data-nm="X" onclick="toggleBet(this)"><div class="odd-type">X</div><div class="odd-val">${x.odd.x}</div></div>`:'';
    h+=`<div class="match-card ${x.live?'live':''}"><div class="match-head"><span>${x.lg}</span>${ti}</div><div class="match-teams"><div class="team"><div class="team-name">${x.t1}</div>${s1}</div><div class="match-vs">VS</div><div class="team"><div class="team-name">${x.t2}</div>${s2}</div></div><div class="match-odds"><div class="odd-btn" data-id="${x.id}" data-tp="w1" data-od="${x.odd.w1}" data-nm="П1" onclick="toggleBet(this)"><div class="odd-type">П1</div><div class="odd-val">${x.odd.w1}</div></div>${xb}<div class="odd-btn" data-id="${x.id}" data-tp="w2" data-od="${x.odd.w2||x.odd.w1}" data-nm="П2" onclick="toggleBet(this)"><div class="odd-type">П2</div><div class="odd-val">${x.odd.w2||x.odd.w1}</div></div></div></div>`;
  });
  c.innerHTML=h;highlightOdds();
}

function toggleBet(el){
  const id=parseInt(el.dataset.id),tp=el.dataset.tp,od=parseFloat(el.dataset.od),nm=el.dataset.nm;
  const match=MATCHES.find(x=>x.id===id);if(!match)return;
  const idx=coupon.findIndex(b=>b.id===id&&b.tp===tp);
  if(idx>=0){coupon.splice(idx,1);}else{coupon.push({id,tp,od,nm,matchName:`${match.t1} vs ${match.t2}`,lg:match.lg});}
  updateCoupon();highlightOdds();if(coupon.length)openCoupon();
}

function updateCoupon(){
  $('cpCount').textContent=coupon.length;$('navBadge').textContent=coupon.length;
  $('navBadge').style.display=coupon.length?'block':'none';
  const c=$('cpItems');
  if(!coupon.length){c.innerHTML='<div class="empty"><p>Добавьте события</p></div>';$('cpOdd').textContent='1.00';$('cpWin').textContent='0 ₽';return;}
  let h='',tc=1;
  coupon.forEach((b,i)=>{tc*=b.od;h+=`<div class="coupon-item"><div style="color:var(--text3);font-size:0.7rem;">${b.lg}</div><div>${b.matchName}</div><div style="display:flex;justify-content:space-between;margin-top:4px;"><span style="color:var(--primary);">${b.nm} @ ${b.od}</span><span class="remove" onclick="removeBet(${i})">✕</span></div></div>`;});
  c.innerHTML=h;$('cpOdd').textContent=tc.toFixed(2);
  const stake=parseFloat($('cpStake')?.value)||500;$('cpWin').textContent=fmt(Math.round(stake*tc))+' ₽';
}

function removeBet(i){coupon.splice(i,1);updateCoupon();highlightOdds();}
function clearCoupon(){coupon=[];updateCoupon();highlightOdds();}

function highlightOdds(){
  document.querySelectorAll('.odd-btn').forEach(b=>b.classList.remove('selected'));
  coupon.forEach(b=>{document.querySelectorAll(`.odd-btn[data-id="${b.id}"][data-tp="${b.tp}"]`).forEach(el=>el.classList.add('selected'));});
}

function toggleCoupon(){$('coupon').classList.toggle('open');}
function openCoupon(){$('coupon').classList.add('open');}

function placeBet(){
  if(!coupon.length){tg.showAlert('Добавьте события в купон!');return;}
  const stake=parseFloat($('cpStake')?.value)||500;
  if(stake<10){tg.showAlert('Минимальная ставка: 10 ₽');return;}
  if(stake>balance){tg.showAlert('Недостаточно средств!');return;}
  const tc=coupon.reduce((a,b)=>a*b.od,1);
  balance-=stake;updateBalance();
  tg.showAlert('✅ СТАВКА ПРИНЯТА!\n\n📋 '+coupon.length+' событий\n💰 '+stake+' ₽\n📊 Кэф: '+tc.toFixed(2)+'\n🏆 Выигрыш: '+fmt(Math.round(stake*tc))+' ₽\n\n🍀 УДАЧИ!\n@romqa68');
  coupon=[];updateCoupon();highlightOdds();
}

function renderCasino(){
  $('content').innerHTML=`<div class="casino-grid">
    <div class="casino-card" onclick="tg.showAlert('🎰 Слоты — скоро!\n@romqa68')"><div class="game-icon">🎰</div><div class="game-name">Слоты</div><div class="game-info">Gates of Olympus</div></div>
    <div class="casino-card" onclick="startCrash()"><div class="game-icon">🚀</div><div class="game-name">ARA Crash</div><div class="game-info">До x1000</div></div>
    <div class="casino-card" onclick="tg.showAlert('🎡 Рулетка — скоро!\n@romqa68')"><div class="game-icon">🎡</div><div class="game-name">Рулетка</div><div class="game-info">RTP 97.3%</div></div>
    <div class="casino-card" onclick="tg.showAlert('🃏 Блэкджек — скоро!\n@romqa68')"><div class="game-icon">🃏</div><div class="game-name">Блэкджек</div><div class="game-info">RTP 99.5%</div></div>
  </div>`;
}

function startCrash(){
  if(balance<50){tg.showAlert('Минимум 50 ₽ для Crash!');return;}
  balance-=50;updateBalance();
  const crash=1+Math.random()*10;
  setTimeout(()=>{
    const won=Math.random()>0.4;
    if(won){const win=Math.round(50*crash);balance+=win;updateBalance();tg.showAlert('🚀 ЗАБРАЛ НА '+crash.toFixed(2)+'x!\n+'+win+' ₽');}
    else{tg.showAlert('💥 КРАШ на '+crash.toFixed(2)+'x\nПотеряно 50 ₽');}
  },2000);
  tg.showAlert('🚀 Crash запущен! Множитель растёт...');
}

function showProfile(){tg.showAlert('👑 ARAWINBET\n@romqa68\nID: 1458632670\nБаланс: '+fmt(balance)+' ₽\nСтатус: Владелец\n\n💳 Пополнение/вывод:\n@romqa68');}

document.addEventListener('input',e=>{if(e.target.id==='cpStake')updateCoupon();});
