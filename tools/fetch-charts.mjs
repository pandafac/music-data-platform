/**
 * 榜单 + 歌手照片抓取脚本
 *
 * 作用：
 *   1) 抓取 6 个榜单的真实当期数据 → demo/charts.js
 *   2) 抓取歌手照片 → demo/covers/artists/ → 写入 charts.js 的 artists 映射
 * 用法：node tools/fetch-charts.mjs
 *
 * 各榜口径差异（实测）：
 *   - 热歌 / 新歌 / 欧美 / 日本：cur_count 即名次，old_count 是上期名次
 *   - 飙升 / 流行指数：cur_count 是热度值 → 名次一律取数组顺序
 * 图源规则：歌手照片 T001，专辑封面 T002
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const COVER_DIR = path.join(ROOT, "demo", "covers", "chart");
const ARTIST_DIR = path.join(ROOT, "demo", "covers", "artists");
fs.mkdirSync(COVER_DIR, { recursive: true });
fs.mkdirSync(ARTIST_DIR, { recursive: true });

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: "https://y.qq.com/"
};

const PER_CHART = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHARTS = [
  { id: "hot",   topid: 26, name: "巅峰榜·热歌",     unit: "天", freq: "每日更新" },
  { id: "soar",  topid: 62, name: "飙升榜",          unit: "天", freq: "每日更新" },
  { id: "index", topid: 4,  name: "巅峰榜·流行指数", unit: "天", freq: "每日更新" },
  { id: "new",   topid: 27, name: "巅峰榜·新歌",     unit: "天", freq: "每日更新" },
  { id: "west",  topid: 3,  name: "巅峰榜·欧美",     unit: "周", freq: "每周更新" },
  { id: "kr",    topid: 16, name: "巅峰榜·韩国",     unit: "周", freq: "每周更新" },
  { id: "jpn",   topid: 17, name: "巅峰榜·日本",     unit: "周", freq: "每周更新" }
];

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function featuredArtists() {
  try {
    const src = fs.readFileSync(path.join(ROOT, "demo", "data.js"), "utf8");
    const sandbox = {};
    new Function("window", src)(sandbox);
    const names = new Set();
    (sandbox.DEMO_DATA.songs || []).forEach((s) => names.add(s.artist));
    (sandbox.DEMO_DATA.compareArtists || []).forEach((a) => names.add(a.name));
    return [...names];
  } catch {
    return [];
  }
}

async function download(url, target) {
  if (fs.existsSync(target)) return true;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) return false;
    fs.writeFileSync(target, buf);
    await sleep(60);
    return true;
  } catch {
    return false;
  }
}

const out = { fetchedAt: stamp(), perChart: PER_CHART, charts: [], artists: {} };
const artistMid = new Map();
const coverFiles = new Set();

for (const cfg of CHARTS) {
  const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?topid=${cfg.topid}&song_begin=0&song_num=${PER_CHART}&format=json`;
  let json;
  try {
    json = await (await fetch(url, { headers: HEADERS })).json();
  } catch (err) {
    console.warn(`[${cfg.name}] 抓取失败：${err.message}`);
    continue;
  }
  if (json.code !== 0 || !json.songlist?.length) {
    console.warn(`[${cfg.name}] 返回异常 code=${json.code}`);
    continue;
  }

  const chart = {
    id: cfg.id,
    name: json.topinfo?.ListName || cfg.name,
    unit: cfg.unit,
    freq: cfg.freq,
    date: json.date,
    updateTime: json.update_time || "",
    total: json.total_song_num,
    entries: []
  };

  for (let i = 0; i < json.songlist.length; i++) {
    const raw = json.songlist[i];
    const d = raw.data || {};
    const rank = i + 1;
    const cur = Number(raw.cur_count);
    const old = Number(raw.old_count);
    const inc = Number(raw.in_count);

    const exposesRank = cur === rank;
    const prevRank = exposesRank && Number.isFinite(old) && old >= 1 && old <= (json.total_song_num || 9999) ? old : null;
    const weeks = Number.isInteger(inc) && inc > 0 ? inc : null;
    const hot = exposesRank ? null : (Number.isFinite(cur) ? cur : null);
    const singers = d.singer || [];
    const artistName = singers.map((s) => s.name).join("/");

    let cover = null;
    if (d.albummid) {
      const file = `${d.albummid}_150.jpg`;
      const ok = await download(`https://y.qq.com/music/photo_new/T002R150x150M000${d.albummid}.jpg`, path.join(COVER_DIR, file));
      if (ok) { cover = `covers/chart/${file}`; coverFiles.add(file); }
    }

    /* 歌手照片：仅单一歌手时取（多歌手的合影无法用一张代表） */
    if (singers.length === 1 && singers[0].mid && !artistMid.has(artistName)) {
      artistMid.set(artistName, singers[0].mid);
    }

    chart.entries.push({ rank, prevRank, weeks, hot, title: d.songname || "", artist: artistName, cover });
  }

  out.charts.push(chart);
  console.log(`[${chart.name}] ${chart.entries.length} 条 · ${chart.date} · 在榜口径=${chart.entries[0].weeks !== null ? "有" : "无"}`);
}

/* 榜外歌手（只在演示榜里的团体）用搜索补抓 */
for (const name of featuredArtists()) {
  let mid = artistMid.get(name);
  if (!mid) {
    for (const [k, v] of artistMid) {
      if (k.includes(name) || name.includes(k.split("/")[0])) { mid = v; break; }
    }
  }
  if (!mid) {
    try {
      const u = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=" + encodeURIComponent(name) + "&format=json&p=1&n=1&t=0";
      const j = await (await fetch(u, { headers: HEADERS })).json();
      const sg = j?.data?.song?.list?.[0]?.singer?.[0];
      if (sg?.mid) { mid = sg.mid; artistMid.set(name, mid); }
    } catch { /* 忽略，回退字母头像 */ }
    await sleep(120);
  }
}

let artistOk = 0;
for (const [name, mid] of artistMid) {
  const file = `${mid}_150.jpg`;
  const ok = await download(`https://y.qq.com/music/photo_new/T001R150x150M000${mid}.jpg`, path.join(ARTIST_DIR, file));
  if (ok) { out.artists[name] = `covers/artists/${file}`; artistOk++; }
}

const banner = "/* 本文件由 tools/fetch-charts.mjs 自动生成，请勿手工编辑 */\n";
fs.writeFileSync(
  path.join(ROOT, "demo", "charts.js"),
  banner + "window.CHART_DATA = " + JSON.stringify(out, null, 1) + ";\n",
  "utf8"
);

console.log(`\n榜单：${out.charts.length} 个 · 记录 ${out.charts.reduce((n, c) => n + c.entries.length, 0)} 条`);
console.log(`专辑封面：${coverFiles.size} 张 · 歌手照片：${artistOk} 张`);
