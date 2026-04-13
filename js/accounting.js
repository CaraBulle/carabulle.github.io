// ==================== COMPTABILITÉ & CONSOMMABLES ====================
function getUtilityConsumption(u) {
  if (u.id === 'elec') { let total = 0; machines.forEach(m => { if (!m.broken && !m.stopped) { let isProducing = Object.values(S.activeProductions).some(a => a.machinesUsed?.includes(m.id)); total += isProducing ? 1 : 0.01; } }); return total; }
  return 0;
}

function getUtilityCost(u) { let price = utilityPrices[u.id] || u.basePricePerUnit; let consumption = getUtilityConsumption(u); return Math.max(0, Math.round(consumption * price)); }

function fluctuateUtilityPrices() { UTILITIES_DEF.forEach(u => { let v = (Math.random() - 0.5) * 0.1; utilityPrices[u.id] = Math.max(0, u.basePricePerUnit * (1 + v)); }); if (document.getElementById('panel-accounting').classList.contains('open')) renderUtilitiesPanel(); }

function renderUtilitiesPanel() {
  let g = document.getElementById('util-grid'), t = 0; if (!g) return;
  g.innerHTML = UTILITIES_DEF.map(u => { let p = utilityPrices[u.id], c = getUtilityCost(u); t += c; let consumption = getUtilityConsumption(u); let consumptionText = u.id === 'elec' ? `Machines actives : ${machines.filter(m => !m.broken && !m.stopped).length} (${Object.values(S.activeProductions).reduce((s, a) => s + (a.machinesUsed?.length || 0), 0)} en production)` : 'Non utilisé'; let disabled = c === 0 ? 'disabled' : ''; return `<div class="util-card"><div class="util-card-top"><span>${u.icon} ${u.name}</span><span>${p.toFixed(2)} €</span></div><div>Consommation : ${consumption.toFixed(2)} ${u.unit}</div><div style="font-size:11px;color:var(--muted)">${consumptionText}</div><div>Charge : ${c} €</div><button class="util-pay-btn" onclick="payUtility('${u.id}')" ${disabled}>💳 Payer</button></div>`; }).join('');
  document.getElementById('util-total-cost').textContent = Math.round(t).toLocaleString('fr-FR') + ' €';
}

function payUtility(uid) { let u = UTILITIES_DEF.find(x => x.id === uid); if (!u) return; let c = getUtilityCost(u); if (c === 0) return; if (S.cash < c) return; S.cash -= c; S.totalSpent += c; logAcc(`${u.icon} ${u.name} : -${fmt(c)}`, 'neg'); updateUI(); pushChart(); toast(`${u.name} payé : -${fmt(c)}`, 'ok'); if (document.getElementById('panel-accounting').classList.contains('open')) renderAccountingPanel(); }

function payAllUtilities() {
  let t = 0; UTILITIES_DEF.forEach(u => t += getUtilityCost(u)); if (t === 0) { toast('Aucune charge à payer', ''); return; } if (S.cash < t) return;
  showConfirm('Payer tout ?', `${fmt(t)}`, () => { UTILITIES_DEF.forEach(u => { let c = getUtilityCost(u); if (c > 0) { S.cash -= c; S.totalSpent += c; logAcc(`${u.icon} ${u.name} : -${fmt(c)}`, 'neg'); } }); updateUI(); pushChart(); toast(`Charges payées : -${fmt(t)}`, 'ok'); if (document.getElementById('panel-accounting').classList.contains('open')) renderAccountingPanel(); });
}

function renderAccountingPanel() {
  document.getElementById('acc-cash').textContent = fmt(S.cash); document.getElementById('acc-revenue').textContent = fmt(S.totalEarned); document.getElementById('acc-expenses').textContent = fmt(S.totalSpent);
  let p = S.totalEarned - S.totalSpent, pe = document.getElementById('acc-profit'); pe.textContent = fmt(p); pe.style.color = p > 0 ? 'var(--green)' : p < 0 ? 'var(--red)' : 'var(--blue)';
  document.getElementById('acc-taxes').textContent = fmt(pendingTaxes); document.getElementById('acc-loan').textContent = fmt(currentLoan.remaining); renderUtilitiesPanel();
}

// ==================== CHART.JS ====================
function initChart() { const ctx = document.getElementById('chart')?.getContext('2d'); if (!ctx) return; if (chart) chart.destroy(); chartHistory = [{ cash: S.cash, gameTs: gameTime.getTime() }]; chart = new Chart(ctx, { type: 'line', data: { labels: ['0'], datasets: [{ label: 'Cash', data: [S.cash], borderColor: '#3b82f6', borderWidth: 2, fill: true, backgroundColor: 'rgba(59,130,246,0.08)', pointRadius: 2, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#7a7f8e', maxTicksLimit: 6 } }, y: { ticks: { color: '#7a7f8e', callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v } } } } }); }
function getWeekNumber(d) { const s = new Date(d.getFullYear(), 0, 1); return Math.ceil(((d - s) / 86400000 + s.getDay() + 1) / 7); }
function getChartDataForView() { if (!chartHistory.length) return { labels: [], data: [] }; const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']; if (chartView === 'realtime') { const sl = chartHistory.slice(-120); return { labels: sl.map((_, i) => i + 1), data: sl.map(e => typeof e === 'number' ? e : e.cash) }; } const groups = {}, order = []; chartHistory.forEach(e => { const cash = typeof e === 'number' ? e : e.cash; const ts = typeof e === 'number' ? gameTime.getTime() : e.gameTs; const d = new Date(ts); let key; if (chartView === 'day') key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; else if (chartView === 'week') key = `S${getWeekNumber(d)} ${d.getFullYear()}`; else if (chartView === 'month') key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; else if (chartView === 'year') key = `${d.getFullYear()}`; if (!groups[key]) order.push(key); groups[key] = cash; }); return { labels: order, data: order.map(k => groups[k]) }; }
function setChartView(view) { chartView = view; document.querySelectorAll('.chart-view-btn').forEach(b => b.classList.remove('active')); document.getElementById(`cvb-${view}`)?.classList.add('active'); updateAccountingChart(); }
function initAccountingChart() { const ctx = document.getElementById('accounting-chart')?.getContext('2d'); if (!ctx) return; if (accountingChart) { updateAccountingChart(); return; } const { labels, data } = getChartDataForView(); accountingChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Trésorerie', data, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#7a7f8e', maxTicksLimit: 10 } }, y: { ticks: { color: '#7a7f8e', callback: v => { const abs = Math.abs(v); return abs >= 1000 ? (v < 0 ? '-' : '') + (abs / 1000).toFixed(0) + 'k' : v; } } } } } }); }
function updateAccountingChart() { if (!accountingChart) return; const { labels, data } = getChartDataForView(); accountingChart.data.labels = labels; accountingChart.data.datasets[0].data = data; accountingChart.update('none'); }