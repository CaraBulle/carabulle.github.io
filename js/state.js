// ==================== VARIABLES GLOBALES ====================
let S = null;
let products = [];
let machines = [];
let employees = [];
let competitors = [];
let researches = [];
let currentResearch = null;
let activeContracts = [];
let repairsInProgress = {};
let cart = {};
let logProdEntries = [];
let logAccEntries = [];
let chartHistory = [];
let gameTime = null;
let pendingTaxes = 0;
let currentLoan = { amount: 0, total: 0, remaining: 0 };
let utilityPrices = {};
let hireCount = 0;
let bonusLog = [];
let bonusTotalMonth = 0;
let stateContractBonus = false;
let currentEvent = null;
let eventEndTime = 0;
let eventDuration = 0;
let competitorActionCooldown = {};
let selectedEmployees = {};
let machineSelections = {};
let currentProdTab = 'debut';
let currentSellTab = 'debut';
let prodSearchTerm = '';
let sellSearchTerm = '';
let demandSearchTerm = '';
let marketSearchTerm = '';
let chartView = 'realtime';
let incomeHistory = [];
let expenseHistory = [];
let currentQuest = null;
let currentQuestActive = null;

// Timers
let eventTimer = null;
let priceTimer = null;
let progressTimer = null;
let autoSaveTimer = null;
let realTimeTimer = null;
let gameTimeTimer = null;
let dailyWageTimer = null;
let taxPaymentTimer = null;
let loanPaymentTimer = null;
let demandUpdateTimer = null;
let timerBarInterval = null;
let utilityTimer = null;
let repairTimer = null;
let repairProgressTimer = null;
let contractTimer = null;
let happinessTimer = null;
let contractRefreshTimer = null;
let trainingTimer = null;
let contractProgressTimer = null;
let electricityTimer = null;
let accountingChartTimer = null;
let mainChartTimer = null;
let competitorTimer = null;
let researchInterval = null;
let questTimer = null;
let productionTimers = {};

// Chart
let mainChart = null;
let cashChart = null;
let incomeChart = null;
let expenseChart = null;
let bspClickCount = 0;

// ==================== FONCTIONS DE GÉNÉRATION D'EMPLOYÉS ====================
function generateCompetency() {
    let r = Math.random();
    if (r < 0.05) return 10 + Math.floor(Math.random() * 15);
    if (r < 0.75) return 25 + Math.floor(Math.random() * 36);
    if (r < 0.90) return 61 + Math.floor(Math.random() * 25);
    if (r < 0.99) return 86 + Math.floor(Math.random() * 14);
    return 100;
}

function generateEmployee(gender = null) {
    let isMale = gender === true ? true : gender === false ? false : Math.random() > 0.5;
    let firstName = isMale ? MALE_FIRST_NAMES[Math.floor(Math.random() * MALE_FIRST_NAMES.length)] : FEMALE_FIRST_NAMES[Math.floor(Math.random() * FEMALE_FIRST_NAMES.length)];
    let lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let efficiency = generateCompetency();
    let speed = generateCompetency();
    let baseWage = 500;
    let wageMod = 1;
    if (efficiency >= 50 || speed >= 50) wageMod = 1 + (Math.max(efficiency, speed) - 50) / 250;
    else wageMod = 1 - (50 - Math.min(efficiency, speed)) / 333;
    let wage = Math.round(baseWage * (isMale ? wageMod : wageMod * (0.95 + Math.random() * 0.05)));
    return {
        name: `${firstName} ${lastName}`,
        gender: isMale ? 'Homme' : 'Femme',
        genderIcon: isMale ? '♂' : '♀',
        wage: wage,
        vacationDaysLeft: 0,
        lastVacationReset: gameTime ? gameTime.getTime() : Date.now(),
        job: JOB_TYPES.NONE,
        happiness: 70 + Math.floor(Math.random() * 20),
        efficiency: efficiency,
        speed: speed,
        inTraining: false,
        trainingEndTime: null
    };
}

// ==================== FONCTIONS DE SAUVEGARDE / CHARGEMENT ====================
function saveGame() {
    if (!S) return;
    localStorage.setItem('bsp5', JSON.stringify({
        S, products, chartHistory, logProdEntries, logAccEntries,
        gameTime: gameTime.getTime(), machines, employees, pendingTaxes,
        currentLoan, utilityPrices, activeContracts, repairsInProgress,
        hireCount, currentEvent, eventEndTime, eventDuration, competitors,
        competitorActionCooldown, researches, currentResearch,
        incomeHistory, expenseHistory, currentQuestActive
    }));
    toast('Sauvegardé ✓', 'ok');
}

