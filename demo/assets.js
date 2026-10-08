/* 视觉资产（矢量）
 *
 * 为什么用 SVG 而不是生图：
 * 图标与徽章是"扁平线性、单色、透明底、24px 下可辨认"的东西——
 * 这几点矢量强、生图弱（难以保证一致性、透明底与小尺寸可读）。
 *
 * 对外：
 *   MDT.icon(name, size)          → SVGElement（24 网格、1.5 描边、currentColor）
 *   MDT.badge(name, size)         → SVGElement（64 网格圆形徽章）
 *   MDT.illustration(name)        → SVGElement（空状态插画）
 *   MDT.badgeDataURL(name)        → string（给 Canvas 分享卡用）
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(inner, vb, size, cls) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", vb);
    s.setAttribute("width", size);
    s.setAttribute("height", size);
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "1.5");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    if (cls) s.setAttribute("class", cls);
    s.innerHTML = inner;
    return s;
  }

  /* ---------- 图标：24 网格 ---------- */
  var ICONS = {
    back: '<path d="M15 5 8 12l7 7"/><path d="M8 12h10"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    ask: '<path d="M20 12a7 7 0 0 1-7 7H9l-4 3v-5.5A7 7 0 0 1 9 5h4a7 7 0 0 1 7 7Z"/>',
    star: '<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8Z"/>',
    starFill: '<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8Z" fill="currentColor"/>',
    trash: '<path d="M5 7h14"/><path d="M10 7V5h4v2"/><path d="M6 7l1 12h10l1-12"/><path d="M10 11v5M14 11v5"/>',
    up: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    down: '<path d="M7 7l10 10"/><path d="M17 9v8H9"/>',
    exit: '<path d="M5 12h10"/><path d="m12 8 4 4-4 4"/><path d="M18 5v14"/>',
    reentry: '<path d="M19 12H9"/><path d="m12 8-4 4 4 4"/><path d="M6 5v14"/>',
    share: '<path d="M12 16V5"/><path d="m8 9 4-4 4 4"/><path d="M5 15v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/>',
    chart: '<path d="M4 19h16"/><rect x="6" y="11" width="3" height="6"/><rect x="11" y="7" width="3" height="10"/><rect x="16" y="13" width="3" height="4"/>',
    artist: '<circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M9 4v4M15 4v4"/>'
    ,compare: '<path d="M12 4v16"/><rect x="4" y="8" width="5" height="8" rx="1"/><rect x="15" y="6" width="5" height="12" rx="1"/>'
  };

  function icon(name, size) {
    var body = ICONS[name] || ICONS.info;
    return svgEl(body, "0 0 24 24", size || 20, "ico");
  }

  /* ---------- 徽章：64 网格圆形 ---------- */
  function ring(inner) {
    return '<circle cx="32" cy="32" r="27"/>' + inner;
  }
  var BADGES = {
    /* 空降冠军：从上方落下的箭头击中顶线 */
    debutChampion: ring(
      '<path d="M18 20h28"/><path d="M32 52V26"/><path d="m26 32 6-6 6 6"/>'
    ),
    /* 十连冠：横条上并排的五个刻度都停在最高位 */
    tenStreak: ring(
      '<path d="M18 22h28"/><path d="M22 30v10M27.6 30v10M33.2 30v10M38.8 30v10M44.4 30v10"/>'
    ),
    /* 在榜最久：长长的时间轴上一点高亮 */
    longestRun: ring(
      '<path d="M16 38h32"/><circle cx="16" cy="38" r="2.4"/><circle cx="24" cy="38" r="2.4"/><circle cx="32" cy="38" r="2.4"/><circle cx="40" cy="38" r="2.4"/><circle cx="48" cy="38" r="2.4" fill="currentColor"/>'
    ),
    /* 最猛爬升：陡峭上升线穿过三条参考线 */
    biggestClimb: ring(
      '<path d="M18 26h28M18 34h28M18 42h28" opacity=".35"/><path d="M20 46 44 22"/><path d="m37 22h7v7"/>'
    ),
    /* 强回榜：线从右侧出框，又从底部绕回来 */
    strongReentry: ring(
      '<path d="M18 24h16c6 0 6 10 0 10H24"/><path d="M28 30l-4 4 4 4"/><path d="M24 46h20"/>'
    ),
    /* 长青：一条横贯全宽的长波浪线 */
    evergreen: ring(
      '<path d="M16 34c4-8 8 8 12 0s8 8 12 0 6 6 8 2"/>'
    )
  };

  function badge(name, size) {
    var body = BADGES[name] || BADGES.longestRun;
    return svgEl(body, "0 0 64 64", size || 36, "badge");
  }
  function badgeDataURL(name) {
    var body = BADGES[name] || BADGES.longestRun;
    var svg = '<svg xmlns="' + NS + '" viewBox="0 0 64 64" width="512" height="512" fill="none" ' +
      'stroke="#31C27C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- 空状态插画：160×120 ---------- */
  var ILLUS = {
    emptyFav: '<rect x="46" y="34" width="68" height="52" rx="10"/><path d="M60 72c10-14 18 8 28-2s8 4 12-2"/>',
    noData: '<path d="M40 34v56" stroke-dasharray="4 5"/><path d="M40 90h80" stroke-dasharray="4 5"/><path d="M52 78l16-10 12 6" opacity=".3"/>',
    noResult: '<circle cx="72" cy="56" r="18"/><path d="m86 70 12 12"/><circle cx="46" cy="88" r="1.5" fill="currentColor" stroke="none"/><circle cx="58" cy="94" r="1.5" fill="currentColor" stroke="none"/><circle cx="100" cy="90" r="1.5" fill="currentColor" stroke="none"/>'
  };
  function illustration(name, width) {
    var s = svgEl(ILLUS[name] || ILLUS.noData, "0 0 160 120", width || 160, "illus");
    s.setAttribute("height", Math.round((width || 160) * 120 / 160));
    return s;
  }

  /* 把标准图标填进一个宿主元素，替换其中的 Unicode/emoji */
  function put(host, name, size) {
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(icon(name, size));
  }
  function putIllus(host, name, width) {
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(illustration(name, width));
  }

  window.MDT = {
    icon: icon, badge: badge, illustration: illustration,
    badgeDataURL: badgeDataURL, put: put, putIllus: putIllus,
    badgeNames: Object.keys(BADGES)
  };
})();
