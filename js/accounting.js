// ==================== FONCTIONS COMPTABILITÉ ====================

function updateIncomeExpenseHistory(amount, isIncome) {
    let now = gameTime ? gameTime.getTime() : Date.now();
    if (isIncome) {
        incomeHistory.push({ amount: amount, gameTs: now });
        if (incomeHistory.length > 500) incomeHistory.shift();
    } else {
        expenseHistory.push({ amount: amount, gameTs: now });
        if (expenseHistory.length > 500) expenseHistory.shift();
    }
    if (typeof updateAccountingCharts === 'function') updateAccountingCharts();
}

function getUtilityConsumption(utility) {
    if (utility.id === 'elec') {
        let total = 0;
        if (machines) {
            machines.forEach(m => {
                if (!m.broken && !m.stopped) {
                    let isProducing = S && S.activeProductions ? Object.values(S.activeProductions).some(a => a.machinesUsed?.includes(m.id)) : false;
                    total += isProducing ? 1.6 : 0.016;
                }
            });
        }
        return total;
    }
    return 0;
}

function getUtilityCost(utility) {
    let price = utilityPrices[utility.id] || utility.basePricePerUnit;
    let consumption = getUtilityConsumption(utility);
    return Math.max(0, Math.round(consumption * price));
}

function payUtility(utilityId) {
    let utility = UTILITIES_DEF.find(x => x.id === utilityId);
    if (!utility) return;
    let utilityReduction = getResearchBonus('utility');
    let consumption = getUtilityConsumption(utility);
    let price = utilityPrices[utility.id] || utility.basePricePerUnit;
    let cost = Math.max(0, Math.round(consumption * price * utilityReduction));
    if (cost === 0) return;
    if (S.cash < cost) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= cost;
    S.totalSpent += cost;
    updateIncomeExpenseHistory(cost, false);
    logAcc(`${utility.icon} ${utility.name} : -${fmt(cost)}`, 'neg');
    updateUI();
    pushChart();
    toast(`${utility.name} payé : -${fmt(cost)}`, 'ok');
    if (document.getElementById('panel-accounting')?.classList.contains('open')) renderAccountingPanel();
}

function payAllUtilities() {
    let total = 0;
    let utilityReduction = getResearchBonus('utility');
    UTILITIES_DEF.forEach(u => {
        let consumption = getUtilityConsumption(u);
        let price = utilityPrices[u.id] || u.basePricePerUnit;
        total += Math.max(0, Math.round(consumption * price * utilityReduction));
    });
    if (total === 0) {
        toast('Aucune charge à payer', '');
        return;
    }
    if (S.cash < total) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    showConfirm('Payer tout ?', `${fmt(total)}`, () => {
        UTILITIES_DEF.forEach(u => {
            let consumption = getUtilityConsumption(u);
            let price = utilityPrices[u.id] || u.basePricePerUnit;
            let cost = Math.max(0, Math.round(consumption * price * utilityReduction));
            if (cost > 0) {
                S.cash -= cost;
                S.totalSpent += cost;
                updateIncomeExpenseHistory(cost, false);
                logAcc(`${u.icon} ${u.name} : -${fmt(cost)}`, 'neg');
            }
        });
        updateUI();
        pushChart();
        toast(`Charges payées : -${fmt(total)}`, 'ok');
        if (document.getElementById('panel-accounting')?.classList.contains('open')) renderAccountingPanel();
    });
}

function fluctuateUtilityPrices() {
    UTILITIES_DEF.forEach(u => {
        let variation = (Math.random() - 0.5) * 0.1;
        utilityPrices[u.id] = Math.max(0.01, (utilityPrices[u.id] || u.basePricePerUnit) * (1 + variation));
    });
    if (document.getElementById('panel-accounting')?.classList.contains('open')) renderUtilitiesPanel();
}

