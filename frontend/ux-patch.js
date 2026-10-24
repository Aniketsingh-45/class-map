/* Class Map UX patch. Must load BEFORE app.js. */
(function () {
  const lang = () => localStorage.getItem("classmap_lang") || "en";

  // ---- 1. Plain-language labels for mistake patterns (teachers should not see code names) ----
  const ERR = {
    skipped_words:     ["Some words were skipped", "कुछ शब्द छूट गए"],
    substituted_words: ["Some words were read as other words", "कुछ शब्द दूसरे शब्द की तरह पढ़े गए"],
    close_words:       ["Sounds were close, but not exact", "उच्चारण लगभग सही था, पूरी तरह नहीं"],
    none:              ["No clear pattern", "कोई साफ़ पैटर्न नहीं"],
  };
  window.cmPlainError = (code) => { const e = ERR[code] || ERR.none; return lang() === "hi" ? e[1] : e[0]; };

  // ---- 2. Offline read-cache: last good copy of key GET endpoints is kept on the phone ----
  const CACHEABLE = ["/api/children", "/api/groups", "/api/plan/today", "/api/progress", "/api/summary", "/api/samples", "/api/schools"];
  const origFetch = window.fetch.bind(window);
  function uidFrom(init) {
    try {
      let h = init && init.headers; let a = h && (h.Authorization || (h.get && h.get("Authorization")));
      const tok = (a || "").replace("Bearer ", "") || localStorage.getItem("classmap_token") || "";
      return JSON.parse(atob(tok.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))).uid || "anon";
    } catch (e) { return "anon"; }
  }
  function staleBar(ts) {
    let bar = document.getElementById("cm-stale");
    if (!bar) { bar = document.createElement("div"); bar.id = "cm-stale"; bar.className = "cm-stale hidden";
      const nav = document.getElementById("app-tabs-nav"); (nav && nav.parentNode ? nav.parentNode : document.body).insertBefore(bar, nav || document.body.firstChild); }
    const t = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    bar.textContent = lang() === "hi" ? `📴 ऑफ़लाइन: ${t} पर सहेजा हुआ डेटा दिख रहा है` : `📴 Offline: showing data saved at ${t}`;
    bar.classList.remove("hidden");
  }
  window.addEventListener("online", () => { const b = document.getElementById("cm-stale"); if (b) b.classList.add("hidden"); });

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input.url;
    const method = ((init && init.method) || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    let path = ""; try { path = new URL(url, location.origin).pathname; } catch (e) {}
    if (method !== "GET" || !CACHEABLE.includes(path)) return origFetch(input, init);
    const key = `cm_cache:${uidFrom(init)}:${path}`;
    try {
      const res = await origFetch(input, init);
      if (res.ok) res.clone().text().then((body) => { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), body })); } catch (e) {} });
      return res;
    } catch (err) {                                           // network failure: fall back to the last saved copy
      const raw = localStorage.getItem(key);
      if (raw) { const { t, body } = JSON.parse(raw); staleBar(t);
        return new Response(body, { status: 200, headers: { "Content-Type": "application/json", "X-From-Cache": "1" } }); }
      throw err;
    }
  };

  // ---- 3. Tables: copy header text into each cell so CSS can show them as cards on phones ----
  function labelTables() {
    document.querySelectorAll("table").forEach((t) => {
      const heads = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      if (!heads.length) return;
      t.classList.add("cm-stack");
      t.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => { if (heads[i]) td.setAttribute("data-label", heads[i]); }));
    });
  }
  let timer; new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(labelTables, 60); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
