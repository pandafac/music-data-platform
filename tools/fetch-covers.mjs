/**
 * 歌曲封面抓取脚本
 *
 * 作用：按 demo/data.js 里的曲目，从 QQ音乐 搜索接口取专辑封面并下载到 demo/covers/。
 * 用法：node tools/fetch-covers.mjs
 *
 * 说明：封面仅用于 Demo 展示，正式版应直接使用平台侧封面资源。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const OUT_DIR = path.join(ROOT, "demo", "covers");
fs.mkdirSync(OUT_DIR, { recursive: true });

/* 读取曲目列表：data.js 是浏览器脚本，这里用最小 shim 求值 */
const src = fs.readFileSync(path.join(ROOT, "demo", "data.js"), "utf8");
const sandbox = {};
new Function("window", src)(sandbox);
const SONGS = sandbox.DEMO_DATA.songs;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Referer: "https://y.qq.com/"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickAlbumMid(json, song) {
  const list = json?.data?.song?.list || [];
  let best = null, bestScore = -1;
  for (const item of list) {
    if (!item.albummid) continue;
    const singers = (item.singer || []).map((s) => s.name).join("/");
    let score = 0;
    if (singers.includes(song.artist) || song.artist.includes(singers.split("/")[0])) score += 3;
    if (item.songname === song.title) score += 4;
    else if (item.songname.includes(song.title) || song.title.includes(item.songname)) score += 2;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 3 ? best : null;
}

const report = [];

for (const song of SONGS) {
  const query = `${song.title} ${song.artist}`;
  const target = path.join(OUT_DIR, `${song.id}.jpg`);
  try {
    const url = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=" +
      encodeURIComponent(query) + "&format=json&p=1&n=8&t=0";
    const res = await fetch(url, { headers: HEADERS });
    const json = await res.json();
    const hit = pickAlbumMid(json, song);
    if (!hit) { report.push(`${song.id} ${song.title} — 未匹配到曲目`); await sleep(250); continue; }

    const coverUrl = `https://y.qq.com/music/photo_new/T002R300x300M000${hit.albummid}.jpg`;
    const img = await fetch(coverUrl, { headers: HEADERS });
    if (!img.ok) { report.push(`${song.id} ${song.title} — 封面下载失败 ${img.status}`); await sleep(250); continue; }
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 1000) { report.push(`${song.id} ${song.title} — 返回内容过小，疑似占位图`); await sleep(250); continue; }
    fs.writeFileSync(target, buf);
    report.push(`${song.id} ${song.title} · ${hit.songname} — OK ${Math.round(buf.length / 1024)}KB（匹配 ${hit.songname}/${hit.albumname}）`);
  } catch (err) {
    report.push(`${song.id} ${song.title} — 出错：${err.message}`);
  }
  await sleep(300);
}

console.log(report.join("\n"));
console.log(`\n共 ${SONGS.length} 首，成功 ${report.filter((r) => r.includes("— OK")).length} 首`);
