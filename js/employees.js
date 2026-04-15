// ==================== FONCTIONS EMPLOYÉS ====================

// Variables pour le système de recrutement
let refreshCooldownEnd = 0; // Timestamp de fin du cooldown
let freeRefreshesLeft = FREE_REFRESH_START; // Nombre de changements gratuits restants
let refreshCount = 0; // Compteur de rechargements pour faire augmenter le prix
let refreshTimer = null; // Timer pour le cooldown

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

function generateCandidates() {
    let candidates = [];
    for (let i = 0; i < 3; i++) candidates.push(generateEmployee());
    return candidates;
}

function getHireCost() {
    return HIRE_COST; // Prix fixe de 1000€
}

function getRefreshCost() {
    if (freeRefreshesLeft > 0) return 0;
    // Prix qui augmente à chaque rechargement : 500, 1000, 1500, 2000, ...
    return REFRESH_BASE_COST * (refreshCount + 1);
}

function updateRefreshDisplay() {
    let refreshBtn = document.getElementById('refresh-candidates-btn');
    let costDisplay = document.getElementById('refresh-cost');
    let freeDisplay = document.getElementById('free-refreshes-left');
    
    if (refreshBtn) {
        if (freeRefreshesLeft > 0) {
            refreshBtn.innerHTML = `🔄 Changer (${freeRefreshesLeft} gratuit${freeRefreshesLeft > 1 ? 's' : ''} restant${freeRefreshesLeft > 1 ? 's' : ''})`;
            refreshBtn.classList.add('green');
        } else {
            let cost = getRefreshCost();
            refreshBtn.innerHTML = `🔄 Changer (${fmt(cost)})`;
            refreshBtn.classList.remove('green');
        }
    }
    
    if (costDisplay) {
        if (freeRefreshesLeft > 0) {
            costDisplay.textContent = `Gratuit (${freeRefreshesLeft} restant${freeRefreshesLeft > 1 ? 's' : ''})`;
        } else {
            costDisplay.textContent = fmt(getRefreshCost());
        }
    }
    
    if (freeDisplay) {
        freeDisplay.textContent = freeRefreshesLeft;
    }
}

function startRefreshCooldown() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshCooldownEnd = Date.now() + REFRESH_COOLDOWN_MS;
    refreshTimer = setTimeout(() => {
        // Après 10 minutes, on remet 1 changement gratuit et on reset le compteur de prix
        freeRefreshesLeft = FREE_REFRESH_AFTER_COOLDOWN;
        refreshCount = 0;
        refreshTimer = null;
        updateRefreshDisplay();
        toast(`🔄 Rechargement des candidats : 1 changement gratuit disponible !`, 'ok');
    }, REFRESH_COOLDOWN_MS);
}

