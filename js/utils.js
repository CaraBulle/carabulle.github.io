// ==================== FONCTIONS UTILITAIRES ====================
function getProductionTime(c, l) {
  let t = BASE_CYCLE_GAME_MINUTES * c;
  if (l.includes('Drone')) t *= 0.6;
  else if (l.includes('Batterie')) t *= 1.5;
  else if (l.includes('Panneau')) t *= 1.3;
  else if (l.includes('Turbine')) t *= 1.8;
  else if (l.includes('Servo')) t *= 1.4;
  else if (l.includes('Circuit')) t *= 1.6;
  else if (l.includes('Planche')) t *= 0.3;
  else if (l.includes('Tissu')) t *= 0.4;
  return Math.max(1, Math.round(t));
}

function generateCompetency() {
  let r = Math.random();
  if (r < 0.7) return 30 + Math.floor(Math.random() * 31);
  if (r < 0.85) return 61 + Math.floor(Math.random() * 25);
  if (r < 0.95) return 20 + Math.floor(Math.random() * 10);
  if (r < 0.99) return 85 + Math.floor(Math.random() * 15);
  return 100;
}

function generateEmployee(g = null) {
  let m = g === true ? true : g === false ? false : Math.random() > 0.5;
  let fn = m ? MALE_FIRST_NAMES[Math.floor(Math.random() * MALE_FIRST_NAMES.length)] : FEMALE_FIRST_NAMES[Math.floor(Math.random() * FEMALE_FIRST_NAMES.length)];
  let ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  let eff = generateCompetency();
  let spd = generateCompetency();
  let baseWage = 500;
  let wageMod = 1;
  if (eff >= 50 || spd >= 50) wageMod = 1 + (Math.max(eff, spd) - 50) / 250;
  else wageMod = 1 - (50 - Math.min(eff, spd)) / 333;
  let wage = Math.round(baseWage * (m ? wageMod : wageMod * (0.95 + Math.random() * 0.05)));
  return {
    name: `${fn} ${ln}`,
    gender: m ? 'Homme' : 'Femme',
    genderIcon: m ? '♂' : '♀',
    wage,
    vacationDaysLeft: 0,
    lastVacationReset: gameTime.getTime(),
    job: JOB_TYPES.NONE,
    happiness: 70 + Math.floor(Math.random() * 20),
    efficiency: eff,
    speed: spd,
    inTraining: false,
    trainingEndTime: null
  };
}

function generateCandidates() {
  let c = [];
  for (let i = 0; i < 3; i++) c.push(generateEmployee());
  return c;
}

function getHireCost() {
  return Math.max(0, (hireCount - 1) * 1000);
}

function initPrices() {
  let p = {};
  MATERIALS.forEach(m => p[m.name] = m.base);
  return p;
}

function initUtilityPrices() {
  let p = {};
  UTILITIES_DEF.forEach(u => p[u.id] = u.basePricePerUnit);
  return p;
}

function newState() {
  let s = {};
  MATERIALS.forEach(m => s[m.name] = 0);
  return {
    cash: 100000,
    employees: 5,
    machines: 1,
    materialsStock: s,
    prices: initPrices(),
    demandMult: 1.0,
    prodMult: 1.0,
    totalEarned: 0,
    totalSpent: 0,
    activeProductions: {},
    productStocks: {},
    productDemands: {},
    totalUtilitySpent: 0
  };
}

function genProducts() {
  products = PRODUCTS_DEF.map((d, i) => {
    let c = d.mats.reduce((s, m) => s + (MAT_MAP[m.name]?.base || 0) * m.qty, 0);
    let pt = getProductionTime(d.complexity, d.name);
    return {
      id: i,
      name: d.name,
      complexity: d.complexity,
      mats: d.mats.map(m => m.name),
      qtyPerMatMap: d.mats.reduce((a, m) => { a[m.name] = m.qty; return a; }, {}),
      reqMachines: d.reqM,
      reqEmployees: d.reqE,
      productionTimeGame: pt,
      productionTimeReal: Math.round(pt / REAL_TO_GAME_RATIO * 60000),
      basePrice: Math.round(c * (2.2 + Math.random() * 0.8)),
      baseDemand: d.demand
    };
  });
  products.forEach(p => {
    if (!S.productStocks[p.id]) S.productStocks[p.id] = 0;
    if (!S.productDemands[p.id]) S.productDemands[p.id] = p.baseDemand;
  });
}

function initMachines() {
  machines = [];
  for (let i = 0; i < S.machines; i++) {
    machines.push({ id: i, name: `Machine ${i + 1}`, usage: MACHINE_MAX_USAGE, broken: false, stopped: false });
  }
}

function initEmployees() {
  employees = [];
  employees.push(generateEmployee(false));
  employees.push(generateEmployee(false));
  employees.push(generateEmployee(true));
  employees.push(generateEmployee(true));
  for (let i = 4; i < S.employees; i++) employees.push(generateEmployee());
}

