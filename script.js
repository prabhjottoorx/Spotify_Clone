// ============================
// LOGIN STATE LOGIC
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Check if a user is saved in the browser
  const loggedInUser = localStorage.getItem("beatboxUser");

  if (loggedInUser) {
    // 1. Hide the Sign up and Log in buttons
    document.getElementById("navSignup").style.display = "none";
    document.getElementById("navLogin").style.display = "none";

    // 2. Show the Profile button and set the letter to their email initial
    const navProfile = document.getElementById("navProfile");
    navProfile.style.display = "flex";
    document.getElementById("profileInitial").textContent =
      loggedInUser.charAt(0);

    // 3. Hide the big bottom signup bar
    const signupBar = document.querySelector(".signup-bar");
    if (signupBar) {
      signupBar.style.display = "none";
    }
  }
});

// A simple logout function attached to the profile button
function logout() {
  if (confirm("Do you want to log out of BeatBox?")) {
    localStorage.removeItem("beatboxUser");
    window.location.reload(); // Reload page to show login buttons again
  }
}

// ============================
// HAMBURGER MENU (mobile nav)
// ============================

function toggleMenu() {
  const menu = document.getElementById("hamburgerMenu");
  const icon = document.getElementById("menuIcon");

  menu.classList.toggle("active");
  const hb = document.querySelector(".hamburger");
  if (hb) {
    hb.setAttribute("aria-expanded", String(menu.classList.contains("active")));
    hb.setAttribute("aria-label", menu.classList.contains("active") ? "Close menu" : "Open menu");
  }

  if (menu.classList.contains("active")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-xmark");
  } else {
    icon.classList.remove("fa-xmark");
    icon.classList.add("fa-bars");
  }
}

function closeMenu() {
  const menu = document.getElementById("hamburgerMenu");
  const icon = document.getElementById("menuIcon");

  if (menu && menu.classList.contains("active")) {
    menu.classList.remove("active");
    icon.classList.remove("fa-xmark");
    icon.classList.add("fa-bars");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("hamburgerMenu");
  const hamburgerBtn = document.querySelector(".hamburger");

  if (!menu) return;

  // Close the menu when any link inside it is tapped
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close the menu when tapping anywhere outside it
  document.addEventListener("click", (e) => {
    const clickedInsideMenu = menu.contains(e.target);
    const clickedHamburgerBtn = hamburgerBtn && hamburgerBtn.contains(e.target);

    if (!clickedInsideMenu && !clickedHamburgerBtn) {
      closeMenu();
    }
  });
});

// Close mobile menu automatically if the screen expands back to desktop size
window.addEventListener("resize", () => {
  if (window.innerWidth > 800) {
    closeMenu();
  }
});

// ============================
// LOGIN TOOLTIP PROMPT HANDLERS
// ============================

function showLoginTooltip(event) {
  event.stopPropagation();
  const tooltip = document.getElementById("loginTooltip");
  if (!tooltip) return;

  // Position the tooltip near the clicked button if possible
  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.style.display = "block";
  tooltip.style.top = `${rect.top}px`;
  tooltip.style.left = `${rect.right + 15}px`;
}

function closeLoginTooltip() {
  const tooltip = document.getElementById("loginTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

// Close tooltip on outside click
document.addEventListener("click", (e) => {
  const tooltip = document.getElementById("loginTooltip");
  if (tooltip && tooltip.style.display === "block") {
    if (!tooltip.contains(e.target)) {
      closeLoginTooltip();
    }
  }
});

// ============================
// MUSIC PLAYBACK + PLAYER BAR
// ============================

const audioPlayer = document.getElementById("audioPlayer");
let currentCard = null;
let isSeeking = false;

// Format seconds as m:ss
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}

// Player modes + remembered state
let shuffleOn = false;
let repeatMode = 0; // 0 = off, 1 = repeat all, 2 = repeat one
let playedHistory = []; // for "previous" while shuffling
let queueCards = [];
const PLAYER_KEY = "beatboxPlayer";

const escHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function savePlayer() {
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify({
      id: currentCard ? currentCard.dataset.audio : null,
      t: audioPlayer.currentTime || 0,
      vol: audioPlayer.volume,
      shuffle: shuffleOn,
      repeat: repeatMode,
    }));
  } catch (e) {}
}