function openHireOverlay() {
    window.currentCandidates = generateCandidates();
    window.selectedCandidate = null;
    renderCandidates();
    updateHireCostDisplay();
    updateRefreshDisplay();
    let overlay = document.getElementById('hire-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function closeHireOverlay() {
    let overlay = document.getElementById('hire-overlay');
    if (overlay) overlay.style.display = 'none';
}

function renderCandidates() {
    let grid = document.getElementById('candidates-grid');
    if (!grid) return;
    grid.innerHTML = window.currentCandidates.map((c, i) => `<div class="candidate-card ${window.selectedCandidate === i ? 'selected' : ''}" onclick="selectCandidate(${i})">
        <div class="candidate-name">${c.genderIcon} ${c.name}</div>
        <div class="candidate-gender">${c.gender}</div>
        <div class="candidate-stats">
            <div class="candidate-stat"><span>Efficacité</span><span style="color:var(--green)">${c.efficiency}%</span></div>
            <div class="candidate-stat"><span>Rapidité</span><span style="color:var(--blue)">${c.speed}%</span></div>
            <div class="candidate-stat"><span>Bonheur</span><span>${c.happiness}%</span></div>
        </div>
        <div class="candidate-salary">${c.wage} €/j</div>
    </div>`).join('');
    let confirmBtn = document.getElementById('hire-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = window.selectedCandidate === null;
}

function selectCandidate(index) {
    window.selectedCandidate = index;
    renderCandidates();
}

function refreshCandidates() {
    // Vérifier si on a des changements gratuits ou assez d'argent
    let cost = getRefreshCost();
    if (freeRefreshesLeft === 0 && S.cash < cost) {
        toast(`Fonds insuffisants ! ${fmt(cost)} requis`, 'err');
        return;
    }
    
    // Payer si pas gratuit
    if (freeRefreshesLeft === 0) {
        S.cash -= cost;
        S.totalSpent += cost;
        updateIncomeExpenseHistory(cost, false);
        logAcc(`🔄 Rechargement des candidats : -${fmt(cost)}`, 'neg');
        refreshCount++;
    } else {
        freeRefreshesLeft--;
        logAcc(`🔄 Rechargement des candidats : gratuit (plus que ${freeRefreshesLeft} gratuit${freeRefreshesLeft > 1 ? 's' : ''})`, 'info');
    }
    
    // Générer de nouveaux candidats
    window.currentCandidates = generateCandidates();
    window.selectedCandidate = null;
    renderCandidates();
    updateHireCostDisplay();
    updateRefreshDisplay();
    updateUI();
    
    // Démarrer ou reset le cooldown
    startRefreshCooldown();
}

function updateHireCostDisplay() {
    let cost = getHireCost();
    let costDisplay = document.getElementById('hire-cost-display');
    if (costDisplay) costDisplay.textContent = fmt(cost);
}

function confirmHire() {
    if (window.selectedCandidate === null) return;
    let cost = getHireCost();
    if (S.cash < cost) {
        toast('Fonds insuffisants !', 'err');
        return;
    }
    if (cost > 0) {
        S.cash -= cost;
        S.totalSpent += cost;
        updateIncomeExpenseHistory(cost, false);
        logAcc(`👥 Embauche de ${window.currentCandidates[window.selectedCandidate].name} : -${fmt(cost)}`, 'neg');
    }
    employees.push(window.currentCandidates[window.selectedCandidate]);
    hireCount++;
    closeHireOverlay();
    updateUI();
    pushChart();
    refreshAllHappiness();
    if (document.getElementById('panel-employees')?.classList.contains('open')) renderEmployeePanel();
}

function calculateEmployeeHappiness(e) {
    let happiness = 75;
    let avg = employees.reduce((s, x) => s + x.wage, 0) / employees.length;
    if (e.wage < avg * 0.9) happiness -= 5;
    if (e.wage > avg * 1.1) happiness += 3;
    resetVacationIfNeeded(e);
    if (e.vacationDaysLeft > 10) happiness += 5;
    if (e.vacationDaysLeft < 3) happiness -= 5;
    if (e.job === JOB_TYPES.SITE_MANAGER) happiness += 10;
    if (e.job === JOB_TYPES.LINE_MANAGER) happiness += 5;
    if (e.job === JOB_TYPES.NONE) happiness -= 10;
    if (e.inTraining) happiness += 2;
    if (bonusTotalMonth > 0 && bonusLog.some(b => b.name === e.name)) happiness += 8;
    let happinessBonus = getResearchBonus('happiness');
    happiness += happinessBonus;
    return Math.max(0, Math.min(100, Math.round(happiness)));
}

function updateAllEmployeesHappiness() {
    employees.forEach(e => e.happiness = calculateEmployeeHappiness(e));
}

function calculateAverageHappiness() {
    if (!employees.length) return 75;
    return Math.round(employees.reduce((s, e) => s + e.happiness, 0) / employees.length);
}

function updateHappinessBar() {
    let avg = calculateAverageHappiness();
    let fill = document.getElementById('happiness-fill');
    if (fill) {
        fill.style.width = avg + '%';
        fill.className = 'happiness-fill ' + (avg >= 70 ? 'high' : avg >= 40 ? 'medium' : 'low');
    }
    let valueEl = document.getElementById('happiness-value');
    if (valueEl) valueEl.textContent = avg + '%';
}

function refreshAllHappiness() {
    updateAllEmployeesHappiness();
    updateHappinessBar();
    if (document.getElementById('panel-employees')?.classList.contains('open')) renderEmployeePanel();
}

function resetVacationIfNeeded(e) {
    if (!gameTime) return;
    let days = (gameTime.getTime() - e.lastVacationReset) / 86400000;
    if (days >= SIX_MONTHS_GAME_DAYS) {
        e.vacationDaysLeft = VACATION_DAYS_PER_6MONTHS;
        e.lastVacationReset = gameTime.getTime();
    }
}

function giveVacation(index) {
    let e = employees[index];
    if (!e) return;
    resetVacationIfNeeded(e);
    if (e.vacationDaysLeft < 7) {
        toast('Pas assez de vacances', 'err');
        return;
    }
    e.vacationDaysLeft -= 7;
    refreshAllHappiness();
    renderEmployeePanel();
}

function fireSpecificEmployee(index) {
    if (employees.length <= 1) {
        toast('Vous ne pouvez pas licencier le dernier employé', 'err');
        return;
    }
    let e = employees[index];
    showConfirm('Licencier ?', `Licencier ${e.name} ? (1 000 €)`, () => {
        employees.splice(index, 1);
        S.cash -= 1000;
        S.totalSpent += 1000;
        updateIncomeExpenseHistory(1000, false);
        logAcc(`👋 Licenciement de ${e.name} : -1000€`, 'neg');
        updateUI();
        pushChart();
        renderEmployeePanel();
        refreshAllHappiness();
    });
}

function getEmployeesInTrainingCount() {
    if (!employees) return 0;
    return employees.filter(e => e.inTraining).length;
}

function toggleDropdown(type) {
    let content = document.getElementById(`dropdown-content-${type}`);
    if (!content) return;
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d !== content) d.classList.remove('show');
    });
    content.classList.toggle('show');
}

