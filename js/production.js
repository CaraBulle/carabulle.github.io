// ==================== FONCTIONS DE PRODUCTION ====================

function getRequiredMachines(complexity) {
    return Math.min(5, Math.ceil(complexity / 2));
}

function getProductTier(product) {
    if (product.complexity <= 10) return 'debut';
    if (product.complexity <= 25) return 'mid';
    if (product.complexity <= 50) return 'last';
    return 'end';
}

function isProductUnlocked(product) {
    let level = getLevelFromXP(S.xp);
    if (product.complexity <= 10) return true;
    if (product.complexity <= 25) return level >= 5;
    if (product.complexity <= 50) return level >= 15;
    return level >= 30;
}

function getRequiredLevelForProduct(product) {
    if (product.complexity <= 10) return 1;
    if (product.complexity <= 25) return 5;
    if (product.complexity <= 50) return 15;
    return 30;
}

function getRequiredMachineTierForProduct(product) {
    if (product.complexity <= 10) return 'basic';
    if (product.complexity <= 25) return 'advanced';
    if (product.complexity <= 50) return 'pro';
    return 'complex';
}

function getAvailableMachinesForProduct(product) {
    let requiredTier = getRequiredMachineTierForProduct(product);
    let tiers = ['basic', 'advanced', 'pro', 'complex'];
    let tierIndex = tiers.indexOf(requiredTier);
    let availableTiers = tiers.slice(tierIndex);
    if (requiredTier === 'complex') availableTiers = ['complex'];
    let availableMachines = [];
    for (let tier of availableTiers) {
        let tierMachines = machines.filter(m => m.tier === tier && !m.broken && !m.stopped && !isMachineBusy(m.id));
        availableMachines.push(...tierMachines);
    }
    return availableMachines;
}

function getMachineSpeedBonus(machineTier, productTier) {
    let tiers = ['basic', 'advanced', 'pro', 'complex'];
    let machineIndex = tiers.indexOf(machineTier);
    let productIndex = tiers.indexOf(productTier);
    if (machineIndex <= productIndex) return 1;
    let bonus = 1 + (machineIndex - productIndex) * 0.05;
    return Math.min(1.2, bonus);
}

function getProductionTime(complexity, name) {
    let t = BASE_CYCLE_GAME_MINUTES * complexity;
    let speedBonus = getResearchBonus('speed');
    t = t * speedBonus;
    if (name.includes('Drone')) t *= 0.6;
    else if (name.includes('Batterie')) t *= 1.5;
    else if (name.includes('Panneau')) t *= 1.3;
    else if (name.includes('Turbine')) t *= 1.8;
    else if (name.includes('Servo')) t *= 1.4;
    else if (name.includes('Circuit')) t *= 1.6;
    else if (name.includes('Planche')) t *= 0.3;
    else if (name.includes('Tissu')) t *= 0.4;
    return Math.max(1, Math.round(t));
}

function getMaxCycles(product) {
    if (!product.mats.length) return 999;
    let maxByMat = product.mats.map(m => {
        let stock = S.materialsStock[m] || 0;
        let needed = product.qtyPerMatMap[m] || 1;
        return Math.floor(stock / needed);
    });
    return Math.min(...maxByMat);
}

function runProductionCycle(id) {
    let p = products.find(x => x.id == id);
    if (!p) return;
    let a = S.activeProductions[id];
    if (!a) return;
    
    if (a.cyclesDone >= a.cyclesTotal) {
        let totalXP = a.cyclesTotal * 8;
        addXP(totalXP);
        logProd(`✅ Production terminée : ${a.cyclesTotal}× ${p.name}`, 'pos');
        stopProductionInternal(id, true);
        return;
    }
    
    if (!p.mats.every(m => (S.materialsStock[m] || 0) >= (p.qtyPerMatMap[m] || 1))) {
        stopProductionInternal(id, false);
        return;
    }
    
    if (a.machinesUsed && !a.machinesUsed.every(mid => {
        let m = machines.find(x => x.id === mid);
        return m && !m.broken && !m.stopped;
    })) {
        stopProductionInternal(id, false);
        return;
    }
    
    p.mats.forEach(m => S.materialsStock[m] -= (p.qtyPerMatMap[m] || 1));
    S.productStocks[p.id] = (S.productStocks[p.id] || 0) + 1;
    a.cyclesDone++;
    a.cycleStartTime = Date.now();
    if (a.machinesUsed) useMachines(a.machinesUsed);
    updateUI();
    pushChart();
    checkContractProgress();
    checkQuestProgress();
    if (document.getElementById('panel-production')?.classList.contains('open')) renderProdPanel();
}

