/**
 * 把封面内联成 data URL → demo/covers-inline.js
 *
 * 为什么需要：用 file:// 打开页面时，把本地图片画进 canvas 会"污染"画布，
 * toDataURL / toBlob 会抛 SecurityError，分享卡就永远导不出来。
 * 内联成 data: URL 后不再有跨源问题，file:// 下也能正常导出。
 *
 * 用法：node tools/inline-covers.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEMO = path.join(ROOT, "demo");

const referenced = new Set();

const chartsSrc = fs.readFileSync(path.join(DEMO, "charts.js"), "utf8");
const w1 = {};
new Function("window", chartsSrc)(w1);
(w1.CHART_DATA?.charts || []).forEach((c) => (c.entries || []).forEach((e) => { if (e.cover) referenced.add(e.cover); }));

const dataSrc = fs.readFileSync(path.join(DEMO, "data.js"), "utf8");
const w2 = {};
new Function("window", dataSrc)(w2);
(w2.DEMO_DATA?.songs || []).forEach((s) => referenced.add("covers/" + s.id + ".jpg"));

const out = {};
let bytes = 0, missing = 0;

for (const rel of referenced) {
  const file = path.join(DEMO, rel);
  if (!fs.existsSync(file)) { missing++; continue; }
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  out[rel] = "data:" + mime + ";base64," + buf.toString("base64");
  bytes += buf.length;
}

const banner = "/* 本文件由 tools/inline-covers.mjs 自动生成，请勿手工编辑。\n" +
  " * 用途：把封面内联为 data URL，避免 file:// 下 canvas 被污染导致分享卡无法导出。 */\n";
fs.writeFileSync(
  path.join(DEMO, "covers-inline.js"),
  banner + "window.COVER_DATA = " + JSON.stringify(out) + ";\n",
  "utf8"
);

const size = fs.statSync(path.join(DEMO, "covers-inline.js")).size;
console.log("内联 " + Object.keys(out).length + " 张封面（缺 " + missing + " 张）· 原图 " +
  (bytes / 1024).toFixed(0) + " KB · 产物 " + (size / 1024 / 1024).toFixed(2) + " MB");