function assignSelectedToJob(jobKey) {
    let selected = selectedEmployees[jobKey] || [];
    if (!selected.length) return;
    let jobMap = {
        maintenance: JOB_TYPES.MAINTENANCE,
        cleaner: JOB_TYPES.CLEANER,
        lineManager: JOB_TYPES.LINE_MANAGER,
        siteManager: JOB_TYPES.SITE_MANAGER,
        handler: JOB_TYPES.HANDLER
    };
    selected.forEach(i => {
        if (!employees[i].inTraining) employees[i].job = jobMap[jobKey];
    });
    selectedEmployees[jobKey] = [];
    refreshAllHappiness();
    renderEmployeePanel();
    renderJobsTab();
    let dropdown = document.getElementById(`dropdown-content-${jobKey}`);
    if (dropdown) dropdown.classList.remove('show');
}

function updateSelectedEmployees(type, index, checked) {
    if (!selectedEmployees[type]) selectedEmployees[type] = [];
    if (checked) selectedEmployees[type].push(index);
    else selectedEmployees[type] = selectedEmployees[type].filter(i => i !== index);
}

function getTrainingCost(emp) {
    let base = 200;
    let avg = (emp.efficiency + emp.speed) / 2;
    if (avg > 60) base += Math.floor((avg - 60) * 5);
    if (avg > 80) base += Math.floor((avg - 80) * 10);
    return base;
}

function updateTrainingCost() {
    let selected = selectedEmployees.training || [];
    let total = 0;
    selected.forEach(i => total += getTrainingCost(employees[i]));
    let costEl = document.getElementById('training-total-cost');
    if (costEl) costEl.textContent = fmt(total);
}

function startTraining() {
    let selected = selectedEmployees.training || [];
    if (!selected.length) {
        toast('Sélectionnez des employés', 'err');
        return;
    }
    let total = 0;
    selected.forEach(i => total += getTrainingCost(employees[i]));
    if (S.cash < total) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= total;
    S.totalSpent += total;
    updateIncomeExpenseHistory(total, false);
    let now = gameTime ? gameTime.getTime() : Date.now();
    selected.forEach(i => {
        let e = employees[i];
        e.inTraining = true;
        e.trainingEndTime = now + TRAINING_DURATION_GAME_DAYS * 86400000;
        let happinessChange = Math.floor(Math.random() * 11) - 5;
        e.happiness = Math.max(0, Math.min(100, e.happiness + happinessChange));
    });
    selectedEmployees.training = [];
    logAcc(`📚 Formation de ${selected.length} employé(s) : -${fmt(total)}`, 'neg');
    toast(`${selected.length} employé(s) en formation`, 'ok');
    updateUI();
    pushChart();
    renderEmployeePanel();
    renderTrainingTab();
}

function checkTraining() {
    if (!gameTime) return;
    let now = gameTime.getTime();
    let updated = false;
    employees.forEach(e => {
        if (e.inTraining && e.trainingEndTime && now >= e.trainingEndTime) {
            e.inTraining = false;
            let gain = 5 + Math.floor(Math.random() * 11);
            let effGain = 0, spdGain = 0;
            if (e.efficiency < 100) {
                effGain = Math.min(gain, 100 - e.efficiency);
                gain -= effGain;
                e.efficiency += effGain;
            }
            if (gain > 0 && e.speed < 100) {
                spdGain = Math.min(gain, 100 - e.speed);
                e.speed += spdGain;
            }
            logProd(`📚 ${e.name} a terminé sa formation (+${effGain}% eff, +${spdGain}% vit)`, 'pos');
            updated = true;
        }
    });
    if (updated) {
        updateUI();
        if (document.getElementById('panel-employees')?.classList.contains('open')) {
            renderEmployeePanel();
            renderTrainingTab();
        }
    }
}

function giveBonusToEmployee() {
    let selectEl = document.getElementById('bonus-employee-select');
    if (!selectEl) return;
    let index = parseInt(selectEl.value);
    if (isNaN(index)) return;
    let amount = parseInt(document.getElementById('bonus-amount')?.value) || 0;
    if (amount <= 0 || S.cash < amount) return;
    let e = employees[index];
    S.cash -= amount;
    S.totalSpent += amount;
    updateIncomeExpenseHistory(amount, false);
    bonusTotalMonth += amount;
    bonusLog.unshift({ time: new Date().toLocaleTimeString(), name: e.name, amount: amount });
    logAcc(`🎁 Prime ${e.name} : -${fmt(amount)}`, 'neg');
    updateUI();
    pushChart();
    renderBonusTab();
    refreshAllHappiness();
}