function stopProductionInternal(id, completed) {
    if (productionTimers[id]) {
        clearInterval(productionTimers[id]);
        delete productionTimers[id];
    }
    delete S.activeProductions[id];
    if (document.getElementById('panel-production')?.classList.contains('open')) renderProdPanel();
    updateUI();
}

function startProduction(id, cycles, machineIds) {
    let p = products.find(x => x.id == id);
    if (!p) return;
    if (!isProductUnlocked(p)) {
        let reqLevel = getRequiredLevelForProduct(p);
        toast(`Niveau ${reqLevel} requis pour produire ce produit !`, 'err');
        return;
    }
    
    let requiredTier = getRequiredMachineTierForProduct(p);
    let validMachines = machineIds.every(mid => {
        let m = machines.find(x => x.id === mid);
        return m && !m.broken && !m.stopped && !isMachineBusy(m.id);
    });
    if (requiredTier === 'complex') {
        validMachines = machineIds.every(mid => {
            let m = machines.find(x => x.id === mid);
            return m && m.tier === 'complex' && !m.broken && !m.stopped && !isMachineBusy(m.id);
        });
    }
    
    if (machineIds.length !== p.reqMachines || !validMachines) {
        toast(`Machines ${requiredTier} requises pour ce produit !`, 'err');
        return;
    }
    
    let speedBonus = 1;
    for (let mid of machineIds) {
        let m = machines.find(x => x.id === mid);
        if (m) speedBonus *= getMachineSpeedBonus(m.tier, requiredTier);
    }
    let actualTime = Math.round(p.productionTimeReal / speedBonus);
    
    if (freeEmployeesCount() < p.reqEmployees) {
        toast('Employés insuffisants', 'err');
        return;
    }
    
    if (!p.mats.every(m => (S.materialsStock[m] || 0) >= (p.qtyPerMatMap[m] || 1))) {
        toast('Matières insuffisantes', 'err');
        return;
    }
    
    let maxCycles = getMaxCycles(p);
    let fc = Math.min(cycles, maxCycles);
    
    S.activeProductions[id] = {
        machinesUsed: machineIds,
        employeesUsed: p.reqEmployees,
        cyclesTotal: fc,
        cyclesDone: 0,
        cycleStartTime: Date.now(),
        actualTime: actualTime
    };
    
    if (productionTimers[id]) clearInterval(productionTimers[id]);
    productionTimers[id] = setInterval(() => runProductionCycle(id), actualTime);
    logProd(`▶ Production lancée : ${p.name} (${fc} produits)`, 'info');
    if (document.getElementById('panel-production')?.classList.contains('open')) renderProdPanel();
    updateUI();
    toast(`${p.name} — ${fc} produits`, 'ok');
}

function confirmStopProduction(id, name) {
    showConfirm('Arrêter ?', `Arrêter "${name}" ?`, () => stopProductionInternal(id, false));
}

function setMaxCycles(productId) {
    let p = products.find(x => x.id == productId);
    if (!p) return;
    let maxCycles = getMaxCycles(p);
    let input = document.getElementById(`pqty-${productId}`);
    if (input) {
        input.value = Math.max(1, maxCycles);
    }
}

function useMachines(machineIds) {
    machineIds.forEach(id => {
        let m = machines.find(x => x.id === id);
        if (m && !m.broken && !m.stopped) {
            m.usage = Math.max(0, m.usage - MACHINE_USAGE_PER_PRODUCT);
            let breakChance = calculateBreakdownChance(m.usage);
            if (Math.random() < breakChance) {
                m.broken = true;
                logProd(`⚠️ ${m.name} en panne ! (usure: ${m.usage}%)`, 'neg');
            }
        }
    });
}

function calculateBreakdownChance(usage) {
    let baseChance = 0;
    if (usage <= 10) baseChance = 0.30;
    else if (usage <= 20) baseChance = 0.20;
    else if (usage <= 30) baseChance = 0.12;
    else if (usage <= 40) baseChance = 0.07;
    else if (usage <= 50) baseChance = 0.04;
    else if (usage <= 60) baseChance = 0.02;
    else baseChance = 0.005;
    
    let maintenanceBonus = 1;
    let m = employees.filter(e => e.job === JOB_TYPES.MAINTENANCE && !e.inTraining).length;
    let c = employees.filter(e => e.job === JOB_TYPES.CLEANER && !e.inTraining).length;
    let reduction = Math.min(0.7, m * 0.15 + c * 0.10);
    maintenanceBonus = 1 - reduction;
    
    let finalChance = baseChance * maintenanceBonus;
    return Math.min(0.5, finalChance);
}

