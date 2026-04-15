// ==================== FONCTIONS UI ====================

function getEmployeesInTrainingCount() {
    if (!window.employees) return 0;
    return window.employees.filter(e => e.inTraining).length;
}

function updateUI() {
    if (!S) return;
    let tbCash = document.getElementById('tb-cash');
    let tbMfree = document.getElementById('tb-mfree');
    let tbMtotal = document.getElementById('tb-mtotal');
    let tbEfree = document.getElementById('tb-efree');
    let tbEtotal = document.getElementById('tb-etotal');
    let kCash = document.getElementById('k-cash');
    let kEarned = document.getElementById('k-earned');
    let kPstock = document.getElementById('k-pstock');
    let kActive = document.getElementById('k-active');
    let kMarketShare = document.getElementById('k-market-share');
    let machinesTooltip = document.getElementById('machines-tooltip');
    let employeesTooltip = document.getElementById('employees-tooltip');
    
    if (tbCash) tbCash.innerHTML = formatCash(S.cash);
    if (tbMfree) tbMfree.textContent = freeMachinesCount();
    if (tbMtotal) tbMtotal.textContent = machines.length;
    if (tbEfree) tbEfree.textContent = freeEmployeesCount();
    if (tbEtotal) tbEtotal.textContent = productionEmployeesCount();
    if (kCash) kCash.innerHTML = formatCash(S.cash);
    if (kEarned) kEarned.textContent = fmt(S.totalEarned);
    
    let totalStock = Object.values(S.productStocks).reduce((a, b) => a + b, 0);
    if (kPstock) kPstock.textContent = totalStock;
    if (kActive) kActive.textContent = Object.keys(S.activeProductions).length;
    
    let ourShare = getOurMarketShare();
    if (kMarketShare) kMarketShare.textContent = ourShare + '%';
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    let progressBar = document.getElementById('reputation-progress-fill');
    let progressText = document.getElementById('reputation-progress-text');
    
    if (repEl && S) repEl.textContent = (S.reputation || 0).toFixed(1);
    if (tierEl && S) {
        let tier = getReputationTier();
        tierEl.textContent = tier.name;
        tierEl.style.color = tier.color;
    }
    
    let progress = getReputationProgress();
    if (progressBar) progressBar.style.width = progress.progress + '%';
    if (progressText) {
        if (progress.next === Infinity) {
            progressText.textContent = `${Math.floor(progress.current)}/${progress.needed} vers ∞`;
        } else {
            progressText.textContent = `${Math.floor(progress.current)}/${progress.needed} vers ${progress.next}`;
        }
    }
    
    if (machinesTooltip) {
        let total = machines.length;
        let functional = getFunctionalMachinesCount();
        let broken = getBrokenMachinesCount();
        let busy = getBusyMachinesCount();
        machinesTooltip.innerHTML = `📊 Machines<br>Total: ${total}<br>✅ Fonctionnelles: ${functional}<br>🔴 En panne: ${broken}<br>🔵 Occupées: ${busy}`;
    }
    
    if (employeesTooltip) {
        let total = employees.length;
        let free = freeEmployeesCount();
        let busy = usedEmployeesCount();
        let training = getEmployeesInTrainingCount();
        employeesTooltip.innerHTML = `👥 Employés<br>Total: ${total}<br>🟢 Disponibles: ${free}<br>🔵 Occupés: ${busy}<br>📚 En formation: ${training}`;
    }
    
    updateDashboardWidgets();
    updateXPDisplay();
}

function updateDashboardWidgets() {
    if (!S) return;
    let dwMok = document.getElementById('dw-mok');
    let dwMbr = document.getElementById('dw-mbr');
    if (dwMok) dwMok.textContent = getAvailableMachines().length;
    if (dwMbr) dwMbr.textContent = getBrokenMachinesCount();
    
    let ml = document.getElementById('dw-machines-list');
    if (ml) {
        let basicMachines = machines.filter(m => m.tier === 'basic');
        let advancedMachines = machines.filter(m => m.tier === 'advanced');
        let proMachines = machines.filter(m => m.tier === 'pro');
        let complexMachines = machines.filter(m => m.tier === 'complex');
        let html = '';
        if (basicMachines.length) html += `<div style="text-align:left"><span style="color:var(--amber);display:inline-block;min-width:70px">⚙️ Basic :</span> ${basicMachines.map(m => m.name).join(', ')}</div>`;
        if (advancedMachines.length) html += `<div style="text-align:left"><span style="color:var(--teal);display:inline-block;min-width:70px">🔧 Avancé :</span> ${advancedMachines.map(m => m.name).join(', ')}</div>`;
        if (proMachines.length) html += `<div style="text-align:left"><span style="color:var(--purple);display:inline-block;min-width:70px">⚡ Pro :</span> ${proMachines.map(m => m.name).join(', ')}</div>`;
        if (complexMachines.length) html += `<div style="text-align:left"><span style="color:var(--gold);display:inline-block;min-width:70px">💎 Complexe :</span> ${complexMachines.map(m => m.name).join(', ')}</div>`;
        if (!html) html = '<div class="empty-widget" style="text-align:center">Aucune machine</div>';
        ml.innerHTML = html;
    }
    
    let sl = document.getElementById('dw-stocks-list');
    if (sl) {
        let withStock = products.filter(p => (S.productStocks[p.id] || 0) > 0);
        if (withStock.length) {
            const productEmojis = {
                'Planche de bois': '🪵', 'Tissu': '🧵', 'Plastique': '🧴', 'Acier': '⚙️',
                'Verre': '🔮', 'Câble électrique': '🔌', 'Moteur simple': '⚡',
                'Circuit électronique': '💻', 'Batterie': '🔋', 'Panneau solaire': '☀️'
            };
            sl.innerHTML = withStock.slice(0, 6).map(p => {
                let emoji = productEmojis[p.name] || '📦';
                return `<div class="stock-summary-row" style="justify-content:flex-start;gap:8px">
                    <span style="min-width:30px">${emoji}</span>
                    <span style="flex:1">${p.name}</span>
                    <span style="color:var(--amber)">${S.productStocks[p.id]}</span>
                </div>`;
            }).join('');
        } else {
            sl.innerHTML = '<div class="empty-widget">📦 Aucun stock</div>';
        }
    }
    
    let qs = document.getElementById('dw-quicksell-list');
    if (qs) {
        let withStock = products.filter(p => (S.productStocks[p.id] || 0) > 0);
        if (withStock.length) {
            qs.innerHTML = withStock.slice(0, 5).map(p => `<div class="quick-sell-row">
                <span>${p.name}</span>
                <span>${S.productStocks[p.id]}</span>
                <input class="quick-sell-input" id="qs-${p.id}" value="1" min="1" max="${S.productStocks[p.id]}">
                <button class="quick-sell-btn" onclick="quickSellProduct(${p.id})">Vendre (vente au prix conseillé)</button>
            </div>`).join('');
        } else {
            qs.innerHTML = '<div class="empty-widget">📦 Aucun produit disponible</div>';
        }
    }
}

