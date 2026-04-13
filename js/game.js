// ==================== BOUCLE DE JEU ====================
function clearAllTimers() {
  clearTimeout(eventTimer); clearInterval(priceTimer); clearInterval(chartTimer); clearInterval(taxPaymentTimer); clearInterval(loanPaymentTimer); clearInterval(demandUpdateTimer);
  clearInterval(timerBarInterval); clearInterval(progressTimer); clearInterval(autoSaveTimer); clearInterval(realTimeTimer); clearInterval(gameTimeTimer);
  clearInterval(dailyWageTimer); clearInterval(utilityTimer); clearInterval(repairTimer); clearInterval(contractTimer); clearInterval(repairProgressTimer);
  clearInterval(happinessTimer); clearInterval(contractRefreshTimer); clearInterval(trainingTimer); clearInterval(contractProgressTimer); clearInterval(electricityTimer);
  Object.values(productionTimers).forEach(clearInterval);
}

function startTimers() {
  scheduleNextEvent();
  priceTimer = setInterval(fluctuatePrices, 60000);
  chartTimer = setInterval(pushChart, 300000);
  taxPaymentTimer = setInterval(payTaxes, TAX_PAYMENT_INTERVAL_REAL);
  loanPaymentTimer = setInterval(payLoan, LOAN_PAYMENT_INTERVAL_REAL);
  demandUpdateTimer = setInterval(updateDemands, 3600000);
  timerBarInterval = setInterval(updateTimerBar, 1000);
  progressTimer = setInterval(() => { if (document.getElementById('panel-production').classList.contains('open')) updateProductionProgressBars(); }, 100);
  autoSaveTimer = setInterval(() => { if (S) saveGame(); }, 300000);
  realTimeTimer = setInterval(updateTimers, 1000);
  gameTimeTimer = setInterval(() => advanceGameTime(1000), 1000);
  dailyWageTimer = setInterval(payDailyWages, 1440000);
  utilityTimer = setInterval(fluctuateUtilityPrices, 30000);
  repairTimer = setInterval(checkRepairs, 200);
  repairProgressTimer = setInterval(updateRepairProgressBars, 200);
  contractTimer = setInterval(checkContractProgress, 1000);
  contractRefreshTimer = setInterval(refreshContracts, 240000);
  happinessTimer = setInterval(refreshAllHappiness, 5000);
  trainingTimer = setInterval(checkTraining, 60000);
  contractProgressTimer = setInterval(updateContractProgressBars, 1000);
  electricityTimer = setInterval(() => { if (document.getElementById('panel-accounting').classList.contains('open')) renderUtilitiesPanel(); }, 5000);
}

function startGame() {
  S = newState(); genProducts(); cart = {}; logProdEntries = []; logAccEntries = []; chartHistory = [{ cash: S.cash, gameTs: GAME_START_DATE.getTime() }];
  gameTime = new Date(GAME_START_DATE); pendingTaxes = 0; currentLoan = { amount: 0, total: 0, remaining: 0 }; bonusLog = []; bonusTotalMonth = 0;
  utilityPrices = initUtilityPrices(); activeContracts = []; repairsInProgress = {}; hireCount = 0; stateContractBonus = false;
  initMachines(); initEmployees();
  products.forEach(p => { S.productDemands[p.id] = Math.floor(Math.random() * (p.baseDemand + 1)); });
  refreshContracts(); showScreen('game'); initChart(); startTimers(); updateUI(); refreshAllHappiness(); logProd('Partie démarrée !', 'info');
}