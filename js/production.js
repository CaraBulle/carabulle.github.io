// ==================== PRODUCTION ====================
function runProductionCycle(id) {
  let p = products.find(x => x.id == id); if (!p) return;
  let a = S.activeProductions[id]; if (!a) return;
  if (a.cyclesDone >= a.cyclesTotal) { stopProductionInternal(id, true); return; }
  if (!p.mats.every(m => (S.materialsStock[m] || 0) >= (p.qtyPerMatMap[m] || 1))) { stopProductionInternal(id, false); return; }
  if (a.machinesUsed && !a.machinesUsed.every(mid => { let m = machines.find(x => x.id === mid); return m && !m.broken && !m.stopped; })) { stopProductionInternal(id, false); return; }
  p.mats.forEach(m => S.materialsStock[m] -= (p.qtyPerMatMap[m] || 1));
  S.productStocks[p.id] = (S.productStocks[p.id] || 0) + 1;
  a.cyclesDone++; a.cycleStartTime = Date.now();
  if (a.machinesUsed) useMachines(a.machinesUsed);
  logProd(`1× ${p.name} → ${S.productStocks[p.id]} (${a.cyclesDone}/${a.cyclesTotal})`, 'info');
  updateUI(); pushChart(); checkContractProgress();
  if (a.cyclesDone >= a.cyclesTotal) stopProductionInternal(id, true);
  if (document.getElementById('panel-production').classList.contains('open')) renderProdPanel();
}

function stopProductionInternal(id, c) {
  if (productionTimers[id]) { clearInterval(productionTimers[id]); delete productionTimers[id]; }
  delete S.activeProductions[id];
  if (c) logProd(`Production terminée`, 'pos');
  renderProdPanel(); updateUI();
}

function startProduction(id, cy, mids) {
  let p = products.find(x => x.id == id); if (!p) return;
  if (mids.length !== p.reqMachines || !mids.every(mid => { let m = machines.find(x => x.id === mid); return m && !m.broken && !m.stopped; })) { toast('Machines indisponibles', 'err'); return; }
  if (freeEmployeesCount() < p.reqEmployees) { toast('Employés insuffisants', 'err'); return; }
  if (!p.mats.every(m => (S.materialsStock[m] || 0) >= (p.qtyPerMatMap[m] || 1))) { toast('Matières insuffisantes', 'err'); return; }
  let max = Math.min(...p.mats.map(m => Math.floor((S.materialsStock[m] || 0) / (p.qtyPerMatMap[m] || 1))));
  let fc = Math.min(cy, max);
  S.activeProductions[id] = { machinesUsed: mids, employeesUsed: p.reqEmployees, cyclesTotal: fc, cyclesDone: 0, cycleStartTime: Date.now() };
  if (productionTimers[id]) clearInterval(productionTimers[id]);
  productionTimers[id] = setInterval(() => runProductionCycle(id), p.productionTimeReal);
  logProd(`Production : ${p.name} (${fc} produits, ${formatProductionTime(p.productionTimeGame)}/produit)`, 'info');
  renderProdPanel(); updateUI(); toast(`${p.name} — ${fc} produits`, 'ok');
}

function confirmStopProduction(id, n) { showConfirm('Arrêter ?', `Arrêter "${n}" ?`, () => stopProductionInternal(id, false)); }

function useMachines(mids) {
  mids.forEach(id => {
    let m = machines.find(x => x.id === id);
    if (m && !m.broken && !m.stopped) {
      m.usage = Math.max(0, m.usage - MACHINE_USAGE_PER_PRODUCT);
      let bc = 0.3 * (1 - getCleanerBreakdownReduction());
      if (m.usage <= MACHINE_BREAKDOWN_THRESHOLD && Math.random() < bc) { m.broken = true; logProd(`⚠️ ${m.name} en panne !`, 'neg'); }
    }
  });
}

function startRepair(id) {
  let m = machines.find(x => x.id === id); if (!m || !m.broken || repairsInProgress[id]) return;
  if (S.cash < 500) { toast('Fonds insuffisants', 'err'); return; }
  S.cash -= 500; S.totalSpent += 500;
  repairsInProgress[id] = { endTime: Date.now() + REPAIR_TIME_REAL, cost: 500, machineName: m.name };
  logAcc(`Début réparation ${m.name} : -500 €`, 'neg'); toast(`Réparation ${m.name} lancée`, 'ok');
  updateUI(); pushChart(); if (document.getElementById('panel-machines').classList.contains('open')) renderMachinesPanel();
}

function checkRepairs() {
  let n = Date.now(), u = false;
  Object.entries(repairsInProgress).forEach(([id, r]) => {
    if (n >= r.endTime) {
      let m = machines.find(x => x.id === parseInt(id));
      if (m) { m.usage = MACHINE_MAX_USAGE; m.broken = false; logProd(`✅ ${m.name} réparée`, 'pos'); }
      delete repairsInProgress[id]; u = true;
    }
  });
  if (u) { updateUI(); if (document.getElementById('panel-machines').classList.contains('open')) renderMachinesPanel(); }
}

function repairAllMachines() {
  let b = machines.filter(m => m.broken && !repairsInProgress[m.id]);
  if (!b.length) { toast('Aucune machine à réparer', ''); return; }
  let c = b.length * 500;
  if (S.cash < c) { toast('Fonds insuffisants', 'err'); return; }
  showConfirm('Réparer tout ?', `${b.length} machines pour ${c} €`, () => b.forEach(m => startRepair(m.id)));
}

function toggleMachineStop(id) {
  let m = machines.find(x => x.id === id); if (!m || m.broken) return;
  m.stopped = !m.stopped;
  if (m.stopped) { Object.entries(S.activeProductions).forEach(([pid, a]) => { if (a.machinesUsed?.includes(id)) stopProductionInternal(parseInt(pid), false); }); }
  updateUI(); if (document.getElementById('panel-machines').classList.contains('open')) renderMachinesPanel(); if (document.getElementById('panel-production').classList.contains('open')) renderProdPanel();
}

function updateRepairProgressBars() {
  if (!document.getElementById('panel-machines').classList.contains('open')) return;
  let n = Date.now();
  Object.entries(repairsInProgress).forEach(([id, r]) => {
    let rem = Math.max(0, r.endTime - n), pct = ((REPAIR_TIME_REAL - rem) / REPAIR_TIME_REAL) * 100, gm = rem * REAL_TO_GAME_RATIO / 1000;
    let f = document.getElementById(`repair-fill-${id}`), t = document.getElementById(`repair-time-${id}`);
    if (f) f.style.width = pct + '%'; if (t) t.textContent = `${Math.floor(gm / 60)}:${String(Math.floor(gm % 60)).padStart(2, '0')}`;
  });
}

function buyMachineAction() {
  if (S.cash < 10000) return;
  S.cash -= 10000; S.machines++; S.totalSpent += 10000;
  machines.push({ id: machines.length, name: `Machine ${machines.length + 1}`, usage: MACHINE_MAX_USAGE, broken: false, stopped: false });
  updateUI(); pushChart(); if (document.getElementById('panel-machines').classList.contains('open')) renderMachinesPanel();
}