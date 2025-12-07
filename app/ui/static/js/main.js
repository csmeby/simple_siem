// Main Dashboard Logic

// Chart.js instance
let alertsChart = null;

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
        const alerts = await response.json();
        return alerts;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

function updateStats(alerts) {
    const total = alerts.length;
    const high = alerts.filter(a => ['HIGH', 'CRITICAL'].includes(a.severity.toUpperCase())).length;
    const medium = alerts.filter(a => a.severity.toUpperCase() === 'MEDIUM').length;
    const distinctRules = new Set(alerts.map(a => a.rule_id)).size;

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

        tr.innerHTML = `
            <td>${localTime}</td>
            <td><span class="severity ${severityClass}">${alert.severity}</span></td>
            <td>${alert.rule_id}</td>
            <td>${alert.title}</td>
            <td>${alert.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChart(alerts) {
    const ctx = document.getElementById('alertsChart').getContext('2d');

    // Group by time for visual
    const counts = {};
    alerts.forEach(a => {
        const timeKey = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        counts[timeKey] = (counts[timeKey] || 0) + 1;
    });

    const labels = Object.keys(counts).reverse();
    const data = Object.values(counts).reverse();

    if (alertsChart) alertsChart.destroy();

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
                y: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                x: { grid: { display: false }, ticks: { color: '#8b949e' } }
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

// Auto-refresh stats every 30s only if on dashboard
setInterval(() => {
    if (document.getElementById('dashboard-section').style.display !== 'none') {
        initDashboard();
    }
}, 30000);

document.addEventListener('DOMContentLoaded', initDashboard);
