// Main Dashboard Logic

// Chart.js instance
let alertsChart = null;

// Rule Cache
let rulesCache = {};

// Settings State
let settings = {
    theme: 'dark',
    autoRefresh: true
};

let refreshIntervalId = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applySettings();
    loadRulesCache(); // Pre-fetch rules for lookups (e.g. popups)

    // If starting on dashboard (default), load it
    if (document.getElementById('dashboard-section').style.display !== 'none') {
        initDashboard();
    }

    // Bind Settings Inputs
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        settings.theme = e.target.checked ? 'light' : 'dark';
        saveSettings();
        applySettings();
    });

    document.getElementById('refresh-toggle').addEventListener('change', (e) => {
        settings.autoRefresh = e.target.checked;
        saveSettings();
        applySettings();
    });

    // Modal Close
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('rule-modal').style.display = "none";
    });
    // Close on click outside
    window.onclick = function (event) {
        if (event.target == document.getElementById('rule-modal')) {
            document.getElementById('rule-modal').style.display = "none";
        }
    }
});

// --- Settings Management ---
function loadSettings() {
    const saved = localStorage.getItem('siem-settings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}

function saveSettings() {
    localStorage.setItem('siem-settings', JSON.stringify(settings));
}

function applySettings() {
    // Theme
    if (settings.theme === 'light') {
        document.body.classList.add('light-theme');
        const themeCheck = document.getElementById('theme-toggle');
        if (themeCheck) themeCheck.checked = true;
    } else {
        document.body.classList.remove('light-theme');
        const themeCheck = document.getElementById('theme-toggle');
        if (themeCheck) themeCheck.checked = false;
    }

    // Refresh Logic
    const refreshCheck = document.getElementById('refresh-toggle');
    if (refreshCheck) refreshCheck.checked = settings.autoRefresh;

    if (settings.autoRefresh) {
        if (!refreshIntervalId) {
            refreshIntervalId = setInterval(() => {
                if (document.getElementById('dashboard-section').style.display !== 'none') {
                    initDashboard();
                }
            }, 30000);
            console.log("Auto-refresh started");
        }
    } else {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
            console.log("Auto-refresh stopped");
        }
    }
}

// --- Navigation ---
function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
    // Show target section
    document.getElementById(sectionId).style.display = 'block';

    // Update Sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${sectionId}"]`).classList.add('active');

    // Trigger data load
    if (sectionId === 'events-section') loadEvents();
    if (sectionId === 'rules-section') loadRules();
    if (sectionId === 'dashboard-section') initDashboard();
}

// --- Dashboard ---
async function fetchAlerts() {
    try {
        const response = await fetch('/alerts?limit=100');
        return await response.json();
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

async function loadRulesCache() {
    try {
        const res = await fetch('/rules/');
        const rules = await res.json();
        rules.forEach(r => {
            rulesCache[r.id] = r;
        });
    } catch (e) {
        console.error("Error loading rules cache", e);
    }
}

async function closeAlert(id) {
    try {
        await fetch(`/alerts/${id}?status=closed`, { method: 'PATCH' });
        initDashboard();
    } catch (e) {
        console.error("Error closing alert", e);
    }
}

function openRuleModal(ruleId) {
    const rule = rulesCache[ruleId];
    if (rule) {
        document.getElementById('modal-title').innerText = `${rule.id}: ${rule.name}`;
        document.getElementById('modal-desc').innerText = rule.description || "No description available.";
        document.getElementById('modal-summary').innerText = rule.summary || "No summary available in rule definition.";
        document.getElementById('rule-modal').style.display = "block";
    } else {
        alert("Rule definition not found.");
    }
}

function updateStats(alerts) {
    const activeAlerts = alerts.filter(a => a.status !== 'closed');
    const total = activeAlerts.length;
    const high = activeAlerts.filter(a => ['HIGH', 'CRITICAL'].includes(a.severity.toUpperCase())).length;
    const medium = activeAlerts.filter(a => a.severity.toUpperCase() === 'MEDIUM').length;
    const distinctRules = new Set(activeAlerts.map(a => a.rule_id)).size;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-high').innerText = high;
    document.getElementById('stat-medium').innerText = medium;
    document.getElementById('stat-rules').innerText = distinctRules;
}

function renderAlertsTable(alerts) {
    const tbody = document.querySelector('#alerts-table tbody');
    tbody.innerHTML = '';

    alerts.slice(0, 50).forEach(alert => {
        const tr = document.createElement('tr');
        const severityClass = `severity-${alert.severity.toLowerCase()}`;
        const localTime = new Date(alert.timestamp).toLocaleString();

        let closeBtn = '';
        if (alert.status !== 'closed') {
            closeBtn = `<button class="btn" style="padding: 2px 8px; font-size: 12px;" onclick="closeAlert('${alert.id}')">Close</button>`;
        } else {
            closeBtn = `<span style="color: var(--text-secondary)">Closed</span>`;
        }

        // Info Bubbles
        const infoIcon = `<span style="cursor: pointer; margin-left:8px; font-size:16px;" onclick="openRuleModal('${alert.rule_id}')" title="View Summary">ℹ️</span>`;

        tr.innerHTML = `
            <td>${localTime}</td>
            <td><span class="severity ${severityClass}">${alert.severity}</span></td>
            <td>${alert.rule_id}</td>
            <td>${infoIcon} ${alert.title}</td>
            <td>${alert.status}</td>
            <td>${closeBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChart(alerts) {
    const ctx = document.getElementById('alertsChart').getContext('2d');

    const counts = {};
    alerts.forEach(a => {
        const timeKey = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        counts[timeKey] = (counts[timeKey] || 0) + 1;
    });

    const labels = Object.keys(counts).reverse();
    const data = Object.values(counts).reverse();

    if (alertsChart) alertsChart.destroy();

    // Determine grid color based on computed style for better theme support
    const computedStyle = getComputedStyle(document.body);
    const borderColor = computedStyle.getPropertyValue('--border-color').trim();
    const textColor = computedStyle.getPropertyValue('--text-secondary').trim();

    alertsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Alerts Timeline',
                data: data,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: borderColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });
}

async function initDashboard() {
    const alerts = await fetchAlerts();
    if (alerts) {
        updateStats(alerts);
        renderAlertsTable(alerts);
        renderChart(alerts);
    }
}

// --- Events ---
async function loadEvents() {
    try {
        const res = await fetch('/events/?limit=100');
        const events = await res.json();
        const tbody = document.querySelector('#events-table tbody');
        tbody.innerHTML = '';

        events.forEach(evt => {
            const tr = document.createElement('tr');
            const localTime = new Date(evt.timestamp).toLocaleString();
            tr.innerHTML = `
                <td>${localTime}</td>
                <td>${evt.host}</td>
                <td>${evt.source}</td>
                <td>${evt.message}</td>
                <td>${evt.severity}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading events", e);
    }
}

// --- Rules ---
async function loadRules() {
    try {
        const res = await fetch('/rules/');
        const rules = await res.json();
        const tbody = document.querySelector('#rules-table tbody');
        tbody.innerHTML = '';

        rules.forEach(rule => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rule.id}</td>
                <td>${rule.name}</td>
                <td>${rule.description}</td>
                <td><span class="severity severity-${rule.severity.toLowerCase()}">${rule.severity.toUpperCase()}</span></td>
                <td>${rule.mitre_attack || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading rules", e);
    }
}
