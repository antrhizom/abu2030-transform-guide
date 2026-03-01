// ═══════════════════════════════════════════════════════════
//  ADMIN DASHBOARD — ABU 2030 TRANSFORM GUIDE
// ═══════════════════════════════════════════════════════════

import { getAllResponses } from './firebase-config.js';

(function () {
  'use strict';

  let allData = [];
  let currentFilter = 'all';

  const DIMS = [
    { key: 'assess_digitalkultur', label: 'Digitale Kultur' },
    { key: 'assess_kollaboration', label: 'Kollaboration' },
    { key: 'assess_toolnutzung', label: 'Tool-Nutzung' },
    { key: 'assess_asynchron', label: 'Async. Lernen' },
    { key: 'assess_handlung', label: 'Handlungsorientierung' },
    { key: 'assess_lernraeume', label: 'Lernräume' }
  ];

  const SURVEY_LABELS = {
    problematik_handlung: 'Handlungsorientierung (1-5)',
    problematik_zirkular: 'Zirkuläre Planung (1-5)',
    problematik_digital: 'Digitalisierung mitdenken (1-5)',
    pfeiler_kollaboration: 'Kollaboration gelebt',
    pfeiler_asynchron: 'Async. Unterricht realistisch',
    pfeiler_teilen: 'Bereitschaft zum Teilen',
    tools_moodle: 'Moodle-Nutzung',
    tools_ki: 'KI-Tools',
    tools_teams: 'Teams-Bausteine',
    edtech_vielfalt: 'Tool-Vielfalt',
    edtech_schulung: 'Schulungswunsch'
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // ────────────────────────────────────────────────────────
  // LOAD DATA
  // ────────────────────────────────────────────────────────
  async function loadData() {
    allData = await getAllResponses();
    render();
  }

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  function render() {
    const filtered = currentFilter === 'all'
      ? allData
      : allData.filter(r => r.school === currentFilter);

    renderStats(filtered);
    renderSchoolFilter();
    renderComparison();
    renderResponses(filtered);
  }

  function renderStats(data) {
    document.getElementById('admin-total').textContent = allData.length;

    const schools = new Set(allData.map(r => r.school));
    document.getElementById('admin-schools').textContent = schools.size;

    const digitalVals = data.map(r => r.survey?.assess_digitalkultur).filter(v => v != null);
    const kollabVals = data.map(r => r.survey?.assess_kollaboration).filter(v => v != null);

    document.getElementById('admin-avg-digital').textContent = digitalVals.length > 0
      ? (digitalVals.reduce((a, b) => a + b, 0) / digitalVals.length).toFixed(1) : '—';
    document.getElementById('admin-avg-kollab').textContent = kollabVals.length > 0
      ? (kollabVals.reduce((a, b) => a + b, 0) / kollabVals.length).toFixed(1) : '—';
  }

  function renderSchoolFilter() {
    const container = document.getElementById('school-filter');
    const schools = new Map();
    allData.forEach(r => {
      if (r.school && !schools.has(r.school)) {
        schools.set(r.school, r.schoolLabel || r.school);
      }
    });

    let html = '<button class="filter-btn' + (currentFilter === 'all' ? ' active' : '') + '" data-filter="all">Alle Schulen</button>';
    schools.forEach((label, id) => {
      html += `<button class="filter-btn${currentFilter === id ? ' active' : ''}" data-filter="${id}">${label}</button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
      });
    });
  }

  function renderComparison() {
    const container = document.getElementById('comparison-grid');
    const schools = new Map();
    allData.forEach(r => {
      if (r.school && !schools.has(r.school)) {
        schools.set(r.school, r.schoolLabel || r.school);
      }
    });

    let html = '';
    let colorIdx = 0;

    schools.forEach((label, schoolId) => {
      const data = allData.filter(r => r.school === schoolId);
      const color = COLORS[colorIdx % COLORS.length];

      html += `<div class="comparison-card">
        <h4 style="border-left:4px solid ${color};padding-left:12px;">${label} <span style="font-weight:400;font-size:0.82rem;color:#94a3b8;">(n=${data.length})</span></h4>`;

      DIMS.forEach(dim => {
        const vals = data.map(r => r.survey?.[dim.key]).filter(v => v != null);
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const pct = (avg / 10 * 100).toFixed(0);

        html += `<div class="comp-row">
          <span class="comp-label">${dim.label}</span>
          <div class="comp-bar-wrap"><div class="comp-bar" style="width:${pct}%;background:${color};"></div></div>
          <span class="comp-val">${avg.toFixed(1)}</span>
        </div>`;
      });

      html += '</div>';
      colorIdx++;
    });

    if (schools.size === 0) {
      html = '<p style="color:#94a3b8;">Noch keine Daten vorhanden.</p>';
    }

    container.innerHTML = html;
  }

  function renderResponses(data) {
    const container = document.getElementById('responses-list');
    if (data.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;padding:20px;">Noch keine Einschätzungen vorhanden.</p>';
      return;
    }

    let html = '';
    data.forEach((r, i) => {
      const ts = r.timestamp
        ? (typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp.seconds * 1000).toLocaleString('de-CH'))
        : '—';

      html += `<div class="response-detail">
        <h4>#${i + 1} — ${r.schoolLabel || r.school || '?'} <span style="font-weight:400;font-size:0.8rem;color:#94a3b8;">${ts}</span></h4>
        <div class="detail-grid">`;

      // Assessment values
      DIMS.forEach(dim => {
        const val = r.survey?.[dim.key];
        html += `<div class="detail-item">
          <div class="dlabel">${dim.label}</div>
          <div class="dvalue">${val != null ? val + ' / 10' : '—'}</div>
        </div>`;
      });

      // Survey values
      for (const [key, label] of Object.entries(SURVEY_LABELS)) {
        const val = r.survey?.[key];
        if (val != null) {
          html += `<div class="detail-item">
            <div class="dlabel">${label}</div>
            <div class="dvalue">${val}</div>
          </div>`;
        }
      }

      html += '</div>';

      // Freitext
      if (r.survey?.assess_freitext) {
        html += `<div class="freitext-box">&laquo;${r.survey.assess_freitext}&raquo;</div>`;
      }

      // EdTech assignments
      if (r.edtechAssignments) {
        const cats = { organisation: 'Organisation', raeume: 'Räume', unterricht: 'Unterricht' };
        let hasAssignments = false;
        for (const [cat, tools] of Object.entries(r.edtechAssignments)) {
          if (tools && tools.length > 0) hasAssignments = true;
        }
        if (hasAssignments) {
          html += '<div style="margin-top:12px;"><strong style="font-size:0.85rem;">EdTech-Zuordnung:</strong><div style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap;">';
          for (const [cat, tools] of Object.entries(r.edtechAssignments)) {
            if (tools && tools.length > 0) {
              html += `<div style="font-size:0.82rem;"><span style="color:#94a3b8;">${cats[cat] || cat}:</span> ${tools.join(', ')}</div>`;
            }
          }
          html += '</div></div>';
        }
      }

      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ────────────────────────────────────────────────────────
  // CSV EXPORT
  // ────────────────────────────────────────────────────────
  function exportCSV() {
    if (allData.length === 0) return;

    const headers = ['Schule', 'Schul-Label', 'Zeitstempel'];
    DIMS.forEach(d => headers.push(d.label));
    Object.entries(SURVEY_LABELS).forEach(([, label]) => headers.push(label));
    headers.push('Freitext', 'EdTech-Organisation', 'EdTech-Räume', 'EdTech-Unterricht');

    const rows = allData.map(r => {
      const row = [
        r.school || '',
        r.schoolLabel || '',
        r.timestamp ? (typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp.seconds * 1000).toISOString()) : ''
      ];
      DIMS.forEach(d => row.push(r.survey?.[d.key] ?? ''));
      Object.keys(SURVEY_LABELS).forEach(k => row.push(r.survey?.[k] ?? ''));
      row.push(r.survey?.assess_freitext || '');
      row.push((r.edtechAssignments?.organisation || []).join('; '));
      row.push((r.edtechAssignments?.raeume || []).join('; '));
      row.push((r.edtechAssignments?.unterricht || []).join('; '));
      return row;
    });

    let csv = headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abu2030_transform_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ────────────────────────────────────────────────────────
  // EVENTS
  // ────────────────────────────────────────────────────────
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
  document.getElementById('btn-refresh')?.addEventListener('click', loadData);

  // ────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────
  loadData();

})();
