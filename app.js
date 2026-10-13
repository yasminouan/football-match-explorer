const BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data";
let chart;

async function getJSON(url) {
  const r = await fetch(url);
  return r.json();
}

async function init() {
  const matches = await getJSON(`${BASE}/matches/43/106.json`);
  const select = document.getElementById("matchSelect");

  matches.forEach(m => {
    const o = document.createElement("option");
    o.value = m.match_id;
    o.textContent = `${m.home_team.home_team_name} ${m.home_score}-${m.away_score} ${m.away_team.away_team_name}`;
    select.appendChild(o);
  });

  select.onchange = () => loadMatch(select.value);
  loadMatch(select.value);
}

async function loadMatch(id) {
  const events = await getJSON(`${BASE}/events/${id}.json`);

  // On garde les tirs, sans la séance de tirs au but (period 5)
  const shots = events.filter(e => e.type.name === "Shot" && e.period < 5);

  // Cumul des xG par équipe
  const teams = {};
  shots.forEach(s => {
    const t = s.team.name;
    if (!teams[t]) teams[t] = { total: 0, points: [{ x: 0, y: 0 }] };
    teams[t].total += s.shot.statsbomb_xg;
    teams[t].points.push({ x: s.minute, y: teams[t].total });
  });

  const colors = ["#3b9eff", "#ff4d4d"];
  const datasets = Object.keys(teams).map((name, i) => ({
    label: `${name} (${teams[name].total.toFixed(2)} xG)`,
    data: teams[name].points,
    borderColor: colors[i],
    stepped: true,
    pointRadius: 0
  }));

  document.getElementById("score").textContent = Object.keys(teams).join(" vs ");

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("xgChart"), {
    type: "line",
    data: { datasets },
    options: { scales: { x: { type: "linear", title: { display: true, text: "Minute" } },
                         y: { title: { display: true, text: "xG cumulé" } } } }
  });
}

init();