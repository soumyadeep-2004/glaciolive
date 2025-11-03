// CLICK SOUND
const clickSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-water-sci-fi-click-1055.mp3');
document.querySelectorAll('a, button, .tab').forEach(el => {
  el.addEventListener('click', () => { clickSound.currentTime = 0; clickSound.play(); });
});

// SNOW
for(let i = 0; i < 35; i++){
  let s = document.createElement('div');
  s.className = 'snowflake';
  s.innerText = ['❄','❅','❆'][i%3];
  s.style.left = Math.random()*100 + 'vw';
  s.style.animationDuration = 8 + Math.random()*8 + 's';
  s.style.animationDelay = Math.random()*5 + 's';
  s.style.opacity = Math.random()*0.6 + 0.4;
  document.querySelector('.snow-container').appendChild(s);
}

// CLOCK
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}, 1000);

// TOGGLE
document.getElementById('modeToggle').addEventListener('change', () => {
  document.body.classList.toggle('light');
});

// MAP
let map, userMarker;
function initMap(center = [20.5937, 78.9629], zoom = 5) {
  if (map) map.remove();
  map = L.map('map').setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // GLOF PINS
  [[27.93,88.57,"South Lhonak"],[32.37,77.25,"Rohtang"]].forEach(p => {
    L.marker(p, {icon: L.divIcon({className:'custom-pin', html:'G', iconSize:[40,40]})})
     .addTo(map).bindPopup(`<b style="color:#ff6b35">GLOF Risk</b><br>${p[2]}`);
  });

  // BLUE DOT
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude, longitude} = pos.coords;
    if (userMarker) userMarker.remove();
    userMarker = L.circleMarker([latitude, longitude], {
      color: '#1976d2', fillColor: '#1976d2', radius: 10, weight: 3
    }).addTo(map).bindPopup('<b style="color:#1976d2">You are here!</b>').openPopup();
  });
}

// TABS
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const v = tab.dataset.view;
    if (v === 'all') initMap();
    if (v === 'sikkim') initMap([27.5, 88.5], 8);
    if (v === 'hp') initMap([32.2, 77.2], 8);
  });
});

initMap();