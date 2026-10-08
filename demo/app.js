/* 音乐数据台 · Demo
 * 数据说明见 data.js：当期名次为真实榜单数据，历史轨迹为演示数据。
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }
  function svg(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function fmtRank(v) { return v == null ? "出" : v; }

  /* 解析一条轨迹：空降 / 峰值 / 出榜 / 回榜 / 在榜期数 */
  function analyze(traj) {
    var debut = null, peak = null, peakIdx = -1, exits = [], reentries = [], weeks = 0;
    for (var i = 0; i < traj.length; i++) {
      var v = traj[i];
      if (v != null) {
        weeks++;
        if (debut === null) debut = v;
        if (peak === null || v < peak) { peak = v; peakIdx = i; }
        if (i > 0 && traj[i - 1] == null) reentries.push({ i: i, v: v });
      } else if (i > 0 && traj[i - 1] != null) {
        exits.push({ i: i - 1, v: traj[i - 1] });
      }
    }
    return {
      debut: debut, peak: peak, peakIdx: peakIdx,
      exits: exits, reentries: reentries, weeks: weeks,
      last: traj[traj.length - 1], onChart: traj[traj.length - 1] != null
    };
  }

  /* 走势曲线。opt.mini = 缩略图（无坐标轴） */
  function runChart(host, traj, opt) {
    opt = opt || {};
    host.innerHTML = "";
    var mini = !!opt.mini;
    var W = host.clientWidth || (mini ? 66 : 380);
    var H = host.clientHeight || (mini ? 38 : 140);
    var padL = mini ? 3 : 24, padR = mini ? 3 : 22, padT = mini ? 4 : 14, padB = mini ? 4 : 18;
    var s = svg("svg", { width: "100%", height: "100%", viewBox: "0 0 " + W + " " + H });

    var vals = traj.filter(function (v) { return v != null; });
    if (!vals.length) { host.appendChild(s); return; }
    var maxRank = Math.max.apply(null, vals), minRank = Math.min.apply(null, vals);
    var top = Math.max(1, minRank - 1), bot = maxRank + 1;
    var n = traj.length;
    var X = function (i) { return padL + (n <= 1 ? 0 : i * (W - padL - padR) / (n - 1)); };
    var Y = function (v) { return padT + (v - top) / (bot - top) * (H - padT - padB); };

    if (!mini) {
      for (var g = 0; g < 3; g++) {
        var rv = Math.round(top + (bot - top) * g / 2);
        s.appendChild(svg("line", { x1: padL, y1: Y(rv), x2: W - padR, y2: Y(rv), class: "grid-line" }));
        var tl = svg("text", { x: 4, y: Y(rv) + 3, class: "chart-label" });
        tl.textContent = rv;
        s.appendChild(tl);
      }
    }

    var info = analyze(traj);
    var segs = [], cur = [];
    for (var i = 0; i < n; i++) {
      if (traj[i] != null) cur.push(i);
      else if (cur.length) { segs.push(cur); cur = []; }
    }
    if (cur.length) segs.push(cur);

    if (!mini) {
      info.exits.forEach(function (ex) {
        var nx = null;
        for (var j = ex.i + 1; j < n; j++) if (traj[j] != null) { nx = j; break; }
        s.appendChild(svg("line", {
          x1: X(ex.i), y1: Y(ex.v),
          x2: nx != null ? X(nx) : X(ex.i),
          y2: nx != null ? Y(traj[nx]) : Y(ex.v),
          class: "run-gap"
        }));
      });
    }

    segs.forEach(function (seg) {
      var d = seg.map(function (idx, k) {
        return (k === 0 ? "M" : "L") + X(idx).toFixed(1) + " " + Y(traj[idx]).toFixed(1);
      }).join(" ");
      s.appendChild(svg("path", { d: d, class: "run-line " + (opt.variant === "b" ? "p1" : "p0") + (mini ? " thin" : "") }));
    });

    if (!mini) {
      function dot(x, y, cls) { s.appendChild(svg("circle", { cx: x, cy: y, r: 3.6, class: "evt " + cls })); }
      if (info.peakIdx >= 0) dot(X(info.peakIdx), Y(info.peak), "debut");
      info.reentries.forEach(function (r) { dot(X(r.i), Y(r.v), "reentry"); });
      info.exits.forEach(function (e) { dot(X(e.i), Y(e.v), "exit"); });
    }
    host.appendChild(s);
  }

  /* 雷达图 */
  var DIM_KEYS = [
    { k: "total", label: "热度总量" },
    { k: "peak", label: "峰值高度" },
    { k: "duration", label: "持续性" },
    { k: "stability", label: "稳定性" },
    { k: "burst", label: "爆发力" },
    { k: "coverage", label: "覆盖广度" }
  ];

  function radar(host, A, B, weights) {
    host.innerHTML = "";
    var S = 260, C = S / 2, R = 92, maxW = 2;
    var s = svg("svg", { width: S, height: S, viewBox: "0 0 " + S + " " + S });
    function pt(i, r) {
      var ang = -Math.PI / 2 + i * (Math.PI / 3);
      return [C + Math.cos(ang) * r, C + Math.sin(ang) * r];
    }
    for (var ring = 1; ring <= 3; ring++) {
      var dd = "";
      for (var i = 0; i < 6; i++) {
        var p = pt(i, R * ring / 3);
        dd += (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      }
      s.appendChild(svg("path", { d: dd + "Z", class: "radar-grid" }));
    }
    for (var i2 = 0; i2 < 6; i2++) {
      var p2 = pt(i2, R);
      s.appendChild(svg("line", { x1: C, y1: C, x2: p2[0], y2: p2[1], class: "radar-grid" }));
    }
    function poly(dims, cls) {
      var d = "";
      for (var i = 0; i < 6; i++) {
        var v = (dims[DIM_KEYS[i].k] || 0) * weights[DIM_KEYS[i].k] / (100 * maxW);
        var p = pt(i, R * v);
        d += (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      }
      s.appendChild(svg("path", { d: d + "Z", class: cls }));
    }
    poly(A.dims, "radar-a");
    poly(B.dims, "radar-b");
    for (var i3 = 0; i3 < 6; i3++) {
      var p3 = pt(i3, R + 16);
      var t = svg("text", {
        x: p3[0], y: p3[1] + 3, class: "chart-label",
        "text-anchor": Math.abs(p3[0] - C) < 6 ? "middle" : (p3[0] > C ? "start" : "end")
      });
      t.textContent = DIM_KEYS[i3].label;
      s.appendChild(t);
    }
    host.appendChild(s);
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  window.__CORE = {
    $: $, svg: svg, fmtRank: fmtRank, analyze: analyze,
    runChart: runChart, radar: radar, DIM_KEYS: DIM_KEYS, toast: toast
  };
})();

/* ================= 视图与交互 ================= */
(function () {
  var C = window.__CORE, D = window.DEMO_DATA;
  var $ = C.$, analyze = C.analyze;

  var state = {
    view: "home",
    stack: [],
    heroIdx: 0,
    heroScope: "today",
    song: null,
    cmpA: 0,
    cmpB: 1,
    weights: { total: 1, peak: 1, duration: 1, stability: 1, burst: 1, coverage: 1 }
  };

  var FEATURED = [
    { songId: "s1", badge: "今日回榜", headline: "空降第 3，一路掉出榜，第 11 期它又回来了。" },
    { songId: "s2", badge: "最猛爬升", headline: "11 期从第 45 爬到第 3，本季最陡的一条上升线。" },
    { songId: "s4", badge: "连冠", headline: "冲到第 1 之后就没再下来过，已经连冠 4 期。" },
    { songId: "s8", badge: "长青", headline: "累计在榜 1776 期，中间掉出去两次，每次都爬回来了。" },
    { songId: "s12", badge: "空降冠军", headline: "空降即冠军，并且连续 10 周没把第 1 名让出去。" },
    { songId: "s11", badge: "韩语主场", headline: "空降第 9，此后 20 周几乎没掉出过前 4。" },
    { songId: "s13", badge: "日语主场", headline: "空降第 8 后一路爬到第 1，此后一直没掉出前 3。" }
  ];

  var hotData = D.hotSnapshot;

  /* ---------- 榜单数据层 ----------
   * 真实当期数据来自 charts.js（由 tools/fetch-charts.mjs 生成）
   * 演示轨迹来自 data.js 的 featured songs
   */
  var REAL = (window.CHART_DATA && window.CHART_DATA.charts) || [];
  var REAL_FETCHED_AT = (window.CHART_DATA && window.CHART_DATA.fetchedAt) || "";

  function realChart(id) {
    for (var i = 0; i < REAL.length; i++) if (REAL[i].id === id) return REAL[i];
    return null;
  }
  function chartMetaById(id) {
    var r = realChart(id);
    if (r) return { name: r.name, unit: r.unit, freq: r.freq, date: r.date, real: true, total: r.total };
    var m = (D.chartMeta && D.chartMeta[id]) || D.chartMeta.hot;
    return { name: m.name, unit: m.unit, freq: m.freq, date: D.fetchDate, real: false, total: null };
  }
  function allCharts() {
    var out = [];
    REAL.forEach(function (c) {
      out.push({ id: c.id, name: c.name, freq: c.freq, tag: "真实数据 · " + c.entries.length + " 条", real: true });
    });
    (D.charts || []).forEach(function (c) {
      if (!out.some(function (x) { return x.id === c.id; })) {
        out.push({ id: c.id, name: c.name, freq: c.freq, tag: c.tag, real: false });
      }
    });
    return out;
  }
  function featuredMatch(title, artist) {
    for (var i = 0; i < D.songs.length; i++) {
      var s = D.songs[i];
      if (s.title === title && (s.artist === artist || artist.indexOf(s.artist) >= 0 || s.artist.indexOf(artist) >= 0)) return s;
    }
    return null;
  }

  /* 歌手照片：优先精确匹配，其次包含匹配；没有则回退字母头像 */
  function artistPhoto(name) {
    var map = (window.CHART_DATA && window.CHART_DATA.artists) || {};
    if (!name) return null;
    if (map[name]) return map[name];
    for (var k in map) {
      if (k.indexOf(name) >= 0 || name.indexOf(k.split("/")[0]) >= 0) return map[k];
    }
    return null;
  }

  /* ---------- 走势模拟（演示用） ----------
   * 公开接口不提供历史回溯，真实榜单作品只能拿到当期名次。
   * 为了让 Demo 能完整展示"从头到尾"的走势，这里按曲目生成一条**确定性**的模拟轨迹：
   * 同一个 歌名+歌手 每次得到同一条曲线；末值锚定为该曲真实的当前名次。
   * 所有模拟轨迹在界面上都标注为「模拟走势」。
   */
  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function simulateTrajectory(entry) {
    var rnd = seededRandom(hashSeed(entry.title + "|" + entry.artist));
    var end = Math.max(1, Math.round(entry.rank));
    var len = 12 + Math.floor(rnd() * 7);
    var peak = Math.max(1, Math.round(end * (0.35 + rnd() * 0.5)));
    var start = Math.min(120, Math.round(end + 12 + rnd() * 42));
    var noise = Math.max(1, end * 0.09);
    var traj = [];
    for (var i = 0; i < len; i++) {
      var t = i / (len - 1), v;
      if (t < 0.55) {
        var u = t / 0.55;
        v = start + (peak - start) * (1 - Math.pow(1 - u, 2));
      } else {
        v = peak + (end - peak) * ((t - 0.55) / 0.45);
      }
      v += (rnd() - 0.5) * 2 * noise;
      traj.push(Math.max(1, Math.round(v)));
    }
    traj[len - 1] = end;
    return traj;
  }

  /* 统一的"作品对象"：不管是来自真实榜单还是演示曲目，都归一成这个结构 */
  function trackFromFeatured(s) {
    var meta = chartMetaById(s.chart);
    return {
      key: s.id, featuredId: s.id,
      title: s.title, artist: s.artist, cover: coverPath(s),
      chartId: s.chart, chartName: meta.name, unit: meta.unit,
      rank: s.rank, prevRank: s.prevRank, weeks: s.weeks, hot: null,
      trajectory: s.trajectory, trajectoryIsDemo: true
    };
  }
  function trackFromEntry(e, chartId) {
    var meta = chartMetaById(chartId);
    var f = featuredMatch(e.title, e.artist);
    return {
      key: "c:" + chartId + ":" + e.rank, featuredId: f ? f.id : null,
      title: e.title, artist: e.artist, cover: e.cover || (f ? coverPath(f) : null),
      chartId: chartId, chartName: meta.name, unit: meta.unit,
      rank: e.rank, prevRank: e.prevRank, weeks: e.weeks, hot: e.hot,
      trajectory: f ? f.trajectory : simulateTrajectory(e),
      trajectoryIsDemo: true,
      trajectoryIsSimulated: !f
    };
  }
  function resolveKey(key) {
    if (!key) return null;
    if (key.indexOf("c:") === 0) {
      var parts = key.split(":");
      var c = realChart(parts[1]);
      if (!c) return null;
      var rank = parseInt(parts[2], 10);
      for (var i = 0; i < c.entries.length; i++) if (c.entries[i].rank === rank) return trackFromEntry(c.entries[i], c.id);
      return null;
    }
    var s = songById(key);
    return s ? trackFromFeatured(s) : null;
  }
  /* 收藏项的迷你图容器 id：key 里可能含冒号，需转成合法 id */
  function miniKey(key) { return String(key).replace(/[^A-Za-z0-9_-]/g, "_"); }

  function songById(id) {
    for (var i = 0; i < D.songs.length; i++) if (D.songs[i].id === id) return D.songs[i];
    return null;
  }
  function byArtist(name) {
    return D.songs.filter(function (s) { return s.artist.indexOf(name) >= 0; });
  }

  /* ---------- 收藏（本地存储） ---------- */
  var FAV_KEY = "mdt_favorites_v1";
  function loadFavs() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      var arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function isFav(id) { return loadFavs().indexOf(id) >= 0; }
  function addFav(id) {
    var l = loadFavs();
    if (l.indexOf(id) < 0) { l.unshift(id); saveFavs(l); }
  }
  function removeFav(id) {
    saveFavs(loadFavs().filter(function (x) { return x !== id; }));
  }

  /* ---------- AI 助手：把问题映射到数据事实 ---------- */
  function aiAnswer(q) {
    var t = (q || "").trim();
    if (!t) return null;

    if (t.indexOf("空降") >= 0) {
      var debuts = D.songs.filter(function (s) { return s.trajectory[0] != null; })
        .sort(function (a, b) { return a.trajectory[0] - b.trajectory[0]; }).slice(0, 3);
      return {
        q: t,
        a: "按演示轨迹，进榜名次最靠前的三首是：" +
          debuts.map(function (s) { return "《" + s.title + "》第 " + s.trajectory[0] + " 名"; }).join("、") +
          "。以上为榜单事实。"
      };
    }

    if (t.indexOf("最久") >= 0 || t.indexOf("在榜最") >= 0) {
      var top = D.songs.slice().sort(function (a, b) { return b.weeks - a.weeks; })[0];
      return { q: t, a: "累计在榜期数最多的是《" + top.title + "》（" + top.artist + "），共 " + top.weeks + " 期。" };
    }

    var mArt = t.match(/([\u4e00-\u9fa5A-Za-z\.]{2,10})(?:有|的)?(?:几首|多少首)/);
    if (mArt) {
      var name = mArt[1];
      var list = byArtist(name);
      if (list.length) {
        return {
          q: t,
          a: name + " 当前有 " + list.length + " 首在热歌榜：" +
            list.map(function (s) { return "《" + s.title + "》第 " + s.rank + " 名"; }).join("、") + "。"
        };
      }
    }

    for (var i = 0; i < D.songs.length; i++) {
      var s = D.songs[i];
      if (t.indexOf(s.title) >= 0) {
        var info = analyze(s.trajectory);
        var parts = ["《" + s.title + "》当前第 " + s.rank + " 名"];
        if (info.debut != null) parts.push("进榜第 " + info.debut + " 名");
        if (info.peak != null) parts.push("峰值第 " + info.peak + " 名");
        parts.push("演示轨迹累计在榜 " + info.weeks + " 期");
        if (info.exits.length) parts.push("出榜 " + info.exits.length + " 次");
        if (info.reentries.length) parts.push("回榜 " + info.reentries.length + " 次");
        return { q: t, a: parts.join("，") + "。" };
      }
    }

    for (var j = 0; j < D.compareArtists.length; j++) {
      var a = D.compareArtists[j];
      if (t.indexOf(a.name) >= 0) {
        var ls = byArtist(a.name);
        return {
          q: t,
          a: a.name + " 当前在热歌榜有 " + ls.length + " 首：" +
            ls.map(function (x) { return "《" + x.title + "》第 " + x.rank + " 名"; }).join("、") +
            "。想知道更多可以点进轨迹页看完整走势。"
        };
      }
    }

    return {
      q: t,
      a: "演示版只接入了部分榜单数据，暂时答不了这个。可以试试：「今天谁空降了？」「哪首歌在榜最久？」「孙燕姿有几首在榜？」"
    };
  }

  function askAI(q) {
    var r = aiAnswer(q);
    var box = $("aiAnswer");
    if (!r) return;
    box.hidden = false;
    box.innerHTML = '<span class="ans-q">你问：' + escapeHtml(r.q) + '</span>' + escapeHtml(r.a);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 封面 ---------- */
  function coverPath(song) { return "covers/" + song.id + ".jpg"; }

  /* 封面缺失时退回占位符号，不破坏布局。
   * songOrSrc 可以是曲目对象，也可以直接是图片地址字符串。 */
  function coverInto(host, songOrSrc, cls, ph) {
    if (!host) return null;
    host.className = "cover " + cls;
    host.innerHTML = "";
    var phEl = document.createElement("span");
    phEl.className = "cover-ph";
    phEl.textContent = ph || "♪";
    host.appendChild(phEl);
    var src = typeof songOrSrc === "string" ? songOrSrc : (songOrSrc ? coverPath(songOrSrc) : null);
    if (src) {
      var img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.src = src;
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      host.appendChild(img);
    }
    return host;
  }
  function coverBox(song, cls, ph) {
    return coverInto(document.createElement("span"), song, cls, ph);
  }

  /* ---------- 路由 ---------- */
  function go(view) {
    var VIEWS = ["home", "track", "artist", "chart", "compare", "profile"];
    if (VIEWS.indexOf(view) < 0) view = "home";
    state.view = view;
    VIEWS.forEach(function (v) {
      $("view-" + v).classList.toggle("active", v === view);
    });
    var isDetail = (view === "track" || view === "artist" || view === "chart");
    var isRoot = !isDetail;
    $("backBtn").hidden = isRoot;
    $("timeTabs").style.display = (view === "home") ? "flex" : "none";
    $("topTitle").textContent =
      view === "home" ? "数据现场" :
      view === "artist" ? "歌手" :
      view === "chart" ? "榜单" :
      view === "track" ? "榜单轨迹" :
      view === "compare" ? "数据对比" : "我的";
    var activeTab = isDetail
      ? (state.stack[state.stack.length - 1] || "home")
      : view;
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].dataset.view === activeTab);
    }
    if (view === "track") renderTrack();
    if (view === "artist") renderArtist();
    if (view === "chart") renderChartList();
    if (view === "compare") renderCompare();
    if (view === "profile") renderProfile();
    window.scrollTo(0, 0);
  }

  /* ---------- 首页 ---------- */
  function heroItems() {
    if (state.heroScope === "history") {
      return D.history.map(function (h) {
        return {
          badge: h.when, headline: h.headline, history: true,
          songId: h.songId, date: h.date, trajectory: h.trajectory
        };
      });
    }
    return FEATURED;
  }

  function renderHero() {
    var items = heroItems();
    if (state.heroIdx >= items.length) state.heroIdx = 0;
    var it = items[state.heroIdx];
    var host = $("heroChart");
    $("heroBadge").textContent = it.badge;
    $("heroHeadline").textContent = it.headline;
    if (it.history) {
      /* 往年今日也画轨迹：一段"当时的"走势切片 */
      var hs = it.songId ? songById(it.songId) : null;
      host.innerHTML = "";
      C.runChart(host, it.trajectory || [], {});
      var hm = $("heroMeta");
      hm.innerHTML = "";
      if (hs) hm.appendChild(coverBox(hs, "hero-cover", "♪"));
      var ht = document.createElement("span");
      ht.textContent = "《" + (hs ? hs.title : "—") + "》· " + (hs ? hs.artist : "") +
        " · " + it.date + " · 演示数据";
      hm.appendChild(ht);
    } else {
      var s = songById(it.songId);
      host.innerHTML = "";
      C.runChart(host, s.trajectory, {});
      var metaHost = $("heroMeta");
      metaHost.innerHTML = "";
      metaHost.appendChild(coverBox(s, "hero-cover", "♪"));
      var metaText = document.createElement("span");
      metaText.textContent = "《" + s.title + "》· " + s.artist + " · 在榜 " + s.weeks + " 期 · 演示轨迹";
      metaHost.appendChild(metaText);
    }
    var dots = $("heroDots");
    dots.innerHTML = "";
    items.forEach(function (_, i) {
      var d = document.createElement("button");
      d.className = "dot" + (i === state.heroIdx ? " active" : "");
      d.setAttribute("aria-label", "第 " + (i + 1) + " 条");
      d.onclick = function (e) { e.stopPropagation(); state.heroIdx = i; renderHero(); };
      dots.appendChild(d);
    });
  }

  function renderAiAsks() {
    var host = $("aiAsks");
    host.innerHTML = "";
    D.aiAsks.forEach(function (q) {
      var b = document.createElement("button");
      b.textContent = q;
      b.onclick = function () { $("aiInput").value = q; askAI(q); };
      host.appendChild(b);
    });
  }

  /* 走势页：就当前这首歌追问 */
  function renderTrackAsks() {
    var host = $("trackAsks");
    if (!host) return;
    host.innerHTML = "";
    D.trackAsks.forEach(function (q) {
      var b = document.createElement("button");
      b.textContent = q;
      b.onclick = function () { $("trackAiInput").value = q; askTrack(q); };
      host.appendChild(b);
    });
  }

  function answerForSong(track, q) {
    var t = (q || "").trim();
    if (!t || !track || !track.trajectory) return null;
    var info = analyze(track.trajectory);
    var head = "《" + track.title + "》";
    var best = info.reentries.length
      ? Math.min.apply(null, info.reentries.map(function (r) { return r.v; }))
      : null;

    if (/掉|出榜|出去/.test(t)) {
      return {
        q: t,
        a: info.exits.length
          ? head + "在这段演示轨迹里掉出过 " + info.exits.length + " 次，回榜 " + info.reentries.length +
            " 次" + (best != null ? "，回榜最好成绩第 " + best + " 名。" : "。")
          : head + "在这段演示轨迹里没有掉出过榜。"
      };
    }
    if (/最高|峰值|冲到|第几/.test(t)) {
      return { q: t, a: head + "峰值第 " + info.peak + " 名，出现在第 " + (info.peakIdx + 1) + " 期。" };
    }
    if (/回榜/.test(t)) {
      return {
        q: t,
        a: info.reentries.length
          ? head + "回榜过 " + info.reentries.length + " 次，最好回到第 " + best + " 名。"
          : head + "没有回榜记录。"
      };
    }
    if (/几期|多久|在榜/.test(t)) {
      return {
        q: t,
        a: head + "演示轨迹累计在榜 " + info.weeks + " 期；当前" +
          (info.onChart ? "第 " + track.rank + " 名。" : "处于出榜状态。")
      };
    }
    if (/最近|近况|近期/.test(t)) {
      return { q: t, a: head + "最近五期：" + track.trajectory.slice(-5).map(C.fmtRank).join(" → ") + "。" };
    }
    if (/空降|进榜/.test(t)) {
      return { q: t, a: head + "进榜第 " + info.debut + " 名。" };
    }
    return aiAnswer(t);
  }

  function askTrack(q) {
    var r = answerForSong(state.track, q);
    var box = $("trackAiAnswer");
    if (!r || !box) return;
    box.hidden = false;
    box.innerHTML = '<span class="ans-q">你问：' + escapeHtml(r.q) + '</span>' + escapeHtml(r.a);
  }

  /* 找走势：点了直接进轨迹页（保留原来的歌曲搜索入口） */
  function renderSongAsks() {
    var host = $("songAsks");
    host.innerHTML = "";
    D.quickSongs.forEach(function (t) {
      var b = document.createElement("button");
      b.textContent = t;
      b.className = "ask-song";
      b.onclick = function () { $("searchInput").value = t; search(t); };
      host.appendChild(b);
    });
  }

  function renderStrip() {
    var host = $("chartStrip");
    host.innerHTML = "";
    allCharts().forEach(function (c) {
      var real = realChart(c.id);
      var top = (real && real.entries[0]) ? (real.entries[0].title + " · " + real.entries[0].artist) : "—";
      var d = document.createElement("button");
      d.className = "chart-card";
      d.innerHTML = '<div class="cc-name">' + escapeHtml(c.name) + '</div>' +
        '<div class="cc-top">' + escapeHtml(c.freq) + '<br>' + escapeHtml(top) + '</div>' +
        '<div class="cc-tag">' + escapeHtml(c.tag) + '</div>';
      d.onclick = function () { openChart(c.id); };
      host.appendChild(d);
    });
  }

  function renderRecords() {
    var host = $("records");
    host.innerHTML = "";
    D.records.forEach(function (r) {
      var s = r.songId ? songById(r.songId) : null;
      var d = document.createElement("div");
      d.className = "record";
      d.appendChild(coverBox(s, "record-cover", r.icon));
      var body = document.createElement("div");
      body.className = "record-body";
      body.innerHTML = '<div class="record-title">' + escapeHtml(r.title) + '</div>' +
        '<div class="record-desc">' + escapeHtml(r.desc) + '</div>';
      d.appendChild(body);
      if (r.badge && window.MDT) {
        var bd = document.createElement("span");
        bd.className = "record-badge";
        bd.appendChild(MDT.badge(r.badge, 26));
        d.appendChild(bd);
      }
      var val = document.createElement("div");
      val.className = "record-val";
      val.textContent = r.val;
      d.appendChild(val);
      if (s) {
        d.style.cursor = "pointer";
      d.onclick = function () { openTrack(trackFromFeatured(s)); };
      }
      host.appendChild(d);
    });
  }

  /* 运行时优先读取抓取脚本产出的 hot.json；取不到则用内置快照 */
  function loadHot() {
    if (typeof fetch !== "function") return;
    fetch("hot.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.fetchedAt) {
          hotData = j;
          if (state.view === "track") renderTrack();
        }
      })
      .catch(function () {});
  }

  /* 热点来源行：只在歌曲内页的 AI 解读里出现 */
  function hotSourceLine(hasHot) {
    if (!hasHot) return "";
    var h = hotData || {};
    var names = (h.sources || []).map(function (s) { return s.name; }).join(" / ");
    var hit = (h.items || []).length;
    return "外部热点来源：" + (names || "—") + " · 抓取于 " + (h.fetchedAt || "—") +
      " · 本轮命中 " + hit + " 条 · 不计入榜单数据";
  }

  function search(q) {
    q = (q || "").trim();
    if (!q) return;
    var i, j;
    /* 1. 真实榜单里的作品（先精确匹配，再包含匹配） */
    for (i = 0; i < REAL.length; i++) {
      var c = REAL[i];
      for (j = 0; j < c.entries.length; j++) {
        if (c.entries[j].title === q) { openTrack(trackFromEntry(c.entries[j], c.id)); return; }
      }
    }
    for (i = 0; i < REAL.length; i++) {
      var c2 = REAL[i];
      for (j = 0; j < c2.entries.length; j++) {
        if (c2.entries[j].title.indexOf(q) >= 0) { openTrack(trackFromEntry(c2.entries[j], c2.id)); return; }
      }
    }
    /* 2. 演示曲目 */
    for (i = 0; i < D.songs.length; i++) {
      if (q.indexOf(D.songs[i].title) >= 0) { openTrack(trackFromFeatured(D.songs[i])); return; }
    }
    /* 3. 歌手 → 歌手页（与搜歌不是同一条路径） */
    var names = artistNames();
    for (i = 0; i < names.length; i++) {
      if (q.indexOf(names[i]) >= 0 || names[i].indexOf(q) >= 0) { openArtist(names[i]); return; }
    }
    for (i = 0; i < REAL.length; i++) {
      var c3 = REAL[i];
      for (j = 0; j < c3.entries.length; j++) {
        if (c3.entries[j].artist.indexOf(q) >= 0) { openArtist(c3.entries[j].artist); return; }
      }
    }
    askAI(q);
  }

  /* ---------- 轨迹页 ---------- */
  /* ---------- 榜单页 ---------- */
  function openChart(chartId) {
    if (state.view !== "chart") state.stack.push(state.view);
    state.chartId = chartId;
    go("chart");
  }

  function renderChartList() {
    var id = state.chartId;
    var meta = chartMetaById(id);
    var real = realChart(id);
    var demoEntries = null;

    /* 演示榜（如 Melon）没有真实数据，用演示曲目兜底 */
    if (!real) {
      demoEntries = D.songs.filter(function (s) { return s.chart === id; })
        .map(function (s) { return { rank: s.rank, prevRank: s.prevRank, weeks: s.weeks, hot: null,
          title: s.title, artist: s.artist, cover: coverPath(s), _featured: s }; });
      demoEntries.sort(function (a, b) { return a.rank - b.rank; });
    }
    var entries = real ? real.entries : demoEntries;

    $("chartName").textContent = meta.name;
    var bits = [];
    bits.push(meta.freq);
    bits.push("单位「" + meta.unit + "」");
    if (real) bits.push("共 " + real.total + " 首");
    bits.push("取数 " + meta.date);
    $("chartMeta").textContent = bits.join(" · ");

    var host = $("chartList");
    host.innerHTML = "";
    (entries || []).forEach(function (e) {
      var t = e._featured ? trackFromFeatured(e._featured) : trackFromEntry(e, id);
      var row = document.createElement("button");
      row.className = "entry-row";

      var rk = document.createElement("span");
      rk.className = "entry-rank";
      rk.textContent = e.rank;
      row.appendChild(rk);

      row.appendChild(coverBox(t.cover, "entry-cover", "♪"));

      var body = document.createElement("span");
      body.className = "entry-body";
      var sub = [];
      if (e.weeks != null) sub.push("在榜 " + e.weeks + " " + meta.unit);
      if (e.prevRank != null && e.prevRank !== e.rank) {
        sub.push(e.prevRank > e.rank ? "↑" + (e.prevRank - e.rank) : "↓" + (e.rank - e.prevRank));
      }
      if (e.hot != null) sub.push("热度 " + Math.round(e.hot).toLocaleString());
      body.innerHTML = '<span class="entry-title">' + escapeHtml(e.title) + '</span>' +
        '<span class="entry-sub">' + escapeHtml(e.artist) + (sub.length ? " · " + escapeHtml(sub.join(" · ")) : "") + '</span>';
      row.appendChild(body);

      if (t.trajectory) {
        var sp = document.createElement("span");
        sp.className = "entry-spark";
        sp.id = "spark-" + e.rank;
        row.appendChild(sp);
      }
      row.onclick = function () { openTrack(t); };
      host.appendChild(row);
    });

    /* 缩略轨迹：仅对有轨迹的作品绘制 */
    (entries || []).forEach(function (e) {
      var t = e._featured ? trackFromFeatured(e._featured) : trackFromEntry(e, id);
      var sp = $("spark-" + e.rank);
      if (sp && t.trajectory) C.runChart(sp, t.trajectory, { mini: true });
    });

    $("chartSource").textContent = real
      ? "数据来源：平台公开榜单接口 · 取数 " + REAL_FETCHED_AT + " · 名次与在榜期数为真实数据 · 榜单共 " + real.total +
        " 首 · 缩略走势为模拟生成（公开接口不提供历史回溯），仅用于演示"
      : D.sourceNote;
  }

  /* ---------- 轨迹页 ---------- */
  function slice(traj, win) {
    if (win === "all") return traj;
    var n = parseInt(win, 10);
    return traj.slice(Math.max(0, traj.length - n));
  }

  function openTrack(track) {
    if (state.view !== "track") state.stack.push(state.view);
    var changed = !state.track || state.track.key !== track.key;
    state.track = track;
    if (changed) {
      var box = $("trackAiAnswer");
      if (box) { box.hidden = true; box.innerHTML = ""; }
      var inp = $("trackAiInput");
      if (inp) inp.value = "";
    }
    go("track");
  }

  /* ---------- 歌手页 ---------- */
  function artistNames() {
    var seen = {}, out = [];
    D.songs.forEach(function (s) {
      if (!seen[s.artist]) { seen[s.artist] = 1; out.push(s.artist); }
    });
    return out;
  }
  function regionOf(name) {
    for (var i = 0; i < D.compareArtists.length; i++) {
      if (D.compareArtists[i].name === name) return D.compareArtists[i].region;
    }
    return "华语/内地";
  }
  function songsOf(name) {
    return D.songs.filter(function (s) { return s.artist === name; });
  }

  function openArtist(name) {
    if (state.view !== "artist") state.stack.push(state.view);
    state.artist = name;
    go("artist");
  }

  function renderArtist() {
    var name = state.artist;
    if (!name) return;
    var tracks = [], seen = {};
    /* 演示曲目优先（它们有轨迹） */
    D.songs.forEach(function (s) {
      if (s.artist === name && !seen[s.title]) { seen[s.title] = 1; tracks.push(trackFromFeatured(s)); }
    });
    /* 真实榜单里的该歌手作品 */
    REAL.forEach(function (c) {
      c.entries.forEach(function (e) {
        if (e.artist.indexOf(name) >= 0 && !seen[e.title]) { seen[e.title] = 1; tracks.push(trackFromEntry(e, c.id)); }
      });
    });
    if (!tracks.length) return;

    var region = regionOf(name);
    /* 主场榜 = 该歌手出现次数最多的榜 */
    var count = {}, homeChart = tracks[0].chartId, maxN = 0;
    tracks.forEach(function (t) { count[t.chartId] = (count[t.chartId] || 0) + 1; });
    Object.keys(count).forEach(function (k) { if (count[k] > maxN) { maxN = count[k]; homeChart = k; } });
    var meta = chartMetaById(homeChart);

    /* 歌手页头像用歌手本人/团体照，而不是专辑封面 */
    coverInto($("artistAvatar"), artistPhoto(name), "artist-cover", name.slice(0, 1).toUpperCase());
    $("artistName").textContent = name;
    $("artistSub").textContent = region + " · 主场榜 " + meta.name + "（" + meta.freq + "）";

    var best = null, bestTrack = null, withTraj = 0;
    tracks.forEach(function (t) {
      if (t.rank != null && (best === null || t.rank < best)) { best = t.rank; bestTrack = t; }
      if (t.trajectory) withTraj++;
    });
    function stat(v, label) {
      return '<div class="pstat"><div class="p-val">' + v + '</div><div class="p-label">' + label + '</div></div>';
    }
    $("artistStats").innerHTML =
      stat(tracks.length, "在榜作品") +
      stat(best == null ? "—" : best, "最好名次") +
      stat(Object.keys(count).length, "覆盖榜单");

    var host = $("artistSongs");
    host.innerHTML = "";
    var shown = tracks.slice(0, 20);
    shown.forEach(function (t) {
      var row = document.createElement("button");
      row.className = "song-row";
      row.appendChild(coverBox(t.cover, "list-cover", "♪"));
      var mini = document.createElement("span");
      mini.className = "fav-mini";
      mini.id = "amini-" + miniKey(t.key);
      row.appendChild(mini);
      var body = document.createElement("span");
      body.className = "fav-body";
      var desc = "当前第 " + t.rank + " 名";
      if (t.trajectory) {
        var i = analyze(t.trajectory);
        if (i.peak != null) desc += " · 峰值第 " + i.peak + " 名";
      }
      if (t.weeks != null) desc += " · 在榜 " + t.weeks + " " + chartMetaById(t.chartId).unit;
      body.innerHTML =
        '<span class="fav-title">《' + escapeHtml(t.title) + '》</span>' +
        '<span class="fav-desc">' + escapeHtml(desc) + '</span>';
      row.appendChild(body);
      var arrow = document.createElement("span");
      arrow.className = "song-arrow";
      arrow.innerHTML = "&#8250;";
      row.appendChild(arrow);
      row.onclick = function () { openTrack(t); };
      host.appendChild(row);
    });
    shown.forEach(function (t) {
      if (!t.trajectory) return;
      var mini = $("amini-" + miniKey(t.key));
      if (mini) C.runChart(mini, t.trajectory, { mini: true });
    });

    var points = [];
    points.push({ tag: "fact", text: "在" + meta.name + "有 " + maxN + " 首作品在榜；当前共 " + tracks.length + " 首作品、覆盖 " + Object.keys(count).length + " 个榜单。" });
    if (bestTrack) points.push({ tag: "fact", text: "最好名次第 " + best + " 名，来自《" + bestTrack.title + "》（" + chartMetaById(bestTrack.chartId).name + "）。" });
    points.push({ tag: "fact", text: "其中 " + withTraj + " 首有可展示的演示轨迹，其余仅有当期名次。" });
    points.push({ tag: "note", text: "主场榜按歌手的语种与地区自动匹配（" + region + " → " + meta.name + "）。" });
    points.push({ tag: "note", text: "口径提醒：跨榜单的名次不可直接比较，横向对比请使用相对表现（排名百分位 / 在榜占比）。" });

    $("artistVerdict").textContent = name + " · " + region + " · 当前 " + tracks.length + " 首在榜";
    var ul = $("artistAiList");
    ul.innerHTML = "";
    var LBL = { fact: "事实", hot: "热点", note: "解读" };
    points.forEach(function (p) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="li-tag ' + p.tag + '">' + (LBL[p.tag] || "解读") +
        '</span><span>' + escapeHtml(p.text) + '</span>';
      ul.appendChild(li);
    });
    $("artistSource").textContent = REAL.length
      ? "数据来源：平台公开榜单接口 · 取数 " + REAL_FETCHED_AT + " · 当期名次为真实数据 · 带轨迹的为演示轨迹"
      : D.sourceNote;
  }

  function trendNote(traj) {
    var pts = traj.filter(function (v) { return v != null; });
    if (pts.length < 4) return null;
    var last3 = pts.slice(-3);
    var prev3 = pts.slice(-6, -3);
    if (!prev3.length) return null;
    var avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var now = avg(last3), before = avg(prev3);
    var delta = (before - now) / before;
    var f = function (x) { return Math.round(x); };
    if (Math.abs(delta) < 0.08) return "近三期平均第 " + f(now) + " 名，走势平稳，基本锁定在同一区间。";
    if (delta > 0) return "近三期平均第 " + f(now) + " 名，此前三期平均第 " + f(before) + " 名，整体在往上走。";
    return "近三期平均第 " + f(now) + " 名，此前三期平均第 " + f(before) + " 名，有所回落。";
  }

  function buildAiPoints(track, info, traj) {
    var out = [];
    var meta = chartMetaById(track.chartId);
    if (info.debut != null) {
      out.push({ tag: "fact", text: "以第 " + info.debut + " 名进榜，峰值第 " + info.peak + " 名。" });
    }
    out.push({ tag: "fact", text: "当前" + meta.name + "第 " + track.rank + " 名，演示轨迹累计在榜 " + info.weeks + " " + meta.unit + "。" });
    if (info.exits.length || info.reentries.length) {
      out.push({
        tag: "fact",
        text: "期间出榜 " + info.exits.length + " 次、回榜 " + info.reentries.length + " 次" +
          (info.reentries.length ? "，回榜最好成绩第 " + Math.min.apply(null, info.reentries.map(function (r) { return r.v; })) + " 名。" : "。")
      });
    }
    var recent = traj.slice(-5).map(function (v) { return C.fmtRank(v); }).join(" → ");
    out.push({ tag: "fact", text: "最近五期名次：" + recent + "。" });

    var hots = (D.hotEvents && track.featuredId && D.hotEvents[track.featuredId]) || [];
    hots.forEach(function (h) {
      out.push({ tag: "hot", text: h.date + " · " + h.text + "（来源：" + h.source + "）" });
    });

    var tn = trendNote(traj);
    if (tn) out.push({ tag: "note", text: tn });
    if (hots.length && tn && tn.indexOf("往上走") >= 0) {
      out.push({ tag: "note", text: "名次回升的时间点与上述外部热点接近，但时间接近不等于因果，仅供参考。" });
    }
    if (info.peak != null && info.peak <= 10) {
      out.push({ tag: "note", text: "峰值进入该榜前 10 名，属于榜单头部区间；这类位置的停留往往依赖持续的收听与收藏。" });
    } else {
      out.push({ tag: "note", text: "峰值尚未进入前 10，走势更接近长尾型：上榜周期长，但缺乏短时爆发。" });
    }
    out.push({
      tag: "note",
      text: track.chartId === "hot" || track.chartId === "soar"
        ? "口径提醒：仅统计站内行为，不代表全平台。"
        : "口径提醒：" + meta.name + "为外部榜单，统计口径与站内榜不同，两者不可直接比较。"
    });
    out.push({
      tag: "note",
      text: track.trajectoryIsSimulated
        ? "本条走势为模拟生成（公开接口不提供历史回溯），末值锚定为真实当前名次，仅用于展示产品形态；真实历史轨迹需平台归档。"
        : "本条轨迹为演示数据：历史归档不在公开接口范围内。"
    });
    return out;
  }

  /* 没有轨迹时（真实榜单作品）：只陈述当期真实数据，并说明为什么没有轨迹 */
  function buildCurrentPoints(track) {
    var meta = chartMetaById(track.chartId);
    var out = [];
    out.push({ tag: "fact", text: "当前" + meta.name + "第 " + track.rank + " 名（来自公开榜单接口，取数 " + meta.date + "）。" });
    if (track.prevRank != null && track.prevRank !== track.rank) {
      var d = track.prevRank - track.rank;
      out.push({ tag: "fact", text: "上期第 " + track.prevRank + " 名，本期" + (d > 0 ? "上升 " + d + " 位" : "下降 " + (-d) + " 位") + "。" });
    }
    if (track.weeks != null) out.push({ tag: "fact", text: "累计在榜 " + track.weeks + " " + meta.unit + "。" });
    if (track.hot != null) out.push({ tag: "fact", text: "该榜以热度值口径统计，当前热度 " + Math.round(track.hot).toLocaleString() + "。" });
    out.push({ tag: "note", text: "公开接口只提供当期名次，不提供历史回溯，因此这里看不到完整轨迹。完整轨迹需要平台的榜单归档——这正是本产品要接入的数据。" });
    return out;
  }

  function renderTrack() {
    var t = state.track;
    if (!t) return;
    var meta = chartMetaById(t.chartId);
    var hasTraj = !!t.trajectory;
    var traj = hasTraj ? slice(t.trajectory, $("trackWindowSel").value) : null;
    var info = hasTraj ? analyze(traj) : null;

    coverInto($("trackCover"), t.cover, "track-cover", "♪");
    $("trackTitle").textContent = "《" + t.title + "》";
    $("trackSub").textContent = t.artist + " · " + meta.name + " · 取数 " + meta.date;
    var tu = $("trackUnit");
    tu.textContent = "单位「" + meta.unit + "」· " + meta.freq + (t.trajectoryIsSimulated ? " · 模拟走势" : "");
    tu.classList.toggle("warn-note", !!t.trajectoryIsSimulated);
    $("trackChartSel").value = t.chartId;

    if (hasTraj) {
      C.runChart($("trackChart"), traj, {});
      $("trackSeq").textContent = traj.map(function (v) { return C.fmtRank(v); }).join(" - ");
    } else {
      $("trackChart").innerHTML =
        '<div class="empty" style="margin:4px 0 2px">' +
          '<div class="empty-illus" id="emptyIllusTrack"></div>' +
          '<div class="empty-title">这首歌的完整轨迹暂未接入</div>' +
          '<div class="empty-desc">公开榜单接口只提供当期名次，不提供历史回溯。' +
          '<br>完整轨迹需要平台的榜单归档——这正是本产品要接入的数据。</div>' +
        '</div>';
      if (window.MDT) MDT.putIllus($("emptyIllusTrack"), "noData", 140);
      $("trackSeq").textContent = "";
    }
    if ($("trackWindowRow")) $("trackWindowRow").style.display = hasTraj ? "" : "none";

    function metric(v, label) {
      return '<div class="metric"><div class="m-val">' + (v == null ? "—" : v) +
        '</div><div class="m-label">' + label + '</div></div>';
    }
    $("trackMetrics").innerHTML = hasTraj
      ? metric(info.debut, "空降位") + metric(info.peak, "峰值") +
        metric(info.weeks, "在榜" + meta.unit + "数") + metric(info.reentries.length, "回榜次数")
      : metric(t.rank, "当前名次") +
        metric(t.prevRank == null ? "—" : t.prevRank, "上期名次") +
        metric(t.weeks == null ? "—" : t.weeks, "累计在榜（" + meta.unit + "）") +
        metric(t.hot == null ? "—" : Math.round(t.hot).toLocaleString(), "热度值");

    /* 模拟走势时，指标卡也要说明来源，否则会被当成真实数据读 */
    var mn = $("metricNote");
    if (mn) {
      if (t.trajectoryIsSimulated) {
        mn.hidden = false;
        mn.textContent = "空降位 / 峰值 / 在榜期数由模拟走势推算（末值锚定为真实当前名次），非真实历史数据。";
      } else {
        mn.hidden = true;
        mn.textContent = "";
      }
    }

    var fav = isFav(t.key);
    $("favBtn").setAttribute("aria-pressed", fav ? "true" : "false");
    if (window.MDT) MDT.put($("favIcon"), fav ? "starFill" : "star", 16);
    $("favText").textContent = fav ? "已收藏" : "收藏";

    var points = hasTraj ? buildAiPoints(t, info, traj) : buildCurrentPoints(t);
    $("trackVerdict").textContent = hasTraj
      ? "《" + t.title + "》" +
        (info.debut === 1 ? "空降冠军，" : (info.debut != null && info.debut <= 3 ? "以高位进榜，" : "")) +
        "当前第 " + t.rank + " 名，峰值第 " + info.peak + " 名。"
      : "《" + t.title + "》当前在" + meta.name + "第 " + t.rank + " 名。";
    $("aiMeta").textContent = hasTraj ? "由榜单数据 + AI 生成" : "基于当期真实数据";
    var ul = $("trackAiList");
    ul.innerHTML = "";
    var LBL = { fact: "事实", hot: "热点", note: "解读" };
    points.forEach(function (p) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="li-tag ' + p.tag + '">' + (LBL[p.tag] || "解读") +
        '</span><span>' + escapeHtml(p.text) + '</span>';
      ul.appendChild(li);
    });
    $("trackHotSrc").textContent = hotSourceLine(points.some(function (p) { return p.tag === "hot"; }));
    $("trackSource").textContent = hasTraj
      ? D.sourceNote
      : "数据来源：平台公开榜单接口 · 取数 " + REAL_FETCHED_AT + " · 当期名次与在榜期数为真实数据 · 历史轨迹需平台归档";
  }

  /* ---------- 对比页 ---------- */
  function fillSelect(sel, idx) {
    sel.innerHTML = "";
    D.compareArtists.forEach(function (a, i) {
      var o = document.createElement("option");
      o.value = i;
      o.textContent = a.name + " · " + a.region;
      if (i === idx) o.selected = true;
      sel.appendChild(o);
    });
  }

  function renderWeights() {
    var host = $("weights");
    host.innerHTML = "";
    C.DIM_KEYS.forEach(function (dk) {
      var wrap = document.createElement("div");
      wrap.className = "weight-item";
      wrap.innerHTML = '<div class="w-head"><span>' + dk.label + '</span><span>' +
        state.weights[dk.k].toFixed(1) + '</span></div>';
      var r = document.createElement("input");
      r.type = "range"; r.min = "0"; r.max = "2"; r.step = "0.1";
      r.value = state.weights[dk.k];
      r.setAttribute("aria-label", dk.label + "权重");
      r.oninput = function () {
        state.weights[dk.k] = parseFloat(r.value);
        wrap.querySelector(".w-head span:last-child").textContent = state.weights[dk.k].toFixed(1);
        syncPresetState();
        drawCompare();
      };
      wrap.appendChild(r);
      host.appendChild(wrap);
    });
  }

  function isNA(v) { return !v || v === "暂无数据" || v === "—"; }

  function renderUnion(a, b) {
    var host = $("unionList");
    host.innerHTML = "";
    D.unionCharts.forEach(function (name) {
      var va = a.union[name], vb = b.union[name];
      var row = document.createElement("div");
      row.className = "union-row";
      row.innerHTML = '<span class="u-name">' + name + '</span><span>' +
        side(a.name, va) + ' <span class="u-sep">·</span> ' + side(b.name, vb) + '</span>';
      host.appendChild(row);
    });
    function side(name, v) {
      return '<span class="u-owner">' + name + '</span> <span class="u-val' +
        (isNA(v) ? " na" : "") + '">' + v + '</span>';
    }
  }

  function drawCompare() {
    var a = D.compareArtists[state.cmpA], b = D.compareArtists[state.cmpB];
    C.radar($("radarWrap"), a, b, state.weights);
    renderLegend(a, b);
    renderVerdict(a, b);
    renderUnion(a, b);
    syncPresetState();
  }

  /* 雷达图没有图例等于不可读，必须说明哪块颜色是谁 */
  function renderLegend(a, b) {
    var host = $("radarLegend");
    host.innerHTML = "";
    [[a, "sw-a"], [b, "sw-b"]].forEach(function (pair) {
      var el = document.createElement("span");
      el.className = "lg";
      var photo = artistPhoto(pair[0].name);
      if (photo) {
        var img = document.createElement("img");
        img.className = "lg-avatar";
        img.alt = "";
        img.src = photo;
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        el.appendChild(img);
      } else {
        var sw = document.createElement("i");
        sw.className = "sw " + pair[1];
        el.appendChild(sw);
      }
      var txt = document.createElement("span");
      txt.textContent = pair[0].name;
      el.appendChild(txt);
      host.appendChild(el);
    });
  }

  /* 把抽象的多边形翻译成一句人话，权重一变结论就变 */
  function renderVerdict(a, b) {
    var leadA = [], leadB = [];
    C.DIM_KEYS.forEach(function (dk) {
      var va = (a.dims[dk.k] || 0) * state.weights[dk.k];
      var vb = (b.dims[dk.k] || 0) * state.weights[dk.k];
      if (Math.abs(va - vb) < 0.5) return;
      (va > vb ? leadA : leadB).push(dk.label);
    });
    var txt;
    if (!leadA.length && !leadB.length) {
      txt = "当前权重下，两位在各维度上势均力敌。";
    } else {
      txt = "当前权重下：" + a.name + " 在 " + leadA.length + " 个维度领先" +
        (leadA.length ? "（" + leadA.join("、") + "）" : "") + "；" +
        b.name + " 在 " + leadB.length + " 个维度领先" +
        (leadB.length ? "（" + leadB.join("、") + "）" : "") + "。";
    }
    $("radarVerdict").textContent = txt;
  }

  /* 预设权重：比拖六个滑块更直观地展示"权重会改变结论" */
  var PRESETS = [
    { id: "even", label: "均衡", w: { total: 1, peak: 1, duration: 1, stability: 1, burst: 1, coverage: 1 } },
    { id: "peak", label: "只看峰值", w: { total: 0.4, peak: 2, duration: 0.4, stability: 0.4, burst: 0.6, coverage: 0.4 } },
    { id: "long", label: "只看常青", w: { total: 0.6, peak: 0.4, duration: 2, stability: 1.6, burst: 0.4, coverage: 0.6 } },
    { id: "wide", label: "只看覆盖", w: { total: 0.6, peak: 0.4, duration: 0.6, stability: 0.4, burst: 1.4, coverage: 2 } }
  ];

  function renderPresets() {
    var host = $("presets");
    host.innerHTML = "";
    PRESETS.forEach(function (p) {
      var b = document.createElement("button");
      b.textContent = p.label;
      b.dataset.preset = p.id;
      b.onclick = function () {
        state.weights = {
          total: p.w.total, peak: p.w.peak, duration: p.w.duration,
          stability: p.w.stability, burst: p.w.burst, coverage: p.w.coverage
        };
        renderWeights();
        drawCompare();
      };
      host.appendChild(b);
    });
    syncPresetState();
  }

  function syncPresetState() {
    var host = $("presets");
    if (!host) return;
    var btns = host.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      var p = null;
      for (var j = 0; j < PRESETS.length; j++) {
        if (PRESETS[j].id === btns[i].dataset.preset) { p = PRESETS[j]; break; }
      }
      var same = false;
      if (p) {
        same = C.DIM_KEYS.every(function (dk) {
          return Math.abs(p.w[dk.k] - state.weights[dk.k]) < 0.001;
        });
      }
      btns[i].classList.toggle("on", same);
    }
  }

  function renderCompare() {
    fillSelect($("cmpA"), state.cmpA);
    fillSelect($("cmpB"), state.cmpB);
    renderPresets();
    renderWeights();
    drawCompare();
    $("cmpSource").textContent = D.sourceNote;
  }

  /* ---------- 个人主页 ---------- */
  function renderProfile() {
    var favs = loadFavs();
    $("profileStats").innerHTML =
      stat(favs.length, "收藏走势") +
      stat(3, "关注歌手") +
      stat(favs.length ? 12 : 0, "本周查看");
    function stat(v, label) {
      return '<div class="pstat"><div class="p-val">' + v + '</div><div class="p-label">' + label + '</div></div>';
    }

    var host = $("favList");
    host.innerHTML = "";
    if (!favs.length) {
      host.innerHTML =
        '<div class="empty">' +
        '<div class="empty-illus" id="emptyIllusFav"></div>' +
        '<div class="empty-title">还没有收藏的走势</div>' +
        '<div class="empty-desc">在任意歌曲的轨迹页点「收藏」，<br>就能把这条走势留在这里随时回看。</div>' +
        '<button class="empty-cta" id="emptyCta">去看看数据现场</button>' +
        '</div>';
      if (window.MDT) MDT.putIllus($("emptyIllusFav"), "emptyFav", 150);
      $("emptyCta").onclick = function () { go("home"); };
      return;
    }

    favs.forEach(function (key) {
      var t = resolveKey(key);
      if (!t) return;
      var info = t.trajectory ? analyze(t.trajectory) : null;
      var unit = t.unit;
      var item = document.createElement("div");
      item.className = "fav-item";
      item.appendChild(coverBox(t.cover, "list-cover", "♪"));
      var mini = document.createElement("div");
      mini.className = "fav-mini";
      mini.id = "mini-" + miniKey(t.key);
      item.appendChild(mini);
      var body = document.createElement("div");
      body.className = "fav-body";
      var desc = "当前第 " + t.rank + " 名";
      if (info && info.peak != null) desc += " · 峰值第 " + info.peak + " 名";
      if (t.weeks != null) desc += " · 在榜 " + t.weeks + " " + unit;
      body.innerHTML =
        '<div class="fav-title">《' + escapeHtml(t.title) + '》· ' + escapeHtml(t.artist) + '</div>' +
        '<div class="fav-desc">' + escapeHtml(desc) + '</div>';
      body.style.cursor = "pointer";
      body.onclick = function () { openTrack(t); };
      item.appendChild(body);
      var del = document.createElement("button");
      del.className = "fav-del";
      del.dataset.id = key;
      del.textContent = "删除";
      item.appendChild(del);
      host.appendChild(item);
    });
    favs.forEach(function (key) {
      var t = resolveKey(key);
      if (!t || !t.trajectory) return;
      var mini = $("mini-" + miniKey(t.key));
      if (mini) C.runChart(mini, t.trajectory, { mini: true });
    });

    host.querySelectorAll(".fav-del").forEach(function (btn) {
      btn.onclick = function () {
        var sid = btn.dataset.id;
        removeFav(sid);
        C.toast("已取消收藏");
        renderProfile();
      };
    });
  }

  /* ---------- 初始化 ---------- */
  /* ---------- 分享卡 ---------- */
  var shareCanvas = null;

  function buildTrackShareData(t) {
    var meta = chartMetaById(t.chartId);
    var info = t.trajectory ? analyze(t.trajectory) : null;
    return {
      type: "track",
      data: {
        title: t.title, artist: t.artist, cover: t.cover,
        chartName: meta.name, unit: meta.unit,
        rank: t.rank,
        peak: info ? info.peak : null,
        debut: info ? info.debut : null,
        weeks: t.weeks != null ? t.weeks : (info ? info.weeks : null),
        trajectory: t.trajectory || [],
        verdict: $("trackVerdict").textContent,
        source: meta.real ? "数据来源：平台公开榜单接口" : "数据来源：投稿演示数据",
        fetchedAt: meta.date + (REAL_FETCHED_AT ? "（抓取于 " + REAL_FETCHED_AT + "）" : ""),
        scopeNote: "该榜单位「" + meta.unit + "」，更新频率 " + meta.freq,
        demoNote: t.trajectoryIsDemo
          ? "轨迹为演示数据：历史归档不在公开接口范围内"
          : "该作品暂无轨迹数据，仅展示当期名次"
      }
    };
  }

  function buildCompareShareData() {
    var a = D.compareArtists[state.cmpA], b = D.compareArtists[state.cmpB];
    var dims = C.DIM_KEYS.map(function (dk) {
      return { label: dk.label, a: a.dims[dk.k] || 0, b: b.dims[dk.k] || 0 };
    });
    return {
      type: "compare",
      data: {
        a: { name: a.name }, b: { name: b.name }, dims: dims,
        verdict: $("radarVerdict").textContent,
        weights: C.DIM_KEYS.map(function (dk) {
          return dk.label + " ×" + state.weights[dk.k].toFixed(1);
        }).join(" · "),
        source: "数据来源：平台公开榜单口径",
        fetchedAt: REAL_FETCHED_AT || D.fetchDate,
        scopeNote: "跨榜单名次不可直接比较，此处为归一化后的相对表现",
        demoNote: "维度数值为演示数据；权重由用户自行设定"
      }
    };
  }

  function showShare(payload) {
    if (!window.ShareCard) { C.toast("分享卡模块未加载"); return; }
    window.ShareCard.render(payload).then(function (canvas) {
      shareCanvas = canvas;
      $("sharePreviewImg").src = window.ShareCard.toDataURL(canvas);
      $("shareModal").hidden = false;
    }).catch(function () { C.toast("生成失败，请重试"); });
  }

  function init() {
    renderHero(); renderAiAsks(); renderSongAsks(); renderTrackAsks();
    renderStrip(); renderRecords(); renderCompare();
    loadHot();

    /* 图标集：替换掉原来的 Unicode 字符 */
    if (window.MDT) {
      MDT.put($("backIcon"), "back", 20);
      MDT.put($("icoSongSearch"), "search", 16);
      MDT.put($("icoAsk"), "ask", 16);
      MDT.put($("icoAskTrack"), "ask", 16);
      MDT.put($("icoTabHome"), "chart", 18);
      MDT.put($("icoTabCompare"), "compare", 18);
      MDT.put($("icoTabProfile"), "artist", 18);
    }
    $("homeSource").textContent = D.sourceNote;

    allCharts().forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.name + " · " + c.freq;
      if (c.id === "hot") o.selected = true;
      $("trackChartSel").appendChild(o);
    });

    document.querySelectorAll(".tab").forEach(function (t) {
      t.onclick = function () { state.stack = []; go(t.dataset.view); };
    });
    $("backBtn").onclick = function () { go(state.stack.pop() || "home"); };

    $("hero").addEventListener("click", function (e) {
      if (e.target.classList.contains("dot")) return;
      var it = heroItems()[state.heroIdx];
      if (!it) return;
      var s = it.songId ? songById(it.songId) : null;
      if (s) openTrack(trackFromFeatured(s));
    });
    var sx = null;
    $("hero").addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; });
    $("hero").addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx;
      var n = heroItems().length;
      if (Math.abs(dx) > 40) { state.heroIdx = (state.heroIdx + (dx < 0 ? 1 : n - 1)) % n; renderHero(); }
      sx = null;
    });

    $("timeTabs").addEventListener("click", function (e) {
      if (!e.target.dataset.scope) return;
      this.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("active"); });
      e.target.classList.add("active");
      state.heroScope = e.target.dataset.scope;
      state.heroIdx = 0;
      renderHero();
    });

    $("searchInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") search(e.target.value);
    });
    $("searchInput").addEventListener("input", function () {
      var box = $("aiAnswer");
      if (box) box.hidden = true;
    });
    $("aiInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") askAI(e.target.value);
    });
    $("aiInput").addEventListener("input", function () {
      var box = $("aiAnswer");
      if (box) box.hidden = true;
    });
    $("trackAiInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") askTrack(e.target.value);
    });
    $("trackAiInput").addEventListener("input", function () {
      var box = $("trackAiAnswer");
      if (box) box.hidden = true;
    });
    $("trackWindowSel").onchange = renderTrack;
    $("trackChartSel").onchange = function () { openChart(this.value); };
    $("mergeToggle").onchange = function () { C.toast("已切换口径：合并重录 / 多版本"); };
    $("favBtn").onclick = function () {
      var t = state.track;
      if (!t) return;
      if (isFav(t.key)) { removeFav(t.key); C.toast("已取消收藏"); }
      else { addFav(t.key); C.toast("已收藏，可在「我的」查看"); }
      renderTrack();
    };
    $("toCompareFromTrack").onclick = function () { go("compare"); };
    $("cmpA").onchange = function () {
      state.cmpA = parseInt(this.value, 10);
      if (state.cmpA === state.cmpB) state.cmpB = (state.cmpB + 1) % D.compareArtists.length;
      drawCompare();
    };
    $("cmpB").onchange = function () {
      state.cmpB = parseInt(this.value, 10);
      if (state.cmpB === state.cmpA) state.cmpA = (state.cmpA + 1) % D.compareArtists.length;
      drawCompare();
    };
    $("makeCard").onclick = function () { showShare(buildCompareShareData()); };
    $("shareTrack").onclick = function () {
      if (!state.track) return;
      showShare(buildTrackShareData(state.track));
    };
    $("shareClose").onclick = function () { $("shareModal").hidden = true; };
    $("shareSave").onclick = function () {
      if (!shareCanvas) return;
      window.ShareCard.download(shareCanvas);
      C.toast("已保存到下载目录");
    };
    $("shareModal").addEventListener("click", function (e) {
      if (e.target === this) this.hidden = true;
    });

    window.addEventListener("resize", function () {
      if (state.view === "home") renderHero();
      else if (state.view === "track") renderTrack();
    });

    var h = (location.hash || "").replace("#", "");
    if (h === "profile" || h === "compare") go(h);
    else if (h === "artist") openArtist("aespa");
    else if (h === "chart") openChart("hot");
    else if (h === "track") openTrack(trackFromFeatured(D.songs[0]));
    else go("home");
  }

  /* 出错兜底：避免整页空白 */
  window.addEventListener("error", function () {
    var box = $("aiAnswer");
    if (box) {
      box.hidden = false;
      box.textContent = "页面渲染出错了，请刷新重试。";
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