function showToast(msg) {
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
  t._timer = setTimeout(() => t.classList.remove("show"), 2800);
}

// Heart in the player bar
function updateLikeUI() {
  const b = document.getElementById("pbLike");
  if (!b) return;
  const on = !!(currentCard && window.BB && window.BB.isLiked && window.BB.isLiked(currentCard.dataset.audio));
  b.querySelector("i").className = (on ? "fa-solid" : "fa-regular") + " fa-heart";
  b.classList.toggle("on", on);
  b.setAttribute("aria-pressed", String(on));
}

// Queue panel
function renderQueue() {
  const panel = document.getElementById("queuePanel");
  const body = document.getElementById("queueBody");
  if (!panel || !body || panel.hidden) return;
  const all = getQueue();
  const i = all.indexOf(currentCard);
  // While shuffling the next song is random, so every other song is a candidate
  const upcoming = shuffleOn ? all.filter((c) => c !== currentCard) : i >= 0 ? all.slice(i + 1) : all;
  queueCards = [];
  const row = (c, now) => {
    queueCards.push(c);
    const title = c.querySelector("h3")?.textContent || "";
    const artist = c.querySelector("p")?.textContent || "";
    const src = c.querySelector("img")?.src || "";
    return `<button type="button" class="q-row${now ? " now" : ""}" data-q="${queueCards.length - 1}">
      <img src="${escHtml(src)}" alt="" /><span><strong>${escHtml(title)}</strong><em>${escHtml(artist)}</em></span></button>`;
  };
  let html = "";
  if (currentCard) html += "<h4>Now playing</h4>" + row(currentCard, true);
  html += "<h4>Next up" + (shuffleOn ? " (random order)" : "") + "</h4>";
  html += upcoming.length ? upcoming.map((c) => row(c, false)).join("") : '<p class="q-empty">Nothing else is queued.</p>';
  body.innerHTML = html;
}

// All cards that have a song attached, in page order (used for prev / next)
function getPlayableCards() {
  return Array.from(document.querySelectorAll(".music-card[data-audio]"));
}

// Keep every card's play icon + highlight in sync with the audio state
function syncCardUI() {
  document.querySelectorAll(".music-card").forEach((card) => {
    const active = card === currentCard && !audioPlayer.paused;
    const icon = card.querySelector(".play-btn i");
    if (icon) {
      icon.classList.toggle("fa-pause", active);
      icon.classList.toggle("fa-play", !active);
    }
    card.classList.toggle("playing", active);
  });

  const barIcon = document.querySelector("#pbPlay i");
  if (barIcon) {
    const playing = !audioPlayer.paused;
    barIcon.classList.toggle("fa-pause", playing);
    barIcon.classList.toggle("fa-play", !playing);
  }
}

// Fill the bar with the current song's info and show it
function showPlayerBar(card) {
  const bar = document.getElementById("playerBar");
  if (!bar) return;

  const img = card.querySelector("img");
  document.getElementById("pbCover").src = img ? img.src : "";
  document.getElementById("pbTitle").textContent =
    card.querySelector("h3")?.textContent || "Unknown song";
  document.getElementById("pbArtist").textContent =
    card.querySelector("p")?.textContent || "";

  bar.classList.add("show");
  updateLikeUI();
  renderQueue();
}

// Start a card's song from the beginning
function loadAndPlay(card) {
  currentCard = card;
  audioPlayer.src = card.dataset.audio;
  showPlayerBar(card);
  resetSeekUI();
  audioPlayer.play().catch(() => {
    // File missing or blocked: reset the UI instead of looking stuck
    syncCardUI();
  });
}