function getAvailableMachines() { return machines.filter(m => !m.broken && !m.stopped); }
function getFunctionalMachinesCount() { return machines.filter(m => !m.broken).length; }
function getBrokenMachinesCount() { return machines.filter(m => m.broken).length; }
function usedMachinesCount() { return Object.values(S.activeProductions).reduce((s, a) => s + (a.machinesUsed?.length || 0), 0); }
function freeMachinesCount() { return getAvailableMachines().length - usedMachinesCount(); }
function usedEmployeesCount() { return Object.values(S.activeProductions).reduce((s, a) => s + a.employeesUsed, 0); }
function productionEmployeesCount() { return employees.filter(e => e.job !== JOB_TYPES.CLEANER && e.job !== JOB_TYPES.MAINTENANCE && e.job !== JOB_TYPES.HANDLER && !e.inTraining).length; }
function freeEmployeesCount() { return productionEmployeesCount() - usedEmployeesCount(); }
function getEmployeesInTrainingCount() { return employees.filter(e => e.inTraining).length; }

function getCleanerBreakdownReduction() {
  let m = employees.filter(e => e.job === JOB_TYPES.MAINTENANCE && !e.inTraining).length;
  let c = employees.filter(e => e.job === JOB_TYPES.CLEANER && !e.inTraining).length;
  return Math.min(0.5, m * 0.15 + c * 0.10);
}

function calculateEmployeeHappiness(e) {
  let h = 75;
  let avg = employees.reduce((s, x) => s + x.wage, 0) / employees.length;
  if (e.wage < avg * 0.9) h -= 5;
  if (e.wage > avg * 1.1) h += 3;
  resetVacationIfNeeded(e);
  if (e.vacationDaysLeft > 10) h += 5;
  if (e.vacationDaysLeft < 3) h -= 5;
  if (e.job === JOB_TYPES.SITE_MANAGER) h += 10;
  if (e.job === JOB_TYPES.LINE_MANAGER) h += 5;
  if (e.job === JOB_TYPES.NONE) h -= 10;
  if (e.inTraining) h += 2;
  if (bonusTotalMonth > 0 && bonusLog.some(b => b.name === e.name)) h += 8;
  return Math.max(0, Math.min(100, Math.round(h)));
}

function updateAllEmployeesHappiness() { employees.forEach(e => e.happiness = calculateEmployeeHappiness(e)); }
function calculateAverageHappiness() { if (!employees.length) return 75; return Math.round(employees.reduce((s, e) => s + e.happiness, 0) / employees.length); }

function updateHappinessBar() {
  let a = calculateAverageHappiness();
  let f = document.getElementById('happiness-fill');
  if (f) { f.style.width = a + '%'; f.className = 'happiness-fill ' + (a >= 70 ? 'high' : a >= 40 ? 'medium' : 'low'); }
  document.getElementById('happiness-value').textContent = a + '%';
}

function refreshAllHappiness() {
  updateAllEmployeesHappiness();
  updateHappinessBar();
  if (document.getElementById('panel-employees').classList.contains('open')) renderEmployeePanel();
}

function fmt(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }
function fmtNum(n) { return Math.round(n).toLocaleString('fr-FR'); }

function updateUI() {
  document.getElementById('tb-cash').textContent = fmt(S.cash);
  document.getElementById('tb-mfree').textContent = freeMachinesCount();
  document.getElementById('tb-mtotal').textContent = machines.length;
  document.getElementById('tb-efree').textContent = freeEmployeesCount();
  document.getElementById('tb-etotal').textContent = S.employees;
  document.getElementById('k-cash').textContent = fmt(S.cash);
  document.getElementById('k-earned').textContent = fmt(S.totalEarned);
  document.getElementById('k-pstock').textContent = products.reduce((s, p) => s + (S.productStocks[p.id] || 0), 0);
  document.getElementById('k-active').textContent = Object.keys(S.activeProductions).length;
  document.getElementById('k-demand').textContent = Math.round(S.demandMult * 100) + '%';
  updateHappinessBar();
  renderLogs();
  updateDashboardWidgets();
  updateTooltips();
}

function updateTooltips() {
  let mt = document.getElementById('machines-tooltip');
  if (mt) mt.innerHTML = `<b>Machines</b><br>Total : ${machines.length}<br>Disponibles : ${freeMachinesCount()}<br>En panne : ${getBrokenMachinesCount()}<br>Arrêtées : ${machines.filter(m => m.stopped).length}`;
  let et = document.getElementById('employees-tooltip');
  if (et) et.innerHTML = `<b>Employés</b><br>Total : ${S.employees}<br>Disponibles : ${freeEmployeesCount()}<br>Occupés : ${usedEmployeesCount()}<br>En formation : ${getEmployeesInTrainingCount()}`;
}

function logProd(m, t = '') {
  let n = gameTime;
  let ti = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  logProdEntries.unshift({ time: ti, msg: m, type: t });
  if (logProdEntries.length > 30) logProdEntries.pop();
  renderLogs();
}

