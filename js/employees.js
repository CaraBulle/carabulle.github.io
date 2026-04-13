// ==================== EMPLOYÉS ====================
function openHireOverlay() { currentCandidates = generateCandidates(); selectedCandidate = null; renderCandidates(); updateHireCostDisplay(); document.getElementById('hire-overlay').style.display = 'flex'; }
function closeHireOverlay() { document.getElementById('hire-overlay').style.display = 'none'; }

function renderCandidates() {
  document.getElementById('candidates-grid').innerHTML = currentCandidates.map((c, i) => `
    <div class="candidate-card ${selectedCandidate === i ? 'selected' : ''}" onclick="selectCandidate(${i})">
      <div class="candidate-name">${c.genderIcon} ${c.name}</div><div class="candidate-gender">${c.gender}</div>
      <div class="candidate-stats"><div class="candidate-stat"><span>Efficacité</span><span style="color:var(--green)">${c.efficiency}%</span></div>
      <div class="candidate-stat"><span>Rapidité</span><span style="color:var(--blue)">${c.speed}%</span></div><div class="candidate-stat"><span>Bonheur</span><span>${c.happiness}%</span></div></div>
      <div class="candidate-salary">${c.wage} €/j</div>
    </div>`).join('');
  document.getElementById('hire-confirm-btn').disabled = selectedCandidate === null;
}

function selectCandidate(i) { selectedCandidate = i; renderCandidates(); }

function refreshCandidates() {
  let c = getHireCost(); if (S.cash < c) { toast('Fonds insuffisants !', 'err'); return; }
  if (c > 0) { S.cash -= c; S.totalSpent += c; }
  hireCount++; currentCandidates = generateCandidates(); selectedCandidate = null; renderCandidates(); updateHireCostDisplay(); updateUI();
}

function updateHireCostDisplay() { let c = getHireCost(); document.getElementById('hire-cost-display').textContent = c === 0 ? 'Gratuit' : fmt(c); document.getElementById('refresh-cost').textContent = c === 0 ? 'Gratuit' : fmt(c); }

function confirmHire() {
  if (selectedCandidate === null) return; let c = getHireCost(); if (S.cash < c) { toast('Fonds insuffisants !', 'err'); return; }
  if (c > 0) { S.cash -= c; S.totalSpent += c; }
  employees.push(currentCandidates[selectedCandidate]); S.employees++; hireCount++;
  closeHireOverlay(); updateUI(); pushChart(); refreshAllHappiness(); if (document.getElementById('panel-employees').classList.contains('open')) renderEmployeePanel();
}

function giveVacation(i) { let e = employees[i]; if (!e) return; resetVacationIfNeeded(e); if (e.vacationDaysLeft < 7) { toast('Pas assez de vacances', 'err'); return; } e.vacationDaysLeft -= 7; refreshAllHappiness(); renderEmployeePanel(); }

function fireSpecificEmployee(i) {
  if (S.employees <= 1) return; let e = employees[i];
  showConfirm('Licencier ?', `Licencier ${e.name} ? (1 000 €)`, () => {
    employees.splice(i, 1); S.cash -= 1000; S.employees--; S.totalSpent += 1000;
    updateUI(); pushChart(); renderEmployeePanel(); refreshAllHappiness();
  });
}

function toggleDropdown(t) { let c = document.getElementById(`dropdown-content-${t}`); document.querySelectorAll('.dropdown-content').forEach(d => { if (d !== c) d.classList.remove('show'); }); c.classList.toggle('show'); }

function assignSelectedToJob(j) {
  let s = selectedEmployees[j] || []; if (!s.length) return;
  let m = { maintenance: JOB_TYPES.MAINTENANCE, cleaner: JOB_TYPES.CLEANER, lineManager: JOB_TYPES.LINE_MANAGER, siteManager: JOB_TYPES.SITE_MANAGER, handler: JOB_TYPES.HANDLER };
  s.forEach(i => { if (!employees[i].inTraining) employees[i].job = m[j]; });
  selectedEmployees[j] = []; refreshAllHappiness(); renderEmployeePanel(); renderJobsTab(); document.getElementById(`dropdown-content-${j}`).classList.remove('show');
}

function updateSelectedEmployees(t, i, c) { if (!selectedEmployees[t]) selectedEmployees[t] = []; if (c) selectedEmployees[t].push(i); else selectedEmployees[t] = selectedEmployees[t].filter(x => x !== i); }