function renderProdPanel() {
    let ef = freeEmployeesCount();
    let filtered = products.filter(p => p.name.toLowerCase().includes(prodSearchTerm) && getProductTier(p) === currentProdTab);
    filtered.sort((a, b) => a.complexity - b.complexity);
    
    let prodMfree = document.getElementById('prod-mfree');
    let prodMtotal = document.getElementById('prod-mtotal');
    let prodEfree = document.getElementById('prod-efree');
    let prodEtotal = document.getElementById('prod-etotal');
    
    if (prodMfree) prodMfree.textContent = freeMachinesCount();
    if (prodMtotal) prodMtotal.textContent = machines.length;
    if (prodEfree) prodEfree.textContent = ef;
    if (prodEtotal) prodEtotal.textContent = productionEmployeesCount();
    
    let grid = document.getElementById('prod-grid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(p => {
        let unlocked = isProductUnlocked(p);
        let reqLevel = getRequiredLevelForProduct(p);
        let requiredTier = getRequiredMachineTierForProduct(p);
        let availableMachines = getAvailableMachinesForProduct(p);
        let active = S.activeProductions[p.id];
        let isActive = !!active;
        let machOk = isActive || availableMachines.length >= p.reqMachines;
        let empOk = isActive || ef >= p.reqEmployees;
        let blocked = !isActive && (!machOk || !empOk);
        let maxCycles = getMaxCycles(p);
        
        let matRows = p.mats.map(m => {
            let needed = p.qtyPerMatMap[m] || 1;
            let stock = S.materialsStock[m] || 0;
            return { mat: m, needed: needed, stock: stock, runs: Math.floor(stock / needed), ok: stock >= needed };
        });
        let minRuns = matRows.length ? Math.min(...matRows.map(r => r.runs)) : 0;
        
        if (!machineSelections[p.id]) machineSelections[p.id] = Array(p.reqMachines).fill('');
        if (!isActive && p.reqMachines > 0 && availableMachines.length >= p.reqMachines) {
            let used = new Set();
            for (let i = 0; i < p.reqMachines; i++) {
                if (!machineSelections[p.id][i]) {
                    let avail = availableMachines.find(m => !used.has(m.id));
                    if (avail) { machineSelections[p.id][i] = avail.id.toString(); used.add(avail.id); }
                }
            }
        }
        
        let machineSelectors = '';
        if (!isActive && p.reqMachines > 0) {
            machineSelectors = '<div class="machine-selector"><div class="machine-selector-title">' + p.reqMachines + ' machine(s) :</div>';
            for (let i = 0; i < p.reqMachines; i++) {
                machineSelectors += `<div class="machine-select-row">
                    <select class="machine-select" onchange="updateMachineSelection(${p.id},${i},this.value)">
                        <option value="">-- Choisir --</option>
                        ${availableMachines.map(m => `<option value="${m.id}" ${machineSelections[p.id][i] == m.id ? 'selected' : ''}>${m.name} (${m.usage}%)</option>`).join('')}
                    </select>
                </div>`;
            }
            machineSelectors += '</div>';
        }
        
        let progressBar = '';
        if (isActive) {
            let elapsed = Date.now() - active.cycleStartTime;
            let duration = active.actualTime || p.productionTimeReal;
            let progPct = Math.min(100, (elapsed / duration) * 100);
            progressBar = `<div class="progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="prod-fill-${p.id}" style="width:${progPct}%"></div>
                </div>
            </div>`;
        }
        
        let lockHtml = !unlocked ? `<div class="req-chip locked" style="margin-top:8px">🔒 Niveau ${reqLevel} requis</div>` : '';
        
        let qtyInput = `<div style="display:flex; gap:5px; align-items:center;">
            <input class="qty-input-modern" id="pqty-${p.id}" value="1" min="1" max="${maxCycles}" type="number" style="width:80px;text-align:center">
            <button class="qty-btn-modern" onclick="setMaxCycles(${p.id})" style="width:50px;">Max</button>
        </div>`;
        
        return `<div class="pcard ${!unlocked ? 'locked' : ''}">
            <div class="pcard-top">
                <span class="pcard-name">${p.name}</span>
                <span class="pcard-status ${isActive ? 'active' : blocked ? 'blocked' : 'idle'}">${isActive ? '● En production' : blocked ? '✗ Ressources' : '○ En attente'}</span>
            </div>
            <div class="req-row">
                <span class="req-chip machines ${machOk || isActive ? 'ok' : 'ko'}">⚙️ ${p.reqMachines} (${requiredTier === 'basic' ? 'Basic' : requiredTier === 'advanced' ? 'Avancé' : requiredTier === 'pro' ? 'Pro' : 'Complexe'})</span>
                <span class="req-chip employees ${empOk || isActive ? 'ok' : 'ko'}">👷 ${p.reqEmployees}</span>
                <span class="req-chip time">⏱️ ${p.productionTimeGame}min/produit</span>
            </div>
            <div class="mats-section">
                <div class="mats-section-title">Matières (${p.mats.length})</div>
                ${matRows.map(r => `<div class="mat-row">
                    <span>${MAT_MAP[r.mat]?.icon || ''} ${r.mat}</span>
                    <span>${r.needed} → 1 produit</span>
                    <span style="color:${r.ok ? 'var(--green)' : 'var(--red)'}">${r.stock}</span>
                    <span>${r.runs} produits</span>
                </div>`).join('')}
                <div>Possibles : <b>${maxCycles}</b></div>
            </div>
            ${lockHtml}
            <div class="produce-section">
                ${isActive ? 
                    `<div>${active.cyclesDone}/${active.cyclesTotal} produits</div>
                     ${progressBar}
                     <button class="stop-btn" onclick="confirmStopProduction(${p.id},'${p.name.replace(/'/g, "\\'")}')">⏹ Arrêter</button>` :
                    `<div class="prod-qty-row">
                        <button class="qty-btn-modern" onclick="cqtyProd(${p.id},-10)">-10</button>
                        <button class="qty-btn-modern" onclick="cqtyProd(${p.id},-1)">-</button>
                        ${qtyInput}
                        <button class="qty-btn-modern" onclick="cqtyProd(${p.id},1)">+</button>
                        <button class="qty-btn-modern" onclick="cqtyProd(${p.id},10)">+10</button>
                    </div>
                    ${machineSelectors}
                    <button class="produce-btn" ${!unlocked || blocked || !matRows.every(r => r.ok) || maxCycles === 0 ? 'disabled' : ''} onclick="startProductionWithMachineSelection(${p.id})">
                        ${!unlocked ? `🔒 Niv ${reqLevel}` : !machOk ? `⚙️ Manque ${p.reqMachines} ${requiredTier === 'basic' ? 'Basic' : requiredTier === 'advanced' ? 'Avancé' : requiredTier === 'pro' ? 'Pro' : 'Complexe'}` : !empOk ? `👷 Manque ${p.reqEmployees - ef}` : maxCycles === 0 ? '📦 Matières' : '▶ Lancer'}
                    </button>`
                }
            </div>
        </div>`;
    }).join('');
    updateProductionProgressBars();
}

function renderSellPanel() {
    let sellCash = document.getElementById('sell-cash');
    let sellDemandMult = document.getElementById('sell-demand-mult');
    if (sellCash) sellCash.innerHTML = formatCash(S.cash);
    if (sellDemandMult) sellDemandMult.textContent = Math.round(S.demandMult * 100) + '%';
    
    let filtered = products.filter(p => p.name.toLowerCase().includes(sellSearchTerm) && getProductTier(p) === currentSellTab);
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    let grid = document.getElementById('sell-grid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(p => {
        let stock = S.productStocks[p.id] || 0;
        let disabled = stock === 0;
        let demand = S.productDemands[p.id] || p.baseDemand;
        let recommendedPrice = Math.round(p.basePrice * 1.1);
        return `<div class="sell-card ${disabled ? 'disabled' : ''}">
            <div class="sell-top">
                <span>${p.name}</span>
                <span class="sell-stock-chip ${stock > 0 ? 'has' : 'empty'}">${stock}</span>
            </div>
            <div class="price-section">
                <input class="price-input" id="sprice-${p.id}" value="${p.basePrice}" min="1" type="number" oninput="onPriceChange(${p.id})" ${disabled ? 'disabled' : ''}>
                <div class="demand-preview">
                    <div class="demand-bar-wrap"><div class="demand-bar-fill" id="dbar-${p.id}" style="width:${Math.min(100, Math.round(demand / p.baseDemand * 100))}%"></div></div>
                    <span id="dval-${p.id}">${demand} produits demandés</span>
                </div>
                <div style="font-size:11px; color:var(--muted); margin-top:5px;">💰 Prix moyen conseillé : ${recommendedPrice} €</div>
            </div>
            <div class="sell-qty-row">
                <input class="sell-qty-input" id="sqty-${p.id}" placeholder="Qté" type="number" min="1" max="${stock}" oninput="onSellQtyChange(${p.id})" ${disabled ? 'disabled' : ''}>
                <span id="stotal-${p.id}">= 0 €</span>
            </div>
            <div id="stax-${p.id}">Taxe 20% = 0 €</div>
            <button class="sell-btn" onclick="sellProduct(${p.id})" ${disabled ? 'disabled' : ''}>Vendre</button>
        </div>`;
    }).join('');
}

function renderEmployeePanel() {
    if (!employees) return;
    
    let empTotal = document.getElementById('emp-total');
    let empBusy = document.getElementById('emp-busy');
    let empFree = document.getElementById('emp-free');
    let empTraining = document.getElementById('emp-training');
    
    if (empTotal) empTotal.textContent = employees.length;
    if (empBusy) empBusy.textContent = usedEmployeesCount();
    if (empFree) empFree.textContent = freeEmployeesCount();
    
    let trainingCount = employees.filter(e => e.inTraining).length;
    if (empTraining) empTraining.textContent = trainingCount;
    
    let grid = document.getElementById('employee-grid');
    if (!grid) return;
    
    grid.innerHTML = employees.map((e, i) => {
        if (typeof resetVacationIfNeeded === 'function') resetVacationIfNeeded(e);
        if (typeof calculateEmployeeHappiness === 'function') e.happiness = calculateEmployeeHappiness(e);
        let levelClass = e.happiness >= 70 ? 'high' : e.happiness >= 40 ? 'medium' : 'low';
        let effPercent = Math.min(100, e.efficiency);
        let spdPercent = Math.min(100, e.speed);
        let hapPercent = Math.min(100, e.happiness);
        
        return `<div class="employee-card" style="${e.inTraining ? 'opacity:0.7;border-color:var(--purple)' : ''}">
            <div class="employee-name"><span>${e.genderIcon}</span> ${e.name}${e.inTraining ? ' 📚' : ''}</div>
            <div class="employee-stat"><span>Poste</span><span>${e.job}</span></div>
            <div class="employee-stat"><span>Salaire</span><span>${e.wage} €/j</span></div>
            <div class="skills-section">
                <div class="skill-row">
                    <span class="skill-label">Efficacité</span>
                    <div class="skill-bar"><div class="skill-fill efficiency" style="width:${effPercent}%"></div></div>
                    <span class="skill-value">${e.efficiency}%</span>
                </div>
                <div class="skill-row">
                    <span class="skill-label">Rapidité</span>
                    <div class="skill-bar"><div class="skill-fill speed" style="width:${spdPercent}%"></div></div>
                    <span class="skill-value">${e.speed}%</span>
                </div>
            </div>
            <div class="employee-happiness">
                <div class="employee-happiness-header"><span>😊 Bonheur</span><span>${e.happiness}%</span></div>
                <div class="employee-happiness-bar"><div class="employee-happiness-fill ${levelClass}" style="width:${hapPercent}%"></div></div>
            </div>
            <div class="vacation-info">
                <div class="employee-stat"><span>Vacances</span><span>${e.vacationDaysLeft} j</span></div>
                ${!e.inTraining ? 
                    `<button class="tb-btn" style="width:100%;margin-top:8px" onclick="giveVacation(${i})">🏖️ 1 semaine</button>
                     <button class="tb-btn danger" style="width:100%;margin-top:4px" onclick="fireSpecificEmployee(${i})">👋 Licencier</button>` :
                    '<div style="text-align:center;padding:8px;color:var(--purple)">📚 En formation</div>'}
            </div>
        </div>`;
    }).join('');
    if (typeof updateHappinessBar === 'function') updateHappinessBar();
}

function renderJobsTab() {
    let available = employees.map((e, i) => ({ ...e, index: i })).filter(e => e.job === JOB_TYPES.NONE && !e.inTraining);
    let renderDropdown = (type) => {
        let content = document.getElementById(`dropdown-content-${type}`);
        if (content) {
            content.innerHTML = available.map(e => `<label class="dropdown-item">
                <input type="checkbox" value="${e.index}" onchange="updateSelectedEmployees('${type}',${e.index},this.checked)">
                <span class="emp-info">
                    <span class="emp-name">${e.genderIcon} ${e.name}</span>
                    <span class="emp-details">Eff:${e.efficiency}% Vit:${e.speed}% · ${e.wage}€/j</span>
                </span>
            </label>`).join('');
        }
    };
    renderDropdown('maintenance');
    renderDropdown('cleaner');
    renderDropdown('handler');
    renderDropdown('lineManager');
    renderDropdown('siteManager');
    
    let currentMaintenance = document.getElementById('current-maintenance');
    let currentCleaners = document.getElementById('current-cleaners');
    let currentHandlers = document.getElementById('current-handlers');
    let currentLineManagers = document.getElementById('current-lineManagers');
    let currentSiteManagers = document.getElementById('current-siteManagers');
    
    if (currentMaintenance) currentMaintenance.textContent = employees.filter(e => e.job === JOB_TYPES.MAINTENANCE).map(e => e.name).join(', ') || 'Aucun';
    if (currentCleaners) currentCleaners.textContent = employees.filter(e => e.job === JOB_TYPES.CLEANER).map(e => e.name).join(', ') || 'Aucun';
    if (currentHandlers) currentHandlers.textContent = employees.filter(e => e.job === JOB_TYPES.HANDLER).map(e => e.name).join(', ') || 'Aucun';
    if (currentLineManagers) currentLineManagers.textContent = employees.filter(e => e.job === JOB_TYPES.LINE_MANAGER).map(e => e.name).join(', ') || 'Aucun';
    if (currentSiteManagers) currentSiteManagers.textContent = employees.filter(e => e.job === JOB_TYPES.SITE_MANAGER).map(e => e.name).join(', ') || 'Aucun';
}

function renderTrainingTab() {
    let available = employees.map((e, i) => ({ ...e, index: i })).filter(e => !e.inTraining);
    let dropdown = document.getElementById('dropdown-content-training');
    if (dropdown) {
        dropdown.innerHTML = available.map(e => `<label class="dropdown-item">
            <input type="checkbox" value="${e.index}" onchange="updateSelectedEmployees('training',${e.index},this.checked);updateTrainingCost()">
            <span class="emp-info">
                <span class="emp-name">${e.genderIcon} ${e.name}</span>
                <span class="emp-details">Eff:${e.efficiency}% Vit:${e.speed}% · Coût:${getTrainingCost(e)}€</span>
            </span>
        </label>`).join('');
    }
    
    let trainingList = document.getElementById('training-list');
    if (trainingList) {
        let inTraining = employees.filter(e => e.inTraining);
        trainingList.innerHTML = inTraining.length ? inTraining.map(e => {
            let daysLeft = gameTime ? Math.max(0, Math.ceil((e.trainingEndTime - gameTime.getTime()) / 86400000)) : 0;
            return `<div class="log-item"><span>${e.name}</span><span>${daysLeft} jours restants</span></div>`;
        }).join('') : '<div class="empty-widget">Aucun employé en formation</div>';
    }
    updateTrainingCost();
}

function renderBonusTab() {
    let bonusSelect = document.getElementById('bonus-employee-select');
    if (bonusSelect) {
        bonusSelect.innerHTML = '<option value="">— Choisir —</option>' + employees.map((e, i) => `<option value="${i}">${e.genderIcon} ${e.name} — ${e.job}</option>`).join('');
    }
    let bonusTotalMonthEl = document.getElementById('bonus-total-month');
    if (bonusTotalMonthEl) bonusTotalMonthEl.textContent = fmt(bonusTotalMonth);
    
    let bonusLogList = document.getElementById('bonus-log-list');
    if (bonusLogList) {
        bonusLogList.innerHTML = bonusLog.length ? bonusLog.map(b => `<div class="log-item"><span class="log-time">${b.time}</span><span class="log-msg pos">+${b.amount.toLocaleString('fr-FR')} € → ${b.name}</span></div>`).join('') : '<div style="color:var(--muted)">Aucune prime</div>';
    }
}

function switchEmployeeTab(tab, el) {
    document.querySelectorAll('#panel-employees .tabs:first-child .tab').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    let listTab = document.getElementById('employee-list-tab');
    let jobsTab = document.getElementById('employee-jobs-tab');
    let trainingTab = document.getElementById('employee-training-tab');
    let bonusTab = document.getElementById('employee-bonus-tab');
    
    if (listTab) listTab.style.display = tab === 'list' ? 'block' : 'none';
    if (jobsTab) jobsTab.style.display = tab === 'jobs' ? 'block' : 'none';
    if (trainingTab) trainingTab.style.display = tab === 'training' ? 'block' : 'none';
    if (bonusTab) bonusTab.style.display = tab === 'bonus' ? 'block' : 'none';
    
    if (tab === 'list') renderEmployeePanel();
    else if (tab === 'jobs') renderJobsTab();
    else if (tab === 'training') renderTrainingTab();
    else if (tab === 'bonus') renderBonusTab();
}

function switchJobsSubTab(tab, el) {
    document.querySelectorAll('#employee-jobs-tab .tabs .tab').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    let jobsMaintenance = document.getElementById('jobs-maintenance');
    let jobsManagement = document.getElementById('jobs-management');
    if (jobsMaintenance) jobsMaintenance.style.display = tab === 'maintenance' ? 'block' : 'none';
    if (jobsManagement) jobsManagement.style.display = tab === 'management' ? 'block' : 'none';
    renderJobsTab();
}

function renderStockPanel() {
    let activeTab = document.querySelector('#panel-stock .tab.active')?.textContent;
    let items = [];
    
    if (!S) return;
    
    if (activeTab?.includes('Matières')) {
        items = MATERIALS.map(m => ({ 
            name: m.icon + ' ' + m.name, 
            stock: S.materialsStock[m.name] || 0, 
            price: S.prices[m.name], 
            value: (S.materialsStock[m.name] || 0) * S.prices[m.name] 
        }));
    } else if (activeTab?.includes('Industrie légère')) {
        items = products.filter(p => p.complexity > 10 && p.complexity <= 25).map(p => ({ 
            name: p.name, 
            stock: S.productStocks[p.id] || 0, 
            price: p.basePrice, 
            value: (S.productStocks[p.id] || 0) * p.basePrice 
        }));
    } else if (activeTab?.includes('Haute technologie')) {
        items = products.filter(p => p.complexity > 25 && p.complexity <= 50).map(p => ({ 
            name: p.name, 
            stock: S.productStocks[p.id] || 0, 
            price: p.basePrice, 
            value: (S.productStocks[p.id] || 0) * p.basePrice 
        }));
    } else if (activeTab?.includes('R&D avancée')) {
        items = products.filter(p => p.complexity > 50).map(p => ({ 
            name: p.name, 
            stock: S.productStocks[p.id] || 0, 
            price: p.basePrice, 
            value: (S.productStocks[p.id] || 0) * p.basePrice 
        }));
    } else {
        items = products.filter(p => p.complexity <= 10).map(p => ({ 
            name: p.name, 
            stock: S.productStocks[p.id] || 0, 
            price: p.basePrice, 
            value: (S.productStocks[p.id] || 0) * p.basePrice 
        }));
    }
    
    items.sort((a, b) => a.name.localeCompare(b.name));
    
    let bodyId = 'stock-materials-body';
    if (activeTab?.includes('Industrie légère')) {
        bodyId = 'stock-productsN2-body';
    } else if (activeTab?.includes('Haute technologie')) {
        bodyId = 'stock-productsN3-body';
    } else if (activeTab?.includes('R&D avancée')) {
        bodyId = 'stock-productsN4-body';
    } else if (activeTab?.includes('Produits finis')) {
        bodyId = 'stock-products-body';
    }
    
    let body = document.getElementById(bodyId);
    if (body) {
        body.innerHTML = items.map(i => `<tr>
            <td>${i.name}</td>
            <td>${i.stock}</td>
            <td>${fmt(i.price)}</td>
            <td>${fmt(i.value)}</td>
        </tr>`).join('');
    }
}

function switchStockTab(tab, el) {
    document.querySelectorAll('#panel-stock .tab').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    
    let stockMaterials = document.getElementById('stock-materials');
    let stockProducts = document.getElementById('stock-products');
    let stockProductsN2 = document.getElementById('stock-productsN2');
    let stockProductsN3 = document.getElementById('stock-productsN3');
    let stockProductsN4 = document.getElementById('stock-productsN4');
    
    if (stockMaterials) stockMaterials.style.display = 'none';
    if (stockProducts) stockProducts.style.display = 'none';
    if (stockProductsN2) stockProductsN2.style.display = 'none';
    if (stockProductsN3) stockProductsN3.style.display = 'none';
    if (stockProductsN4) stockProductsN4.style.display = 'none';
    
    if (tab === 'materials' && stockMaterials) stockMaterials.style.display = 'block';
    else if (tab === 'products' && stockProducts) stockProducts.style.display = 'block';
    else if (tab === 'productsN2' && stockProductsN2) stockProductsN2.style.display = 'block';
    else if (tab === 'productsN3' && stockProductsN3) stockProductsN3.style.display = 'block';
    else if (tab === 'productsN4' && stockProductsN4) stockProductsN4.style.display = 'block';
    
    renderStockPanel();
}

function renderMachinesPanel() {
    let level = getLevelFromXP(S.xp);
    for (let tier of ['basic', 'advanced', 'pro', 'complex']) {
        let container = document.getElementById(`machine-grid-${tier}`);
        if (!container) continue;
        let unlocked = level >= (MACHINE_TIERS[tier]?.reqLevel || 1);
        let machinesOfTier = machines.filter(m => m.tier === tier);
        let data = MACHINE_TIERS[tier];
        let owned = machinesOfTier.length > 0;
        
        let statusClass = 'locked';
        let statusText = '🔒 Verrouillé';
        let cardClass = '';
        
        if (owned) {
            let mObj = machinesOfTier[0];
            let isBusy = isMachineBusy(mObj.id);
            if (mObj.broken) {
                statusText = '🔴 Panne';
                statusClass = 'broken';
                cardClass = 'broken';
            } else if (mObj.stopped) {
                statusText = '⏸ Arrêtée';
                statusClass = 'stopped';
                cardClass = 'stopped';
            } else if (isBusy) {
                statusText = '🔵 Occupée';
                statusClass = 'busy';
                cardClass = 'busy';
            } else {
                statusText = '🟢 OK';
                statusClass = 'ok';
                cardClass = 'ok';
            }
        } else if (!unlocked) {
            statusText = `🔒 Niveau ${data?.reqLevel || 1}`;
            cardClass = 'locked';
        } else {
            statusText = '💰 Acheter';
            cardClass = '';
        }
        
        let displayName = data?.name || 'Machine';
        let usagePercent = owned ? machinesOfTier[0].usage : 0;
        let usageFillClass = usagePercent >= 70 ? 'high' : usagePercent >= 30 ? 'medium' : 'low';
        
        container.innerHTML = `<div class="machine-card ${cardClass}">
            <div class="machine-header">
                <input type="text" class="machine-name-input" value="${owned ? machinesOfTier[0].name : displayName}" ${!owned ? 'disabled style="opacity:0.5"' : ''} onchange="${owned ? `renameMachine(${machinesOfTier[0].id},this.value)` : ''}">
                <span class="machine-status ${statusClass}">${statusText}</span>
            </div>
            <div class="machine-usage">
                <div class="machine-usage-bar"><div class="machine-usage-fill ${usageFillClass}" style="width:${usagePercent}%"></div></div>
                <div class="machine-usage-text"><span>Usure</span><span>${owned ? usagePercent + '/' + 100 : '—'}</span></div>
            </div>
            <div class="machine-actions">
                ${!owned && unlocked ? `<button class="tb-btn green" onclick="buyMachineByTier('${tier}')">💸 Acheter (${fmt(data?.price || 0)})</button>` : 
                  owned ? `<button class="tb-btn ${machinesOfTier[0].stopped ? 'green' : 'amber'}" onclick="toggleMachineStop(${machinesOfTier[0].id})">${machinesOfTier[0].stopped ? '▶ Redémarrer' : '⏸ Arrêter'}</button>` : 
                  `<button class="tb-btn" disabled>🔒 Niveau ${data?.reqLevel || 1}</button>`}
            </div>
        </div>`;
    }
    let machTotal = document.getElementById('mach-total');
    let machFunctional = document.getElementById('mach-functional');
    let machBroken = document.getElementById('mach-broken');
    let machBusy = document.getElementById('mach-busy');
    
    if (machTotal) machTotal.textContent = machines.length;
    if (machFunctional) machFunctional.textContent = getFunctionalMachinesCount();
    if (machBroken) machBroken.textContent = getBrokenMachinesCount();
    if (machBusy) machBusy.textContent = getBusyMachinesCount();
}

function switchMachinesTab(tab, el) {
    document.querySelectorAll('#machines-tabs .tab').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    let machinesBasic = document.getElementById('machines-basic');
    let machinesAdvanced = document.getElementById('machines-advanced');
    let machinesPro = document.getElementById('machines-pro');
    let machinesComplex = document.getElementById('machines-complex');
    
    if (machinesBasic) machinesBasic.style.display = tab === 'basic' ? 'block' : 'none';
    if (machinesAdvanced) machinesAdvanced.style.display = tab === 'advanced' ? 'block' : 'none';
    if (machinesPro) machinesPro.style.display = tab === 'pro' ? 'block' : 'none';
    if (machinesComplex) machinesComplex.style.display = tab === 'complex' ? 'block' : 'none';
    if (tab === 'basic') renderMachinesPanel();
}

function renderDemandPanel() {
    let filtered = products.filter(p => p.name.toLowerCase().includes(demandSearchTerm));
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    let grid = document.getElementById('demand-grid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(p => {
        let demand = S.productDemands[p.id] || p.baseDemand;
        let percent = Math.min(100, Math.round(demand / p.baseDemand * 100));
        let level = percent >= 70 ? 'high' : percent >= 30 ? 'medium' : 'low';
        return `<div class="demand-card">
            <div class="demand-card-top">
                <span>${p.name}</span>
                <span class="demand-card-badge ${level}">${level === 'high' ? 'Forte' : level === 'medium' ? 'Moyenne' : 'Faible'}</span>
            </div>
            <div>Prix conseillé : ${p.basePrice} €</div>
            <div class="demand-bar-large">
                <div class="demand-bar-large-fill" style="width:${percent}%;background:${level === 'high' ? 'var(--green)' : level === 'medium' ? 'var(--amber)' : 'var(--red)'}"></div>
            </div>
            <div class="demand-stats">
                <span>Demande : ${demand} produits demandés</span>
                <span>${percent}%</span>
            </div>
        </div>`;
    }).join('');
}

function renderResearchPanel() {
    let container = document.getElementById('research-tree');
    if (!container) return;
    let pointsEl = document.getElementById('research-points');
    if (pointsEl) pointsEl.textContent = `Points de recherche : ${S.researchPoints}`;
    
    let maxX = 0;
    let researchesByPos = {};
    for (let research of researches) {
        researchesByPos[research.id] = research;
        if (research.x > maxX) maxX = research.x;
    }
    
    let html = `<div class="research-tree-container" style="position:relative; min-height:600px; overflow-x:auto; padding:20px;">
        <svg class="research-lines" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">`;
    
    for (let research of researches) {
        if (research.requires) {
            let from = researchesByPos[research.requires];
            let to = research;
            if (from && to) {
                let fromX = from.x * 220 + 110;
                let fromY = from.y * 180 + 90;
                let toX = to.x * 220 + 110;
                let toY = to.y * 180 + 90;
                html += `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="var(--border2)" stroke-width="2" stroke-dasharray="4" />`;
            }
        }
    }
    html += `</svg><div class="research-nodes" style="position:relative; z-index:2; display:flex; flex-direction:column; gap:30px;">`;
    
    let maxY = 0;
    for (let research of researches) {
        if (research.y > maxY) maxY = research.y;
    }
    
    for (let y = 0; y <= maxY; y++) {
        let rowResearches = researches.filter(r => r.y === y).sort((a, b) => a.x - b.x);
        if (rowResearches.length === 0) continue;
        
        html += `<div class="research-row" style="display:flex; gap:20px; justify-content:center; margin-bottom:20px;">`;
        
        let maxXInRow = Math.max(...rowResearches.map(r => r.x));
        for (let x = 0; x <= maxXInRow; x++) {
            let research = rowResearches.find(r => r.x === x);
            if (research) {
                let unlocked = research.unlocked;
                let researching = research.researching;
                let canUnlock = canUnlockResearch(research);
                
                let statusClass = 'locked';
                let statusText = '🔒 Verrouillé';
                if (unlocked) { statusClass = 'unlocked'; statusText = '✅ Débloqué'; }
                else if (researching) { statusClass = 'researching'; statusText = '⏳ En cours...'; }
                
                let progressPercent = 0;
                let timeLeft = '';
                if (researching && currentResearch && currentResearch.id === research.id) {
                    let remaining = Math.max(0, currentResearch.researchEndTime - Date.now());
                    progressPercent = ((currentResearch.time - remaining) / currentResearch.time) * 100;
                    timeLeft = formatTime(remaining);
                }
                let levelReqHtml = research.levelReq > 1 ? `<div class="research-node-level" style="font-size:9px;color:var(--purple);margin-top:4px;">⭐ Niveau ${research.levelReq}</div>` : '';
                
                html += `<div class="research-node ${statusClass}" style="width:200px; min-height:150px; cursor:${!unlocked && !researching && canUnlock ? 'pointer' : 'default'};" onclick="if(${!unlocked && !researching && canUnlock}) startResearch('${research.id}')">
                    <div class="research-node-name">${research.name}</div>
                    <div class="research-node-cost">💰 ${fmt(Math.floor(research.costMoney * getResearchBonus('researchCost')))}</div>
                    <div class="research-node-time">⏱ ${formatTime(research.time)}</div>
                    ${levelReqHtml}
                    <div class="research-node-status ${statusClass}">${statusText}</div>
                    ${researching && currentResearch && currentResearch.id === research.id ? 
                        `<div class="research-progress-small" style="margin-top:8px">
                            <div class="research-progress-bar-small" style="height:4px; background:var(--border); border-radius:2px; overflow:hidden;">
                                <div class="research-progress-fill-small" style="width:${progressPercent}%; height:100%; background:var(--amber);"></div>
                            </div>
                            <div class="research-progress-text-small" style="display:flex; justify-content:space-between; font-size:9px; margin-top:4px;">
                                <span>En cours...</span><span>${timeLeft}</span>
                            </div>
                        </div>` : ''}
                </div>`;
            } else {
                html += `<div class="research-node-placeholder" style="width:200px; min-height:150px; opacity:0;"></div>`;
            }
        }
        html += `</div>`;
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
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
    
    if (typeof renderUtilitiesPanel === 'function') renderUtilitiesPanel();
    if (typeof initAccountingCharts === 'function') initAccountingCharts();
    
    if (typeof forceLogsUpdate === 'function') {
        forceLogsUpdate();
    } else if (typeof renderLogs === 'function') {
        renderLogs();
    }
}