function logAcc(m, t = '') {
  let n = gameTime;
  let ti = `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  logAccEntries.unshift({ time: ti, msg: m, type: t });
  if (logAccEntries.length > 50) logAccEntries.pop();
  renderLogs();
}

function renderLogs() {
  let p = document.getElementById('log-prod-list'), a = document.getElementById('log-acc-list'), ap = document.getElementById('accounting-log-list');
  if (p) p.innerHTML = logProdEntries.slice(0, 15).map(e => `<div class="log-item"><span class="log-time">${e.time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`).join('');
  if (a) a.innerHTML = logAccEntries.slice(0, 15).map(e => `<div class="log-item"><span class="log-time">${e.time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`).join('');
  if (ap) ap.innerHTML = logAccEntries.map(e => `<div class="log-item"><span class="log-time">${e.time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`).join('');
}

function updateTimers() {
  document.getElementById('real-time').textContent = new Date().toLocaleTimeString('fr-FR');
  let m = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  document.getElementById('game-time').textContent = `${gameTime.getDate()} ${m[gameTime.getMonth()]} ${gameTime.getFullYear()} ${String(gameTime.getHours()).padStart(2, '0')}:${String(gameTime.getMinutes()).padStart(2, '0')}`;
}

function advanceGameTime(r) { gameTime = new Date(gameTime.getTime() + r * REAL_TO_GAME_RATIO); updateTimers(); }
function pushChart() { if (!S) return; chartHistory.push({ cash: S.cash, gameTs: gameTime.getTime() }); }
function resetVacationIfNeeded(e) { let d = (gameTime.getTime() - e.lastVacationReset) / 86400000; if (d >= SIX_MONTHS_GAME_DAYS) { e.vacationDaysLeft = VACATION_DAYS_PER_6MONTHS; e.lastVacationReset = gameTime.getTime(); } }
function formatTimeRemaining(r) { let g = r * REAL_TO_GAME_RATIO / 1000, s = Math.floor(g); if (s < 60) return s + 's'; let m = Math.floor(s / 60); return m + 'm ' + s % 60 + 's'; }
function formatProductionTime(g) { if (g < 60) return g + 'm'; let h = Math.floor(g / 60); return h + 'h' + (g % 60 > 0 ? g % 60 + 'm' : ''); }

function checkBankruptcy() { if (S && S.cash <= -250000) { clearAllTimers(); document.getElementById('bankruptcy-overlay').style.display = 'flex'; } }
function declareBankruptcy() { document.getElementById('bankruptcy-overlay').style.display = 'none'; S = null; showScreen('menu'); }
function closeTutorial() { document.getElementById('tutorial-overlay').style.display = 'none'; startGame(); }
function startNewGame() { document.getElementById('tutorial-overlay').style.display = 'flex'; }
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(`screen-${id}`).classList.add('active'); }

function toast(m, t = '') {
  let e = document.getElementById('toast');
  e.textContent = m;
  e.className = t ? `show ${t}` : 'show';
  clearTimeout(toastT);
  toastT = setTimeout(() => e.classList.remove('show'), 2800);
}

function showConfirm(t, m, c, actions = null) {
  document.getElementById('confirm-title').textContent = t;
  document.getElementById('confirm-message').innerHTML = m;
  confirmCallback = c;
  let a = document.getElementById('confirm-actions');
  if (actions) { a.innerHTML = actions; }
  else {
    a.innerHTML = `<button class="tb-btn" onclick="closeConfirm()">Annuler</button><button class="tb-btn danger" id="confirm-ok">Confirmer</button>`;
    document.getElementById('confirm-ok').onclick = () => { if (confirmCallback) confirmCallback(); closeConfirm(); };
  }
  document.getElementById('confirm-overlay').style.display = 'flex';
}

function closeConfirm() { document.getElementById('confirm-overlay').style.display = 'none'; }

function saveGame() {
  if (!S) return;
  localStorage.setItem('bsp5', JSON.stringify({ S, products, chartHistory, logProdEntries, logAccEntries, gameTime: gameTime.getTime(), machines, employees, pendingTaxes, currentLoan, utilityPrices, activeContracts, repairsInProgress, hireCount }));
  toast('Sauvegardé ✓', 'ok');
}

function loadGame(s = 'bsp5') {
  let d = JSON.parse(localStorage.getItem(s));
  if (!d) return;
  S = d.S; products = d.products; chartHistory = d.chartHistory; logProdEntries = d.logProdEntries || []; logAccEntries = d.logAccEntries || [];
  gameTime = new Date(d.gameTime); machines = d.machines; employees = d.employees; pendingTaxes = d.pendingTaxes || 0;
  currentLoan = d.currentLoan || { amount: 0, total: 0, remaining: 0 }; utilityPrices = d.utilityPrices || initUtilityPrices();
  activeContracts = d.activeContracts || []; repairsInProgress = d.repairsInProgress || {}; hireCount = d.hireCount || 0;
  showScreen('game'); initChart(); startTimers(); updateUI(); refreshAllHappiness(); toast('Partie chargée ✓', 'ok');
}

function backToMenu() { clearAllTimers(); showScreen('menu'); }