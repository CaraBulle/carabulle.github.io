// ==================== POINT D'ENTRÉE PRINCIPAL ====================

// Fonctions XP et niveau
function getXPRequiredForLevel(level) {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += 100 + 20 * (i - 2);
    }
    return total;
}

function getLevelFromXP(xp) {
    let level = 1;
    while (xp >= getXPRequiredForLevel(level + 1)) level++;
    return level;
}

function updateXPDisplay() {
    let level = getLevelFromXP(S.xp);
    let nextXP = getXPRequiredForLevel(level + 1);
    let currentLevelXP = getXPRequiredForLevel(level);
    let xpInLevel = S.xp - currentLevelXP;
    let xpNeeded = nextXP - currentLevelXP;
    let xpBadge = document.getElementById('xp-badge');
    if (xpBadge) xpBadge.textContent = `Niv ${level} · ${xpInLevel}/${xpNeeded} XP`;
    
    let researchBtn = document.getElementById('research-btn');
    if (researchBtn) researchBtn.style.display = level >= 3 ? 'inline-block' : 'none';
    
    let competitorsBtn = document.getElementById('competitors-btn');
    if (competitorsBtn && level >= 5) competitorsBtn.style.display = 'inline-block';
    
    if (level >= 5) {
        let advancedTab = document.querySelector('#machines-tabs .tab:nth-child(2)');
        if (advancedTab) advancedTab.classList.remove('locked');
    }
    if (level >= 15) {
        let proTab = document.querySelector('#machines-tabs .tab:nth-child(3)');
        if (proTab) proTab.classList.remove('locked');
    }
    if (level >= 30) {
        let complexTab = document.querySelector('#machines-tabs .tab:nth-child(4)');
        if (complexTab) complexTab.classList.remove('locked');
    }
    return level;
}

function addXP(amount) {
    if (!S) return;
    let oldLevel = getLevelFromXP(S.xp);
    S.xp += amount;
    let newLevel = getLevelFromXP(S.xp);
    updateXPDisplay();
    if (newLevel > oldLevel) {
        let gain = (newLevel - oldLevel) * 5;
        S.researchPoints += gain;
        if (typeof logProd === 'function') logProd(`🎉 PASSAGE NIVEAU ${newLevel} ! +${gain} points de recherche !`, 'pos');
        toast(`🎉 Félicitations ! Niveau ${newLevel} atteint ! +${gain} points de recherche`, 'ok');
        if (document.getElementById('panel-research')?.classList.contains('open') && typeof renderResearchPanel === 'function') renderResearchPanel();
        if (document.getElementById('panel-production')?.classList.contains('open') && typeof renderProdPanel === 'function') renderProdPanel();
        if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
        if (typeof updateProdTabs === 'function') updateProdTabs();
    }
}

// Fonctions machines
function buyMachineByTier(tier) {
    let level = getLevelFromXP(S.xp);
    let data = MACHINE_TIERS[tier];
    if (level < data.reqLevel) {
        toast(`Niveau ${data.reqLevel} requis pour débloquer cette machine !`, 'err');
        closeBuyMachineOverlay();
        return false;
    }
    if (S.cash < data.price) {
        toast(`Fonds insuffisants ! ${fmt(data.price)} requis`, 'err');
        closeBuyMachineOverlay();
        return false;
    }
    S.cash -= data.price;
    S.totalSpent += data.price;
    updateIncomeExpenseHistory(data.price, false);
    machines.push({
        id: machines.length,
        name: data.name,
        usage: 100,
        broken: false,
        stopped: false,
        tier: tier,
        price: data.price
    });
    if (typeof logAcc === 'function') logAcc(`🛒 Achat ${data.name} : -${fmt(data.price)}`, 'neg');
    if (typeof updateUI === 'function') updateUI();
    if (typeof pushChart === 'function') pushChart();
    if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
    closeBuyMachineOverlay();
    toast(`${data.name} achetée !`, 'ok');
    return true;
}

