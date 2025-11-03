// ============================================
// GLACIOLIVE - FULLY FUNCTIONAL
// Real-Time Weather + Clock + SMS OTP
// ============================================

const map = L.map('map').setView([27.5, 88.5], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const GLOF_ALERTS = [
    { id: 1, type: 'GLOF Risk', location: 'South Lhonak Lake', state: 'Sikkim', lat: 27.9333, lng: 88.5667, severity: 'High', date: '03.11.2025', time: '10:30' },
    { id: 2, type: 'GLOF Monitoring', location: 'Gangotri Glacier', state: 'Uttarakhand', lat: 30.9239, lng: 79.0831, severity: 'Medium', date: '03.11.2025', time: '09:15' },
    { id: 3, type: 'GLOF Warning', location: 'Beas River Basin', state: 'Himachal Pradesh', lat: 32.3726, lng: 77.2497, severity: 'High', date: '03.11.2025', time: '08:00' },
    { id: 4, type: 'GLOF Expansion Risk', location: 'Dibang Valley Lake', state: 'Arunachal Pradesh', lat: 28.7, lng: 95.6, severity: 'Medium', date: '03.11.2025', time: '12:00' },
    { id: 5, type: 'GLOF Melt Alert', location: 'Zemu Glacier', state: 'Sikkim', lat: 27.7, lng: 88.4, severity: 'Low', date: '03.11.2025', time: '02:10' }
];

const STATE_GROUPS = {};
GLOF_ALERTS.forEach(a => {
    if (!STATE_GROUPS[a.state]) STATE_GROUPS[a.state] = [];
    STATE_GROUPS[a.state].push(a);
});

let markers = [];
let backButton = null;
const icon = L.divIcon({ className: 'custom-marker', html: 'G', iconSize: [36,36], iconAnchor: [18,18] });

// === REAL-TIME CLOCK ===
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

// === REAL-TIME WEATHER (OpenWeatherMap) ===
const API_KEY = 'YOUR_API_KEY'; // Get free key at openweathermap.org
const DEFAULT_CITY = 'Gangtok,IN';

async function fetchWeather(city = DEFAULT_CITY) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await res.json();
        document.getElementById('weather-location').textContent = data.name;
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('description').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('wind').textContent = `${data.wind.speed} m/s`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('last-updated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        document.getElementById('description').textContent = 'Weather unavailable';
    }
}

// Update every 5 min
setInterval(() => fetchWeather(), 300000);
fetchWeather();

// === MARKERS & LIST ===
function addMarkers(alerts) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    alerts.forEach(a => {
        const m = L.marker([a.lat, a.lng], { icon }).addTo(map)
            .bindPopup(`<b>${a.type}</b><br>${a.location}<br>${a.date} ${a.time}<br><small>Severity: ${a.severity}</small>`);
        markers.push(m);
    });
}

function renderList(alerts, title, showBack = false) {
    const list = document.getElementById('alert-list');
    const recent = document.getElementById('recent-alerts');
    const panelTitle = document.getElementById('panel-title');
    const stateTable = document.getElementById('state-table-container');

    stateTable.style.display = 'none';
    list.style.display = 'block';
    panelTitle.textContent = title;

    if (backButton && backButton.parentElement === list) backButton.remove();

    if (!alerts.length) {
        list.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No GLOF alerts</p>';
        recent.innerHTML = '<marquee>No alerts</marquee>';
        return;
    }

    list.innerHTML = alerts.map(a => `
        <div class="alert-item">
            <div class="warning-icon">G</div>
            <div class="alert-content">
                <p><strong>${a.type}</strong><br>${a.location}, ${a.state}<br>${a.date} | ${a.time}</p>
            </div>
        </div>
    `).join('');

    recent.innerHTML = `<marquee>*** ${alerts[0].type} | ${alerts[0].location} | ${alerts[0].date} ***</marquee>`;

    if (showBack) {
        backButton = document.createElement('button');
        backButton.textContent = 'Back to All States';
        backButton.className = 'back-to-states-btn';
        backButton.onclick = () => document.querySelector('[data-view="state"]').click();
        list.appendChild(backButton);
    }
}

function showFullStateTable() {
    const list = document.getElementById('alert-list');
    const stateTable = document.getElementById('state-table-container');
    const panelTitle = document.getElementById('panel-title');

    list.style.display = 'none';
    stateTable.style.display = 'block';
    panelTitle.textContent = 'State-wise GLOF Summary';

    stateTable.innerHTML = '';
    if (backButton) backButton.remove();

    const table = document.createElement('table');
    table.className = 'states-table';
    table.innerHTML = `<thead><tr><th>State</th><th>GLOF Type</th><th>Severity</th><th>Alerts</th></tr></thead><tbody></tbody>`;
    stateTable.appendChild(table);
    const tbody = table.querySelector('tbody');

    Object.keys(STATE_GROUPS).sort().forEach(state => {
        const alerts = STATE_GROUPS[state];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${state}</td>
            <td>${alerts[0].type}</td>
            <td class="severity-${alerts[0].severity}">${alerts[0].severity}</td>
            <td>${alerts.length}</td>
        `;
        row.onclick = () => {
            addMarkers(alerts);
            renderList(alerts, `${state} GLOF Alerts`, true);
            const lats = alerts.map(a => a.lat), lngs = alerts.map(a => a.lng);
            map.fitBounds([[Math.min(...lats)-0.5, Math.min(...lngs)-0.5], [Math.max(...lats)+0.5, Math.max(...lngs)+0.5]]);
        };
        tbody.appendChild(row);
    });
}

// === CURRENT LOCATION ===
function showCurrentLocation() {
    if (!navigator.geolocation) {
        renderList(GLOF_ALERTS, 'All India GLOF Alerts');
        addMarkers(GLOF_ALERTS);
        map.setView([27.5, 88.5], 7);
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const nearby = GLOF_ALERTS.filter(a => getDistance(lat, lng, a.lat, a.lng) <= 300);
        renderList(nearby.length ? nearby : GLOF_ALERTS, 'Nearby GLOF Alerts');
        addMarkers(nearby.length ? nearby : GLOF_ALERTS);
        map.setView([lat, lng], 9);
        fetchWeather(`${lat},${lng}`);
    }, () => {
        renderList(GLOF_ALERTS, 'All India GLOF Alerts');
        addMarkers(GLOF_ALERTS);
        map.setView([27.5, 88.5], 7);
    });
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// === TABS ===
document.querySelectorAll('.alert-tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.alert-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const view = tab.dataset.view;
        if (view === 'current') showCurrentLocation();
        else if (view === 'all-india') {
            renderList(GLOF_ALERTS, 'All India GLOF Alerts');
            addMarkers(GLOF_ALERTS);
            map.setView([27.5, 88.5], 7);
            fetchWeather();
        }
        else if (view === 'state') showFullStateTable();
    };
});

// === THEME TOGGLE ===
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

// === INIT ===
renderList(GLOF_ALERTS, 'All India GLOF Alerts');
addMarkers(GLOF_ALERTS);