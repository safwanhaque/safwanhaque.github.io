const cfg = window.__CONFIG__ || { username: "", hideForks: true, pinnedRepos: [] };

const repoGrid = document.getElementById("repoGrid");
const search = document.getElementById("search");
const sortSel = document.getElementById("sort");
const themeBtn = document.getElementById("themeBtn");

let repos = [];

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}
function n(num){
  if (!num) return "0";
  if (num >= 1000) return (num/1000).toFixed(num >= 10000 ? 0 : 1) + "k";
  return String(num);
}

function repoScorePinned(name){
  const idx = (cfg.pinnedRepos || []).indexOf(name);
  return idx === -1 ? 9999 : idx;
}

function sortList(list){
  const mode = sortSel.value;

  // Featured first = pinned to top, then updated
  if (mode === "featured"){
    const pinned = [];
    const rest = [];
    const pinnedSet = new Set(cfg.pinnedRepos || []);

    for (const r of list){
      (pinnedSet.has(r.name) ? pinned : rest).push(r);
    }
    pinned.sort((a,b) => repoScorePinned(a.name) - repoScorePinned(b.name));
    rest.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
    return [...pinned, ...rest];
  }

  if (mode === "updated"){
    return [...list].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  if (mode === "stars"){
    return [...list].sort((a,b) => (b.stargazers_count - a.stargazers_count));
  }
  // name
  return [...list].sort((a,b) => a.name.localeCompare(b.name));
}

function render(){
  const q = (search.value || "").toLowerCase().trim();

  const filtered = repos.filter(r => {
    const hay = `${r.name} ${(r.description||"")}`.toLowerCase();
    return hay.includes(q);
  });

  const finalList = sortList(filtered);

  repoGrid.innerHTML = finalList.map(r => {
    const lang = r.language || "—";
    const stars = n(r.stargazers_count);
    const forks = n(r.forks_count);
    const updated = fmtDate(r.updated_at);

    return `
      <a class="repoCard" href="${r.html_url}" target="_blank" rel="noreferrer">
        <div class="repoTop">
          <div class="repoName">${r.name}</div>
          <div class="repoMeta">
            <span class="kv"><b>★</b> ${stars}</span>
          </div>
        </div>
        <div class="repoDesc">${r.description ? r.description : "No description yet."}</div>
        <div class="repoMeta">
          <span class="kv"><b>Lang</b> ${lang}</span>
          <span class="kv"><b>Forks</b> ${forks}</span>
          <span class="kv"><b>Updated</b> ${updated}</span>
        </div>
      </a>
    `;
  }).join("");
}

async function loadRepos(){
  if (!cfg.username){
    repoGrid.innerHTML = `<div class="repoCard"><div class="repoName">Missing username</div><div class="repoDesc">Set window.__CONFIG__.username in index.html</div></div>`;
    return;
  }

  const url = `https://api.github.com/users/${cfg.username}/repos?per_page=100&sort=updated`;
  const res = await fetch(url);
  const data = await res.json();

  repos = (Array.isArray(data) ? data : [])
    .filter(r => !cfg.hideForks || !r.fork);

  render();
}

function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

search.addEventListener("input", render);
sortSel.addEventListener("change", render);

initTheme();
loadRepos();
