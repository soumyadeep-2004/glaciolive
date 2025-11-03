// ==== GLACIOLIVE – EVACUATION ROUTES + SMART MAP ====
const map = L.map('map').setView([22.9734, 78.6569], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const STATE_CAPITALS = {
  "Sikkim": "Gangtok",
  "Uttarakhand": "Dehradun",
  "Himachal Pradesh": "Shimla",
  "Arunachal Pradesh": "Itanagar"
};

const ALERTS = [
  {id:1,loc:"South Lhonak",state:"Sikkim",lat:27.933,lng:88.567,sev:"High", evac_path: [[27.933,88.567],[27.90,88.50],[27.85,88.45]]},
  {id:2,loc:"Gangotri",state:"Uttarakhand",lat:30.924,lng:79.083,sev:"Medium", evac_path: [[30.924,79.083],[30.90,79.05],[30.85,79.00]]},
  {id:3,loc:"Beas Basin",state:"Himachal Pradesh",lat:32.373,lng:77.250,sev:"High", evac_path: [[32.373,77.250],[32.35,77.22],[32.30,77.20]]},
  {id:4,loc:"Dibang Lake",state:"Arunachal Pradesh",lat:28.700,lng:95.600,sev:"Medium", evac_path: [[28.700,95.600],[28.65,95.55],[28.60,95.50]]},
  {id:5,loc:"Zemu Glacier",state:"Sikkim",lat:27.700,lng:88.400,sev:"Low", evac_path: [[27.700,88.400],[27.65,88.35],[27.60,88.30]]}
];

let userMarker = null, evacLines = [], markers = [];
let lastSearchedCity = null;

// ==== WEATHER ====
const API_KEY = "b1439b5b93805a9e9cc7737829d3b30f";

async function showWeather(city = "Kolkata") {
  document.getElementById('loc').textContent = "Fetching...";
  document.getElementById('temp').textContent = "--°C";
  document.getElementById('desc').textContent = "Please wait";
  document.getElementById('hum').textContent = "--%";
  document.getElementById('wind').textContent = "-- m/s";

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!res.ok) throw new Error();
    const d = await res.json();

    document.getElementById('loc').textContent = `${d.name}, IN`;
    document.getElementById('temp').textContent = Math.round(d.main.temp) + "°C";
    document.getElementById('desc').textContent = d.weather[0].description.charAt(0).toUpperCase() + d.weather[0].description.slice(1);
    document.getElementById('hum').textContent = d.main.humidity + "%";
    document.getElementById('wind').textContent = d.wind.speed + " m/s";
  } catch {
    document.getElementById('loc').textContent = city;
    document.getElementById('desc').textContent = "Not found";
  }
}

// ==== SEARCH ====
function searchCity() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;
  lastSearchedCity = city;
  showWeather(city);
}

document.getElementById('cityInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') searchCity();
});