// Main click handler for a card: start / pause / resume / switch tracks
function playCard(card) {
  if (!card.dataset.audio) return; // this card has no song attached

  if (currentCard === card) {
    // Same card: toggle pause / resume
    if (audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
    return;
  }

  loadAndPlay(card);
}

function togglePlayPause() {
  if (!currentCard) return;
  if (audioPlayer.paused) audioPlayer.play();
  else audioPlayer.pause();
}

// Songs to step through: the list you started from, or every song on the page
function getQueue() {
  const q = window.BB_queue;
  return q && q.includes(currentCard) ? q : getPlayableCards();
}

function playNext(auto) {
  const cards = getQueue();
  if (!cards.length) return;

  // Song ended and "repeat one" is on: just start it again
  if (auto === true && repeatMode === 2) {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
    return;
  }

  const i = cards.indexOf(currentCard);
  let next;
  if (shuffleOn && cards.length > 1) {
    do {
      next = cards[Math.floor(Math.random() * cards.length)];
    } while (next === currentCard);
  } else {
    // Reached the end with repeat off: stop instead of looping forever
    if (auto === true && repeatMode === 0 && i === cards.length - 1) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      return;
    }
    next = cards[(i + 1) % cards.length];
  }
  if (currentCard) playedHistory.push(currentCard);
  loadAndPlay(next);
}

function playPrevious() {
  const cards = getQueue();
  if (!cards.length) return;
  // Like Spotify: after 3 seconds, "previous" restarts the current song
  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
    return;
  }
  if (shuffleOn && playedHistory.length) {
    loadAndPlay(playedHistory.pop());
    return;
  }
  const i = cards.indexOf(currentCard);
  loadAndPlay(cards[(i - 1 + cards.length) % cards.length]);
}

// ---------- Seek bar ----------
function setRangeFill(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--pct", pct + "%");
}

