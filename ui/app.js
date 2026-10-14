// Antigravity Nexus - Modern Controller Logic
// Communicates with Tauri IPC commands

function getInvoke() {
  if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
    return window.__TAURI__.core.invoke;
  }
  if (window.__TAURI__ && window.__TAURI__.invoke) {
    return window.__TAURI__.invoke;
  }
  if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
    return window.__TAURI_INTERNALS__.invoke;
  }
  return null;
}

// DOM Elements
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');
const btnRefresh = document.getElementById('btn-refresh');
const btnActivate = document.getElementById('btn-activate');
const btnDeactivate = document.getElementById('btn-deactivate');

const statusChip = document.getElementById('status-chip');
const statusChipText = document.getElementById('status-chip-text');
const coreCard = document.querySelector('.core-card');
const coreStateTitle = document.getElementById('core-state-title');
const coreStateDesc = document.getElementById('core-state-desc');

const itemGeminiGlobal = document.getElementById('item-gemini-global');
const itemGeminiConfig = document.getElementById('item-gemini-config');
const itemKiroSteering = document.getElementById('item-kiro-steering');

const logBanner = document.getElementById('log-banner');
const logText = document.getElementById('log-text');

function setLog(message, isError = false) {
  if (logText) {
    logText.textContent = message;
    if (isError) {
      logBanner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
      logBanner.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    }
  }
}

function updateBadge(itemEl, isActive) {
  const badge = itemEl.querySelector('.target-state');
  if (badge) {
    if (isActive) {
      badge.textContent = 'Aktif';
      badge.className = 'target-state badge-active';
    } else {
      badge.textContent = 'Yok';
      badge.className = 'target-state badge-empty';
    }
  }
}

function updateUI(status) {
  // Update targets
  updateBadge(itemGeminiGlobal, status.gemini_global);
  updateBadge(itemGeminiConfig, status.gemini_config);
  updateBadge(itemKiroSteering, status.kiro_steering);

  // Update Core Card
  if (status.all_active) {
    coreCard.classList.add('active');
    statusChip.className = 'status-chip online';
    statusChipText.textContent = 'KORUMA AKTİF';
    coreStateTitle.textContent = 'Nexus Core Devrede';
    coreStateDesc.textContent = 'Tüm hedefler senkronize. Antigravity & Kiro tam yetkiyle çalışıyor.';
  } else {
    coreCard.classList.remove('active');
    statusChip.className = 'status-chip offline';
    statusChipText.textContent = 'DEVRE DIŞI';
    coreStateTitle.textContent = 'Koruma Modu Pasif';
    coreStateDesc.textContent = 'Tüm IDE yapılandırmaları orijinal halinde veya henüz enjekte edilmedi.';
  }
}

async function refreshStatus() {
  const invoke = getInvoke();
  if (!invoke) {
    setLog('Tauri IPC bekleniyor...');
    return;
  }
  try {
    const status = await invoke('check_status');
    updateUI(status);
    setLog('Canlı durum güncellendi.');
  } catch (err) {
    setLog(`Durum kontrolü hatası: ${err}`, true);
  }
}

async function activate() {
  const invoke = getInvoke();
  if (!invoke) {
    setLog('Tauri IPC hazır değil!', true);
    return;
  }
  btnActivate.disabled = true;
  setLog('Nexus kuralları çekiliyor ve uygulanıyor...');
  try {
    const res = await invoke('activate_bypass');
    updateUI(res.status);
    setLog(res.message, !res.success);
  } catch (err) {
    setLog(`Hata: ${err}`, true);
  } finally {
    btnActivate.disabled = false;
  }
}

async function deactivate() {
  const invoke = getInvoke();
  if (!invoke) {
    setLog('Tauri IPC hazır değil!', true);
    return;
  }
  btnDeactivate.disabled = true;
  setLog('Hedefler temizleniyor...');
  try {
    const res = await invoke('deactivate_bypass');
    updateUI(res.status);
    setLog(res.message, !res.success);
  } catch (err) {
    setLog(`Hata: ${err}`, true);
  } finally {
    btnDeactivate.disabled = false;
  }
}

// Window control listeners
if (btnMinimize) {
  btnMinimize.addEventListener('click', () => {
    const invoke = getInvoke();
    if (invoke) invoke('minimize_app');
  });
}

if (btnClose) {
  btnClose.addEventListener('click', () => {
    const invoke = getInvoke();
    if (invoke) invoke('close_app');
  });
}

if (btnRefresh) {
  btnRefresh.addEventListener('click', refreshStatus);
}

if (btnActivate) {
  btnActivate.addEventListener('click', activate);
}

if (btnDeactivate) {
  btnDeactivate.addEventListener('click', deactivate);
}

// Auto initial check with retry until IPC is bound
window.addEventListener('DOMContentLoaded', () => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    if (getInvoke()) {
      clearInterval(timer);
      refreshStatus();
    } else if (attempts > 20) {
      clearInterval(timer);
      setLog('Önizleme modu: Tauri IPC hazır değil.');
    }
  }, 100);
});
