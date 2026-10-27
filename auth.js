// ============================================================
// BeatBox accounts (demo): stored in THIS browser only.
// Passwords are salted + hashed (SHA-256) before saving, but this
// is still client-side only. A real site needs a server.
// ============================================================
(function () {
  const ACC = "beatboxAccounts";
  const CUR = "beatboxUser"; // other pages read this to know who is logged in
  const FAILS = "beatboxFails";
  const norm = (e) => String(e || "").trim().toLowerCase();
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");

  async function hash(pw, salt) {
    const data = new TextEncoder().encode(salt + ":" + pw);
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381;
    for (const c of salt + pw) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return "f" + h;
  }

  const PLANS = {
    free: { name: "BeatBox Free", today: 0, months: 0, recurring: 0 },
    standard: { name: "Premium Standard", today: 139, months: 2, recurring: 139, note: "₹139 for 2 months, then ₹139 per month" },
    prepaid: { name: "Premium Standard (1 year)", today: 799, months: 12, recurring: 0, note: "One-time payment, does not auto-renew" },
    platinum: { name: "Premium Platinum", today: 299, months: 1, recurring: 299, note: "₹299 per month" },
    student: { name: "Premium Student", today: 69, months: 2, recurring: 69, note: "₹69 for 2 months, then ₹69 per month" },
  };

  const Auth = {
    PLANS,
    validEmail: (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim()),
    checkPassword(pw) {
      return { len: pw.length >= 8, letter: /[A-Za-z]/.test(pw), numsym: /[0-9\W_]/.test(pw) };
    },
    passwordOk(pw) { const c = this.checkPassword(pw); return c.len && c.letter && c.numsym; },
    exists: (e) => !!read(ACC)[norm(e)],

    async signup({ email, password, name, dob, gender, provider, marketing }) {
      const all = read(ACC), key = norm(email);
      if (all[key]) throw new Error("exists");
      const salt = rand();
      all[key] = {
        email: key, name: (name || key.split("@")[0]).trim(), dob: dob || "", gender: gender || "",
        provider: provider || "email", salt, hash: password ? await hash(password, salt) : null,
        plan: "free", payments: [], marketing: !!marketing, createdAt: Date.now(),
      };
      write(ACC, all);
      localStorage.setItem(CUR, key);
      return all[key];
    },

    // Returns "ok", "bad" or "locked"
    async login(email, pw) {
      const key = norm(email), fails = read(FAILS), f = fails[key] || { n: 0, until: 0 };
      if (f.until > Date.now()) return "locked";
      const acc = read(ACC)[key];
      const good = acc && acc.hash && (await hash(pw, acc.salt)) === acc.hash;
      if (!good) {
        f.n += 1;
        const lock = f.n >= 5;
        if (lock) { f.until = Date.now() + 30000; f.n = 0; }
        fails[key] = f; write(FAILS, fails);
        return lock ? "locked" : "bad";
      }
      delete fails[key]; write(FAILS, fails);
      localStorage.setItem(CUR, key);
      return "ok";
    },

    current() {
      const e = localStorage.getItem(CUR);
      if (!e) return null;
      const all = read(ACC);
      if (!all[e]) { // logged in with the older version of the site: make an account record
        all[e] = { email: e, name: e.split("@")[0], provider: "legacy", hash: null, plan: "free", payments: [], createdAt: Date.now() };
        write(ACC, all);
      }
      return all[e];
    },
    update(fields) {
      const all = read(ACC), e = localStorage.getItem(CUR);
      if (!all[e]) return null;
      Object.assign(all[e], fields);
      write(ACC, all);
      return all[e];
    },
    async changePassword(oldPw, newPw) {
      const acc = this.current();
      if (!acc || !acc.hash || (await hash(oldPw, acc.salt)) !== acc.hash) return false;
      const salt = rand();
      this.update({ salt, hash: await hash(newPw, salt) });
      return true;
    },
    async resetPassword(email, newPw) {
      const all = read(ACC), key = norm(email);
      if (!all[key]) return false;
      all[key].salt = rand();
      all[key].hash = await hash(newPw, all[key].salt);
      write(ACC, all);
      return true;
    },
    planName(acc) { acc = acc || this.current(); return (PLANS[acc && acc.plan] || PLANS.free).name; },
    setPlan(plan, extra) { return this.update(Object.assign({ plan }, extra || {})); },
    logout() { localStorage.removeItem(CUR); },
    deleteAccount() {
      const e = localStorage.getItem(CUR), all = read(ACC);
      delete all[e]; write(ACC, all);
      ["beatboxLibrary:" + e, "beatboxLiked:" + e].forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(CUR);
    },
    next() {
      const n = sessionStorage.getItem("beatboxNext");
      sessionStorage.removeItem("beatboxNext");
      return n || "index.html";
    },

    // ---------- demo "Continue with Google / Facebook / Apple / phone" ----------
    socialModal(provider) {
      if (!document.getElementById("bbmCss")) {
        const s = document.createElement("style");
        s.id = "bbmCss";
        s.textContent = ".bbm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}.bbm{position:relative;background:#242424;color:#fff;width:100%;max-width:400px;border-radius:12px;padding:30px 26px;font-family:Arial,Helvetica,sans-serif}.bbm h2{font-size:22px;margin-bottom:10px}.bbm-note{font-size:13px;color:#b3b3b3;line-height:1.5;margin-bottom:18px}.bbm label{display:block;font-size:13px;font-weight:700;margin:12px 0 6px}.bbm input{width:100%;height:46px;background:#121212;color:#fff;border:1px solid #727272;border-radius:4px;padding:0 12px;font-size:15px}.bbm input:focus{outline:2px solid #fff}.bbm button.go{width:100%;height:48px;margin-top:20px;border:none;border-radius:30px;background:#1ed760;color:#000;font-weight:700;font-size:16px;cursor:pointer}.bbm-x{position:absolute;top:10px;right:14px;background:none;border:none;color:#b3b3b3;font-size:26px;cursor:pointer}.bbm-err{color:#f15e6c;font-size:13px;margin-top:10px;min-height:16px}.bbm-code{background:#121212;border-radius:6px;padding:10px;text-align:center;font-size:20px;letter-spacing:4px;margin:8px 0}";
        document.head.appendChild(s);
      }
      document.querySelectorAll(".bbm-overlay").forEach((o) => o.remove());
      const phone = provider === "Phone";
      const over = document.createElement("div");
      over.className = "bbm-overlay";
      over.innerHTML = `<div class="bbm" role="dialog" aria-modal="true" aria-labelledby="bbmTitle">
        <button type="button" class="bbm-x" aria-label="Close">×</button>
        <h2 id="bbmTitle">${phone ? "Continue with phone number" : "Continue with " + provider}</h2>
        <p class="bbm-note">Demo only: BeatBox isn’t connected to ${phone ? "a text-message service" : provider}, so no real account is checked. ${phone ? "A sample code is shown on screen." : "Type any email to try the flow."}</p>
        <div id="bbmBody"></div><div class="bbm-err" id="bbmErr" role="alert"></div></div>`;
      document.body.appendChild(over);
      const body = over.querySelector("#bbmBody"), err = over.querySelector("#bbmErr");
      const close = () => { over.remove(); document.removeEventListener("keydown", esc); };
      const esc = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", esc);
      over.querySelector(".bbm-x").addEventListener("click", close);
      over.addEventListener("click", (e) => { if (e.target === over) close(); });
      const finish = async (email, name) => {
        const key = norm(email), acc = read(ACC)[key];
        if (acc && acc.provider !== provider.toLowerCase()) { err.textContent = "That email already has a BeatBox account. Log in with your password instead."; return; }
        if (!acc) await Auth.signup({ email: key, name, provider: provider.toLowerCase() });
        else localStorage.setItem(CUR, key);
        location.href = Auth.next();
      };
      if (phone) {
        body.innerHTML = '<label for="bbmPhone">Mobile number (+91)</label><input id="bbmPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="10-digit number" /><button type="button" class="go">Send code</button>';
        const go = body.querySelector(".go"), inp = body.querySelector("#bbmPhone");
        inp.focus();
        go.addEventListener("click", () => {
          const n = inp.value.replace(/\D/g, "");
          if (!/^[6-9]\d{9}$/.test(n)) { err.textContent = "Enter a valid 10-digit Indian mobile number."; return; }
          err.textContent = "";
          body.innerHTML = '<label>Your demo code</label><div class="bbm-code">123456</div><label for="bbmCode">Enter the 6-digit code</label><input id="bbmCode" inputmode="numeric" maxlength="6" /><button type="button" class="go">Verify</button>';
          const c = body.querySelector("#bbmCode"); c.focus();
          body.querySelector(".go").addEventListener("click", () => {
            if (c.value.trim() !== "123456") { err.textContent = "That code isn’t right. Try again."; return; }
            finish(n + "@phone.beatbox.local", "Phone " + n.slice(-4));
          });
        });
      } else {
        body.innerHTML = '<label for="bbmEmail">Email</label><input id="bbmEmail" type="email" placeholder="name@example.com" /><label for="bbmName">Name (optional)</label><input id="bbmName" type="text" /><button type="button" class="go">Continue</button>';
        const em = body.querySelector("#bbmEmail"); em.focus();
        body.querySelector(".go").addEventListener("click", () => {
          if (!Auth.validEmail(em.value)) { err.textContent = "Enter a valid email address."; return; }
          finish(em.value, body.querySelector("#bbmName").value || em.value.split("@")[0]);
        });
      }
    },
  };
  window.Auth = Auth;
})();