function resetSeekUI() {
  const seek = document.getElementById("pbSeek");
  seek.value = 0;
  setRangeFill(seek);
  document.getElementById("pbCur").textContent = "0:00";
  document.getElementById("pbDur").textContent = "0:00";
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Card clicks ---
  document.querySelectorAll(".music-card").forEach((card) => {
    // Clicking the album art (image or image-box wrapper) plays it
    const imageBox =
      card.querySelector(".image-box") || card.querySelector("img");
    if (imageBox) {
      imageBox.addEventListener("click", () => { window.BB_queue = null; playCard(card); });
    }

    // The little floating play button also works
    const playBtn = card.querySelector(".play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.BB_queue = null;
        playCard(card);
      });
    }
  });

  // --- Player bar controls ---
  const seek = document.getElementById("pbSeek");
  const vol = document.getElementById("pbVol");
  const volIcon = document.getElementById("pbVolIcon");

  document.getElementById("pbPlay").addEventListener("click", togglePlayPause);
  document.getElementById("pbNext").addEventListener("click", () => playNext(false));
  document.getElementById("pbPrev").addEventListener("click", playPrevious);

  // Dragging the seek bar moves the song forwards / backwards
  seek.addEventListener("input", () => {
    isSeeking = true;
    setRangeFill(seek);
    if (isFinite(audioPlayer.duration)) {
      const t = (seek.value / 100) * audioPlayer.duration;
      document.getElementById("pbCur").textContent = formatTime(t);
    }
  });
  seek.addEventListener("change", () => {
    if (isFinite(audioPlayer.duration)) {
      audioPlayer.currentTime = (seek.value / 100) * audioPlayer.duration;
    }
    isSeeking = false;
  });

  // Volume
  vol.addEventListener("input", () => {
    audioPlayer.volume = vol.value;
    setRangeFill(vol);
    volIcon.className =
      "fa-solid " +
      (vol.value == 0
        ? "fa-volume-xmark"
        : vol.value < 0.5
          ? "fa-volume-low"
          : "fa-volume-high");
  });
  setRangeFill(vol);

  // --- Shuffle / repeat ---
  const shuffleBtn = document.getElementById("pbShuffle");
  const repeatBtn = document.getElementById("pbRepeat");
  function updateModeUI() {
    shuffleBtn.classList.toggle("on", shuffleOn);
    shuffleBtn.setAttribute("aria-pressed", String(shuffleOn));
    repeatBtn.classList.toggle("on", repeatMode > 0);
    repeatBtn.classList.toggle("one", repeatMode === 2);
    repeatBtn.setAttribute("aria-label", ["Repeat off", "Repeat all", "Repeat one"][repeatMode]);
  }
  shuffleBtn.addEventListener("click", () => { shuffleOn = !shuffleOn; updateModeUI(); savePlayer(); renderQueue(); });
  repeatBtn.addEventListener("click", () => { repeatMode = (repeatMode + 1) % 3; updateModeUI(); savePlayer(); });

  // --- Mute ---
  let lastVol = 1;
  document.getElementById("pbMute").addEventListener("click", () => {
    if (audioPlayer.volume > 0) { lastVol = audioPlayer.volume; vol.value = 0; }
    else { vol.value = lastVol || 0.5; }
    vol.dispatchEvent(new Event("input"));
  });
  vol.addEventListener("input", savePlayer);

  // --- Queue panel ---
  const qBtn = document.getElementById("pbQueue");
  const qPanel = document.getElementById("queuePanel");
  qBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    qPanel.hidden = !qPanel.hidden;
    qBtn.classList.toggle("on", !qPanel.hidden);
    renderQueue();
  });
  qPanel.addEventListener("click", (e) => {
    const r = e.target.closest("[data-q]");
    if (r && queueCards[r.dataset.q]) loadAndPlay(queueCards[r.dataset.q]);
  });
  document.addEventListener("click", (e) => {
    if (!qPanel.hidden && !qPanel.contains(e.target)) { qPanel.hidden = true; qBtn.classList.remove("on"); }
  });

  // --- Like (heart) ---
  document.getElementById("pbLike").addEventListener("click", (e) => {
    if (!currentCard) return;
    if (!localStorage.getItem("beatboxUser")) {
      const r = e.currentTarget.getBoundingClientRect();
      showLoginTooltip({ stopPropagation() {}, currentTarget: { getBoundingClientRect: () => ({ top: r.top - 130, right: Math.min(r.right, innerWidth - 360) }) } });
      return;
    }
    if (window.BB) window.BB.toggleLike(currentCard.dataset.audio);
  });

  // --- Remember what was playing ---
  let lastSave = 0;
  audioPlayer.addEventListener("timeupdate", () => {
    if (Date.now() - lastSave > 1500) { lastSave = Date.now(); savePlayer(); }
  });
  audioPlayer.addEventListener("pause", savePlayer);
  window.addEventListener("beforeunload", savePlayer);

  try {
    const saved = JSON.parse(localStorage.getItem(PLAYER_KEY));
    if (saved) {
      if (typeof saved.vol === "number") {
        audioPlayer.volume = saved.vol;
        vol.value = saved.vol;
        vol.dispatchEvent(new Event("input"));
      }
      shuffleOn = !!saved.shuffle;
      repeatMode = saved.repeat || 0;
      if (saved.id) {
        const card = getPlayableCards().find((c) => c.dataset.audio === saved.id);
        if (card) {
          currentCard = card;
          audioPlayer.src = card.dataset.audio;
          showPlayerBar(card);
          audioPlayer.addEventListener("loadedmetadata", () => {
            if (saved.t > 0 && saved.t < audioPlayer.duration) audioPlayer.currentTime = saved.t;
          }, { once: true });
        }
      }
    }
  } catch (e) {}
  updateModeUI();

  // Space bar toggles play / pause (unless typing in a field)
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (e.code === "Space" && currentCard && tag !== "input" && tag !== "textarea") {
      e.preventDefault();
      togglePlayPause();
    }
  });

  // --- Audio events ---
  audioPlayer.addEventListener("loadedmetadata", () => {
    document.getElementById("pbDur").textContent = formatTime(audioPlayer.duration);
  });

  audioPlayer.addEventListener("timeupdate", () => {
    if (isSeeking || !isFinite(audioPlayer.duration)) return;
    seek.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    setRangeFill(seek);
    document.getElementById("pbCur").textContent = formatTime(audioPlayer.currentTime);
  });

  audioPlayer.addEventListener("play", syncCardUI);
  audioPlayer.addEventListener("pause", syncCardUI);
  audioPlayer.addEventListener("error", () => {
    syncCardUI();
    if (audioPlayer.getAttribute("src")) showToast("Couldn’t play this song. Check that the file is in your audio folder.");
  });

  // When a song finishes, move on to the next one
  audioPlayer.addEventListener("ended", () => playNext(true));
});


