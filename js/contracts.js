// ==================== CONTRATS ====================
function generateStateContract() {
  let hp = products.filter(p => p.complexity >= 7); if (!hp.length) return null;
  let numProducts = 2 + Math.floor(Math.random() * 3); let selectedProducts = []; let usedIds = new Set();
  for (let i = 0; i < numProducts && i < hp.length; i++) { let p; do { p = hp[Math.floor(Math.random() * hp.length)]; } while (usedIds.has(p.id)); usedIds.add(p.id); selectedProducts.push({ id: p.id, name: p.name, quantity: (3 + Math.floor(Math.random() * 5)) * 5 }); }
  let totalReward = selectedProducts.reduce((s, p) => { let prod = products.find(x => x.id === p.id); return s + (prod.basePrice * p.quantity * 2); }, 0);
  stateContractBonus = true;
  return { id: 'state_' + Date.now(), client: 'République Française', icon: '🇫🇷', products: selectedProducts, reward: Math.round(totalReward * 1.5), timeLimit: 5400000, status: 'available', isState: true };
}

function refreshContracts() {
  let aa = activeContracts.filter(c => c.status === 'active'), nc = [];
  for (let i = 0; i < 5; i++) {
    if (Math.random() < 0.00003) { let sc = generateStateContract(); if (sc) nc.push(sc); }
    else { let d = CONTRACTS_DEF[Math.floor(Math.random() * CONTRACTS_DEF.length)], p = products.find(x => x.name === d.product); if (p) nc.push({ id: 'c' + Date.now() + i, client: d.client, icon: d.icon, products: [{ id: p.id, name: d.product, quantity: d.quantity }], reward: d.reward, timeLimit: d.timeLimit, status: 'available', isState: false }); }
  }
  activeContracts = [...aa, ...nc.slice(0, 5 - aa.length)];
  if (document.getElementById('panel-contracts').classList.contains('open')) renderContractsPanel();
}

function acceptContract(cid) { let c = activeContracts.find(x => x.id === cid); if (!c || c.status !== 'available') return; c.status = 'active'; c.startTime = Date.now(); c.endTime = Date.now() + c.timeLimit; toast(`Contrat accepté !`, 'ok'); if (document.getElementById('panel-contracts').classList.contains('open')) renderContractsPanel(); }

function cancelContract(cid) {
  let c = activeContracts.find(x => x.id === cid); if (!c || c.status !== 'active') return;
  let penalty = Math.round(c.reward * 0.1);
  showConfirm('Annuler le contrat ?', `L'annulation coûtera ${fmt(penalty)} (10% de la récompense).`, () => {
    if (S.cash < penalty) { toast('Fonds insuffisants !', 'err'); return; }
    S.cash -= penalty; S.totalSpent += penalty; activeContracts = activeContracts.filter(x => x.id !== cid);
    logAcc(`Contrat ${c.client} annulé : -${fmt(penalty)}`, 'neg'); toast('Contrat annulé', 'ok'); updateUI(); pushChart();
    if (document.getElementById('panel-contracts').classList.contains('open')) renderContractsPanel();
  });
}

function checkContractProgress() {
  activeContracts.forEach(c => {
    if (c.status !== 'active') return;
    let allCompleted = c.products.every(p => (S.productStocks[p.id] || 0) >= p.quantity);
    if (allCompleted) {
      c.status = 'completed'; c.products.forEach(p => { S.productStocks[p.id] -= p.quantity; });
      S.cash += c.reward; S.totalEarned += c.reward; logAcc(`Contrat ${c.client} : +${fmt(c.reward)}`, 'pos'); toast(`Contrat complété !`, 'ok'); updateUI(); pushChart();
      setTimeout(() => { activeContracts = activeContracts.filter(x => x.id !== c.id); if (document.getElementById('panel-contracts').classList.contains('open')) renderContractsPanel(); }, 5000);
    } else if (Date.now() > c.endTime) { c.status = 'available'; c.startTime = null; c.endTime = null; }
  });
}