function renderUtilitiesPanel() {
    let grid = document.getElementById('util-grid');
    let total = 0;
    if (!grid) return;
    let utilityReduction = getResearchBonus('utility');
    
    grid.innerHTML = UTILITIES_DEF.map(u => {
        let price = utilityPrices[u.id] || u.basePricePerUnit;
        let consumption = getUtilityConsumption(u);
        let cost = Math.max(0, Math.round(consumption * price * utilityReduction));
        total += cost;
        let consumptionText = '';
        if (u.id === 'elec') {
            let activeMachines = machines ? machines.filter(m => !m.broken && !m.stopped).length : 0;
            let producingMachines = (S && S.activeProductions) ? Object.values(S.activeProductions).reduce((s, a) => s + (a.machinesUsed?.length || 0), 0) : 0;
            consumptionText = `Machines actives : ${activeMachines} (${producingMachines} en production)`;
        } else {
            consumptionText = 'Non utilisé';
        }
        let disabled = cost === 0 ? 'disabled' : '';
        return `<div class="util-card">
            <div class="util-card-top">
                <span>${u.icon} ${u.name}</span>
                <span>${price.toFixed(2)} €</span>
            </div>
            <div>Consommation : ${consumption.toFixed(2)} ${u.unit}</div>
            <div style="font-size:11px;color:var(--muted)">${consumptionText}</div>
            <div>Charge : ${cost} €</div>
            <button class="util-pay-btn" onclick="payUtility('${u.id}')" ${disabled}>💳 Payer</button>
        </div>`;
    }).join('');
    let totalCostEl = document.getElementById('util-total-cost');
    if (totalCostEl) totalCostEl.textContent = Math.round(total).toLocaleString('fr-FR') + ' €';
}

function payDailyWages() {
    if (!employees) return;
    let total = employees.reduce((s, e) => s + e.wage, 0);
    if (S.cash >= total) {
        S.cash -= total;
        S.totalSpent += total;
        updateIncomeExpenseHistory(total, false);
        logAcc(`Salaires : -${fmt(total)}`, 'neg');
    } else {
        logAcc(`⚠️ Salaires impayés !`, 'neg');
    }
    updateUI();
    pushChart();
    refreshAllHappiness();
}

function payTaxes() {
    if (pendingTaxes <= 0) return;
    if (S.cash >= pendingTaxes) {
        S.cash -= pendingTaxes;
        S.totalSpent += pendingTaxes;
        updateIncomeExpenseHistory(pendingTaxes, false);
        logAcc(`Taxes : -${fmt(pendingTaxes)}`, 'neg');
        pendingTaxes = 0;
    } else {
        logAcc(`⚠️ Taxes impayées !`, 'neg');
    }
    updateUI();
    pushChart();
}

function updateLoanSlider() {
    let input = document.getElementById('loan-amount-input');
    if (!input) return;
    let value = Math.max(0, Math.min(1000000, parseInt(input.value) || 0));
    input.value = value;
    let slider = document.getElementById('loan-slider');
    if (slider) slider.value = value;
    updateLoanDisplay(value);
}

function updateLoanInput() {
    let slider = document.getElementById('loan-slider');
    if (!slider) return;
    let value = parseInt(slider.value) || 0;
    let input = document.getElementById('loan-amount-input');
    if (input) input.value = value;
    updateLoanDisplay(value);
}

function updateLoanDisplay(amount) {
    let rate = amount < 1000 ? 0.02 : 0.02 + Math.max(0, amount - 1000) / 999000 * 0.105;
    let total = Math.round(amount * (1 + rate));
    let payment = Math.round(total * 0.1);
    let displayEl = document.getElementById('loan-amount-display');
    let rateEl = document.getElementById('loan-interest-rate');
    let totalEl = document.getElementById('loan-total-amount');
    let paymentEl = document.getElementById('loan-payment-amount');
    
    if (displayEl) displayEl.textContent = amount.toLocaleString('fr-FR') + ' €';
    if (rateEl) rateEl.textContent = (rate * 100).toFixed(1) + '%';
    if (totalEl) totalEl.textContent = total.toLocaleString('fr-FR') + ' €';
    if (paymentEl) paymentEl.textContent = payment.toLocaleString('fr-FR') + ' €';
}

function takeLoan() {
    if (!S) {
        toast('Veuillez d\'abord lancer une partie', 'err');
        return;
    }
    if (currentLoan.remaining > 0) {
        toast('Vous avez déjà un prêt en cours', 'err');
        return;
    }
    let amount = parseInt(document.getElementById('loan-amount-input')?.value) || 0;
    if (amount < 1000) amount = 1000;
    let rate = amount < 1000 ? 0.02 : 0.02 + Math.max(0, amount - 1000) / 999000 * 0.105;
    let total = Math.round(amount * (1 + rate));
    currentLoan = { amount: amount, total: total, remaining: total };
    S.cash += amount;
    updateIncomeExpenseHistory(amount, true);
    logAcc(`Prêt souscrit : +${fmt(amount)}`, 'pos');
    updateUI();
    pushChart();
    closePanel('bank');
    toast(`Prêt de ${fmt(amount)} accepté !`, 'ok');
}