// ============================
// CREATE MENU (Your Library)
// ============================

function toggleCreateMenu(event) {
  event.stopPropagation();
  closeLoginTooltip();
  const menu = document.getElementById("createMenu");
  const btn = document.getElementById("createBtn");
  const open = !menu.classList.contains("show");
  menu.classList.toggle("show", open);
  btn.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
  const icon = btn.querySelector("i");
  icon.classList.toggle("fa-plus", !open);
  icon.classList.toggle("fa-xmark", open);
}

function closeCreateMenu() {
  const menu = document.getElementById("createMenu");
  const btn = document.getElementById("createBtn");
  if (!menu || !menu.classList.contains("show")) return;
  menu.classList.remove("show");
  btn.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
  const icon = btn.querySelector("i");
  icon.classList.add("fa-plus");
  icon.classList.remove("fa-xmark");
}

// Logged out: ask to log in. Logged in: really create it.
function createMenuPick(event, kind) {
  closeCreateMenu();
  if (!localStorage.getItem("beatboxUser")) {
    showLoginTooltip(event);
    return;
  }
  if (window.BB) window.BB.create(kind || "playlist");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("createMenu");
  if (menu && !menu.contains(e.target)) closeCreateMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCreateMenu();
});

// ============================
// SCROLL ARROWS FOR CARD ROWS
// ============================

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".card-container, .artist-container, .chart-container")
    .forEach((row) => {
      const wrap = document.createElement("div");
      wrap.className = "row-wrap";
      row.parentNode.insertBefore(wrap, row);
      wrap.appendChild(row);

      const mk = (dir) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "row-arrow " + dir;
        b.setAttribute("aria-label", dir === "left" ? "Scroll left" : "Scroll right");
        b.innerHTML = '<i class="fa-solid fa-chevron-' + dir + '"></i>';
        b.addEventListener("click", () => {
          row.scrollBy({
            left: (dir === "left" ? -1 : 1) * row.clientWidth * 0.8,
            behavior: "smooth",
          });
        });
        wrap.appendChild(b);
        return b;
      };
      const left = mk("left");
      const right = mk("right");

      const update = () => {
        left.hidden = row.scrollLeft <= 4;
        right.hidden = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      };
      row.addEventListener("scroll", update);
      window.addEventListener("resize", update);
      update();
    });
});


// ============================
// SEARCH + BROWSE ALL
// ============================

