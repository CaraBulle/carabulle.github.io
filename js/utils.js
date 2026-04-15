// ==================== FONCTIONS UTILITAIRES ====================

function formatCash(value) {
    let formatted = Math.round(value).toLocaleString('fr-FR') + ' €';
    if (value > 0) return `<span style="color:var(--green)">${formatted}</span>`;
    if (value === 0) return `<span style="color:var(--purple)">${formatted}</span>`;
    return `<span style="color:var(--red)">${formatted}</span>`;
}

function fmt(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function fmtNum(n) {
    return Math.round(n).toLocaleString('fr-FR');
}

function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    if (minutes >= 60) {
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
}

function playErrorSound() {
    let audio = new Audio('sounds/error.mp3');
    audio.volume = typeof soundVolume !== 'undefined' ? soundVolume : 0.1;
    audio.play().catch(e => console.log("Audio play failed:", e));
}

let toastTimeout = null;
function toast(msg, type = '') {
    let el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = type ? `show ${type}` : 'show';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2800);
    
    if (type === 'err' && typeof playErrorSound === 'function') {
        playErrorSound();
    }
}

function showConfirm(title, message, callback, actions = null) {
    let titleEl = document.getElementById('confirm-title');
    let messageEl = document.getElementById('confirm-message');
    let actionsDiv = document.getElementById('confirm-actions');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.innerHTML = message;
    
    window.confirmCallback = callback;
    
    if (actionsDiv) {
        if (actions) {
            actionsDiv.innerHTML = actions;
        } else {
            actionsDiv.innerHTML = `<button class="tb-btn" onclick="closeConfirm()">Annuler</button><button class="tb-btn danger" id="confirm-ok">Confirmer</button>`;
            let confirmOk = document.getElementById('confirm-ok');
            if (confirmOk) {
                confirmOk.onclick = () => {
                    if (window.confirmCallback) window.confirmCallback();
                    closeConfirm();
                };
            }
        }
    }
    
    let overlay = document.getElementById('confirm-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function closeConfirm() {
    let overlay = document.getElementById('confirm-overlay');
    if (overlay) overlay.style.display = 'none';
}

function getChartYBounds(data) {
    if (!data || !data.length) return { min: 0, max: 100000 };
    let minVal = Math.min(...data);
    let maxVal = Math.max(...data);
    let margin = (maxVal - minVal) * 0.1;
    if (margin < 100) margin = 100;
    let newMin = Math.max(0, Math.floor(minVal - margin));
    let newMax = Math.ceil(maxVal + margin);
    if (newMax - newMin < 1000) newMax = newMin + 1000;
    return { min: newMin, max: newMax };
}

function getGameTimeString() {
    if (window.gameTime && typeof window.gameTime.getHours === 'function') {
        let hours = String(window.gameTime.getHours()).padStart(2, '0');
        let minutes = String(window.gameTime.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    return '00:00';
}

function logEvent(type, msg, cat) {
    let timeStr = getGameTimeString();
    
    let entry = { time: timeStr, msg: msg, type: type, category: cat };
    
    if (cat === 'prod') {
        if (!window.logProdEntries) window.logProdEntries = [];
        window.logProdEntries.unshift(entry);
        if (window.logProdEntries.length > 100) window.logProdEntries.pop();
    } else {
        if (!window.logAccEntries) window.logAccEntries = [];
        window.logAccEntries.unshift(entry);
        if (window.logAccEntries.length > 100) window.logAccEntries.pop();
    }
    renderLogs();
}

function logProd(msg, t = '') { 
    if (msg.includes('€') && !msg.includes('🔬') && !msg.includes('Achat')) return;
    logEvent(t, msg, 'prod'); 
}

function logAcc(msg, t = '') { 
    logEvent(t, msg, 'acc'); 
}

function logQuest(msg, t = '') { 
    logEvent(t, msg, 'quest'); 
}

let logRenderTimer = null;
function renderLogs() {
    if (logRenderTimer) return;
    logRenderTimer = setTimeout(() => {
        logRenderTimer = null;
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