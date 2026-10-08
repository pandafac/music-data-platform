/**
 * 外部热点抓取脚本
 *
 * 作用：从公开热榜抓取实时热点，按音乐相关关键词过滤后写入 demo/hot.json。
 * 用法：node tools/fetch-hot.mjs
 *
 * 设计约束（重要）：
 *  - 热点属于「外部信息层」，只用于给数据变化提供背景注解；
 *  - 绝不参与任何榜单计算，输出必须带 source 与 fetchedAt；
 *  - 抓不到内容时写入空数组，前端会走空状态，不伪造数据。
 */

import fs from "node:fs";
import path from "node:path";

const KEYWORDS = [
  "音乐", "歌手", "专辑", "单曲", "演唱会", "巡演", "音乐节",
  "舞台", "演出", "唱", "乐队", "说唱", "电音", "新歌", "MV", "歌"
];

const SOURCES = [
  {
    name: "微博热搜",
    url: "https://weibo.com/ajax/side/hotSearch",
    referer: "https://weibo.com/",
    pick: (json) => (json?.data?.realtime || []).map((x) => ({
      text: x.word,
      heat: x.num ?? null
    }))
  },
  {
    name: "抖音热榜",
    url: "https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/",
    referer: "https://www.douyin.com/",
    pick: (json) => (json?.word_list || []).map((x) => ({
      text: x.word,
      heat: x.hot_value ?? null
    }))
  },
  {
    name: "百度热搜",
    url: "https://top.baidu.com/api/board?platform=wise&tab=realtime",
    referer: "https://top.baidu.com/",
    pick: (json) => {
      const cards = json?.data?.cards || [];
      const out = [];
      cards.forEach((card) => {
        (card.content || []).forEach((item) => {
          if (item && item.word) out.push({ text: item.word, heat: item.hotScore ?? null });
        });
      });
      return out;
    }
  }
];

function isMusicRelated(text) {
  return KEYWORDS.some((k) => text.includes(k));
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const out = {
  fetchedAt: stamp(),
  sources: [],
  scanned: 0,
  items: [],
  note: ""
};

for (const src of SOURCES) {
  try {
    const res = await fetch(src.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Referer: src.referer
      }
    });
    const json = await res.json();
    const all = src.pick(json).filter((x) => x && x.text);
    const music = all.filter((x) => isMusicRelated(x.text));
    out.sources.push({ name: src.name, scanned: all.length, matched: music.length });
    out.scanned += all.length;
    music.forEach((m) => out.items.push({ ...m, source: src.name }));
    console.log(`[${src.name}] 扫描 ${all.length} 条，音乐相关 ${music.length} 条`);
  } catch (err) {
    console.warn(`[${src.name}] 抓取失败：${err.message}`);
    out.sources.push({ name: src.name, scanned: 0, matched: 0, error: err.message });
  }
}

out.items = out.items.slice(0, 8);
out.note = out.items.length
  ? `共扫描 ${out.scanned} 条，命中音乐相关 ${out.items.length} 条`
  : `共扫描 ${out.scanned} 条，音乐相关 0 条 —— 综合热榜以社会新闻为主，音乐事件需要更垂直的来源（如艺人官微、颁奖礼官微、音乐区榜单）`;

const target = path.resolve("demo/hot.json");
fs.writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
console.log(`已写入 ${target}`);
