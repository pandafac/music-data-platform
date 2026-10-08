/* 分享卡生成器（F1）
 *
 * 纯 Canvas 渲染，不依赖任何第三方库。
 * 数据准确性优先：图上所有数字都来自传入的 payload，不做任何推算。
 *
 * 用法：
 *   const canvas = await ShareCard.render({ type: "track", data: {...} });
 *   ShareCard.download(canvas);
 */
(function () {
  var W = 1080, H = 1920, PAD = 80;
  var FONT = '"PingFang SC","Microsoft YaHei",system-ui,-apple-system,sans-serif';
  var C = {
    bg: "#0B0D10", panel: "#141821", line: "#232833",
    ink: "#EDEFF3", ink2: "#A2A9B4", ink3: "#767E8A",
    accent: "#31C27C", hot: "#5AA9F5", warn: "#F0B429", down: "#F2617A"
  };

  function font(weight, size) { return weight + " " + size + 'px ' + FONT; }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      /* 优先用内联的 data URL：file:// 下直接引用本地图片会污染画布 */
      var url = (window.COVER_DATA && window.COVER_DATA[src]) || src;
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };  // 封面缺失不阻断绘制
      img.src = url;
    });
  }

  function drawCover(ctx, img, x, y, size, radius) {
    ctx.save();
    roundRect(ctx, x, y, size, size, radius);
    ctx.clip();
    if (img) {
      ctx.drawImage(img, x, y, size, size);
    } else {
      ctx.fillStyle = C.panel;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, Math.round(size * 0.4));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♪", x + size / 2, y + size / 2);
    }
    ctx.restore();
  }

  /* 中文换行：按字符宽度累积，最多 maxLines 行，超出加省略号 */
  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    var chars = String(text).split("");
    var lines = [], cur = "";
    for (var i = 0; i < chars.length; i++) {
      var test = cur + chars[i];
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = chars[i];
        if (lines.length === maxLines) break;
      } else {
        cur = test;
      }
    }
    if (lines.length < maxLines && cur) lines.push(cur);
    if (lines.length === maxLines) {
      var last = lines[maxLines - 1];
      while (last.length && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      if (chars.join("").length > lines.join("").length) lines[maxLines - 1] = last + "…";
    }
    lines.forEach(function (ln, i) { ctx.fillText(ln, x, y + i * lineH); });
    return lines.length * lineH;
  }

  function base(ctx) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
  }

  /* 顶部品牌行 */
  function drawBrand(ctx, label) {
    ctx.textAlign = "left";
    ctx.fillStyle = C.accent;
    ctx.font = font(700, 30);
    ctx.fillText("音乐数据台", PAD, 108);
    ctx.fillStyle = C.ink3;
    ctx.font = font(400, 26);
    ctx.textAlign = "right";
    ctx.fillText(label, W - PAD, 108);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, 140);
    ctx.lineTo(W - PAD, 140);
    ctx.stroke();
    ctx.textAlign = "left";
  }

  /* 底部来源区（强制：来源 / 取数时间 / 口径 / 演示标注） */
  function drawSources(ctx, d) {
    var y = H - 300;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y - 34);
    ctx.lineTo(W - PAD, y - 34);
    ctx.stroke();

    var lines = [];
    if (d.source) lines.push(d.source);
    if (d.fetchedAt) lines.push("取数时间：" + d.fetchedAt);
    if (d.scopeNote) lines.push(d.scopeNote);
    if (d.demoNote) lines.push(d.demoNote);

    ctx.font = font(400, 26);
    lines.forEach(function (t) {
      var isWarn = t === d.demoNote;
      ctx.fillStyle = isWarn ? C.warn : C.ink3;
      y += 42;
      wrapText(ctx, t, PAD, y, W - PAD * 2, 38, 2);
    });
  }

  /* 轨迹折线：反向纵轴（第 1 名在上），出榜区间虚线断开 */
  function drawTrajectory(ctx, traj, x, y, w, h) {
    var vals = traj.filter(function (v) { return v != null; });
    if (!vals.length) {
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, 32);
      ctx.textAlign = "center";
      ctx.fillText("暂无轨迹数据", x + w / 2, y + h / 2);
      ctx.textAlign = "left";
      return;
    }
    var maxR = Math.max.apply(null, vals), minR = Math.min.apply(null, vals);
    var top = Math.max(1, minR - 1), bot = maxR + 1, n = traj.length;
    var X = function (i) { return x + (n <= 1 ? 0 : i * w / (n - 1)); };
    var Y = function (v) { return y + (v - top) / (bot - top) * h; };

    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.font = font(400, 24);
    for (var g = 0; g < 3; g++) {
      var rv = Math.round(top + (bot - top) * g / 2);
      ctx.beginPath();
      ctx.moveTo(x, Y(rv));
      ctx.lineTo(x + w, Y(rv));
      ctx.stroke();
      ctx.fillStyle = C.ink3;
      ctx.fillText(String(rv), x - 8 - ctx.measureText(String(rv)).width, Y(rv) + 8);
    }

    var segs = [], cur = [];
    for (var i = 0; i < n; i++) {
      if (traj[i] != null) cur.push(i);
      else if (cur.length) { segs.push(cur); cur = []; }
    }
    if (cur.length) segs.push(cur);

    /* 出榜区间虚线 */
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = "#3A4049";
    for (var e = 0; e < n; e++) {
      if (traj[e] == null && e > 0 && traj[e - 1] != null) {
        var nx = null;
        for (var j = e + 1; j < n; j++) if (traj[j] != null) { nx = j; break; }
        if (nx != null) {
          ctx.beginPath();
          ctx.moveTo(X(e - 1), Y(traj[e - 1]));
          ctx.lineTo(X(nx), Y(traj[nx]));
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    segs.forEach(function (seg) {
      ctx.beginPath();
      seg.forEach(function (idx, i2) {
        if (i2 === 0) ctx.moveTo(X(idx), Y(traj[idx]));
        else ctx.lineTo(X(idx), Y(traj[idx]));
      });
      ctx.stroke();
    });

    /* 峰值点 */
    var pi = traj.indexOf(minR);
    if (pi >= 0) {
      ctx.beginPath();
      ctx.arc(X(pi), Y(minR), 12, 0, Math.PI * 2);
      ctx.fillStyle = C.bg;
      ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }

  /* 关键数字行 */
  function drawMetrics(ctx, items, y) {
    var n = items.length, gap = 24;
    var cw = (W - PAD * 2 - gap * (n - 1)) / n;
    items.forEach(function (m, i) {
      var x = PAD + i * (cw + gap);
      ctx.fillStyle = C.panel;
      roundRect(ctx, x, y, cw, 170, 20);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = font(700, 60);
      ctx.fillText(String(m.value), x + 26, y + 92);
      ctx.fillStyle = C.ink2;
      ctx.font = font(400, 26);
      ctx.fillText(m.label, x + 26, y + 134);
    });
  }

  /* ---------- 三种卡型 ---------- */

  function trackCard(ctx, d, cover) {
    base(ctx);
    drawBrand(ctx, d.chartName || "");

    var y = 220;
    drawCover(ctx, cover, PAD, y, 160, 24);
    ctx.fillStyle = C.ink;
    ctx.font = font(700, 54);
    var titleLines = wrapText(ctx, "《" + d.title + "》", PAD + 190, y + 58, W - PAD * 2 - 190, 66, 2);
    ctx.fillStyle = C.ink2;
    ctx.font = font(400, 34);
    ctx.fillText(d.artist || "", PAD + 190, y + 58 + titleLines + 14);

    ctx.fillStyle = C.accent;
    ctx.font = font(600, 30);
    ctx.fillText((d.chartName || "") + " · 单位「" + (d.unit || "期") + "」", PAD, y + 250);

    drawTrajectory(ctx, d.trajectory || [], PAD + 70, y + 320, W - PAD * 2 - 100, 360);

    /* 轨迹序列：一眼看清每一期 */
    var seqY = y + 730;
    if ((d.trajectory || []).length) {
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, 24);
      ctx.fillText("逐期名次", PAD, seqY);
      ctx.fillStyle = C.ink2;
      ctx.font = font(400, 30);
      var seq = d.trajectory.map(function (v) { return v == null ? "出" : v; }).join(" · ");
      wrapText(ctx, seq, PAD, seqY + 46, W - PAD * 2, 44, 2);
    }

    var metrics = [];
    if (d.debut != null) metrics.push({ value: d.debut, label: "空降位" });
    if (d.peak != null) metrics.push({ value: d.peak, label: "峰值" });
    if (d.weeks != null) metrics.push({ value: d.weeks, label: "在榜" + (d.unit || "期") });
    if (d.rank != null) metrics.push({ value: d.rank, label: "当前名次" });
    drawMetrics(ctx, metrics.slice(0, 4), y + 880);

    if (d.verdict) {
      var iy = y + 1100;
      ctx.fillStyle = C.panel;
      roundRect(ctx, PAD, iy, W - PAD * 2, 176, 20);
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.font = font(600, 26);
      ctx.fillText("一句话", PAD + 30, iy + 48);
      ctx.fillStyle = C.ink;
      ctx.font = font(400, 32);
      wrapText(ctx, d.verdict, PAD + 30, iy + 100, W - PAD * 2 - 60, 46, 2);
    }

    drawSources(ctx, d);
  }

  function compareCard(ctx, d) {
    base(ctx);
    drawBrand(ctx, "数据对比");

    var y = 240;
    /* 图例：静态图必须有，否则分不清哪条是谁 */
    function swatch(x, cy, color) {
      ctx.fillStyle = color;
      roundRect(ctx, x, cy - 13, 26, 26, 7);
      ctx.fill();
    }
    swatch(PAD, y - 18, C.accent);
    ctx.fillStyle = C.ink;
    ctx.font = font(700, 52);
    ctx.fillText(d.a.name, PAD + 42, y);
    var nameW = ctx.measureText(d.a.name).width;
    ctx.fillStyle = C.ink3;
    ctx.font = font(400, 34);
    ctx.fillText("对比", PAD + nameW + 132, y);
    var midX = PAD + nameW + 132 + ctx.measureText("对比").width + 42;
    swatch(midX, y - 18, "#F2617A");
    ctx.fillStyle = C.ink;
    ctx.font = font(700, 52);
    ctx.fillText(d.b.name, midX + 42, y);

    /* 维度条形对比：比雷达更易读 */
    var dims = d.dims || [];
    var by = y + 130, rowH = 128;
    var barX = PAD + 250, barW = W - PAD * 2 - 250;
    dims.forEach(function (dm, i) {
      var ry = by + i * rowH;
      ctx.fillStyle = C.ink2;
      ctx.font = font(400, 30);
      ctx.fillText(dm.label, PAD, ry + 40);

      var va = dm.a, vb = dm.b, max = 100;
      ctx.fillStyle = C.panel;
      roundRect(ctx, barX, ry + 6, barW, 26, 13); ctx.fill();
      roundRect(ctx, barX, ry + 46, barW, 26, 13); ctx.fill();
      ctx.fillStyle = C.accent;
      roundRect(ctx, barX, ry + 6, Math.max(10, barW * va / max), 26, 13); ctx.fill();
      ctx.fillStyle = "#F2617A";
      roundRect(ctx, barX, ry + 46, Math.max(10, barW * vb / max), 26, 13); ctx.fill();
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, 24);
      ctx.textAlign = "right";
      ctx.fillText(String(va), W - PAD, ry + 30);
      ctx.fillText(String(vb), W - PAD, ry + 70);
      ctx.textAlign = "left";
    });

    var vy = by + dims.length * rowH + 30;
    if (d.verdict) {
      ctx.fillStyle = C.panel;
      roundRect(ctx, PAD, vy, W - PAD * 2, 200, 20);
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.font = font(600, 26);
      ctx.fillText("当前权重下的结论", PAD + 30, vy + 52);
      ctx.fillStyle = C.ink;
      ctx.font = font(400, 32);
      wrapText(ctx, d.verdict, PAD + 30, vy + 108, W - PAD * 2 - 60, 46, 2);
    }

    if (d.weights) {
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, 26);
      wrapText(ctx, "权重设置：" + d.weights, PAD, vy + 270, W - PAD * 2, 40, 2);
    }

    drawSources(ctx, d);
  }

  function recordCard(ctx, d, badge) {
    base(ctx);
    drawBrand(ctx, "新纪录");

    var y = 300;
    if (badge) {
      var size = 300;
      ctx.drawImage(badge, (W - size) / 2, y, size, size);
      y += size + 60;
    }

    ctx.textAlign = "center";
    ctx.fillStyle = C.accent;
    ctx.font = font(700, 88);
    ctx.fillText(d.recordName || "新纪录", W / 2, y + 40);

    ctx.fillStyle = C.ink;
    ctx.font = font(700, 120);
    ctx.fillText(String(d.value || ""), W / 2, y + 200);

    ctx.fillStyle = C.ink2;
    ctx.font = font(400, 40);
    ctx.fillText("《" + (d.title || "") + "》· " + (d.artist || ""), W / 2, y + 280);

    if (d.desc) {
      ctx.fillStyle = C.ink3;
      ctx.font = font(400, 32);
      wrapText(ctx, d.desc, PAD, y + 370, W - PAD * 2, 46, 2);
    }
    ctx.textAlign = "left";

    drawSources(ctx, d);
  }

  /* ---------- 对外 API ---------- */
  function draw(payload, withImages) {
    return new Promise(function (resolve) {
      var d = payload.data || {};
      var canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext("2d");

      var coverSrc = withImages ? (d.cover || null) : null;
      var badgeSrc = (withImages && d.badge) ? "badges/" + d.badge + ".png" : null;

      Promise.all([loadImage(coverSrc), loadImage(badgeSrc)]).then(function (imgs) {
        if (payload.type === "compare") compareCard(ctx, d);
        else if (payload.type === "record") recordCard(ctx, d, imgs[1]);
        else trackCard(ctx, d, imgs[0]);
        resolve(canvas);
      });
    });
  }

  /* 先带图渲染；若画布被污染（file:// 下的本地图片）则退回无图版本，保证一定能导出 */
  function render(payload) {
    return draw(payload, true).then(function (canvas) {
      try {
        canvas.toDataURL("image/png");
        return canvas;
      } catch (e) {
        return draw(payload, false);
      }
    });
  }

  function download(canvas) {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    var name = "音乐数据台-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
      "-" + p(d.getHours()) + p(d.getMinutes()) + ".png";
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
    }, "image/png");
    return name;
  }

  function toDataURL(canvas) { return canvas.toDataURL("image/png"); }

  window.ShareCard = { render: render, download: download, toDataURL: toDataURL };
})();