function openBuyMachineOverlay() {
    let level = getLevelFromXP(S.xp);
    let optionsHtml = '';
    for (let [tier, data] of Object.entries(MACHINE_TIERS)) {
        let unlocked = level >= data.reqLevel;
        let disabled = !unlocked;
        optionsHtml += `<div class="machine-option ${disabled ? 'disabled' : ''}" onclick="${disabled ? '' : 'buyMachineByTier(\'' + tier + '\')'}">
            <div class="machine-option-name">${data.name}</div>
            <div class="machine-option-price">💰 ${data.price.toLocaleString('fr-FR')} €</div>
            <div class="machine-option-level">⭐ Niveau ${data.reqLevel} requis</div>
        </div>`;
    }
    let container = document.getElementById('machine-options-list');
    if (container) container.innerHTML = optionsHtml;
    let overlay = document.getElementById('buy-machine-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function closeBuyMachineOverlay() {
    let overlay = document.getElementById('buy-machine-overlay');
    if (overlay) overlay.style.display = 'none';
}

function repairAllMachines() {
    let broken = machines.filter(m => m.broken && !repairsInProgress[m.id]);
    if (!broken.length) {
        toast('Aucune machine à réparer', '');
        return;
    }
    let cost = broken.length * 500;
    if (S.cash < cost) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    showConfirm('Réparer tout ?', `${broken.length} machines pour ${cost} €`, () => broken.forEach(m => startRepair(m.id)));
}

function startRepair(machineId) {
    let m = machines.find(x => x.id === machineId);
    if (!m || !m.broken || repairsInProgress[machineId]) return;
    if (S.cash < 500) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= 500;
    S.totalSpent += 500;
    updateIncomeExpenseHistory(500, false);
    let repairBonus = getResearchBonus('repairTime');
    repairsInProgress[machineId] = {
        endTime: Date.now() + REPAIR_TIME_REAL * repairBonus,
        cost: 500,
        machineName: m.name
    };
    if (typeof logAcc === 'function') logAcc(`🔧 Début réparation ${m.name} : -500 €`, 'neg');
    toast(`Réparation ${m.name} lancée`, 'ok');
    if (typeof updateUI === 'function') updateUI();
    if (typeof pushChart === 'function') pushChart();
    if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
}

function checkRepairs() {
    let now = Date.now();
    let updated = false;
    Object.entries(repairsInProgress).forEach(([id, repair]) => {
        if (now >= repair.endTime) {
            let m = machines.find(x => x.id === parseInt(id));
            if (m) {
                m.usage = 100;
                m.broken = false;
                if (typeof logProd === 'function') logProd(`✅ ${m.name} réparée`, 'pos');
            }
            delete repairsInProgress[id];
            updated = true;
        }
    });
    if (updated) {
        if (typeof updateUI === 'function') updateUI();
        if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
    }
}

function updateRepairProgressBars() {
    if (!document.getElementById('panel-machines')?.classList.contains('open')) return;
    let now = Date.now();
    Object.entries(repairsInProgress).forEach(([id, repair]) => {
        let totalTime = REPAIR_TIME_REAL;
        let remaining = Math.max(0, repair.endTime - now);
        let percent = ((totalTime - remaining) / totalTime) * 100;
        let gameRemaining = remaining * REAL_TO_GAME_RATIO / 1000;
        let fill = document.getElementById(`repair-fill-${id}`);
        let timeEl = document.getElementById(`repair-time-${id}`);
        if (fill) fill.style.width = percent + '%';
        if (timeEl) timeEl.textContent = `${Math.floor(gameRemaining / 60)}:${String(Math.floor(gameRemaining % 60)).padStart(2, '0')}`;
    });
}

function toggleMachineStop(machineId) {
    let m = machines.find(x => x.id === machineId);
    if (!m || m.broken) return;
    m.stopped = !m.stopped;
    if (m.stopped && typeof stopProductionInternal === 'function') {
        Object.entries(S.activeProductions).forEach(([pid, a]) => {
            if (a.machinesUsed?.includes(machineId)) stopProductionInternal(parseInt(pid), false);
        });
    }
    if (typeof updateUI === 'function') updateUI();
    if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
    if (document.getElementById('panel-production')?.classList.contains('open') && typeof renderProdPanel === 'function') renderProdPanel();
}

function renameMachine(machineId, newName) {
    let m = machines.find(x => x.id === machineId);
    if (m) m.name = newName;
}

// Fonctions événements
function scheduleNextEvent() {
    clearTimeout(eventTimer);
    let delay = 60000 + Math.random() * 3540000;
    eventEndTime = Date.now() + delay;
    eventDuration = delay;
    eventTimer = setTimeout(triggerEvent, delay);
}

function triggerEvent(eventIndex = null) {
    let ev;
    if (eventIndex !== null) {
        ev = EVENTS_DEF[eventIndex];
    } else {
        if (stateContractBonus && Math.random() < 0.15) {
            ev = EVENTS_DEF[4];
            stateContractBonus = false;
        } else {
            ev = EVENTS_DEF[Math.floor(Math.random() * EVENTS_DEF.length)];
        }
    }
    if (ev.label === '💰 Subvention' && stateContractBonus) {
        let delay = 60000 + Math.random() * 3540000;
        eventEndTime = Date.now() + delay * 0.6;
        eventDuration = delay * 0.6;
    }
    currentEvent = { label: ev.label, text: ev.text, type: ev.type };
    ev.fn(S);
    let evBadge = document.getElementById('ev-badge');
    let evText = document.getElementById('ev-text');
    if (evBadge) {
        evBadge.textContent = ev.label;
        evBadge.className = `ev-badge ${ev.type}`;
    }
    if (evText) evText.textContent = ev.text;
    if (typeof logProd === 'function') logProd(`📢 ÉVÉNEMENT : ${ev.label} — ${ev.text}`, ev.type === 'boom' ? 'pos' : ev.type === 'crisis' ? 'neg' : 'info');
    if (typeof updateUI === 'function') updateUI();
    scheduleNextEvent();
}

function updateTimerBar() {
    let remaining = Math.max(0, eventEndTime - Date.now());
    let percent = (remaining / eventDuration) * 100;
    let timerFill = document.getElementById('timer-fill');
    if (timerFill) timerFill.style.width = percent + '%';
    let gameRemaining = remaining * REAL_TO_GAME_RATIO / 1000;
    let hours = Math.floor(gameRemaining / 3600);
    let minutes = Math.floor((gameRemaining % 3600) / 60);
    let evCd = document.getElementById('ev-cd');
    if (evCd) evCd.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Fonctions jeu principales
function startNewGame() {
    console.log("startNewGame called");
    
    if (S) {
        clearAllTimers();
        S = null;
    }
    
    startGame();
    
    let loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    setTimeout(function() {
        if (typeof updateUI === 'function') updateUI();
    }, 100);
}

function closeTutorial() {
    let tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) tutorialOverlay.style.display = 'none';
    if (typeof hideQuestNotification === 'function') hideQuestNotification();
    startGame();
}

function startGame() {
    if (S) {
        clearAllTimers();
        S = null;
    }
    
    currentQuest = null;
    currentQuestActive = null;
    currentResearch = null;
    if (researchInterval) { clearInterval(researchInterval); researchInterval = null; }
    if (questTimer) { clearTimeout(questTimer); }
    if (typeof hideQuestNotification === 'function') hideQuestNotification();
    let questActiveBar = document.getElementById('quest-active-bar');
    if (questActiveBar) questActiveBar.classList.remove('show');
    let questIcon = document.getElementById('quest-icon');
    if (questIcon) questIcon.style.display = 'flex';
    
    S = newState();
    
    if (!S) {
        console.error("Erreur: S n'a pas pu être initialisé");
        return;
    }
    
    gameTime = new Date(GAME_START_DATE);
    
    if (typeof genProducts === 'function') genProducts();
    cart = {};
    logProdEntries = [];
    logAccEntries = [];
    chartHistory = [{ cash: S.cash, gameTs: gameTime.getTime() }];
    
    pendingTaxes = 0;
    currentLoan = { amount: 0, total: 0, remaining: 0 };
    bonusLog = [];
    bonusTotalMonth = 0;
    utilityPrices = initUtilityPrices();
    activeContracts = [];
    repairsInProgress = {};
    hireCount = 0;
    stateContractBonus = false;
    currentEvent = null;
    eventEndTime = 0;
    eventDuration = 0;
    incomeHistory = [];
    expenseHistory = [];
    machineSelections = {};
    
    if (typeof initCompetitors === 'function') initCompetitors();
    if (typeof initResearches === 'function') initResearches();
    if (typeof initMachines === 'function') initMachines();
    if (typeof initEmployees === 'function') initEmployees();
    
    if (products) {
        products.forEach(p => {
            S.productDemands[p.id] = Math.floor(Math.random() * (p.baseDemand + 1));
        });
    }
    if (typeof refreshContracts === 'function') refreshContracts();
    showScreen('game');
    chartView = 'realtime';
    if (typeof initMainChart === 'function') initMainChart();
    if (typeof startTimers === 'function') startTimers();
    if (typeof updateUI === 'function') updateUI();
    if (typeof refreshAllHappiness === 'function') refreshAllHappiness();
    if (typeof updateProdTabs === 'function') updateProdTabs();
    if (typeof scheduleNextQuest === 'function') scheduleNextQuest();
    
    if (typeof logProd === 'function') logProd('🎮 Partie démarrée !', 'info');
    
    let loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

function backToMenu() {
    clearAllTimers();
    let questIcon = document.getElementById('quest-icon');
    if (questIcon) questIcon.style.display = 'none';
    let questActiveBar = document.getElementById('quest-active-bar');
    if (questActiveBar) questActiveBar.classList.remove('show');
    window.location.href = 'index.html';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    let screen = document.getElementById(`screen-${screenId}`);
    if (screen) screen.classList.add('active');
}

function clearAllTimers() {
    clearTimeout(eventTimer);
    clearInterval(priceTimer);
    clearInterval(progressTimer);
    clearInterval(autoSaveTimer);
    clearInterval(realTimeTimer);
    clearInterval(gameTimeTimer);
    clearInterval(dailyWageTimer);
    clearInterval(taxPaymentTimer);
    clearInterval(loanPaymentTimer);
    clearInterval(demandUpdateTimer);
    clearInterval(timerBarInterval);
    clearInterval(utilityTimer);
    clearInterval(repairTimer);
    clearInterval(repairProgressTimer);
    clearInterval(contractTimer);
    clearInterval(happinessTimer);
    clearInterval(contractRefreshTimer);
    clearInterval(trainingTimer);
    clearInterval(contractProgressTimer);
    clearInterval(electricityTimer);
    clearInterval(accountingChartTimer);
    clearInterval(mainChartTimer);
    clearInterval(competitorTimer);
    clearInterval(researchInterval);
    clearTimeout(questTimer);
    Object.values(productionTimers).forEach(clearInterval);
}

function startTimers() {
    if (eventEndTime > 0 && eventDuration > 0) {
        let now = Date.now();
        if (now < eventEndTime) {
            let remaining = eventEndTime - now;
            eventTimer = setTimeout(triggerEvent, remaining);
        } else {
            if (typeof scheduleNextEvent === 'function') scheduleNextEvent();
        }
    } else {
        if (typeof scheduleNextEvent === 'function') scheduleNextEvent();
    }
    
    priceTimer = setInterval(() => { if (typeof fluctuatePrices === 'function') fluctuatePrices(); }, 60000);
    taxPaymentTimer = setInterval(() => { if (typeof payTaxes === 'function') payTaxes(); }, TAX_PAYMENT_INTERVAL_REAL);
    loanPaymentTimer = setInterval(() => { if (typeof payLoan === 'function') payLoan(); }, LOAN_PAYMENT_INTERVAL_REAL);
    demandUpdateTimer = setInterval(() => { if (typeof updateDemands === 'function') updateDemands(); }, 3600000);
    timerBarInterval = setInterval(() => { if (typeof updateTimerBar === 'function') updateTimerBar(); }, 1000);
    progressTimer = setInterval(() => {
        if (document.getElementById('panel-production')?.classList.contains('open') && typeof updateProductionProgressBars === 'function') updateProductionProgressBars();
        if (document.getElementById('panel-machines')?.classList.contains('open') && typeof renderMachinesPanel === 'function') renderMachinesPanel();
    }, 400);
    autoSaveTimer = setInterval(() => { if (S && typeof saveGame === 'function') saveGame(); }, 300000);
    realTimeTimer = setInterval(() => { if (typeof updateTimers === 'function') updateTimers(); }, 1000);
    gameTimeTimer = setInterval(() => { if (typeof advanceGameTime === 'function') advanceGameTime(1000); }, 1000);
    dailyWageTimer = setInterval(() => { if (typeof payDailyWages === 'function') payDailyWages(); }, 1440000);
    utilityTimer = setInterval(() => { if (typeof fluctuateUtilityPrices === 'function') fluctuateUtilityPrices(); }, 30000);
    repairTimer = setInterval(() => { if (typeof checkRepairs === 'function') checkRepairs(); }, 500);
    repairProgressTimer = setInterval(() => { if (typeof updateRepairProgressBars === 'function') updateRepairProgressBars(); }, 500);
    contractTimer = setInterval(() => { if (typeof checkContractProgress === 'function') checkContractProgress(); }, 1000);
    contractRefreshTimer = setInterval(() => { if (typeof refreshContracts === 'function') refreshContracts(); }, 240000);
    happinessTimer = setInterval(() => { if (typeof refreshAllHappiness === 'function') refreshAllHappiness(); }, 5000);
    trainingTimer = setInterval(() => { if (typeof checkTraining === 'function') checkTraining(); }, 60000);
    contractProgressTimer = setInterval(() => { if (typeof updateContractProgressBars === 'function') updateContractProgressBars(); }, 1000);
    electricityTimer = setInterval(() => {
        if (document.getElementById('panel-accounting')?.classList.contains('open') && typeof renderUtilitiesPanel === 'function') renderUtilitiesPanel();
    }, 5000);
    accountingChartTimer = setInterval(() => {
        if (document.getElementById('panel-accounting')?.classList.contains('open') && typeof updateAccountingCharts === 'function') updateAccountingCharts();
    }, 1000);
    mainChartTimer = setInterval(() => { if (mainChart && typeof updateMainChart === 'function') updateMainChart(); }, 1000);
    competitorTimer = setInterval(() => {
        if (typeof updateCompetitorTrends === 'function') updateCompetitorTrends();
        if (typeof checkCompetitorCooldowns === 'function') checkCompetitorCooldowns();
        if (document.getElementById('panel-competitors')?.classList.contains('open') && typeof renderCompetitorsPanel === 'function') renderCompetitorsPanel();
    }, 30000);
    
    if (currentResearch && currentResearch.researching && !researchInterval && typeof updateResearchProgress === 'function') {
        researchInterval = setInterval(updateResearchProgress, 500);
    }
}

function checkBankruptcy() {
    if (S && S.cash <= -250000) {
        clearAllTimers();
        let bankruptcyOverlay = document.getElementById('bankruptcy-overlay');
        if (bankruptcyOverlay) bankruptcyOverlay.style.display = 'flex';
    }
}

function declareBankruptcy() {
    let bankruptcyOverlay = document.getElementById('bankruptcy-overlay');
    if (bankruptcyOverlay) bankruptcyOverlay.style.display = 'none';
    S = null;
    window.location.href = 'index.html';
}

// Fonctions pour les boutons Paramètres et Tuto
function openSettings() {
    let settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
        settingsOverlay.style.display = 'flex';
        if (typeof loadSettings === 'function') loadSettings();
    } else {
        toast('Paramètres - Fonctionnalité à venir', 'info');
    }
}

function openTutorial() {
    let tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) tutorialOverlay.style.display = 'flex';
}

