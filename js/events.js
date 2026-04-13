// ==================== ÉVÉNEMENTS ====================
function updateDemands() { products.forEach(p => { S.productDemands[p.id] = Math.floor(Math.random() * (p.baseDemand + 1)); }); if (document.getElementById('panel-demand').classList.contains('open')) renderDemandPanel(); if (document.getElementById('panel-sell').classList.contains('open')) renderSellPanel(); }

function scheduleNextEvent() { clearTimeout(eventTimer); let d = 60000 + Math.random() * 3540000; eventEndTime = Date.now() + d; eventDuration = d; eventTimer = setTimeout(triggerEvent, d); }

function triggerEvent(evIndex = null) {
  let ev; if (evIndex !== null) { ev = EVENTS_DEF[evIndex]; } else { if (stateContractBonus && Math.random() < 0.15) { ev = EVENTS_DEF[4]; stateContractBonus = false; } else { ev = EVENTS_DEF[Math.floor(Math.random() * EVENTS_DEF.length)]; } }
  if (ev.label === '💰 Subvention' && stateContractBonus) { let d = 60000 + Math.random() * 3540000; eventEndTime = Date.now() + d * 0.6; eventDuration = d * 0.6; }
  currentEvent = { label: ev.label, text: ev.text, type: ev.type }; ev.fn(S);
  document.getElementById('ev-badge').textContent = ev.label; document.getElementById('ev-badge').className = `ev-badge ${ev.type}`; document.getElementById('ev-text').textContent = ev.text;
  logProd(`ÉVÉNEMENT : ${ev.label} — ${ev.text}`, ev.type === 'boom' ? 'pos' : ev.type === 'crisis' ? 'neg' : 'info'); updateUI(); scheduleNextEvent();
}

function updateTimerBar() { let r = Math.max(0, eventEndTime - Date.now()), p = (r / eventDuration) * 100; document.getElementById('timer-fill').style.width = p + '%'; let g = r * REAL_TO_GAME_RATIO / 1000, h = Math.floor(g / 3600), m = Math.floor((g % 3600) / 60); document.getElementById('ev-cd').textContent = h > 0 ? `${h}h ${m}m` : `${m}m`; }

function fluctuatePrices() { MATERIALS.forEach(m => { let d = (Math.random() - 0.5) * 0.15; S.prices[m.name] = Math.max(Math.round(m.base * 0.4), Math.round(S.prices[m.name] * (1 + d))); }); if (document.getElementById('panel-market').classList.contains('open')) renderMarket(); }