(function () {
  const CATEGORIES = [
    ["Music", "#dc148c", "🎵"], ["Podcasts", "#006450", "🎙️"],
    ["Live Events", "#8400e7", "🎤"], ["Made For You", "#1e3264", "💿"],
    ["New Releases", "#e8115b", "✨"], ["Hindi", "#e13300", "🪕"],
    ["Punjabi", "#148a08", "🥁"], ["Tamil", "#477d95", "🎶"],
    ["Telugu", "#503750", "🎼"], ["Pop", "#8d67ab", "🎧"],
    ["Hip-Hop", "#ba5d07", "🎤"], ["Charts", "#2d46b9", "📈"],
    ["Party", "#af2896", "🪩"], ["Workout", "#777777", "💪"],
    ["Chill", "#4b917d", "🌙"], ["Romance", "#e91429", "❤️"],
  ];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.toLowerCase().trim();

  let songs = [];
  let artists = [];
  let filter = "all";

  let homeView, searchView, body, chips, input, clearBtn;

  // Read songs + artists straight from the cards already on the home page
  function buildIndex() {
    songs = getPlayableCards().map((card) => ({
      title: card.querySelector("h3")?.textContent.trim() || "",
      artist: card.querySelector("p")?.textContent.trim() || "",
      img: card.querySelector("img")?.src || "",
      card,
    }));

    const seen = new Set();
    document.querySelectorAll(".artist-card").forEach((a) => {
      const name = a.querySelector("h3")?.textContent.trim();
      if (!name || seen.has(norm(name))) return;
      seen.add(norm(name));
      artists.push({ name, img: a.querySelector("img")?.src || "" });
    });
    // Artists that only appear on song cards
    songs.forEach((s) => {
      if (s.artist && !seen.has(norm(s.artist))) {
        seen.add(norm(s.artist));
        artists.push({ name: s.artist, img: s.img });
      }
    });
  }

  function score(text, q) {
    const t = norm(text);
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.split(/\s+/).some((w) => w.startsWith(q))) return 60;
    if (t.includes(q)) return 40;
    return 0;
  }

  function search(q) {
    q = norm(q);
    const words = q.split(/\s+/);
    const songHits = songs
      .map((s, i) => {
        let sc = Math.max(score(s.title, q), score(s.artist, q) * 0.9);
        const both = norm(s.title + " " + s.artist);
        if (!sc && words.every((w) => both.includes(w))) sc = 30;
        return { s, i, sc };
      })
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc);

    const artistHits = artists
      .map((a, i) => ({ a, i, sc: score(a.name, q) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc);

    return { songHits, artistHits };
  }

  // ---------- rendering ----------
  function songRow(x) {
    const s = x.s;
    return `<div class="search-row" data-song="${x.i}" tabindex="0" role="button" aria-label="Play ${esc(s.title)}">
      <div class="sr-img"><img src="${esc(s.img)}" alt="" /><i class="fa-solid fa-play"></i></div>
      <div class="sr-text"><strong>${esc(s.title)}</strong><span>${esc(s.artist)}</span></div>
      <button type="button" class="trk-act row-add" data-addidx="${x.i}" aria-label="Add to playlist" title="Add to playlist"><i class="fa-solid fa-plus"></i></button>
    </div>`;
  }

  function artistCard(x) {
    return `<div class="sr-artist" data-artist="${x.i}" tabindex="0" role="button">
      <img src="${esc(x.a.img)}" alt="" /><strong>${esc(x.a.name)}</strong><span>Artist</span>
    </div>`;
  }

  function renderBrowse() {
    chips.hidden = true;
    body.innerHTML =
      '<h2 class="sr-title">Browse all</h2><div class="browse-grid">' +
      CATEGORIES.map(
        ([name, color, icon]) =>
          `<button type="button" class="browse-tile" data-cat="${esc(name)}" style="background:${color}">
            <span>${esc(name)}</span><em aria-hidden="true">${icon}</em></button>`
      ).join("") +
      "</div>";
  }

  function renderResults(q) {
    chips.hidden = false;
    const { songHits, artistHits } = search(q);

    if (!songHits.length && !artistHits.length) {
      body.innerHTML = `<div class="no-results"><h2>No results found for "${esc(q)}"</h2>
        <p>Please make sure your words are spelled correctly, or use fewer or different keywords.</p></div>`;
      return;
    }

    let html = "";
    if (filter === "all") {
      // Top result = best scoring song or artist
      const topSong = songHits[0], topArtist = artistHits[0];
      const useSong = topSong && (!topArtist || topSong.sc > topArtist.sc);
      const top = useSong
        ? { attr: `data-song="${topSong.i}"`, img: topSong.s.img, name: topSong.s.title, label: "Song", sub: topSong.s.artist, round: false }
        : { attr: `data-artist="${topArtist.i}"`, img: topArtist.a.img, name: topArtist.a.name, label: "Artist", sub: "", round: true };

      html += '<div class="sr-top">';
      html += `<section><h2 class="sr-title">Top result</h2>
        <div class="top-result" ${top.attr} tabindex="0" role="button">
          <img class="${top.round ? "round" : ""}" src="${esc(top.img)}" alt="" />
          <strong>${esc(top.name)}</strong>
          <p>${top.sub ? esc(top.sub) + " " : ""}<span class="pill">${top.label}</span></p>
        </div></section>`;
      if (songHits.length) {
        html += `<section><h2 class="sr-title">Songs</h2>${songHits.slice(0, 4).map(songRow).join("")}</section>`;
      }
      html += "</div>";
      if (artistHits.length) {
        html += `<section><h2 class="sr-title">Artists</h2><div class="sr-artists">${artistHits.slice(0, 6).map(artistCard).join("")}</div></section>`;
      }
    } else if (filter === "songs") {
      html += songHits.length
        ? `<section>${songHits.map(songRow).join("")}</section>`
        : `<div class="no-results"><h2>No songs found for "${esc(q)}"</h2></div>`;
    } else {
      html += artistHits.length
        ? `<section><div class="sr-artists wrap">${artistHits.map(artistCard).join("")}</div></section>`
        : `<div class="no-results"><h2>No artists found for "${esc(q)}"</h2></div>`;
    }
    body.innerHTML = html;
    refreshRows();
  }

  function render() {
    const q = input.value.trim();
    if (q) renderResults(q);
    else renderBrowse();
    searchView.scrollTop = 0;
  }

  // Mark the row for the song that's playing right now
  function refreshRows() {
    body.querySelectorAll(".search-row").forEach((row) => {
      const s = songs[row.dataset.song];
      const on = s && s.card === currentCard && !audioPlayer.paused;
      row.classList.toggle("playing", on);
      const ic = row.querySelector(".sr-img i");
      ic.classList.toggle("fa-pause", on);
      ic.classList.toggle("fa-play", !on);
    });
  }

  // ---------- views ----------
  function showView(name) {
    const pv = document.getElementById("pageView");
    if (pv) pv.hidden = true;
    if (window.BB && window.BB.setTab) window.BB.setTab(name === "search" ? "search" : "home");
    homeView.hidden = name !== "home";
    searchView.hidden = name !== "search";
  }

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

  function setQuery(value) {
    input.value = value;
    clearBtn.hidden = !value;
    filter = "all";
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === "all"));
    showView("search");
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    homeView = document.getElementById("homeView");
    searchView = document.getElementById("searchView");
    body = document.getElementById("searchBody");
    chips = document.getElementById("searchChips");
    input = document.getElementById("searchInput");
    clearBtn = document.getElementById("searchClear");
    if (!input || !searchView) return;

    buildIndex();

    input.addEventListener("input", () => {
      clearBtn.hidden = !input.value;
      showView("search");
      render();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setQuery("");
    });
    clearBtn.addEventListener("click", () => { setQuery(""); input.focus(); });

    document.getElementById("browseBtn").addEventListener("click", () => {
      showView("search");
      render();
    });
    document.getElementById("homeBtn").addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      showView("home");
    });

    chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      filter = chip.dataset.filter;
      chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      render();
    });

    // One click handler for everything inside the results
    function activate(el) {
      if (el.closest("[data-addidx]")) {
        const b = el.closest("[data-addidx]");
        if (window.BB) window.BB.openAdd(b, songs[b.dataset.addidx].card.dataset.audio);
      } else if (el.closest("[data-song]")) {
        window.BB_queue = null;
        playCard(songs[el.closest("[data-song]").dataset.song].card);
        refreshRows();
      } else if (el.closest("[data-artist]")) {
        setQuery(artists[el.closest("[data-artist]").dataset.artist].name);
      } else if (el.closest("[data-cat]")) {
        const cat = el.closest("[data-cat]").dataset.cat;
        if (cat === "Podcasts" && window.BB && window.BB.nav) window.BB.nav("podcasts");
        else toast(cat + " is coming soon");
      }
    }
    body.addEventListener("click", (e) => activate(e.target));
    audioPlayer.addEventListener("play", refreshRows);
    audioPlayer.addEventListener("pause", refreshRows);
  });
})();