// Quêtes - affichage en barre constante
function showQuestNotification() {
    let icon = document.getElementById('quest-icon');
    if (icon) icon.classList.add('has-quest');
}

function hideQuestNotification() {
    let icon = document.getElementById('quest-icon');
    if (icon) icon.classList.remove('has-quest');
}

function updateQuestActiveBar() {
    let bar = document.getElementById('quest-active-bar');
    if (!currentQuestActive) {
        bar.classList.remove('show');
        return;
    }
    bar.classList.add('show');
    
    let progress = 0;
    let progressText = "";
    
    if (currentQuestActive.name === "Production en série") {
        let totalStock = Object.values(S.productStocks).reduce((a, b) => a + b, 0);
        progress = Math.min(100, (totalStock / 20) * 100);
        progressText = `${totalStock}/20 produits`;
    } else if (currentQuestActive.name === "Vente record") {
        progress = Math.min(100, (S.totalEarned / 10000) * 100);
        progressText = `${Math.round(S.totalEarned).toLocaleString('fr-FR')}/10 000 €`;
    } else if (currentQuestActive.name === "Machine neuve") {
        progress = Math.min(100, ((machines.length - 1) / 1) * 100);
        progressText = `${machines.length - 1}/1 machine achetée`;
    } else if (currentQuestActive.name === "Contrat gagnant") {
        let completed = activeContracts.filter(c => c.status === 'completed').length;
        progress = Math.min(100, (completed / 2) * 100);
        progressText = `${completed}/2 contrats`;
    } else if (currentQuestActive.name === "Trésorerie positive") {
        progress = Math.min(100, (S.cash / 50000) * 100);
        progressText = `${Math.round(S.cash).toLocaleString('fr-FR')}/50 000 €`;
    } else if (currentQuestActive.name === "Réparation express") {
        let repairing = Object.keys(repairsInProgress).length;
        progress = Math.min(100, (repairing / 2) * 100);
        progressText = `${repairing}/2 réparations`;
    } else if (currentQuestActive.name === "Recrutement massif") {
        progress = Math.min(100, ((employees.length - 5) / 3) * 100);
        progressText = `${employees.length - 5}/3 employés embauchés`;
    } else if (currentQuestActive.name === "Concurrent affaibli") {
        let weak = competitors.filter(c => c.marketShare < 18).length;
        progress = weak >= 1 ? 100 : 0;
        progressText = weak >= 1 ? "1/1" : "0/1";
    } else if (currentQuestActive.name === "Recherche avancée") {
        let unlocked = researches.filter(r => r.unlocked).length;
        progress = Math.min(100, (unlocked / 1) * 100);
        progressText = `${unlocked}/1 recherche`;
    } else if (currentQuestActive.name === "Niveau supérieur") {
        let level = getLevelFromXP(S.xp);
        progress = Math.min(100, ((level - 1) / 4) * 100);
        progressText = `Niveau ${level}/5`;
    } else {
        if (currentQuestActive.check && currentQuestActive.check(S)) progress = 100;
        else progress = 0;
    }
    
    bar.innerHTML = `
        <div class="quest-active-title">📜 ${currentQuestActive.name}</div>
        <div class="quest-active-desc">🎯 ${currentQuestActive.desc}</div>
        <div class="quest-active-progress"><div class="quest-active-progress-fill" style="width:${progress}%"></div></div>
        <div class="quest-active-reward">💰 ${currentQuestActive.rewardMoney.toLocaleString('fr-FR')} € | ⭐ ${currentQuestActive.rewardXP} XP</div>
        <div class="quest-active-cancel" onclick="cancelQuest()">❌ Abandonner (gratuit)</div>
    `;
}

