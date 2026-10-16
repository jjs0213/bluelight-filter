// =========================================
// Blue Light Filter App - app.js
// =========================================

(function () {
  'use strict';

  // State
  const state = {
    filterOn: false,
    intensity: 50,
    warmth: 6500,
    scheduleEnabled: false,
    scheduleStart: '22:00',
    scheduleEnd: '07:00',
    currentTip: 0,
    scheduleCheckInterval: null,
  };

  // DOM elements
  const overlay = document.getElementById('filter-overlay');
  const powerBtn = document.getElementById('power-btn');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const toggleTitle = document.getElementById('toggle-title');
  const toggleDesc = document.getElementById('toggle-desc');
  const toggleCard = powerBtn.closest('.toggle-card');

  const intensitySlider = document.getElementById('intensity-slider');
  const intensityVal = document.getElementById('intensity-val');
  const warmthSlider = document.getElementById('warmth-slider');
  const warmthVal = document.getElementById('warmth-val');

  const intensityCard = document.getElementById('intensity-card');
  const warmthCard = document.getElementById('warmth-card');

  // Fine controls
  const intensityNum = document.getElementById('intensity-num');
  const warmthNum = document.getElementById('warmth-num');
  const stepBtns = document.querySelectorAll('.step-btn');

  const scheduleToggle = document.getElementById('schedule-toggle');
  const scheduleTimes = document.getElementById('schedule-times');
  const scheduleStart = document.getElementById('schedule-start');
  const scheduleEnd = document.getElementById('schedule-end');

  const currentTimeEl = document.getElementById('current-time');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const tipCards = document.querySelectorAll('.tip-card');
  const tipDots = document.querySelectorAll('.tip-dot');

  // =========================================
  // Filter Logic
  // =========================================

  function applyFilter() {
    if (!state.filterOn) {
      overlay.classList.remove('active');
      overlay.style.background = 'transparent';
      return;
    }

    // Convert warmth (1500-6500K) to RGB tint
    // Lower K = warmer (more orange/red), higher K = cooler (more blue, neutral)
    const warmtNorm = (state.warmth - 1500) / (6500 - 1500); // 0=warm, 1=cool

    // Warm tint: rgba orange with opacity
    // Cool = nearly transparent, warm = strong orange/amber
    const r = 255;
    const g = Math.round(100 + warmtNorm * 100); // 100 (warm) -> 200 (cool)
    const b = Math.round(warmtNorm * 60);          // 0 (warm) -> 60 (cool)

    const alpha = (state.intensity / 100) * 0.65; // max 0.65 opacity

    overlay.style.background = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    overlay.classList.add('active');

    // Update orange slider gradient
    updateSliderFill();
  }

  function toggleFilter() {
    state.filterOn = !state.filterOn;
    saveState();
    updateUI();
    applyFilter();
  }

  // =========================================
  // UI Updates
  // =========================================

  function updateUI() {
    if (state.filterOn) {
      powerBtn.classList.add('active');
      statusBadge.classList.add('active');
      statusText.textContent = '켜짐';
      toggleTitle.textContent = '필터 켜짐 ✨';
      toggleDesc.textContent = '블루라이트가 차단되고 있습니다';
      toggleCard.classList.add('filter-on');
      intensityCard.classList.add('enabled');
      warmthCard.classList.add('enabled');
    } else {
      powerBtn.classList.remove('active');
      statusBadge.classList.remove('active');
      statusText.textContent = '꺼짐';
      toggleTitle.textContent = '필터 꺼짐';
      toggleDesc.textContent = '블루라이트 필터를 켜서 눈의 피로를 줄이세요';
      toggleCard.classList.remove('filter-on');
      intensityCard.classList.remove('enabled');
      warmthCard.classList.remove('enabled');
    }
    updateSliderFill();
  }

  function updateSliderFill() {
    // Orange slider fill
    const intPct = ((state.intensity - 0) / (100 - 0)) * 100;
    intensitySlider.style.background = `linear-gradient(to right, var(--orange) ${intPct}%, rgba(255,255,255,0.1) ${intPct}%)`;

    // Warmth slider - full gradient, just track thumb position visually via CSS
    // (no fill needed, it's a color gradient) - do nothing extra
  }

  // =========================================
  // Sliders
  // =========================================

  intensitySlider.addEventListener('input', (e) => {
    setIntensity(parseFloat(e.target.value));
  });

  warmthSlider.addEventListener('input', (e) => {
    setWarmth(parseInt(e.target.value, 10));
  });

  function formatKelvin(k) {
    if (k >= 1000) return `${k.toLocaleString()}K`;
    return k + 'K';
  }

  // Shared setter: sync all controls for a target
  function setIntensity(val, skipPresetClear = false) {
    // Round to 1 decimal place, clamp 0~100
    val = Math.round(Math.max(0, Math.min(100, val)) * 10) / 10;
    state.intensity = val;
    intensitySlider.value = val;
    intensityNum.value = val;
    // Display: show 1 decimal only if needed
    intensityVal.textContent = (Number.isInteger(val) ? val : val.toFixed(1)) + '%';
    updateSliderFill();
    applyFilter();
    if (!skipPresetClear) clearActivePresets();
    saveState();
  }

  function setWarmth(val, skipPresetClear = false) {
    // Round to nearest 10K, clamp 1500~6500
    val = Math.round(Math.max(1500, Math.min(6500, val)) / 10) * 10;
    state.warmth = val;
    warmthSlider.value = val;
    warmthNum.value = val;
    warmthVal.textContent = formatKelvin(val);
    applyFilter();
    if (!skipPresetClear) clearActivePresets();
    saveState();
  }

  // =========================================
  // Presets
  // =========================================

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const intensity = parseInt(btn.dataset.intensity, 10);
      const warmth = parseInt(btn.dataset.warmth, 10);

      state.intensity = intensity;
      state.warmth = warmth;

      intensitySlider.value = intensity;
      warmthSlider.value = warmth;
      intensityVal.textContent = intensity + '%';
      warmthVal.textContent = formatKelvin(warmth);

      // Turn on filter if intensity > 0
      if (intensity > 0 && !state.filterOn) {
        state.filterOn = true;
        updateUI();
      } else if (intensity === 0 && state.filterOn) {
        state.filterOn = false;
        updateUI();
      }

      applyFilter();
      setActivePreset(btn.id);
      saveState();
      updateSliderFill();
      // Sync number inputs
      intensityNum.value = intensity;
      warmthNum.value = warmth;
    });
  });

  function setActivePreset(id) {
    presetBtns.forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
  }

  function clearActivePresets() {
    presetBtns.forEach(b => b.classList.remove('active'));
  }

  // =========================================
  // Step Buttons
  // =========================================

  stepBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;   // 'intensity' | 'warmth'
      const delta  = parseFloat(btn.dataset.delta);  // parseFloat for 0.1 support
      if (target === 'intensity') {
        setIntensity(state.intensity + delta);
      } else if (target === 'warmth') {
        setWarmth(state.warmth + delta);
      }
    });
  });

  // Number Inputs
  intensityNum.addEventListener('input', () => {
    const v = parseFloat(intensityNum.value);
    if (!isNaN(v)) setIntensity(v);
  });

  intensityNum.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIntensity(state.intensity + 0.1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIntensity(state.intensity - 0.1); }
  });

  warmthNum.addEventListener('input', () => {
    const v = parseInt(warmthNum.value, 10);
    if (!isNaN(v)) setWarmth(v);
  });

  warmthNum.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); setWarmth(state.warmth + 10); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setWarmth(state.warmth - 10); }
  });

  // =========================================
  // Power Button
  // =========================================

  powerBtn.addEventListener('click', () => {
    toggleFilter();
  });

  // =========================================
  // Schedule
  // =========================================

  scheduleToggle.addEventListener('change', () => {
    state.scheduleEnabled = scheduleToggle.checked;
    scheduleTimes.style.display = state.scheduleEnabled ? 'flex' : 'none';
    if (state.scheduleEnabled) {
      startScheduleCheck();
    } else {
      stopScheduleCheck();
    }
    saveState();
  });

  scheduleStart.addEventListener('change', () => {
    state.scheduleStart = scheduleStart.value;
    saveState();
  });

  scheduleEnd.addEventListener('change', () => {
    state.scheduleEnd = scheduleEnd.value;
    saveState();
  });

  function startScheduleCheck() {
    stopScheduleCheck();
    checkSchedule();
    state.scheduleCheckInterval = setInterval(checkSchedule, 30000); // every 30s
  }

  function stopScheduleCheck() {
    if (state.scheduleCheckInterval) {
      clearInterval(state.scheduleCheckInterval);
      state.scheduleCheckInterval = null;
    }
  }

  function checkSchedule() {
    if (!state.scheduleEnabled) return;

    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const current = hh + ':' + mm;

    const [sh, sm] = state.scheduleStart.split(':');
    const [eh, em] = state.scheduleEnd.split(':');
    const startMins = parseInt(sh) * 60 + parseInt(sm);
    const endMins = parseInt(eh) * 60 + parseInt(em);
    const currentMins = parseInt(hh) * 60 + parseInt(mm);

    let shouldBeOn;
    if (startMins <= endMins) {
      // Same day range
      shouldBeOn = currentMins >= startMins && currentMins < endMins;
    } else {
      // Crosses midnight
      shouldBeOn = currentMins >= startMins || currentMins < endMins;
    }

    if (shouldBeOn && !state.filterOn) {
      state.filterOn = true;
      updateUI();
      applyFilter();
    } else if (!shouldBeOn && state.filterOn && state.scheduleEnabled) {
      // Only turn off automatically if schedule is managing it
      state.filterOn = false;
      updateUI();
      applyFilter();
    }
  }

  // =========================================
  // Tips Carousel
  // =========================================

  let tipAutoPlay;

  function showTip(index) {
    tipCards.forEach((c, i) => c.classList.toggle('active-tip', i === index));
    tipDots.forEach((d, i) => d.classList.toggle('active', i === index));
    state.currentTip = index;
  }

  tipDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showTip(i);
      resetTipTimer();
    });
  });

  function nextTip() {
    showTip((state.currentTip + 1) % tipCards.length);
  }

  function resetTipTimer() {
    clearInterval(tipAutoPlay);
    tipAutoPlay = setInterval(nextTip, 5000);
  }

  tipAutoPlay = setInterval(nextTip, 5000);

  // =========================================
  // Clock
  // =========================================

  function updateClock() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    currentTimeEl.textContent = `${hh}:${mm}:${ss}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // =========================================
  // Persist State (localStorage)
  // =========================================

  function saveState() {
    const toSave = {
      filterOn: state.filterOn,
      intensity: state.intensity,
      warmth: state.warmth,
      scheduleEnabled: state.scheduleEnabled,
      scheduleStart: state.scheduleStart,
      scheduleEnd: state.scheduleEnd,
    };
    try {
      localStorage.setItem('bluelight-state', JSON.stringify(toSave));
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem('bluelight-state');
      if (!saved) return;
      const parsed = JSON.parse(saved);

      state.filterOn = parsed.filterOn ?? false;
      state.intensity = parsed.intensity ?? 50;
      state.warmth = parsed.warmth ?? 6500;
      state.scheduleEnabled = parsed.scheduleEnabled ?? false;
      state.scheduleStart = parsed.scheduleStart ?? '22:00';
      state.scheduleEnd = parsed.scheduleEnd ?? '07:00';
    } catch (e) { /* ignore */ }
  }

  function applyLoadedState() {
    // Sync sliders
    intensitySlider.value = state.intensity;
    warmthSlider.value = state.warmth;
    intensityVal.textContent = state.intensity + '%';
    warmthVal.textContent = formatKelvin(state.warmth);

    // Sync schedule
    scheduleToggle.checked = state.scheduleEnabled;
    scheduleStart.value = state.scheduleStart;
    scheduleEnd.value = state.scheduleEnd;
    scheduleTimes.style.display = state.scheduleEnabled ? 'flex' : 'none';

    if (state.scheduleEnabled) {
      startScheduleCheck();
    }

    updateUI();
    applyFilter();
    updateSliderFill();
    // Sync number inputs
    intensityNum.value = state.intensity;
    warmthNum.value = state.warmth;
  }

  // =========================================
  // Keyboard Shortcuts
  // =========================================

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      toggleFilter();
    }
  });

  // =========================================
  // Init
  // =========================================

  loadState();
  applyLoadedState();

  console.log('🌙 블루라이트 필터 앱 초기화 완료');
  console.log('단축키: Space = 필터 켜기/끄기');

})();