// ============================
// PROFILE MENU + MOBILE MENU (logged in)
// ============================

function toggleProfileMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("profileMenu");
  const btn = document.getElementById("navProfile");
  menu.hidden = !menu.hidden;
  btn.setAttribute("aria-expanded", String(!menu.hidden));
}

function closeProfileMenu() {
  const menu = document.getElementById("profileMenu");
  if (menu && !menu.hidden) {
    menu.hidden = true;
    document.getElementById("navProfile").setAttribute("aria-expanded", "false");
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("profileMenu");
  if (menu && !menu.hidden && !menu.contains(e.target)) closeProfileMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProfileMenu(); });

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("beatboxUser");
  if (!user) return;

  const pmUser = document.getElementById("pmUser");
  const acc = window.Auth ? Auth.current() : null;
  if (pmUser) pmUser.textContent = acc ? acc.name + " · " + Auth.planName(acc) : user;
  const initial = document.getElementById("profileInitial");
  if (initial && acc) initial.textContent = (acc.name || user).charAt(0).toUpperCase();
  // Already on Premium: the menu link becomes "Manage plan"
  if (acc && acc.plan && acc.plan !== "free") {
    document.querySelectorAll('#profileMenu a[href="premium.html"]').forEach((a) => {
      a.href = "account.html";
      a.firstChild.textContent = "Manage plan ";
    });
  }

  // Mobile hamburger: swap Sign up / Log in for Profile / Log out
  const menu = document.getElementById("hamburgerMenu");
  if (menu) {
    menu.querySelectorAll('a[href="signup.html"], a[href="login.html"]').forEach((a) => (a.style.display = "none"));
    menu.insertAdjacentHTML("beforeend",
      '<a href="account.html"><span>Account</span><span>↗</span></a>' +
      '<a href="index.html#profile"><span>Profile</span><span>↗</span></a>' +
      '<a href="#" onclick="logout(); return false;"><span>Log out</span><span></span></a>');
  }
});


