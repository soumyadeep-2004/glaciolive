// LIVE CLOCK
function updateClock() {
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// LIVE CARDS (Simulated real-time)
let alerts = 8, subs = 124, reports = 5, visitors = 89;
setInterval(() => {
  alerts += Math.floor(Math.random() * 2);
  subs += Math.floor(Math.random() * 3);
  reports += Math.floor(Math.random() * 1);
  visitors += Math.floor(Math.random() * 5);
  document.getElementById('total-alerts').textContent = alerts;
  document.getElementById('subscribers').textContent = subs;
  document.getElementById('reports').textContent = reports;
  document.getElementById('visitors').textContent = visitors;
}, 10000);

// BAR CHART
const ctx = document.getElementById('stateChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Sikkim', 'Himachal', 'Uttarakhand', 'Sikkim', 'Arunachal'],
    datasets: [{
      label: 'GLOF Alerts',
      data: [75, 68, 62, 58, 52],
      backgroundColor: '#ff6b35',
      borderRadius: 8
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } }
  }
});

// MAP
const map = L.map('map').setView([27.5, 88.5], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const icon = L.divIcon({ className: 'custom-marker', html: 'G', iconSize: [36,36] });
GLOF_ALERTS = [
  { lat: 27.93, lng: 88.57, loc: "South Lhonak Lake" },
  { lat: 32.37, lng: 77.25, loc: "Rohtang Pass" }
];
GLOF_ALERTS.forEach(a => {
  L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(`<b>GLOF Risk</b><br>${a.loc}`);
});

// NOTIFICATION BELL
document.getElementById('bell').onclick = () => {
  const panel = document.getElementById('notif-panel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  document.getElementById('notif-count').textContent = '0';
};

// TOGGLE
document.getElementById('toggle').onclick = () => {
  document.body.classList.toggle('light-mode');
  document.getElementById('toggle').textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
};

// INIT
updateClock();
