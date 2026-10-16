/* 今栖 NowNest — Service Worker
 *
 * v22：修设置页窄屏上说明文字/多控件行把行撑破（app.js / style.css 均有改动，必须换 CACHE_NAME）。
 *      现象：设置页有些行的文字冲出屏幕右边被切掉（用户截图，拼音组句那块最明显）。
 *      根因：.setting-row label 的 flex-shrink:0 把长说明钉死在 max-content 宽度上、整行又不折行；
 *            .fs-body 是 overflow:hidden ⇒ 不是能横向滑动，是【被硬裁掉】。
 *            实测 390px 视口：拼音组句「随机度」scrollWidth 885 / clientWidth 367（溢出 518px）、「剔除专名」403px；
 *            聊天设置「一次说 / 一条用」两行各 103px（一行塞 4 输入框 + 4 标签）；TA 的收藏长说明 18px。
 *      修法：新增通用类 .sg-fit（分组允许折行）+ .sg-hint（小字说明可收缩换行），
 *            套用到 5 个【实测会溢出】的分组：聊天设置、朋友圈设置、日记设置、TA 的收藏、拼音组句。
 *            折行用的是未收缩的 max-content 宽度 ⇒ 长说明自己落下一行、短说明仍在控件右侧，无需媒体查询；
 *            而且 flex-wrap 只在真的排不下时才生效 ⇒ 排得下的分组/宽度下布局与改前逐像素相同。
 *            其余 10 个分组一个字没动（仍是 nowrap）。详见 style.css 该段注释。
 * v21：丁（词级）内核重写成「输入法式组句」——每一步按语料 tri→bi→uni 算"下一个词最可能是什么"并加权采样，
 *      每次可能挑到不同的备选（工作台丁列直接显示每步备选词）。原因：旧的「同槽换词」只约束字数+首音节，
 *      会把「特别好」换成「特征好」，用户实测出戏。同槽换词与出词池已整体删除（词库只剩切词 + 剔除专名两职）。
 *      设置里的「词库占比(%)」随之移除，换成「随机度(%)」30`200 默认 100（不再读写 lexRatio 键）。
 *      收尾只在语料真实句尾处（$）落停，并丢掉"只好/已经"这类虚词尾巴。
 * v20：词库新增「专名剔除」名单（b 字段）+ 拼音组句设置里的「剔除专名」开关（默认开）。
 *      背景：词级引擎（丁）的语料里混着人名/地名/朝代/机构词（西周·满清·清朝·秦始皇·朝阳区·国务院…），
 *      同槽换词一抽就出戏。做法是【不在资产里删词】：只在名单里列出 3239 个词，开关打开时
 *      它们不参与切词（pySegWords）、词级接龙骨架与同槽换词池；关掉即完整恢复。
 *      名单来源：_work/lex-keep.txt（允许表：常用国家/大城市 + jieba 标注误判的常用词）、
 *      _work/lex-strip-hist.txt（人工历史/帝制/宫廷词，标注抓不到的那批：皇帝=n、清朝=t）。
 *      py-lex.js 重生成（163410 → 192219 B：w/t/n 逐字节未变，只多了 b），所以必须换 CACHE_NAME。
 * v19：新增「连结簿」——用户手写"与梦角产生链接"的瞬间（一天可记多笔、按标签分类、可搜索、按日期分组回看）
 *      （index.html / app.js / style.css 都有改动，必须换 CACHE_NAME）。
 *      ① 独立模块：侧边栏新入口 data-view="links" → openFullscreen → renderLinks；日记与碎影一个字没动。
 *      ② 数据 STORE.links / STORE.linkTags：导出与导入两处都加了（备份是逐键显式列举，漏一处就是静默丢数据）。
 *      ③ 标签预置 体感/推送/字卡/思念/感想，全部可改名/可删/可新增；删标签不删记录，孤儿 id 渲染时安全忽略。
 *      ④ 日期分组用【本地】年月日，不用 toISOString（UTC 会把凌晨的记录算到前一天）。
 *      ⑤ 搜索只重画列表、不重画整页 —— 否则每敲一个字输入框都会重建、光标丢掉。
 * v18：新增「内心 OS」——梦角文本消息按概率在气泡右上角挂一个小气泡，点开在气泡内展开内心 OS
 *      （app.js / style.css 均有改动，必须换 CACHE_NAME）。
 *      ① 与既有的"概率装饰"同型（撤回/表情包/歌曲），就挂在 addMessage 里；概率 = 设置页「聊天设置」
 *         新增的「内心 OS 概率(%)」，默认 10，0 关 100 必出（0 是合法值，读法与保存都不吃 0）。
 *      ② 内心 OS 也是抽字卡，2`4 张 —— 走全站唯一抽卡核心 composeCardText（自带隐藏分组过滤），
 *         与聊天正文同一条路、同分隔符；抽它在正文之后，所以正文逐字节不受影响。
 *      ③ 小气泡是 .msg-bubble 的绝对定位子元素（气泡本来就 position:relative 且无 overflow:hidden，
 *         溢到角上不被裁）⇒ DOM 结构与既有布局一个字没改；未读亮色、点开转淡，刷新后状态照旧。
 *      ④ 点击必须吃掉事件：单击消息行原本会弹「解读/收藏/删除」浮层，两者不能互相触发。
 *
 * v17：引擎收敛到乙/丁 + 语料可一键换成自己的（app.js 有改动，必须换 CACHE_NAME）。
 *      ① 只留乙（拼音马尔可夫，默认）与丁（词级接龙）：甲·均匀抽音节、丙·音节块接龙
 *         【连代码一起删净】—— pyGenUniform / pyGenChunk / pyPickPairs / 音节块表全没了。
 *         旧配置里存着已删引擎名的，由 pyCfg 归一成乙 ⇒ 不白屏、不报错（node N2/N3、浏览器 H5 三向证明）。
 *      ② 语料本来就是「你的字卡库」（pyCorpus ← getVisibleCards ← STORE.cards），所以换语料 = 换字卡库：
 *         真·首启（这一次运行刚写入内置演示卡）问一次「先看看演示卡 / 导入我自己的」；
 *         设置页多一行「语料：当前 N 卡 · 来自你的字卡库」+ 一键导入。导入两条路 ——
 *         选本 App 导出的 JSON（整体替换，沿用「TA 收下的话」子树保护）或粘贴清单
 *         （每行一条，自动落进「我的字卡 / 语料」，不用先手工建分类）；导入后 pyInvalidate 立刻重建模型。
 *         已有卡库的人（含你自己）永远不会被问第二次 —— 首启标记只在那次播种时为真。
 *      ③ 内置演示卡从 23 张口号（加油！冲啊！/ 永不放弃！）换成 44 张关心问候
 *         （吃饭了吗 / 早点睡，别熬夜 / 我在这儿呢 / 想你了…）。它同时是拼音组句第一次能用的语料：
 *         音节 78 → 180、状态 → 85。三个内置大类在字卡库里照常可删可藏。
 *
 * v16：修「丁 · 词级接龙」反复重复两个字（app.js 有改动，必须换 CACHE_NAME）。
 *      现象：吐「啦懂啦，懂啦懂啦，懂啦懂啦懂」「一忍一忍，一忍一忍一忍」。
 *      根因：语料里「啦懂啦懂」这类复读卡切成单字后，bi 表学成 啦→懂 / 懂→啦 两条互指的边，
 *      链条在两个字之间来回弹。旧版只挡 A A（同词相邻），挡不住 A B A B 折返 ——
 *      折返死循环里每一棒都只跟前一格不同。
 *      修法：生成时把【刚落过的两个词】都放进禁词表（A A 与 A B A 同时被挡），一行都不许替代时
 *      退回更低阶来源再收尾；同槽换词那边禁【已经落在嘴上的】前两个词（两个不同原词同槽会被换成同一个词，
 *      嘴上会成 A B B）。pyRowAlt 一行未改 ⇒ 甲乙丙三个引擎不受影响。
 *      实测：真实 1939 卡语料 200 条，修复前 6 条含折返 → 修复后 0 条（成句 120/120 未退化）。

 * v15：给「丁 · 词级接龙」加「词库占比」（app.js 有改动；py-lex.js 重生成，同样必须换 CACHE_NAME）。
 *      上一版只用词库【切词】，出词仍全是你字卡里的词（新词率 0%）—— 用起来还是像字卡库拼接。
 *      这一版让词库真的【出词】：链与词对一个字不改，只把面上的词换成词库里「字数相同 +
 *      首音节相同」的词（同槽替换）。两条约束把长词挡在门外 —— 你语料 91% 的词是 2 字，
 *      3/4 字的新闻词根本没有槽位可落；换进来的词还得先通过「只用你语料出现过的字拼得出」这一关。
 *      实测：占比 50 时新词率 31.6%、新闻长词混入 0；占比 0 时与上一版逐字节相同（含随机数消耗）。
 *      另：py-lex.js 重排为「组内按词频降序」（下标即常用度，供上面按常用度加权），词集合逐词未变。

 * v14：新增「拼音组句」第 4 个引擎「丁 · 词级接龙」（app.js 有改动；另新增按需资源 py-lex.js）。
 *      为什么加：前三个引擎都只看见一串音节、不知道词边界。实测最典型的一串输出「我在这里都你」
 *      （wo zai zhe li dou ni）—— 每个字都对，但音节顺序本身不成词；换大字表、给"词奖金"，
 *      输出逐字不变（已实测）。所以词库的正确用法不是"帮回填选字"，而是让模型知道"词在哪"：
 *      用通用词表（jieba dict.txt，MIT）把语料切成词，再按【词】建 tri→bi→uni 表重组。
 *      同种子同语料对拍：词化率 31.9% → 34.9%，"像你自己"（字对出现在你语料里）79.4% → 100%。
 *      设计：默认仍是 markov，只新增选项，三个旧引擎一字未改；词表按需加载 ——
 *      刻意【不】放进 APP_SHELL（否则等于让每个访客都下 160KB），首次用到时由下面的
 *      fetch 分支自动 cache.put，之后离线可用；词表未就绪时该次生成退回普通抽卡，不报错。
 *
 * v13：修拼音组句「同音字选错」的根因 + 被"挑"出来的字标橙（app.js / style.css 有改动）。
 *      根因：同调奖励拿"该音节最常用字的声调"当基准，与 canonical 奖励同源，两项叠加
 *      可翻掉语境证据 —— 语料里明明有「我关灯了哦」「记得关灯」，却输出「我关等了」。
 *      降到 0.3（只做平局倾向）后 灯 自己就赢，全库像话度 77.2% → 78.8%。
 *      正文里"不是该音节最常用字"的字加 py-fix 类标橙（渲染期推导，不占存储、历史消息同样生效）。
 *
 * v12：拼音组句的消息在聊天里单独美化（app.js / style.css 均有改动，必须换 CACHE_NAME）。
 *      气泡加 py-bubble 修饰类（暖橙描边 + 淡渐变），正文上方一个「拼音组句」标签，
 *      每个汉字用 <ruby> 标出它自己的读音（轻声不标调）；rt 设 user-select:none，
 *      所以复制消息时不会把拼音一起带走。一眼能看出这条是怎么来的。
 *      行距 2.2：实测 rt 高 14px、字盒 19px，2.0 会让下一行的拼音压进上一行 1px（40 处），2.2 重叠 0。
 *
 * v10：修「拼音组句」的三个体验问题（app.js 有改动，必须换 CACHE_NAME）。
 *      ① 同音字回填改成按语料真实用字习惯做 beam search —— 旧版每个音节独立取"全局最常用字"
 *         又叠了同调硬过滤，候选常被压成 1 个：爸爸→吧吧、打你屁股→大你皮故。
 *      ② 抗复读：已连续原样复刻语料 4 个音节就不再走三阶表、5 个不再走二阶表
 *         （实测"含 ≥5 音节原卡片段"从 50.8% 降到 4.8%，"含 ≥6"从 20% 降到 0）。
 *      ③ 句长随机 + 按语料段尾统计插逗号（旧版恒定走满 lenMax，且从无标点）。
 *
 * v9：新增「拼音组句」（app.js / style.css 均有改动，必须换 CACHE_NAME）。
 *     把字卡文本转成音节流（汉字→无调音节），三引擎 uniform / markov / chunkchain
 *     随机重组后按同音字回填成汉字；设置页「拼音组句」分组内嵌对比工作台。
 *     默认关闭（py.on=false），关着时与 v8 逐字节等价（300 种子对拍，0 条不一致）；本期仅启用聊天链路。
 *
 * v8：修「字卡库点大类后列表仍显示全部字卡」。
 *     renderCardItems 里 `subCards` 初始化为全量，选中大类时只重算了 catCards，
 *     没把 subCards 收窄 → 只要 state.selectedSubId 为空，列表就是 1939 条全量
 *     （截图里的「日常问候 192 条」却列着 `我同意/喜欢/好哦` 正是此因）。
 *     改为选中大类时同步 subCards=catCards。app.js 有改动，必须换 CACHE_NAME。
 *     同版另修：「TA 收下的话」大类以前要等第一次真收藏才出现（第二行/页签/设置项
 *     都跟着隐身，看起来像功能没做），改为首启按 taFavCfg().enabled 预建。
 *
 * v7：新增「TA 的收藏」（梦角收藏我说的话）：字卡库第二行 + 收藏夹页签
 *     + 设置项，另在发消息链上挂 tryTaFav。app.js / index.html / style.css 均有改动。
 *
 * v6：修复「碎影设置改了不生效 / 等十几分钟一个碎影也不存」。
 *     碎影不再挂在调度中心的当天固定槽位表上（那里的 interval 只是槽位最小间距，
 *     且槽位总数被 perDay 卡在 1~2 个），改为按设置里的「检查间隔」滚动排期；
 *     改设置会立刻重置下一次检查点。app.js 有改动，必须换 CACHE_NAME。
 *     同日续修：离线回溯会全局改写 Date.now()，碎影排期若读它会排到过去
 *     （首轮退化成"加载后 1 秒"、设置页显示"约 0 分钟"），改走 shadowNowMs()。
 *
 * v5：新增「碎影」功能（app.js / index.html / style.css 都有改动）。
 *     已经是 v4 的缓存不会被 install 覆盖，缓存优先策略下老访客会一直拿到旧的 app.js，
 *     所以这次改动必须换 CACHE_NAME 才能让已装过的用户拿到新版本。
 *     （v4 的注释里就写着"发布新版本记得改 CACHE_NAME"，此处照做。）
 *
 * v4 修复（对应"网站打开很原始/裸 HTML"的报告）：
 *  1. 预缓存补上 style.css 与 app.js。v2 的 APP_SHELL 只有 index.html，这两个文件
 *     一次都没被缓存过——页面能开（index.html 来自缓存），但样式和逻辑必须每次现拉；
 *     一旦拉取失败（弱网/断网/资源没上传），就正好是"页面打开了、但完全没有样式"的裸 HTML。
 *  2. 预缓存改为逐个 add 并各自 catch：某个文件 404 不再让整个 install 失败
 *     （不同部署点资源不一定齐全，比如网页版没有本地字体文件）。
 *  3. 永远不再 respondWith(undefined)：旧写法 `return cached || network` 在
 *     cached 为空且 fetch 失败时会返回 undefined，资源静默失败、无任何报错。
 *  4. 静态资源与页面都改成"缓存优先 + 后台更新"：打开速度不变，但内容能自愈，
 *     不会像旧版那样把某个 index.html 永久冻在缓存里（发布新版本记得改 CACHE_NAME）。
 */
const CACHE_NAME = 'now-nest-v22';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './letters.js',
  './manifest.webmanifest',
  './pwa-icon-192.png',
  './pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        // 单个资源缺失不应让整个 SW 安装失败
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });

    const network = fetch(request).then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    });

    if (cached) {
      // 先给缓存（秒开），后台顺手更新，下次访问就是新的
      event.waitUntil(network.catch(() => {}));
      return cached;
    }

    try {
      return await network;
    } catch (err) {
      // 没有任何可用副本时，明确返回一个失败响应，而不是 undefined
      return new Response('resource unavailable offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