function renderContractsPanel() {
    let grid = document.getElementById('contracts-grid');
    if (!grid) return;
    if (!activeContracts.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px">Aucun contrat</div>';
        return;
    }
    
    grid.innerHTML = activeContracts.map(contract => {
        let remaining = contract.status === 'active' ? Math.max(0, contract.endTime - Date.now()) : contract.timeLimit;
        let gameRemaining = remaining * REAL_TO_GAME_RATIO / 1000;
        let hours = Math.floor(gameRemaining / 3600);
        let minutes = Math.floor((gameRemaining % 3600) / 60);
        let percent = (remaining / contract.timeLimit) * 100;
        
        let statusClass = 'available';
        let statusText = 'Disponible';
        if (contract.status === 'active') { statusClass = 'active'; statusText = 'En cours'; }
        else if (contract.status === 'completed') { statusClass = 'completed'; statusText = 'Terminé'; }
        
        let isState = contract.isState;
        let isPremium = contract.isPremium;
        let productsHtml = contract.products.map(p => {
            let stock = S.productStocks[p.id] || 0;
            let progress = Math.min(stock, p.quantity);
            let progPercent = (progress / p.quantity) * 100;
            return `<div class="contract-requirement">
                <span>📦 ${p.name}</span>
                <strong>${progress}/${p.quantity}</strong>
                <div style="width:60px;height:4px;background:var(--border);border-radius:2px;margin-left:8px;overflow:hidden">
                    <div style="width:${progPercent}%;height:100%;background:var(--blue);border-radius:2px"></div>
                </div>
            </div>`;
        }).join('');
        
        let bonusText = isState ? '<div style="font-size:11px;color:var(--gold);margin-top:4px">🏆 Contrat d\'État (récompense majorée)</div>' : '';
        let premiumText = isPremium ? '<div style="font-size:11px;color:var(--purple);margin-top:4px">💎 Contrat Premium (x1.15 récompense)</div>' : '';
        
        return `<div class="contract-card ${statusClass} ${isState ? 'state' : ''} ${isPremium ? 'premium' : ''}">
            <div class="contract-header">
                <span class="contract-icon">${contract.icon}</span>
                <span class="contract-title">${contract.client}</span>
                <span class="contract-badge ${statusClass} ${isState ? 'state' : ''}">${statusText}</span>
            </div>
            ${productsHtml}
            <div class="contract-reward ${isState ? 'state-reward' : ''}">
                <span>🏆 Récompense :</span>
                <span>${contract.reward.toLocaleString('fr-FR')} €</span>
            </div>
            ${bonusText}
            ${premiumText}
            ${contract.status === 'active' ? 
                `<div class="contract-progress">
                    <div class="contract-progress-bar">
                        <div class="contract-progress-fill" id="contract-fill-${contract.id}" style="width:${percent}%"></div>
                    </div>
                    <div class="contract-progress-text">
                        <span id="contract-time-${contract.id}">${hours}h ${minutes}m</span>
                        <span id="contract-pct-${contract.id}">${Math.round(percent)}%</span>
                    </div>
                </div>` : 
                contract.status === 'available' ? 
                `<div class="contract-deadline">⏱️ ${hours}h ${minutes}m</div>` : ''}
            <div class="contract-actions">
                ${contract.status === 'available' ? 
                    `<button class="tb-btn green" style="flex:1" onclick="acceptContract('${contract.id}')">✅ Accepter</button>` : 
                    contract.status === 'active' ? 
                    `<button class="tb-btn" disabled style="flex:1">⏳ En cours...</button>
                     <button class="tb-btn danger" onclick="cancelContract('${contract.id}')">❌ Annuler</button>` : 
                    `<button class="tb-btn purple" disabled style="flex:1">✨ Terminé !</button>`}
            </div>
        </div>`;
    }).join('');
}