function payLoan() {
    if (currentLoan.remaining <= 0) return;
    let payment = Math.min(currentLoan.remaining, Math.round(currentLoan.total * 0.1));
    if (S.cash < payment) {
        logAcc(`⚠️ Remboursement prêt insuffisant !`, 'neg');
        updateUI();
        pushChart();
        checkBankruptcy();
        return;
    }
    S.cash -= payment;
    S.totalSpent += payment;
    updateIncomeExpenseHistory(payment, false);
    currentLoan.remaining -= payment;
    logAcc(`Prêt : -${fmt(payment)}`, 'neg');
    if (currentLoan.remaining <= 0) {
        currentLoan = { amount: 0, total: 0, remaining: 0 };
        logAcc(`✅ Prêt remboursé !`, 'pos');
    }
    updateUI();
    pushChart();
    checkBankruptcy();
}

function initMainChart() {
    const canvas = document.getElementById('main-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (mainChart) mainChart.destroy();
    
    if (!canvas.id) canvas.id = 'main-chart-canvas';
    
    const data = chartHistory.map(e => typeof e === 'number' ? e : e.cash);
    const bounds = getChartYBounds(data);
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartHistory.map((_, i) => i + 1),
            datasets: [{
                label: 'Trésorerie',
                data: data,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#7a7f8e', maxTicksLimit: 6 } },
                y: {
                    ticks: { color: '#7a7f8e', callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v },
                    min: bounds.min,
                    max: bounds.max
                }
            }
        }
    });
}

function updateMainChart() {
    if (!mainChart || !chartHistory.length) return;
    const data = chartHistory.map(e => typeof e === 'number' ? e : e.cash);
    const labels = chartHistory.map((_, i) => i + 1);
    const bounds = getChartYBounds(data);
    mainChart.data.labels = labels;
    mainChart.data.datasets[0].data = data;
    mainChart.options.scales.y.min = bounds.min;
    mainChart.options.scales.y.max = bounds.max;
    mainChart.update('none');
}

function pushChart() {
    if (!S) return;
    chartHistory.push({ cash: S.cash, gameTs: gameTime ? gameTime.getTime() : Date.now() });
    if (chartHistory.length > 200) chartHistory.shift();
    updateMainChart();
}

