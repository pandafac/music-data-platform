/* 音乐数据台 · Demo 数据
 *
 * 数据说明：
 *  - 榜单名次、歌名、歌手、累计在榜期数：来自 QQ音乐 热歌榜公开榜单接口（取数日 2026-10-06）
 *  - 历史轨迹（trajectory）：演示数据（null 表示当期为出榜状态）
 */
window.DEMO_DATA = {
  fetchDate: "2026-10-08",
  sourceNote: "数据来源：平台公开榜单接口 · 覆盖 7 个榜单 · 名次、在榜期数与专辑封面为真实数据 · 走势为演示数据（公开接口不提供历史回溯）",

  charts: [
    { id: "hot",   name: "巅峰榜·热歌",   freq: "每日更新", tag: "站内热度前 300" },
    { id: "soar",  name: "飙升榜",        freq: "每日更新", tag: "上升最快" },
    { id: "index", name: "巅峰榜·流行指数", freq: "每日更新", tag: "实时热度" },
    { id: "new",   name: "巅峰榜·新歌",   freq: "每日更新", tag: "新歌首发" },
    { id: "west",  name: "巅峰榜·欧美",   freq: "每周更新", tag: "全球榜 · 欧美" },
    { id: "kr",    name: "巅峰榜·韩国",   freq: "每周更新", tag: "全球榜 · 韩国" },
    { id: "jpn",   name: "巅峰榜·日本",   freq: "每周更新", tag: "全球榜 · 日本" }
  ],

  /* 榜单口径：单位随更新频率而定 */
  chartMeta: {
    hot:   { name: "巅峰榜·热歌",    unit: "天", freq: "每日更新" },
    soar:  { name: "飙升榜",         unit: "天", freq: "每日更新" },
    index: { name: "巅峰榜·流行指数", unit: "天", freq: "每日更新" },
    new:   { name: "巅峰榜·新歌",    unit: "天", freq: "每日更新" },
    west:  { name: "巅峰榜·欧美",    unit: "周", freq: "每周更新" },
    kr:    { name: "巅峰榜·韩国",    unit: "周", freq: "每周更新" },
    jpn:   { name: "巅峰榜·日本",    unit: "周", freq: "每周更新" }
  },

  songs: [
    { id:"s1", title:"失眠", artist:"Suki刘舒妤", rank:15, prevRank:16, weeks:283, chart:"hot",
      trajectory:[3,5,9,14,22,31,45,null,null,null,12,8,6] },
    { id:"s2", title:"茶汤", artist:"郁可唯", rank:3, prevRank:3, weeks:26, chart:"hot",
      trajectory:[45,38,30,22,15,11,8,6,5,4,3,3] },
    { id:"s3", title:"甲乙丙丁", artist:"李佳薇", rank:2, prevRank:2, weeks:95, chart:"hot",
      trajectory:[60,41,28,19,12,8,5,3,2,2] },
    { id:"s4", title:"我不难过", artist:"孙燕姿", rank:1, prevRank:1, weeks:180, chart:"hot",
      trajectory:[8,6,4,2,1,1,1,2,1,1,1,1,2,3,4,5,6,5,4,3,2,1,1,2,2,3,2,1,1,1] },
    { id:"s5", title:"我怀念的", artist:"孙燕姿", rank:6, prevRank:7, weeks:1667, chart:"hot",
      trajectory:[22,18,15,11,9,7,6,null,6,5,6,7,null,9,8,7,6,6,6] },
    { id:"s6", title:"开始懂了", artist:"孙燕姿", rank:13, prevRank:12, weeks:1389, chart:"hot",
      trajectory:[30,26,22,19,17,15,14,13,13,12,13,13] },
    { id:"s7", title:"Always Online", artist:"林俊杰", rank:9, prevRank:9, weeks:1662, chart:"hot",
      trajectory:[40,33,27,21,16,12,10,9,9,10,9,9] },
    { id:"s8", title:"红色高跟鞋", artist:"蔡健雅", rank:14, prevRank:15, weeks:1776, chart:"hot",
      trajectory:[35,28,22,18,15,13,12,14,null,null,17,16,15,14,14,15,null,19,17,16,15,14,14,14] },
    { id:"s9", title:"茶花开了，该回家了", artist:"王睿卓/加木", rank:11, prevRank:11, weeks:178, chart:"hot",
      trajectory:[68,52,40,31,24,18,14,11,11] },
    { id:"s10", title:"情歌", artist:"梁静茹", rank:4, prevRank:4, weeks:868, chart:"hot",
      trajectory:[19,15,12,9,7,6,5,4,4,4,4] },
    { id:"s11", title:"Whiplash", artist:"aespa", rank:2, prevRank:2, weeks:20, chart:"kr",
      trajectory:[9,5,3,2,2,2,2,3,4,4,3,3,2,2,2,3,3,2,2,2] },
    { id:"s12", title:"The Fate of Ophelia", artist:"Taylor Swift", rank:4, prevRank:3, weeks:13, chart:"west",
      trajectory:[1,1,1,1,1,1,1,1,1,1,2,3,4] },
    { id:"s13", title:"Lemon", artist:"米津玄師", rank:2, prevRank:3, weeks:21, chart:"jpn",
      trajectory:[8,6,4,3,2,2,1,1,1,1,1,2,2,3,3,2,2,2,3,2,2] }
  ],

  records: [
    { songId:"s8", badge:"longestRun", icon:"\u23F1", title:"红色高跟鞋 · 蔡健雅", desc:"累计在榜期数", val:"1776 期" },
    { songId:"s4", badge:"tenStreak", icon:"\u{1F3C6}", title:"我不难过 · 孙燕姿", desc:"当前热歌榜第 1，连续 4 期登顶", val:"TOP 1" },
    { songId:"s2", badge:"biggestClimb", icon:"\u{1F525}", title:"茶汤 · 郁可唯", desc:"11 期内从第 45 升至第 3，本季最猛爬升", val:"+42" },
    { songId:"s1", badge:"strongReentry", icon:"\u21A9", title:"失眠 · Suki刘舒妤", desc:"出榜 3 期后回榜，回榜当期为第 12", val:"回榜" }
  ],

  /* 往年今日（演示数据；每条带一段当时的轨迹切片） */
  history: [
    { when: "五年前的今天", date: "2021-10-06", songId: "s4",
      headline: "这一天，它第一次登上热歌榜第 1 名。",
      trajectory: [14, 11, 9, 7, 5, 4, 3, 2, 2, 1] },
    { when: "三年前的今天", date: "2023-10-06", songId: "s7",
      headline: "这一天，它累计在榜满 100 期。",
      trajectory: [12, 10, 9, 8, 9, 8, 7, 7, 8, 7] },
    { when: "八年前的今天", date: "2018-10-06", songId: "s8",
      headline: "这一天，它第一次拿到第 1 名。",
      trajectory: [9, 7, 6, 5, 4, 3, 2, 2, 1, 1] }
  ],

  /* 对比页：六维数据（演示） */
  compareArtists: [
    { id:"a1", name:"孙燕姿", region:"华语/内地",
      dims:{ total:88, peak:95, duration:92, stability:70, burst:62, coverage:84 },
      union:{ "热歌榜":"3 首在榜", "巅峰榜·韩国":"暂无数据", "巅峰榜·日本":"暂无数据", "巅峰榜·欧美":"暂无数据", "由你榜":"1 首在榜" } },
    { id:"a2", name:"林俊杰", region:"华语/内地",
      dims:{ total:76, peak:82, duration:80, stability:85, burst:78, coverage:71 },
      union:{ "热歌榜":"1 首在榜", "巅峰榜·韩国":"暂无数据", "巅峰榜·日本":"暂无数据", "巅峰榜·欧美":"暂无数据", "由你榜":"1 首在榜" } },
    { id:"a3", name:"aespa", region:"韩语/K-POP",
      dims:{ total:74, peak:92, duration:68, stability:78, burst:88, coverage:66 },
      union:{ "热歌榜":"暂无数据", "巅峰榜·韩国":"6 首在榜", "巅峰榜·日本":"暂无数据", "巅峰榜·欧美":"暂无数据", "由你榜":"—" } },
    { id:"a4", name:"Taylor Swift", region:"欧美",
      dims:{ total:86, peak:88, duration:74, stability:82, burst:84, coverage:90 },
      union:{ "热歌榜":"暂无数据", "巅峰榜·韩国":"暂无数据", "巅峰榜·日本":"暂无数据", "巅峰榜·欧美":"1 首在榜", "由你榜":"—" } },
    { id:"a5", name:"米津玄師", region:"日语/J-POP",
      dims:{ total:82, peak:90, duration:94, stability:88, burst:70, coverage:64 },
      union:{ "热歌榜":"暂无数据", "巅峰榜·韩国":"暂无数据", "巅峰榜·日本":"1 首在榜", "巅峰榜·欧美":"暂无数据", "由你榜":"—" } }
  ],

  /* 对比页可选的歌（并集示例用） */
  unionCharts: ["热歌榜","巅峰榜·韩国","巅峰榜·日本","巅峰榜·欧美","由你榜"],

  /* AI 助手的建议问法 */
  aiAsks: [
    "今天谁空降了？",
    "哪首歌在榜最久？",
    "孙燕姿有几首在榜？",
    "失眠这首歌掉出去过吗？"
  ],

  /* 搜索框下的快捷入口：点了直接进轨迹页 */
  quickSongs: ["失眠", "茶汤", "孙燕姿", "aespa", "Taylor Swift", "米津玄師"],

  /* 走势页的 AI 追问建议 */
  trackAsks: ["它掉出去过吗？", "最高冲到第几？", "回榜过几次？"],

  /* ===== 外部热点层 =====
   * 只用于给数据变化提供背景注解，绝不参与任何榜单计算。
   * 每条必须带 date 与 source；示例事件已明确标注「非真实事件」。
   */
  hotEvents: {
    s1: [
      { date: "2026-10-05", text: "该曲被大量用作短视频背景音乐，出现二次传播", source: "示例热点 · 非真实事件" }
    ],
    s11: [
      { date: "2026-10-02", text: "副歌舞蹈挑战在短视频平台走红", source: "示例热点 · 非真实事件" },
      { date: "2026-09-28", text: "组合在海外颁奖礼表演该曲，带动收听回升", source: "示例热点 · 非真实事件" }
    ],
    s12: [
      { date: "2026-10-04", text: "格莱美相关活动的表演片段被广泛转发", source: "示例热点 · 非真实事件" },
      { date: "2026-09-30", text: "巡演现场片段在短视频平台高频传播", source: "示例热点 · 非真实事件" }
    ],
    s13: [
      { date: "2026-10-01", text: "该曲作为剧集主题曲再次被翻出讨论，长尾收听回升", source: "示例热点 · 非真实事件" }
    ]
  },

  /* 实时热点快照（由 tools/fetch-hot.mjs 抓取后覆盖；此处为最近一次抓取结果） */
  hotSnapshot: {
    fetchedAt: "2026-10-06 21:21",
    scanned: 100,
    sources: [
      { name: "微博热搜", scanned: 50, matched: 0 },
      { name: "抖音热榜", scanned: 50, matched: 3 },
      { name: "百度热搜", scanned: 0, matched: 0 }
    ],
    items: [
      { text: "用说唱的方式打开世界黄金周", heat: 7772440, source: "抖音热榜" },
      { text: "李荣浩临沂演唱会", heat: 7758207, source: "抖音热榜" },
      { text: "到了能听懂这首歌的年纪", heat: 7682682, source: "抖音热榜" }
    ],
    note: "共扫描 100 条，命中音乐相关 3 条"
  },

  /* 个人主页（Demo 数据） */
  profile: {
    name: "数据迷",
    sub: "QQ音乐用户 · 已关注 3 位歌手"
  }
};