function loadGame(saveName = 'bsp5') {
    let data = JSON.parse(localStorage.getItem(saveName));
    if (!data) return;
    S = data.S;
    products = data.products;
    chartHistory = data.chartHistory;
    logProdEntries = data.logProdEntries || [];
    logAccEntries = data.logAccEntries || [];
    gameTime = new Date(data.gameTime);
    machines = data.machines;
    employees = data.employees;
    pendingTaxes = data.pendingTaxes || 0;
    currentLoan = data.currentLoan || { amount: 0, total: 0, remaining: 0 };
    utilityPrices = data.utilityPrices || initUtilityPrices();
    activeContracts = data.activeContracts || [];
    repairsInProgress = data.repairsInProgress || {};
    hireCount = data.hireCount || 0;
    currentEvent = data.currentEvent || null;
    eventEndTime = data.eventEndTime || 0;
    eventDuration = data.eventDuration || 0;
    competitors = data.competitors || [];
    competitorActionCooldown = data.competitorActionCooldown || {};
    researches = data.researches || [];
    currentResearch = data.currentResearch || null;
    incomeHistory = data.incomeHistory || [];
    expenseHistory = data.expenseHistory || [];
    currentQuestActive = data.currentQuestActive || null;
    
    // Initialiser réputation et part de marché si absentes
    if (S.reputation === undefined) S.reputation = 0;
    if (S.marketShare === undefined) S.marketShare = MARKET_SHARE_START;
    
    if (competitors.length === 0 && typeof initCompetitors === 'function') initCompetitors();
    if (researches.length === 0 && typeof initResearches === 'function') initResearches();
    
    if (S.activeProductions && typeof getMachineSpeedBonus === 'function' && typeof getRequiredMachineTierForProduct === 'function') {
        Object.entries(S.activeProductions).forEach(([id, a]) => {
            let p = products.find(x => x.id == id);
            if (!p) return;
            let speedBonus = 1;
            if (a.machinesUsed) {
                for (let mid of a.machinesUsed) {
                    let m = machines.find(x => x.id === mid);
                    if (m) speedBonus *= getMachineSpeedBonus(m.tier, getRequiredMachineTierForProduct(p));
                }
            }
            let actualTime = a.actualTime || Math.round(p.productionTimeReal / speedBonus);
            a.actualTime = actualTime;
            if (productionTimers[id]) clearInterval(productionTimers[id]);
            productionTimers[id] = setInterval(() => runProductionCycle(id), actualTime);
        });
    }
    
    if (currentResearch && currentResearch.researching) {
        let remaining = currentResearch.researchEndTime - Date.now();
        if (remaining > 0) {
            if (researchInterval) clearInterval(researchInterval);
            researchInterval = setInterval(updateResearchProgress, 500);
        } else {
            currentResearch.unlocked = true;
            currentResearch.researching = false;
            if (currentResearch.effect.type === 'demand') S.demandMult *= currentResearch.effect.value;
            if (currentResearch.effect.type === 'competitor' && typeof updateCompetitorImpact === 'function') updateCompetitorImpact();
            if (currentResearch.id === 'competitor' || currentResearch.id === 'ieds' || currentResearch.id === 'smokepop') {
                document.getElementById('competitors-btn').style.display = 'inline-block';
            }
            currentResearch = null;
        }
    }
    
    if (currentEvent) {
        document.getElementById('ev-badge').textContent = currentEvent.label;
        document.getElementById('ev-badge').className = `ev-badge ${currentEvent.type}`;
        document.getElementById('ev-text').textContent = currentEvent.text;
    }
    
    showScreen('game');
    document.getElementById('quest-icon').style.display = 'flex';
    chartView = 'realtime';
    if (typeof initMainChart === 'function') initMainChart();
    if (typeof startTimers === 'function') startTimers();
    if (typeof updateUI === 'function') updateUI();
    if (typeof refreshAllHappiness === 'function') refreshAllHappiness();
    if (typeof updateProdTabs === 'function') updateProdTabs();
    if (typeof scheduleNextQuest === 'function') scheduleNextQuest();
    if (currentQuestActive && typeof updateQuestActiveBar === 'function') updateQuestActiveBar();
    toast('Partie chargée ✓', 'ok');
}