function initAccountingCharts() {
    const cashCanvas = document.getElementById('cash-chart');
    const incomeCanvas = document.getElementById('income-chart');
    const expenseCanvas = document.getElementById('expense-chart');
    
    if (cashCanvas && !cashCanvas.id) cashCanvas.id = 'cash-chart-canvas';
    if (incomeCanvas && !incomeCanvas.id) incomeCanvas.id = 'income-chart-canvas';
    if (expenseCanvas && !expenseCanvas.id) expenseCanvas.id = 'expense-chart-canvas';
    
    const ctxCash = cashCanvas?.getContext('2d');
    const ctxIncome = incomeCanvas?.getContext('2d');
    const ctxExpense = expenseCanvas?.getContext('2d');
    
    if (ctxCash) {
        if (cashChart) cashChart.destroy();
        const data = chartHistory.map(e => typeof e === 'number' ? e : e.cash);
        const bounds = getChartYBounds(data);
        cashChart = new Chart(ctxCash, {
            type: 'line',
            data: {
                labels: chartHistory.map((_, i) => i + 1),
                datasets: [{
                    label: 'Trésorerie',
                    data: data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#7a7f8e', maxTicksLimit: 6 } },
                    y: {
                        ticks: { color: '#7a7f8e', callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v },
                        min: bounds.min,
                        max: bounds.max
                    }
                }
            }
        });
    }
    
    if (ctxIncome) {
        if (incomeChart) incomeChart.destroy();
        let cumulativeIncome = [];
        let sum = 0;
        for (let i = 0; i < incomeHistory.length; i++) {
            sum += incomeHistory[i].amount;
            cumulativeIncome.push(sum);
        }
        const incomeBounds = getChartYBounds(cumulativeIncome);
        incomeChart = new Chart(ctxIncome, {
            type: 'line',
            data: {
                labels: incomeHistory.map((_, i) => i + 1),
                datasets: [{
                    label: 'Gains cumulés',
                    data: cumulativeIncome,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#7a7f8e', maxTicksLimit: 6 } },
                    y: {
                        ticks: { color: '#7a7f8e', callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v },
                        min: incomeBounds.min,
                        max: incomeBounds.max
                    }
                }
            }
        });
    }
    
    if (ctxExpense) {
        if (expenseChart) expenseChart.destroy();
        let cumulativeExpense = [];
        let sum = 0;
        for (let i = 0; i < expenseHistory.length; i++) {
            sum += expenseHistory[i].amount;
            cumulativeExpense.push(sum);
        }
        const expenseBounds = getChartYBounds(cumulativeExpense);
        expenseChart = new Chart(ctxExpense, {
            type: 'line',
            data: {
                labels: expenseHistory.map((_, i) => i + 1),
                datasets: [{
                    label: 'Dépenses cumulées',
                    data: cumulativeExpense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#7a7f8e', maxTicksLimit: 6 } },
                    y: {
                        ticks: { color: '#7a7f8e', callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v },
                        min: expenseBounds.min,
                        max: expenseBounds.max
                    }
                }
            }
        });
    }
}

function updateAccountingCharts() {
    if (cashChart) {
        const data = chartHistory.map(e => typeof e === 'number' ? e : e.cash);
        const bounds = getChartYBounds(data);
        cashChart.data.datasets[0].data = data;
        cashChart.options.scales.y.min = bounds.min;
        cashChart.options.scales.y.max = bounds.max;
        cashChart.update('none');
    }
    if (incomeChart) {
        let cumulativeIncome = [];
        let sum = 0;
        for (let i = 0; i < incomeHistory.length; i++) {
            sum += incomeHistory[i].amount;
            cumulativeIncome.push(sum);
        }
        const incomeBounds = getChartYBounds(cumulativeIncome);
        incomeChart.data.datasets[0].data = cumulativeIncome;
        incomeChart.options.scales.y.min = incomeBounds.min;
        incomeChart.options.scales.y.max = incomeBounds.max;
        incomeChart.update('none');
    }
    if (expenseChart) {
        let cumulativeExpense = [];
        let sum = 0;
        for (let i = 0; i < expenseHistory.length; i++) {
            sum += expenseHistory[i].amount;
            cumulativeExpense.push(sum);
        }
        const expenseBounds = getChartYBounds(cumulativeExpense);
        expenseChart.data.datasets[0].data = cumulativeExpense;
        expenseChart.options.scales.y.min = expenseBounds.min;
        expenseChart.options.scales.y.max = expenseBounds.max;
        expenseChart.update('none');
    }
}

function setAccountingChartView(view) {
    chartView = view;
    let btns = document.querySelectorAll('#panel-accounting .chart-view-btn');
    btns.forEach(b => b.classList.remove('active'));
    let activeBtn = document.getElementById(`cvb-${view}`);
    if (activeBtn) activeBtn.classList.add('active');
    updateAccountingCharts();
}

function renderAccountingPanel() {
    let accCash = document.getElementById('acc-cash');
    let accRevenue = document.getElementById('acc-revenue');
    let accExpenses = document.getElementById('acc-expenses');
    let accProfit = document.getElementById('acc-profit');
    let accTaxes = document.getElementById('acc-taxes');
    let accLoan = document.getElementById('acc-loan');
    
    if (accCash) accCash.innerHTML = formatCash(S.cash);
    if (accRevenue) accRevenue.textContent = fmt(S.totalEarned);
    if (accExpenses) accExpenses.textContent = fmt(S.totalSpent);
    
    let profit = S.totalEarned - S.totalSpent;
    if (accProfit) accProfit.innerHTML = formatCash(profit);
    if (accTaxes) accTaxes.textContent = fmt(pendingTaxes);
    if (accLoan) accLoan.textContent = fmt(currentLoan.remaining);
    
    renderUtilitiesPanel();
    initAccountingCharts();
    
    if (typeof forceLogsUpdate === 'function') {
        forceLogsUpdate();
    } else if (typeof renderLogs === 'function') {
        renderLogs();
    }
}