// ==== CURRENT VIEW ====
function showCurrent() {
  clearMap();
  lastSearchedCity = null;

  const kolkata = {lat:22.5726, lng:88.3639, name:"Kolkata"};

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        map.setView([lat, lng], 11);
        userMarker = L.circleMarker([lat, lng], {radius:10, color:'#007BFF', fillOpacity:0.9})
          .addTo(map).bindPopup("You are HERE!").openPopup();
        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${API_KEY}`)
          .then(r => r.json())
          .then(data => showWeather(data[0]?.name || kolkata.name))
          .catch(() => showWeather(kolkata.name));
      },
      () => {
        map.setView([kolkata.lat, kolkata.lng], 11);
        userMarker = L.circleMarker([kolkata.lat, kolkata.lng], {radius:10, color:'#007BFF', fillOpacity:0.9})
          .addTo(map).bindPopup("Kolkata").openPopup();
        showWeather(kolkata.name);
      }
    );
  } else {
    map.setView([kolkata.lat, kolkata.lng], 11);
    userMarker = L.circleMarker([kolkata.lat, kolkata.lng], {radius:10, color:'#007BFF', fillOpacity:0.9})
      .addTo(map).bindPopup("Kolkata").openPopup();
    showWeather(kolkata.name);
  }

  addMarkers(ALERTS);
  renderList(ALERTS, "Nearby Alerts");
}

// ==== INDIA VIEW ====
function showIndia() {
  clearMap();
  lastSearchedCity = null;
  map.setView([22.9734, 78.6569], 5);
  addMarkers(ALERTS);
  renderList(ALERTS, "All India");
  document.getElementById('ticker-text').textContent = "*** South Lhonak - HIGH RISK ***";
  showWeather("Delhi");
}

// ==== STATE VIEW – NO MAP CHANGE UNTIL CLICK ====
function showStateView() {
  // DO NOT CLEAR OR SET MAP – keep current view
  document.getElementById('stateTable').style.display = 'block';
  document.getElementById('alertList').style.display = 'none';
  document.getElementById('panelTitle').textContent = "State-wise Summary";

  const groups = {};
  ALERTS.forEach(a => {
    groups[a.state] = groups[a.state] || {count:0, top:a.sev};
    groups[a.state].count++;
    if (a.sev === "High") groups[a.state].top = "High";
  });

  let html = `<table><tr><th>State</th><th>Alerts</th><th>Capital</th><th>Risk</th></tr>`;
  Object.keys(groups).sort().forEach(s => {
    const capital = STATE_CAPITALS[s];
    html += `<tr onclick="zoomState('${s}')">
      <td>${s}</td>
      <td>${groups[s].count}</td>
      <td>${capital}</td>
      <td class="sev ${groups[s].top}">${groups[s].top}</td>
    </tr>`;
  });
  html += `</table>`;
  document.getElementById('stateTable').innerHTML = html;

  // Keep current weather (no change)
}

// ==== ZOOM STATE – NOW CHANGE MAP + ROUTES ====
function zoomState(stateName) {
  const alerts = ALERTS.filter(a => a.state === stateName);
  clearMap(); // Now clear and update map
  addMarkers(alerts);
  addEvacPaths(alerts); // Add evacuation routes (dotted lines)
  renderList(alerts, `${stateName} Alerts`, true);
  map.fitBounds([
    [Math.min(...alerts.map(a=>a.lat))-0.3, Math.min(...alerts.map(a=>a.lng))-0.3],
    [Math.max(...alerts.map(a=>a.lat))+0.3, Math.max(...alerts.map(a=>a.lng))+0.3]
  ]);
  showWeather(STATE_CAPITALS[stateName]);
}

// ==== MAP HELPERS ====
function clearMap() { [userMarker, ...markers, ...evacLines].forEach(l => l && map.removeLayer(l)); markers = []; evacLines = []; }
function addMarkers(data) {
  data.forEach(a => {
    const m = L.marker([a.lat, a.lng], {icon: L.divIcon({className:'g-marker', html:'G'})})
      .addTo(map).bindPopup(`<b>${a.loc}</b><br>${a.sev}`);
    markers.push(m);
  });
}
function addEvacPaths(data) {
  data.forEach(a => {
    if (a.evac_path) {
      const line = L.polyline(a.evac_path, {color:'orange', weight:4, dashArray:'10,10'})
        .addTo(map).bindPopup(`Evacuation Route from ${a.loc} (Safe path based on current weather)`);
      evacLines.push(line);
    }
  });
}
function renderList(alerts, title, back = false) {
  const list = document.getElementById('alertList');
  list.style.display = 'block';
  document.getElementById('stateTable').style.display = 'none';
  document.getElementById('panelTitle').textContent = title;
  list.innerHTML = alerts.map(a => `
    <div class="item"><div class="icon">G</div>
    <div><strong>${a.loc}</strong><br>${a.state} • ${a.sev}</div></div>
  `).join('');
  if (back) {
    const btn = document.createElement('button');
    btn.textContent = "Back";
    btn.onclick = () => {
      document.querySelector('[data-view="state"]').click();
    };
    list.appendChild(btn);
  }
}

// ==== TABS ====
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.view;
    if (v === 'current') showCurrent();
    else if (v === 'india') showIndia();
    else showStateView();
  };
});

// ==== NAV + CHARTS + THEME + CLOCK ====
document.querySelectorAll('nav a').forEach(a => {
  a.onclick = e => {
    if (a.href.includes('#')) {
      e.preventDefault();
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelector(a.getAttribute('href')).classList.add('active');
      if (a.getAttribute('href') === '#dashboard') initCharts();
    }
  };
});
function initCharts() {
  const sev = {High:0, Medium:0, Low:0};
  const states = {};
  ALERTS.forEach(a => { sev[a.sev]++; states[a.state] = (states[a.state] || 0) + 1; });
  new Chart(document.getElementById('severityPie'), {type:'pie', data:{labels:['High','Medium','Low'], datasets:[{data:Object.values(sev), backgroundColor:['#f44336','#ff9800','#4caf50']}]}});
  new Chart(document.getElementById('stateBar'), {type:'bar', data:{labels:Object.keys(states), datasets:[{label:'Alerts', data:Object.values(states), backgroundColor:'#4fc3f7'}]}});
}
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
function updateClock() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = now.getMinutes().toString().padStart(2,'0');
  const am = now.getHours() >= 12 ? 'PM' : 'AM';
  document.getElementById('clock').textContent = `${h}:${m} ${am}`;
}
setInterval(updateClock, 1000); updateClock();

// ==== START ====
showCurrent();