function renderBonusTab() {
  document.getElementById('bonus-employee-select').innerHTML = '<option value="">— Choisir —</option>' + employees.map((e, i) => `<option value="${i}">${e.genderIcon} ${e.name} — ${e.job}</option>`).join('');
  document.getElementById('bonus-total-month').textContent = fmt(bonusTotalMonth);
  document.getElementById('bonus-log-list').innerHTML = bonusLog.length ? bonusLog.map(b => `<div class="log-item"><span class="log-time">${b.time}</span><span class="log-msg pos">+${b.amount.toLocaleString('fr-FR')} € → ${b.name}</span></div>`).join('') : '<div style="color:var(--muted)">Aucune prime</div>';
}

function giveBonusToEmployee() {
  let i = parseInt(document.getElementById('bonus-employee-select').value); if (isNaN(i)) return;
  let a = parseInt(document.getElementById('bonus-amount').value) || 0; if (a <= 0 || S.cash < a) return;
  let e = employees[i]; S.cash -= a; S.totalSpent += a; bonusTotalMonth += a;
  bonusLog.unshift({ time: new Date().toLocaleTimeString(), name: e.name, amount: a });
  logAcc(`Prime ${e.name} : -${fmt(a)}`, 'neg'); updateUI(); pushChart(); renderBonusTab(); refreshAllHappiness();
}

// ==================== FORMATION ====================
function getTrainingCost(emp) { let base = 200; let avg = (emp.efficiency + emp.speed) / 2; if (avg > 60) base += Math.floor((avg - 60) * 5); if (avg > 80) base += Math.floor((avg - 80) * 10); return base; }
function updateTrainingCost() { let s = selectedEmployees.training || []; let t = 0; s.forEach(i => t += getTrainingCost(employees[i])); document.getElementById('training-total-cost').textContent = fmt(t); }

function startTraining() {
  let s = selectedEmployees.training || []; if (!s.length) { toast('Sélectionnez des employés', 'err'); return; }
  let t = 0; s.forEach(i => t += getTrainingCost(employees[i])); if (S.cash < t) { toast('Fonds insuffisants', 'err'); return; }
  S.cash -= t; S.totalSpent += t; let now = gameTime.getTime();
  s.forEach(i => { let e = employees[i]; e.inTraining = true; e.trainingEndTime = now + TRAINING_DURATION_GAME_DAYS * 86400000; let hChange = Math.floor(Math.random() * 11) - 5; e.happiness = Math.max(0, Math.min(100, e.happiness + hChange)); });
  selectedEmployees.training = []; logAcc(`Formation de ${s.length} employé(s) : -${fmt(t)}`, 'neg'); toast(`${s.length} employé(s) en formation`, 'ok');
  updateUI(); pushChart(); renderEmployeePanel(); renderTrainingTab();
}

function checkTraining() {
  let now = gameTime.getTime(); let updated = false;
  employees.forEach(e => {
    if (e.inTraining && e.trainingEndTime && now >= e.trainingEndTime) {
      e.inTraining = false; let gain = 5 + Math.floor(Math.random() * 11); let effGain = 0, spdGain = 0;
      if (e.efficiency < 100) { effGain = Math.min(gain, 100 - e.efficiency); gain -= effGain; e.efficiency += effGain; }
      if (gain > 0 && e.speed < 100) { spdGain = Math.min(gain, 100 - e.speed); e.speed += spdGain; }
      logProd(`${e.name} a terminé sa formation (+${effGain}% eff, +${spdGain}% vit)`, 'pos'); updated = true;
    }
  });
  if (updated) { updateUI(); if (document.getElementById('panel-employees').classList.contains('open')) { renderEmployeePanel(); renderTrainingTab(); } }
}

function renderTrainingTab() {
  let av = employees.map((e, i) => ({ ...e, index: i })).filter(e => !e.inTraining);
  let dd = document.getElementById('dropdown-content-training');
  if (dd) dd.innerHTML = av.map(e => `<label class="dropdown-item"><input type="checkbox" value="${e.index}" onchange="updateSelectedEmployees('training',${e.index},this.checked);updateTrainingCost()"><span class="emp-info"><span class="emp-name">${e.genderIcon} ${e.name}</span><span class="emp-details">Eff:${e.efficiency}% Vit:${e.speed}% · Coût:${getTrainingCost(e)}€</span></span></label>`).join('');
  let tl = document.getElementById('training-list');
  if (tl) { let te = employees.filter(e => e.inTraining); tl.innerHTML = te.length ? te.map(e => { let d = Math.max(0, Math.ceil((e.trainingEndTime - gameTime.getTime()) / 86400000)); return `<div class="log-item"><span>${e.name}</span><span>${d} jours restants</span></div>`; }).join('') : '<div class="empty-widget">Aucun employé en formation</div>'; }
  updateTrainingCost();
}