function freeMachinesCount() {
    if (!machines) return 0;
    return machines.filter(m => !m.broken && !m.stopped && !isMachineBusy(m.id)).length;
}

function freeEmployeesCount() {
    return productionEmployeesCount() - usedEmployeesCount();
}

function productionEmployeesCount() {
    if (!employees) return 0;
    return employees.filter(e => e.job !== JOB_TYPES.CLEANER && 
                                 e.job !== JOB_TYPES.MAINTENANCE && 
                                 e.job !== JOB_TYPES.HANDLER && 
                                 !e.inTraining).length;
}

function usedEmployeesCount() {
    if (!S || !S.activeProductions) return 0;
    return Object.values(S.activeProductions).reduce((s, a) => s + a.employeesUsed, 0);
}

function isMachineBusy(mid) {
    if (!S || !S.activeProductions) return false;
    return Object.values(S.activeProductions).some(a => a.machinesUsed?.includes(mid));
}

function getFunctionalMachinesCount() {
    return machines.filter(m => !m.broken).length;
}

function getBrokenMachinesCount() {
    return machines.filter(m => m.broken).length;
}

function getBusyMachinesCount() {
    return machines.filter(m => !m.broken && !m.stopped && isMachineBusy(m.id)).length;
}

function getAvailableMachines() {
    return machines.filter(m => !m.broken && !m.stopped && !isMachineBusy(m.id));
}

function getCleanerBreakdownReduction() {
    let m = employees.filter(e => e.job === JOB_TYPES.MAINTENANCE && !e.inTraining).length;
    let c = employees.filter(e => e.job === JOB_TYPES.CLEANER && !e.inTraining).length;
    let base = Math.min(0.5, m * 0.15 + c * 0.10);
    let bonus = getResearchBonus('breakdown');
    return base * bonus;
}

function updateProdTabs() {
    let level = getLevelFromXP(S.xp);
    let tabs = document.querySelectorAll('#prod-tabs .tab');
    if (tabs.length >= 2) tabs[1].classList.toggle('locked', level < 5);
    if (tabs.length >= 3) tabs[2].classList.toggle('locked', level < 15);
    if (tabs.length >= 4) tabs[3].classList.toggle('locked', level < 30);
}

function switchProdTab(tier) {
    let level = getLevelFromXP(S.xp);
    if (tier === 'mid' && level < 5) { toast('Niveau 5 requis pour débloquer l\'Industrie légère !', 'err'); return; }
    if (tier === 'last' && level < 15) { toast('Niveau 15 requis pour débloquer la Haute technologie !', 'err'); return; }
    if (tier === 'end' && level < 30) { toast('Niveau 30 requis pour débloquer la R&D avancée !', 'err'); return; }
    currentProdTab = tier;
    document.querySelectorAll('#prod-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#prod-tabs .tab[data-tier="${tier}"]`).classList.add('active');
    renderProdPanel();
}

function filterProduction() {
    prodSearchTerm = document.getElementById('prod-search').value.toLowerCase();
    renderProdPanel();
}

function cqtyProd(id, delta) {
    let input = document.getElementById(`pqty-${id}`);
    if (input) {
        let max = parseInt(input.max) || 999;
        input.value = Math.max(1, Math.min(max, (parseInt(input.value) || 1) + delta));
    }
}

function updateMachineSelection(pid, index, value) {
    if (!machineSelections[pid]) machineSelections[pid] = [];
    machineSelections[pid][index] = value;
}

function startProductionWithMachineSelection(id) {
    let p = products.find(x => x.id == id);
    if (!p) return;
    if (!isProductUnlocked(p)) {
        toast(`Niveau ${getRequiredLevelForProduct(p)} requis`, 'err');
        return;
    }
    let cycles = parseInt(document.getElementById(`pqty-${id}`)?.value) || 1;
    let selected = (machineSelections[id] || []).filter(v => v !== '').map(v => parseInt(v));
    if (selected.length !== p.reqMachines || new Set(selected).size !== selected.length) {
        toast(`Sélectionnez ${p.reqMachines} machines distinctes`, 'err');
        return;
    }
    startProduction(id, cycles, selected);
}

function updateProductionProgressBars() {
    Object.entries(S.activeProductions).forEach(([id, a]) => {
        let p = products.find(x => x.id == id);
        if (!p) return;
        let elapsed = Date.now() - a.cycleStartTime;
        let duration = a.actualTime || p.productionTimeReal;
        let prog = Math.min(100, (elapsed / duration) * 100);
        let fill = document.getElementById(`prod-fill-${id}`);
        if (fill) fill.style.width = prog + '%';
    });
}