function cancelQuest() {
    if (!currentQuestActive) return;
    showConfirm('Abandonner la quête ?', `Voulez-vous vraiment abandonner "${currentQuestActive.name}" ? Aucun coût.`, () => {
        logQuest(`Quête abandonnée : ${currentQuestActive.name}`, 'info');
        toast(`Quête abandonnée : ${currentQuestActive.name}`, '');
        currentQuestActive = null;
        updateQuestActiveBar();
        scheduleNextQuest();
    });
}

function openQuestDialog() {
    if (!currentQuest || currentQuest.active) {
        toast('Aucune nouvelle quête disponible pour le moment', '');
        return;
    }
    document.getElementById('quest-title').textContent = currentQuest.name;
    document.getElementById('quest-desc').textContent = currentQuest.desc;
    document.getElementById('quest-reward').innerHTML = `<div>💰 Récompense : ${currentQuest.rewardMoney.toLocaleString('fr-FR')} €</div><div>⭐ XP : ${currentQuest.rewardXP} XP</div>`;
    document.getElementById('quest-overlay').style.display = 'flex';
    
    document.getElementById('quest-accept').onclick = () => {
        currentQuest.active = true;
        currentQuestActive = currentQuest;
        currentQuest = null;
        closeQuestDialog();
        hideQuestNotification();
        updateQuestActiveBar();
        toast(`Quête acceptée : ${currentQuestActive.name}`, 'ok');
        logQuest(`Quête acceptée : ${currentQuestActive.name}`, 'info');
    };
    
    document.getElementById('quest-refuse').onclick = () => {
        currentQuest = null;
        closeQuestDialog();
        hideQuestNotification();
        toast('Quête refusée', '');
    };
}