function renderCompetitorsPanel() {
    let grid = document.getElementById('competitors-grid');
    if (!grid) return;
    refreshCompetitors();
    
    grid.innerHTML = competitors.map(c => {
        let trendIcon = c.trend === 'up' ? '📈 +' + c.trendValue.toFixed(1) + '%' : '📉 -' + c.trendValue.toFixed(1) + '%';
        let threatClass = c.threat;
        let fillClass = c.marketShare > 25 ? 'high' : c.marketShare > 18 ? 'medium' : 'low';
        let fillPercent = Math.min(100, c.marketShare);
        let cooldown = competitorActionCooldown[c.id] || 0;
        let canAct = cooldown === 0 || cooldown < Date.now();
        
        if (cooldown && cooldown < Date.now()) {
            delete competitorActionCooldown[c.id];
            canAct = true;
        }
        
        return `<div class="competitor-card">
            <div class="competitor-header">
                <span class="competitor-icon">${c.icon}</span>
                <span class="competitor-name">${c.name}</span>
                <span class="competitor-threat ${threatClass}">${c.threat === 'high' ? '🔴 Menace élevée' : c.threat === 'medium' ? '🟠 Menace moyenne' : '🟢 Menace faible'}</span>
            </div>
            <div class="competitor-stats">
                <div class="competitor-stat"><span class="label">Part de marché</span><span>${c.marketShare}%</span></div>
                <div class="competitor-market-share"><div class="competitor-market-fill ${fillClass}" style="width:${fillPercent}%"></div></div>
                <div class="competitor-stat"><span class="label">Tendance</span><span>${trendIcon}</span></div>
            </div>
            <div class="competitor-actions">
                <button class="competitor-action-btn" onclick="askEspionner(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>🕵️ Espionner (${fmt(ESPIONNAGE_COST)})</button>
                <button class="competitor-action-btn danger" onclick="askSaboter(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>💣 Saboter (${fmt(SABOTAGE_COST)})</button>
                <button class="competitor-action-btn gold" onclick="askCollaborer(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>🤝 Collaborer (${fmt(COLLABORATION_COST)})</button>
            </div>
            ${!canAct && cooldown ? `<div style="font-size:10px;color:var(--muted);margin-top:8px">⏱ Action disponible dans ${Math.max(1, Math.ceil((cooldown - Date.now()) / 60000))} min</div>` : ''}
        </div>`;
    }).join('');
}