// ============================
// KEYBOARD + SCREEN READER HELPERS
// ============================

// Elements made clickable with role="button" / role="link" also work with Enter and Space
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target;
  if (!el.matches || !el.matches('[role="button"][tabindex], [role="link"][tabindex]')) return;
  if (el.matches("a, button, input, textarea, select")) return;
  e.preventDefault();
  el.click();
});

// "Skip to main content" moves focus to whichever view is showing
document.addEventListener("DOMContentLoaded", () => {
  const skip = document.getElementById("skipLink");
  if (!skip) return;
  skip.addEventListener("click", (e) => {
    e.preventDefault();
    const main = Array.from(document.querySelectorAll("main.content")).find((m) => !m.hidden);
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
    }
  });
});


// ============================
// FRIENDLY ERROR IF songs.js IS MISSING
// ============================
document.addEventListener("DOMContentLoaded", () => {
  if (window.BB_DATA) return;
  console.error("BeatBox: songs.js did not load. Put songs.js in the same folder as index.html.");
  document.querySelectorAll("[data-list]").forEach((el) => {
    el.innerHTML = '<p class="load-error" role="alert">We couldn’t load the songs. Make sure <strong>songs.js</strong> is in the same folder as index.html, then refresh with Ctrl+Shift+R.</p>';
  });
});
