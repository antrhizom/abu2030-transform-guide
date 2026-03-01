// ═══════════════════════════════════════════════════════════
//  ABU 2030 TRANSFORM GUIDE — APP LOGIC
// ═══════════════════════════════════════════════════════════

import { saveResponse, getResponsesBySchool, getAllResponses } from './firebase-config.js';

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────
  // STATE
  // ────────────────────────────────────────────────────────
  const state = {
    school: null,
    schoolLabel: null,
    currentTab: 'schule',
    surveyData: {},
    edtechAssignments: { organisation: [], raeume: [], unterricht: [] },
    selectedPoolTool: null
  };

  const TAB_ORDER = ['schule', 'problematik', 'pfeiler', 'tools', 'edtech', 'einschaetzung', 'auswertung'];

  // ────────────────────────────────────────────────────────
  // TAB NAVIGATION
  // ────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabId) {
    if (!tabId) return;
    // Don't allow switching to locked tabs
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn && btn.classList.contains('locked')) return;

    tabPanels.forEach(p => p.classList.remove('active'));
    tabBtns.forEach(b => b.classList.remove('active'));

    const panel = document.getElementById('panel-' + tabId);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');

    state.currentTab = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load evaluation data when switching to auswertung
    if (tabId === 'auswertung') loadEvaluation();
  }

  function unlockTabsUpTo(tabId) {
    const idx = TAB_ORDER.indexOf(tabId);
    tabBtns.forEach(btn => {
      const bIdx = TAB_ORDER.indexOf(btn.dataset.tab);
      if (bIdx <= idx) {
        btn.classList.remove('locked');
        btn.disabled = false;
      }
    });
  }

  function markTabVisited(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('visited');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('locked')) {
        switchTab(btn.dataset.tab);
      }
    });
  });

  // Panel navigation buttons (Zurück / Weiter)
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      markTabVisited(state.currentTab);
      switchTab(btn.dataset.goto);
    });
  });

  // ────────────────────────────────────────────────────────
  // SCHOOL SELECTION
  // ────────────────────────────────────────────────────────
  const schoolBtns = document.querySelectorAll('.school-btn');
  const otherInput = document.getElementById('other-school-input');
  const otherName = document.getElementById('other-school-name');
  const confirmOther = document.getElementById('confirm-other-school');
  const headerSchoolBadge = document.getElementById('header-school-badge');
  const schoolBadgeName = document.getElementById('school-badge-name');

  function selectSchool(id, label) {
    state.school = id;
    state.schoolLabel = label;

    schoolBtns.forEach(b => b.classList.remove('selected'));
    const selectedBtn = document.querySelector(`.school-btn[data-school="${id}"]`);
    if (selectedBtn) selectedBtn.classList.add('selected');

    // Show badge
    headerSchoolBadge.style.display = 'block';
    schoolBadgeName.textContent = label;

    // Unlock all tabs
    unlockTabsUpTo('auswertung');

    // Auto-advance after short delay
    setTimeout(() => {
      markTabVisited('schule');
      switchTab('problematik');
    }, 600);
  }

  schoolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const school = btn.dataset.school;
      if (school === 'other') {
        otherInput.style.display = 'flex';
        otherName.focus();
        schoolBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      } else {
        otherInput.style.display = 'none';
        const label = btn.querySelector('.school-name').textContent;
        selectSchool(school, label);
      }
    });
  });

  if (confirmOther) {
    confirmOther.addEventListener('click', () => {
      const name = otherName.value.trim();
      if (name) {
        const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        selectSchool(id, name);
      }
    });
    otherName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmOther.click();
    });
  }

  // ────────────────────────────────────────────────────────
  // SURVEY: RATING BUTTONS (1-5)
  // ────────────────────────────────────────────────────────
  document.querySelectorAll('.rating-scale').forEach(scale => {
    const question = scale.closest('.survey-question');
    const key = question ? question.dataset.key : null;
    scale.querySelectorAll('.rate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        scale.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (key) state.surveyData[key] = parseInt(btn.dataset.value);
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // SURVEY: AGREE BUTTONS
  // ────────────────────────────────────────────────────────
  document.querySelectorAll('.agree-scale').forEach(scale => {
    const question = scale.closest('.survey-question');
    const key = question ? question.dataset.key : null;
    scale.querySelectorAll('.agree-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        scale.querySelectorAll('.agree-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (key) state.surveyData[key] = btn.dataset.value;
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // ASSESSMENT SLIDERS
  // ────────────────────────────────────────────────────────
  document.querySelectorAll('.assess-slider').forEach(slider => {
    const item = slider.closest('.assessment-item');
    const key = item ? item.dataset.key : null;
    const valEl = slider.parentElement.querySelector('.slider-value');

    slider.addEventListener('input', () => {
      if (valEl) valEl.textContent = slider.value;
      if (key) state.surveyData[key] = parseInt(slider.value);
    });

    // Init
    if (key) state.surveyData[key] = parseInt(slider.value);
  });

  // ────────────────────────────────────────────────────────
  // EDTECH TOOL ASSIGNMENT
  // ────────────────────────────────────────────────────────
  const toolPool = document.getElementById('tool-pool');
  const dropzones = document.querySelectorAll('.matrix-dropzone');

  if (toolPool) {
    toolPool.querySelectorAll('.pool-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('used')) return;
        // Toggle selection
        const wasSelected = btn.classList.contains('selected');
        toolPool.querySelectorAll('.pool-tool').forEach(b => b.classList.remove('selected'));
        if (!wasSelected) {
          btn.classList.add('selected');
          state.selectedPoolTool = btn.dataset.toolId;
          // Highlight dropzones
          dropzones.forEach(z => z.classList.add('highlight'));
        } else {
          state.selectedPoolTool = null;
          dropzones.forEach(z => z.classList.remove('highlight'));
        }
      });
    });
  }

  dropzones.forEach(zone => {
    zone.addEventListener('click', (e) => {
      if (!state.selectedPoolTool) return;
      if (e.target.classList.contains('assigned-tool')) return;

      const cat = zone.dataset.category;
      const toolId = state.selectedPoolTool;
      const toolBtn = toolPool.querySelector(`[data-tool-id="${toolId}"]`);
      const toolName = toolBtn ? toolBtn.textContent : toolId;

      // Add to category
      if (!state.edtechAssignments[cat].includes(toolId)) {
        state.edtechAssignments[cat].push(toolId);

        // Remove hint
        const hint = zone.querySelector('.dropzone-hint');
        if (hint) hint.style.display = 'none';

        // Create assigned chip
        const chip = document.createElement('span');
        chip.className = 'assigned-tool';
        chip.textContent = toolName;
        chip.dataset.toolId = toolId;
        chip.addEventListener('click', () => {
          // Remove from assignment
          state.edtechAssignments[cat] = state.edtechAssignments[cat].filter(t => t !== toolId);
          chip.remove();
          if (toolBtn) {
            toolBtn.classList.remove('used');
          }
          // Show hint if empty
          if (zone.querySelectorAll('.assigned-tool').length === 0) {
            const h = zone.querySelector('.dropzone-hint');
            if (h) h.style.display = 'block';
          }
        });
        zone.appendChild(chip);

        // Mark as used in pool
        if (toolBtn) toolBtn.classList.add('used');
      }

      // Deselect
      state.selectedPoolTool = null;
      toolPool.querySelectorAll('.pool-tool').forEach(b => b.classList.remove('selected'));
      dropzones.forEach(z => z.classList.remove('highlight'));
    });
  });

  // ────────────────────────────────────────────────────────
  // SUBMIT ALL DATA
  // ────────────────────────────────────────────────────────
  const submitBtn = document.getElementById('btn-submit-all');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      // Gather freitext
      const freitext = document.getElementById('assess-freitext');
      if (freitext && freitext.value.trim()) {
        state.surveyData.assess_freitext = freitext.value.trim();
      }

      const payload = {
        school: state.school || 'unknown',
        schoolLabel: state.schoolLabel || 'Unbekannt',
        survey: { ...state.surveyData },
        edtechAssignments: { ...state.edtechAssignments }
      };

      try {
        const id = await saveResponse(payload);
        console.log('Response saved:', id);
      } catch (e) {
        console.error('Save failed:', e);
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // EVALUATION
  // ────────────────────────────────────────────────────────
  async function loadEvaluation() {
    const schoolName = document.getElementById('eval-school-name');
    if (schoolName) schoolName.textContent = state.schoolLabel || 'Ihre Schule';

    let schoolResponses = [];
    let allResponses = [];

    try {
      schoolResponses = state.school ? await getResponsesBySchool(state.school) : [];
      allResponses = await getAllResponses();
    } catch (e) {
      console.error('Load eval failed:', e);
    }

    // Include current session data if no responses yet
    if (schoolResponses.length === 0 && Object.keys(state.surveyData).length > 0) {
      schoolResponses = [{ survey: state.surveyData, school: state.school }];
    }
    if (allResponses.length === 0 && Object.keys(state.surveyData).length > 0) {
      allResponses = [{ survey: state.surveyData, school: state.school }];
    }

    // Update counts
    const countEl = document.getElementById('eval-count');
    const totalEl = document.getElementById('eval-total');
    if (countEl) countEl.textContent = schoolResponses.length;
    if (totalEl) totalEl.textContent = allResponses.length;

    // Calculate averages for assessment dimensions
    const dims = ['digitalkultur', 'kollaboration', 'toolnutzung', 'asynchron', 'handlung', 'lernraeume'];
    const schoolAvgs = {};
    const allAvgs = {};

    dims.forEach(dim => {
      const key = 'assess_' + dim;
      // School averages
      const schoolVals = schoolResponses
        .map(r => r.survey && r.survey[key])
        .filter(v => v != null);
      schoolAvgs[dim] = schoolVals.length > 0
        ? schoolVals.reduce((a, b) => a + b, 0) / schoolVals.length
        : 5;

      // All averages
      const allVals = allResponses
        .map(r => r.survey && r.survey[key])
        .filter(v => v != null);
      allAvgs[dim] = allVals.length > 0
        ? allVals.reduce((a, b) => a + b, 0) / allVals.length
        : 5;
    });

    // Update bars
    dims.forEach(dim => {
      const bar = document.getElementById('bar-' + dim);
      const val = document.getElementById('eval-' + dim);
      if (bar) bar.style.width = (schoolAvgs[dim] * 10) + '%';
      if (val) val.textContent = schoolAvgs[dim].toFixed(1);
    });

    // Draw radar chart
    drawRadar(dims, schoolAvgs, allAvgs);

    // Build survey summary
    buildSurveySummary(schoolResponses, allResponses);
  }

  // ────────────────────────────────────────────────────────
  // RADAR CHART (Canvas)
  // ────────────────────────────────────────────────────────
  function drawRadar(dims, schoolAvgs, allAvgs) {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 50;
    const n = dims.length;

    ctx.clearRect(0, 0, W, H);

    const labels = {
      digitalkultur: 'Digitale Kultur',
      kollaboration: 'Kollaboration',
      toolnutzung: 'Tool-Nutzung',
      asynchron: 'Async. Lernen',
      handlung: 'Handlungsor.',
      lernraeume: 'Lernräume'
    };

    // Grid
    for (let ring = 2; ring <= 10; ring += 2) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (ring / 10) * R;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Labels
      const lx = cx + (R + 30) * Math.cos(angle);
      const ly = cy + (R + 30) * Math.sin(angle);
      ctx.fillStyle = '#475569';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[dims[i]] || dims[i], lx, ly);
    }

    // All schools polygon
    drawPolygon(ctx, cx, cy, R, n, dims, allAvgs, 'rgba(148,163,184,0.2)', 'rgba(148,163,184,0.6)');

    // School polygon
    drawPolygon(ctx, cx, cy, R, n, dims, schoolAvgs, 'rgba(59,130,246,0.2)', 'rgba(59,130,246,0.8)');
  }

  function drawPolygon(ctx, cx, cy, R, n, dims, avgs, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
      const val = (avgs[dims[idx]] || 5) / 10;
      const r = val * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const val = (avgs[dims[i]] || 5) / 10;
      const r = val * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
    }
  }

  // ────────────────────────────────────────────────────────
  // SURVEY SUMMARY
  // ────────────────────────────────────────────────────────
  function buildSurveySummary(schoolResponses, allResponses) {
    const container = document.getElementById('survey-summary');
    if (!container) return;

    const summaryKeys = [
      { key: 'problematik_handlung', label: 'Handlungsorientierung (1-5)', type: 'rating' },
      { key: 'problematik_zirkular', label: 'Zirkuläre Planung (1-5)', type: 'rating' },
      { key: 'problematik_digital', label: 'Digitalisierung mitdenken (1-5)', type: 'rating' },
      { key: 'pfeiler_kollaboration', label: 'Kollaboration gelebt', type: 'agree' },
      { key: 'pfeiler_asynchron', label: 'Async. Unterricht realistisch', type: 'agree' },
      { key: 'pfeiler_teilen', label: 'Bereitschaft zum Teilen', type: 'agree' }
    ];

    let html = '';
    summaryKeys.forEach(sk => {
      const vals = schoolResponses
        .map(r => r.survey && r.survey[sk.key])
        .filter(v => v != null);

      if (sk.type === 'rating') {
        const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
        html += `<div class="summary-item">
          <h5>${sk.label}</h5>
          <div class="eval-bar-wrap" style="margin-bottom:6px;">
            <div class="eval-bar" style="width:${vals.length > 0 ? (avg / 5 * 100) : 0}%;"></div>
          </div>
          <span style="font-size:1.1rem;font-weight:700;color:#3b82f6;">${avg}</span>
          <span style="font-size:0.75rem;color:#94a3b8;"> / 5 (n=${vals.length})</span>
        </div>`;
      } else {
        // Count agree values
        const counts = {};
        vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const total = vals.length || 1;
        const agreeLabels = {
          stimme_zu: 'Stimme zu',
          eher_ja: 'Eher ja',
          eher_nein: 'Eher nein',
          stimme_nicht_zu: 'Stimme nicht zu',
          ja_aktiv: 'Ja, aktiv',
          gelegentlich: 'Gelegentlich',
          selten: 'Selten',
          nein: 'Nein'
        };
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
        let bars = '<div class="summary-bar-wrap">';
        let labels = '';
        let i = 0;
        for (const [val, label] of Object.entries(agreeLabels)) {
          if (counts[val]) {
            const pct = (counts[val] / total * 100).toFixed(0);
            bars += `<div class="summary-bar-segment" style="width:${pct}%;background:${colors[i % 4]};"></div>`;
            labels += `<span class="summary-bar-label">${label}: ${counts[val]}</span> `;
          }
          i++;
        }
        bars += '</div>';
        html += `<div class="summary-item">
          <h5>${sk.label}</h5>
          ${bars}
          <div style="margin-top:4px;">${labels || '<span class="summary-bar-label">Noch keine Antworten</span>'}</div>
        </div>`;
      }
    });

    container.innerHTML = html;
  }

  // ────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────
  function init() {
    // Start on school tab
    switchTab('schule');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