function advanceGameTime(ms) {
    if (gameTime) {
        gameTime = new Date(gameTime.getTime() + ms * REAL_TO_GAME_RATIO);
        updateTimers();
    }
}

function updateTimers() {
    let realTimeEl = document.getElementById('real-time');
    let gameTimeEl = document.getElementById('game-time');
    
    if (realTimeEl) realTimeEl.textContent = new Date().toLocaleTimeString('fr-FR');
    if (gameTimeEl && gameTime) {
        let months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        gameTimeEl.textContent = `${gameTime.getDate()} ${months[gameTime.getMonth()]} ${gameTime.getFullYear()} ${String(gameTime.getHours()).padStart(2, '0')}:${String(gameTime.getMinutes()).padStart(2, '0')}`;
    }
}

function renderLogs() {
    if (window.logRenderTimer) return;
    window.logRenderTimer = setTimeout(() => {
        window.logRenderTimer = null;
        let currentHour = getGameTimeString();
        
        let prodList = document.getElementById('log-prod-list');
        if (prodList) {
            let allEntries = [...(window.logProdEntries || []), ...(window.logAccEntries || [])];
            allEntries.sort((a, b) => b.time.localeCompare(a.time));
            let filteredEntries = allEntries.filter(e => !e.msg.includes('€') || e.msg.includes('🔬')).slice(0, 30);
            let formattedEntries = filteredEntries.map(e => {
                let time = (e.time === '--:--' || !e.time) ? currentHour : e.time;
                return `<div class="log-item"><span class="log-time">${time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`;
            });
            prodList.innerHTML = formattedEntries.join('');
            if (formattedEntries.length === 0) prodList.innerHTML = '<div class="empty-widget">Aucune activité</div>';
        }
        
        let accList = document.getElementById('log-acc-list');
        if (accList && window.logAccEntries) {
            let formattedAcc = window.logAccEntries.slice(0, 30).map(e => {
                let time = (e.time === '--:--' || !e.time) ? currentHour : e.time;
                return `<div class="log-item"><span class="log-time">${time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`;
            });
            accList.innerHTML = formattedAcc.join('');
            if (formattedAcc.length === 0) accList.innerHTML = '<div class="empty-widget">Aucune transaction</div>';
        }
        
        let accountingList = document.getElementById('accounting-log-list');
        if (accountingList && window.logAccEntries) {
            let formattedAccounting = window.logAccEntries.map(e => {
                let time = (e.time === '--:--' || !e.time) ? currentHour : e.time;
                return `<div class="log-item"><span class="log-time">${time}</span><span class="log-msg ${e.type}">${e.msg}</span></div>`;
            });
            accountingList.innerHTML = formattedAccounting.join('');
            if (formattedAccounting.length === 0) accountingList.innerHTML = '<div class="empty-widget">Aucune transaction</div>';
        }
        
        if (typeof updateAccountingCharts === 'function') updateAccountingCharts();
    }, 50);
}

function forceLogsUpdate() {
    renderLogs();
}

window.renderProdPanel = renderProdPanel;
window.renderSellPanel = renderSellPanel;
window.renderMarket = renderMarket;
window.renderStockPanel = renderStockPanel;
window.renderDemandPanel = renderDemandPanel;
window.renderEmployeePanel = renderEmployeePanel;
window.renderMachinesPanel = renderMachinesPanel;
window.renderContractsPanel = renderContractsPanel;
window.renderCompetitorsPanel = renderCompetitorsPanel;
window.renderResearchPanel = renderResearchPanel;
window.renderAccountingPanel = renderAccountingPanel;
window.renderBonusTab = renderBonusTab;
window.renderJobsTab = renderJobsTab;
window.renderTrainingTab = renderTrainingTab;
window.updateUI = updateUI;
window.forceLogsUpdate = forceLogsUpdate;
window.renderLogs = renderLogs;