function updateContractProgressBars() {
  if (!document.getElementById('panel-contracts').classList.contains('open')) return;
  activeContracts.forEach(c => {
    if (c.status !== 'active') return;
    let r = Math.max(0, c.endTime - Date.now()), pct = (r / c.timeLimit) * 100, gm = r * REAL_TO_GAME_RATIO / 1000, h = Math.floor(gm / 3600), m = Math.floor((gm % 3600) / 60);
    let fill = document.getElementById(`contract-fill-${c.id}`), time = document.getElementById(`contract-time-${c.id}`), pctEl = document.getElementById(`contract-pct-${c.id}`);
    if (fill) { fill.style.width = pct + '%'; fill.className = 'contract-progress-fill' + (pct < 30 ? ' low' : pct < 70 ? ' medium' : ' high'); }
    if (time) time.textContent = `${h}h ${m}m`; if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  });
}

function renderContractsPanel() {
  let g = document.getElementById('contracts-grid'); if (!g) return;
  if (!activeContracts.length) { g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px">Aucun contrat</div>'; return; }
  g.innerHTML = activeContracts.map(c => {
    let r = c.status === 'active' ? Math.max(0, c.endTime - Date.now()) : c.timeLimit, gr = r * REAL_TO_GAME_RATIO / 1000, h = Math.floor(gr / 3600), m = Math.floor((gr % 3600) / 60), pct = (r / c.timeLimit) * 100, sc = 'available', st = 'Disponible';
    if (c.status === 'active') { sc = 'active'; st = 'En cours'; } else if (c.status === 'completed') { sc = 'completed'; st = 'Terminé'; }
    let isS = c.isState;
    let productsHtml = c.products.map(p => { let stock = S.productStocks[p.id] || 0; let progress = Math.min(stock, p.quantity); let progPct = (progress / p.quantity) * 100; return `<div class="contract-requirement"><span>📦 ${p.name}</span><strong>${progress}/${p.quantity}</strong><div style="width:60px;height:4px;background:var(--border);border-radius:2px;margin-left:8px;overflow:hidden"><div style="width:${progPct}%;height:100%;background:var(--blue);border-radius:2px"></div></div></div>`; }).join('');
    let bonusText = isS ? '<div style="font-size:11px;color:var(--gold);margin-top:4px">🏆 +15% chance Subvention</div>' : '';
    return `<div class="contract-card ${sc} ${isS ? 'state' : ''}"><div class="contract-header"><span class="contract-icon">${c.icon}</span><span class="contract-title">${c.client}</span><span class="contract-badge ${sc} ${isS ? 'state' : ''}">${st}</span></div>${productsHtml}<div class="contract-reward ${isS ? 'state-reward' : ''}"><span>🏆 Récompense :</span><span>${c.reward.toLocaleString('fr-FR')} €</span></div>${bonusText}${c.status === 'active' ? `<div class="contract-progress"><div class="contract-progress-bar"><div class="contract-progress-fill" id="contract-fill-${c.id}" style="width:${pct}%"></div></div><div class="contract-progress-text"><span id="contract-time-${c.id}">${h}h ${m}m</span><span id="contract-pct-${c.id}">${Math.round(pct)}%</span></div></div>` : c.status === 'available' ? `<div class="contract-deadline">⏱️ ${h}h ${m}m</div>` : ''}<div class="contract-actions">${c.status === 'available' ? `<button class="tb-btn green" style="flex:1" onclick="acceptContract('${c.id}')">✅ Accepter</button>` : c.status === 'active' ? `<button class="tb-btn" disabled style="flex:1">⏳ En cours...</button><button class="tb-btn danger" onclick="cancelContract('${c.id}')">❌ Annuler</button>` : `<button class="tb-btn purple" disabled style="flex:1">✨ Terminé !</button>`}</div></div>`;
  }).join('');
}