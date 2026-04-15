// ==================== PANEL DEBUG ====================

let isDebugDragging = false;
let debugOffsetX = 0, debugOffsetY = 0;

function checkPassword() {
    let password = document.getElementById('debug-password').value;
    if (password === '2291') {
        closePasswordDialog();
        showDebugPanel();
    } else {
        toast('Mot de passe incorrect', 'err');
    }
}

function closePasswordDialog() {
    let overlay = document.getElementById('password-overlay');
    if (overlay) overlay.style.display = 'none';
    let input = document.getElementById('debug-password');
    if (input) input.value = '';
}

function initDebugDrag() {
    let header = document.querySelector('#debug-panel .debug-header');
    if (!header) return;
    header.style.cursor = 'grab';
    header.removeEventListener('mousedown', startDebugDrag);
    header.addEventListener('mousedown', startDebugDrag);
    document.removeEventListener('mousemove', onDebugDrag);
    document.removeEventListener('mouseup', stopDebugDrag);
    document.addEventListener('mousemove', onDebugDrag);
    document.addEventListener('mouseup', stopDebugDrag);
}

function startDebugDrag(e) {
    let panel = document.getElementById('debug-panel');
    if (!panel || e.target.closest('.debug-close-btn')) return;
    isDebugDragging = true;
    let rect = panel.getBoundingClientRect();
    debugOffsetX = e.clientX - rect.left;
    debugOffsetY = e.clientY - rect.top;
    panel.style.transform = 'none';
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.cursor = 'grabbing';
}

function onDebugDrag(e) {
    if (!isDebugDragging) return;
    let panel = document.getElementById('debug-panel');
    if (!panel) return;
    let newX = e.clientX - debugOffsetX;
    let newY = e.clientY - debugOffsetY;
    newX = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newY));
    panel.style.left = newX + 'px';
    panel.style.top = newY + 'px';
}

function stopDebugDrag() {
    isDebugDragging = false;
    let panel = document.getElementById('debug-panel');
    if (panel) panel.style.cursor = 'default';
}

function showDebugPanel() {
    let panel = document.getElementById('debug-panel');
    if (!panel) return;
    
    panel.style.display = 'flex';
    panel.style.position = 'fixed';
    panel.style.top = '50%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.margin = '0';
    
    let eventButtons = document.getElementById('debug-event-buttons');
    if (eventButtons) {
        eventButtons.innerHTML = EVENTS_DEF.map((e, i) => `<button class="tb-btn" onclick="triggerEvent(${i})">${e.label}</button>`).join('');
    }
    
    let saveInfo = localStorage.getItem('bsp5') ? JSON.parse(localStorage.getItem('bsp5')) : null;
    let saveHtml = '<div class="debug-card"><h4>💾 Sauvegarde</h4>';
    if (saveInfo) {
        saveHtml += '<p><b>Données sauvegardées :</b></p><ul style="margin-left:20px;font-size:11px">';
        saveHtml += '<li>Trésorerie (S.cash)</li><li>Produits (products)</li><li>Machines (machines)</li><li>Employés (employees)</li><li>Recherches (researches)</li><li>Contrats (activeContracts)</li><li>Quêtes actives (currentQuestActive)</li><li>Historique des graphiques (chartHistory)</li><li>Logs production (logProdEntries)</li><li>Logs comptabilité (logAccEntries)</li><li>Temps de jeu (gameTime)</li><li>Taxes en attente (pendingTaxes)</li><li>Prêt en cours (currentLoan)</li><li>Prix utilités (utilityPrices)</li><li>Réparations (repairsInProgress)</li><li>Compteur recrutement (hireCount)</li><li>Événement actuel (currentEvent)</li><li>Concurrents (competitors)</li>';
        saveHtml += '</ul>';
    } else {
        saveHtml += '<p>Aucune sauvegarde</p>';
    }
    saveHtml += '</div>';
    
    let level = getLevelFromXP(S.xp);
    let debugGrid = document.getElementById('debug-grid');
    if (debugGrid) {
        debugGrid.innerHTML = saveHtml + `
            <div class="debug-card">
                <h4>⭐ XP / Niveau</h4>
                <p>Niveau actuel : ${level}</p>
                <p>XP total : ${S.xp}</p>
                <p>XP requis niveau suivant : ${getXPRequiredForLevel(level + 1) - getXPRequiredForLevel(level)}</p>
                <div style="display:flex;gap:8px;margin-top:8px">
                    <button class="tb-btn green" onclick="addXP(100)">+100 XP</button>
                    <button class="tb-btn danger" onclick="addXP(-100)">-100 XP</button>
                    <button class="tb-btn gold" onclick="addXP(5000); renderProdPanel(); renderMachinesPanel(); updateProdTabs()">🎮 Tout débloquer (+5000 XP)</button>
                </div>
            </div>
            <div class="debug-card">
                <h4>🔬 Recherches</h4>
                <button class="tb-btn gold" onclick="unlockAllResearch()">🔓 Débloquer toutes les recherches</button>
            </div>
            <div class="debug-card">
                <h4>📜 Quêtes</h4>
                <button class="tb-btn" onclick="if(!currentQuest && !currentQuestActive){currentQuest=generateQuest();showQuestNotification();toast('Quête générée !','ok');}else toast('Une quête est déjà disponible','err')">🎲 Générer une quête</button>
                <button class="tb-btn danger" onclick="if(currentQuest){currentQuest=null;hideQuestNotification();toast('Quête supprimée','ok');}">❌ Supprimer quête</button>
                <button class="tb-btn" onclick="if(currentQuestActive){cancelQuest();}else toast('Aucune quête active','err')">❌ Abandonner quête active</button>
            </div>
            <div class="debug-card">
                <h4>⏱️ Temps</h4>
                <p>Événements : 60s-60min</p>
                <p>Salaires : 24min</p>
                <p>Taxes : 2min</p>
                <p>Prêt : 24min</p>
                <p>Demande : 60min</p>
                <p>Contrats : chaque jour</p>
            </div>
            <div class="debug-card">
                <h4>🔧 Réparations</h4>
                <p>Temps réel : 2min</p>
                <p>Temps jeu : 2h</p>
            </div>
            <div class="debug-card">
                <h4>🇫🇷 Contrat d'État</h4>
                <p>Un seul contrat d'État à la fois</p>
                <button class="tb-btn gold" onclick="forceStateContractDebug()">Forcer Contrat d'État</button>
            </div>
            <div class="debug-card">
                <h4>🏢 Concurrents</h4>
                <button class="tb-btn" onclick="refreshCompetitors(); renderCompetitorsPanel()">🔄 Forcer mise à jour concurrents</button>
            </div>
        `;
    }
    
    initDebugDrag();
}

function closeDebugPanel() {
    let panel = document.getElementById('debug-panel');
    if (panel) {
        panel.style.display = 'none';
    }
    isDebugDragging = false;
}

function forceStateContractDebug() {
    if (typeof forceStateContract === 'function') {
        forceStateContract();
    } else if (typeof window.forceStateContract === 'function') {
        window.forceStateContract();
    } else {
        if (hasStateContract) {
            toast('Un contrat d\'État existe déjà !', 'err');
            return;
        }
        let stateContract = generateStateContract();
        if (stateContract) {
            activeContracts.push(stateContract);
            hasStateContract = true;
            if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
            toast('Contrat d\'État généré !', 'ok');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let closeBtn = document.getElementById('debug-close-btn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeDebugPanel();
        };
    }
});