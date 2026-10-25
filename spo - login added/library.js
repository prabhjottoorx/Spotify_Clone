// ============================================================
// BeatBox: pages, Show all, playlists, folders, Blend, library
// Needs script.js loaded first (uses playCard, currentCard, etc.)
// ============================================================
(function () {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).toLowerCase().trim();
  const enc = encodeURIComponent;
  const $ = (s, r) => (r || document).querySelector(s);
  const displayName = () => { const a = window.Auth && Auth.current(); return a ? a.name : String(user() || "").split("@")[0]; };
  const uid = () => Math.random().toString(36).slice(2, 9);

  // ---------- storage (one library per logged-in user) ----------
  const user = () => { try { return localStorage.getItem("beatboxUser"); } catch (e) { return null; } };
  function lib() {
    try {
      const d = JSON.parse(localStorage.getItem("beatboxLibrary:" + user()));
      if (d && d.playlists && d.folders) return d;
    } catch (e) {}
    return { playlists: [], folders: [] };
  }
  function save(l) {
    try { localStorage.setItem("beatboxLibrary:" + user(), JSON.stringify(l)); } catch (e) {}
  }

  // ---------- liked songs ----------
  const likedKey = () => "beatboxLiked:" + user();
  function liked() {
    try { const a = JSON.parse(localStorage.getItem(likedKey())); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function isLiked(id) { return !!user() && liked().includes(id); }
  function toggleLike(id) {
    const a = liked();
    const i = a.indexOf(id);
    if (i >= 0) { a.splice(i, 1); toast("Removed from Liked Songs"); }
    else { a.push(id); toast("Added to Liked Songs"); }
    try { localStorage.setItem(likedKey(), JSON.stringify(a)); } catch (e) {}
    renderLibrary();
    if (typeof updateLikeUI === "function") updateLikeUI();
    if (cur && cur.type === "liked" && !pageV.hidden) pages.liked();
  }

  // Library sidebar filters
  let lf = null, lq = "", lsort = "recent";

  // ---------- data read from the home page ----------
  let songs = [], artists = [], charts = [], pageList = [], cur = null;
  const byId = new Map();
  const sec = { trending: [], albums: [] };
  let home, searchV, pageV;

  function buildData() {
    songs = getPlayableCards().map((card) => ({
      id: card.dataset.audio,
      title: card.querySelector("h3")?.textContent.trim() || "",
      artist: card.querySelector("p")?.textContent.trim() || "",
      img: card.querySelector("img")?.src || "",
      card,
    }));
    songs.forEach((s) => byId.set(s.id, s));

    home.querySelectorAll("section").forEach((sc) => {
      const h = (sc.querySelector("h2")?.textContent || "").trim().toLowerCase();
      const list = [...sc.querySelectorAll(".music-card[data-audio]")].map((c) => byId.get(c.dataset.audio)).filter(Boolean);
      if (h.startsWith("trending")) sec.trending = list;
      else if (h.includes("album")) sec.albums = list;
    });

    const seen = new Set();
    document.querySelectorAll(".artist-card").forEach((a) => {
      const name = a.querySelector("h3")?.textContent.trim();
      if (!name || seen.has(norm(name))) return;
      seen.add(norm(name));
      artists.push({ name, img: a.querySelector("img")?.src || "" });
    });
    songs.forEach((s) => {
      if (s.artist && !seen.has(norm(s.artist))) {
        seen.add(norm(s.artist));
        artists.push({ name: s.artist, img: s.img });
      }
    });

    document.querySelectorAll(".chart-card").forEach((c, i) => {
      const h = c.querySelector("h1");
      let title = h ? h.innerHTML.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "Chart";
      const sub = c.querySelector("p")?.textContent.trim() || "";
      if (sub && sub !== "Weekly Music Charts") title += " " + sub;
      charts.push({ i, title, sub, bg: getComputedStyle(c).backgroundColor });
    });
  }

  // A repeatable "ranking" for each chart (demo data)
  function chartList(i) {
    const n = songs.length, k = n ? (i * 2) % n : 0;
    return songs.slice(k).concat(songs.slice(0, k));
  }

  // ---------- small helpers ----------
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  function nav(h) {
    if (location.hash === "#" + h) route();
    else location.hash = h;
  }

  const img = (src) => `<img src="${esc(src)}" alt="" />`;

  function hero(o) {
    return `<div class="playlist-header pg-hero" style="background:linear-gradient(transparent,rgba(0,0,0,.5)),${o.bg || "#535353"}">
      <div class="playlist-cover${o.round ? " round" : ""}">${o.cover}</div>
      <div class="pg-info"><span class="pg-kind">${o.kind}</span>
        <h1${o.editable ? ' id="pgTitle" class="editable" tabindex="0" role="button" title="Click to rename"' : ""}>${esc(o.title)}</h1>
        <p class="pg-meta">${o.meta || ""}</p></div></div>`;
  }

  const playBar = (extra) =>
    `<div class="pg-bar"><button type="button" class="pg-play" aria-label="Play"><i class="fa-solid fa-play"></i></button>${extra || ""}</div>`;

  function trackList(items, start, opts) {
    opts = opts || {};
    return '<div class="trk-list">' + items.map((s, j) => {
      const i = start + j;
      return `<div class="trk-row" data-idx="${i}" data-id="${esc(s.id)}" tabindex="0" role="button" aria-label="Play ${esc(s.title)}">
        <span class="trk-n"><b>${i + 1}</b><i class="fa-solid fa-play"></i></span>${img(s.img)}
        <span class="trk-text"><strong>${esc(s.title)}</strong><span class="trk-artist" data-artist="${esc(s.artist)}">${esc(s.artist)}</span></span>
        <span class="trk-acts"><button type="button" class="trk-act" data-add aria-label="Add to playlist" title="Add to playlist"><i class="fa-solid fa-plus"></i></button>${
          opts.remove ? '<button type="button" class="trk-act" data-remove aria-label="Remove from playlist" title="Remove from playlist"><i class="fa-solid fa-xmark"></i></button>' : ""
        }</span></div>`;
    }).join("") + "</div>";
  }

  const notFound = (msg) => {
    pageV.innerHTML = `<div class="empty"><h3>Page not found</h3><p>${esc(msg || "We couldn't find that page.")}</p><a class="btn-add" href="#">Back to home</a></div>`;
  };
  const loginPrompt = () => {
    pageV.innerHTML = '<div class="empty"><h3>Log in to use your library</h3><p>Playlists and folders are saved to your BeatBox account.</p><a class="btn-add" href="login.html">Log in</a></div>';
  };

  // ---------- playback from a page ----------
  function playAt(i) {
    const s = pageList[i];
    if (!s) return;
    window.BB_queue = pageList.map((x) => x.card);
    playCard(s.card);
    refreshRows();
  }
  function togglePage() {
    if (!pageList.length) return;
    if (pageList.some((s) => s.card === currentCard)) togglePlayPause();
    else playAt(0);
  }
  function refreshRows() {
    if (!pageV) return;
    const pid = currentCard && !audioPlayer.paused ? currentCard.dataset.audio : null;
    pageV.querySelectorAll(".trk-row").forEach((r) => {
      const on = r.dataset.id === pid;
      r.classList.toggle("playing", on);
      const ic = r.querySelector(".trk-n i");
      ic.classList.toggle("fa-pause", on);
      ic.classList.toggle("fa-play", !on);
    });
    const pp = pageV.querySelector(".pg-play i");
    if (pp) {
      const on = !!pid && pageList.some((s) => s.id === pid);
      pp.classList.toggle("fa-pause", on);
      pp.classList.toggle("fa-play", !on);
    }
  }

  // ---------- pages ----------
  const pages = {};

  pages.song = (id) => {
    const s = byId.get(id);
    if (!s) return notFound("We couldn't find that song.");
    const more = songs.filter((x) => x !== s && norm(x.artist) === norm(s.artist));
    pageList = [s, ...more];
    pageV.innerHTML =
      hero({ cover: img(s.img), kind: "Single", title: s.title, meta: `<span class="lnk" data-artist="${esc(s.artist)}">${esc(s.artist)}</span>` }) +
      playBar() + '<h2 class="pg-h">Track list</h2>' + trackList([s], 0) +
      (more.length ? `<h2 class="pg-h">More by ${esc(s.artist)}</h2>` + trackList(more, 1) : "");
  };

  pages.artist = (name) => {
    const q = norm(name);
    const list = songs.filter((s) => norm(s.artist).includes(q));
    const a = artists.find((x) => norm(x.name) === q);
    pageList = list;
    const pic = a ? a.img : list[0] ? list[0].img : "";
    pageV.innerHTML =
      hero({ cover: pic ? img(pic) : '<i class="fa-solid fa-user"></i>', round: true, kind: "Artist", title: name,
        meta: `${list.length} ${list.length === 1 ? "song" : "songs"} available`, bg: "#3d3d3d" }) +
      playBar() +
      (list.length
        ? '<h2 class="pg-h">Popular</h2>' + trackList(list, 0)
        : '<div class="empty"><h3>No songs yet</h3><p>BeatBox doesn’t have songs from this artist yet.</p></div>');
  };

  pages.chart = (i) => {
    const c = charts[+i];
    if (!c) return notFound("We couldn't find that chart.");
    pageList = chartList(+i);
    pageV.innerHTML =
      hero({ cover: `<div class="chart-cover" style="background:${c.bg}"><span>${esc(c.title)}</span></div>`, kind: "Chart", title: c.title,
        meta: `${pageList.length} songs • Updated weekly`, bg: c.bg }) +
      playBar() + trackList(pageList, 0);
  };

  pages.showall = (k) => {
    const titles = { trending: "Trending songs", artists: "Popular artists", albums: "Popular albums and singles", charts: "Featured Charts" };
    if (!titles[k]) return notFound();
    let cards = "";
    if (k === "trending" || k === "albums") {
      cards = sec[k].map((s) => `<div class="gc" data-song="${esc(s.id)}" tabindex="0" role="link">
        <div class="gc-img">${img(s.img)}<button type="button" class="gc-play" data-gplay aria-label="Play ${esc(s.title)}"><i class="fa-solid fa-play"></i></button></div>
        <h3>${esc(s.title)}</h3><p>${esc(s.artist)}</p></div>`).join("");
    } else if (k === "artists") {
      cards = artists.map((a) => `<div class="gc round" data-artistcard="${esc(a.name)}" tabindex="0" role="link">
        <div class="gc-img">${img(a.img)}</div><h3>${esc(a.name)}</h3><p>Artist</p></div>`).join("");
    } else {
      cards = charts.map((c) => `<div class="gc gc-chart" data-chart="${c.i}" tabindex="0" role="link" style="background:${c.bg}">
        <h3>${esc(c.title)}</h3><p>Weekly Music Charts</p></div>`).join("");
    }
    pageV.innerHTML = `<h1 class="pg-title">${titles[k]}</h1><div class="gc-grid">${cards}</div>`;
  };

  pages.liked = () => {
    if (!user()) return loginPrompt();
    cur = { type: "liked" };
    const items = liked().map((a) => byId.get(a)).filter(Boolean);
    pageList = items;
    pageV.innerHTML =
      hero({ cover: '<i class="fa-solid fa-heart"></i>', kind: "Playlist", title: "Liked Songs", bg: "#4a2fa0",
        meta: `${esc(displayName())} • ${items.length} ${items.length === 1 ? "song" : "songs"}` }) +
      playBar() +
      (items.length ? trackList(items, 0, { remove: true }) : '<p class="muted">Songs you like will show up here. Tap the heart in the player bar.</p>');
  };

  pages.library = () => {
    if (!user()) return loginPrompt();
    const l = lib();
    cur = { type: "library" };
    pageList = [];
    pageV.innerHTML = '<h1 class="pg-title">Your Library</h1>' +
      '<div class="lib-create"><button type="button" class="btn-add" data-create="playlist">New playlist</button><button type="button" class="btn-add" data-create="folder">New folder</button><button type="button" class="btn-add" data-create="blend">New Blend</button></div>' +
      likedRow(true) +
      l.folders.map((f) => libRow(f, "folder", true)).join("") +
      l.playlists.filter((p) => !p.folder).map((p) => libRow(p, "playlist", true)).join("");
  };

  pages.profile = () => {
    if (!user()) return loginPrompt();
    const name = displayName();
    const l = lib();
    cur = null;
    pageList = [];
    const cards = l.playlists.map((p) => {
      const first = p.songs.map((a) => byId.get(a)).find(Boolean);
      return `<div class="gc" data-nav="playlist/${p.id}" tabindex="0" role="link"><div class="gc-img">${
        first ? img(first.img) : '<div class="gc-ph"><i class="fa-solid fa-music"></i></div>'}</div><h3>${esc(p.name)}</h3><p>By ${esc(name)}</p></div>`;
    }).join("");
    pageV.innerHTML =
      hero({ cover: `<span class="avatar-big">${esc(name.charAt(0).toUpperCase())}</span>`, round: true, kind: "Profile", title: name, bg: "#3d3d3d",
        meta: `${l.playlists.length} public ${l.playlists.length === 1 ? "playlist" : "playlists"}` }) +
      (cards ? `<h2 class="pg-h">Public playlists</h2><div class="gc-grid">${cards}</div>` : '<p class="muted">You haven’t created any playlists yet.</p>');
  };

  // ----- playlists -----
  pages.playlist = (id) => {
    if (!user()) return loginPrompt();
    const l = lib();
    const p = l.playlists.find((x) => x.id === id);
    if (!p) return notFound("That playlist no longer exists.");
    cur = { type: "playlist", id };
    const items = p.songs.map((a) => byId.get(a)).filter(Boolean);
    pageList = items;
    const sel = l.folders.length
      ? `<select class="pg-select" data-move aria-label="Move to folder"><option value="">No folder</option>${l.folders
          .map((f) => `<option value="${f.id}"${p.folder === f.id ? " selected" : ""}>${esc(f.name)}</option>`).join("")}</select>`
      : "";
    pageV.innerHTML =
      hero({
        cover: items[0] ? img(items[0].img) : `<i class="fa-solid ${p.blend ? "fa-circle-half-stroke" : "fa-music"}"></i>`,
        kind: p.blend ? "Blend" : "Playlist", title: p.name, editable: true,
        meta: `${esc(displayName())} • ${items.length} ${items.length === 1 ? "song" : "songs"}`,
      }) +
      playBar(`${sel}<button type="button" class="pg-iconbtn" data-del title="Delete playlist" aria-label="Delete playlist"><i class="fa-regular fa-trash-can"></i></button>`) +
      (items.length ? trackList(items, 0, { remove: true }) : '<p class="muted">This playlist is empty. Add some songs below.</p>') +
      '<div class="find"><h2 class="pg-h">Let’s find something for your playlist</h2><input id="findInput" type="search" placeholder="Search for songs" autocomplete="off" aria-label="Search for songs to add" /><div id="findResults"></div></div>';
    renderFind();
  };

  function renderFind() {
    const box = $("#findResults");
    if (!box || !cur) return;
    const p = lib().playlists.find((x) => x.id === cur.id);
    if (!p) return;
    const q = norm($("#findInput").value);
    const res = songs.filter((s) => !p.songs.includes(s.id) && (!q || norm(s.title + " " + s.artist).includes(q))).slice(0, 6);
    box.innerHTML = res.length
      ? res.map((s) => `<div class="find-row">${img(s.img)}<span class="trk-text"><strong>${esc(s.title)}</strong><span>${esc(s.artist)}</span></span>
          <button type="button" class="btn-add" data-fadd="${esc(s.id)}">Add</button></div>`).join("")
      : '<p class="muted">No songs to add.</p>';
  }

  // ----- folders -----
  pages.folder = (id) => {
    if (!user()) return loginPrompt();
    const l = lib();
    const f = l.folders.find((x) => x.id === id);
    if (!f) return notFound("That folder no longer exists.");
    cur = { type: "folder", id };
    const pls = l.playlists.filter((p) => p.folder === id);
    pageV.innerHTML =
      hero({ cover: '<i class="fa-regular fa-folder"></i>', kind: "Folder", title: f.name, editable: true,
        meta: `${pls.length} ${pls.length === 1 ? "playlist" : "playlists"}` }) +
      '<div class="pg-bar"><button type="button" class="btn-add" data-newpl>New playlist here</button><button type="button" class="pg-iconbtn" data-del title="Delete folder" aria-label="Delete folder"><i class="fa-regular fa-trash-can"></i></button></div>' +
      (pls.length ? pls.map((p) => libRow(p, "playlist", true)).join("") : '<p class="muted">This folder is empty. Create a playlist here, or move one in from its page.</p>');
  };

  // ---------- creating / editing ----------
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function create(kind, folderId) {
    const l = lib();
    if (kind === "folder") {
      const name = prompt("Name your folder", "New folder");
      if (name === null) return;
      const f = { id: uid(), name: name.trim() || "New folder", ts: Date.now() };
      l.folders.push(f);
      save(l); renderLibrary(); nav("folder/" + f.id);
      return;
    }
    let p;
    if (kind === "blend") {
      const friend = prompt("Who do you want to blend with? Type a friend’s name");
      if (!friend || !friend.trim()) return;
      p = { id: uid(), name: "You + " + friend.trim(), blend: true, folder: null, ts: Date.now(),
            songs: shuffle(songs.slice()).slice(0, Math.min(10, songs.length)).map((s) => s.id) };
      toast("Blend created with a mix of songs you might both like");
    } else {
      const n = l.playlists.filter((x) => !x.blend).length + 1;
      p = { id: uid(), name: "My playlist #" + n, songs: [], folder: folderId || null, ts: Date.now() };
    }
    l.playlists.push(p);
    save(l); renderLibrary(); nav("playlist/" + p.id);
  }

  function renamePage() {
    if (!cur) return;
    const l = lib();
    const item = (cur.type === "playlist" ? l.playlists : l.folders).find((x) => x.id === cur.id);
    if (!item) return;
    const n = prompt("Rename", item.name);
    if (n && n.trim()) { item.name = n.trim(); item.ts = Date.now(); save(l); renderLibrary(); pages[cur.type](cur.id); }
  }

  function deleteCurrent() {
    if (!cur || !confirm("Delete this " + cur.type + "?")) return;
    const l = lib();
    let back = "";
    if (cur.type === "playlist") {
      const p = l.playlists.find((x) => x.id === cur.id);
      if (p && p.folder) back = "folder/" + p.folder;
      l.playlists = l.playlists.filter((x) => x.id !== cur.id);
    } else {
      l.playlists.forEach((p) => { if (p.folder === cur.id) p.folder = null; });
      l.folders = l.folders.filter((x) => x.id !== cur.id);
    }
    save(l); renderLibrary();
    if (back) nav(back); else goHome();
  }

  function mutatePlaylist(fn) {
    const l = lib();
    const p = cur && l.playlists.find((x) => x.id === cur.id);
    if (!p) return;
    fn(p, l);
    p.ts = Date.now();
    save(l); renderLibrary(); pages.playlist(cur.id);
  }

  // ---------- "Add to playlist" popup ----------
  function closeAdd() { const m = document.getElementById("addMenu"); if (m) m.remove(); }

  function openAdd(btn, id) {
    const r = btn.getBoundingClientRect();
    if (!user()) {
      showLoginTooltip({ stopPropagation() {}, currentTarget: { getBoundingClientRect: () => ({ top: r.top, right: Math.min(r.right, innerWidth - 360) }) } });
      return;
    }
    closeAdd();
    const l = lib();
    const m = document.createElement("div");
    m.id = "addMenu";
    m.className = "add-menu";
    m.innerHTML = '<div class="head">Add to playlist</div><button type="button" data-new>New playlist</button>' +
      l.playlists.map((p) => `<button type="button" data-pl="${p.id}"><span>${esc(p.name)}</span>${p.songs.includes(id) ? '<i class="fa-solid fa-check"></i>' : ""}</button>`).join("");
    document.body.appendChild(m);
    m.style.top = Math.max(10, Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 10)) + "px";
    m.style.left = Math.max(10, r.right - m.offsetWidth) + "px";
    m.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const b = ev.target.closest("button");
      if (!b) return;
      const l2 = lib();
      if (b.dataset.new !== undefined) {
        const p = { id: uid(), name: "My playlist #" + (l2.playlists.filter((x) => !x.blend).length + 1), songs: [id], folder: null };
        l2.playlists.push(p);
        toast("Added to " + p.name);
      } else {
        const p = l2.playlists.find((x) => x.id === b.dataset.pl);
        if (!p) return;
        const i = p.songs.indexOf(id);
        if (i >= 0) { p.songs.splice(i, 1); toast("Removed from " + p.name); }
        else { p.songs.push(id); toast("Added to " + p.name); }
      }
      save(l2); renderLibrary(); closeAdd();
      if (cur && cur.type === "playlist" && !pageV.hidden) pages.playlist(cur.id);
    });
    setTimeout(() => document.addEventListener("click", closeAdd, { once: true }), 0);
  }

  // ---------- sidebar: Your Library ----------
  function libRow(item, type, big) {
    const isPl = type === "playlist";
    const first = isPl && item.songs.map((a) => byId.get(a)).find(Boolean);
    const cover = first ? img(first.img) : `<i class="fa-solid ${isPl ? (item.blend ? "fa-circle-half-stroke" : "fa-music") : "fa-folder"}"></i>`;
    const count = isPl ? `${item.blend ? "Blend" : "Playlist"} • ${item.songs.length} ${item.songs.length === 1 ? "song" : "songs"}`
      : `Folder • ${lib().playlists.filter((p) => p.folder === item.id).length} playlists`;
    return `<button type="button" class="lib-item${big ? " big" : ""}" data-nav="${type}/${item.id}"><span class="lib-cover">${cover}</span><span class="lib-text"><strong>${esc(item.name)}</strong><em>${count}</em></span></button>`;
  }

  function likedRow(big) {
    const n = liked().length;
    return `<button type="button" class="lib-item${big ? " big" : ""}" data-nav="liked"><span class="lib-cover liked-cover"><i class="fa-solid fa-heart"></i></span><span class="lib-text"><strong>Liked Songs</strong><em>Playlist • ${n} ${n === 1 ? "song" : "songs"}</em></span></button>`;
  }

  function renderLibrary() {
    const box = document.getElementById("libraryList");
    const first = $(".sidebar .side-box");
    const tools = document.getElementById("libTools");
    if (!box) return;
    if (!user()) { box.innerHTML = ""; if (first) first.hidden = false; if (tools) tools.hidden = true; return; }
    const l = lib();
    const q = norm(lq);
    const sorter = (a, b) => (lsort === "alpha" ? a.name.localeCompare(b.name) : (b.ts || 0) - (a.ts || 0));
    let folders = l.folders.slice().sort(sorter);
    let pls = l.playlists.filter((p) => !p.folder).sort(sorter);
    if (lf === "playlists") folders = [];
    if (lf === "folders") pls = [];
    if (q) {
      folders = folders.filter((f) => norm(f.name).includes(q));
      pls = pls.filter((p) => norm(p.name).includes(q));
    }
    const showLiked = lf !== "folders" && (!q || "liked songs".includes(q));
    const html = (showLiked ? likedRow() : "") + folders.map((f) => libRow(f, "folder")).join("") + pls.map((p) => libRow(p, "playlist")).join("");
    box.innerHTML = html || '<p class="muted lib-none">Nothing matches that.</p>';
    const any = l.folders.length || l.playlists.length;
    if (first) first.hidden = !!any;
    if (tools) tools.hidden = !any;
  }

  function setTab(t) {
    document.querySelectorAll("#bottomNav [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
  }

  // ---------- routing ----------
  function showHome() {
    pageV.hidden = true;
    searchV.hidden = true;
    home.hidden = false;
    setTab("home");
    const i = document.getElementById("searchInput"); if (i) i.value = "";
    const c = document.getElementById("searchClear"); if (c) c.hidden = true;
  }

  function goHome() {
    if (location.hash) location.hash = "";
    else route();
  }

  function route() {
    closeAdd();
    const raw = location.hash.slice(1);
    const k = raw.indexOf("/");
    const type = k < 0 ? raw : raw.slice(0, k);
    let arg = k < 0 ? "" : raw.slice(k + 1);
    try { arg = decodeURIComponent(arg); } catch (e) {}
    if (!raw || !pages[type]) { showHome(); return; }
    home.hidden = true; searchV.hidden = true; pageV.hidden = false;
    pageList = []; cur = null;
    setTab(type === "library" ? "library" : "");
    pages[type](arg);
    pageV.scrollTop = 0;
    refreshRows();
  }

  window.BB = { create, openAdd, isLiked, toggleLike, setTab };

  document.addEventListener("DOMContentLoaded", () => {
    home = document.getElementById("homeView");
    searchV = document.getElementById("searchView");
    pageV = document.getElementById("pageView");
    if (!home || !pageV) return;
    buildData();

    // Home page: click text / artists / charts to open their pages
    // Play button on artist cards
    home.querySelectorAll(".artist-card").forEach((a) => {
      const name = a.querySelector("h3")?.textContent.trim() || "";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "artist-play";
      b.setAttribute("aria-label", "Play " + name);
      b.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
      b.tabIndex = -1;
      b.setAttribute("aria-hidden", "true");
      a.appendChild(b);
      const im = a.querySelector("img");
      if (im) b.style.top = im.offsetTop + im.offsetHeight - 54 + "px";
    });

    home.addEventListener("click", (e) => {
      const t = e.target;
      const ap = t.closest(".artist-play");
      if (ap) {
        e.stopPropagation();
        const name = ap.closest(".artist-card").querySelector("h3").textContent.trim();
        const list = songs.filter((s) => norm(s.artist).includes(norm(name)));
        if (!list.length) { toast(name + " has no songs in BeatBox yet"); return; }
        window.BB_queue = list.map((s) => s.card);
        playCard(list[0].card);
        return;
      }
      const cc = t.closest(".chart-card");
      if (cc) {
        const i = [...document.querySelectorAll(".chart-card")].indexOf(cc);
        if (t.closest(".play-btn")) {
          const list = chartList(i);
          if (list.length) { window.BB_queue = list.map((s) => s.card); playCard(list[0].card); }
        } else nav("chart/" + i);
        return;
      }
      const ac = t.closest(".artist-card");
      if (ac) nav("artist/" + enc(ac.querySelector("h3").textContent.trim()));
    });

    // Everything inside a detail page
    pageV.addEventListener("click", (e) => {
      const t = e.target;
      let el;
      if ((el = t.closest("[data-add]"))) { openAdd(el, t.closest(".trk-row").dataset.id); return; }
      if (t.closest("[data-remove]")) {
        const id = t.closest(".trk-row").dataset.id;
        if (cur && cur.type === "liked") toggleLike(id);
        else mutatePlaylist((p) => { p.songs = p.songs.filter((x) => x !== id); });
        return;
      }
      if ((el = t.closest("[data-create]"))) { create(el.dataset.create); return; }
      if ((el = t.closest("[data-gplay]"))) { window.BB_queue = null; playCard(byId.get(el.closest("[data-song]").dataset.song).card); return; }
      if ((el = t.closest("[data-artist]"))) { nav("artist/" + enc(el.dataset.artist)); return; }
      if ((el = t.closest("[data-artistcard]"))) { nav("artist/" + enc(el.dataset.artistcard)); return; }
      if ((el = t.closest("[data-song]"))) { nav("song/" + enc(el.dataset.song)); return; }
      if ((el = t.closest("[data-chart]"))) { nav("chart/" + el.dataset.chart); return; }
      if ((el = t.closest("[data-nav]"))) { nav(el.dataset.nav); return; }
      if (t.closest(".pg-play")) { togglePage(); return; }
      if (t.closest("#pgTitle")) { renamePage(); return; }
      if (t.closest("[data-del]")) { deleteCurrent(); return; }
      if (t.closest("[data-newpl]")) { create("playlist", cur && cur.id); return; }
      if ((el = t.closest("[data-fadd]"))) { const id = el.dataset.fadd; mutatePlaylist((p) => { if (!p.songs.includes(id)) p.songs.push(id); }); toast("Added to playlist"); return; }
      if ((el = t.closest(".trk-row"))) playAt(+el.dataset.idx);
    });
    pageV.addEventListener("change", (e) => {
      if (e.target.matches("[data-move]")) { const v = e.target.value || null; mutatePlaylist((p) => { p.folder = v; }); }
    });
    pageV.addEventListener("input", (e) => { if (e.target.id === "findInput") renderFind(); });

    // Sidebar items
    const list = document.getElementById("libraryList");
    if (list) list.addEventListener("click", (e) => { const b = e.target.closest("[data-nav]"); if (b) nav(b.dataset.nav); });

    // Home button: leave any page and go back to the home screen
    document.getElementById("homeBtn").addEventListener("click", () => {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      showHome();
    });

    window.addEventListener("hashchange", route);
    audioPlayer.addEventListener("play", refreshRows);
    audioPlayer.addEventListener("pause", refreshRows);

    // Library filters, search and sort
    const tools = document.getElementById("libTools");
    tools.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-lf]");
      if (chip) {
        lf = lf === chip.dataset.lf ? null : chip.dataset.lf;
        tools.querySelectorAll("[data-lf]").forEach((x) => x.classList.toggle("active", x.dataset.lf === lf));
        renderLibrary();
        return;
      }
      if (e.target.closest("#libSearchBtn")) {
        const inp = document.getElementById("libSearch");
        inp.hidden = !inp.hidden;
        if (inp.hidden) { inp.value = ""; lq = ""; renderLibrary(); } else inp.focus();
        return;
      }
      if (e.target.closest("#libSort")) {
        lsort = lsort === "recent" ? "alpha" : "recent";
        document.getElementById("libSortLabel").textContent = lsort === "recent" ? "Recents" : "Alphabetical";
        renderLibrary();
      }
    });
    document.getElementById("libSearch").addEventListener("input", (e) => { lq = e.target.value; renderLibrary(); });

    // Collapse + resize "Your Library"
    const sb = document.querySelector(".sidebar");
    const SB_KEY = "beatboxSidebar";
    let st = { collapsed: false, width: null };
    try { st = Object.assign(st, JSON.parse(localStorage.getItem(SB_KEY))); } catch (e) {}
    const saveSb = () => { try { localStorage.setItem(SB_KEY, JSON.stringify(st)); } catch (e) {} };
    function applySb() {
      sb.classList.toggle("collapsed", st.collapsed);
      sb.style.width = !st.collapsed && st.width ? st.width + "px" : "";
      const tg = document.getElementById("libToggle");
      tg.setAttribute("aria-expanded", String(!st.collapsed));
      tg.setAttribute("aria-label", st.collapsed ? "Expand Your Library" : "Collapse Your Library");
    }
    document.getElementById("libToggle").addEventListener("click", () => { st.collapsed = !st.collapsed; saveSb(); applySb(); });
    document.getElementById("sidebarResizer").addEventListener("mousedown", (e) => {
      if (st.collapsed) return;
      e.preventDefault();
      document.body.classList.add("resizing");
      const move = (ev) => {
        const w = Math.max(280, Math.min(520, ev.clientX - sb.getBoundingClientRect().left));
        sb.style.width = w + "px";
        st.width = w;
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        document.body.classList.remove("resizing");
        saveSb();
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
    applySb();

    // Mobile bottom tabs
    document.getElementById("bottomNav").addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      if (b.dataset.tab === "home") document.getElementById("homeBtn").click();
      else if (b.dataset.tab === "search") {
        document.getElementById("browseBtn").click();
        document.getElementById("searchInput").focus();
      } else nav("library");
    });

    renderLibrary();
    route(); // opens the page named in the URL (if any)
  });
})();