function closeQuestDialog() {
    document.getElementById('quest-overlay').style.display = 'none';
}

function scheduleNextQuest() {
    if (questTimer) clearTimeout(questTimer);
    let delay = 900000 + Math.random() * 900000;
    questTimer = setTimeout(() => {
        if (!currentQuest && !currentQuestActive) {
            currentQuest = generateQuest();
            showQuestNotification();
            toast('📜 Une nouvelle quête est disponible ! Cliquez sur l\'icône 📜', 'ok');
        }
        scheduleNextQuest();
    }, delay);
}

// Initialisation et événements
document.addEventListener('click', e => {
    if (e.target.id === 'bsp-brand' || e.target.closest('#bsp-brand')) {
        bspClickCount++;
        if (bspClickCount >= 5) {
            bspClickCount = 0;
            let passwordOverlay = document.getElementById('password-overlay');
            if (passwordOverlay) passwordOverlay.style.display = 'flex';
        }
        setTimeout(() => bspClickCount = 0, 2000);
    }
    if (e.target.closest('#quest-icon')) {
        if (currentQuest && !currentQuest.active && typeof openQuestDialog === 'function') openQuestDialog();
    }
    if (!e.target.closest('.dropdown-checkbox')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    }
});

let confirmOverlay = document.getElementById('confirm-overlay');
if (confirmOverlay) {
    confirmOverlay.onclick = e => {
        if (e.target === confirmOverlay && typeof closeConfirm === 'function') closeConfirm();
    };
}

window.addEventListener('beforeunload', () => {
    if (S && typeof saveGame === 'function') saveGame();
});

if (typeof updateTimers === 'function') updateTimers();