function newState() {
    return {
        cash: 100000,
        employees: 5,
        machines: 1,
        materialsStock: {},
        prices: initPrices(),
        demandMult: 1.0,
        prodMult: 1.0,
        totalEarned: 0,
        totalSpent: 0,
        activeProductions: {},
        productStocks: {},
        productDemands: {},
        totalUtilitySpent: 0,
        competitorImpact: 0,
        xp: 0,
        researchPoints: 0,
        incomeHistory: [],
        expenseHistory: [],
        reputation: 0,
        marketShare: MARKET_SHARE_START
    };
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

function getResearchBonus(type) {
    let value = 1;
    let costReduction = 1;
    let utilityReduction = 1;
    let contractBonus = 1;
    if (researches) {
        for (let r of researches) {
            if (r.unlocked) {
                if (r.effect.type === type) {
                    if (type === 'speed') value *= r.effect.value;
                    else if (type === 'demand') value *= r.effect.value;
                    else if (type === 'price') value *= r.effect.value;
                    else if (type === 'breakdown') value *= r.effect.value;
                    else if (type === 'repairTime') value *= r.effect.value;
                    else if (type === 'capacity') value += r.effect.value;
                    else if (type === 'competitor') value *= r.effect.value;
                    else if (type === 'efficiency') value *= r.effect.value;
                    else if (type === 'happiness') value += r.effect.value;
                    else if (type === 'researchCost') costReduction = r.effect.value;
                    else if (type === 'utility') utilityReduction = r.effect.value;
                    else if (type === 'contracts') contractBonus = r.effect.value;
                }
            }
        }
    }
    if (type === 'researchCost') return costReduction;
    if (type === 'utility') return utilityReduction;
    if (type === 'contracts') return contractBonus;
    return value;
}

function initMachines() {
    machines = [];
    machines.push({ id: 0, name: MACHINE_TIERS.basic.name, usage: 100, broken: false, stopped: false, tier: 'basic', price: MACHINE_TIERS.basic.price });
}

function initEmployees() {
    employees = [];
    for (let i = 0; i < S.employees; i++) {
        employees.push(generateEmployee());
    }
}

function genProducts() {
    products = PRODUCTS_DEF.map((d, i) => {
        let c = d.mats.reduce((s, m) => s + (MAT_MAP[m.name]?.base || 0) * m.qty, 0);
        let pt = getProductionTime(d.complexity, d.name);
        let priceBonus = getResearchBonus('price');
        return {
            id: i,
            name: d.name,
            complexity: d.complexity,
            mats: d.mats.map(m => m.name),
            qtyPerMatMap: d.mats.reduce((a, m) => { a[m.name] = m.qty; return a; }, {}),
            reqMachines: getRequiredMachines(d.complexity),
            reqEmployees: d.reqEmployees,
            productionTimeGame: pt,
            productionTimeReal: Math.round(pt / REAL_TO_GAME_RATIO * 60000),
            basePrice: Math.round(c * (2.2 + Math.random() * 0.8) * priceBonus),
            baseDemand: d.demand
        };
    });
    products.forEach(p => {
        if (S.productStocks[p.id] === undefined) S.productStocks[p.id] = 0;
        if (S.productDemands[p.id] === undefined) S.productDemands[p.id] = p.baseDemand;
    });
}

// ==================== FONCTIONS RÉPUTATION ====================

function getReputationTier() {
    let rep = S.reputation || 0;
    for (let tier of REPUTATION_THRESHOLDS) {
        if (rep >= tier.min && rep <= tier.max) {
            return tier;
        }
    }
    return REPUTATION_THRESHOLDS[0];
}

function addReputation(amount) {
    if (!S) return;
    let oldTier = getReputationTier();
    S.reputation = Math.max(0, (S.reputation || 0) + amount);
    let newTier = getReputationTier();
    
    // Mettre à jour la part de marché en fonction de la réputation
    if (typeof updateMarketShareFromReputation === 'function') {
        updateMarketShareFromReputation();
    }
    if (typeof refreshCompetitors === 'function') {
        refreshCompetitors();
    }
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    if (repEl) repEl.textContent = S.reputation.toFixed(1);
    if (tierEl) {
        tierEl.textContent = newTier.name;
        tierEl.style.color = newTier.color;
    }
    
    if (oldTier.name !== newTier.name) {
        toast(`🏆 ${newTier.name} atteint !`, 'ok');
        logProd(`🏆 Nouveau palier atteint : ${newTier.name} !`, 'pos');
    }
}

function removeReputation(amount) {
    if (!S) return;
    let oldTier = getReputationTier();
    S.reputation = Math.max(0, (S.reputation || 0) - amount);
    let newTier = getReputationTier();
    
    // Mettre à jour la part de marché en fonction de la réputation
    if (typeof updateMarketShareFromReputation === 'function') {
        updateMarketShareFromReputation();
    }
    if (typeof refreshCompetitors === 'function') {
        refreshCompetitors();
    }
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    if (repEl) repEl.textContent = S.reputation.toFixed(1);
    if (tierEl) {
        tierEl.textContent = newTier.name;
        tierEl.style.color = newTier.color;
    }
    
    if (oldTier.name !== newTier.name) {
        toast(`📉 Rétrogradation : ${newTier.name}`, 'err');
        logProd(`📉 Rétrogradation : ${newTier.name}`, 'neg');
    }
}