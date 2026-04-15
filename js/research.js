// ==================== ARBRE DE RECHERCHE ====================

function initResearches() {
    let allResearches = [];
    for (let branch of RESEARCH_TREE_DATA[0].branches) {
        for (let child of branch.children) {
            allResearches.push({
                id: child.id,
                name: child.name,
                desc: child.desc,
                costMoney: child.cost,
                time: child.time,
                levelReq: child.levelReq || 1,
                effect: child.effect,
                unlocked: false,
                researching: false,
                researchEndTime: 0,
                requires: child.requires || null,
                branch: branch.name,
                x: child.x || 0,
                y: child.y || 0
            });
        }
    }
    researches = allResearches;
    currentResearch = null;
    if (researchInterval) { clearInterval(researchInterval); researchInterval = null; }
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

function canUnlockResearch(research) {
    if (research.unlocked) return false;
    if (research.researching) return false;
    if (currentResearch && currentResearch.researching) return false;
    let level = getLevelFromXP(S.xp);
    if (level < research.levelReq) return false;
    let costReduction = getResearchBonus('researchCost');
    let actualCost = Math.floor(research.costMoney * costReduction);
    if (S.cash < actualCost) return false;
    if (research.requires) {
        let required = researches.find(r => r.id === research.requires);
        if (!required || !required.unlocked) return false;
    }
    return true;
}

function startResearch(researchId) {
    let research = researches.find(r => r.id === researchId);
    if (!research || !canUnlockResearch(research)) return;
    if (currentResearch && currentResearch.researching) {
        toast('Une recherche est déjà en cours !', 'err');
        return;
    }
    let costReduction = getResearchBonus('researchCost');
    let actualCost = Math.floor(research.costMoney * costReduction);
    S.cash -= actualCost;
    S.totalSpent += actualCost;
    updateIncomeExpenseHistory(actualCost, false);
    research.researching = true;
    research.researchEndTime = Date.now() + research.time;
    currentResearch = research;
    
    logProd(`🔬 Lancement recherche : ${research.name}`, 'info');
    logAcc(`🔬 Achat recherche ${research.name} : -${fmt(actualCost)}`, 'neg');
    
    toast(`🔬 Recherche lancée : ${research.name} !`, 'ok');
    updateUI();
    if (researchInterval) clearInterval(researchInterval);
    researchInterval = setInterval(updateResearchProgress, 500);
    if (document.getElementById('panel-research')?.classList.contains('open')) renderResearchPanel();
}

function updateResearchProgress() {
    if (!currentResearch || !currentResearch.researching) {
        if (researchInterval) { clearInterval(researchInterval); researchInterval = null; }
        return;
    }
    let now = Date.now();
    if (now >= currentResearch.researchEndTime) {
        currentResearch.unlocked = true;
        currentResearch.researching = false;
        if (currentResearch.effect.type === 'demand') S.demandMult *= currentResearch.effect.value;
        if (currentResearch.effect.type === 'competitor' && typeof updateCompetitorImpact === 'function') updateCompetitorImpact();
        if (currentResearch.effect.type === 'efficiency' && typeof refreshAllHappiness === 'function') refreshAllHappiness();
        if (currentResearch.effect.type === 'utility') {
            UTILITIES_DEF.forEach(u => {
                utilityPrices[u.id] = u.basePricePerUnit * currentResearch.effect.value;
            });
        }
        if (currentResearch.id === 'competitor' || currentResearch.id === 'ieds' || currentResearch.id === 'smokepop') {
            let competitorsBtn = document.getElementById('competitors-btn');
            if (competitorsBtn) competitorsBtn.style.display = 'inline-block';
        }
        logProd(`🔬 Recherche terminée : ${currentResearch.name} !`, 'pos');
        toast(`🔬 ${currentResearch.name} terminée !`, 'ok');
        currentResearch = null;
        if (researchInterval) { clearInterval(researchInterval); researchInterval = null; }
        if (document.getElementById('panel-research')?.classList.contains('open')) renderResearchPanel();
        updateUI();
    } else {
        if (document.getElementById('panel-research')?.classList.contains('open')) renderResearchPanel();
    }
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

function unlockAllResearch() {
    for (let r of researches) {
        if (!r.unlocked && !r.researching) {
            r.unlocked = true;
            if (r.effect.type === 'demand') S.demandMult *= r.effect.value;
            if (r.effect.type === 'competitor' && typeof updateCompetitorImpact === 'function') updateCompetitorImpact();
            if (r.effect.type === 'efficiency' && typeof refreshAllHappiness === 'function') refreshAllHappiness();
            if (r.effect.type === 'utility') {
                UTILITIES_DEF.forEach(u => {
                    utilityPrices[u.id] = u.basePricePerUnit * r.effect.value;
                });
            }
            if (r.id === 'competitor' || r.id === 'ieds' || r.id === 'smokepop') {
                let competitorsBtn = document.getElementById('competitors-btn');
                if (competitorsBtn) competitorsBtn.style.display = 'inline-block';
            }
        }
    }
    if (currentResearch && currentResearch.researching) {
        currentResearch.researching = false;
        currentResearch = null;
        if (researchInterval) { clearInterval(researchInterval); researchInterval = null; }
    }
    toast('🔓 Toutes les recherches débloquées !', 'ok');
    if (document.getElementById('panel-research')?.classList.contains('open') && typeof renderResearchPanel === 'function') renderResearchPanel();
    if (typeof updateUI === 'function') updateUI();
}