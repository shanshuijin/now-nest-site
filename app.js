// ============================================================
// 今栖 NowNest v3
// ============================================================

// 自动清理最旧的含图片消息/动态来释放 localStorage 空间
function _freeStorageQuota() {
  try {
    var messages = JSON.parse(localStorage.getItem('mcard_messages')) || [];
    var moments = JSON.parse(localStorage.getItem('mcard_moments')) || [];
    // 收集所有含图片的条目，按时间戳排序（最旧在前）
    var items = [];
    messages.forEach(function(m, i) {
      if (m.imageData) items.push({ ts: m.timestamp || 0, key: 'mcard_messages', action: 'splice', idx: i });
    });
    moments.forEach(function(m, i) {
      if (m.imageDataList && m.imageDataList.length > 0) items.push({ ts: m.timestamp || 0, key: 'mcard_moments', action: 'splice', idx: i });
    });
    items.sort(function(a, b) { return a.ts - b.ts; });
    // 删除最旧的 3 条含图片数据
    var removed = 0;
    for (var k = 0; k < items.length && removed < 3; k++) {
      var it = items[k];
      if (it.key === 'mcard_messages' && messages[it.idx]) {
        messages[it.idx].imageData = null; delete messages[it.idx].imageData; removed++;
      } else if (it.key === 'mcard_moments' && moments[it.idx]) {
        moments[it.idx].imageDataList = []; removed++;
      }
    }
    if (removed > 0) {
      localStorage.setItem('mcard_messages', JSON.stringify(messages));
      localStorage.setItem('mcard_moments', JSON.stringify(moments));
    }
  } catch(e) { console.error('Quota cleanup failed:', e); }
}

// ============ Data Layer ============
const STORE = {
  _read(k) { try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;} },
  _write(k,v) {
    try {
      localStorage.setItem(k,JSON.stringify(v));
      return true;
    }
    catch(e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        // 尝试清理最旧的含图片数据来腾空间
        _freeStorageQuota();
        try {
          localStorage.setItem(k,JSON.stringify(v));
          return true;
        }
        catch(e2) {
          console.error('Storage still full after cleanup');
          return false;
        }
      }
      console.error('Storage write error:', e);
      return false;
    }
  },
  get categories() { return this._read('mcard_categories'); },
  set categories(v) { this._write('mcard_categories', v); },
  get subcategories() { return this._read('mcard_subcategories'); },
  set subcategories(v) { this._write('mcard_subcategories', v); },
  get cards() { return this._read('mcard_cards'); },
  set cards(v) { this._write('mcard_cards', v); },
  get messages() { return this._read('mcard_messages'); },
  set messages(v) { this._write('mcard_messages', v); },
  get config() { return this._read('mcard_config'); },
  set config(v) { this._write('mcard_config', v); },
  get moments() { return this._read('mcard_moments'); },
  set moments(v) { this._write('mcard_moments', v); },
  get likedMoments() { return this._read('mcard_likedMoments'); },
  set likedMoments(v) { this._write('mcard_likedMoments', v); },
  get diaries() { return this._read('mcard_diaries'); },
  set diaries(v) { this._write('mcard_diaries', v); },
  get letters() { return this._read('mcard_letters'); },
  set letters(v) { this._write('mcard_letters', v); },
  get reviews() { return this._read('mcard_reviews'); },
  set reviews(v) { this._write('mcard_reviews', v); },
  get checkins() { return this._read('mcard_checkins'); },
  set checkins(v) { this._write('mcard_checkins', v); },
  get checkinWords() { return this._read('mcard_checkinWords'); },
  set checkinWords(v) { this._write('mcard_checkinWords', v); },
  get lastCheckinWord() { return this._read('mcard_lastCheckinWord'); },
  set lastCheckinWord(v) { this._write('mcard_lastCheckinWord', v); },
  get dreamEvents() { return this._read('mcard_dream_events'); },
  set dreamEvents(v) { this._write('mcard_dream_events', v); },
  get lastActive() { try{const v=localStorage.getItem('mcard_last_active');return v?Number(v)||null:null;}catch(e){return null;} },
  set lastActive(v) { try{if(v===null)localStorage.removeItem('mcard_last_active');else localStorage.setItem('mcard_last_active',String(v));}catch(e){} },
  get lastSeen() { return this._read('mcard_lastSeen') || {}; },
  set lastSeen(v) { this._write('mcard_lastSeen', v); },
  get periods() { return this._read('mcard_periods'); },
  set periods(v) { this._write('mcard_periods', v); },
  get periodConfig() { return this._read('mcard_periodConfig'); },
  set periodConfig(v) { this._write('mcard_periodConfig', v); },
  get favorites() { return this._read('mcard_favorites') || []; },
  set favorites(v) { this._write('mcard_favorites', v); },
  get stickers() { return this._read('mcard_stickers') || []; },
  set stickers(v) { this._write('mcard_stickers', v); },
  get songCache() { return this._read('mcard_songcache') || { songs: [], fetchedAt: 0 }; },
  set songCache(v) { this._write('mcard_songcache', v); },
  get shadows() { return this._read('mcard_shadows') || []; },
  set shadows(v) { this._write('mcard_shadows', v); },
  get taFavs() { return this._read('mcard_tafavs') || []; },
  set taFavs(v) { this._write('mcard_tafavs', v); },
  // 连结簿（2026-10-15）：必须成对给存取器。STORE 是白名单存取器对象，缺 setter 时
  // `STORE.links = x` 只会挂一个普通属性：内存读得到、却永远不落盘（刷新即丢）。
  get links() { return this._read('mcard_links') || []; },
  set links(v) { this._write('mcard_links', v); },
  // linkTags 故意不写 `|| []`：null 才代表"老库没这个键"，linkTags() 据此补种预设标签；
  // 若这里兜成 []，"首次补种"与"删空后不复活"两条语义会同时失效。
  get linkTags() { return this._read('mcard_linkTags'); },
  set linkTags(v) { this._write('mcard_linkTags', v); },
};

// ============ Memory Library ============
// 记忆条目字段:
//   id, content, speaker("me"|"mengjiao"|"general"),
//   source("ai_approved"|"manual"), timestamp(ISO),
//   createdAt(ISO), updatedAt(ISO)

function _loadMemories() {
  try { return JSON.parse(localStorage.getItem('memory_library')) || []; }
  catch(e) { return []; }
}

function _saveMemories(list) {
  try { localStorage.setItem('memory_library', JSON.stringify(list)); }
  catch(e) { console.error('memory_library 写入失败:', e); }
}

function saveMemory(memory) {
  var list = _loadMemories();
  var now = new Date().toISOString();
  var entry = {
    id: memory.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)),
    content: memory.content || '',
    speaker: memory.speaker || 'general',
    source: memory.source || 'manual',
    timestamp: memory.timestamp || now,
    createdAt: memory.createdAt || now,
    updatedAt: now,
  };
  list.push(entry);
  _saveMemories(list);
  return entry;
}

function getMemoryList() {
  var list = _loadMemories();
  list.sort(function(a, b) {
    var ta = a.timestamp || a.createdAt || '';
    var tb = b.timestamp || b.createdAt || '';
    return tb.localeCompare(ta); // 按时间倒序
  });
  return list;
}

function deleteMemory(id) {
  var list = _loadMemories();
  list = list.filter(function(m) { return m.id !== id; });
  _saveMemories(list);
}

function updateMemory(id, newContent) {
  var list = _loadMemories();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i].content = newContent;
      list[i].updatedAt = new Date().toISOString();
      _saveMemories(list);
      return true;
    }
  }
  return false;
}

// ============ AI Interpret default config ============
function defaultAIInterpret() {
  return {
    enabled: false,
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: '',
    model: 'deepseek-chat',
    contextCount: 5,
    systemPrompt:
      '你扮演梦角本人。用户和梦角在聊天，梦角说的话是用"字卡"拼接而成的，比较抽象、跳跃。' +
      '现在请用第一人称"我"，结合给定的聊天上下文，解读"我"刚才说的那句话真正想表达的意思。' +
      '不要做字面翻译，要解读潜台词、情绪和心意。语气要贴合梦角的人设——活泼、真诚、偶尔撒娇。' +
      '回答控制在 80 字以内，自然口语，不要分点，不要说"作为AI"。'
  };
}

function defaultLetterConfig() {
  return {
    annotationDelay: { min: 5, max: 30 },
    coverage: { min: 25, max: 50 },
    cardCount: { min: 1, max: 1 },
  };
}

// ---- 内置默认字卡（只用于真·首启的种子）----
// 它们同时是开箱演示【和】拼音组句的第一份语料，所以宁可多写几条像人话的关心问候，
// 也不要凑「加油！冲啊！」那种口号。用户导入自己的字卡库后，这三个大类照常在字卡库里可删。
var _corpusSeededThisRun = false;    // 本次运行刚写入过种子 ⇒ 开头问一次"语料从哪来"
var PY_DEMO_CATEGORIES = [
  { id:'cat1', name:'关心', hidden:false },
  { id:'cat2', name:'问候', hidden:false },
  { id:'cat3', name:'语气', hidden:false },
];
var PY_DEMO_SUBCATEGORIES = [
  { id:'sub1', name:'日常关心', categoryId:'cat1', hidden:false },
  { id:'sub2', name:'安慰', categoryId:'cat1', hidden:false },
  { id:'sub3', name:'鼓励', categoryId:'cat1', hidden:false },
  { id:'sub4', name:'早晚问候', categoryId:'cat2', hidden:false },
  { id:'sub5', name:'想念', categoryId:'cat2', hidden:false },
  { id:'sub6', name:'亲昵', categoryId:'cat2', hidden:false },
  { id:'sub7', name:'语气', categoryId:'cat3', hidden:false },
  { id:'sub8', name:'感叹', categoryId:'cat3', hidden:false },
];
var PY_DEMO_CARDS = [
  { id:'c1',  text:'吃饭了吗', categoryId:'cat1', subcategoryId:'sub1', weight:1 },
  { id:'c2',  text:'记得喝水呀', categoryId:'cat1', subcategoryId:'sub1', weight:2 },
  { id:'c3',  text:'早点睡，别熬夜', categoryId:'cat1', subcategoryId:'sub1', weight:2 },
  { id:'c4',  text:'天冷了多穿点', categoryId:'cat1', subcategoryId:'sub1', weight:1 },
  { id:'c5',  text:'累了就歇会儿', categoryId:'cat1', subcategoryId:'sub1', weight:1 },
  { id:'c6',  text:'路上小心哦', categoryId:'cat1', subcategoryId:'sub1', weight:1 },
  { id:'c7',  text:'注意身体呀', categoryId:'cat1', subcategoryId:'sub1', weight:1 },
  { id:'c8',  text:'别难过啦', categoryId:'cat1', subcategoryId:'sub2', weight:1 },
  { id:'c9',  text:'我在这儿呢', categoryId:'cat1', subcategoryId:'sub2', weight:2 },
  { id:'c10', text:'慢慢来就好', categoryId:'cat1', subcategoryId:'sub2', weight:1 },
  { id:'c11', text:'不用硬撑着', categoryId:'cat1', subcategoryId:'sub2', weight:1 },
  { id:'c12', text:'有我在呢', categoryId:'cat1', subcategoryId:'sub2', weight:2 },
  { id:'c13', text:'都会好起来的', categoryId:'cat1', subcategoryId:'sub2', weight:1 },
  { id:'c14', text:'想哭就哭吧', categoryId:'cat1', subcategoryId:'sub2', weight:1 },
  { id:'c15', text:'你已经很好了', categoryId:'cat1', subcategoryId:'sub3', weight:2 },
  { id:'c16', text:'今天也辛苦了', categoryId:'cat1', subcategoryId:'sub3', weight:1 },
  { id:'c17', text:'别对自己太严格', categoryId:'cat1', subcategoryId:'sub3', weight:1 },
  { id:'c18', text:'我为你骄傲', categoryId:'cat1', subcategoryId:'sub3', weight:1 },
  { id:'c19', text:'我相信你', categoryId:'cat1', subcategoryId:'sub3', weight:2 },
  { id:'c20', text:'你做得很好呀', categoryId:'cat1', subcategoryId:'sub3', weight:1 },
  { id:'c21', text:'早呀', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c22', text:'醒了吗', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c23', text:'今天怎么样', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c24', text:'晚安啦', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c25', text:'做个好梦', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c26', text:'睡吧，我看着你', categoryId:'cat2', subcategoryId:'sub4', weight:1 },
  { id:'c27', text:'想你了', categoryId:'cat2', subcategoryId:'sub5', weight:2 },
  { id:'c28', text:'在忙什么呀', categoryId:'cat2', subcategoryId:'sub5', weight:1 },
  { id:'c29', text:'什么时候回来', categoryId:'cat2', subcategoryId:'sub5', weight:1 },
  { id:'c30', text:'陪我一会儿好不好', categoryId:'cat2', subcategoryId:'sub5', weight:1 },
  { id:'c31', text:'记得想我哦', categoryId:'cat2', subcategoryId:'sub5', weight:1 },
  { id:'c32', text:'抱抱', categoryId:'cat2', subcategoryId:'sub6', weight:1 },
  { id:'c33', text:'摸摸头', categoryId:'cat2', subcategoryId:'sub6', weight:1 },
  { id:'c34', text:'乖啦', categoryId:'cat2', subcategoryId:'sub6', weight:1 },
  { id:'c35', text:'我懂的', categoryId:'cat2', subcategoryId:'sub6', weight:1 },
  { id:'c36', text:'嗯嗯', categoryId:'cat3', subcategoryId:'sub7', weight:1 },
  { id:'c37', text:'好哦', categoryId:'cat3', subcategoryId:'sub7', weight:1 },
  { id:'c38', text:'真的吗', categoryId:'cat3', subcategoryId:'sub7', weight:1 },
  { id:'c39', text:'嘿嘿', categoryId:'cat3', subcategoryId:'sub7', weight:1 },
  { id:'c40', text:'好呀', categoryId:'cat3', subcategoryId:'sub7', weight:1 },
  { id:'c41', text:'哎呀', categoryId:'cat3', subcategoryId:'sub8', weight:1 },
  { id:'c42', text:'咦', categoryId:'cat3', subcategoryId:'sub8', weight:1 },
  { id:'c43', text:'嗯哼', categoryId:'cat3', subcategoryId:'sub8', weight:1 },
  { id:'c44', text:'哈哈', categoryId:'cat3', subcategoryId:'sub8', weight:1 },
];

function initDefaults() {
  var copy = function(o) { return { id:o.id, name:o.name, hidden:o.hidden, categoryId:o.categoryId, text:o.text, subcategoryId:o.subcategoryId, weight:o.weight }; };
  if (!STORE.categories) STORE.categories = PY_DEMO_CATEGORIES.map(copy);
  if (!STORE.subcategories) STORE.subcategories = PY_DEMO_SUBCATEGORIES.map(copy);
  if (!STORE.cards) {
    STORE.cards = PY_DEMO_CARDS.map(copy);
    _corpusSeededThisRun = true;      // 真·首启：起完就当一次问"语料从哪来"
  }
  if (!STORE.messages) STORE.messages = [];
  if (!STORE.config) {
    STORE.config = {
      characterName:'梦角', userNickname:'我', avatarUrl:'', userAvatarUrl:'',
      
      // ========== 时间参数集中管理（单位在参数名或注释中明确） ==========
      timing: {
        activeChat: { min: 30, max: 60 },              // 主动发言间隔(分钟)
        passiveReply: { min: 0.5, max: 2.5 },          // 被动回复延迟(秒)
        dreamPost: { min: 2, max: 8 },                 // 梦角圈子发圈间隔(分钟)
        dreamPostCard: { min: 1, max: 5 },             // 梦角发圈卡片数
        dreamReaction: { min: 1, max: 6 },             // 梦角反应时间(分钟)
        dreamComment: { min: 2, max: 8 },              // 梦角评论延迟(秒)
        diaryGen: { hourMin: 21, hourMax: 24 },        // 日记生成时段(小时)
        diaryComment: { min: 30, max: 120 },           // 日记评论延迟(秒)
        checkin: { timeStart: 9, timeEnd: 21, intervalMin: 30, intervalMax: 120 }, // 签到设置(24h制+分钟)
      },
      
      // 消息配置
      msgCountProbs:[30,40,20,10], cardCountProbs:[30,40,20,10],
      
      // 概率配置
      prob: {
        dreamLike: 80,
        dreamComment: 65,
        diaryComment: 70,
        postPhoto: 60,
        stickerFrac: 70,
        chatSticker: 10,
        reviewCounter: 20,
        doodle: 8,
        os: 10,          // 内心 OS 概率（0 关·100 必出；只作用于梦角文本消息）
      },
      
      // 其他配置
      dreamReplyDecaySeq:[100,70,40,10,0],
      dreamReplyDecayOn:true,
      reviewCardCount:3, reviewMode:'random',
      checkinAutoEnabled:false,
      
      /* dream behavior engine */
      dreamEngine: {
        wakeTime: 7, sleepTime: 23,
        diaryTimeStart: 21, diaryTimeEnd: 24,
        enabled: { dreamPost: true, dreamCheckin: false, dreamDiary: true, dreamChat: true, dreamDiaryComment: true, dreamShadow: true },
        perDay: { dreamPost: { min: 2, max: 8 }, dreamCheckin: { min: 3, max: 12 }, dreamChat: { min: 5, max: 15 }, dreamDiary: { min: 1, max: 1 }, dreamShadow: { min: 0, max: 0 } },
        prob: { dreamDiaryComment: 70, dreamPostPhoto: 60, dreamStickerFrac: 70, dreamChatSticker: 10, recallProb: 1 },
        interval: { dreamCheckin: 45 },
      },
      /* AI interpretation (字卡解读) */
      aiInterpret: defaultAIInterpret(),
      letter: defaultLetterConfig(),
      /* NetEase song share (网易云歌曲分享) */
      netease: {
        enabled: true,
        prob: 12,
        playlistIds: ['135597299'],
        builtinFallback: true,
      },
      /* 拼音组句（详见"拼音组句 (Pinyin Compose)"段；此处只放默认值供导出/导入往返） */
      py: {
        on: false, engine: 'markov', ratio: 30, lenMin: 3, lenMax: 8,
        clarity: 70, tone: 1, surfaces: { chat: true }, blacklist: [], tempPct: 100,
      },
    };
  }
  // Upgrade existing config with dreamEngine if missing
  if (STORE.config && !STORE.config.dreamEngine) {
    const cfg = STORE.config;
    cfg.dreamEngine = {
      wakeTime: 7, sleepTime: 23,
      diaryTimeStart: 21, diaryTimeEnd: 24,
      enabled: { dreamPost: true, dreamCheckin: false, dreamDiary: true, dreamChat: true, dreamDiaryComment: true },
      perDay: { dreamPost: { min: 2, max: 8 }, dreamCheckin: { min: 3, max: 12 }, dreamChat: { min: 5, max: 15 }, dreamDiary: { min: 1, max: 1 } },
      prob: { dreamDiaryComment: 70, dreamPostPhoto: 60, dreamStickerFrac: 70, dreamChatSticker: 10, recallProb: 1 },
      interval: { dreamCheckin: 45 },
    };
    STORE.config = cfg;
  }
  // Upgrade existing config with aiInterpret if missing
  if (STORE.config && !STORE.config.aiInterpret) {
    const cfg = STORE.config;
    cfg.aiInterpret = defaultAIInterpret();
    STORE.config = cfg;
  }
  if (STORE.config && !STORE.config.letter) {
    const cfg = STORE.config;
    cfg.letter = defaultLetterConfig();
    STORE.config = cfg;
  }
  if (STORE.config && !STORE.config.netease) {
    const cfg = STORE.config;
    cfg.netease = { enabled: true, prob: 12, playlistIds: ['135597299'], builtinFallback: true };
    STORE.config = cfg;
  }
  if (!STORE.moments) STORE.moments = [];
  if (!STORE.likedMoments) STORE.likedMoments = [];
  if (!STORE.diaries) STORE.diaries = [];
  if (!STORE.letters) STORE.letters = [];
  if (!STORE.reviews) STORE.reviews = [];
  if (!STORE.checkins) STORE.checkins = [];
  if (!STORE.checkinWords) STORE.checkinWords = ['工作','休息','学习','散步','发呆','喝水'];
  if (!STORE.dreamEvents) STORE.dreamEvents = {};
  if (!STORE.periods) STORE.periods = [];
  if (!STORE.periodConfig) STORE.periodConfig = { cycleLength: 28, periodDuration: 5 };
  if (!STORE.favorites) STORE.favorites = [];
  if (!STORE.lastSeen) STORE.lastSeen = {};
  if (!STORE.stickers) STORE.stickers = [];
  if (!STORE.shadows) STORE.shadows = [];
  if (!STORE.taFavs) STORE.taFavs = [];
  if (!STORE.links) STORE.links = [];
  // 连结簿的预设标签（体感/推送/字卡/思念/感想）——只在缺失时补种
  if (!STORE.linkTags) STORE.linkTags = linkPresetTags();

  // Migrate old moments: likes from number → array (safe)
  try {
    if (STORE.moments && Array.isArray(STORE.moments)) {
      let migrated = false;
      STORE.moments.forEach(m => {
        if (!m || typeof m !== 'object') return;
        if (typeof m.likes === 'number') {
          const arr = [];
          for (let i = 0; i < m.likes; i++) arr.push({ liker: 'dream', timestamp: (m.timestamp || Date.now()) + i * 1000 });
          m.likes = arr;
          migrated = true;
        }
        if (!Array.isArray(m.likes)) m.likes = [];
        if (!Array.isArray(m.comments)) m.comments = [];
      });
      if (migrated) {
        const liked = [];
        STORE.moments.forEach(m => {
          if (m && Array.isArray(m.likes) && m.likes.some(l => l && l.liker === 'user')) liked.push(m.id);
        });
        STORE.likedMoments = liked;
      }
    }
  } catch(e) { console.warn('Moments migration error:', e); }

  // Seed demo moment from dream character (only once)
  const KEY_SEEDED = '********';
  if (!localStorage.getItem(KEY_SEEDED)) {
    localStorage.setItem(KEY_SEEDED, '1');
    const moments = STORE.moments || [];
    const now = Date.now();
    moments.push({
      id: 'seed_' + now,
      publisher: 'dream',
      content: '大家好！我是梦角～欢迎来到朋友圈！这里可以记录我们之间的点点滴滴 ✨',
      timestamp: now - 3600000,
      likes: [{ liker: 'dream', timestamp: now - 3000000 }],
      comments: [
        { commenter: 'dream', content: '欢迎大家的到来！一起玩耍吧～', timestamp: now - 3500000 }
      ],
      imageUrl: '',
      dreamProcessed: true,
    });
    STORE.moments = moments;
  }
}

// ============ App State ============
const state = {
  panelOpen: false,
  fsOpen: false,          // fullscreen view open
  fsView: null,           // 'cards' | 'settings' | null
  selectedCatId: null,
  selectedSubId: null,
  searchQuery: '',
  activeTimerId: null,
  isSending: false,
  readTimerId: null,
  typingTimerId: null,
  dreamPostTimerId: null,
  pendingReactionTimers: {},  // mid → timeoutId (delayed reaction to new moment)
  pendingCommentTimers: {},   // mid → timeoutId (delayed reply to comment)
  decayRounds: {},            // mid → number (in-memory, resets on refresh)
  diaryMonth: null,           // 'YYYY-MM' for calendar view
  diarySelectedDate: null,     // date shown in diary detail
  diaryFullscreenId: null,     // diary id opened in fullscreen reader/editor
  letterFullscreenId: null,
  letterDraft: null,
  letterRevealTimerId: null,
  linkSearch: '',              // 连结簿：搜索词（只重画列表，不重画整页）
  linkTagFilter: [],           // 连结簿：选中的标签 id（多选，"或"）
  linkEditorId: null,          // 连结簿：正在编辑的记录 id（null = 新增）
  diaryGenTimerId: null,      // setTimeout for dream diary generation
  checkinDate: null,          // 'YYYY-MM-DD' for checkin view
  checkinAutoTimerId: null,   // setTimeout for auto checkin
  dreamEventTimers: {},       // "eventId_dateStr_index" → timeoutId
  settingsSaveTimerId: null,
  settingsEngineTimerId: null,
  backfillPromise: null,
  shadowDetailId: null,       // shadowId opened in the 碎影 detail view
  shadowFilter: 'all',        // 'all' | 'fav' | 'c:<cid>'
  shadowSearch: '',
  shadowTimerId: null,        // 碎影走滚动间隔（nextAt），不进 dreamEventTimers 的当天固定槽位
  favTab: 'mine',             // 收藏夹页签：'mine' 我的收藏 | 'ta' TA 的收藏
};

var _pmImages = []; // temporary photo array for moments publish modal

// ============ Helpers ============
function genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }
function randomBetween(min,max) { return min+Math.random()*(max-min); }

function normalizeProbs(probs) {
  const sum=probs.reduce((a,b)=>a+b,0);
  if(sum===0) return [25,25,25,25];
  if(sum===100) return [...probs];
  const scaled=probs.map(p=>Math.round(p*100/sum));
  const diff=100-scaled.reduce((a,b)=>a+b,0);
  let maxIdx=0; for(let i=1;i<4;i++){if(scaled[i]>scaled[maxIdx])maxIdx=i;}
  scaled[maxIdx]=Math.max(0,scaled[maxIdx]+diff);
  return scaled;
}

function pickByProb(probs) {
  const sum=probs.reduce((a,b)=>a+b,0);
  if(sum<=0)return 0;
  let r=Math.random()*sum;
  for(let i=0;i<probs.length;i++){r-=probs[i];if(r<=0)return i;}
  return probs.length-1;
}

function weightedPick(items) {
  if(!items||items.length===0)return null;
  const total=items.reduce((s,it)=>s+(it.weight||1),0);
  if(total<=0)return items[0];
  let r=Math.random()*total;
  for(const it of items){r-=(it.weight||1);if(r<=0)return it;}
  return items[items.length-1];
}

function escapeHtml(str) {
  const d=document.createElement('div');d.textContent=str;return d.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// ============ Dream Behavior Engine: Seeded RNG ============
function seedRandom(seed) {
  // FNV-1a hash — a single character change flips ~half the output bits,
  // so "…_0" and "…_1" produce wildly different seeds for mulberry32.
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime (32-bit)
  }
  let state = h | 0;
  return function() {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============ Dream Behavior Engine: Global Overrides ============
let _timeOverride = null;
let _rngOverride = null;
const _origDateNow = Date.now.bind(Date);
const _origMathRandom = Math.random.bind(Math);

function setBackfillContext(timestamp, rngFn) {
  _timeOverride = timestamp;
  _rngOverride = rngFn;
  Date.now = function() { return _timeOverride; };
  Math.random = function() { return _rngOverride(); };
}

function clearBackfillContext() {
  Date.now = _origDateNow;
  Math.random = _origMathRandom;
  _timeOverride = null;
  _rngOverride = null;
}

// ============ Core: Visible cards ============
function getVisibleCards() {
  const categories=STORE.categories||[], subcategories=STORE.subcategories||[], cards=STORE.cards||[];
  const hiddenCats=new Set(categories.filter(c=>c.hidden).map(c=>c.id));
  const hiddenSubs=new Set(subcategories.filter(s=>s.hidden).map(s=>s.id));
  return cards.filter(c=>!hiddenCats.has(c.categoryId)&&!hiddenSubs.has(c.subcategoryId));
}

// ============ Core: Generate message ============
function generateMessage(opts) {
  opts = opts || {};
  // Doodle probability (configurable)
  var cfg = STORE.config || {};
  var doodleProb = ((cfg.prob?.doodle != null ? cfg.prob.doodle : 8) / 100);
  if (opts.allowDoodle && doodleProb > 0 && Math.random() < doodleProb) {
    const doodle = generateDoodle();
    if (doodle) return { doodle: doodle };
    // If mode 0 (placeholder), fall through to normal text
  }
  const visible=getVisibleCards();
  if(visible.length===0)return '【暂无可用字卡，请添加】';
  const cardProbs=cfg.cardCountProbs||[30,40,20,10];
  const count=pickByProb(cardProbs)+1;
  // 统一抽卡核心（全站"造话"的唯一入口）。
  // pyOn 为假时 composeText 短路、不消耗任何随机数 ⇒ 随机流与改动前逐字节一致。
  // 把已取到的 visible 传下去：getVisibleCards() 每次都 JSON.parse 整张字卡表，
  // 大库上约 3ms/次，绝不能在一次生成里解析两遍（交错 A/B 实测抓到的回归）。
  const comp = composeText(count, opts.surface || 'chat', null, visible);
  if (comp === null) return '';
  if (typeof opts.onMeta === 'function') opts.onMeta(comp);
  return comp.text;
}

// ============ Doodle Generator ============
function generateDoodle() {
  // Mode 0: tarot placeholder — not implemented
  // Mode 1: placeholder for future doodle types
  // Mode 2: random Chinese characters (current default)
  var mode = Math.floor(Math.random() * 3);
  if (mode === 0 || mode === 1) return null; // placeholder slots
  return generateDoodleChinese();
}

var DOODLE_COLORS = ['#e04040','#F8A050','#5b9bd5','#6cbf6c','#9b59b6','#e8923c','#2f8f8f'];
var DOODLE_EMOJIS = ['❤️','✨','💕','🌟','💫','🎀','🌸','🍀','💖','☀️'];

function generateDoodleChinese() {
  // Build Chinese character pool from all visible cards
  var visible = getVisibleCards();
  var pool = [];
  visible.forEach(function(c) {
    for (var i = 0; i < c.text.length; i++) {
      var ch = c.text.charAt(i);
      if (ch >= '一' && ch <= '鿿') pool.push(ch);
    }
  });
  if (pool.length === 0) pool = ['梦','角','日','向','翔','阳','小','鱼','字','卡']; // fallback
  var len = 3 + Math.floor(Math.random() * 4); // 3–6
  var text = '';
  for (var i = 0; i < len; i++) {
    text += pool[Math.floor(Math.random() * pool.length)];
  }
  // 10% chance to add emoji
  if (Math.random() < 0.1) {
    text += DOODLE_EMOJIS[Math.floor(Math.random() * DOODLE_EMOJIS.length)];
  }
  var color = DOODLE_COLORS[Math.floor(Math.random() * DOODLE_COLORS.length)];
  return { mode: 2, text: text, color: color };
}



// ============ 拼音组句 (Pinyin Compose) ============
// 机制：字卡文本 → 音节流(汉字→无调音节，"同音字折叠成同一状态") → 四引擎随机重组
//      → 同音字回填成汉字 → 成形(长度/黑名单/去重) → 交给既有 addMessage。
//      引擎丁（词级）不在这条链上：先用通用词表把文本切成"词"、按词级 n-gram 重组，
//      字是词自带的（跳过回填，否则回填会把词拆散）。详见下方"引擎丁"一节。
//
// 【本段是自包含的】与 app.js 其余部分只有四个耦合面：
//   1. getVisibleCards() / weightedPick() / pickByProb()  ── 抽卡与权重
//   2. STORE.config                                       ── 只经 pyCfg() 读取
//   3. Math.random()                                      ── 必须是"全局"调用，才能被
//                                                            setBackfillContext() 接管而可复现
//   4. composeText() / composeCardText()                  ── 对外只暴露这两个
// 移植到别的皮肤时：只改 pyCfg() 里的配置寻址 + PY_TABLE_RAW 的存放位置，其余逐字节照搬。

// 紧凑表：汉字(1字符) + 拼音(ASCII字母+声调数字)，自定界，无需分隔符。
// 1064 条 = 用户字卡语料的全集；347 个音节状态（同音折叠率 3.1x）。
var PY_TABLE_RAW = '"字zi4卡ka3我wo3你ni3分fen1未wei4组zu3不bu4的de5了le5好hao3一yi1在zai4宝bao3是shi4想xiang3要yao4有you3会hui4吗ma5么me5这zhe4就jiu4看kan4人ren2到dao4别bie2没mei2意yi4可ke3天tian1很hen3心xin1安an1都dou1着zhe5样yang4日ri4说shuo1点dian3个ge4来lai2色se4慰wei4主zhu3爱ai4什shen2起qi3得de2喜xi3以yi3欢huan1定ding4时shi2听ting1真zhen1还hai2话hua4阳yang2多duo1气qi4候hou4做zuo4今jin1那na4能neng2下xia4吧ba5呢ne5向xiang4事shi4也ye3怎zen3情qing2翔xiang2里li3让rang4小xiao3为wei4再zai4直zhi2哦o5陪pei2吃chi1等deng3开kai1对dui4给gei3啊a5边bian1身shen1过guo4亲qin1屈qu1记ji4爸ba4和he2问wen4累lei4上shang4生sheng1睡shui4出chu1道dao4见jian4梦meng4信xin4难nan2受shou4只zhi3但dan4回hui2啦la5知zhi1子zi3错cuo4发fa1觉jue2太tai4常chang2无wu2感gan3现xian4自zi4乖guai1理li3们men5去qu4息xi1力li4聊liao2试shi4帮bang1大da4明ming2需xu1用yong4把ba3走zou3够gou4后hou4坏huai4然ran2委wei3抱bao4忙mang2水shui3相xiang1绪xu4又you4害hai4己ji3肯ken3慢man4成cheng2刚gang1快kuai4努nu3晚wan3行xing2比bi3放fang4否fou3欲yu4占zhan4懂dong3空kong1手shou3死si3笑xiao4呀ya5找zhao3中zhong1作zuo4被bei4次ci4打da3服fu2更geng4全quan2所suo3习xi2正zheng4动dong4工gong1接jie1老lao3怕pa4如ru2醒xing3远yuan3注zhu4超chao1地di4狗gou3喝he1刻ke4乱luan4望wang4之zhi1笨ben4担dan1当dang1法fa3饭fan4复fu4关guan1哄hong1间jian1解jie3进jin4夸kua1每mei3同tong2永yong3总zong3办ban4棒bang4答da2该gai1哈ha1换huan4紧jin3苦ku3摸mo1婆po2准zhun3此ci3第di4脸lian3嗯en5偷tou1玩wan2希xi1系xi4些xie1应ying1猜cai1代dai4管guan3怀huai2家jia1哭ku1嘛ma5面mian4少shao3思si1疼teng2通tong1推tui1消xiao1休xiu1眼yan3已yi3早zao3最zui4备bei4传chuan2电dian4叫jiao4久jiu3满man3门men2前qian2声sheng1实shi2视shi4顺shun4题ti2头tou2完wan2忘wang4学xue2音yin1张zhang1重zhong4白bai2嘟du1跟gen1故gu4顾gu4怪guai4近jin4离li2厉li4利li4美mei3求qiu2揉rou2伤shang1舒shu1送song4诉su4跳tiao4贴tie1洗xi3新xin1讯xun4住zhu4熬ao2存cun2儿er2搞gao3告gao4惯guan4光guang1红hong2呼hu1花hua1混hun4活huo2急ji2靠kao4口kou3冷leng3亮liang4路lu4默mo4暖nuan3跑pao3欺qi1热re4书shu1输shu1算suan4随sui2痛tong4许xu3因yin1愿yuan4长chang2种zhong3昨zuo2蹭ceng4差cha4床chuang2待dai4东dong1逗dou4恶e4方fang1非fei1负fu4喊han3合he2嘿hei1几ji3加jia1娇jiao1教jiao4句ju4马ma3请qing3认ren4撒sa1失shi1世shi4特te4西xi1夜ye4于yu2鱼yu2与yu3啧ze2整zheng3转zhuan3足zu2变bian4才cai2尝chang2穿chuan1短duan3而er2烦fan2机ji1架jia4经jing1静jing4略lve4落luo4哪na3骗pian4屏ping2奇qi2强qiang2切qie4适shi4收shou1他ta1替ti4误wu4穴xue2疑yi2雨yu3站zhan4止zhi3保bao3贝bei4吵chao3处chu4戳chuo1胆dan3低di1掉diao4二er4反fan3高gao1果guo3孩hai2号hao4哼heng1及ji2级ji2假jia3交jiao1扣kou4赖lai4乐le4码ma3冥ming2旁pang2钱qian2轻qing1清qing1忍ren3任ren4软ruan3神shen2始shi3虽sui1讨tao3停ting2温wen1稳wen3写xie3辛xin1续xu4衣yi1由you2油you2原yuan2招zhao1照zhao4制zhi4败bai4包bao1遍bian4操cao1诚cheng2充chong1抽chou1醋cu4呆dai1蛋dan4斗dou4乎hu1划hua4慌huang1计ji4继ji4件jian4界jie4惊jing1睛jing1决jue2木mu4幕mu4拿na2脑nao3内nei4漂piao1频pin2容rong2傻sha3稍shao1深shen1十shi2躺tang3提ti2枉wang3味wei4像xiang4寻xun2延yan2游you2遇yu4冤yuan1澡zao3巴ba1百bai3半ban4背bei4本ben3冰bing1并bing4称cheng1持chi2聪cong1从cong2带dai4倒dao3调diao4盯ding1肥fei2风feng1敷fu1赶gan3干gan1歌ge1灌guan4何he2鸡ji1肩jian1将jiang1讲jiang3较jiao4结jie2尽jin3劲jin4晶jing1控kong4困kun4拉la1立li4链lian4量liang4缭liao2灵ling2留liu2买mai3冒mao4勉mian3名ming2命ming4磨mo2黏nian2弄nong4女nv3凭ping2且qie3趣qu4确que4谁shei2伸shen1释shi4守shou3数shu3帅shuai4索suo3它ta1坦tan3体ti3甜tian2统tong3透tou4娃wa2外wai4污wu1吸xi1戏xi4细xi4效xiao4谢xie4星xing1兴xing4幸xing4选xuan3训xun4衍yan3赢ying2允yun3暂zan4糟zao1者zhe3征zheng1证zheng4祝zhu4赚zhuan4仔zai3碍ai4伴ban4膀bang3报bao4必bi4表biao3搏bo2步bu4藏cang2衬chen4承cheng2迟chi2冲chong1除chu2创chuang4吹chui1粗cu1寸cun4哒da1淡dan4抖dou3饿e4噩e4福fu2改gai3糕gao1股gu3护hu4环huan2颊jia2奸jian1监jian1精jing1连lian2两liang3零ling2另ling4论lun4骂ma4眉mei2密mi4念nian4噢o1皮pi2屁pi4片pian4品pin3期qi1弃qi4歉qian4取qu3权quan2入ru4弱ruo4衫shan1食shi2属shu3松song1锁suo3探tan4突tu1往wang3位wei4喂wei4吻wen3午wu3先xian1线xian4享xiang3歇xie1羞xiu1宣xuan1压ya1厌yan4邀yao1议yi4淫yin2引yin3拥yong1友you3元yuan2运yun4杂za2指zhi3至zhi4周zhou1皱zhou4助zhu4抓zhua1专zhuan1桌zhuo1宗zong1祖zu3欸ei1按an4暗an4傲ao4拜bai4般ban1暴bao4爆bao4倍bei4奔ben1绷beng1蹦beng4壁bi4避bi4编bian1便bian4辨bian4部bu4菜cai4参can1苍cang1涔cen2馋chan2撑cheng1惩cheng2程cheng2仇chou2酬chou2触chu4窗chuang1脆cui4袋dai4单dan1挡dang3德de2灯deng1玷dian4刁diao1雕diao1督du1读du2肚du4度du4朵duo3尔er3罚fa2犯fan4符fu2甘gan1隔ge2各ge4根gen1勾gou1鼓gu3观guan1裹guo3汉han4憾han4夯hang1化hua4荒huang1恍huang3击ji1忌ji4坚jian1兼jian1简jian3建jian4奖jiang3骄jiao1脚jiao3截jie2姐jie3介jie4借jie4仅jin3境jing4纠jiu1疚jiu4局ju2具ju4君jun1扛kang2客ke4裤ku4况kuang4愧kui4懒lan3励li4联lian2料liao4淋lin2领ling3率lv4罗luo2猫mao1萌meng2眠mian2棉mian2免mian3秒miao3蔑mie4民min2谬miu4耐nai4男nan2您nin2诺nuo4偶ou3趴pa1爬pa2拍pai1排pai2朋peng2拼pin1扑pu1其qi2牵qian1欠qian4呛qiang1抢qiang3晴qing2惹re3柔rou2蕊rui3赛sai4伞san3删shan1扇shan4舍she3审shen3升sheng1湿shi1拾shi2式shi4漱shu4摔shuai1四si4俗su2碎sui4缩suo1塔ta3滩tan1烫tang4踢ti1挺ting3团tuan2腿tui3拖tuo1网wang3旺wang4唯wei2尾wei3窝wo1物wu4悟wu4犀xi1席xi2吓xia4限xian4象xiang4邪xie2修xiu1朽xiu3言yan2仰yang3腰yao1药yao4液ye4医yi1依yi1移yi2遗yi2椅yi3艺yi4易yi4阴yin1影ying3硬ying4右you4域yu4怨yuan4院yuan4跃yue4云yun2砸za2责ze2炸zha4粘zhan1涨zhang3震zhen4争zheng1忠zhong1终zhong1众zhong4装zhuang1壮zhuang4纵zong4阻zu3嘴zui3左zuo3坐zuo4唉ai1板ban3辈bei4彼bi3闭bi4憋bie1波bo1擦ca1灿can4厕ce4测ce4查cha2茶cha2唱chang4沉chen2虫chong2楚chu3喘chuan3闯chuang3唇chun2戴dai4滴di1底di3递di4丢diu1兜dou1段duan4堆dui1蹲dun1额e2翻fan1繁fan2啡fei1拂fu2抚fu3付fu4赴fu4盖gai4缸gang1宫gong1孤gu1骨gu3挂gua4逛guang4归gui1规gui1鬼gui3跪gui4滚gun3海hai3捍han4恒heng2厚hou4忽hu1虎hu3缓huan3谎huang3灰hui1浑hun2货huo4即ji2捡jian3荐jian4贱jian4健jian4降jiang4巾jin1襟jin1颈jing3景jing3揪jiu1救jiu4剧ju4距ju4咖ka1跨kua4辣la4烂lan4浪lang4劳lao2泪lei4怜lian2凉liang2谅liang4晾liang4龄ling2搂lou3旅lv3虑lv4麻ma2埋mai2漫man4懵meng3迷mi2悯min3模mo2某mou3目mu4慕mu4奶nai3恼nao3闹nao4年nian2牌pai2泡pao4佩pei4配pei4碰peng4平ping2契qi4器qi4巧qiao3倾qing1球qiu2曲qu1拳quan2饶rao2扰rao3扔reng1肉rou4三san1散san4沙sha1擅shan4使shi3市shi4室shi4誓shi4瘦shou4熟shu2瞬shun4酥su1素su4台tai2态tai4叹tan4逃tao2套tao4眺tiao4厅ting1哇wa1弯wan1微wei1围wei2卫wei4胃wei4谓wei4闻wen2夕xi1惜xi1晰xi1羡xian4香xiang1箱xiang1型xing2性xing4雪xue3循xun2讶ya4痒yang3耀yao4咦yi2抑yi4逸yi4隐yin3泳yong3诱you4语yu3浴yu4预yu4约yue1月yue4悦yue4越yue4增zeng1战zhan4掌zhang3障zhang4罩zhao4折zhe2珍zhen1阵zhen4支zhi1质zhi4置zhi4桩zhuang1状zhuang4追zhui1拙zhuo1遵zun1"';

// 语气字：只用于句尾收束，且会再与"语料里真实出现过的字"求交集，避免引入 AI 腔。
var PY_TAIL_CHARS = '呀啦呢哦吧啊嘛哟噢喔诶嗯哈嘿';

// 内置屏蔽词：随机重组极易撞出不雅词。用户可在设置页增删（逗号分隔）。
var PY_BLACKLIST_DEFAULT = '干你,操你,草你,日你,妈的,你妈,傻逼,沙比,煞笔,智障,白痴,贱人,去死,滚蛋,强奸,轮奸,淫贱,婊子,破鞋,杂种';

var PY_DEFAULTS = {
  on: false,            // 总开关（默认关：先在设置页工作台里试手感）
  ratio: 30,            // 聊天文本回复走拼音的百分比
  engine: 'markov',     // markov（乙，默认）| wordchain（丁）
  tempPct: 100,         // 引擎丁：随机度(%) —— 100=按语料频次正比挑"下一个词"；低=更爱挑高频备选（稳），高=更爱挑冷门备选（野）
  stripProper: true,    // 剔除专名：词库里的人名/地名/朝代/机构词不参与切词·接龙·换词（关=词库完整如初，一个字都没删）
  lenMin: 3,            // 生成句的音节数下限
  lenMax: 8,            // 上限
  clarity: 70,          // 口齿清晰度：以该概率回填"语料里该音节最高频的字"
  tone: 1,              // 同调优先：换字时不换声调
  surfaces: { chat: true },
  blacklist: [],        // 用户追加的屏蔽词
};

// 只剩两个引擎：乙（音节级 n-gram，默认）与丁（词级接龙）。
// 旧配置里存着 uniform / chunkchain 的，由 pyCfg 里那次 indexOf 检查自动归一成默认引擎 —— 不会白屏、不会报错。
var PY_ENGINES = ['markov', 'wordchain'];

// ---- 配置访问器：本段唯一读取 STORE.config 的地方 ----
function pyCfg() {
  var c = (STORE.config || {}).py || {};
  var d = PY_DEFAULTS;
  var eng = PY_ENGINES.indexOf(c.engine) >= 0 ? c.engine : d.engine;
  var lenMin = parseInt(c.lenMin, 10); if (!(lenMin >= 1)) lenMin = d.lenMin;
  var lenMax = parseInt(c.lenMax, 10); if (!(lenMax >= 1)) lenMax = d.lenMax;
  if (lenMin > lenMax) lenMax = lenMin;                 // 钳制：最少不得大于最多
  lenMin = Math.min(lenMin, 20); lenMax = Math.min(lenMax, 20);
  var ratio = parseInt(c.ratio, 10); if (isNaN(ratio) || ratio < 0) ratio = d.ratio;
  if (ratio > 100) ratio = 100;
  var clarity = parseInt(c.clarity, 10); if (isNaN(clarity) || clarity < 0) clarity = d.clarity;
  if (clarity > 100) clarity = 100;
  var tempPct = parseInt(c.tempPct, 10); if (isNaN(tempPct)) tempPct = d.tempPct;
  if (tempPct < 30) tempPct = 30; if (tempPct > 200) tempPct = 200;   // 随机度：30~200%
  // 只有显式 false 才算关：老配置里没有这个键 ⇒ 取默认（开）
  var stripProper = c.stripProper === false ? false : d.stripProper;
  var sur = c.surfaces && typeof c.surfaces === 'object' ? c.surfaces : d.surfaces;
  var bl = Array.isArray(c.blacklist) ? c.blacklist.filter(Boolean) : [];
  return {
    on: c.on === true, engine: eng, ratio: ratio, lenMin: lenMin, lenMax: lenMax,
    clarity: clarity, tone: c.tone === 0 ? 0 : 1, tempPct: tempPct, stripProper: stripProper,
    surfaces: { chat: sur.chat !== false },
    blacklist: bl,
  };
}

function pySurfaceOn(cfg, surface) {
  if (!surface) return false;
  return cfg.surfaces[surface] !== false;
}

// ---- 拼音表 ----
var _pyT = null;
function pyTables() {
  if (_pyT) return _pyT;
  var map = Object.create(null), byBase = Object.create(null), bases = [];
  var re = /([\u4e00-\u9fff])([a-z]+[1-5]?)/g, m;
  while ((m = re.exec(PY_TABLE_RAW))) {
    var ch = m[1], py = m[2];
    var tone = /[1-5]$/.test(py) ? py.slice(-1) : '5';
    var base = py.replace(/[1-5]$/, '');
    // 表按语料频次降序书写 ⇒ byBase[base][0] 天然就是"该音节最常用的那个字"
    map[ch] = { base: base, tone: tone };
    if (!byBase[base]) { byBase[base] = []; bases.push(base); }
    byBase[base].push(ch);
  }
  _pyT = { map: map, byBase: byBase, bases: bases };
  return _pyT;
}

// 汉字串 → 音节 token 流（'^' 句首 / '$' 句末 / 其余为无调音节）
function pyTokenize(text) {
  var t = pyTables(), s = String(text == null ? '' : text);
  var toks = ['^'], seg = 0;
  for (var i = 0; i < s.length; i++) {
    var e = t.map[s.charAt(i)];
    if (e) { toks.push(e.base); seg++; }
    else if (seg > 0) { toks.push('$'); if (toks[toks.length - 1] !== '^') toks.push('^'); seg = 0; }
  }
  if (seg > 0) toks.push('$');
  return toks;
}

// ---- 训练语料：可见字卡（weight 参与计数，"重点卡"口音更重） ----
function pyCorpus() {
  var cards = getVisibleCards(), out = [];
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    if (!c || !c.text) continue;
    var w = Math.max(1, Math.round(Number(c.weight) || 1));
    out.push({ text: String(c.text), w: w });
  }
  return out;
}

function pySignature(corpus) {
  var h = 2166136261, n = 0;
  for (var i = 0; i < corpus.length; i++) {
    var s = corpus[i].text + '#' + corpus[i].w, j;
    n += s.length;
    for (j = 0; j < s.length; j++) { h ^= s.charCodeAt(j); h = Math.imul(h, 16777619); }
  }
  return corpus.length + ':' + n + ':' + (h >>> 0);
}

var _pyModel = null;
var _pyRev = 0;          // 字卡/分类被写入时自增（见段末 pyHookStore）——O(1) 的缓存校验
var _pyHookOk = false;   // 包装成功=false 时退化为全量哈希校验（精确但慢 7ms）
function pyBump(tbl, key, next, w) {
  var row = tbl[key];
  if (!row) { row = tbl[key] = { list: [], idx: Object.create(null), total: 0 }; }
  var k = row.idx[next];
  if (k == null) { k = row.idx[next] = row.list.length; row.list.push([next, 0]); }
  row.list[k][1] += w; row.total += w;
}

function pyModelSig(cfg) {
  var tail = '|' + cfg.engine + '|' + cfg.lenMin + '|' + cfg.lenMax;
  if (_pyHookOk) return 'r' + _pyRev + tail;
  return 'h' + pySignature(pyCorpus()) + tail;
}

function pyBuildModel(cfg) {
  var sig = pyModelSig(cfg);
  if (_pyModel && _pyModel.sig === sig) return _pyModel.model;

  var corpus = pyCorpus();

  var uni = Object.create(null), bi = Object.create(null), tri = Object.create(null);
  var uniList = { list: [], idx: Object.create(null), total: 0 };
  var syllables = 0;

  for (var i = 0; i < corpus.length; i++) {
    var item = corpus[i], w = item.w;
    var toks = pyTokenize(item.text);
    // 过滤出真正的音节（去掉 ^/$）
    var syl = [];
    for (var k = 0; k < toks.length; k++) if (toks[k] !== '^' && toks[k] !== '$') syl.push(toks[k]);
    syllables += syl.length;
    if (syl.length === 0) continue;

    for (var a = 0; a < toks.length; a++) {
      if (toks[a] === '^' || toks[a] === '$') continue;
      pyBump(uni, toks[a], toks[a], w);           // 一元：音节自身频次
      if (a >= 1) pyBump(bi, toks[a - 1], toks[a], w);
      if (a >= 2) pyBump(tri, toks[a - 2] + '\u0001' + toks[a - 1], toks[a], w);
    }
  }

  // 字级 n-gram（同音字还原用）+ 音节 4/5/6-gram（抗复读用）+ 段尾音节统计（断句用）
  var chUni = Object.create(null), chBi = Object.create(null), chTri = Object.create(null);
  var chUniTotal = 0, chBiTotal = 0, chTriTotal = 0;
  var G4 = Object.create(null), G5 = Object.create(null), G6 = Object.create(null);
  var ends = Object.create(null);
  for (var ci = 0; ci < corpus.length; ci++) {
    var cw = corpus[ci].w, ct = String(corpus[ci].text), chs = ['^'];
    for (var cj = 0; cj < ct.length; cj++) chs.push(pyTables().map[ct.charAt(cj)] ? ct.charAt(cj) : '^');
    for (var ck = 1; ck < chs.length; ck++) {
      var cc = chs[ck]; if (cc === '^') continue;
      chUni[cc] = (chUni[cc] || 0) + cw; chUniTotal += cw;
      var cp1 = chs[ck - 1], cp2 = ck >= 2 ? chs[ck - 2] : '^';
      var kb = cp1 + '\u0001' + cc; chBi[kb] = (chBi[kb] || 0) + cw; chBiTotal += cw;
      var kt = cp2 + '\u0001' + cp1 + '\u0001' + cc; chTri[kt] = (chTri[kt] || 0) + cw; chTriTotal += cw;
    }
    var etoks = pyTokenize(ct), elast = null, csyl = [];
    for (var ea = 0; ea < etoks.length; ea++) {
      if (etoks[ea] === '^') continue;
      if (etoks[ea] === '$') { if (elast) ends[elast] = (ends[elast] || 0) + cw; elast = null; continue; }
      elast = etoks[ea]; csyl.push(etoks[ea]);
    }
    if (elast) ends[elast] = (ends[elast] || 0) + cw;
    for (var L4 = 4; L4 <= 6; L4++) {
      var dst = L4 === 4 ? G4 : (L4 === 5 ? G5 : G6);
      for (var s4 = 0; s4 + L4 <= csyl.length; s4++) dst[csyl.slice(s4, s4 + L4).join(' ')] = 1;
    }
  }

  // 一元表（用于回退：候选全被禁掉时兜底）
  var bases = pyTables().bases, bb;
  for (bb = 0; bb < bases.length; bb++) {
    var base = bases[bb];
    var row = uni[base];
    var cnt = row ? row.total : 0;
    if (cnt <= 0) continue;                        // 语料里没出现过的音节不参与生成
    uniList.list.push([base, cnt]); uniList.total += cnt;
  }

  _pyChar = { uni: chUni, bi: chBi, tri: chTri, uniTotal: chUniTotal, biTotal: chBiTotal, triTotal: chTriTotal };
  var model = {
    ok: uniList.list.length > 0,
    uni: uni, bi: bi, tri: tri, uniList: uniList,
    g4: G4, g5: G5, g6: G6, ends: ends,
    syllables: syllables, states: uniList.list.length,
  };
  _pyModel = { sig: sig, model: model };
  return model;
}

// ---- 加权抽样（消耗 Math.random，因此可被 setBackfillContext 复现） ----
function pyPickRow(row) {
  if (!row || !row.list.length || row.total <= 0) return null;
  var r = Math.random() * row.total;
  for (var i = 0; i < row.list.length; i++) { r -= row.list[i][1]; if (r <= 0) return row.list[i][0]; }
  return row.list[row.list.length - 1][0];
}

// 重复抑制：小语料上同一个音节容易连出很多次 —— 语料里只要有一张「啊啊啊」这类卡，
// bi('a')->'a' 的权重就会极高，实测吐出「啊啊啊啊啊啊啊啊」。同一音节连续出现上限压到 2。
// 注意：只"重抽几次"是不够的 —— 若该来源里只有 forbid 一个候选（tri('a|a') 就是这种），
// 重抽永远拿到同一个。所以本函数在"无替代"时返回 null，交由调用方退到更低阶来源，再不行就收尾。
function pyRowAlt(row, forbid) {
  if (!row || !row.total) return null;
  if (forbid == null) return pyPickRow(row);
  var hasAlt = false;
  for (var i = 0; i < row.list.length; i++) { if (row.list[i][0] !== forbid) { hasAlt = true; break; } }
  if (!hasAlt) return null;
  for (var t = 0; t < 4; t++) { var v = pyPickRow(row); if (v !== forbid) return v; }
  return null;
}

// 重复抑制（引擎丁专用）：一次禁掉【一批】词 —— 不只是"同一个词不许相邻"，还要挡住 A B A 折返。
// 根因：语料里「啦懂啦懂」「一忍一忍」这类复读卡，切成单字后 bi 表会学成 啦→懂 / 懂→啦 两条互指，
// 链条就在两个字之间来回弹（实测吐「啦懂啦，懂啦懂啦，懂啦懂啦懂」）。旧版只挡 A A，挡不住 A B A B。
// 一行都不许替代时返回 null，交由调用方退到更低阶来源，再不行就收尾（与 pyRowAlt 同一套语义）。
function pyRowAltNo(row, banned) {
  if (!row || !row.total) return null;
  var hasAlt = false;
  for (var i = 0; i < row.list.length; i++) { if (!banned[row.list[i][0]]) { hasAlt = true; break; } }
  if (!hasAlt) return null;
  for (var t = 0; t < 6; t++) { var v = pyPickRow(row); if (v && !banned[v]) return v; }
  return null;
}

// ---- 引擎乙：拼音 n-gram 马尔可夫链（tri → bi → uni 回退） ----
function pyGenMarkov(model, cfg) {
  var seq = [], prev2 = null, prev1 = '^', guard = 0;
  var cap = cfg.lenMax * 24 + 32;
  // 目标长度随机（与丁同一条口径）。旧实现是 while (seq.length < cfg.lenMax)，
  // 而 (tok === '$') 分支永远不会触发（见 pyEndProb 上方注释），实测 500/500 条都是 8 音节。
  var target = cfg.lenMin + Math.floor(Math.random() * (cfg.lenMax - cfg.lenMin + 1));
  var breaks = []; _pyBreaks = breaks;
  while (seq.length < target && guard++ < cap) {
    var key3 = prev2 != null ? prev2 + '\u0001' + prev1 : null;
    var forbid = (prev2 != null && prev1 === prev2) ? prev1 : null;   // 连续两次就压制第三次
    var deep = pyRunTail(model, seq);
    var tok = null;
    if (deep < 4 && key3 && model.tri[key3]) tok = pyRowAlt(model.tri[key3], forbid);
    if (tok == null && deep < 5 && model.bi[prev1]) tok = pyRowAlt(model.bi[prev1], forbid);
    if (tok == null) tok = pyRowAlt(model.uniList, forbid);
    if (tok == null && forbid != null) {
      // 所有来源都只有 forbid 一个选择：句子够长就收尾，不够长才勉强接受重复。
      if (seq.length >= cfg.lenMin) break;
      tok = forbid;
    }
    if (tok == null) break;
    if (tok === '$') {
      if (seq.length >= cfg.lenMin) break;
      prev2 = null; prev1 = '^'; continue;        // 太短：忽略句末，继续走
    }
    if (tok === '^') { prev2 = null; prev1 = '^'; continue; }
    seq.push(tok);
    prev2 = prev1; prev1 = tok;
  }
  pyPlanBreaks(model, seq, breaks);
  return seq;
}

// ---- 引擎丁：词级（词是有边界的：通用词表切分语料 → 词级 n-gram 重组） ----
// 上面那个音节级引擎（乙）只看见一串音节，不知道哪里是词头词尾。最典型的一串：
//   我在这里都你 = wo zai zhe li dou ni —— 每个字都对，但音节顺序本身不成词，
//   任何「换字」都救不回来（换大字表、给词奖金，输出逐字不变，已实测）。
// 所以词库的正确用法不是「帮回填选字」，而是【告诉模型词在哪】：
//   ① 用通用词表把每张字卡切成词（本仓语料 8741 token，其中 42.9% 是多字词）；
//   ② 按【词】建 tri→bi→uni 表，重组时以词为单位连接，词边界天然不被打散。
// 词表 py-lex.js 按需加载：只有选到本引擎才拉；没就绪时本次直接退回普通抽卡，其它引擎不受影响。
var PY_LEX_SRC = 'py-lex.js';
var _pyLexTbl = null;      // 解析后的词表 { map, byBase, words, len }
var _pyLexLoading = false;
var _pyWordModel = null;   // 词级模型缓存（语料签名一致即复用，与音节模型同一套失效钩子）

function pyLexTbl() { return _pyLexTbl; }

// 资源格式：t = 字表（汉字 + 无调拼音 + 声调数，按「该音节最常用字」在前排好）
//           w = 词表（先全部 2 字词，再 3 字词，再 4 字词，无分隔符）；n = 各组词数
function pyLexParse(raw) {
  if (!raw || !raw.t || !raw.w) return null;
  var map = Object.create(null), byBase = Object.create(null);
  var re = /([\u4e00-\u9fff])([a-z]+[1-5]?)/g, m;
  while ((m = re.exec(raw.t))) {
    var ch = m[1], py = m[2];
    var tone = /[1-5]$/.test(py) ? py.slice(-1) : '5';
    var base = py.replace(/[1-5]$/, '');
    map[ch] = { base: base, tone: tone };
    if (!byBase[base]) byBase[base] = [];
    byBase[base].push(ch);
  }
  var w = String(raw.w), counts = raw.n || [0, 0, 0], at = 0, words = Object.create(null), n = 0;
  for (var L2 = 2; L2 <= 4; L2++) {
    var cnt = counts[L2 - 2] || 0;
    for (var i = 0; i < cnt; i++) {
      var t = w.substr(at, L2); at += L2;
      if (t.length === L2) { words[t] = 1; n++; }
    }
  }
  // rawW / counts 留给「词库出词池」按组重建：组内已按词频降序 ⇒ 下标即常用度，不必额外存频率
  return { map: map, byBase: byBase, words: words, len: n, rawW: w,
    counts: [counts[0] || 0, counts[1] || 0, counts[2] || 0],
    bStr: raw.b ? String(raw.b) : '' };   // b = 专名剔除名单（"|" 分隔）；开关关了就是死数据，不生效
}

// ---- 「剔除专名」开关的运行时收口（2026-10-15）----
// 词库里的人名/地名/朝代/机构词随资产一起带在 b 字段里（不在资产里删词）。
// 开关打开 ⇒ 这些词【不参与】切词（pySegWords）、词级接龙骨架（骨架走切词）与同槽换词池。
// 关掉 ⇒ 词库完整如初。名单来自 _work/lex-keep.txt（允许表）与 _work/lex-strip-hist.txt（人工历史词）。
var _pyLexBlockSet = null, _pyLexBlockFor = null;
function pyLexApplyStrip(on) {
  var lex = _pyLexTbl;
  if (typeof on !== 'boolean') on = pyCfg().stripProper;
  if (!lex || !lex.bStr || !on) { _pyLexBlockSet = null; _pyLexBlockFor = !!lex && !!on; return; }
  if (_pyLexBlockFor === true && _pyLexBlockSet) return;      // 已按"开"建好
  var set = Object.create(null), arr = lex.bStr.split('|');
  for (var i = 0; i < arr.length; i++) if (arr[i]) set[arr[i]] = 1;
  _pyLexBlockSet = set; _pyLexBlockFor = true;
}
function pyLexBlocked(w) { return _pyLexBlockSet ? !!_pyLexBlockSet[w] : false; }

// 按需加载：返回 true = 现在就能用。已内联 window.PY_LEX_RAW（离线包 / 无 DOM 的测试环境）就直接解析。
function pyLexLoad() {
  if (_pyLexTbl) return true;
  if (typeof window !== 'undefined' && window.PY_LEX_RAW) {
    _pyLexTbl = pyLexParse(window.PY_LEX_RAW);
    if (_pyLexTbl) { window.PY_LEX_RAW = null; _pyWordModel = null; pyLexApplyStrip(); return true; }
  }
  if (_pyLexLoading) return false;
  if (typeof document === 'undefined' || !document.createElement || !document.head) return false;
  _pyLexLoading = true;
  var el = document.createElement('script');
  el.src = PY_LEX_SRC;
  el.async = true;
  el.onload = function () {                 // 只加载一次；之后由 SW 缓存，离线也可用
    _pyLexLoading = false;
    _pyLexTbl = pyLexParse(window.PY_LEX_RAW);
    _pyWordModel = null;                    // 词表到位 ⇒ 词级模型要重建
    pyLexApplyStrip();                      // 剔除名单同时就位
  };
  el.onerror = function () { _pyLexLoading = false; };
  document.head.appendChild(el);
  return false;
}

// 切词：最长匹配（4→2），都不中就让单字成词
function pySegWords(text) {
  var lex = _pyLexTbl;
  if (!lex) return [];
  var s = String(text == null ? '' : text).replace(/[^\u4e00-\u9fff]/g, '');
  var out = [], i = 0;
  while (i < s.length) {
    var hit = null;
    for (var L3 = Math.min(4, s.length - i); L3 >= 2; L3--) {
      var w = s.substr(i, L3);
      if (lex.words[w] && !pyLexBlocked(w)) { hit = w; break; }
    }
    if (hit) { out.push(hit); i += hit.length; }
    else { out.push(s.charAt(i)); i++; }
  }
  return out;
}

// 词级模型：以词为单位建表，结构照音节模型（复用 pyBump / pyRowAlt / pyPickRow）
function pyBuildWordModel(cfg) {
  var lex = _pyLexTbl;
  if (!lex) return null;
  var c0 = cfg || pyCfg();
  // 语料签名 + 随机度一起进签名：随机度变了采样分布就变（不写进签名会静默不生效）
  var sig = (_pyHookOk ? 'r' + _pyRev : 'h' + pySignature(pyCorpus())) + '|' + (c0.tempPct || 100) + '|' + (c0.stripProper === false ? 0 : 1);
  if (_pyWordModel && _pyWordModel.sig === sig) return _pyWordModel.model;

  var corpus = pyCorpus();
  var uni = Object.create(null), bi = Object.create(null), tri = Object.create(null);
  var uniList = { list: [], idx: Object.create(null), total: 0 };
  // endSet：语料里【真的出现在句尾】的词。收尾只许落在这些词后面 —— 否则"在真句尾收住"就是空话：
  // 一元兜底也能挑到句尾标记，那样最后那个词可能从没在你语料里当过句尾（实测 30/200 越界）。
  var endSet = Object.create(null);
  var tokens = 0, bigrams = 0, lenHist = [0, 0, 0], lenTot = 0;
  for (var i = 0; i < corpus.length; i++) {
    var w = corpus[i].w, raw = pySegWords(corpus[i].text);
    tokens += raw.length;
    // 句首 ^ / 句尾 $ 也要进表（音节级早就这么做，词级原来漏了）——
    // 这样"什么时候收尾"是【你语料的统计】，不是我硬编码的长度阈值。
    var toks = [String.fromCharCode(94)].concat(raw).concat([String.fromCharCode(36)]);
    if (raw.length) endSet[raw[raw.length - 1]] = 1;
    for (var a = 0; a < toks.length; a++) {
      pyBump(uni, toks[a], toks[a], w);
      if (toks[a].length >= 2 && toks[a].length <= 4) { lenHist[toks[a].length - 2]++; lenTot++; }
      if (a >= 1) pyBump(bi, toks[a - 1], toks[a], w);
      if (a >= 2) pyBump(tri, toks[a - 2] + '\u0001' + toks[a - 1], toks[a], w);
    }
    for (var b = 1; b < toks.length; b++) bigrams++;
  }
  var keys = Object.keys(uni);
  for (var q = 0; q < keys.length; q++) {
    var row = uni[keys[q]], cnt = row ? row.total : 0;
    if (cnt <= 0) continue;
    uniList.list.push([keys[q], cnt]); uniList.total += cnt;
  }

  // ---- 出词池已移除（2026-10-15）----
  // 旧实现把「字都在你语料里出现过」的 8383 个词库词做成同槽换词池（字数+首音节相同就换），
  // 用户实测出戏：原句「你特别好我特别喜欢」被换成「你特征好我特别戏曲…」。
  // 新引擎（pyGenWordchain）每一步都在语料自身的 tri→bi→uni 里挑"下一个词"，不需要这个池。
  var model = { ok: uniList.list.length > 0, uni: uni, bi: bi, tri: tri, uniList: uniList,
    tokens: tokens, bigrams: bigrams, words: uniList.list.length, lexLen: lex.len, endSet: endSet };
  _pyWordModel = { sig: sig, model: model };
  return model;
}

// 引擎丁：输入法式逐词采样（2026-10-15 重写；替换「语料骨架 + 同槽换词」）
// 为什么重写：旧实现先用你的字卡拼出骨架，再把面上的词按【字数相同 + 首音节相同】换成词库词 ——
//   用户实测出戏：原句「你特别好我特别喜欢」变成「你特征好我特别戏曲…」（特别→特征、喜欢→戏曲），
//   因为换词只约束读音、完全不看意思。新实现把"换词"整条路删掉，改成：
//   **每一步都算"梦角下一个词最可能是什么"**（tri→bi→uni 回退 + 频次加权采样），
//   就是输入法的备选词：每次可能挑到不同的词，但每个备选都出自 TA 自己的语料。
// 三道硬约束：① 禁相邻重复（前两格）② 禁词边界叠字（挡"发生+生活""别别处"）③ 不超目标字数。
// 收尾：只在语料里【真的作过句尾】的位置收（$ 也进表参与统计），并丢掉"只好/已经"这类虚词尾巴。
var PY_TRACE = null;   // 最近一次生成的挑词过程（工作台给用户看"输入法候选栏"用）
// ---- 防拼贴闸门：候选句与【任何一张字卡】的最长公共子串不得超过 copyMax(=0.6)×句长 ----
// 精确实现（不是近似）：令 k = floor(0.6×len)+1，则「最长公共子串 ≤ 0.6·len」⟺「句子的每个 k-gram 都没在语料里出现过」。
// 所以只需按 k 建一份语料 k-gram 集合（随语料签名缓存），查一条候选是 O(句长) 次哈希查找 —— 不需要 O(n²) LCS。
// 验收时另用独立 O(n²) LCS 复算一遍交叉验证（见 _work/verify-py-hnt.mjs M2）。
var _pyKgram = null, _pyKgramSig = '';
function pyCopyGate(text, cfg) {
  // 放行判据（2026-10-15 实测定档）：① 不是任何一张卡的子串 ② 最长公共子串 ≤ max(6, 0.6×句长)。
  // ⚠️ 为什么必须有 max(6,…) 这个绝对下限：只用"≤0.6×句长"时，默认句长 3~8 下的接受率只有 0.9%
  // （3 字句 1.9%）⇒ 端到端一半时候重掷用尽、退回字卡拼贴（正是用户最不想要的）。加下限后接受率 20%，
  // 配 25 次重掷成功率 99.5%/条。「整句不是你库里任何一张卡（或卡的一段）」这条独立判据仍 100% 成立：
  // 短句的相对重合率天然高（卡本身就短），那是"最短差异"的物理下限，不是放宽。
  var ratio = (cfg && cfg.copyMax != null) ? cfg.copyMax : 0.6;
  var absMax = (cfg && cfg.copyAbsMax != null) ? cfg.copyAbsMax : 6;
  var s = String(text == null ? '' : text).replace(/[^\u4e00-\u9fff]/g, '');
  if (s.length < 2) return false;                       // 单字不判（长度由 lenMin 管）
  var corpus = pyCorpus();
  for (var ci = 0; ci < corpus.length; ci++) {           // 整句就是某张卡，或是某张卡的一段 ⇒ 直接拒
    var ct = String(corpus[ci].text || '').replace(/[^\u4e00-\u9fff]/g, '');
    if (ct.indexOf(s) >= 0) return true;
  }
  var k = Math.floor(Math.max(absMax, ratio * s.length)) + 1;
  var sig = (_pyHookOk ? 'r' + _pyRev : 'h' + pySignature(corpus)) + '|' + k;
  if (_pyKgramSig !== sig) {
    var set = Object.create(null);
    for (var q = 0; q < corpus.length; q++) {
      var t = String(corpus[q].text || '').replace(/[^\u4e00-\u9fff]/g, '');
      for (var j = 0; j + k <= t.length; j++) set[t.substr(j, k)] = 1;
    }
    _pyKgram = set; _pyKgramSig = sig;
  }
  for (var i = 0; i + k <= s.length; i++) { if (_pyKgram[s.substr(i, k)]) return true; }
  return false;
}
var PY_DANGLING = '的了在是有和跟把被给对就都很也还而而且后前时地说着想会要能可那么这那吗呢吧啊呀嘛哦';
function pyGenWordchain(wm, cfg) {
  if (!wm || !wm.ok) return [];
  var T = (cfg && cfg.tempPct ? cfg.tempPct : 100) / 100;   // 随机度：小=贪心（爱挑高频），大=发散（爱挑冷门）
  var target = cfg.lenMin + Math.floor(Math.random() * (cfg.lenMax - cfg.lenMin + 1));
  var out = [], len = 0, prev2 = null, prev1 = null, guard = 0, cap = target * 8 + 24;
  var trace = [], ended = false;
  function harvest(row) {
    var cands = [], tot = 0;
    for (var i = 0; i < row.list.length; i++) {
      var w = row.list[i][0], c = row.list[i][1];
      if (prev1 != null && w === prev1) continue;
      if (prev2 != null && w === prev2) continue;
      if (w === '$') {
        if (len < cfg.lenMin) continue;
        // 只许在「你语料里真作过句尾」的词后面收，且不收虚词尾（"我就只好""我已经"那种被切断感）
        if (prev1 == null || !wm.endSet || !wm.endSet[prev1]) continue;
        if (prev1.length === 1 && PY_DANGLING.indexOf(prev1) >= 0) continue;
        c = c * (len >= cfg.lenMin + 2 ? 2.4 : 1.2);      // 够长了就鼓励收尾，太短别急着停
      } else if (w === '^') { continue; }
      else {
        if (len + w.length > target + 1) continue;        // 不超长（这一条也让"到量后"只剩收尾可选）
        var tail = prev1 != null ? prev1.charAt(prev1.length - 1) : null;
        if (tail != null && w.charAt(0) === tail) continue;   // 禁词边界叠字
      }
      var wt = Math.pow(c, 1 / T);
      cands.push([w, wt, c]); tot += wt;
    }
    return { cands: cands, tot: tot };
  }
  while (guard++ < cap) {
    var key3 = (prev2 != null && prev1 != null) ? prev2 + '\u0001' + prev1 : null;
    var tries = [];
    if (key3 && wm.tri[key3]) tries.push([wm.tri[key3], 'tri']);
    if (prev1 != null && wm.bi[prev1]) tries.push([wm.bi[prev1], 'bi']);
    if (!out.length) tries.push([wm.uniList, 'uni']);
    if (len >= target && !tries.length) tries.push([wm.uniList, 'uni']);   // 该收尾了：退回一元里找句尾
    var got = null, src = '', tot = 0;
    for (var t2 = 0; t2 < tries.length && !got; t2++) {
      var h = harvest(tries[t2][0]);
      if (h.cands.length) { got = h.cands; tot = h.tot; src = tries[t2][1]; }
    }
    if (!got) {
      if (len >= cfg.lenMin) { var h2 = harvest(wm.uniList); if (h2.cands.length) { got = h2.cands; tot = h2.tot; src = 'uni'; } }
      if (!got) break;
    }
    var r = Math.random() * tot, pick = got[got.length - 1][0];
    for (var q = 0; q < got.length; q++) { r -= got[q][1]; if (r <= 0) { pick = got[q][0]; break; } }
    trace.push({ src: src, tok: pick, cands: got.slice(0, 5).map(function (x) { return [x[0], x[2]]; }) });
    if (pick === '$') { ended = true; break; }
    if (pick === '^') continue;
    out.push(pick); len += pick.length; prev2 = prev1; prev1 = pick;
  }
  len = 0; for (var z = 0; z < out.length; z++) len += out[z].length;
  if (!ended || len < cfg.lenMin) { PY_TRACE = null; return []; }   // 没在真句尾收住 / 太短 ⇒ 让上层重掷
  PY_TRACE = trace;
  return out;
}
// 词级输出 → 音节流（落库的 py.syllables 与工作台调试用）
function pySyllablesOf(text) {
  var t = pyTables(), lex = _pyLexTbl, out = [];
  for (var i = 0; i < text.length; i++) {
    var e = t.map[text.charAt(i)] || (lex && lex.map[text.charAt(i)]);
    if (!e) return [];
    out.push(e.base);
  }
  return out;
}

// 字级 n-gram（同音字还原用）与本次生成的断句位
var _pyChar = null;
var _pyBreaks = [];

function pyCharScore(p2, p1, ch) {
  var M = _pyChar;
  if (!M) return 0;
  var k3 = p2 + '\u0001' + p1 + '\u0001' + ch;
  if (M.tri[k3]) return Math.log(M.tri[k3] / M.triTotal);
  var k2 = p1 + '\u0001' + ch;
  if (M.bi[k2]) return Math.log(M.bi[k2] / M.biTotal) - 2.5;
  if (M.uni[ch]) return Math.log(M.uni[ch] / M.uniTotal) - 5.0;
  return -14;
}

// 已经连续原样复刻了语料里几个音节的连续片段（4/5/6 档，其余为 0）
function pyRunTail(model, seq) {
  var n = seq.length;
  if (n >= 6 && model.g6[seq.slice(n - 6).join(' ')]) return 6;
  if (n >= 5 && model.g5[seq.slice(n - 5).join(' ')]) return 5;
  if (n >= 4 && model.g4[seq.slice(n - 4).join(' ')]) return 4;
  return 0;
}

// 语料里哪些音节常常是一段话的结尾（了/吗/吧/呀/呢/的…）。
// 注意：pyBuildModel 里 `if (toks[a] === '^' || toks[a] === '$') continue;` 让 $ 永远不会
// 成为任何表行的后继 ⇒ 三个引擎里的 if (tok === '$') 收尾分支从来没有执行过，
// 句长恒定、也没有标点。断句信号只能另算，这里用"段尾音节频率"。
function pyEndProb(model, syl) {
  var es = model.ends[syl], u = model.uni[syl];
  if (!es || !u || !u.total) return 0;
  return es / u.total;
}

// 断句位不随机切：挑"这个音节常常是段尾"的位置，逗号才会落在真正的停顿字后面，
// 而不是把词切成两半（实测逗号前的音节是 的/了/你/吗/好/吧…）。
function pyPlanBreaks(model, seq, breaks) {
  if (!seq || seq.length < 5) return;
  var want = seq.length >= 8 ? 2 : 1, cands = [];
  for (var p = 2; p <= seq.length - 2; p++) cands.push({ p: p, s: pyEndProb(model, seq[p - 1]) });
  cands.sort(function (a, b) { return b.s - a.s; });
  for (var i = 0; i < cands.length && breaks.length < want; i++) {
    if (cands[i].s < 0.12) break;                                     // 够不上停顿就不硬断
    var okp = true;
    for (var b2 = 0; b2 < breaks.length; b2++) if (Math.abs(breaks[b2] - cands[i].p) < 3) okp = false;
    if (okp) breaks.push(cands[i].p);
  }
  breaks.sort(function (a, b) { return a - b; });
}

// 把断句位落成全角逗号（跳过行首、不连出两个逗号）
function pyBreaksApply(text, breaks) {
  if (!breaks || !breaks.length || !text) return text;
  var out = '', bi = 0;
  for (var i = 0; i < text.length; i++) {
    while (bi < breaks.length && breaks[bi] <= i) {
      if (i > 0 && out.charAt(out.length - 1) !== '\uff0c') out += '\uff0c';
      bi++;
    }
    out += text.charAt(i);
  }
  return out;
}

// ---- 同音字回填：音节 → 汉字 ----
function pyBackfill(seq, cfg) {
  var t = pyTables();
  // 同音字还原：在同音字格上做 beam search，用【语料的真实用字习惯】（字级 tri→bi→uni）挑字，
  // 而不是每个音节独立取"全局最常用字"。旧实现还叠了 tone=1 的同调硬过滤，候选常被压成 1 个，
  // 于是 爸爸（语料里 9 张卡）必变 吧吧（0 张）、打你屁股 必变 大你皮故。
  var beam = [{ p2: '^', p1: '^', s: 0, out: '' }], K = 6;
  for (var i = 0; i < seq.length; i++) {
    var cands = t.byBase[seq[i]];
    if (!cands || !cands.length) continue;
    var canonical = cands[0];
    var cTone = t.map[canonical] ? t.map[canonical].tone : null;
    var nxt = [];
    for (var b = 0; b < beam.length; b++) {
      var st = beam[b];
      for (var j = 0; j < cands.length; j++) {
        var ch = cands[j];
        var sc = st.s + pyCharScore(st.p2, st.p1, ch);
        if (ch === canonical) sc += 0.45 * (cfg.clarity / 100);          // 口齿清晰：偏向最常用字
        // 同调：只能当"平局时的微弱倾向"。它拿"该音节最常用字的声调"当基准，而上面的
        // canonical 奖励用的也是同一个字 ⇒ 两项叠加 = +1.315，足以翻掉语境证据。
        // 实测「我关等了 / 我关灯了」：灯 的语境分本来高 0.684，却被翻成 等（语料里
        // 明明有「我关灯了哦」「记得关灯」，关等 0 张）。降到 0.3 后 灯 自己就赢，
        // 像话度同时从 77.2% 涨到 78.8%。
        if (cfg.tone && cTone != null && t.map[ch] && t.map[ch].tone === cTone) sc += 0.3;
        nxt.push({ p2: st.p1, p1: ch, s: sc, out: st.out + ch });
      }
    }
    nxt.sort(function (x, y) { return y.s - x.s; });
    beam = nxt.slice(0, K);
  }
  return beam.length ? beam[0].out : '';
}

// ---- 成形：收尾语气 / 黑名单 / 近期去重 ----
function pyBlacklist(cfg) {
  var all = PY_BLACKLIST_DEFAULT.split(',').concat(cfg.blacklist || []);
  var seen = Object.create(null), out = [];
  for (var i = 0; i < all.length; i++) {
    var w = String(all[i] || '').trim();
    if (!w || seen[w]) continue;
    seen[w] = 1; out.push(w);
  }
  return out;
}

function pyTailCandidates() {
  var t = pyTables(), out = [];
  for (var i = 0; i < PY_TAIL_CHARS.length; i++) {
    var ch = PY_TAIL_CHARS.charAt(i);
    if (t.map[ch]) out.push(ch);                              // 只用语料里真实出现过的语气字
  }
  return out;
}

function pyShape(text, cfg) {
  if (!text) return null;
  var bl = pyBlacklist(cfg), i;
  for (i = 0; i < bl.length; i++) if (text.indexOf(bl[i]) >= 0) return null;
  var tails = pyTailCandidates();
  if (tails.length && Math.random() < 0.35 && text.charAt(text.length - 1) !== tails[0]) {
    text += tails[Math.floor(Math.random() * tails.length)];
  }
  return text;
}

var _pyRecent = [];
function pyRecentHas(text) { return _pyRecent.indexOf(text) >= 0; }
function pyRecentPush(text) {
  _pyRecent.push(text);
  if (_pyRecent.length > 20) _pyRecent.shift();
}

// ---- 消息渲染件：拼音组句的消息在文字上方标拼音 ----
var PY_TONE_VOWELS = { a: 'aāáǎà', o: 'oōóǒò', e: 'eēéěè', i: 'iīíǐì', u: 'uūúǔù', 'ü': 'üǖǘǚǜ' };

// 声调符号标在哪个字母上：有 a/o/e 就标它，否则标最后一个 i/u/ü（iu 标 u、ui 标 i）。
function pyMarkedPinyin(base, tone) {
  var b = String(base == null ? '' : base).replace(/v/g, 'ü');
  var t = Number(tone) || 5;
  if (t < 1 || t > 4) return b;                       // 轻声（第五声）不标调
  var at = -1, i;
  if (b.indexOf('a') >= 0) at = b.indexOf('a');
  else if (b.indexOf('o') >= 0) at = b.indexOf('o');
  else if (b.indexOf('e') >= 0) at = b.indexOf('e');
  else for (i = b.length - 1; i >= 0; i--) if ('iuü'.indexOf(b.charAt(i)) >= 0) { at = i; break; }
  if (at < 0) return b;
  var row = PY_TONE_VOWELS[b.charAt(at)];
  if (!row) return b;
  return b.slice(0, at) + row.charAt(t) + b.slice(at + 1);
}

// 每个汉字包一层 ruby，标注的读音直接查表取"这个字自己"的读音，
// 所以与正文天然对齐，也不需要往消息里多存字段。
function pyRubyHTML(text) {
  var t = pyTables(), s = String(text == null ? '' : text), out = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i), e = t.map[ch], pool = e ? t.byBase[e.base] : null;
    if (!e) {
      // 词级引擎会用通用词表里的字（主表 1064 字之外），这里兜底查词表自带的字表
      var lx = pyLexTbl();
      if (lx && lx.map[ch]) { e = lx.map[ch]; pool = lx.byBase[e.base]; }
    }
    if (!e) { out += escapeHtml(ch); continue; }        // 逗号/未收录字原样输出
    // 该音节有多个同音字、而选中的不是最常用的那个 ⇒ 这个字是"按上下文挑的"，
    // 单独加 py-fix 类标橙。纯渲染期推导，消息里不用存任何东西，历史消息一样生效。
    var tuned = !!(pool && pool.length > 1 && pool[0] !== ch);
    out += '<ruby' + (tuned ? ' class="py-fix" title="按上下文挑的字（不是该音节最常用的字）"' : '')
         + '>' + escapeHtml(ch) + '<rt>' + pyMarkedPinyin(e.base, e.tone) + '</rt></ruby>';
  }
  return out;
}

function pyMsgBodyHTML(m) {
  return '<span class="py-tag">拼音组句</span><span class="py-ruby">' + pyRubyHTML(m && m.text) + '</span>';
}

// ---- 对外：拼音组句端到端 ----
function pyCompose(cfg) {
  var model = pyBuildModel(cfg);
  if (!model.ok) return null;
  // 重掷上限：丁 多了防拼贴闸门这一道，5 次不够（实测会用尽→退回拼贴，功亏一篑）；
  // 乙 保持 5 次不变 —— 它的输出与改动前逐字节相同是硬约束（见 M9），不许被这次改动波及。
  var pyMaxAtt = (cfg.engine === 'wordchain') ? 25 : 5;
  for (var attempt = 0; attempt < pyMaxAtt; attempt++) {
    var seq;
    if (cfg.engine === 'wordchain') {
      // 词级引擎不走「音节 → 回填」这条链：字是词自带的，回填只会把词拆散。
      var wm = pyBuildWordModel(cfg);
      if (!wm || !wm.ok) { pyLexLoad(); return null; }   // 词表未就绪：本次退回普通抽卡，同时开始加载
      var wtoks = pyGenWordchain(wm, cfg);
      if (!wtoks || !wtoks.length) continue;
      var wtext = wtoks.join('');
      if (wtext.length < cfg.lenMin) continue;
      var wsyl = pySyllablesOf(wtext);
      if (wsyl.length !== wtext.length) continue;        // 有字查不到读音：重掷（正常不该发生）
      _pyBreaks = [];
      // 逗号沿用音节模型的段尾统计，但把断点【吸附到词边界】—— 绝不把词切开
      var bnds = [], acc = 0;
      for (var wq = 0; wq < wtoks.length; wq++) { acc += wtoks[wq].length; bnds.push(acc); }
      var rawbr = [];
      pyPlanBreaks(model, wsyl, rawbr);
      for (var wr = 0; wr < rawbr.length; wr++) {
        var bestp = -1, bestd = 99;
        for (var wb = 0; wb + 1 < bnds.length; wb++) {
          var dd = Math.abs(bnds[wb] - rawbr[wr]);
          if (dd < bestd) { bestd = dd; bestp = bnds[wb]; }
        }
        if (bestp > 0 && _pyBreaks.indexOf(bestp) < 0) _pyBreaks.push(bestp);
      }
      var wshaped = pyShape(pyBreaksApply(wtext, _pyBreaks), cfg);
      if (!wshaped) continue;
      if (pyRecentHas(wshaped)) continue;
      if (pyCopyGate(wshaped, cfg)) continue;      // 防拼贴：与字卡重合过多 ⇒ 重掷
      pyRecentPush(wshaped);
      return { text: wshaped, detail: { engine: cfg.engine, syllables: wsyl, trace: PY_TRACE || [] } };
    }
    seq = pyGenMarkov(model, cfg);                            // 音节级只剩乙（_pyBreaks 由它内部设好）
    if (!seq || seq.length < 1) continue;
    if (seq.length < cfg.lenMin) continue;                    // 太短：重掷（三个引擎同一口径）
    var text = pyShape(pyBreaksApply(pyBackfill(seq, cfg), _pyBreaks), cfg);
    if (!text) continue;                                      // 黑名单命中 → 重掷
    if (pyRecentHas(text)) continue;                          // 近期说过 → 重掷
    pyRecentPush(text);
    return { text: text, detail: { engine: cfg.engine, syllables: seq } };
  }
  return null;                                                // 重掷用尽 → 上层退回普通抽卡
}

// ---- 对外：统一抽卡核心（本次重构的目标：让全站只有一处"造话"的地方） ----
function composeCardText(n, sep, visible) {
  // visible 允许由调用方传入：getVisibleCards() 每次都 JSON.parse 整张字卡表，
  // 大库上约 3ms/次，绝不能在一次生成里被解析两遍。
  if (visible == null) visible = getVisibleCards();
  if (!visible.length) return null;
  var count = Number(n) > 0 ? Math.floor(Number(n)) : 1;
  var picked = [];
  for (var i = 0; i < count; i++) { var c = weightedPick(visible); if (c) picked.push(c.text); }
  return picked.length ? picked.join(sep == null ? ' ' : sep) : null;
}

// surface 决定这一路是否允许拼音（默认只开 chat）；sep 供"批阅"这类用逗号拼接的场景沿用原样
function composeText(n, surface, sep, visible) {
  var cfg = pyCfg();
  // 注意：cfg.on 为假时"短路"，不消耗任何 Math.random —— 这是关闭态逐字节等价的保证
  if (cfg.on && pySurfaceOn(cfg, surface) && Math.random() * 100 < cfg.ratio) {
    var r = pyCompose(cfg);
    if (r) return { text: r.text, src: 'pinyin', py: r.detail };
  }
  var t = composeCardText(n, sep, visible);
  return t === null ? null : { text: t, src: 'card' };
}
// ---- 生成工作台（设置页内嵌；纯预览，不写 STORE.messages） ----
var PY_ENGINE_LABEL = { markov: '乙 · 拼音马尔可夫', wordchain: '丁 · 输入法式组句' };

function pyWorkbenchHTML() {
  return '<div class="py-wb">' +
    '<div class="py-wb-bar">' +
      '<button type="button" class="py-wb-btn" data-py-run="10">连出 10 条</button>' +
      '<button type="button" class="py-wb-btn py-wb-btn-2" data-py-run="compare">两引擎对比（各 8 条）</button>' +
    '</div>' +
    '<div class="py-wb-stat" id="pyWbStat"></div>' +
    '<div class="py-wb-out" id="pyWbOut"><div class="py-wb-hint">点上面按钮生成。这里只是预览，不会写进聊天记录；总开关关着也能试。</div></div>' +
  '</div>';
}

function pyBindWorkbench(container) {
  if (pyCfg().engine === 'wordchain') pyLexLoad();   // 已经选着词级：一进设置页就把词表拉起来
  var corpusBtn = container.querySelector('#cfgPyCorpusImport');
  if (corpusBtn) corpusBtn.addEventListener('click', function () { showCorpusImportModal(); });
  var out = container.querySelector('#pyWbOut');
  if (!out) return;
  var stat = container.querySelector('#pyWbStat');
  var btns = container.querySelectorAll('[data-py-run]');
  for (var b = 0; b < btns.length; b++) {
    btns[b].addEventListener('click', function () {
      var mode = this.getAttribute('data-py-run');
      var engines = mode === 'compare' ? PY_ENGINES.slice() : [pyCfg().engine];
      var n = mode === 'compare' ? 8 : 10;
      var html = '';
      for (var e = 0; e < engines.length; e++) {
        if (engines[e] === 'wordchain' && !pyLexTbl()) {          // 词表按需加载：别把"还没加载好"显示成"生成失败"
          pyLexLoad();
          html += '<div class="py-wb-col"><div class="py-wb-coltitle">' + PY_ENGINE_LABEL[engines[e]] +
            '</div><div class="py-wb-item py-wb-fail"><span class="py-wb-text">词表加载中（' + PY_LEX_SRC +
            '，约 160KB，只加载一次）…稍等再点按钮。</span></div></div>';
          continue;
        }
        var cfg = pyCfg(); cfg.engine = engines[e];               // 预览用当前设置，只覆盖引擎
        var rows = [];
        for (var i = 0; i < n; i++) {
          var r = pyCompose(cfg);
          if (r) {
            var tr = r.detail.trace || [];
            var trHtml = tr.length ? '<div class="py-wb-trace">' + tr.map(function (st, si) {
              return '<span class="py-wb-step">' + (si + 1) + '. ' + escapeHtml(st.tok) + ' ← ' +
                st.cands.map(function (cc) { return escapeHtml(cc[0]) + '(' + cc[1] + ')'; }).join(' ') + '</span>';
            }).join('') + '</div>' : '';
            rows.push('<div class="py-wb-item"><span class="py-wb-text">' + escapeHtml(r.text) +
              '</span><span class="py-wb-syl">' + escapeHtml(r.detail.syllables.join(' ')) + '</span>' + trHtml + '</div>');
          } else {
            rows.push('<div class="py-wb-item py-wb-fail"><span class="py-wb-text">（重掷用尽／语料不足 → 实盘会退回普通抽卡）</span></div>');
          }
        }
        html += '<div class="py-wb-col"><div class="py-wb-coltitle">' + PY_ENGINE_LABEL[engines[e]] + '</div>' + rows.join('') + '</div>';
      }
      out.innerHTML = '<div class="py-wb-cols">' + html + '</div>';
      if (stat) {
        var m = pyBuildModel(pyCfg());
        var wm2 = pyLexTbl() ? pyBuildWordModel() : null;
        stat.textContent = '语料 ' + pyCorpus().length + ' 卡 · 音节 ' + m.syllables + ' · 状态 ' + m.states +
          ' · 同音折叠 ' + (m.syllables && m.states ? (m.syllables / m.states).toFixed(1) : '-') + 'x' +
          (wm2 ? ' · 词 ' + wm2.words + '（词对 ' + wm2.bigrams + '）' : ' · 词表未加载');
      }
    });
  }
}

// ---- 缓存失效钩子 ----
// 本仓库的固定写法是"读副本 → 改 → 写回 STORE"，所以字卡/分类的任何改动都会经过 setter。
// 把这三个 setter 包一层拿版本号，缓存校验就是 O(1) 且精确的（不再需要每次扫全量文本）。
(function pyHookStore() {
  try {
    if (typeof STORE === 'undefined' || !STORE) return;
    var keys = ['cards', 'categories', 'subcategories'], wrapped = 0;
    for (var i = 0; i < keys.length; i++) {
      var d = Object.getOwnPropertyDescriptor(STORE, keys[i]);
      if (!d || typeof d.set !== 'function' || !d.configurable) continue;
      (function (key, desc) {
        Object.defineProperty(STORE, key, {
          configurable: true,
          enumerable: desc.enumerable,
          get: function () { return desc.get.call(this); },
          set: function (v) { desc.set.call(this, v); _pyRev++; }
        });
      })(keys[i], d);
      wrapped++;
    }
    _pyHookOk = (wrapped === keys.length);
  } catch (e) { _pyHookOk = false; }
})();

// 供判据/工作台强制重建模型用
function pyInvalidate() { _pyRev++; _pyModel = null; }
// ============ /拼音组句 ============

// ============ NetEase Song Share (网易云歌曲分享) ============
// 内置兜底歌单：接口不可用时从这里随机抽（ID 均取自用户歌单真实返回）
var BUILTIN_SONGS = [
  { id: '2650463511', name: 'Mado', artist: 'Fellsius' },
  { id: '2655065698', name: '你我经历的一刻', artist: 'ZaZaZsu咂咂苏' },
  { id: '2746516728', name: 'reflection pond', artist: 'frutiger pm' },
  { id: '3352994932', name: 'FUNK DO IENAI (Super Slowed)', artist: 'KPHK' },
  { id: '1488254752', name: 'Hello, World', artist: 'Louie Zong' },
  { id: '2626921879', name: 'BABYDOLL (Phonk)', artist: 'HAMZA INC./MIRBRO' },
  { id: '1975535749', name: 'Little Stupid Boy', artist: 'ARAI' },
  { id: '25884677', name: '仰望', artist: '杨丞琳' },
  { id: '3353165861', name: 'あのこ行方不明', artist: 'また切ない世界を生きる/結月ゆかり' },
  { id: '36103874', name: 'Trash Magic', artist: 'Lana Del Rey' },
  { id: '3360745106', name: 'Click Clack Symphony', artist: 'RAYE/Hans Zimmer' },
  { id: '3356257929', name: '画脂鏤氷', artist: 'かんてゐく/初音ミク' },
  { id: '3349348727', name: 'FUNK DO NEW JEANS', artist: '漂移的人' },
  { id: '2121640479', name: '明知故行', artist: '世界之外/横山克' },
  { id: '3357922714', name: '雪落银河', artist: '世界之外' },
  { id: '3316075721', name: '腐烂以后', artist: '泥酔巡遊' },
];

var NETESE_API_ENDPOINTS = [
  'https://api.injahow.cn/meting/?server=netease&type=playlist&id=',
  'https://api.i-meto.com/meting/api?server=netease&type=playlist&id=',
];

function getNeteaseConfig() {
  var n = (STORE.config || {}).netease || {};
  return {
    enabled: n.enabled !== false,
    prob: (typeof n.prob === 'number') ? n.prob : 12,
    playlistIds: Array.isArray(n.playlistIds) && n.playlistIds.length ? n.playlistIds : ['135597299'],
    builtinFallback: n.builtinFallback !== false,
  };
}

function songLink(song) {
  return 'https://y.music.163.com/m/song?id=' + (song.id || song.url_id || '');
}

// 从 Meting API 拉取歌单歌曲（多接口容错，兼容两种字段名格式）
function fetchPlaylistSongs(playlistId) {
  var attempts = NETESE_API_ENDPOINTS.map(function(base) { return base + encodeURIComponent(playlistId); });
  function tryNext(i) {
    if (i >= attempts.length) return Promise.reject(new Error('all endpoints failed'));
    return fetch(attempts[i], { timeout: 15000 })
      .then(function(resp) { if (!resp.ok) throw new Error('HTTP ' + resp.status); return resp.json(); })
      .then(function(list) {
        if (!Array.isArray(list) || !list.length) throw new Error('bad response');
        var songs = [];
        list.forEach(function(s) {
          var id = s.url_id || '';
          if (!id) {
            var m = String(s.url || '').match(/[?&]id=(\d+)/);
            if (m) id = m[1];
          }
          if (!id) return;
          songs.push({ id: id, name: String(s.name || s.title || ''), artist: String(s.artist || s.author || ''), cover: s.pic || '' });
        });
        return songs;
      })
      .catch(function(err) { return tryNext(i + 1); });
  }
  return tryNext(0);
}

// 刷新歌曲缓存（合并所有歌单，成功才写缓存，避免覆盖旧缓存）
function refreshSongCache() {
  var cfg = getNeteaseConfig();
  if (!cfg.enabled) return Promise.resolve(null);
  var fetches = cfg.playlistIds.map(function(id) { return fetchPlaylistSongs(id).catch(function() { return []; }); });
  return Promise.all(fetches).then(function(results) {
    var merged = [];
    var seen = {};
    results.forEach(function(list) {
      (list || []).forEach(function(s) {
        if (!seen[s.id]) { seen[s.id] = true; merged.push(s); }
      });
    });
    if (merged.length > 0) {
      STORE.songCache = { songs: merged, fetchedAt: Date.now() };
    }
    return merged;
  }).catch(function() { return []; });
}

// 随机抽一首歌：优先在线缓存（24h 内），否则内置兜底
function pickRandomSong() {
  var cache = STORE.songCache || {};
  var songs = (Array.isArray(cache.songs) && Date.now() - (cache.fetchedAt || 0) < 86400000) ? cache.songs : [];
  var pool = songs.length > 0 ? songs : BUILTIN_SONGS;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============ Core: Messages ============
function addMessage(type,text,timestamp,imageData,meta) {
  const messages=STORE.messages||[];
  const ts = timestamp || Date.now();
  var doodleData = null;
  if (text && typeof text === 'object' && text.doodle) {
    doodleData = text.doodle;
    text = ''; // text will be replaced by canvas
  }
  const msg = {id:genId(), type, text, timestamp: ts};
  if (doodleData) msg.doodle = doodleData;
  if (imageData) msg.imageData = imageData;
  // 生成来源：'card' | 'pinyin'。工作台展开推导过程 + 判据断言"这条真走了拼音"都要它。
  // STORE 是整对象 JSON 直存直取、没有字段白名单归一，所以新字段刷新后不丢。
  if (meta && meta.src) { msg.src = meta.src; if (meta.py) msg.py = meta.py; }
  // Recall decision for dream character messages only
  if (type === 'character') {
    const engCfg = (STORE.config||{}).dreamEngine || {};
    const prob = (engCfg.prob && engCfg.prob.recallProb != null) ? engCfg.prob.recallProb : 1;
    const roll = Math.random() * 100;
    msg.recall = { prob, decided: roll < prob, time: ts + Math.floor(Math.random() * 60000), executed: false };
    // Sticker probability for dream chat messages (not for review/doodle)
    if (!imageData && !doodleData) {
      const stickerProb = (engCfg.prob && engCfg.prob.dreamChatSticker != null) ? engCfg.prob.dreamChatSticker : 0;
      if (stickerProb > 0 && Math.random() * 100 < stickerProb) {
        var stickers = STORE.stickers || [];
        if (stickers.length > 0) {
          msg.imageData = stickers[Math.floor(Math.random() * stickers.length)].dataUrl;
        }
      }
    }
    // Song share probability (网易云随机歌曲，纯文字消息才挂)
    if (!imageData && !doodleData) {
      const ncfg = getNeteaseConfig();
      if (ncfg.enabled && ncfg.prob > 0 && Math.random() * 100 < ncfg.prob) {
        var song = pickRandomSong();
        if (song) msg.song = song;
      }
    }
    // 内心 OS 概率（与撤回/表情包/歌曲同型的"概率装饰"）：只给有正文的梦角文本消息挂。
    // 位置必须在正文抽完之后 —— 抽 OS 要消耗随机数，但正文此刻已经定了，所以正文逐字节不受影响（判据 O3）。
    if (!imageData && !doodleData && text) {
      const osCfg = (STORE.config || {}).prob || {};
      const osProb = (osCfg.os != null) ? osCfg.os : 10;
      if (osProb > 0 && Math.random() * 100 < osProb) {
        const osN = 2 + Math.floor(Math.random() * 3);      // 抽 2`4 张
        const osText = composeCardText(osN, null, null);    // 全站唯一抽卡核心（自带隐藏分组过滤）
        if (osText) { msg.os = osText; msg.osRead = false; msg.osOpen = false; }
      }
    }
    if (!state.isSending && (state.fsOpen || state.panelOpen)) {
      var toastText = text || '';
      if (doodleData) toastText = '[涂鸦]';
      else if (msg.imageData) toastText = '[表情包]';
      showMessageToast(toastText);
    }
  }
  messages.push(msg);
  STORE.messages=messages;
  appendMessageToDOM(msg);
  return msg;
}

async function sendBatch(batchCount) {
  if(state.isSending)return;
  state.isSending=true;
  showTypingIndicator();
  if(!_messageLoadingRow){
    showMessageLoadingBubble();
    await sleep(randomBetween(650,1100));
  }
  removeMessageLoadingBubble();
  for(let i=0;i<batchCount;i++){
    var compMeta=null;
    addMessage('character',generateMessage({allowDoodle:true, onMeta:function(m){compMeta=m;}}), null, null, compMeta);
    if(i<batchCount-1)await sleep(randomBetween(300,800));
  }
  hideIndicators();
  state.isSending=false;
}

// ============ Core: Active speaking (minutes) ============
function scheduleActive() {
  clearTimeout(state.activeTimerId); state.activeTimerId=null;
  const cfg=STORE.config||{};
  const timing=cfg.timing||{activeChat:{min:30,max:60}};
  const minMs=(timing.activeChat?.min||30)*60000;
  const maxMs=(timing.activeChat?.max||60)*60000;
  state.activeTimerId=setTimeout(async()=>{
    if(state.isSending){state.activeTimerId=setTimeout(()=>scheduleActive(),2000);return;}
    const probs=cfg.msgCountProbs||[30,40,20,10];
    await sendBatch(pickByProb(probs)+1);
    scheduleActive();
  },randomBetween(minMs,maxMs));
}

function stopActive() { clearTimeout(state.activeTimerId); state.activeTimerId=null; }

// ============ Core: Passive reply ============
async function triggerPassiveReply() {
  const cfg=STORE.config||{};
  const timing=cfg.timing||{passiveReply:{min:0.5,max:2.5}};
  const minMs=(timing.passiveReply?.min||0.5)*1000;
  const maxMs=(timing.passiveReply?.max||2.5)*1000;
  if(!state.isSending)showMessageLoadingBubble();
  await sleep(randomBetween(minMs,maxMs));
  if(state.isSending)await sleep(500);
  const probs=cfg.msgCountProbs||[30,40,20,10];
  await sendBatch(pickByProb(probs)+1);
  stopActive(); scheduleActive();
}

// ============ Indicators ============
function showReadIndicator() {
  const tags=document.querySelectorAll('#messagesArea .read-tag');
  if(tags.length>0){
    tags[tags.length-1].style.display='block';
  }
}

function showTypingIndicator() {
  const sub=document.querySelector('#chatTitles .ct-sub');
  if(sub){
    if(!sub.dataset.prevHtml)sub.dataset.prevHtml=sub.innerHTML;
    sub.textContent='正在输入中...';sub.style.animation='blink-text 1.2s infinite';
  }
}

function hideIndicators() {
  document.querySelectorAll('.read-tag').forEach(t=>t.style.display='none');
  const sub=document.querySelector('#chatTitles .ct-sub');
  if(sub){sub.innerHTML=sub.dataset.prevHtml||renderSubtitleHTML();sub.style.animation='';}
  clearTimeout(state.readTimerId); state.readTimerId=null;
  clearTimeout(state.typingTimerId); state.typingTimerId=null;
}

function scheduleIndicators() {
  hideIndicators();
  state.readTimerId=setTimeout(()=>{
    showReadIndicator();
    state.typingTimerId=setTimeout(showTypingIndicator,600);
  },400);
}

// ============ Recall Checker ============
function checkPendingRecalls() {
  const messages = STORE.messages || [];
  let changed = false;
  const now = Date.now();
  for (const m of messages) {
    if (m.type !== 'character') continue;
    if (!m.recall || !m.recall.decided || m.recall.executed) continue;
    if (m.recall.time <= now) {
      m.recall.executed = true;
      changed = true;
    }
  }
  if (changed) {
    STORE.messages = messages;
    try {
      var area = document.getElementById('messagesArea');
      var allKids = area.children;
      var msgIdx = 0;
      for (var i = 0; i < allKids.length && msgIdx < messages.length; i++) {
        var el = allKids[i];
        if (el.classList.contains('msg-time-divider')) continue;
        var m = messages[msgIdx];
        if (m && m.type === 'character' && m.recall && m.recall.executed && !m.doodle) {
          var newHtml = renderOneMessageHTML(m, msgIdx);
          var tmp = document.createElement('div');
          tmp.innerHTML = newHtml;
          el.parentNode.replaceChild(tmp.firstElementChild, el);
        }
        msgIdx++;
      }
    } catch(e) {
      console.warn('Surgical recall DOM update failed, falling back to full render');
      renderMessages();
    }
  }
}

// ============ Rendering: Messages ============
function getAvatarHTML() {
  const cfg=STORE.config||{};
  const charAv=cfg.avatarUrl||'', userAv=cfg.userAvatarUrl||'';
  return {
    char: charAv?`<img src="${escapeHtml(charAv)}" onerror="this.parentElement.textContent='🏐'">`:'🏐',
    user: userAv?`<img src="${escapeHtml(userAv)}" onerror="this.parentElement.textContent='🐟'">`:'🐟'
  };
}

// 内心 OS 的线描小气泡图标（stroke SVG，不用 emoji）：居中的圆角对话气泡 + 三个点 ——
// 14px 这个尺寸下，比"小云朵+尾点"的经典思想气泡清晰得多（后者会糊成一团、视觉重心也偏）。
var SVG_OS_BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M6.2 4.6h11.6a2.6 2.6 0 0 1 2.6 2.6v7.2a2.6 2.6 0 0 1-2.6 2.6h-4.3l-4.2 3.4v-3.4H6.2a2.6 2.6 0 0 1-2.6-2.6V7.2a2.6 2.6 0 0 1 2.6-2.6z"/>'
  + '<circle cx="8.7" cy="10.9" r="1.05" fill="currentColor" stroke="none"/>'
  + '<circle cx="12" cy="10.9" r="1.05" fill="currentColor" stroke="none"/>'
  + '<circle cx="15.3" cy="10.9" r="1.05" fill="currentColor" stroke="none"/>'
  + '</svg>';

function renderOneMessageHTML(m, idx) {
  const av = getAvatarHTML();
  const time = new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  if (m.type === 'shadow') {
    return `<div class="msg-row char shadow-row" data-msg-idx="${idx}">
      <div class="msg-avatar">${av.char}</div>
      <div class="msg-bubble shadow-bubble">${shadowCardHtml(m)}</div>
      <div class="msg-time">${time}</div></div>`;
  }
  if (m.review) {
    const r=m.review; const shared=r.sharedToMoments!==undefined?r.sharedToMoments:false;
    const reviews=STORE.reviews||{}; const rv=reviews.find(x=>x.id===r.id); const isShared=rv?rv.sharedToMoments:shared;
    return `<div class="msg-row char">
      <div class="msg-avatar">${av.char}</div>
      <div class="msg-bubble review-bubble">
        <div class="review-quote">💥 锐评"${escapeHtml(r.userInput)}"：</div>
        <div class="review-stars">${r.starsDisplay}</div>
        <div class="review-level">${r.level.text} ${r.level.emoji}</div>
        <div class="review-comment">评语：${escapeHtml(r.comment)}</div>
        <div class="review-actions">
          <button class="btn-share-review" data-rid="${r.id}" ${isShared?'disabled':''}>📤 ${isShared?'已分享':'分享到朋友圈'}</button>
          <button class="btn-ai-review" data-ai-target="review" data-rid="${r.id}">🤖 解读</button>
        </div>
        <div class="ai-box" data-ai-target="review" data-rid="${r.id}"></div>
      </div>
      <div class="msg-time">${time}</div></div>`;
  }
  if (m.recall && m.recall.executed) {
    return `<div class="msg-row char">
      <div class="msg-avatar">${av.char}</div>
      <div class="msg-bubble recall-bubble">对方撤回了一条消息</div>
      <div class="msg-time">${time}</div></div>`;
  }
  const isUser = m.type==='user';
  if (m.doodle && !isUser) {
    var cid = 'doodle_cv_' + idx;
    return `<div class="msg-row char" data-doodle-id="${cid}">
      <div class="msg-avatar">${av.char}</div>
      <div class="msg-bubble doodle-bubble" style="padding:6px 10px;background:rgba(255,255,255,0.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.7);border-radius:var(--radius-lg);border-bottom-left-radius:var(--radius-sm);">
        <canvas id="${cid}" width="260" height="180" style="display:block;border-radius:10px;max-width:100%;height:auto;"></canvas>
      </div>
      <div class="msg-time">${time}</div></div>`;
  }
  const aiBox = (!isUser && m.text) ? '<div class="ai-box" data-ai-target="chat" data-idx="'+idx+'"></div>' : '';
  const imgHtml = m.imageData
    ? '<div class="msg-photo"><img src="' + m.imageData + '" alt="图片" loading="lazy"></div>'
    : '';
  const songHtml = m.song
    ? '<a class="msg-song" href="' + songLink(m.song) + '" target="_blank">'
      + (m.song.cover ? '<img class="msg-song-cover" src="' + m.song.cover + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '<span class="msg-song-cover msg-song-cover-fallback">🎵</span>')
      + '<span class="msg-song-info"><span class="msg-song-name">' + escapeHtml(m.song.name || '未知歌曲') + '</span>'
      + '<span class="msg-song-artist">' + escapeHtml(m.song.artist || '未知歌手') + '</span></span>'
      + '<span class="msg-song-play">▶</span></a>'
    : '';
  const isPy = (m.src === 'pinyin') && !!m.text && (typeof pyRubyHTML === 'function');
  const bodyHtml = isPy ? pyMsgBodyHTML(m) : escapeHtml(m.text);
  // 内心 OS：气泡右上角一个小气泡（未读亮色 / 点开转淡），点开在气泡内展开一块。
  // 纯渲染期由消息字段推导（m.os / m.osRead / m.osOpen）⇒ 刷新后"未读还是已读、展开还是收起"都照旧。
  // 它是 .msg-bubble 的绝对定位子元素：气泡已是 position:relative 且无 overflow:hidden，溢到角上不会被裁，
  // DOM 结构与既有布局一个字不用改。
  const osHtml = (!isUser && m.os)
    ? '<button type="button" class="msg-os-bubble' + (m.osRead ? ' read' : '') + '" data-os-idx="' + idx + '" title="内心 OS" aria-label="内心 OS">' + SVG_OS_BUBBLE + '</button>'
      + '<div class="msg-os-box' + (m.osOpen ? ' show' : '') + '" data-os-box="' + idx + '">'
      + '<span class="msg-os-tag">' + SVG_OS_BUBBLE + '内心 OS</span>'
      + '<span class="msg-os-text">' + escapeHtml(m.os) + '</span>'
      + '</div>'
    : '';
  return `<div class="msg-row ${isUser?'user':'char'}" data-msg-idx="${idx}">
    <div class="msg-avatar">${isUser?av.user:av.char}</div>
    <div class="msg-bubble${isPy?' py-bubble':''}">${bodyHtml}${songHtml}${imgHtml}${osHtml}${aiBox}</div>
    <div class="msg-time">${time}</div></div>`
    + (isUser?'<div class="read-tag">已读</div>':'');
}

function renderMessages() {
  const area=document.getElementById('messagesArea');
  const messages=STORE.messages||[];
  if (messages.length===0) {
    area.innerHTML='<div class="msg-empty">开始对话吧</div>';
  } else {
    area.innerHTML = messages.map(function(m, idx) {
      const prev = idx > 0 ? messages[idx - 1] : null;
      var divider = '';
      if (prev && (m.timestamp - prev.timestamp) > 600000) {
        const t = new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
        divider = '<div class="msg-time-divider"><span class="divider-label">———— '+t+' ————</span></div>';
      }
      return divider + renderOneMessageHTML(m, idx);
    }).join('');
    drawAllDoodles(messages);
  }
  area.scrollTop=area.scrollHeight;
}

function getLastMessageTimestamp() {
  var msgs = STORE.messages || [];
  if (msgs.length === 0) return null;
  return msgs[msgs.length - 1].timestamp;
}

function drawAllDoodles(messages) {
  var doodles = [];
  messages.forEach((m, idx) => {
    if (m.doodle && m.type==='character') doodles.push({ id: 'doodle_cv_'+idx, doodle: m.doodle });
  });
  if (doodles.length === 0) return;
  // Ensure custom font is loaded before drawing
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('1em MengJiaoShouXie').then(function() {
      doodles.forEach(function(dc) { drawDoodleCanvas(dc.id, dc.doodle); });
    });
  } else {
    // Fallback for older browsers
    setTimeout(function() {
      doodles.forEach(function(dc) { drawDoodleCanvas(dc.id, dc.doodle); });
    }, 500);
  }
}

function appendMessageToDOM(m) {
  const area=document.getElementById('messagesArea');
  const idx = (STORE.messages||[]).length - 1;
  const prevTs = getLastMessagePreceding();
  // Clear empty state if present
  if (area.querySelector('.msg-empty')) area.innerHTML = '';
  // Insert time divider if gap > 10 minutes
  if (prevTs !== null && (m.timestamp - prevTs) > 600000) {
    const t = new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    var divEl = document.createElement('div');
    divEl.className = 'msg-time-divider';
    divEl.innerHTML = '<span class="divider-label">———— '+t+' ————</span>';
    area.appendChild(divEl);
  }
  const html = renderOneMessageHTML(m, idx);
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var row = tmp.firstElementChild;
  area.appendChild(row);
  // Draw doodle if needed
  if (m.doodle && m.type==='character') {
    drawDoodleCanvas('doodle_cv_'+idx, m.doodle);
  }
  area.scrollTop = area.scrollHeight;
}

var _messageLoadingRow = null;

function showMessageLoadingBubble() {
  const area=document.getElementById('messagesArea');
  if(!area)return;
  removeMessageLoadingBubble();
  if(area.querySelector('.msg-empty'))area.innerHTML='';
  const av=getAvatarHTML();
  const row=document.createElement('div');
  row.className='msg-row char msg-loading-row';
  row.innerHTML='<div class="msg-avatar">'+av.char+'</div><div class="msg-bubble"><span class="msg-loading" aria-label="正在输入"><i></i><i></i><i></i></span></div>';
  area.appendChild(row);
  _messageLoadingRow=row;
  area.scrollTop=area.scrollHeight;
}

function removeMessageLoadingBubble() {
  const row=_messageLoadingRow||document.querySelector('#messagesArea .msg-loading-row');
  if(row)row.remove();
  _messageLoadingRow=null;
}

// Returns the PREVIOUS message's timestamp (before the one about to be appended)
function getLastMessagePreceding() {
  var msgs = STORE.messages || [];
  if (msgs.length <= 1) return null;
  return msgs[msgs.length - 2].timestamp;
}

// ============ Doodle Canvas Drawing ============
function drawDoodleCanvas(canvasId, doodle) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  // Transparent background — leave blank (white-ish)
  ctx.clearRect(0, 0, W, H);

  var text = doodle.text;
  var color = doodle.color || '#e04040';
  var maxWidth = W - 20; // 10px margin each side

  var fontFamily = '"MengJiaoShouXie", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif';

  // Find font size that fits
  var fontSize = 52;
  ctx.font = fontSize + 'px ' + fontFamily;
  while (fontSize > 24 && ctx.measureText(text).width > maxWidth) {
    fontSize--;
    ctx.font = fontSize + 'px ' + fontFamily;
  }
  // Random jitter ±4px
  fontSize += Math.floor(Math.random() * 9) - 4;
  ctx.font = fontSize + 'px ' + fontFamily;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);
}

// ============ Rendering: Header ============
function renderSubtitleHTML() {
  const cfg=STORE.config||{};
  return '<span class="ct-star">★</span> 与'+(cfg.userNickname||'我')+'的小窝 <span class="ct-star">★</span>';
}

function renderHeader() {
  const cfg=STORE.config||{};
  const main=document.querySelector('#chatTitles .ct-main');
  if(main)main.textContent=cfg.characterName||'日向翔阳';
  const sub=document.querySelector('#chatTitles .ct-sub');
  if(sub)sub.innerHTML=renderSubtitleHTML();
}

// ============ Red Dot System ============
function getDotKey(viewId) {
  if (viewId === 'moments') return 'moments';
  if (viewId === 'diary') return 'diary';
  if (viewId === 'checkin') return 'checkin';
  if (viewId === 'letters') return 'letters';
  if (viewId === 'shadows') return 'shadows';
  if (viewId === 'favorites') return 'favorites';
  return null;
}

function getNewestTimestamp(viewId) {
  var latest = 0;
  if (viewId === 'moments') {
    var moments = STORE.moments || [];
    moments.forEach(function(m) {
      if (m.publisher === 'dream' && m.timestamp > latest) latest = m.timestamp;
      (m.comments || []).forEach(function(c) {
        if (c.commenter === 'dream' && m.publisher !== 'dream' && c.timestamp > latest) latest = c.timestamp;
      });
    });
  } else if (viewId === 'diary') {
    var diaries = STORE.diaries || [];
    diaries.forEach(function(d) {
      if (d.author === 'dream' && d.createdAt > latest) latest = d.createdAt;
      (d.comments || []).forEach(function(c) {
        if (c.author === 'dream' && d.author !== 'dream' && c.timestamp > latest) latest = c.timestamp;
      });
    });
  } else if (viewId === 'checkin') {
    var checkins = STORE.checkins || [];
    checkins.forEach(function(c) {
      if (c.role === 'dream' && c.timestamp > latest) latest = c.timestamp;
    });
  } else if (viewId === 'letters') {
    var letters = STORE.letters || [];
    letters.forEach(function(l) {
      (l.annotations || []).forEach(function(a) {
        if (a.visible && a.dueAt && a.dueAt > latest) latest = a.dueAt;
      });
    });
  } else if (viewId === 'shadows') {
    (STORE.shadows || []).forEach(function(s) {
      if (s && !s.deleted && s.createdAt > latest) latest = s.createdAt;
    });
  } else if (viewId === 'favorites') {
    // 「TA 的收藏」有新收藏时给收藏夹入口加红点（「我的收藏」是用户自己点的，不打扰）
    (STORE.taFavs || []).forEach(function(f) {
      if (f && f.createdAt > latest) latest = f.createdAt;
    });
  }
  return latest;
}

function updateRedDots() {
  var lastSeen = STORE.lastSeen || {};
  var anyDot = false;
  ['moments', 'diary', 'checkin', 'letters', 'shadows', 'favorites'].forEach(function(viewId) {
    var dotKey = getDotKey(viewId);
    var newest = getNewestTimestamp(viewId);
    var seen = lastSeen[dotKey] || 0;
    var show = newest > seen;
    // Panel item dot
    var panelDot = document.querySelector('[data-dot-view="' + viewId + '"]');
    if (panelDot) panelDot.style.display = show ? '' : 'none';
    if (show) anyDot = true;
  });
  // Menu button dot
  var menuDot = document.getElementById('menuBtnDot');
  if (menuDot) menuDot.style.display = anyDot ? '' : 'none';
}

function markSeen(viewId) {
  var dotKey = getDotKey(viewId);
  if (!dotKey) return;
  var lastSeen = STORE.lastSeen || {};
  lastSeen[dotKey] = Date.now();
  STORE.lastSeen = lastSeen;
  updateRedDots();
}

// ============ Side Panel ============
function openPanel() {
  updateRedDots();
  state.panelOpen=true;
  document.getElementById('sidePanel').classList.add('open');
  document.getElementById('menuOverlay').classList.add('show');
  document.getElementById('btnMenu').textContent='✕';
  if(state.selectedCatId===null){
    const cats=STORE.categories||[];
    if(cats.length>0)state.selectedCatId=cats[0].id;
  }
}

function closePanel() {
  state.panelOpen=false;
  document.getElementById('sidePanel').classList.remove('open');
  document.getElementById('menuOverlay').classList.remove('show');
  document.getElementById('btnMenu').textContent='☰';
}

// ============ Fullscreen View ============
function openFullscreen(viewId) {
  markSeen(viewId); // clear red dot for this view
  closePanel(); // close bottom panel first
  state.fsOpen=true;
  state.fsView=viewId;
  const fs=document.getElementById('fullscreenView');
  fs.classList.add('open');
  const body=document.getElementById('fsBody');

  if(viewId==='cards'){
    document.getElementById('fsTitle').textContent='字卡库管理';
    renderCardManager(body);
  } else if(viewId==='settings'){
    document.getElementById('fsTitle').textContent='梦角设置';
    renderSettings(body);
  } else if(viewId==='moments'){
    document.getElementById('fsTitle').textContent='朋友圈';
    renderMoments(body);
  } else if(viewId==='diary'){
    document.getElementById('fsTitle').textContent='日记本';
    renderDiary(body);
  } else if(viewId==='letters'){
    document.getElementById('fsTitle').textContent='写信';
    renderLetters(body);
  } else if(viewId==='checkin'){
    document.getElementById('fsTitle').textContent='打卡';
    renderCheckin(body);
  } else if(viewId==='period'){
    document.getElementById('fsTitle').textContent='经期记录';
    renderPeriodTracker(body);
  } else if(viewId==='favorites'){
    document.getElementById('fsTitle').textContent='收藏夹';
    renderFavorites(body);
  } else if(viewId==='memory'){
    document.getElementById('fsTitle').textContent='记忆库管理';
    renderMemoryLibrary(body);
  } else if(viewId==='shadows'){
    document.getElementById('fsTitle').textContent='碎影';
    state.shadowDetailId=null;
    renderShadows(body);
  } else if(viewId==='links'){
    document.getElementById('fsTitle').textContent='连结簿';
    renderLinks(body);
  }
}

function closeFullscreen() {
  cmHidePop();
  var backBtn = document.getElementById('btnBackToChat');
  if (backBtn) backBtn.textContent = '← 返回聊天';
  if (state.fsView === 'letters') {
    state.letterFullscreenId = null;
    state.letterDraft = null;
  }
  if (state.fsView === 'shadows') {
    state.shadowDetailId = null;
    state.shadowSearch = '';
  }
  if (state.fsView === 'links') {
    state.linkSearch = '';
    state.linkTagFilter = [];
    state.linkEditorId = null;
  }
  state.fsOpen=false;
  state.fsView=null;
  document.getElementById('fullscreenView').classList.remove('open');
  updateRedDots();
}

// ============ Rendering: Card Manager ============
var cmPopover = null;

function cmHidePop() {
  if (cmPopover) { cmPopover.remove(); cmPopover = null; }
}

function cmShowPop(el, type) {
  cmHidePop();
  var rect = el.getBoundingClientRect();
  // Check hidden state
  var isHidden = false;
  if (type === 'cat') { var cats=STORE.categories||[], c=cats.find(x=>x.id===el.dataset.catId); if(c) isHidden=c.hidden; }
  else { var subs=STORE.subcategories||[], s=subs.find(x=>x.id===el.dataset.subId); if(s) isHidden=s.hidden; }
  var eyeIcon = isHidden ? '👁️‍🗨️' : '👁️';

  var pop = document.createElement('div');
  pop.className = 'cm-popover';
  pop.style.left = Math.round(rect.left + rect.width / 2) + 'px';
  pop.style.top = Math.round(rect.bottom + 6) + 'px';
  pop.style.transform = 'translateX(-50%)';
  pop.innerHTML =
    '<button class="cm-pop-btn cm-pop-eye" title="显示/隐藏">'+eyeIcon+'</button>' +
    '<button class="cm-pop-btn cm-pop-rename" title="重命名">✏️</button>' +
    '<button class="cm-pop-btn cm-pop-danger cm-pop-del" title="删除">🗑️</button>';
  pop.dataset.type = type;
  pop.dataset.id = el.dataset.catId || el.dataset.subId || '';
  document.body.appendChild(pop);
  cmPopover = pop;
  requestAnimationFrame(function() {
    var pr = pop.getBoundingClientRect();
    if (pr.right > window.innerWidth - 8) { pop.style.left = (window.innerWidth - pr.width - 8) + 'px'; pop.style.transform = 'none'; }
    if (pr.left < 8) { pop.style.left = '8px'; pop.style.transform = 'none'; }
  });
}

function renderCardManager(container) {
  var backBtn = document.getElementById('btnBackToChat');
  if (backBtn) backBtn.textContent = '✕';

  container.innerHTML=`
    <div class="cards-toolbar">
      <button class="tb-btn" id="tbAddCard">＋ 添加</button>
      <button class="tb-btn" id="tbBatch">📋 批量导入</button>
      <button class="tb-btn" id="tbExport">📥 导出</button>
      <button class="tb-btn" id="tbImport">📤 导入</button>
    </div>
    <input type="text" class="tb-search" id="tbSearch" placeholder="🔍 搜索字卡…" value="${escapeHtml(state.searchQuery)}" style="margin:2px 14px 4px;width:calc(100% - 28px);flex-shrink:0;">
    <div class="cat-tabs" id="catTabs"></div>
    <div class="cat-tabs cat-tabs-special" id="catTabsSpecial"></div>
    <div class="subcat-row" id="subcatRow"></div>
    <div class="card-count-info" id="cardCountInfo"></div>
    <div class="card-list" id="cardList"></div>`;

  bindCardManagerEvents(container);
  renderCatTabs(); renderSubchips(); renderCardItems();
}

function renderCatTabs() {
  const ct=document.getElementById('catTabs'); if(!ct)return;
  // 「TA 收下的话」不混在第一行 —— 它在下面单独一行，避免和用户自己的分类混淆
  const cats=(STORE.categories||[]).filter(c=>c.id!==TAF_CAT_ID);
  ct.innerHTML=cats.map(c=>{
    const active=state.selectedCatId===c.id?' active':'';
    const hidden=c.hidden?' hidden':'';
    const cnt=(STORE.cards||[]).filter(card=>card.categoryId===c.id).length;
    return `<span class="cat-tab${active}${hidden}" data-cat-id="${c.id}">
      ${escapeHtml(c.name)}<span class="cat-badge">${cnt}</span></span>`;
  }).join('')+'<button class="btn-new-cat" id="btnNewCat">＋ 新建大类</button>';
  renderCatTabsSpecial();
}

// 第二行：TA 收下的话（仅当该大类存在时渲染）
function renderCatTabsSpecial() {
  const row=document.getElementById('catTabsSpecial'); if(!row)return;
  row.innerHTML=taFavSecondRowHtml();
  row.style.display=row.innerHTML?'':'none';
}

function renderSubchips() {
  const row=document.getElementById('subcatRow'); if(!row)return;
  const subs=STORE.subcategories||[];
  const filtered=state.selectedCatId?subs.filter(s=>s.categoryId===state.selectedCatId):[];
  row.innerHTML=filtered.map(s=>{
    const active=state.selectedSubId===s.id?' active':'';
    const hidden=s.hidden?' hidden':'';
    return `<span class="subcat-chip${active}${hidden}" data-sub-id="${s.id}">${escapeHtml(s.name)}</span>`;
  }).join('')+(state.selectedCatId?'<button class="btn-new-subcat" id="btnNewSub">＋ 新建小类</button>':'<span style="font-size:11px;color:var(--text-muted);padding:3px 8px;">← 请先选择大类</span>');
}

function renderCardItems() {
  const list=document.getElementById('cardList'); if(!list)return;
  var allCards=STORE.cards||[];
  var catCards=allCards, subCards=allCards;
  if(state.selectedCatId){catCards=allCards.filter(c=>c.categoryId===state.selectedCatId);subCards=catCards;}
  if(state.selectedSubId)subCards=catCards.filter(c=>c.subcategoryId===state.selectedSubId);
  var cards=subCards;
  const q=state.searchQuery.trim().toLowerCase();
  if(q)cards=cards.filter(c=>c.text.toLowerCase().includes(q));

  // Update count info
  var ci=document.getElementById('cardCountInfo');
  if(ci){
    var parts=[];
    if(state.selectedCatId){var cats=STORE.categories||[], catName=(cats.find(c=>c.id===state.selectedCatId)||{}).name||'?';parts.push('“'+catName+'”共 '+catCards.length+' 条');}
    if(state.selectedSubId){var subs=STORE.subcategories||[], subName=(subs.find(s=>s.id===state.selectedSubId)||{}).name||'?';parts.push('“'+subName+'”'+subCards.length+' 条');}
    ci.textContent=parts.join(' · ')||'全部字卡共 '+allCards.length+' 条';
  }

  if(cards.length===0){list.innerHTML='<div class="card-empty">暂无字卡，点击 ＋添加</div>';return;}

  list.innerHTML=cards.map(c=>{
    const w=c.weight||1;
    const wc=w>=5?'weight-5':w>=4?'weight-4':w>=3?'weight-3':w>=2?'weight-2':'weight-1';
    const noteHtml=taFavCardNoteHtml(c);
    return `<div class="card-item${noteHtml?' card-item-tafav':''}" data-card-id="${c.id}">
      <span class="card-text" title="${escapeHtml(c.text)}">${escapeHtml(c.text)}</span>
      <span class="card-weight" data-card-id="${c.id}" title="点击+1权重">
        <span class="weight-star">⭐</span><span class="weight-num ${wc}">${w}</span></span>
      <button class="btn-card-act btn-card-edit" data-card-id="${c.id}" title="编辑">✏️</button>
      <button class="btn-card-act btn-card-del" data-card-id="${c.id}" title="删除">🗑️</button>${noteHtml}</div>`;
  }).join('');
}

function bindCardManagerEvents(container) {
  container.querySelector('#tbAddCard').addEventListener('click',showAddCardModal);
  container.querySelector('#tbBatch').addEventListener('click',showBatchImportModal);
  container.querySelector('#tbExport').addEventListener('click',exportData);
  container.querySelector('#tbImport').addEventListener('click', pickCardLibFile);
  container.querySelector('#tbSearch').addEventListener('input',function(){state.searchQuery=this.value;renderCardItems();cmHidePop();});

  // Popover button actions (global capture)
  document.addEventListener('click', function cmPopHandler(e) {
    var pop = e.target.closest('.cm-popover');
    if (!pop) {
      // Close popover on outside click
      if (cmPopover && !e.target.closest('.cat-tab') && !e.target.closest('.subcat-chip')) cmHidePop();
      return;
    }
    var type = pop.dataset.type, id = pop.dataset.id;
    if (e.target.closest('.cm-pop-eye')) {
      if (type === 'cat') { var cats=STORE.categories||[], c=cats.find(x=>x.id===id); if(c){c.hidden=!c.hidden;STORE.categories=cats;renderCatTabs();renderCardItems();var newEye=c.hidden?'👁️‍🗨️':'👁️';e.target.closest('.cm-popover')&&(e.target.closest('.cm-popover').querySelector('.cm-pop-eye').textContent=newEye);} }
      else { var subs=STORE.subcategories||[], s=subs.find(x=>x.id===id); if(s){s.hidden=!s.hidden;STORE.subcategories=subs;renderSubchips();renderCardItems();var newEye=s.hidden?'👁️‍🗨️':'👁️';e.target.closest('.cm-popover')&&(e.target.closest('.cm-popover').querySelector('.cm-pop-eye').textContent=newEye);} }
      return;
    }
    if (e.target.closest('.cm-pop-rename')) {
      if (type === 'cat') { var cats=STORE.categories||[], c=cats.find(x=>x.id===id); if(!c)return; var n=prompt('修改大类名称：',c.name); if(n&&n.trim()&&n.trim()!==c.name){c.name=n.trim();STORE.categories=cats;renderCatTabs();renderSubchips();renderCardItems();} }
      else { var subs=STORE.subcategories||[], s=subs.find(x=>x.id===id); if(!s)return; var n=prompt('修改小类名称：',s.name); if(n&&n.trim()&&n.trim()!==s.name){s.name=n.trim();STORE.subcategories=subs;renderSubchips();renderCardItems();} }
      cmHidePop(); return;
    }
    if (e.target.closest('.cm-pop-del')) {
      if (type === 'cat') {
        var cats=STORE.categories||[], c=cats.find(x=>x.id===id); if(!c)return;
        var sc=(STORE.subcategories||[]).filter(x=>x.categoryId===id).length, cc=(STORE.cards||[]).filter(x=>x.categoryId===id).length;
        if(!confirm(`确定删除大类「${c.name}」吗？\n将同时删除其下的 ${sc} 个小类和 ${cc} 条字卡。`))return;
        STORE.categories=cats.filter(x=>x.id!==id); STORE.subcategories=(STORE.subcategories||[]).filter(x=>x.categoryId!==id);
        STORE.cards=(STORE.cards||[]).filter(x=>x.categoryId!==id);
        pruneTaFavs();
        if(state.selectedCatId===id){state.selectedCatId=null;state.selectedSubId=null;}
        renderCatTabs(); renderSubchips(); renderCardItems();
      } else {
        var subs=STORE.subcategories||[], s=subs.find(x=>x.id===id); if(!s)return;
        var cc=(STORE.cards||[]).filter(x=>x.subcategoryId===id).length;
        if(!confirm(`确定删除小类「${s.name}」吗？\n将同时删除其下的 ${cc} 条字卡。`))return;
        STORE.subcategories=subs.filter(x=>x.id!==id); STORE.cards=(STORE.cards||[]).filter(x=>x.subcategoryId!==id);
        pruneTaFavs();
        if(state.selectedSubId===id)state.selectedSubId=null;
        renderSubchips(); renderCardItems();
      }
      cmHidePop(); return;
    }
  }, true);

  // Delegation: category tabs
  container.querySelector('#catTabs').addEventListener('click',e=>{
    const newCatBtn = e.target.id==='btnNewCat' ? e.target : e.target.closest('#btnNewCat');
    if(newCatBtn){
      const name=prompt('请输入大类名称：'); if(!name||!name.trim())return;
      const cats=STORE.categories||[];
      if(cats.find(c=>c.name.trim()===name.trim())){alert('该大类已存在');return;}
      cats.push({id:genId(),name:name.trim(),hidden:false});STORE.categories=cats;
      state.selectedCatId=cats[cats.length-1].id; state.selectedSubId=null;
      renderCatTabs(); renderSubchips(); renderCardItems(); return;
    }
    const tab = e.target.closest('.cat-tab'); if(!tab) return;
    const catId = tab.dataset.catId;
    state.selectedCatId=catId; state.selectedSubId=null;
    renderCatTabs(); renderSubchips(); renderCardItems();
    cmShowPop(tab, 'cat');
  });
  // Delegation: 第二行「TA 收下的话」—— 与第一行同样的行为，但必须单独挂（容器不是同一个）
  container.querySelector('#catTabsSpecial').addEventListener('click',e=>{
    const tab = e.target.closest('.cat-tab'); if(!tab) return;
    state.selectedCatId=tab.dataset.catId; state.selectedSubId=null;
    renderCatTabs(); renderSubchips(); renderCardItems();
    cmShowPop(tab, 'cat');
  });
  // Delegation: subcategory chips
  container.querySelector('#subcatRow').addEventListener('click',e=>{
    const newSubBtn = e.target.id==='btnNewSub' ? e.target : e.target.closest('#btnNewSub');
    if(newSubBtn){
      if(!state.selectedCatId){alert('请先选择一个大类');return;}
      const name=prompt('请输入小类名称：'); if(!name||!name.trim())return;
      const subs=STORE.subcategories||[];
      if(subs.find(s=>s.categoryId===state.selectedCatId&&s.name.trim()===name.trim())){alert('该小类已存在');return;}
      subs.push({id:genId(),name:name.trim(),categoryId:state.selectedCatId,hidden:false});STORE.subcategories=subs;
      renderSubchips(); return;
    }
    const chip = e.target.closest('.subcat-chip'); if(!chip) return;
    const subId = chip.dataset.subId;
    state.selectedSubId=subId;
    renderSubchips(); renderCardItems();
    cmShowPop(chip, 'sub');
  });
  // Delegation: card list (weight, edit, delete)
  container.querySelector('#cardList').addEventListener('click',e=>{
    const cardItem = e.target.closest('.card-item');
    if (!cardItem) return;
    const cardId = cardItem.dataset.cardId;
    if (e.target.closest('.card-weight') && !e.target.closest('.weight-num')) {
      const cards=STORE.cards||[], card=cards.find(c=>c.id===cardId);
      if (card) { card.weight = Math.min(100, (card.weight||1)+1); STORE.cards=cards; renderCardItems(); }
      return;
    }
    if (e.target.closest('.weight-num')) {
      const cards=STORE.cards||[], card=cards.find(c=>c.id===cardId);
      if (!card) return;
      const v=prompt('修改权重（1~100）：',card.weight||1);
      if (v!==null) { const n=parseInt(v,10); if (!isNaN(n)&&n>=1&&n<=100) { card.weight=n; STORE.cards=cards; renderCardItems(); } else if (v.trim()!=='') { alert('请输入1~100之间的整数'); } }
      return;
    }
    if (e.target.closest('.btn-card-edit')) { showEditCardModal(cardId); return; }
    if (e.target.closest('.btn-card-del')) {
      var isTaCard=(STORE.cards||[]).some(c=>c.id===cardId&&c.subcategoryId===TAF_SUB_ID);
      if (!confirm(isTaCard?'确定删除这条字卡吗？\n它也是 TA 收下的话，删掉后「TA 的收藏」里会一并消失。':'确定删除这条字卡吗？')) return;
      STORE.cards=(STORE.cards||[]).filter(c=>c.id!==cardId);
      pruneTaFavs();          // 口径⑨：字卡库为准，删卡同时清掉收藏记录
      renderCardItems(); return;
    }
  });
}

// ============ Rendering: Settings ============
// ============ 聊天背景 与 大光晕 ============
// 出厂值 = 改动前的现状（三色/模糊/浓淡/宽高大）⇒ 未做任何设置时观感逐像素不变。
var HALO_DEFAULT = { on: true, c1: '#f88f50', c3: '#ddd83d', blur: 36, alpha: 92, w: 520, h: 640 };
var HALO_MIN_PX = 100;                      // 宽/高下限
var HALO_MAX_PX = 1600;                     // 宽/高上限（超过视口也无妨，.chat-view 自己裁）
var CHATBG_MAX_PX = 1600;                   // 首次压缩的最大边
var CHATBG_RETRY_PX = 1200;                 // 超限后降一档的最大边
var CHATBG_MAX_BYTES = 1200 * 1024;         // 体积上限 1.2MB
var _haloMidCache = { c1: '', c3: '', mid: '' };
// 聊天页我方气泡的不透明度（%）。出厂 30 = 改动前 --bubble-user 的 alpha ⇒ 未调整时观感逐像素不变。
// 只作用于聊天页 .msg-row.user 的气泡；碎影页 .sh-row.me 仍用 --bubble-user 本体，不在本次范围内。
var BUBBLE_DEFAULT = { userAlpha: 30 };

// 两色线性混色：逐通道四舍五入到 8 位十六进制
function mixSrgb(a, b, t) {
  function ch(h, i) { var v = parseInt(String(h).slice(1 + i * 2, 3 + i * 2), 16); return isNaN(v) ? 0 : v; }
  var out = '#';
  for (var i = 0; i < 3; i++) {
    var v = Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
    if (v < 0) v = 0;
    if (v > 255) v = 255;
    out += ('0' + v.toString(16)).slice(-2);
  }
  return out;
}
// 中间色：两色都是出厂值时精确返回出厂中间色 #ecc24f（零回归）；
// 一旦改动任一端才推导 —— 权重 20/36 来自色标位置（中段 38% 夹在 c1 末 18% 与 c3 起 54% 之间）。
function c2Of(c1, c3) {
  if (c1 === HALO_DEFAULT.c1 && c3 === HALO_DEFAULT.c3) return '#ecc24f';
  if (_haloMidCache.c1 === c1 && _haloMidCache.c3 === c3) return _haloMidCache.mid;
  var mid = mixSrgb(c1, c3, 20 / 36);
  _haloMidCache = { c1: c1, c3: c3, mid: mid };
  return mid;
}
// 配置访问器：本段唯一读取 STORE.config.halo 的地方（缺字段一律兜底到出厂值）
function haloCfg() {
  var c = (STORE.config || {}).halo || {};
  var hex = /^#[0-9a-fA-F]{6}$/;
  var c1 = hex.test(c.c1 || '') ? c.c1 : HALO_DEFAULT.c1;
  var c3 = hex.test(c.c3 || '') ? c.c3 : HALO_DEFAULT.c3;
  var blur = parseInt(c.blur, 10); if (isNaN(blur) || blur < 0) blur = HALO_DEFAULT.blur; if (blur > 60) blur = 60;
  var alpha = parseInt(c.alpha, 10); if (isNaN(alpha) || alpha < 0) alpha = HALO_DEFAULT.alpha; if (alpha > 100) alpha = 100;
  var w = parseInt(c.w, 10); if (isNaN(w) || w < HALO_MIN_PX) w = HALO_DEFAULT.w; if (w > HALO_MAX_PX) w = HALO_MAX_PX;
  var h = parseInt(c.h, 10); if (isNaN(h) || h < HALO_MIN_PX) h = HALO_DEFAULT.h; if (h > HALO_MAX_PX) h = HALO_MAX_PX;
  // 只有显式 false 才算关：老配置没这个键 ⇒ 取默认（开）
  return { on: c.on === false ? false : true, c1: c1, c3: c3, blur: blur, alpha: alpha, w: w, h: h };
}
function chatBgCfg() {
  var c = (STORE.config || {}).chatBg || {};
  return { image: typeof c.image === 'string' ? c.image : '' };
}
// 我的气泡不透明度（聊天页）
function bubbleCfg() {
  var c = (STORE.config || {}).bubble || {};
  var a = parseInt(c.userAlpha, 10);
  if (isNaN(a) || a < 0) a = BUBBLE_DEFAULT.userAlpha;
  if (a > 100) a = 100;
  return { userAlpha: a };
}
// 唯一应用点：把配置落到 DOM（CSS 变量 + 状态类 + 背景图）
// 注意：index.html <head> 里有一段同步内联脚本做同样的写入（首帧防闪），两边的取值规则必须一致。
// 这里改用【变量】表达背景图与光晕开关（--chat-bg-image / --halo-display），
// 于是"首帧"与"运行时"走的是同一条 CSS 路径，不会出现两套逻辑打架。
function applyChatVisual() {
  var h = haloCfg();
  var root = document.documentElement.style;
  root.setProperty('--bubble-user-alpha', (bubbleCfg().userAlpha / 100).toFixed(2));
  root.setProperty('--halo-c1', h.c1);
  root.setProperty('--halo-c2', c2Of(h.c1, h.c3));
  root.setProperty('--halo-c3', h.c3);
  root.setProperty('--halo-blur', h.blur + 'px');
  root.setProperty('--halo-alpha', (h.alpha / 100).toFixed(2));
  root.setProperty('--halo-display', h.on ? 'block' : 'none');
  root.setProperty('--halo-w', h.w + 'px');
  root.setProperty('--halo-h', h.h + 'px');
  var img = chatBgCfg().image;
  if (img) root.setProperty('--chat-bg-image', 'url("' + img.replace(/"/g, '%22') + '")');
  else root.removeProperty('--chat-bg-image');
  var view = document.getElementById('chatView');
  if (!view) return;                       // 无 chatView 的页面（如独立工具页）直接跳过
  // 保留状态类：外部（夹具/旧导出配置）可能按类判断，也便于人肉排查
  view.classList.toggle('no-halo', !h.on);
  view.classList.toggle('has-chat-bg', !!img);
}
// 背景体积可读化（data URL 长度 × 0.75 ≈ 字节数）
function chatBgSizeText(dataUrl) {
  if (!dataUrl) return '未设置';
  return '已设置 ' + Math.max(1, Math.round(dataUrl.length * 0.75 / 1024)) + 'KB';
}

function renderSettings(container) {
  const cfg=STORE.config||{};
  const engCfg=cfg.dreamEngine||{};
  const msgP=cfg.msgCountProbs||[30,40,20,10];
  const cardP=cfg.cardCountProbs||[30,40,20,10];
  const av=cfg.avatarUrl||'';
  const uav=cfg.userAvatarUrl||'';
  const aiCfg=cfg.aiInterpret||defaultAIInterpret();
  const letterCfg=getLetterConfig();
  const neteaseCfg=getNeteaseConfig();
  const shadowConf=shadowCfg();
  const tafConf=taFavCfg();
  const pyConf=pyCfg();
  const haloConf=haloCfg();
  const chatBgConf=chatBgCfg();
  const bubbleConf=bubbleCfg();

  container.innerHTML=`
  <div class="settings-body">
    <div class="settings-save-status" id="settingsSaveStatus" aria-live="polite">已保存</div>

    <div class="setting-group">
      <div class="sg-title">👤 形象设置</div>
      <div class="avatar-preview" id="avatarPreview">${av?`<img src="${escapeHtml(av)}" onerror="this.parentElement.textContent='🏐'">`:'🏐'}</div>
      <div class="avatar-actions"><button class="btn-avatar-del" id="btnCharAvDel" ${av?'':'style="display:none"'}>移除头像</button></div>
      <input type="file" id="charAvInput" accept="image/*" style="display:none">
      <div class="setting-row"><label>梦角昵称</label><input type="text" id="cfgName" value="${escapeHtml(cfg.characterName||'')}"></div>
      <div class="avatar-preview" id="userAvatarPreview" style="margin-top:10px;">${uav?`<img src="${escapeHtml(uav)}" onerror="this.parentElement.textContent='🐟'">`:'🐟'}</div>
      <div class="avatar-actions"><button class="btn-avatar-del" id="btnUserAvDel" ${uav?'':'style="display:none"'}>移除头像</button></div>
      <input type="file" id="userAvInput" accept="image/*" style="display:none">
      <div class="setting-row"><label>我的昵称</label><input type="text" id="cfgUserNickname" value="${escapeHtml(cfg.userNickname||'我')}" placeholder="我"></div>
    </div>

    <div class="setting-group">
      <div class="sg-title">🌅 梦角作息</div>
      <div class="setting-row"><label>起床时间</label><input type="number" id="cfgWakeTime" value="${engCfg.wakeTime!=null?engCfg.wakeTime:7}" min="0" max="12" step="1"><label>时</label><span style="width:20px;"></span><label>睡觉时间</label><input type="number" id="cfgSleepTime" value="${engCfg.sleepTime!=null?engCfg.sleepTime:23}" min="18" max="24" step="1"><label>时</label></div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">除日记外，所有自动行为都在此时间段内随机触发</div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">💬 聊天设置</div>
      <div class="setting-row">
        <label>启用主动聊天</label>
        <input type="checkbox" id="cfgDEEnaChat" ${(engCfg.enabled&&engCfg.enabled.dreamChat!==false)?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>每天主动聊</label><input type="number" id="cfgDEPDChatMin" value="${(engCfg.perDay&&engCfg.perDay.dreamChat)?engCfg.perDay.dreamChat.min:5}" min="0" max="30" step="1"><label>~</label><input type="number" id="cfgDEPDChatMax" value="${(engCfg.perDay&&engCfg.perDay.dreamChat)?engCfg.perDay.dreamChat.max:15}" min="0" max="30" step="1"><label>次</label></div>
      <div class="setting-row"><label>主动发言间隔(分)</label><input type="number" id="cfgActiveMin" value="${cfg.timing?.activeChat?.min||30}" min="5" step="5"><label>~</label><input type="number" id="cfgActiveMax" value="${cfg.timing?.activeChat?.max||60}" min="5" step="5"></div>
      <div class="setting-row"><label>被动回复延迟(秒)</label><input type="number" id="cfgPassiveMin" value="${cfg.timing?.passiveReply?.min||0.5}" min="0.1" step="0.1"><label>~</label><input type="number" id="cfgPassiveMax" value="${cfg.timing?.passiveReply?.max||2.5}" min="0.1" step="0.1"></div>
      <div class="setting-row"><label>一次说</label><input type="number" id="cfgMsgCnt1" value="${msgP[0]}" style="width:50px;" class="prob-msg" data-idx="0" min="0" max="100"><label>1条 /</label><input type="number" id="cfgMsgCnt2" value="${msgP[1]}" style="width:50px;" class="prob-msg" data-idx="1" min="0" max="100"><label>2条 /</label><input type="number" id="cfgMsgCnt3" value="${msgP[2]}" style="width:50px;" class="prob-msg" data-idx="2" min="0" max="100"><label>3条 /</label><input type="number" id="cfgMsgCnt4" value="${msgP[3]}" style="width:50px;" class="prob-msg" data-idx="3" min="0" max="100"><label>4条（概率）</label></div>
      <div class="setting-row"><label>一条用</label><input type="number" id="cfgCardCnt1" value="${cardP[0]}" style="width:50px;" class="prob-card" data-idx="0" min="0" max="100"><label>1张 /</label><input type="number" id="cfgCardCnt2" value="${cardP[1]}" style="width:50px;" class="prob-card" data-idx="1" min="0" max="100"><label>2张 /</label><input type="number" id="cfgCardCnt3" value="${cardP[2]}" style="width:50px;" class="prob-card" data-idx="2" min="0" max="100"><label>3张 /</label><input type="number" id="cfgCardCnt4" value="${cardP[3]}" style="width:50px;" class="prob-card" data-idx="3" min="0" max="100"><label>4张字卡（概率）</label></div>
      <div class="prob-hint">消息条数总和：<span id="probMsgSum">${msgP.reduce((a,b)=>a+b,0)}</span>　字卡张数总和：<span id="probCardSum">${cardP.reduce((a,b)=>a+b,0)}</span></div>
      <div class="setting-row"><label>涂鸦概率(%)</label><input type="number" id="cfgDoodleProb" value="${cfg.prob?.doodle||8}" min="0" max="100" step="1"><label>0关·100必出</label></div>
      <div class="setting-row"><label>聊天带表情概率(%)</label><input type="number" id="cfgChatSticker" value="${(engCfg.prob&&engCfg.prob.dreamChatSticker!=null)?engCfg.prob.dreamChatSticker:10}" min="0" max="100" step="5"></div>
      <div class="setting-row"><label>消息撤回概率(%)</label><input type="number" id="cfgRecallProb" value="${(engCfg.prob&&engCfg.prob.recallProb!=null)?engCfg.prob.recallProb:1}" min="0" max="100" step="0.1"></div>
      <div class="setting-row"><label>内心 OS 概率(%)</label><input type="number" id="cfgOsProb" value="${(cfg.prob&&cfg.prob.os!=null)?cfg.prob.os:10}" min="0" max="100" step="5"><label>0关·100必出</label></div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">🖼 聊天背景与光晕</div>
      <div class="setting-row">
        <label>聊天背景</label>
        <button class="py-wb-btn" id="cfgChatBgPick" style="flex:0 0 auto;">选择图片</button>
        <button class="py-wb-btn" id="cfgChatBgClear" style="flex:0 0 auto;">清除背景</button>
        <input type="file" id="cfgChatBgInput" accept="image/*" style="display:none">
      </div>
      <div class="setting-row"><label>背景状态</label><span id="cfgChatBgStatus" style="flex:1;font-size:12px;color:var(--text-muted);">${chatBgSizeText(chatBgConf.image)}</span><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">选图后自动压缩、立即生效；背景铺在大光晕下面</label></div>
      <div class="setting-row">
        <label>大光晕</label>
        <input type="checkbox" id="cfgHaloOn" ${haloConf.on?'checked':''} style="width:auto;">
        <label class="sg-hint" style="font-size:11px;color:var(--text-muted);">关掉只隐藏光球本身；顶部大标题会直接压在背景图上</label>
      </div>
      <div class="setting-row">
        <label>光晕配色</label>
        <input type="color" id="cfgHaloC1" value="${haloConf.c1}" style="width:44px;height:28px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;">
        <input type="color" id="cfgHaloC3" value="${haloConf.c3}" style="width:44px;height:28px;padding:0;border:1px solid var(--border);border-radius:8px;background:none;">
        <button class="py-wb-btn" id="cfgHaloReset" style="flex:0 0 auto;">恢复默认</button>
      </div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">左＝起点色，右＝终点色；中间的过渡色由这两色自动推导</div>
      <div class="setting-row"><label>模糊(px)</label><input type="number" id="cfgHaloBlur" value="${haloConf.blur}" min="0" max="60" step="1"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">0＝边缘清晰，越大越弥散</label></div>
      <div class="setting-row"><label>浓淡(%)</label><input type="number" id="cfgHaloAlpha" value="${haloConf.alpha}" min="0" max="100" step="1"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">0＝完全看不见，100＝最浓</label></div>
      <div class="setting-row"><label>光晕宽(px)</label><input type="number" id="cfgHaloW" value="${haloConf.w}" min="100" max="1600" step="10"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">出厂 520；越大光球越宽</label></div>
      <div class="setting-row"><label>光晕高(px)</label><input type="number" id="cfgHaloH" value="${haloConf.h}" min="100" max="1600" step="10"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">出厂 640；越大往下铺得越深</label></div>
      <div class="setting-row"><label>我的气泡不透明度(%)</label><input type="number" id="cfgBubbleUserAlpha" value="${bubbleConf.userAlpha}" min="0" max="100" step="5"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">0＝全透，100＝完全不透；只作用于聊天页我方的气泡</label></div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">🫂 朋友圈设置</div>
      <div class="setting-row">
        <label>启用</label>
        <input type="checkbox" id="cfgDEEnaPost" ${(engCfg.enabled&&engCfg.enabled.dreamPost!==false)?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>每天发</label><input type="number" id="cfgDEPDPostMin" value="${(engCfg.perDay&&engCfg.perDay.dreamPost)?engCfg.perDay.dreamPost.min:2}" min="0" max="20" step="1"><label>~</label><input type="number" id="cfgDEPDPostMax" value="${(engCfg.perDay&&engCfg.perDay.dreamPost)?engCfg.perDay.dreamPost.max:8}" min="0" max="20" step="1"><label>条</label></div>
      <div class="setting-row"><label>发圈间隔(分)</label><input type="number" id="cfgDPostMin" value="${cfg.timing?.dreamPost?.min||2}" min="0.5" step="0.5"><label>~</label><input type="number" id="cfgDPostMax" value="${cfg.timing?.dreamPost?.max||8}" min="0.5" step="0.5"></div>
      <div class="setting-row"><label>一条用字卡</label><input type="number" id="cfgDPCardMin" value="${cfg.timing?.dreamPostCard?.min||1}" min="1" max="10" step="1"><label>~</label><input type="number" id="cfgDPCardMax" value="${cfg.timing?.dreamPostCard?.max||5}" min="1" max="10" step="1"><label>张</label></div>
      <div class="setting-row"><label>配图概率(%)</label><input type="number" id="cfgPhotoProb" value="${cfg.prob?.postPhoto||60}" min="0" max="100" step="5"><label>含表情贴纸</label><input type="number" id="cfgStickerFrac" value="${cfg.prob?.stickerFrac||70}" min="0" max="100" step="5"><label>%</label></div>
      <div class="setting-row"><label>刷圈间隔(分)</label><input type="number" id="cfgDRMin" value="${cfg.timing?.dreamReaction?.min||1}" min="0.5" step="0.5"><label>~</label><input type="number" id="cfgDRMax" value="${cfg.timing?.dreamReaction?.max||6}" min="0.5" step="0.5"></div>
      <div class="setting-row"><label>点赞概率(%)</label><input type="number" id="cfgLikeProb" value="${cfg.prob?.dreamLike||80}" min="0" max="100" step="5"><label>评论概率(%)</label><input type="number" id="cfgCommentProb" value="${cfg.prob?.dreamComment||65}" min="0" max="100" step="5"></div>
      <div class="setting-row"><label>回复延迟(秒)</label><input type="number" id="cfgCDMin" value="${cfg.timing?.dreamComment?.min||2}" min="0.5" step="0.5"><label>~</label><input type="number" id="cfgCDMax" value="${cfg.timing?.dreamComment?.max||8}" min="0.5" step="0.5"></div>
      <div class="setting-row"><label>评论衰减(%)</label><input type="number" class="prob-decay" data-idx="0" value="${(cfg.dreamReplyDecaySeq||[100,70,40,10,0])[0]}" style="width:46px;" min="0" max="100"><input type="number" class="prob-decay" data-idx="1" value="${(cfg.dreamReplyDecaySeq||[100,70,40,10,0])[1]}" style="width:46px;" min="0" max="100"><input type="number" class="prob-decay" data-idx="2" value="${(cfg.dreamReplyDecaySeq||[100,70,40,10,0])[2]}" style="width:46px;" min="0" max="100"><input type="number" class="prob-decay" data-idx="3" value="${(cfg.dreamReplyDecaySeq||[100,70,40,10,0])[3]}" style="width:46px;" min="0" max="100"><span style="font-size:11px;color:var(--text-muted);">第1~4轮</span></div>
      <div class="setting-row"><label>第5轮+</label><input type="number" id="cfgDecay5" value="${(cfg.dreamReplyDecaySeq||[100,70,40,10,0])[4]||0}" min="0" max="100" step="5" style="width:60px;"><label>启用衰减</label><input type="checkbox" id="cfgDecayOn" ${cfg.dreamReplyDecayOn!==false?'checked':''} style="width:auto;"></div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">📔 日记设置</div>
      <div class="setting-row">
        <label>启用梦角日记</label>
        <input type="checkbox" id="cfgDEEnaDD" ${(engCfg.enabled&&engCfg.enabled.dreamDiary!==false)?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>生成时段</label><input type="number" id="cfgDETWDDS" value="${engCfg.diaryTimeStart!=null?engCfg.diaryTimeStart:21}" min="0" max="23" step="1"><label>时~</label><input type="number" id="cfgDETWDDE" value="${engCfg.diaryTimeEnd!=null?engCfg.diaryTimeEnd:24}" min="1" max="24" step="1"><label>时（每天1篇）</label></div>
      <div class="setting-row"><label>备选时段</label><input type="number" id="cfgDGMin" value="${cfg.timing?.diaryGen?.hourMin||21}" min="0" max="23" step="1"><label>~</label><input type="number" id="cfgDGMax" value="${cfg.timing?.diaryGen?.hourMax||24}" min="1" max="24" step="1"><label>时（旧调度）</label></div>
      <div class="setting-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;">
        <label>启用批阅用户日记</label>
        <input type="checkbox" id="cfgDEEnaDC" ${(engCfg.enabled&&engCfg.enabled.dreamDiaryComment!==false)?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>批阅概率(%)</label><input type="number" id="cfgDCProbNew" value="${(engCfg.prob&&engCfg.prob.dreamDiaryComment!=null)?engCfg.prob.dreamDiaryComment:70}" min="0" max="100" step="5"></div>
      <div class="setting-row"><label>批阅延迟(分)</label><input type="number" id="cfgDCDMin" value="${cfg.timing?.diaryComment?.min||30}" min="1" step="1"><label>~</label><input type="number" id="cfgDCDMax" value="${cfg.timing?.diaryComment?.max||120}" min="1" step="1"></div>
    </div>

    <div class="setting-group">
      <div class="sg-title">📌 打卡设置</div>
      <div class="setting-row">
        <label>启用梦角打卡</label>
        <input type="checkbox" id="cfgDEEnaCI" ${(engCfg.enabled&&engCfg.enabled.dreamCheckin===true)?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>每天</label><input type="number" id="cfgDEPDCIMin" value="${(engCfg.perDay&&engCfg.perDay.dreamCheckin)?engCfg.perDay.dreamCheckin.min:3}" min="0" max="30" step="1"><label>~</label><input type="number" id="cfgDEPDCIMax" value="${(engCfg.perDay&&engCfg.perDay.dreamCheckin)?engCfg.perDay.dreamCheckin.max:12}" min="0" max="30" step="1"><label>次</label></div>
      <div class="setting-row"><label>最少间隔(分)</label><input type="number" id="cfgCIIntv" value="${(engCfg.interval&&engCfg.interval.dreamCheckin!=null)?engCfg.interval.dreamCheckin:45}" min="10" max="180" step="5"></div>
    </div>

    <div class="setting-group">
      <div class="sg-title">💥 锐评设置</div>
      <div class="setting-row"><label>反问概率(%)</label><input type="number" id="cfgRCProb" value="${cfg.prob?.reviewCounter||20}" min="0" max="100" step="5"><label>评语字卡数</label><input type="number" id="cfgRCardCnt" value="${cfg.reviewCardCount||3}" min="1" max="10" step="1"></div>
      <div class="setting-row">
        <label>评级倾向</label>
        <select id="cfgRMode" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-warm);font-size:13px;">
          <option value="random" ${cfg.reviewMode==='random'?'selected':''}>完全随机</option>
          <option value="harsh" ${cfg.reviewMode==='harsh'?'selected':''}>倾向毒舌</option>
          <option value="gentle" ${cfg.reviewMode==='gentle'?'selected':''}>倾向温柔</option>
        </select>
      </div>
    </div>

      <div class="setting-group">
      <div class="sg-title">✉️ 写信设置</div>
      <div class="setting-row"><label>批注等待(分)</label><input type="number" id="cfgLetterDelayMin" value="${letterCfg.annotationDelay.min}" min="1" max="1440" step="1"><label>~</label><input type="number" id="cfgLetterDelayMax" value="${letterCfg.annotationDelay.max}" min="1" max="1440" step="1"></div>
      <div class="setting-row"><label>批注覆盖率(%)</label><input type="number" id="cfgLetterCoverageMin" value="${letterCfg.coverage.min}" min="1" max="100" step="1"><label>~</label><input type="number" id="cfgLetterCoverageMax" value="${letterCfg.coverage.max}" min="1" max="100" step="1"></div>
      <div class="setting-row"><label>每段字卡数</label><input type="number" id="cfgLetterCardMin" value="${letterCfg.cardCount.min}" min="1" max="3" step="1"><label>~</label><input type="number" id="cfgLetterCardMax" value="${letterCfg.cardCount.max}" min="1" max="3" step="1"></div>
    </div>

    <div class="setting-group">
      <div class="sg-title">🕯️ 碎影</div>
      <div class="setting-row">
        <label>开启碎影</label>
        <input type="checkbox" id="cfgShadowEna" ${shadowConf.enabled?'checked':''} style="width:auto;">
        <label style="font-size:11px;color:var(--text-muted);">梦角主动截取一小段对话收进碎影</label>
      </div>
      <div class="setting-row"><label>检查间隔(分)</label><input type="number" id="cfgShadowMin" value="${shadowConf.min}" min="1" max="1440" step="1"><label>~</label><input type="number" id="cfgShadowMax" value="${shadowConf.max}" min="1" max="1440" step="1"></div>
      <div class="setting-row"><label>每天最多</label><input type="number" id="cfgDEPDShadowMin" value="${(engCfg.perDay&&engCfg.perDay.dreamShadow&&engCfg.perDay.dreamShadow.min!=null)?engCfg.perDay.dreamShadow.min:0}" min="0" max="24" step="1"><label>~</label><input type="number" id="cfgDEPDShadowMax" value="${(engCfg.perDay&&engCfg.perDay.dreamShadow&&engCfg.perDay.dreamShadow.max!=null)?engCfg.perDay.dreamShadow.max:0}" min="0" max="24" step="1"><label style="font-size:11px;color:var(--text-muted);">0=不限</label></div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">当前状态：${shadowStatusText()}</div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">碎影只从双方已有的聊天记录里截取，不会新增编造的内容；删除碎影不影响原聊天</div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">🧡 TA 的收藏</div>
      <div class="setting-row">
        <label>开启收藏</label>
        <input type="checkbox" id="cfgTaFavEna" ${tafConf.enabled?'checked':''} style="width:auto;">
        <label class="sg-hint" style="font-size:11px;color:var(--text-muted);">你发消息时，TA 有概率把你说的某句话收起来，变成 TA 的字卡</label>
      </div>
      <div class="setting-row"><label>收藏概率(%)</label><input type="number" id="cfgTaFavProb" value="${tafConf.prob}" min="0" max="100" step="1"><label>每天最多</label><input type="number" id="cfgTaFavDailyMax" value="${tafConf.dailyMax}" min="0" max="100" step="1"><label style="font-size:11px;color:var(--text-muted);">0=不限</label></div>
      <div class="setting-row"><label>最短字数</label><input type="number" id="cfgTaFavMinLen" value="${tafConf.minLen}" min="1" max="50" step="1"><label style="font-size:11px;color:var(--text-muted);">太短的句子不收藏</label></div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">收下的话会进字卡库的「${escapeHtml(TAF_CAT_NAME)}」大类，以后和普通字卡一起被抽到；含手机号/密码/卡号等隐私内容不会被收藏</div>
    </div>

    <div class="setting-group">
      <div class="sg-title">🎵 网易云歌曲</div>
      <div class="setting-row">
        <label>梦角分享歌曲</label>
        <input type="checkbox" id="cfgNeteaseEna" ${neteaseCfg.enabled?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>分享概率(%)</label><input type="number" id="cfgNeteaseProb" value="${neteaseCfg.prob}" min="0" max="100" step="1"><label>发消息时随机带歌</label></div>
      <div class="setting-row"><label>歌单ID</label><input type="text" id="cfgNeteaseIds" value="${escapeHtml(neteaseCfg.playlistIds.join(','))}" style="width:140px;text-align:left;" placeholder="135597299"><label>多个用逗号分隔</label></div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">📖 如何换成自己的歌单：电脑打开 music.163.com → 找到你的歌单 → 点进歌单后看浏览器地址栏，<b>playlist?id=</b> 后面那串数字就是歌单 ID（如 135597299）</div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">⚠️ 「我喜欢的音乐」默认是私密的，接口拉不到；请把歌单设为公开，或新建一个公开歌单收藏想听歌</div>
      <div class="setting-row">
        <button id="btnRefreshSongs" style="padding:6px 14px;font-size:12px;border-radius:20px;background:var(--bg-warm);color:var(--accent);border:1px solid var(--border);cursor:pointer;">🔄 刷新歌单缓存</button>
        <span id="songCacheStatus" style="font-size:11px;color:var(--text-muted);">${(STORE.songCache && STORE.songCache.songs) ? '已缓存' + STORE.songCache.songs.length + '首' : '未缓存'}</span>
      </div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">在线拉取失败时自动用内置歌单兜底</div>
    </div>

    <div class="setting-group">
      <div class="sg-title">🤖 AI 解读</div>
      <div class="setting-row">
        <label>开启 AI 解读</label>
        <input type="checkbox" id="cfgAIEna" ${aiCfg.enabled?'checked':''} style="width:auto;">
      </div>
      <div class="setting-row"><label>API 地址</label><input type="text" id="cfgAIUrl" value="${escapeHtml(aiCfg.apiUrl)}" style="width:240px;text-align:left;"></div>
      <div class="setting-row" style="font-size:10px;color:var(--text-muted);">需支持浏览器跨域(CORS)，DeepSeek 官方接口兼容</div>
      <div class="setting-row">
        <label>API Key</label>
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="password" id="cfgAIKey" value="${escapeHtml(aiCfg.apiKey)}" style="width:200px;text-align:left;" autocomplete="off">
          <button type="button" id="btnToggleAIKey" style="padding:4px 8px;font-size:12px;border-radius:14px;border:1px solid var(--border);background:var(--bg-warm);cursor:pointer;">👁</button>
        </div>
      </div>
      <div class="setting-row"><label>模型名称</label><input type="text" id="cfgAIModel" value="${escapeHtml(aiCfg.model)}" style="width:160px;text-align:left;"></div>
      <div class="setting-row">
        <label>上下文条数</label>
        <input type="number" id="cfgAIContext" min="0" max="20" value="${aiCfg.contextCount}">
        <span style="font-size:10px;color:var(--text-muted);margin-left:6px;">预估 ≈${(aiCfg.contextCount||0)*30} token/次</span>
      </div>
      <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:4px;">
        <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" id="aiPromptToggle">
          <label style="cursor:pointer;">系统提示词（高级）</label>
          <span id="aiPromptArrow" style="font-size:10px;color:var(--text-secondary);">▶ 展开</span>
        </div>
        <textarea id="cfgAIPrompt" rows="6" style="display:none;width:100%;padding:8px;font-size:12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-warm);resize:vertical;font-family:inherit;box-sizing:border-box;margin-top:4px;">${escapeHtml(aiCfg.systemPrompt)}</textarea>
      </div>
    </div>

    <div class="setting-group">
      <div class="sg-title">💾 数据导入导出</div>
      <div class="setting-row">
        <button id="btnExportAll" style="padding:8px 18px;font-size:13px;border-radius:20px;background:var(--accent);color:#fff;cursor:pointer;border:none;transition:all 0.15s;">📤 导出全部数据</button>
        <button id="btnImportAll" style="padding:8px 18px;font-size:13px;border-radius:20px;background:var(--bg-warm);color:var(--accent);border:1px solid var(--accent);cursor:pointer;transition:all 0.15s;">📥 导入全部数据</button>
        <input type="file" id="importAllFile" accept=".json" style="display:none">
      </div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">字卡库、聊天、朋友圈、日记、信件、打卡、经期、表情包、收藏等全部数据</div>
    </div>

    <div class="setting-group sg-fit">
      <div class="sg-title">🀄 拼音组句（试手感）</div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">梦角用你字卡里的"读音"重新组句：汉字→音节→随机重组→同音字回填。产出你没写过、但口音是你的句子。</div>
      <div class="setting-row">
        <label>开启拼音组句</label>
        <input type="checkbox" id="cfgPyOn" ${pyConf.on?'checked':''} style="width:auto;">
        <label class="sg-hint" style="font-size:11px;color:var(--text-muted);">关着也能在下方工作台试手感</label>
      </div>
      <div class="setting-row"><label>占比(%)</label><input type="number" id="cfgPyRatio" value="${pyConf.ratio}" min="0" max="100" step="5"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">聊天回复里走拼音的比例</label></div>
      <div class="setting-row"><label>引擎</label>
        <select id="cfgPyEngine" style="flex:1;">
          <option value="wordchain" ${pyConf.engine==='wordchain'?'selected':''}>丁 · 词级接龙（整词重组，首次需加载词表）</option>
          <option value="markov" ${pyConf.engine==='markov'?'selected':''}>乙 · 拼音马尔可夫（局部通顺，默认）</option>
        </select>
      </div>
      <div class="setting-row"><label>语料</label><span style="flex:1;font-size:12px;color:var(--text-muted);">当前 ${pyCorpus().length} 卡 · 来自你的字卡库</span><button class="py-wb-btn" id="cfgPyCorpusImport" style="flex:0 0 auto;">导入我的字卡库</button></div>
      <div class="setting-row"><label>随机度(%)</label><input type="number" id="cfgPyTemp" value="${pyConf.tempPct}" min="30" max="200" step="5"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">仅丁：像输入法一样按"下一个词的可能性"挑备选。100=按语料频次正比（最像梦角平时说话），越低越爱挑高频备选（稳），越高越爱挑冷门备选（野）</label></div>
      <div class="setting-row"><label>剔除专名</label><input type="checkbox" id="cfgPyStripProper" ${pyConf.stripProper?'checked':''} style="width:auto;"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">开：词库里的人名/地名/朝代/机构词（西周·满清·清朝·秦始皇·朝阳区·国务院…）不参与切词、接龙与换词；关：词库完整如初（一个字都没删）</label></div>
      <div class="setting-row"><label>句长(音节)</label><input type="number" id="cfgPyLenMin" value="${pyConf.lenMin}" min="1" max="20" step="1"><label>~</label><input type="number" id="cfgPyLenMax" value="${pyConf.lenMax}" min="1" max="20" step="1"></div>
      <div class="setting-row"><label>口齿清晰(%)</label><input type="number" id="cfgPyClarity" value="${pyConf.clarity}" min="0" max="100" step="5"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">越高越常写"最常用的那个字"</label></div>
      <div class="setting-row"><label>同调优先</label><input type="checkbox" id="cfgPyTone" ${pyConf.tone?'checked':''} style="width:auto;"><label class="sg-hint" style="font-size:11px;color:var(--text-muted);">换同音字时不换声调</label></div>
      <div class="setting-row" style="flex-direction:column;align-items:stretch;gap:4px;">
        <label>屏蔽词（逗号分隔，命中即重掷）</label>
        <input type="text" id="cfgPyBlacklist" value="${escapeHtml(pyConf.blacklist.join(','))}" placeholder="留空则只用内置词表">
      </div>
      ${pyWorkbenchHTML()}
    </div>

    <div class="setting-group">
      <div class="sg-title">🧪 调试工具</div>
      <div class="setting-row">
        <button id="btnResetToday" style="padding:6px 14px;font-size:12px;border-radius:20px;background:#fff5f5;color:var(--danger);border:1px solid #ffc9c9;cursor:pointer;">重置今日事件（重算）</button>
        <button class="btn-danger" id="btnClearChat" style="margin:0;padding:6px 14px;font-size:12px;width:auto;display:inline-block;">🗑️ 清空聊天</button>
      </div>
      <div class="setting-row" style="font-size:11px;color:var(--text-muted);">
        上次离开: <span id="lastActiveDisplay">${STORE.lastActive ? new Date(STORE.lastActive).toLocaleString('zh-CN') : '无记录'}</span>
      </div>
      <div style="margin-top:8px;"><button class="btn-danger" id="btnResetAll" style="background:#fff0f0;color:#c02020;">⚠️ 删除所有数据（保留初始预设）</button></div>
    </div>

  </div>`;

  bindSettingsEvents(container);
  pyBindWorkbench(container);
}

function bindSettingsEvents(container) {
  // AI 解读：API Key 显示/隐藏
  const btnToggleKey=container.querySelector('#btnToggleAIKey');
  const aiKeyInp=container.querySelector('#cfgAIKey');
  if(btnToggleKey&&aiKeyInp){
    btnToggleKey.addEventListener('click',function(){
      aiKeyInp.type = aiKeyInp.type==='password' ? 'text' : 'password';
      this.textContent = aiKeyInp.type==='password' ? '👁' : '🙈';
    });
  }
  // AI 解读：系统提示词折叠
  const promptToggle=container.querySelector('#aiPromptToggle');
  const promptArea=container.querySelector('#cfgAIPrompt');
  const promptArrow=container.querySelector('#aiPromptArrow');
  if(promptToggle&&promptArea){
    promptToggle.addEventListener('click',function(){
      const open=promptArea.style.display!=='none';
      promptArea.style.display=open?'none':'block';
      if(promptArrow)promptArrow.textContent=open?'▶ 展开':'▼ 收起';
    });
  }
  // Avatar upload: click preview → pick file → compress → save
  function _setupAvatarUpload(previewId, inputId, delBtnId, cfgKey, emoji) {
    var preview = container.querySelector('#'+previewId);
    var input = container.querySelector('#'+inputId);
    var delBtn = container.querySelector('#'+delBtnId);
    if (!preview || !input) return;
    preview.addEventListener('click', function() { input.click(); });
    input.addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      compressImage(file, 400, 0.65).then(function(dataUrl) {
        preview.innerHTML = '<img src="'+dataUrl+'" onerror="this.parentElement.textContent=\''+emoji+'\'">';
        if (delBtn) delBtn.style.display = '';
        scheduleSettingsSave(container, true);
      }).catch(function(e) { console.error('头像压缩失败:', e); });
      this.value = '';
    });
    if (delBtn) {
      delBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        preview.innerHTML = emoji;
        delBtn.style.display = 'none';
        scheduleSettingsSave(container, true);
      });
    }
  }
  _setupAvatarUpload('avatarPreview', 'charAvInput', 'btnCharAvDel', 'avatarUrl', '🏐');
  _setupAvatarUpload('userAvatarPreview', 'userAvInput', 'btnUserAvDel', 'userAvatarUrl', '🐟');
  // 聊天背景：选图 → compressImage 压缩 → 直接落盘（取 _write 布尔；失败则回滚并如实提示，绝不谎报已保存）
  (function _setupChatBg() {
    var pickBtn = container.querySelector('#cfgChatBgPick');
    var clrBtn = container.querySelector('#cfgChatBgClear');
    var input = container.querySelector('#cfgChatBgInput');
    var statusEl = container.querySelector('#cfgChatBgStatus');
    function _writeChatBg(dataUrl) {
      var cfg = STORE.config || {};
      var prev = (cfg.chatBg && typeof cfg.chatBg.image === 'string') ? cfg.chatBg.image : '';
      var next = (cfg.chatBg && typeof cfg.chatBg === 'object') ? cfg.chatBg : {};
      next.image = dataUrl;
      cfg.chatBg = next;
      if (!STORE._write('mcard_config', cfg)) {          // 配额满：不沿用 STORE.config=cfg 的静默失败
        next.image = prev;                                // 回滚内存副本
        showToast('存储空间不足，背景未保存，可先清理一些带图消息');
        return false;
      }
      applyChatVisual();
      if (statusEl) statusEl.textContent = chatBgSizeText(dataUrl);
      return true;
    }
    if (pickBtn && input) pickBtn.addEventListener('click', function () { input.click(); });
    if (clrBtn) clrBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (_writeChatBg('')) showToast('已清除聊天背景');
    });
    // 恢复默认：七值一起回出厂（配色 + 模糊 + 浓淡 + 宽高），改完立即落盘并应用
    var resetBtn = container.querySelector('#cfgHaloReset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      var e1 = container.querySelector('#cfgHaloC1'), e3 = container.querySelector('#cfgHaloC3');
      var eb = container.querySelector('#cfgHaloBlur'), ea = container.querySelector('#cfgHaloAlpha');
      var ew = container.querySelector('#cfgHaloW'), eh = container.querySelector('#cfgHaloH');
      if (e1) e1.value = HALO_DEFAULT.c1;
      if (e3) e3.value = HALO_DEFAULT.c3;
      if (eb) eb.value = HALO_DEFAULT.blur;
      if (ea) ea.value = HALO_DEFAULT.alpha;
      if (ew) ew.value = HALO_DEFAULT.w;
      if (eh) eh.value = HALO_DEFAULT.h;
      scheduleSettingsSave(container, true);      // 程序改 value 不触发 input，得手动保存
    });
    if (input) input.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var self = this;
      compressImage(file, CHATBG_MAX_PX, 0.75).then(function (dataUrl) {
        if (dataUrl.length > CHATBG_MAX_BYTES) {           // 超限：降一档再试一次
          return compressImage(file, CHATBG_RETRY_PX, 0.7).then(function (smaller) {
            if (smaller.length > CHATBG_MAX_BYTES) { showToast('图片过大（压缩后仍超 1.2MB），请换一张'); return; }
            if (_writeChatBg(smaller)) showToast('聊天背景已更新');
          });
        }
        if (_writeChatBg(dataUrl)) showToast('聊天背景已更新');
      }).catch(function (err) {
        console.error('聊天背景压缩失败:', err);
        showToast('背景图片读取失败，请重试');
      });
      self.value = '';
    });
  })();
  container.querySelectorAll('input:not([type="file"]):not([type="checkbox"]), textarea').forEach(inp=>inp.addEventListener('input', () => scheduleSettingsSave(container, false)));
  container.querySelectorAll('input[type="checkbox"], select').forEach(inp=>inp.addEventListener('change', () => scheduleSettingsSave(container, true)));
  container.querySelectorAll('.prob-msg,.prob-card').forEach(inp=>inp.addEventListener('input',()=>updateProbSums(container)));
  container.querySelector('#btnClearChat').addEventListener('click',()=>{
    if(!confirm('确定清空所有聊天记录吗？此操作不可撤销。'))return;
    STORE.messages=[];renderMessages();
  });
  // Reset all data button
  const btnResetAll = container.querySelector('#btnResetAll');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      if (!confirm('⚠️ 确定删除所有用户数据吗？\n\n保留：字卡库、大类小类、设置\n删除：聊天记录、朋友圈、日记、打卡、锐评、碎影、TA 的收藏、离线记录\n\n此操作不可撤销！')) return;
      // Nuke user-generated STORE keys
      STORE.messages = [];
      STORE.moments = [];
      STORE.likedMoments = [];
      STORE.diaries = [];
      STORE.letters = [];
      STORE.shadows = [];
      STORE.taFavs = [];
      STORE.reviews = [];
      STORE.checkins = [];
      STORE.checkinWords = ['工作','休息','学习','散步','发呆','喝水'];
      STORE.dreamEvents = {};
      STORE._write('mcard_dream_nonces', {});
      STORE.lastActive = null;
      // Reset in-memory state
      state.decayRounds = {};
      state.pendingReactionTimers = {};
      state.pendingCommentTimers = {};
      state.checkinDate = null;
      stopAllDreamEventTimers();
      // Re-render everything
      renderMessages();
      const body = document.getElementById('fsBody');
      if (body && state.fsView === 'settings') renderSettings(body);
      if (body && state.fsView === 'checkin') renderCheckin(body);
      scheduleTodayEvents();
      alert('已删除所有用户数据，初始预设已保留。请刷新页面。');
      location.reload();
    });
  }
  // Dream engine: reset today button
  const btnReset = container.querySelector('#btnResetToday');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (!confirm('确定重置今日所有梦角事件记录吗？将重新计算并回溯今天的事件。')) return;
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      clearDayEvents(dateStr);
      stopAllDreamEventTimers();
      scheduleTodayEvents();
      // Refresh settings view to show updated info
      const body = document.getElementById('fsBody');
      if (body && state.fsView === 'settings') renderSettings(body);
      alert('今日事件已重置，将重新计算并调度。');
    });
  }
  const btnExportAll = container.querySelector('#btnExportAll');
  if (btnExportAll) btnExportAll.addEventListener('click', exportAllData);
  const btnImportAll = container.querySelector('#btnImportAll');
  if (btnImportAll) btnImportAll.addEventListener('click', function() {
    if (window.AndroidBridge && typeof window.AndroidBridge.pickImportFile === 'function') {
      var ok = window.AndroidBridge.pickImportFile();
      if (!ok) alert('无法打开文件选择器');
    } else {
      var inp = document.getElementById('importAllFile'); if (inp) inp.click();
    }
  });
  const importAllFile = document.getElementById('importAllFile');
  if (importAllFile) importAllFile.addEventListener('change', function(e) { if (e.target.files[0]) { importAllData(e.target.files[0]); e.target.value = ''; } });
  // 网易云歌单刷新按钮
  const btnRefreshSongs = container.querySelector('#btnRefreshSongs');
  if (btnRefreshSongs) {
    btnRefreshSongs.addEventListener('click', function() {
      btnRefreshSongs.textContent = '拉取中...';
      btnRefreshSongs.disabled = true;
      saveSettingsFromForm(container);
      refreshSongCache().then(function(list) {
        var status = document.getElementById('songCacheStatus');
        if (status) status.textContent = (list && list.length) ? '已缓存' + list.length + '首' : '拉取失败，使用内置歌单';
        btnRefreshSongs.textContent = '🔄 刷新歌单缓存';
        btnRefreshSongs.disabled = false;
        if (list && list.length) alert('歌单已刷新，共缓存 ' + list.length + ' 首歌。');
        else alert('歌单拉取失败，将使用内置歌单兜底。');
      });
    });
  }
}

function scheduleSettingsSave(container, immediate) {
  clearTimeout(state.settingsSaveTimerId);
  var status = container.querySelector('#settingsSaveStatus');
  if (status) {
    status.textContent = immediate ? '正在保存...' : '编辑中...';
    status.classList.add('is-saving');
  }
  var delay = immediate ? 0 : 300;
  state.settingsSaveTimerId = setTimeout(function() {
    if (!container.isConnected || state.fsView !== 'settings') return;
    saveSettingsFromForm(container);
    if (status) {
      status.textContent = '已保存';
      status.classList.remove('is-saving');
    }
  }, delay);
}

// 轻提示小弹窗（自动消失）
function showToast(msg) {
  var el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.className = 'app-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._toastTimer);
  el._toastTimer = setTimeout(function() { el.classList.remove('show'); }, 1600);
}

function scheduleSettingsEngineRefresh() {
  clearTimeout(state.settingsEngineTimerId);
  state.settingsEngineTimerId = setTimeout(function() {
    stopActive();
    scheduleActive();
    stopAllDreamEventTimers();
    scheduleTodayEvents();
  }, 700);
}

function saveSettingsFromForm(container) {
  const cfg=STORE.config||{};
  // AI 解读配置
  const aiEnaEl=container.querySelector('#cfgAIEna'), aiUrlEl=container.querySelector('#cfgAIUrl'),
    aiKeyEl=container.querySelector('#cfgAIKey'), aiModelEl=container.querySelector('#cfgAIModel'),
    aiCtxEl=container.querySelector('#cfgAIContext'), aiPromptEl=container.querySelector('#cfgAIPrompt');
  var ai=cfg.aiInterpret||defaultAIInterpret();
  if(aiEnaEl)ai.enabled=aiEnaEl.checked;
  if(aiUrlEl)ai.apiUrl=aiUrlEl.value.trim()||defaultAIInterpret().apiUrl;
  if(aiKeyEl)ai.apiKey=aiKeyEl.value.trim();
  if(aiModelEl)ai.model=aiModelEl.value.trim()||defaultAIInterpret().model;
  if(aiCtxEl)ai.contextCount=Math.max(0,Math.min(20,parseInt(aiCtxEl.value)||0));
  if(aiPromptEl)ai.systemPrompt=aiPromptEl.value.trim()||defaultAIInterpret().systemPrompt;
  cfg.aiInterpret=ai;

  const nameEl=container.querySelector('#cfgName'), unameEl=container.querySelector('#cfgUserNickname');
  const amEl=container.querySelector('#cfgActiveMin'), axEl=container.querySelector('#cfgActiveMax');
  const pmEl=container.querySelector('#cfgPassiveMin'), pxEl=container.querySelector('#cfgPassiveMax');
  if(nameEl)cfg.characterName=nameEl.value.trim()||'梦角';
  // Read avatar from preview <img> src (base64 dataURL)
  var charAvImg=container.querySelector('#avatarPreview img');
  cfg.avatarUrl = charAvImg ? charAvImg.src : '';
  var userAvImg=container.querySelector('#userAvatarPreview img');
  cfg.userAvatarUrl = userAvImg ? userAvImg.src : '';
  if(unameEl)cfg.userNickname=unameEl.value.trim()||'我';
  
  // ✅ 使用新的 timing 对象来保存所有时间参数
  if(!cfg.timing)cfg.timing={};
  if(amEl||axEl){
    if(!cfg.timing.activeChat)cfg.timing.activeChat={};
    if(amEl)cfg.timing.activeChat.min=parseFloat(amEl.value)||30;
    if(axEl)cfg.timing.activeChat.max=parseFloat(axEl.value)||60;
  }
  if(pmEl||pxEl){
    if(!cfg.timing.passiveReply)cfg.timing.passiveReply={};
    if(pmEl)cfg.timing.passiveReply.min=parseFloat(pmEl.value)||0.5;
    if(pxEl)cfg.timing.passiveReply.max=parseFloat(pxEl.value)||2.5;
  }
  
  const msgP=[]; container.querySelectorAll('.prob-msg').forEach(i=>msgP.push(parseInt(i.value)||0));
  cfg.msgCountProbs=normalizeProbs(msgP);
  const cardP=[]; container.querySelectorAll('.prob-card').forEach(i=>cardP.push(parseInt(i.value)||0));
  cfg.cardCountProbs=normalizeProbs(cardP);
  
  // Dream post/reaction/comment settings
  const dpmEl=container.querySelector('#cfgDPostMin'), dpxEl=container.querySelector('#cfgDPostMax');
  const dpcmEl=container.querySelector('#cfgDPCardMin'), dpcxEl=container.querySelector('#cfgDPCardMax');
  const drmEl=container.querySelector('#cfgDRMin'), drxEl=container.querySelector('#cfgDRMax');
  const lpEl=container.querySelector('#cfgLikeProb'), cpEl=container.querySelector('#cfgCommentProb');
  const cdmEl=container.querySelector('#cfgCDMin'), cdxEl=container.querySelector('#cfgCDMax');
  
  if(!cfg.prob)cfg.prob={};
  if(dpmEl||dpxEl){
    if(!cfg.timing.dreamPost)cfg.timing.dreamPost={};
    if(dpmEl)cfg.timing.dreamPost.min=parseFloat(dpmEl.value)||2;
    if(dpxEl)cfg.timing.dreamPost.max=parseFloat(dpxEl.value)||8;
  }
  if(dpcmEl||dpcxEl){
    if(!cfg.timing.dreamPostCard)cfg.timing.dreamPostCard={};
    if(dpcmEl)cfg.timing.dreamPostCard.min=parseInt(dpcmEl.value)||1;
    if(dpcxEl)cfg.timing.dreamPostCard.max=parseInt(dpcxEl.value)||5;
  }
  if(drmEl||drxEl){
    if(!cfg.timing.dreamReaction)cfg.timing.dreamReaction={};
    if(drmEl)cfg.timing.dreamReaction.min=parseFloat(drmEl.value)||1;
    if(drxEl)cfg.timing.dreamReaction.max=parseFloat(drxEl.value)||6;
  }
  if(lpEl)cfg.prob.dreamLike=parseInt(lpEl.value)||80;
  if(cpEl)cfg.prob.dreamComment=parseInt(cpEl.value)||65;
  
  // Photo and sticker probabilities
  const photoEl = container.querySelector('#cfgPhotoProb');
  if (photoEl) cfg.prob.postPhoto = parseInt(photoEl.value) || 60;
  const stickerEl = container.querySelector('#cfgStickerFrac');
  if (stickerEl) cfg.prob.stickerFrac = parseInt(stickerEl.value) || 70;
  
  if(cdmEl||cdxEl){
    if(!cfg.timing.dreamComment)cfg.timing.dreamComment={};
    if(cdmEl)cfg.timing.dreamComment.min=parseFloat(cdmEl.value)||2;
    if(cdxEl)cfg.timing.dreamComment.max=parseFloat(cdxEl.value)||8;
  }
  
  // Decay sequence
  const decayP=[]; container.querySelectorAll('.prob-decay').forEach(i=>decayP.push(parseInt(i.value)||0));
  const d5El=container.querySelector('#cfgDecay5'); if(d5El)decayP.push(parseInt(d5El.value)||0);
  cfg.dreamReplyDecaySeq=decayP;
  const dOnEl=container.querySelector('#cfgDecayOn'); cfg.dreamReplyDecayOn=dOnEl?dOnEl.checked:true;
  
  // Diary settings
  const dgmEl=container.querySelector('#cfgDGMin'), dgxEl=container.querySelector('#cfgDGMax');
  const dcpEl=container.querySelector('#cfgDCProb'), dcdmEl=container.querySelector('#cfgDCDMin'), dcdxEl=container.querySelector('#cfgDCDMax');
  if(dgmEl||dgxEl){
    if(!cfg.timing.diaryGen)cfg.timing.diaryGen={};
    if(dgmEl)cfg.timing.diaryGen.hourMin=parseInt(dgmEl.value)||21;
    if(dgxEl)cfg.timing.diaryGen.hourMax=parseInt(dgxEl.value)||24;
  }
  if(dcpEl)cfg.prob.diaryComment=parseInt(dcpEl.value)||70;
  if(dcdmEl||dcdxEl){
    if(!cfg.timing.diaryComment)cfg.timing.diaryComment={};
    if(dcdmEl)cfg.timing.diaryComment.min=parseInt(dcdmEl.value)||30;
    if(dcdxEl)cfg.timing.diaryComment.max=parseInt(dcdxEl.value)||120;
  }
  const letterDelayMinEl=container.querySelector('#cfgLetterDelayMin'), letterDelayMaxEl=container.querySelector('#cfgLetterDelayMax');
  const letterCoverageMinEl=container.querySelector('#cfgLetterCoverageMin'), letterCoverageMaxEl=container.querySelector('#cfgLetterCoverageMax');
  const letterCardMinEl=container.querySelector('#cfgLetterCardMin'), letterCardMaxEl=container.querySelector('#cfgLetterCardMax');
  if(letterDelayMinEl||letterDelayMaxEl||letterCoverageMinEl||letterCoverageMaxEl||letterCardMinEl||letterCardMaxEl){
    const currentLetter=getLetterConfig();
    cfg.letter={
      annotationDelay: normalizeLetterRange(
        letterDelayMinEl ? letterDelayMinEl.value : currentLetter.annotationDelay.min,
        letterDelayMaxEl ? letterDelayMaxEl.value : currentLetter.annotationDelay.max,
        5, 30, 1, 1440
      ),
      coverage: normalizeLetterRange(
        letterCoverageMinEl ? letterCoverageMinEl.value : currentLetter.coverage.min,
        letterCoverageMaxEl ? letterCoverageMaxEl.value : currentLetter.coverage.max,
        25, 50, 1, 100
      ),
      cardCount: normalizeLetterRange(
        letterCardMinEl ? letterCardMinEl.value : currentLetter.cardCount.min,
        letterCardMaxEl ? letterCardMaxEl.value : currentLetter.cardCount.max,
        1, 1, 1, 3
      )
    };
  }
  // NetEase song settings
  const neEnaEl=container.querySelector('#cfgNeteaseEna'), neProbEl=container.querySelector('#cfgNeteaseProb'), neIdsEl=container.querySelector('#cfgNeteaseIds');
  if(neEnaEl||neProbEl||neIdsEl){
    const currentNetease=getNeteaseConfig();
    var idsStr=(neIdsEl?neIdsEl.value.trim():'') || currentNetease.playlistIds.join(',');
    var idsArr=idsStr.split(/[,，]/).map(function(s){return s.trim();}).filter(Boolean);
    cfg.netease={
      enabled: neEnaEl ? neEnaEl.checked : currentNetease.enabled,
      prob: neProbEl ? Math.max(0, Math.min(100, parseInt(neProbEl.value)||0)) : currentNetease.prob,
      playlistIds: idsArr.length ? idsArr : ['135597299'],
      builtinFallback: true,
    };
  }
  // Review settings
  const rcpEl=container.querySelector('#cfgRCProb'), rccEl=container.querySelector('#cfgRCardCnt'), rmdEl=container.querySelector('#cfgRMode');
  if(rcpEl)cfg.prob.reviewCounter=parseInt(rcpEl.value)||20;
  if(rccEl)cfg.reviewCardCount=parseInt(rccEl.value)||3;
  if(rmdEl)cfg.reviewMode=rmdEl.value||'random';
  // Doodle probability
  const doodleProbEl=container.querySelector('#cfgDoodleProb');
  if(doodleProbEl)cfg.prob.doodle=parseInt(doodleProbEl.value)||0;
  // 0 是合法值（=关闭），所以不能用 ||（那会把 0 变成默认 10）
  var osProbEl=document.getElementById('cfgOsProb');
  if(osProbEl){ var osv=parseInt(osProbEl.value); cfg.prob.os = isNaN(osv) ? 10 : Math.max(0, Math.min(100, osv)); }
  // Checkin settings
  const ciAutoEl=container.querySelector('#cfgCIAuto');
  if(ciAutoEl)cfg.checkinAutoEnabled=ciAutoEl.checked;
  const ciTSel=container.querySelector('#cfgCITStart'), ciTEel=container.querySelector('#cfgCITEnd');
  if(ciTSel||ciTEel){
    if(!cfg.timing.checkin)cfg.timing.checkin={};
    if(ciTSel)cfg.timing.checkin.timeStart=parseInt(ciTSel.value)||9;
    if(ciTEel)cfg.timing.checkin.timeEnd=parseInt(ciTEel.value)||21;
  }
  const ciIMinEl=container.querySelector('#cfgCIIntervalMin'), ciIMaxEl=container.querySelector('#cfgCIIntervalMax');
  if(ciIMinEl||ciIMaxEl){
    if(!cfg.timing.checkin)cfg.timing.checkin={};
    if(ciIMinEl)cfg.timing.checkin.intervalMin=parseInt(ciIMinEl.value)||30;
    if(ciIMaxEl)cfg.timing.checkin.intervalMax=parseInt(ciIMaxEl.value)||120;
  }
  // Save dream engine settings
  const engCfg = cfg.dreamEngine || {};
  if (!engCfg.enabled) engCfg.enabled = {};
  if (!engCfg.perDay) engCfg.perDay = {};
  if (!engCfg.prob) engCfg.prob = {};

  // Wake / sleep
  const wakeEl = container.querySelector('#cfgWakeTime');
  if (wakeEl) engCfg.wakeTime = parseInt(wakeEl.value) || 7;
  const sleepEl = container.querySelector('#cfgSleepTime');
  if (sleepEl) engCfg.sleepTime = parseInt(sleepEl.value) || 23;

  // Diary time (independent)
  const ddWinS = container.querySelector('#cfgDETWDDS'), ddWinE = container.querySelector('#cfgDETWDDE');
  if (ddWinS) engCfg.diaryTimeStart = parseInt(ddWinS.value) || 21;
  if (ddWinE) engCfg.diaryTimeEnd = parseInt(ddWinE.value) || 24;

  // Helper: read per-day min/max
  function _savePerDay(prefix, id, defMin, defMax) {
    const minEl = container.querySelector('#cfgDEPD' + prefix + 'Min');
    const maxEl = container.querySelector('#cfgDEPD' + prefix + 'Max');
    if (!minEl || !maxEl) return;
    if (!engCfg.perDay[id]) engCfg.perDay[id] = {};
    var mv = parseInt(minEl.value), Mv = parseInt(maxEl.value);
    engCfg.perDay[id].min = (isNaN(mv) || mv < 0) ? defMin : mv;
    engCfg.perDay[id].max = (isNaN(Mv) || Mv < 0) ? defMax : Mv;
  }

  // Dream post
  const deEnaPost = container.querySelector('#cfgDEEnaPost');
  if (deEnaPost) engCfg.enabled.dreamPost = deEnaPost.checked;
  _savePerDay('Post', 'dreamPost', 2, 8);
  const photoProbEl = container.querySelector('#cfgPhotoProb');
  if (photoProbEl) engCfg.prob.dreamPostPhoto = parseInt(photoProbEl.value) || 60;
  const stickerFracEl = container.querySelector('#cfgStickerFrac');
  if (stickerFracEl) engCfg.prob.dreamStickerFrac = parseInt(stickerFracEl.value) || 70;
  const chatStickerEl = container.querySelector('#cfgChatSticker');
  if (chatStickerEl) engCfg.prob.dreamChatSticker = parseInt(chatStickerEl.value) || 0;

  // Dream checkin
  const deEnaCI = container.querySelector('#cfgDEEnaCI');
  if (deEnaCI) engCfg.enabled.dreamCheckin = deEnaCI.checked;
  _savePerDay('CI', 'dreamCheckin', 3, 12);
  const ciIntvEl = container.querySelector('#cfgCIIntv');
  if (ciIntvEl) { if (!engCfg.interval) engCfg.interval = {}; engCfg.interval.dreamCheckin = parseInt(ciIntvEl.value) || 45; }

  // Dream chat
  const deEnaChat = container.querySelector('#cfgDEEnaChat');
  if (deEnaChat) engCfg.enabled.dreamChat = deEnaChat.checked;
  _savePerDay('Chat', 'dreamChat', 5, 15);
  const recallProbEl = container.querySelector('#cfgRecallProb');
  if (recallProbEl) engCfg.prob.recallProb = parseFloat(recallProbEl.value) ?? 1;

  // Dream diary comment
  const deEnaDC = container.querySelector('#cfgDEEnaDC');
  if (deEnaDC) engCfg.enabled.dreamDiaryComment = deEnaDC.checked;
  const dcProbEl = container.querySelector('#cfgDCProbNew');
  if (dcProbEl) engCfg.prob.dreamDiaryComment = parseInt(dcProbEl.value) || 70;

  // Dream diary
  const deEnaDD = container.querySelector('#cfgDEEnaDD');
  if (deEnaDD) engCfg.enabled.dreamDiary = deEnaDD.checked;

  // Shadow fragment (碎影)
  const shEna = container.querySelector('#cfgShadowEna');
  if (shEna) engCfg.enabled.dreamShadow = shEna.checked;
  _savePerDay('Shadow', 'dreamShadow', 1, 2);
  const shMinEl = container.querySelector('#cfgShadowMin');
  const shMaxEl = container.querySelector('#cfgShadowMax');
  if (shMinEl || shMaxEl) {
    if (!cfg.shadow) cfg.shadow = {};
    var sMin = parseInt(shMinEl && shMinEl.value, 10);
    var sMax = parseInt(shMaxEl && shMaxEl.value, 10);
    if (!(sMin > 0)) sMin = 1;
    if (!(sMax >= sMin)) sMax = 180;
    cfg.shadow.min = sMin;
    cfg.shadow.max = sMax;
  }
  // 间隔/开关变了 → 清掉旧的下次检查点，让新间隔立刻生效（否则要等旧 nextAt 到点）。
  // 必须改**本地 cfg** 再随下面的 STORE.config=cfg 一起落盘：
  // 若在这里调 shadowResetRoll()，它写回的是 STORE.config 的另一份副本，
  // 会被下面这行整体覆盖掉，重置静默失效。
  if (!cfg.shadow) cfg.shadow = {};
  cfg.shadow.state = { nextAt: 0 };

  // 拼音组句
  const pyOnEl = container.querySelector('#cfgPyOn');
  const pyRatioEl = container.querySelector('#cfgPyRatio');
  const pyEngEl = container.querySelector('#cfgPyEngine');
  const pyLMinEl = container.querySelector('#cfgPyLenMin');
  const pyLMaxEl = container.querySelector('#cfgPyLenMax');
  const pyClarEl = container.querySelector('#cfgPyClarity');
  const pyToneEl = container.querySelector('#cfgPyTone');
  const pyTempEl = container.querySelector('#cfgPyTemp');
  const pyStripEl = container.querySelector('#cfgPyStripProper');
  const pyBlEl = container.querySelector('#cfgPyBlacklist');
  if (pyOnEl || pyRatioEl || pyEngEl || pyLMinEl || pyLMaxEl || pyClarEl || pyToneEl || pyBlEl || pyTempEl || pyStripEl) {
    if (!cfg.py) cfg.py = {};
    if (pyOnEl) cfg.py.on = !!pyOnEl.checked;
    if (pyRatioEl) { var pR = parseInt(pyRatioEl.value, 10); if (isNaN(pR) || pR < 0) pR = 0; if (pR > 100) pR = 100; cfg.py.ratio = pR; }
    if (pyEngEl) cfg.py.engine = PY_ENGINES.indexOf(pyEngEl.value) >= 0 ? pyEngEl.value : 'markov';
    if (cfg.py.engine === 'wordchain') pyLexLoad();     // 选了词级才去拉词表（按需，约 160KB）
    if (pyLMinEl) { var pMin = parseInt(pyLMinEl.value, 10); if (isNaN(pMin) || pMin < 1) pMin = 1; cfg.py.lenMin = Math.min(pMin, 20); }
    if (pyLMaxEl) { var pMax = parseInt(pyLMaxEl.value, 10); if (isNaN(pMax) || pMax < 1) pMax = 1; cfg.py.lenMax = Math.min(pMax, 20); }
    if (cfg.py.lenMin > cfg.py.lenMax) cfg.py.lenMax = cfg.py.lenMin;   // 钳制：最少不得大于最多
    if (pyClarEl) { var pC = parseInt(pyClarEl.value, 10); if (isNaN(pC) || pC < 0) pC = PY_DEFAULTS.clarity; if (pC > 100) pC = 100; cfg.py.clarity = pC; }
    if (pyToneEl) cfg.py.tone = pyToneEl.checked ? 1 : 0;
    if (pyTempEl) { var pT = parseInt(pyTempEl.value, 10); if (isNaN(pT)) pT = PY_DEFAULTS.tempPct; if (pT < 30) pT = 30; if (pT > 200) pT = 200; cfg.py.tempPct = pT; }
    if (pyStripEl) {
      cfg.py.stripProper = !!pyStripEl.checked;
      // 立刻按新值重建剔除名单并作废词级模型：不这样做，开关翻完不生效（要等下次重载）
      pyLexApplyStrip(cfg.py.stripProper);
      pyInvalidate();
    }
    if (pyBlEl) {
      cfg.py.blacklist = String(pyBlEl.value || '').split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    cfg.py.surfaces = { chat: true };   // v1 只启用聊天链路（见段落注释）
  }

  // TA 的收藏（你发消息时梦角偶尔收下你说的那句话）
  const taEna = container.querySelector('#cfgTaFavEna');
  const taProbEl = container.querySelector('#cfgTaFavProb');
  const taMaxEl = container.querySelector('#cfgTaFavDailyMax');
  const taMinEl = container.querySelector('#cfgTaFavMinLen');
  if (taEna || taProbEl || taMaxEl || taMinEl) {
    if (!cfg.taFav) cfg.taFav = {};
    if (taEna) cfg.taFav.enabled = taEna.checked;
    if (taProbEl) {
      var tProb = parseFloat(taProbEl.value);
      if (isNaN(tProb) || tProb < 0) tProb = TAF_DEFAULT.prob;
      if (tProb > 100) tProb = 100;
      cfg.taFav.prob = tProb;
    }
    if (taMaxEl) {
      var tMax = parseInt(taMaxEl.value, 10);
      if (isNaN(tMax) || tMax < 0) tMax = TAF_DEFAULT.dailyMax;
      cfg.taFav.dailyMax = tMax;
    }
    if (taMinEl) {
      var tMin = parseInt(taMinEl.value, 10);
      if (!(tMin >= 1)) tMin = TAF_DEFAULT.minLen;
      cfg.taFav.minLen = tMin;
    }
  }

  // 聊天背景与大光晕
  const haloOnEl = container.querySelector('#cfgHaloOn');
  const haloC1El = container.querySelector('#cfgHaloC1');
  const haloC3El = container.querySelector('#cfgHaloC3');
  const haloBlurEl = container.querySelector('#cfgHaloBlur');
  const haloAlphaEl = container.querySelector('#cfgHaloAlpha');
  const haloWEl = container.querySelector('#cfgHaloW');
  const haloHEl = container.querySelector('#cfgHaloH');
  if (haloOnEl || haloC1El || haloC3El || haloBlurEl || haloAlphaEl || haloWEl || haloHEl) {
    if (!cfg.halo) cfg.halo = {};
    const _hHex = /^#[0-9a-fA-F]{6}$/;
    if (haloOnEl) cfg.halo.on = !!haloOnEl.checked;
    if (haloC1El && _hHex.test(haloC1El.value)) cfg.halo.c1 = haloC1El.value.toLowerCase();
    if (haloC3El && _hHex.test(haloC3El.value)) cfg.halo.c3 = haloC3El.value.toLowerCase();
    if (haloBlurEl) { var hB = parseInt(haloBlurEl.value, 10); if (isNaN(hB) || hB < 0) hB = HALO_DEFAULT.blur; if (hB > 60) hB = 60; cfg.halo.blur = hB; }
    if (haloAlphaEl) { var hA = parseInt(haloAlphaEl.value, 10); if (isNaN(hA) || hA < 0) hA = HALO_DEFAULT.alpha; if (hA > 100) hA = 100; cfg.halo.alpha = hA; }
    if (haloWEl) { var hW = parseInt(haloWEl.value, 10); if (isNaN(hW) || hW < HALO_MIN_PX) hW = HALO_DEFAULT.w; if (hW > HALO_MAX_PX) hW = HALO_MAX_PX; cfg.halo.w = hW; }
    if (haloHEl) { var hH = parseInt(haloHEl.value, 10); if (isNaN(hH) || hH < HALO_MIN_PX) hH = HALO_DEFAULT.h; if (hH > HALO_MAX_PX) hH = HALO_MAX_PX; cfg.halo.h = hH; }
  }
  // 我的气泡不透明度（%）：颜色留在 CSS，这里只存 alpha
  const bubbleAlphaEl = container.querySelector('#cfgBubbleUserAlpha');
  if (bubbleAlphaEl) {
    if (!cfg.bubble) cfg.bubble = {};
    var bA = parseInt(bubbleAlphaEl.value, 10);
    if (isNaN(bA) || bA < 0) bA = BUBBLE_DEFAULT.userAlpha;
    if (bA > 100) bA = 100;
    cfg.bubble.userAlpha = bA;
  }

  cfg.dreamEngine = engCfg;
  STORE.config=cfg;
  applyChatVisual();
  renderHeader();
  scheduleSettingsEngineRefresh();
  showToast('✅ 设置已保存');
}

function updateProbSums(container) {
  const ms=container.querySelector('#probMsgSum'), cs=container.querySelector('#probCardSum');
  if(ms){const v=[];container.querySelectorAll('.prob-msg').forEach(i=>v.push(parseInt(i.value)||0));ms.textContent=v.reduce((a,b)=>a+b,0);}
  if(cs){const v=[];container.querySelectorAll('.prob-card').forEach(i=>v.push(parseInt(i.value)||0));cs.textContent=v.reduce((a,b)=>a+b,0);}
}

// ============ Rendering: Moments (朋友圈) ============
function renderMoments(container) {
  const cfg=STORE.config||{};
  const name=cfg.userNickname||'我';
  const av=cfg.userAvatarUrl ? `<img src="${escapeHtml(cfg.userAvatarUrl)}" alt="${escapeHtml(name)}头像" onerror="this.parentElement.textContent='🐟'">` : '🐟';
  const coverUrl=STORE._read('mcard_momentsCover')||'';
  const coverStyle=coverUrl ? ` style="background-image:linear-gradient(180deg,rgba(53,43,30,.08),rgba(40,32,24,.58)),url('${escapeHtml(coverUrl)}');background-size:cover;background-position:center;background-repeat:no-repeat"` : '';
  container.innerHTML=`
  <div class="moments-page">
    <section class="moments-cover" data-od-id="moments-cover" aria-label="朋友圈个人资料"${coverStyle}>
      <div class="moments-cover-top">
        <button class="moments-cover-camera" id="btnPublish" title="发表动态" aria-label="发表动态">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l1.5-2h7L17 7h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7Z"/><circle cx="12" cy="13" r="3.5"/></svg>
        </button>
      </div>
      <div class="moments-profile">
        <div class="moments-profile-copy"><div class="moments-profile-name">${escapeHtml(name)}</div><div class="moments-profile-note">在这里，留下想和你分享的每一刻</div></div>
        <div class="moments-profile-avatar">${av}</div>
      </div>
    </section>
    <input type="file" id="momentsCoverInput" accept="image/*" style="display:none">
    <div class="moments-feed" id="momentsFeed"></div>
  </div>`;

  renderFeed();
  bindMomentsEvents(container);
}

function renderFeed() {
  const feed=document.getElementById('momentsFeed'); if(!feed)return;
  const moments=STORE.moments||[], liked=STORE.likedMoments||[];
  const cfg=STORE.config||{};
  const name=cfg.characterName||'梦角', avUrl=cfg.avatarUrl||'';

  // Sort by timestamp descending
  const sorted=[...moments].sort((a,b)=>b.timestamp-a.timestamp);

  if(sorted.length===0){
    feed.innerHTML='<div style="text-align:center;color:var(--text-muted);padding:60px 20px;font-size:13px;">暂无动态，点击右上角 <svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h3l1.5-2h7L17 7h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7Z"/><circle cx="12" cy="13" r="3.5"/></svg> 发表第一条</div>';
    return;
  }

  feed.innerHTML=sorted.map(m=>{
    const isUser=m.publisher==='user';
    const pubName=isUser?(cfg.userNickname||'我'):name;
    const pubAv=isUser?'👤':(avUrl?`<img src="${escapeHtml(avUrl)}" onerror="this.parentElement.textContent='🏐'">`:'🏐');
    const likesArr=Array.isArray(m.likes)?m.likes:[];
    const isLiked=likesArr.some(l=>l.liker==='user');
    const isUser2=m.publisher==='user';
    const likeCount=likesArr.length;
    const timeStr=formatTime(m.timestamp);
    const comments=m.comments||[];

    // Build liker names
    let likerStr='';
    if(likeCount>0){
      const names=likesArr.map(l=>l.liker==='user'?(cfg.userNickname||'我'):name);
      const unique=[...new Set(names)];
      if(unique.length<=3)likerStr=unique.join('、');
      else likerStr=unique.slice(0,2).join('、')+` 等${likeCount}人`;
      likerStr='<svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 8.7c0 5.4-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.7A4.2 4.2 0 0 1 11 6.3a4.2 4.2 0 0 1 9.8 2.4Z"/></svg> '+likerStr;
    }

    // Build comments HTML
    let commentsHtml='';
    if(comments.length>0){
      commentsHtml=comments.map(function(c,ci){
        const cName=c.commenter==='user'?(cfg.userNickname||'我'):name;
        var html='<div class="mc-item"><b>'+escapeHtml(cName)+'：</b>'+escapeHtml(c.content)+'</div>';
        if(c.commenter==='dream'){
          html+='<button class="mi-act mi-ai-btn" data-mid="'+m.id+'" data-cid="comment_'+ci+'" data-action="aiInterpretComment" style="font-size:11px;margin:2px 0 4px;"><svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.2 3.1-3.1 1.2 1.2-3.1z"/></svg> 解读这条评论</button>';
          html+='<div class="ai-box" data-ai-target="moment-comment" data-mid="'+m.id+'" data-cid="comment_'+ci+'"></div>';
        }
        return html;
      }).join('');
    }else{
      commentsHtml='<div class="mc-empty">暂无评论</div>';
    }

    return `<div class="moment-item" data-mid="${m.id}">
      <div class="mi-avatar">${pubAv}</div>
      <div class="mi-body">
        <div class="mi-name">${escapeHtml(pubName)}</div>
        <div class="mi-text">${escapeHtml(m.content)}</div>
        ${m.imageDataList&&m.imageDataList.length>0?'<div class="mi-photos">'+m.imageDataList.map(function(u){return '<div class="mi-photo"><img src="'+u+'" alt="配图" loading="lazy"></div>';}).join('')+'</div>':''}
        ${!m.imageDataList&&m.imageUrl?`<div class="mi-photo-single"><img src="${escapeHtml(m.imageUrl)}" alt="配图" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`:''}
        <div class="mi-time">${timeStr}</div>
        <div class="mi-actions">
          <button class="mi-act mi-like-btn ${isLiked?'liked':''}" data-mid="${m.id}" data-action="like">
            <svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 8.7c0 5.4-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.7A4.2 4.2 0 0 1 11 6.3a4.2 4.2 0 0 1 9.8 2.4Z"/></svg> <span class="like-count">${likeCount||'赞'}</span>
          </button>
          <button class="mi-act mi-comment-btn" data-mid="${m.id}" data-action="comment"><svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7A2.5 2.5 0 0 1 16.5 15H11l-4.5 3v-3h-1A2.5 2.5 0 0 1 3 12.5v-7Z"/><path d="M8 8h8M8 11h4"/></svg> 评论</button>
          ${!isUser?`<button class="mi-act mi-ai-btn" data-mid="${m.id}" data-action="aiInterpret"><svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.2 3.1-3.1 1.2 1.2-3.1z"/></svg> 解读这条朋友圈</button>`:''}
        </div>
        ${!isUser?`<div class="ai-box" data-ai-target="moment-post" data-mid="${m.id}"></div>`:''}
        ${likerStr?`<div class="mi-likers">${likerStr}</div>`:''}
        <div class="moment-comments" id="mc-${m.id}">
          ${commentsHtml}
          <div class="mc-input-row">
            <input type="text" class="mc-input" placeholder="写评论…" maxlength="200">
            <button class="mc-send" data-mid="${m.id}" data-action="sendComment"><svg class="mi-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21 3 10 14"/><path d="m21 3-4 18-5-7-7-4 16-7Z"/></svg><span>发送</span></button>
          </div>
        </div>
      </div>
      ${isUser2?`<button class="mi-del-btn" data-mid="${m.id}" data-action="delete" title="删除"><svg class="mi-icon mi-delete-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M6 7l1 14h10l1-14"/></svg></button>`:''}
    </div>`;
  }).join('');
}

function bindMomentsEvents(container) {
  // Publish button (re-created each time, always bind fresh)
  const pubBtn=container.querySelector('#btnPublish');
  if(pubBtn)pubBtn.addEventListener('click',showPublishModal);

    const cover=container.querySelector('.moments-cover');
    const coverInput=container.querySelector('#momentsCoverInput');
    if(cover&&coverInput){
      cover.addEventListener('click',function(e){
        if(e.target.closest('#btnPublish'))return;
        coverInput.click();
      });
      coverInput.addEventListener('change',function(){
        const file=this.files&&this.files[0];
        if(!file)return;
        cropMomentsCover(file, cover.clientWidth || 430, cover.clientHeight || 258).then(function(dataUrl){
          STORE._write('mcard_momentsCover',dataUrl);
          cover.style.backgroundImage='linear-gradient(180deg,rgba(53,43,30,.08),rgba(40,32,24,.58)),url("'+dataUrl+'")';
          cover.style.backgroundSize='cover';
          cover.style.backgroundPosition='center';
          cover.style.backgroundRepeat='no-repeat';
          this.value='';
        }.bind(this)).catch(function(){ alert('背景图片读取失败，请重试'); });
      });
    }

    // Delegated listeners: bind only ONCE per container lifetime
  if(container._momentsBound)return;
  container._momentsBound=true;

  // Event delegation for all feed actions (persists across renderFeed calls)
  container.addEventListener('click',function(e){
    const btn=e.target.closest('[data-action]');
    if(!btn)return;
    const action=btn.dataset.action;
    const mid=btn.dataset.mid;

    if(action==='like'){
      toggleLike(mid);
    } else if(action==='comment'){
      // Comments always visible now, focus the input for this moment
      const mc=document.getElementById('mc-'+mid);
      if(mc){ var inp=mc.querySelector('.mc-input'); if(inp)inp.focus(); }
    } else if(action==='sendComment'){
      const row=btn.parentElement;
      const inp=row?row.querySelector('.mc-input'):null;
      if(inp){
        const text=inp.value.trim();
        if(!text){alert('请输入评论内容');return;}
        inp.value='';
        addComment(mid,'user',text);
      }
    } else if(action==='aiInterpretComment'){
      e.stopPropagation();
      if(!isAIInterpretReady()){alert('请先到「设置 → AI 解读」开启功能并填写 API Key');return;}
      var cid=btn.dataset.cid;
      var moments=STORE.moments||[];
      var moment=moments.find(x=>x.id===mid);
      if(!moment)return;
      var commentIdx=parseInt(cid.replace('comment_',''),10);
      var comment=moment.comments[commentIdx];
      if(!comment)return;
      var box=btn.parentElement.querySelector('.ai-box');
      if(!box)return;
      // Find index in combined comments+likes for context
      var userName=(STORE.config||{}).userNickname||'我';
      var charName=(STORE.config||{}).characterName||'梦角';
      var postAuthor=moment.publisher==='user'?userName:charName;
      // Build context: who posted, all comments up to this one
      var allMsgs=[];
      allMsgs.push({role:'system',content:postAuthor+'的朋友圈原文："'+moment.content+'"'});
      (moment.comments||[]).forEach(function(c){
        var r=c.commenter==='user'?userName:charName;
        allMsgs.push({role:c.commenter==='dream'?'assistant':'user',content:r+'：'+c.content});
      });
      var commentGlobalIdx=allMsgs.findIndex(function(m){
        return m.content&&m.content.indexOf(comment.content)>=0;
      });
      if(commentGlobalIdx<1)commentGlobalIdx=allMsgs.length-1;
      runAIInterpretOnBox(box, {
        targetText: charName+'的评论："'+comment.content+'"',
        contextMessages: allMsgs.slice(0,commentGlobalIdx),
        scene: 'moments-comment',
        loadingText: '解读评论中',
        favoriteMeta: {
          sourceType: 'moment-comment',
          sourceId: mid,
          sourceSubId: String(commentIdx),
          sourceLabel: '朋友圈评论',
          text: comment.content
        }
      });
    } else if(action==='delete'){
      deleteMoment(mid);
    } else if(action==='aiInterpret'){
      e.stopPropagation();
      if(!isAIInterpretReady()){alert('请先到「设置 → AI 解读」开启功能并填写 API Key');return;}
      var moments=STORE.moments||[];
      var moment=moments.find(x=>x.id===mid);
      if(!moment)return;
      var box=btn.closest('.mi-body').querySelector('.ai-box[data-ai-target="moment-post"]');
      if(!box)return;
      var userName=(STORE.config||{}).userNickname||'我';
      var charName=(STORE.config||{}).characterName||'梦角';
      var postAuthor=moment.publisher==='user'?userName:charName;
      var ctxMsgs=[{role:'system',content:postAuthor+'的朋友圈原文："'+moment.content+'"'}];
      (moment.comments||[]).forEach(function(c){
        var r=c.commenter==='user'?userName:charName;
        ctxMsgs.push({role:c.commenter==='dream'?'assistant':'user',content:r+'：'+c.content});
      });
      var isMine=moment.publisher==='dream';
      runAIInterpretOnBox(box, {
        targetText: moment.content,
        contextMessages: ctxMsgs,
        scene: isMine?'moments':'moments-friend',
        loadingText: '解读朋友圈中',
        favoriteMeta: {
          sourceType: 'moment',
          sourceId: moment.id,
          sourceLabel: '朋友圈',
          text: moment.content
        }
      });
    }
  });

  // Comment input Enter key (delegated)
  container.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.classList.contains('mc-input')){
      e.preventDefault();
      const inp=e.target;
      const text=inp.value.trim();
      if(!text){alert('请输入评论内容');return;}
      const mid=inp.closest('.moment-comments')?.id?.replace('mc-','');
      if(mid){inp.value='';addComment(mid,'user',text);}
    }
  });
}

// ============ Moments Actions ============
function showPublishModal() {
  showModal(`<h3>发表动态</h3>
    <div class="publish-modal">
      <textarea class="pm-textarea" id="pmText" placeholder="分享新鲜事…" maxlength="2000"></textarea>
      <div class="pm-photo-row">
        <button class="pm-add-photo" id="pmAddPhoto" type="button">📷 添加图片</button>
        <span class="pm-photo-hint">最多3张</span>
      </div>
      <input type="file" id="pmFileInput" accept="image/*" multiple style="display:none">
      <div class="pm-preview" id="pmPreview"></div>
    </div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="hideModal()">取消</button>
      <button class="btn-primary" id="pmPublish">发表</button>
    </div>`);

  // Photo selection for moments publish
  _pmImages = [];
  document.getElementById('pmAddPhoto').addEventListener('click',function(){
    document.getElementById('pmFileInput').click();
  });
  document.getElementById('pmFileInput').addEventListener('change',function(){
    var files = Array.from(this.files || []);
    if (_pmImages.length + files.length > 3) { alert('最多只能添加3张图片'); this.value = ''; return; }
    var pending = files.map(function(f) { return compressImage(f); });
    Promise.all(pending).then(function(results) {
      _pmImages = _pmImages.concat(results);
      if (_pmImages.length > 3) _pmImages = _pmImages.slice(0, 3);
      renderPmPreview();
    }).catch(function(e) { console.error('图片压缩失败:', e); });
    this.value = '';
  });

  function renderPmPreview() {
    var prev = document.getElementById('pmPreview');
    var hint = document.querySelector('.pm-photo-hint');
    if (hint) hint.textContent = _pmImages.length > 0 ? '已选 '+_pmImages.length+'/3 张' : '最多3张';
    if (!prev) return;
    prev.innerHTML = _pmImages.map(function(u, i) {
      return '<div class="pm-thumb"><img src="'+u+'" alt="预览"><button class="pm-thumb-del" data-idx="'+i+'" type="button">✕</button></div>';
    }).join('');
    prev.querySelectorAll('.pm-thumb-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _pmImages.splice(parseInt(this.dataset.idx), 1);
        renderPmPreview();
      });
    });
  }

  document.getElementById('pmPublish').addEventListener('click',()=>{
    const text=document.getElementById('pmText').value.trim();
    if(!text&&_pmImages.length===0){alert('请输入内容或添加图片');return;}
    const moments=STORE.moments||[];
    const mid='mom_'+Date.now();
    var imageDataList = _pmImages.slice();
    moments.push({
      id:mid,
      publisher:'user',
      content:text,
      timestamp:Date.now(),
      likes:[],
      comments:[],
      imageDataList: imageDataList,
      imageUrl:'',
      dreamProcessed:false,
    });
    STORE.moments=moments;
    _pmImages = [];
    hideModal();
    renderFeed();
    // Schedule delayed dream reaction to the new moment
    scheduleDreamReaction(mid);
  });
}

function toggleLike(mid) {
  const moments=STORE.moments||[], liked=STORE.likedMoments||[];
  const moment=moments.find(m=>m.id===mid);
  if(!moment)return;
  // Ensure likes is an array
  if(!Array.isArray(moment.likes))moment.likes=[];
  const userLikeIdx=moment.likes.findIndex(l=>l.liker==='user');
  if(userLikeIdx>=0){
    // Unlike
    moment.likes.splice(userLikeIdx,1);
    const lidx=liked.indexOf(mid);
    if(lidx>=0)liked.splice(lidx,1);
  } else {
    // Like
    moment.likes.push({liker:'user',timestamp:Date.now()});
    liked.push(mid);
  }
  STORE.moments=moments; STORE.likedMoments=liked;
  renderFeed();
}

// ============ Comment & Dream Reply (with delay + decay) ============
function addComment(mid, commenter, content) {
  const moments=STORE.moments||[];
  const moment=moments.find(m=>m.id===mid);
  if(!moment)return;
  if(!Array.isArray(moment.comments))moment.comments=[];
  moment.comments.push({commenter,content,timestamp:Date.now()});
  STORE.moments=moments;
  renderFeed();
  // User comment → schedule delayed dream reply with decay
  if(commenter==='user'){
    scheduleCommentReply(mid);
  }
}

function scheduleCommentReply(mid) {
  const cfg=STORE.config||{};
  const decayOn=cfg.dreamReplyDecayOn!==false;
  // Increment decay round (in-memory)
  if(decayOn){
    state.decayRounds[mid]=(state.decayRounds[mid]||0)+1;
  }
  const round=decayOn?state.decayRounds[mid]:1;

  // Clear any existing pending timer for this moment
  if(state.pendingCommentTimers[mid]){
    clearTimeout(state.pendingCommentTimers[mid]);
  }

  const minS=(cfg.dreamCommentDelayMin!=null?cfg.dreamCommentDelayMin:2)*1000;
  const maxS=(cfg.dreamCommentDelayMax!=null?cfg.dreamCommentDelayMax:8)*1000;
  const delay=randomBetween(minS,maxS);

  // Store pending info on moment for refresh recovery
  const moments=STORE.moments||[];
  const moment=moments.find(m=>m.id===mid);
  if(moment){
    moment._pendingCommentReply={round,scheduledAt:Date.now()+delay};
    STORE.moments=moments;
  }

  const tid=setTimeout(()=>{
    delete state.pendingCommentTimers[mid];
    dreamReplyToComment(mid,round);
  },delay);
  state.pendingCommentTimers[mid]=tid;
}

function dreamReplyToComment(mid, round) {
  const cfg=STORE.config||{};
  const decayOn=cfg.dreamReplyDecayOn!==false;
  const decaySeq=cfg.dreamReplyDecaySeq||[100,70,40,10,0];

  // Decay check
  if(decayOn){
    const idx=Math.min(round-1,decaySeq.length-1);
    const prob=decaySeq[idx]||0;
    if(Math.random()*100>=prob)return; // missed — no reply
  }

  if(!checkWordCards())return;
  const moments=STORE.moments||[];
  const moment=moments.find(m=>m.id===mid);
  if(!moment)return;
  const name=cfg.characterName||'梦角';
  const replyText='@我：'+generateMessage();
  if(!Array.isArray(moment.comments))moment.comments=[];
  moment.comments.push({commenter:'dream',content:replyText,timestamp:Date.now()});
  // Clean up pending marker
  delete moment._pendingCommentReply;
  STORE.moments=moments;
  renderFeed();
}

// On page load: recover pending comment replies (immediate decay check)
function recoverPendingCommentReplies() {
  const moments=STORE.moments||[];
  moments.forEach(m=>{
    if(!m._pendingCommentReply)return;
    const {round}=m._pendingCommentReply;
    // Immediately check decay and reply (no waiting)
    dreamReplyToComment(m.id,round||1);
    // Note: dreamReplyToComment cleans up _pendingCommentReply on success;
    // if decay misses, clean up here
    const updated=STORE.moments.find(x=>x.id===m.id);
    if(updated&&updated._pendingCommentReply){
      delete updated._pendingCommentReply;
      STORE.moments=moments;
    }
  });
}

// ============ Dream: Scheduled Reaction to User Moment ============
function scheduleDreamReaction(mid) {
  const cfg=STORE.config||{};
  const minMs=(cfg.dreamReactionMin!=null?cfg.dreamReactionMin:1)*60000;
  const maxMs=(cfg.dreamReactionMax!=null?cfg.dreamReactionMax:6)*60000;
  const delay=randomBetween(minMs,maxMs);
  const scheduledTime=Date.now()+delay;

  // Store scheduled time on moment
  const moments=STORE.moments||[];
  const moment=moments.find(m=>m.id===mid);
  if(!moment)return;
  moment.reactionScheduledTime=scheduledTime;
  STORE.moments=moments;

  // Set timeout
  const tid=setTimeout(()=>executeDreamReaction(mid),delay);
  state.pendingReactionTimers[mid]=tid;
}

function executeDreamReaction(mid) {
  const moments=STORE.moments||[];
  const moment=moments.find(m=>m.id===mid);
  if(!moment||moment.dreamProcessed)return;
  if(!checkWordCards())return;
  moment.dreamProcessed=true;
  delete moment.reactionScheduledTime;
  delete state.pendingReactionTimers[mid];

  const cfg=STORE.config||{};
  const likeProb=(cfg.prob?.dreamLike||80);
  const commentProb=(cfg.prob?.dreamComment||65);
  const rollLike=Math.random()*100;
  const rollComment=Math.random()*100;

  if(!Array.isArray(moment.likes))moment.likes=[];
  if(!Array.isArray(moment.comments))moment.comments=[];

  if(rollLike<likeProb){
    moment.likes.push({liker:'dream',timestamp:Date.now()});
  }
  if(rollComment<commentProb){
    const replyText=generateMessage();
    moment.comments.push({commenter:'dream',content:replyText,timestamp:Date.now()});
  }
  STORE.moments=moments;
  renderFeed();
  if (rollComment < commentProb) setTimeout(updateRedDots, 300);
}

// ============ Dream Behavior Engine ============

// ---- Event Type Registry ----
// To add a new event: just call registerEventType({...}) below.
// Events marked useWakeSleep:true automatically run within the global wake/sleep window.
// Events marked useWakeSleep:false use their own time window (e.g. diary at night).
const EVENT_TYPES = {};

function registerEventType(def) {
  EVENT_TYPES[def.id] = def;
}

registerEventType({
  id: 'dreamPost', label: '发朋友圈',
  useWakeSleep: true,
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    const ts = overrides.timestamp || Date.now();
    const momentId = 'dream_' + ts;
    // If this moment was already created, never touch it again
    const moments = STORE.moments || [];
    if (moments.find(m => m.id === momentId)) return;
    if (!checkWordCards()) return;
    const cfg = STORE.config || {};
    const engCfg = cfg.dreamEngine || {};
    const cardMin = cfg.dreamPostCardMin || 1, cardMax = cfg.dreamPostCardMax || 5;
    const cardCount = Math.floor(randomBetween(cardMin, cardMax + 0.999));
    const visible = getVisibleCards();
    const picked = [];
    for (let i = 0; i < cardCount; i++) { const c = weightedPick(visible); if (c) picked.push(c.text); }
    const content = picked.join(' ');
    if (!content) return;
    let imageUrl = '';
    const photoProb = (engCfg.prob && engCfg.prob.dreamPostPhoto != null) ? engCfg.prob.dreamPostPhoto : 60;
    if (Math.random() * 100 < photoProb) {
      const stickerFrac = (engCfg.prob && engCfg.prob.dreamStickerFrac != null) ? engCfg.prob.dreamStickerFrac : 70;
      if (Math.random() * 100 < stickerFrac) {
        var stickers = STORE.stickers || [];
        if (stickers.length > 0) imageUrl = stickers[Math.floor(Math.random() * stickers.length)].dataUrl;
        else imageUrl = await getRandomPhotoForDream();
      } else {
        imageUrl = await getRandomPhotoForDream();
      }
    }
    moments.push({ id: momentId, publisher: 'dream', content, timestamp: ts, likes: [], comments: [], imageUrl, dreamProcessed: true });
    STORE.moments = moments;
    if (state.fsView === 'moments') renderFeed();
    setTimeout(updateRedDots, 300);
  }
});

registerEventType({
  id: 'dreamCheckin', label: '打卡',
  useWakeSleep: true,
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    const words = STORE.checkinWords || [];
    if (words.length === 0) return;
    const lastWord = STORE.lastCheckinWord || null;
    // Build candidate pool, excluding last used word if more than 1 word available
    var pool = words;
    if (lastWord && words.length > 1) {
      pool = words.filter(function(w) { return w !== lastWord; });
      if (pool.length === 0) pool = words; // fallback
    }
    const word = pool[Math.floor(Math.random() * pool.length)];
    STORE.lastCheckinWord = word;
    addCheckin('dream', word, overrides.timestamp);
    setTimeout(updateRedDots, 300);
  }
});

registerEventType({
  id: 'dreamChat', label: '主动发消息',
  useWakeSleep: true,
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    if (!checkWordCards()) return;
    const cfg = STORE.config || {};
    const probs = cfg.msgCountProbs || [30, 40, 20, 10];
    const batchCount = pickByProb(probs) + 1;
    for (let i = 0; i < batchCount; i++) {
      addMessage('character', generateMessage(), overrides.timestamp ? overrides.timestamp + i * 1000 : null);
    }
  }
});

registerEventType({
  id: 'dreamDiaryComment', label: '批阅日记',
  useWakeSleep: true,
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    const engCfg = (STORE.config || {}).dreamEngine || {};
    const prob = (engCfg.prob && engCfg.prob.dreamDiaryComment != null) ? engCfg.prob.dreamDiaryComment : 70;
    if (Math.random() * 100 >= prob) return;
    const ts = overrides.timestamp || Date.now();
    const commentId = 'dc_' + ts + '_dream';
    const dateStr = new Date(ts).toISOString().slice(0, 10);
    const diaries = STORE.diaries || [];
    const userDiary = diaries.find(d => d.date === dateStr && d.author === 'user');
    if (!userDiary) return;
    if (!Array.isArray(userDiary.comments)) userDiary.comments = [];
    // Never add the same comment twice
    if (userDiary.comments.some(c => c.id === commentId)) return;
    if (!checkWordCards()) return;
    const visible = getVisibleCards();
    const picked = [];
    const nCards = Math.floor(randomBetween(2, 5));
    for (let i = 0; i < nCards; i++) { const c = weightedPick(visible); if (c) picked.push(c.text); }
    const comment = '梦角批阅：' + picked.join('，');
    userDiary.comments.push({ id: commentId, author: 'dream', content: comment, timestamp: ts });
    STORE.diaries = diaries;
    setTimeout(updateRedDots, 300);
  }
});

registerEventType({
  id: 'dreamDiary', label: '写日记',
  useWakeSleep: false, // diary uses its own night window
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    const dateStr = new Date(overrides.timestamp || Date.now()).toISOString().slice(0, 10);
    await generateDreamDiary(dateStr);
  }
});

// ============ 碎影 (Shadow Fragment) ============
// 梦角主动从双方已有聊天记录里截取一小段连续对话，整理成一张可回看的"碎影"收藏卡。
// 本站是单梦角站点（无多联系人 cid、无原生通知层），因此：
//   - cid 固定为 SHADOW_CID，仅用于数据结构与导入导出兼容；
//   - "未读角标 / 后台通知"降级为既有 #menuBtnDot 红点 + 聊天内 shadow 卡 + 顶部轻提示。
// 模块自身不启永久 setInterval —— 触发完全交给行为调度中心（dreamShadow 事件）。
var SHADOW_CID = 'default';
var SHADOW_LOOKBACK = 80;        // 回看最近 80 条
var SHADOW_RECENT_DAYS = 30;     // 优先最近 30 天
var SHADOW_MIN = 2;              // 片段最少条数
var SHADOW_MAX = 6;              // 片段最多条数
var SHADOW_CONTENT_MAX = 160;    // 单条最长字数
var SHADOW_MAX_RECORDS = 400;    // 记录上限

var SHADOW_MOODS_DEFAULT = [
  '有点想把这一刻留下来', '看到这里又笑了一下', '原来那天你是这样想的',
  '这样的日子想多存几份', '读到这里，心口软了一下', '把这句话放在手边',
  '像是把那一刻重新抱了一下', '不知不觉就记住了'
];

// 隐私过滤：命中即丢弃该片段（宁可跳过也不收藏）
var SHADOW_PRIVACY = [
  /\b(?:sk|pk|api[_-]?key)[-_A-Za-z0-9]{10,}\b/i,
  /(?:密码|口令|验证码)\s*[:：]?\s*\S{4,}/,
  /\b1[3-9]\d{9}\b/,
  /\b\d{17}[\dXx]\b/,
  /\b\d{16,19}\b/,
  /(?:银行卡|卡号|身份证|住址|家庭住址|详细地址)\s*[:：]?\s*\S{4,}/
];

// 非文本消息在片段里用占位符，保留"截图感"但不复制附件本体
var SHADOW_PLACEHOLDER = {
  image: '[图片]', sticker: '[表情]', doodle: '[涂鸦]', song: '[歌曲]',
  review: '[锐评]', shadow: '[碎影]', voice: '[语音]'
};

var shadowBusy = false;

function shadowEsc(text) {
  var s = (text === null || text === undefined) ? '' : String(text);
  return (typeof escapeHtml === 'function') ? escapeHtml(s) : s;
}

function shadowMoods() {
  var cfg = STORE.config || {};
  var pool = cfg.shadow && cfg.shadow.moods;
  if (!Array.isArray(pool)) return SHADOW_MOODS_DEFAULT;
  var clean = pool.filter(function(m) { return m && String(m).trim(); })
    .map(function(m) { return String(m).trim(); });
  return clean.length ? clean : SHADOW_MOODS_DEFAULT;
}

function shadowCfg() {
  var cfg = STORE.config || {};
  var engCfg = cfg.dreamEngine || {};
  var c = cfg.shadow || {};
  var enabled = (engCfg.enabled && engCfg.enabled.dreamShadow != null) ? engCfg.enabled.dreamShadow : (c.enabled !== false);
  return { enabled: enabled !== false, min: (c.min > 0 ? c.min : 1), max: (c.max >= (c.min > 0 ? c.min : 1) ? c.max : 180) };
}

function shadowEnabled() { return shadowCfg().enabled; }

// ---- 滚动间隔调度（工单第23单 B：碎影「不设置每日上限和冷却时间」）----
// 参考实现 registerTask('shadow-fragment', ..., {intervalManaged:true}) 自己持有 nextAt：
// 上次检查之后隔 rand(min,max) 分钟再检查一次。设置页的「检查间隔」就是这两个数。
// 注意：不能挂到 computeEventTimesForDay 的当天固定槽位表上 —— 那里 interval 只是槽位之间的
// 最小间距，且槽位总数被 perDay 卡在 1~2 个，等于把「检查间隔」变成空转（这正是本次报修的根因）。
function shadowDayStr(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// 碎影排期专用「真实时钟」。
// 为什么不能直接用 Date.now()：离线回溯/补跑（runBackfill、scheduleTodayEvents 的
// past-but-not-completed 分支）会调 setBackfillContext() **全局改写 Date.now()** 成某个
// 过去槽位的时间戳（app.js 的 setBackfillContext，只在 .finally() 的微任务里才还原）。
// 而 scheduleTodayEvents 在同步循环末尾就调用 scheduleShadowTimer()，那时覆盖还生效 ⇒
// 排出来的 nextAt 落在过去（实测读到 -136 分钟），首轮检查变成「加载后 1 秒就投递」，
// 设置页也会显示「下次检查约 0 分钟后」。
// setBackfillContext 只改写 Date.now，**不改写 Date 构造器**，所以用 new Date() 取真实时间。
function shadowNowMs() {
  return new Date().getTime();
}

function shadowNextDelayMs() {
  var c = shadowCfg();
  var lo = c.min > 0 ? Math.floor(c.min) : 1;
  var hi = c.max >= lo ? Math.floor(c.max) : lo;
  return (lo + Math.floor(Math.random() * (hi - lo + 1))) * 60000;
}

// 工单 A-1：调度中心「按梦角独立配置的时间窗」检查碎影
function shadowInWindow(ts) {
  var cfg = STORE.config || {};
  var eng = cfg.dreamEngine || {};
  var ws = eng.wakeTime != null ? eng.wakeTime : 7;
  var se = eng.sleepTime != null ? eng.sleepTime : 23;
  if (ws === se) return true;
  var h = new Date(ts).getHours();
  if (ws < se) return h >= ws && h < se;
  return h >= ws || h < se; // 跨零点窗口
}

// 下一个时间窗起点（醒来的那个整点）
function shadowWindowStart(ts) {
  var cfg = STORE.config || {};
  var eng = cfg.dreamEngine || {};
  var ws = eng.wakeTime != null ? eng.wakeTime : 7;
  var d = new Date(ts);
  var at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), ws, 0, 0, 0);
  if (at.getTime() <= ts) at = new Date(at.getTime() + 86400000);
  return at.getTime();
}

// 滚动排期状态：只存 nextAt（进度由实际碎影记录反推，不另设计数器，避免两份真相）
function shadowRollState() {
  var cfg = STORE.config || {};
  if (!cfg.shadow) cfg.shadow = {};
  var st = cfg.shadow.state;
  if (!st || typeof st !== 'object') st = { nextAt: 0 };
  if (!(st.nextAt >= 0)) st.nextAt = 0;
  cfg.shadow.state = st;
  STORE.config = cfg;
  return st;
}

function shadowSaveRollState(st) {
  var cfg = STORE.config || {};
  if (!cfg.shadow) cfg.shadow = {};
  cfg.shadow.state = st;
  STORE.config = cfg;
}

// 今日已收碎影数（从真实记录数，删除的不算）
function shadowTodayCount(ts) {
  var day = shadowDayStr(ts);
  var n = 0;
  (STORE.shadows || []).forEach(function(s) {
    if (s && !s.deleted && s.createdAt && shadowDayStr(s.createdAt) === day) n++;
  });
  return n;
}

// 每日上限：max<=0 视为不限（工单口径是「不设置每日上限」）
function shadowDailyCap() {
  var cfg = STORE.config || {};
  var pd = cfg.dreamEngine && cfg.dreamEngine.perDay && cfg.dreamEngine.perDay.dreamShadow;
  if (!pd) return 0;
  var mx = parseInt(pd.max, 10);
  return (mx > 0) ? mx : 0;
}

// 改了设置/开关后调用：清掉旧的下次检查点，让新间隔立刻生效
// 注意：saveSettingsFromForm 里不能调这个 —— 它写回的是 STORE.config 的另一份副本，
// 会被紧随其后的 STORE.config=cfg 整体覆盖。那里要改**本地 cfg**。
function shadowResetRoll() {
  var cfg = STORE.config || {};
  if (!cfg.shadow) cfg.shadow = {};
  var st = cfg.shadow.state;
  if (!st || typeof st !== 'object') st = { nextAt: 0 };
  st.nextAt = 0;
  cfg.shadow.state = st;
  STORE.config = cfg;
}

// 设置页显示用：把「为什么现在没出影」讲清楚，别再让它静默
function shadowStatusText(nowTs) {
  var now = nowTs || shadowNowMs();
  var cfg = STORE.config || {};
  var eng = cfg.dreamEngine || {};
  var ws = eng.wakeTime != null ? eng.wakeTime : 7;
  var se = eng.sleepTime != null ? eng.sleepTime : 23;
  if (!shadowEnabled()) return '已关闭';
  var cap = shadowDailyCap();
  var today = shadowTodayCount(now);
  if (cap > 0 && today >= cap) return '今天已达上限 ' + cap + ' 条';
  if (!shadowInWindow(now)) {
    var d = new Date(shadowWindowStart(now));
    return '现在不在时间窗（' + ws + ':00~' + se + ':00），下次 ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' 起';
  }
  var st = cfg.shadow && cfg.shadow.state;
  if (st && st.nextAt > 0) {
    var mins = Math.max(0, Math.round((st.nextAt - now) / 60000));
    return '下次检查约 ' + mins + ' 分钟后';
  }
  return '即将安排检查';
}

// 稳定哈希：同一组来源消息 id 永远得到同一个 sourceHash（用于同源去重）
function shadowHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return 'sh_' + (h >>> 0).toString(36);
}

// 单条消息 → 片段元素；不合格（系统消息/空消息/撤回/锐评/既有碎影卡）返回 null
function shadowTextOf(m) {
  if (!m || !m.id) return null;
  // 碎影卡本身不进候选：否则会"用碎影生成碎影"，也会让同源去重失效
  if (m.type === 'shadow') return null;
  if (m.type !== 'user' && m.type !== 'character') return null;
  var from = m.type === 'user' ? 'me' : 'ta';
  if (m.recall && m.recall.executed) return null;
  if (m.review) return null;
  if (m.doodle) return { messageId: 'm' + m.id, from: from, type: 'doodle', content: SHADOW_PLACEHOLDER.doodle, tag: 'doodle' };
  var raw = String(m.text == null ? '' : m.text).trim();
  if (raw) {
    var cut = raw.length > SHADOW_CONTENT_MAX ? raw.slice(0, SHADOW_CONTENT_MAX) : raw;
    return { messageId: 'm' + m.id, from: from, type: 'text', content: cut, tag: '' };
  }
  if (m.imageData) return { messageId: 'm' + m.id, from: from, type: 'image', content: SHADOW_PLACEHOLDER.image, tag: 'image' };
  if (m.song) return { messageId: 'm' + m.id, from: from, type: 'song', content: SHADOW_PLACEHOLDER.song, tag: 'song' };
  return null;
}

// 片段必须同时包含我 与 梦角（工单 B 角色平衡）
function shadowExcerptOk(ex) {
  if (!ex || !ex.length) return false;
  var hasMe = false, hasTa = false;
  for (var i = 0; i < ex.length; i++) { if (ex[i].from === 'me') hasMe = true; else hasTa = true; }
  return hasMe && hasTa;
}

function shadowPrivacyOk(ex) {
  for (var i = 0; i < ex.length; i++) {
    var c = String(ex[i].content || '');
    for (var j = 0; j < SHADOW_PRIVACY.length; j++) { if (SHADOW_PRIVACY[j].test(c)) return false; }
  }
  return true;
}

function shadowIdNum(messageId) { return parseInt(String(messageId).replace(/^m/, ''), 10); }

// 截取 [start, start+len)；必须连续、2~6 条、双方都有；不合格返回 null，隐私命中返回 {blocked:true}
function shadowBuildExcerpt(msgs, start, len) {
  var ex = [], i;
  for (i = start; i < start + len && i < msgs.length; i++) {
    var part = shadowTextOf(msgs[i]);
    if (part) ex.push(part);
  }
  // 遇到连续系统消息/无效附件：允许向前后各扩展一次
  if (!shadowExcerptOk(ex) && (start + len < msgs.length || start > 0)) {
    for (i = Math.max(0, start - 1); i < Math.min(msgs.length, start + len + 1); i++) {
      var p2 = shadowTextOf(msgs[i]);
      if (p2 && !ex.some(function(e) { return e.messageId === p2.messageId; })) ex.push(p2);
    }
    ex.sort(function(a, b) { return shadowIdNum(a.messageId) - shadowIdNum(b.messageId); });
  }
  if (ex.length > SHADOW_MAX) ex = ex.slice(0, SHADOW_MAX);
  if (ex.length < SHADOW_MIN || !shadowExcerptOk(ex)) return null;
  if (!shadowPrivacyOk(ex)) return { blocked: true };
  return ex;
}

function shadowPickCards(n) {
  var pool = [];
  try { pool = (getVisibleCards() || []).map(function(c) { return c && c.text; }).filter(Boolean); } catch (e) { pool = []; }
  if (!pool.length) return [];   // 无字卡则留空，不伪造
  var out = [], used = {}, guard = 0;
  while (out.length < n && guard++ < 40) {
    var t = pool[Math.floor(Math.random() * pool.length)];
    if (!t || used[t]) continue;
    used[t] = 1;
    out.push({ cardId: shadowHash(String(t)), text: String(t).slice(0, SHADOW_CONTENT_MAX) });
  }
  return out;
}

// 抽取并组装一条碎影记录；失败返回 {skipped:true,reason}
function buildShadowFromMsgs(msgs, now) {
  now = now || Date.now();
  var list = (msgs || []).filter(function(m) { return m && typeof m === 'object'; });
  if (!list.length) return { skipped: true, reason: 'no-msgs' };

  var done = {};
  (STORE.shadows || []).forEach(function(s) { if (s && s.sourceHash) done[s.sourceHash] = 1; });

  var cutoff = now - SHADOW_RECENT_DAYS * 86400000;
  var windows = [
    list.filter(function(m) { return (m.timestamp || 0) >= cutoff; }),
    list
  ];
  var lastSkip = '';
  for (var w = 0; w < windows.length; w++) {
    var pool = windows[w];
    if (pool.length < SHADOW_MIN) continue;
    var from = Math.max(0, pool.length - SHADOW_LOOKBACK), span = pool.length - from;
    for (var t = 0; t < 10; t++) {
      var start = from + Math.floor(Math.random() * Math.max(1, span));
      var len = SHADOW_MIN + Math.floor(Math.random() * (SHADOW_MAX - SHADOW_MIN + 1));
      var ex = shadowBuildExcerpt(pool, start, len);
      if (!ex) { lastSkip = 'excerpt-invalid'; continue; }
      if (ex.blocked) { lastSkip = 'privacy'; continue; }
      var ids = ex.map(function(e) { return e.messageId; });
      var hash = shadowHash(ids.slice().sort().join('|'));
      if (done[hash]) { lastSkip = 'duplicate'; continue; }
      var nCards = 1 + Math.floor(Math.random() * 3);   // 1~3 张
      var moods = shadowMoods();
      return {
        shadowId: 'shadow_' + now + '_' + Math.random().toString(36).slice(2, 6),
        cid: SHADOW_CID,
        createdAt: now,
        sourceMessageIds: ids,
        sourceHash: hash,
        excerpt: ex,
        cards: shadowPickCards(nCards),
        mood: moods.length ? moods[Math.floor(Math.random() * moods.length)] : '',
        favorite: true,
        deleted: false,
        status: 'saved'
      };
    }
  }
  return { skipped: true, reason: lastSkip || 'no-candidate' };
}

// 资格判断：只做检查，不写聊天、不弹通知
function canCreateShadow() {
  if (shadowBusy) return { ok: false, reason: 'busy' };
  if (state.isSending) return { ok: false, reason: 'sending' };
  var n = 0;
  var msgs = STORE.messages || [];
  for (var i = 0; i < msgs.length; i++) { if (msgs[i]) n++; }
  if (n < SHADOW_MIN) return { ok: false, reason: 'insufficient' };
  return { ok: true };
}

function shadowById(id) {
  var list = STORE.shadows || [];
  for (var i = 0; i < list.length; i++) { if (list[i] && list[i].shadowId === id) return list[i]; }
  return null;
}

function shadowCount() {
  var n = 0;
  (STORE.shadows || []).forEach(function(s) { if (s && !s.deleted) n++; });
  return n;
}

// 投递：一次性写入记录 + 聊天追加 shadow 卡；同一条碎影只落地一次
function deliverShadowFragment(now) {
  var gate = canCreateShadow();
  if (!gate.ok) return { skipped: true, reason: gate.reason };
  if (!shadowEnabled()) return { skipped: true, reason: 'disabled' };
  shadowBusy = true;
  try {
    var built = buildShadowFromMsgs(STORE.messages || [], now || Date.now());
    if (!built || built.skipped) return { skipped: true, reason: (built && built.reason) || 'unknown' };
    var list = STORE.shadows || [];
    list.unshift(built);
    if (list.length > SHADOW_MAX_RECORDS) list = list.slice(0, SHADOW_MAX_RECORDS);
    STORE.shadows = list;
    var card = addShadowCardMessage(built.shadowId, built.createdAt);
    var inChat = !state.fsOpen && !state.panelOpen;
    if (!inChat) showMessageToast('梦角把一段对话收进了碎影');
    setTimeout(updateRedDots, 300);
    if (state.fsView === 'shadows') {
      var body = document.getElementById('fsBody');
      if (body) renderShadows(body);
    }
    return { shadowId: built.shadowId, sourceHash: built.sourceHash, messageId: card.id };
  } catch (e) {
    console.warn('deliverShadowFragment failed:', e);
    return { skipped: true, reason: 'error:' + ((e && e.message) || e) };
  } finally { shadowBusy = false; }
}

// 聊天里那张引用卡：只存 shadowId，正文从记录读；记录被删就显示已删除，绝不崩
function addShadowCardMessage(shadowId, timestamp) {
  var messages = STORE.messages || [];
  var msg = { id: genId(), type: 'shadow', text: '', timestamp: timestamp || Date.now(), shadowId: shadowId };
  messages.push(msg);
  STORE.messages = messages;
  try { appendMessageToDOM(msg); } catch (e) { console.warn('shadow card append failed:', e); }
  return msg;
}

function shadowCardHtml(m) {
  var id = (m && m.shadowId) || '';
  var sh = shadowById(id);
  if (!sh || sh.deleted) {
    return '<div class="shadow-card gone" data-shadow="' + shadowEsc(id) + '">' +
      '<span class="shc-ico">🕯</span><span class="shc-tx">' +
      '<span class="shc-t">碎影已删除</span><span class="shc-s">这张碎片已经不在收藏里了</span></span></div>';
  }
  var excerpt = Array.isArray(sh.excerpt) ? sh.excerpt : [];
  var first = '';
  for (var i = 0; i < excerpt.length; i++) { if (excerpt[i] && excerpt[i].from === 'me') { first = excerpt[i].content; break; } }
  if (!first && excerpt.length) first = excerpt[0].content || '';
  return '<div class="shadow-card" data-shadow="' + shadowEsc(sh.shadowId) + '" role="button" tabindex="0" aria-label="打开碎影">' +
    '<span class="shc-ico">🕯</span><span class="shc-tx">' +
    '<span class="shc-t">梦角收下了一段碎影</span>' +
    '<span class="shc-s">' + shadowEsc(String(first).slice(0, 28)) + '</span></span></div>';
}

function formatShadowTime(ts) {
  return new Date(ts || 0).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function shadowVisibleList() {
  var arr = (STORE.shadows || []).filter(function(s) { return s && !s.deleted; });
  var filter = state.shadowFilter || 'all';
  if (filter.indexOf('c:') === 0) {
    var cid = filter.slice(2);
    arr = arr.filter(function(s) { return s.cid === cid; });
  } else if (filter === 'fav') {
    arr = arr.filter(function(s) { return s.favorite; });
  }
  var q = String(state.shadowSearch || '').trim().toLowerCase();
  if (q) {
    arr = arr.filter(function(s) {
      var hay = (s.mood || '') + ' ' +
        (s.cards || []).map(function(c) { return c && c.text; }).join(' ') + ' ' +
        (s.excerpt || []).map(function(e) { return e && e.content; }).join(' ');
      return hay.toLowerCase().indexOf(q) >= 0;
    });
  }
  return arr.slice().sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
}

function shadowDelete(id) {
  var targetId = id || state.shadowDetailId;
  // 注意：STORE.shadows 的 getter 每次都会重新 JSON.parse，读出来的是新数组新对象。
  // 必须先取出数组、在同一个引用上改名，再整体写回，否则改动会丢。
  var list = STORE.shadows || [];
  var s = null;
  for (var i = 0; i < list.length; i++) { if (list[i] && list[i].shadowId === targetId) { s = list[i]; break; } }
  if (!s) return;
  if (!confirm('删除这条碎影？原聊天记录不会受影响。')) return;
  s.deleted = true;
  s.favorite = false;
  STORE.shadows = list;
  var body = document.getElementById('fsBody');
  state.shadowDetailId = null;
  if (body && state.fsView === 'shadows') renderShadows(body);
  updateRedDots();
  showToast('已删除这条碎影');
}

function shadowToggleFav(id) {
  var targetId = id || state.shadowDetailId;
  var list = STORE.shadows || [];
  var s = null;
  for (var i = 0; i < list.length; i++) { if (list[i] && list[i].shadowId === targetId) { s = list[i]; break; } }
  if (!s) return;
  s.favorite = !s.favorite;
  STORE.shadows = list;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'shadows') renderShadows(body);
  showToast(s.favorite ? '已收藏' : '已取消收藏');
}

// 导入：按 shadowId 幂等合并，非法载荷不动数据
function importShadows(text) {
  try {
    var o = JSON.parse(text);
    if (o && o.data) o = o.data;
    var arr = Array.isArray(o) ? o : (o && Array.isArray(o.shadows) ? o.shadows : null);
    if (!arr) throw new Error('bad payload');
    var list = STORE.shadows || [];
    if (!Array.isArray(list)) list = [];
    var exists = {};
    list.forEach(function(s) { if (s && s.shadowId) exists[s.shadowId] = 1; });
    var added = 0, merged = 0, skipped = 0;
    arr.forEach(function(s) {
      if (!s || !s.shadowId || !Array.isArray(s.excerpt) || !s.excerpt.length) { skipped++; return; }
      if (exists[s.shadowId]) { merged++; return; }
      exists[s.shadowId] = 1;
      list.unshift({
        shadowId: String(s.shadowId),
        cid: String(s.cid || SHADOW_CID),
        createdAt: +s.createdAt || Date.now(),
        sourceMessageIds: Array.isArray(s.sourceMessageIds) ? s.sourceMessageIds.slice(0, 20) : [],
        sourceHash: String(s.sourceHash || ''),
        excerpt: s.excerpt.slice(0, SHADOW_MAX),
        cards: Array.isArray(s.cards) ? s.cards.slice(0, 3) : [],
        mood: String(s.mood || ''),
        favorite: s.favorite !== false,
        deleted: !!s.deleted,
        status: 'saved'
      });
      added++;
    });
    STORE.shadows = list;
    var body = document.getElementById('fsBody');
    if (body && state.fsView === 'shadows') renderShadows(body);
    updateRedDots();
    showToast('导入 ' + added + ' 条碎影' + (merged ? '，已存在 ' + merged + ' 条' : '') + (skipped ? '，跳过 ' + skipped + ' 条' : ''));
  } catch (e) {
    showToast('导入失败：不是有效的碎影文件');
  }
}

function exportShadows() {
  var data = { shadows: STORE.shadows || [], exportedAt: new Date().toISOString() };
  var json = JSON.stringify(data, null, 2);
  var filename = 'mengjiao-shadows-' + new Date().toISOString().slice(0, 10) + '.json';
  if (window.AndroidBridge && typeof window.AndroidBridge.exportReady === 'function') {
    try {
      window.__exportData = json;
      var ok = window.AndroidBridge.exportReady(filename);
      if (ok) showToast('✅ 请选择保存位置');
      else { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    } catch (e) { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    return;
  }
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ---- 碎影界面（全屏页：列表 ↔ 详情） ----
function shadowDetailHtml(sh) {
  var cfg = STORE.config || {};
  var name = cfg.characterName || '梦角';
  var rows = (sh.excerpt || []).map(function(e) {
    var mine = e.from === 'me';
    return '<div class="sh-row ' + (mine ? 'me' : 'ta') + '">' +
      '<div class="sh-bubble">' + shadowEsc(e.content) + '</div></div>';
  }).join('');
  var cards = (sh.cards || []).length
    ? (sh.cards || []).map(function(c) { return '<span class="sh-card-chip">' + shadowEsc(c && c.text) + '</span>'; }).join('')
    : '<span class="sh-card-empty">这次没有配字卡</span>';
  return '<div class="shadow-detail" data-shadow-detail="' + shadowEsc(sh.shadowId) + '">' +
    '<div class="shadow-detail-head">' +
      '<button type="button" class="sh-back" id="btnShadowBack">← 返回列表</button>' +
      '<span class="sh-detail-meta">' + shadowEsc(formatShadowTime(sh.createdAt)) + ' · ' + shadowEsc(name) + '</span>' +
    '</div>' +
    '<div class="shadow-detail-body">' +
      '<div class="shadow-excerpt">' + rows + '</div>' +
      (sh.mood ? '<div class="shadow-mood"><span class="sh-mood-label">' + shadowEsc(name) + '的心情</span>' + shadowEsc(sh.mood) + '</div>' : '') +
      '<div class="shadow-cards"><div class="sh-cards-title">记录的字卡</div><div class="sh-cards-row">' + cards + '</div></div>' +
      '<div class="shadow-actions">' +
        '<button type="button" class="sh-btn sh-fav' + (sh.favorite ? ' faved' : '') + '" id="btnShadowFav">' + (sh.favorite ? '⭐ 已收藏' : '☆ 收藏') + '</button>' +
        '<button type="button" class="sh-btn sh-del" id="btnShadowDel">🗑️ 删除</button>' +
      '</div>' +
    '</div></div>';
}

// ============ 连结簿（Link Log，2026-10-15）============
// 用户手写的「与梦角产生链接」的瞬间：一天可记多笔、按标签分类、可搜索、按日期分组回看。
// 与「碎影」（自动收集的对话片段）、「日记」（一天一篇长文）都不同，是第三种记录方式。
//   STORE.links    = [{ id, at, text, tags:[标签id], createdAt, updatedAt }]
//   STORE.linkTags = [{ id, name, color }]

// 预设标签（原话的三类 + 两个兜底）。全部可改名/可删/可新增；删标签不删记录。
// 写成函数声明而不是 var 常量：函数声明整体提升，文件靠前执行的 store 默认值块也能安全调用。
function linkPresetTags() {
  return [
    { id: 'lkt-1', name: '体感', color: '#e0700a' },
    { id: 'lkt-2', name: '推送', color: '#3f9ad6' },
    { id: 'lkt-3', name: '字卡', color: '#8b6ad6' },
    { id: 'lkt-4', name: '思念', color: '#e0568a' },
    { id: 'lkt-5', name: '感想', color: '#4aa96c' }
  ];
}
// 新建标签时的取色轮（代码里没有取色器，就按顺序分配这组预设色）
var LINK_TAG_COLORS = ['#e0700a', '#3f9ad6', '#8b6ad6', '#e0568a', '#4aa96c', '#c9903a', '#5aa9a3', '#a86ad6'];
var LINK_WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function linkEsc(s) { return escapeHtml(String(s == null ? '' : s)); }

// 标签被删掉后，记录里会留下"孤儿 id"：这里只返回仍然存在的标签，渲染时自然忽略孤儿。
function linkTags() {
  if (!STORE.linkTags) STORE.linkTags = linkPresetTags();   // 只在 undefined 时补种，绝不复活用户删空的数组
  return (STORE.linkTags || []).filter(function (t) { return t && t.id && t.name; });
}
function linkTagById(id) {
  var list = linkTags();
  for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
  return null;
}
function linkById(id) {
  var list = STORE.links || [];
  for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
  return null;
}
function linkSorted() {
  var arr = (STORE.links || []).filter(function (x) { return x && x.id && typeof x.text === 'string'; });
  arr.sort(function (a, b) { return (b.at || b.createdAt || 0) - (a.at || a.createdAt || 0); });
  return arr;
}
// 日期键必须用【本地】年月日：toISOString 是 UTC，凌晨的记录会被算到前一天去。
function linkDayKey(ts) {
  var d = new Date(ts || Date.now());
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function linkDayLabel(key) {
  var p = key.split('-').map(Number);
  var d = new Date(p[0], p[1] - 1, p[2]);
  var now = new Date();
  var t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = Math.round((t0.getTime() - d.getTime()) / 86400000);
  var base = p[1] + '月' + p[2] + '日 ' + LINK_WEEK[d.getDay()];
  if (diff === 0) return '今天 · ' + base;
  if (diff === 1) return '昨天 · ' + base;
  if (p[0] !== now.getFullYear()) return p[0] + '年' + base;
  return base;
}
function linkTimeLabel(ts) {
  var d = new Date(ts || Date.now());
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
// 搜索：正文 或 任一标签名（大小写不敏感）
function linkMatches(x, q) {
  if (!q) return true;
  q = String(q).toLowerCase();
  if (String(x.text || '').toLowerCase().indexOf(q) >= 0) return true;
  var ids = Array.isArray(x.tags) ? x.tags : [];
  for (var i = 0; i < ids.length; i++) {
    var t = linkTagById(ids[i]);
    if (t && String(t.name).toLowerCase().indexOf(q) >= 0) return true;
  }
  return false;
}
// 标签筛选：多选按"或"（选中任意一个标签的记录都显示）
function linkTagOk(x) {
  var sel = state.linkTagFilter || [];
  if (!sel.length) return true;
  var ids = Array.isArray(x.tags) ? x.tags : [];
  for (var i = 0; i < sel.length; i++) { if (ids.indexOf(sel[i]) >= 0) return true; }
  return false;
}
function linkVisibleList() {
  return linkSorted().filter(function (x) { return linkMatches(x, state.linkSearch) && linkTagOk(x); });
}
function linkCountLine() {
  var all = linkSorted().length, n = linkVisibleList().length;
  if (state.linkSearch || (state.linkTagFilter || []).length) return '筛出 ' + n + ' / ' + all + ' 笔';
  return all ? ('共 ' + all + ' 笔') : '';
}
function linkTagChipsHtml() {
  var tags = linkTags(), sel = state.linkTagFilter || [];
  var html = '<button type="button" class="lk-chip' + (sel.length ? '' : ' on') + '" data-lk-tag="">全部</button>';
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    html += '<button type="button" class="lk-chip' + (sel.indexOf(t.id) >= 0 ? ' on' : '') + '" data-lk-tag="' + linkEsc(t.id) + '">'
      + '<span class="lk-dot" style="background:' + linkEsc(t.color || '#999') + '"></span>' + linkEsc(t.name) + '</button>';
  }
  return html;
}
function linkCardHtml(x) {
  var ids = Array.isArray(x.tags) ? x.tags : [];
  var tagHtml = '';
  for (var i = 0; i < ids.length; i++) {
    var t = linkTagById(ids[i]);
    if (!t) continue;   // 孤儿标签 id（标签已被删）安全忽略：不报错、不留空 chip
    tagHtml += '<span class="lk-tag"><span class="lk-dot" style="background:' + linkEsc(t.color || '#999') + '"></span>' + linkEsc(t.name) + '</span>';
  }
  return '<div class="lk-card" data-lk-id="' + linkEsc(x.id) + '">'
    + '<div class="lk-card-head"><span class="lk-time">' + linkEsc(linkTimeLabel(x.at || x.createdAt)) + '</span>'
    + '<span class="lk-card-tools">'
    + '<button type="button" class="lk-mini" data-lk-edit="' + linkEsc(x.id) + '">编辑</button>'
    + '<button type="button" class="lk-mini lk-del" data-lk-del="' + linkEsc(x.id) + '">删除</button>'
    + '</span></div>'
    + '<div class="lk-text">' + linkEsc(x.text) + '</div>'
    + (tagHtml ? '<div class="lk-tags">' + tagHtml + '</div>' : '')
    + '</div>';
}
function linkListHtml(view) {
  if (!view.length) {
    var any = linkSorted().length > 0;
    var name = (STORE.config || {}).characterName || '梦角';
    return '<div class="lk-empty">' + (any
      ? '没有符合条件的记录<br><br>换个关键词，或者点上面的标签看看'
      : '还没有记录<br><br>想到什么就记一笔 —— 体感、推送、字卡，<br>或者只是想' + linkEsc(name) + '。') + '</div>';
  }
  // 先按天分组，再渲染（组头：今天/昨天/月日+周几 + 当天笔数）
  var groups = [], cur = null;
  for (var i = 0; i < view.length; i++) {
    var key = linkDayKey(view[i].at || view[i].createdAt);
    if (!cur || cur.key !== key) { cur = { key: key, items: [] }; groups.push(cur); }
    cur.items.push(view[i]);
  }
  var out = '';
  for (var g = 0; g < groups.length; g++) {
    out += '<div class="lk-day"><div class="lk-day-head"><span class="lk-day-label">' + linkEsc(linkDayLabel(groups[g].key)) + '</span>'
      + '<span class="lk-day-n">' + groups[g].items.length + ' 笔</span></div>';
    for (var k = 0; k < groups[g].items.length; k++) out += linkCardHtml(groups[g].items[k]);
    out += '</div>';
  }
  return out;
}
function linkRefreshList() {
  var listEl = document.getElementById('linkList');
  if (listEl) listEl.innerHTML = linkListHtml(linkVisibleList());
  var c = document.getElementById('lkCount');
  if (c) c.textContent = linkCountLine();
}
function linkBindChips() {
  var wrap = document.getElementById('linkChips');
  if (!wrap) return;
  wrap.querySelectorAll('.lk-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.lkTag;
      if (!id) { state.linkTagFilter = []; }
      else {
        var sel = (state.linkTagFilter || []).slice();
        var i = sel.indexOf(id);
        if (i >= 0) sel.splice(i, 1); else sel.push(id);   // 再点一次取消
        state.linkTagFilter = sel;
      }
      wrap.innerHTML = linkTagChipsHtml();
      linkBindChips();
      linkRefreshList();
    });
  });
}
function renderLinks(container) {
  if (!container) return;
  container.innerHTML = '<div class="lk-page">'
    + '<div class="lk-toolbar">'
    + '<button type="button" class="lk-add" id="btnLinkAdd">＋ 记一笔</button>'
    + '<button type="button" class="lk-tb" id="btnLinkTags">标签</button>'
    + '</div>'
    + '<div class="lk-filters">'
    + '<input type="text" class="lk-search" id="linkSearch" placeholder="搜索正文或标签…" value="' + linkEsc(state.linkSearch || '') + '" maxlength="50">'
    + '<div class="lk-chips" id="linkChips">' + linkTagChipsHtml() + '</div>'
    + '</div>'
    + '<div class="lk-count" id="lkCount">' + linkEsc(linkCountLine()) + '</div>'
    + '<div class="lk-list" id="linkList">' + linkListHtml(linkVisibleList()) + '</div>'
    + '</div>';
  var addBtn = container.querySelector('#btnLinkAdd');
  if (addBtn) addBtn.addEventListener('click', function () { showLinkEditor(null); });
  var tagBtn = container.querySelector('#btnLinkTags');
  if (tagBtn) tagBtn.addEventListener('click', function () { showLinkTagManager(); });
  // 搜索只重画列表，不重画整页 —— 否则每敲一个字输入框都会重建、光标丢掉
  var sInp = container.querySelector('#linkSearch');
  if (sInp) sInp.addEventListener('input', function () { state.linkSearch = this.value; linkRefreshList(); });
  linkBindChips();
  var listEl = container.querySelector('#linkList');
  if (listEl) {
    listEl.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-lk-edit]');
      if (ed) { showLinkEditor(ed.dataset.lkEdit); return; }
      var del = e.target.closest('[data-lk-del]');
      if (del) { linkDelete(del.dataset.lkDel); return; }
    });
  }
}
function showLinkEditor(id) {
  state.linkEditorId = id || null;
  var x = id ? linkById(id) : null;
  var ts = x ? (x.at || x.createdAt || Date.now()) : Date.now();
  var d = new Date(ts);
  var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  var timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  // 新增时继承当前标签筛选（正在看"推送"时记一笔，多半也是推送）；编辑时用记录自己的标签
  var picked = x ? (Array.isArray(x.tags) ? x.tags.slice() : []) : (state.linkTagFilter || []).slice();
  var tags = linkTags();
  var pickHtml = '';
  for (var i = 0; i < tags.length; i++) {
    var on = picked.indexOf(tags[i].id) >= 0;
    pickHtml += '<button type="button" class="lk-pick' + (on ? ' on' : '') + '" data-lk-pick="' + linkEsc(tags[i].id) + '" data-on="' + (on ? '1' : '0') + '">'
      + '<span class="lk-dot" style="background:' + linkEsc(tags[i].color || '#999') + '"></span>' + linkEsc(tags[i].name) + '</button>';
  }
  showModal('<h3>' + (x ? '编辑这一笔' : '记一笔') + '</h3>'
    + '<div class="form-row"><label>时间</label><div class="lk-dt">'
    + '<input type="date" id="lkDate" value="' + dateStr + '"><input type="time" id="lkTime" value="' + timeStr + '">'
    + '</div></div>'
    + '<div class="form-row"><label>内容</label><textarea id="lkText" rows="5" maxlength="500"></textarea></div>'
    + '<div class="form-row"><label>标签（可不选）</label><div class="lk-picks" id="lkPicks">'
    + (pickHtml || '<span class="lk-hint">还没有标签 —— 关掉这里，点工具条的「标签」去建一个</span>') + '</div></div>'
    + '<div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button>'
    + '<button class="btn-primary" id="lkSave">保存</button></div>');
  var ta = document.getElementById('lkText');
  if (ta) { ta.value = x ? (x.text || '') : ''; ta.focus(); }
  var picks = document.getElementById('lkPicks');
  if (picks) {
    picks.querySelectorAll('.lk-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.dataset.on === '1';
        b.dataset.on = on ? '0' : '1';
        b.classList.toggle('on', !on);
      });
    });
  }
  var saveBtn = document.getElementById('lkSave');
  if (saveBtn) saveBtn.addEventListener('click', saveLinkFromForm);
}
function saveLinkFromForm() {
  var ta = document.getElementById('lkText');
  var text = ta ? String(ta.value || '').trim() : '';
  if (!text) { alert('写点什么再保存吧（内容不能为空）'); if (ta) ta.focus(); return; }
  var dv = (document.getElementById('lkDate') || {}).value || '';
  var tv = (document.getElementById('lkTime') || {}).value || '';
  var at = Date.now();
  if (dv) {
    var p = dv.split('-').map(Number), hm = String(tv || '').split(':').map(Number);
    var built = new Date(p[0], p[1] - 1, p[2], hm[0] || 0, hm[1] || 0, 0, 0).getTime();
    if (!isNaN(built)) at = built;
  }
  var tags = [];
  var picks = document.getElementById('lkPicks');
  if (picks) picks.querySelectorAll('.lk-pick').forEach(function (b) { if (b.dataset.on === '1') tags.push(b.dataset.lkPick); });
  var list = (STORE.links || []).slice();
  var hit = linkById(state.linkEditorId);
  if (hit) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === hit.id) { list[i] = { id: hit.id, at: at, text: text, tags: tags, createdAt: hit.createdAt || Date.now(), updatedAt: Date.now() }; }
    }
  } else {
    list.push({ id: genId(), at: at, text: text, tags: tags, createdAt: Date.now(), updatedAt: Date.now() });
  }
  STORE.links = list;
  hideModal();
  var wasEdit = !!hit;
  state.linkEditorId = null;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'links') renderLinks(body);
  showToast(wasEdit ? '已更新' : '记下了');
}
function linkDelete(id) {
  var x = linkById(id);
  if (!x) return;
  var t = String(x.text || '');
  var preview = t.length > 40 ? t.slice(0, 40) + '…' : t;
  if (!confirm('删除这一笔记录？\n\n' + preview + '\n\n删了就找不回来了。')) return;
  STORE.links = (STORE.links || []).filter(function (y) { return y.id !== id; });
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'links') renderLinks(body);
  showToast('已删除');
}
function showLinkTagManager() { renderLinkTagManager(); }
function renderLinkTagManager() {
  var tags = linkTags();
  var rows = '';
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    var n = (STORE.links || []).filter(function (x) { return x && Array.isArray(x.tags) && x.tags.indexOf(t.id) >= 0; }).length;
    rows += '<div class="lk-tagrow"><span class="lk-dot" style="background:' + linkEsc(t.color || '#999') + '"></span>'
      + '<span class="lk-tagname">' + linkEsc(t.name) + '</span>'
      + '<span class="lk-tagn">' + n + ' 笔</span>'
      + '<button type="button" class="lk-mini" data-lk-rename="' + linkEsc(t.id) + '">改名</button>'
      + '<button type="button" class="lk-mini lk-del" data-lk-tagdel="' + linkEsc(t.id) + '">删除</button></div>';
  }
  showModal('<h3>标签管理</h3>'
    + '<div class="lk-tagmgr">' + (rows || '<div class="lk-hint">还没有标签</div>') + '</div>'
    + '<div class="form-row"><label>新建标签</label><div class="lk-dt">'
    + '<input type="text" id="lkNewTag" maxlength="10" placeholder="例如：梦、信号、巧合">'
    + '<button class="btn-primary" id="lkAddTag" style="width:auto;padding:9px 16px;">添加</button>'
    + '</div></div>'
    + '<div class="lk-hint">删标签不会删记录 —— 那几笔还在，只是不再带这个标签。</div>'
    + '<div class="modal-btns"><button class="btn-primary" onclick="hideModal()">完成</button></div>');
  var box = document.getElementById('modalBox');
  if (box) {
    box.querySelectorAll('[data-lk-rename]').forEach(function (b) {
      b.addEventListener('click', function () { linkRenameTag(b.dataset.lkRename); });
    });
    box.querySelectorAll('[data-lk-tagdel]').forEach(function (b) {
      b.addEventListener('click', function () { linkDeleteTag(b.dataset.lkTagdel); });
    });
  }
  var add = document.getElementById('lkAddTag');
  if (add) add.addEventListener('click', linkAddTag);
}
function linkRenameTag(id) {
  var tags = (STORE.linkTags || []).slice();
  var t = null;
  for (var i = 0; i < tags.length; i++) { if (tags[i].id === id) t = tags[i]; }
  if (!t) return;
  var n = prompt('修改标签名称：', t.name);
  if (!n || !n.trim() || n.trim() === t.name) return;
  t.name = n.trim();
  STORE.linkTags = tags;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'links') renderLinks(body);
  renderLinkTagManager();
}
function linkAddTag() {
  var inp = document.getElementById('lkNewTag');
  var name = inp ? String(inp.value || '').trim() : '';
  if (!name) { alert('先写个标签名'); return; }
  var tags = (STORE.linkTags || []).slice();
  for (var i = 0; i < tags.length; i++) { if (String(tags[i].name) === name) { alert('已经有这个标签了'); return; } }
  tags.push({ id: 'lkt-' + genId(), name: name, color: LINK_TAG_COLORS[tags.length % LINK_TAG_COLORS.length] });
  STORE.linkTags = tags;
  renderLinkTagManager();
}
function linkDeleteTag(id) {
  var tags = (STORE.linkTags || []).slice();
  var t = null;
  for (var i = 0; i < tags.length; i++) { if (tags[i].id === id) t = tags[i]; }
  if (!t) return;
  var n = (STORE.links || []).filter(function (x) { return x && Array.isArray(x.tags) && x.tags.indexOf(id) >= 0; }).length;
  var msg = '删除标签「' + t.name + '」？\n\n' + (n ? ('有 ' + n + ' 笔记录带着它。删除后这些记录还在，只是不再带这个标签。') : '暂时没有记录用它。');
  if (!confirm(msg)) return;
  STORE.linkTags = tags.filter(function (y) { return y.id !== id; });
  state.linkTagFilter = (state.linkTagFilter || []).filter(function (y) { return y !== id; });
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'links') renderLinks(body);
  renderLinkTagManager();
  showToast('标签已删除');
}

function renderShadows(container) {
  if (!container) return;
  var openId = state.shadowDetailId;
  var opened = openId ? shadowById(openId) : null;
  if (opened && !opened.deleted) {
    container.innerHTML = shadowDetailHtml(opened);
    var backBtn = container.querySelector('#btnShadowBack');
    if (backBtn) backBtn.addEventListener('click', function() {
      state.shadowDetailId = null;
      renderShadows(container);
    });
    var favBtn = container.querySelector('#btnShadowFav');
    if (favBtn) favBtn.addEventListener('click', function() { shadowToggleFav(opened.shadowId); });
    var delBtn = container.querySelector('#btnShadowDel');
    if (delBtn) delBtn.addEventListener('click', function() { shadowDelete(opened.shadowId); });
    return;
  }
  state.shadowDetailId = null;

  var cfg = STORE.config || {};
  var name = cfg.characterName || '梦角';
  var list = shadowVisibleList();
  var total = shadowCount();
  var favCount = (STORE.shadows || []).filter(function(s) { return s && !s.deleted && s.favorite; }).length;

  var items = list.length ? list.map(function(sh) {
    var preview = '';
    (sh.excerpt || []).forEach(function(e) { if (!preview && e) preview = e.content || ''; });
    var mood = sh.mood ? '<span class="sh-item-mood">' + shadowEsc(sh.mood) + '</span>' : '';
    return '<button type="button" class="shadow-item" data-shadow-id="' + shadowEsc(sh.shadowId) + '">' +
      '<div class="sh-item-top"><span class="sh-item-time">' + shadowEsc(formatShadowTime(sh.createdAt)) + '</span>' +
      '<span class="sh-item-owner">' + shadowEsc(name) + '</span>' + (sh.favorite ? '<span class="sh-item-star">⭐</span>' : '') + '</div>' +
      '<div class="sh-item-preview">' + shadowEsc(preview) + '</div>' +
      mood +
      '<div class="sh-item-meta">' + (sh.excerpt || []).length + ' 条对话 · ' + (sh.cards || []).length + ' 张字卡</div>' +
    '</button>';
  }).join('') : '<div class="shadow-empty">还没有碎影<br><br>' + shadowEsc(name) + '会把两个人的对话截一小段收进这里</div>';

  container.innerHTML = '<div class="shadow-page" id="shadowApp" data-od-id="app-shadow">' +
    '<div class="shadow-toolbar">' +
      '<h2>碎影 <span class="sh-count">' + total + '</span></h2>' +
      '<div class="shadow-toolbar-actions">' +
        '<button type="button" class="sh-tb" id="btnShadowExport" title="导出碎影">导出</button>' +
        '<button type="button" class="sh-tb" id="btnShadowImport" title="导入碎影">导入</button>' +
      '</div>' +
    '</div>' +
    '<div class="shadow-filters">' +
      '<div class="sh-chips">' +
        '<button type="button" class="sh-chip' + ((state.shadowFilter || 'all') === 'all' ? ' on' : '') + '" data-shadow-filter="all">全部 ' + total + '</button>' +
        '<button type="button" class="sh-chip' + (state.shadowFilter === 'fav' ? ' on' : '') + '" data-shadow-filter="fav">⭐ 收藏 ' + favCount + '</button>' +
      '</div>' +
      '<input type="text" class="sh-search" id="shadowSearch" placeholder="搜索碎影里的对话…" value="' + shadowEsc(state.shadowSearch || '') + '" maxlength="50">' +
    '</div>' +
    '<div class="shadow-list" id="shadowList">' + items + '</div>' +
    '<input type="file" id="shadowImpFile" accept=".json" style="display:none">' +
  '</div>';

  container.querySelectorAll('.sh-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      state.shadowFilter = chip.dataset.shadowFilter || 'all';
      renderShadows(container);
    });
  });
  var search = container.querySelector('#shadowSearch');
  if (search) {
    search.addEventListener('input', function() {
      state.shadowSearch = this.value;
      var listEl = container.querySelector('#shadowList');
      if (!listEl) return;
      var filtered = shadowVisibleList();
      listEl.innerHTML = filtered.length ? filtered.map(function(sh) {
        var preview = '';
        (sh.excerpt || []).forEach(function(e) { if (!preview && e) preview = e.content || ''; });
        return '<button type="button" class="shadow-item" data-shadow-id="' + shadowEsc(sh.shadowId) + '">' +
          '<div class="sh-item-top"><span class="sh-item-time">' + shadowEsc(formatShadowTime(sh.createdAt)) + '</span>' +
          '<span class="sh-item-owner">' + shadowEsc(name) + '</span>' + (sh.favorite ? '<span class="sh-item-star">⭐</span>' : '') + '</div>' +
          '<div class="sh-item-preview">' + shadowEsc(preview) + '</div>' +
          (sh.mood ? '<span class="sh-item-mood">' + shadowEsc(sh.mood) + '</span>' : '') +
          '<div class="sh-item-meta">' + (sh.excerpt || []).length + ' 条对话 · ' + (sh.cards || []).length + ' 张字卡</div>' +
        '</button>';
      }).join('') : '<div class="shadow-empty">没有匹配的碎影</div>';
      bindShadowItems(container);
    });
  }
  var exportBtn = container.querySelector('#btnShadowExport');
  if (exportBtn) exportBtn.addEventListener('click', exportShadows);
  var importBtn = container.querySelector('#btnShadowImport');
  var impFile = container.querySelector('#shadowImpFile');
  if (importBtn && impFile) {
    importBtn.addEventListener('click', function() { impFile.click(); });
    impFile.addEventListener('change', function() {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function(ev) { importShadows((ev.target && ev.target.result) || ''); };
      reader.readAsText(f);
    });
  }
  bindShadowItems(container);
}

function bindShadowItems(container) {
  container.querySelectorAll('.shadow-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = item.dataset.shadowId;
      if (!id || !shadowById(id)) return;
      state.shadowDetailId = id;
      renderShadows(container);
    });
  });
}

// 调度中心接入：只负责"什么时候触发"，抽取/组装/投递都在碎影模块里
registerEventType({
  id: 'dreamShadow', label: '收碎影',
  useWakeSleep: true,
  dependsOnUserAction: false,
  generateContent: async function(overrides) {
    // 用 shadowNowMs() 而非 Date.now()：调度中心会在离线回溯时全局改写 Date.now，
    // 这里虽是滚动调度触发的正常路径，也不该读那个会被污染的时钟。
    deliverShadowFragment((overrides && overrides.timestamp) || shadowNowMs());
  }
});

const EVENT_TYPE_LIST = Object.values(EVENT_TYPES);

// ---- Dedup Helpers ----
function isEventCompleted(eventId, dateStr, index) {
  const store = STORE.dreamEvents || {};
  return !!store[eventId + '_' + dateStr + '_' + index];
}
function markEventCompleted(eventId, dateStr, index) {
  const store = STORE.dreamEvents || {};
  store[eventId + '_' + dateStr + '_' + index] = true;
  STORE.dreamEvents = store;
}
function clearDayEvents(dateStr) {
  const store = STORE.dreamEvents || {};
  const prefix = '_' + dateStr + '_';
  const keys = Object.keys(store).filter(k => k.indexOf(prefix) >= 0);
  keys.forEach(k => delete store[k]);
  STORE.dreamEvents = store;
  // Also clear nonces for this day so events get regenerated with fresh randomness
  const nonces = STORE._read('mcard_dream_nonces') || {};
  const nonceKeys = Object.keys(nonces).filter(k => k.endsWith('_' + dateStr));
  nonceKeys.forEach(k => delete nonces[k]);
  STORE._write('mcard_dream_nonces', nonces);
}

// ---- Per-day nonce: makes each day independently random ----
function getOrCreateDayNonce(dateStr, eventId) {
  const store = STORE._read('mcard_dream_nonces') || {};
  const key = eventId + '_' + dateStr;
  if (!store[key]) {
    // Generate a fresh random nonce using crypto-quality randomness
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    store[key] = arr[0].toString(36) + arr[1].toString(36);
    STORE._write('mcard_dream_nonces', store);
  }
  return store[key];
}

// ---- Event Time Computation ----
function computeEventTimesForDay(dateStr, eventDef) {
  const cfg = STORE.config || {};
  const engCfg = cfg.dreamEngine || {};

  // Resolve time window
  let twStart, twEnd;
  if (eventDef.useWakeSleep) {
    twStart = engCfg.wakeTime != null ? engCfg.wakeTime : 7;
    twEnd = engCfg.sleepTime != null ? engCfg.sleepTime : 23;
  } else {
    // Diary or other special events use their own window
    twStart = engCfg.diaryTimeStart != null ? engCfg.diaryTimeStart : 21;
    twEnd = engCfg.diaryTimeEnd != null ? engCfg.diaryTimeEnd : 24;
  }

  // Resolve per-day count
  let minP, maxP;
  if (eventDef.id === 'dreamDiary') {
    minP = 1; maxP = 1;
  } else {
    const perDay = (engCfg.perDay && engCfg.perDay[eventDef.id]) || {};
    minP = (perDay.min != null && perDay.min >= 0) ? perDay.min : (eventDef.minPerDay || 1);
    maxP = (perDay.max != null && perDay.max >= 1) ? perDay.max : (eventDef.maxPerDay || 1);
  }

  const nonce = getOrCreateDayNonce(dateStr, eventDef.id);
  const daySeed = dateStr + '_' + eventDef.id + '_' + nonce;
  const dayRng = seedRandom(daySeed);
  var count = Math.floor(minP + dayRng() * (maxP - minP + 1));
  if (count < 1) count = 1; // safety net: at least 1 event

  // Minimum spacing for non-diary events (e.g. checkin)
  const minSpacingMin = (engCfg.interval && engCfg.interval[eventDef.id] != null)
    ? engCfg.interval[eventDef.id] : 0;

  let totalMins = (twEnd - twStart) * 60;
  if (totalMins <= 0) totalMins = 24 * 60;

  // Generate N random raw offsets, then spread them with jitter + min spacing
  const rawOffsets = [];
  for (let i = 0; i < count; i++) {
    const slotRng = seedRandom(dateStr + '_' + eventDef.id + '_' + nonce + '_' + i);
    rawOffsets.push({ offset: Math.floor(slotRng() * totalMins), idx: i });
  }
  rawOffsets.sort((a, b) => a.offset - b.offset);

  // Distribute: each slot gets minSpacingMin + a random share of the remaining slack.
  // Use sorted cumulative fractions so gaps are always positive.
  const totalSpanNeeded = count * minSpacingMin;
  const slack = Math.max(0, totalMins - totalSpanNeeded);
  const gapRng = seedRandom(daySeed + '_gap');
  // Generate count random fractions, sort them so they're monotonic
  const fracs = [0];
  for (let i = 1; i < count; i++) fracs.push(gapRng());
  fracs.sort(function(a, b) { return a - b; });
  const fracSum = fracs[fracs.length - 1] || 1;
  var cumMin = 0;
  const spacedOffsets = [];
  for (let i = 0; i < count; i++) {
    cumMin += (i > 0 ? minSpacingMin : 0);
    var extraFrac = fracs[i] / fracSum;
    var pos = cumMin + Math.floor(extraFrac * slack);
    spacedOffsets.push({ offset: pos, idx: rawOffsets[i].idx });
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const windowBaseMs = new Date(y, m - 1, d, twStart, 0, 0, 0).getTime();
  const times = spacedOffsets.map(s => {
    const ts = windowBaseMs + s.offset * 60000;
    const nd = new Date(ts);
    return { hour: nd.getHours(), minute: nd.getMinutes(), timestamp: ts, index: s.idx };
  });
  times.sort((a, b) => a.timestamp - b.timestamp);
  return times;
}

// ---- Backfill Engine ----
async function runBackfill() {
  const lastActive = STORE.lastActive;
  const now = Date.now();
  
  // ✅ FIX #2.1: 新用户首启动初始化
  if (!lastActive) {
    STORE.lastActive = now;
    console.log('[DreamEngine] 首次启动，初始化时间戳 - 不进行离线回溯');
    return;
  }
  
  // ✅ FIX #2.2: 限制回溯跨度（最多7天）和事件数（最多100个）
  const MAX_BACKFILL_DAYS = 7;
  const MAX_BACKFILL_EVENTS = 100;
  const minAllowedTime = now - (MAX_BACKFILL_DAYS * 86400000);
  const startTime = Math.max(lastActive, minAllowedTime);
  
  const cfg = STORE.config || {};
  const engCfg = cfg.dreamEngine || {};

  const startDate = new Date(startTime);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  const dayMs = 86400000;
  let cursor = new Date(startDate);
  let totalGenerated = 0;

  console.log('[DreamEngine] 开始离线回溯（从 ' + new Date(startTime).toLocaleString('zh-CN') + ' 到 ' + new Date(now).toLocaleString('zh-CN') + '）');

  while (cursor <= endDate && totalGenerated < MAX_BACKFILL_EVENTS) {
    const dateStr = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');

    for (const eventDef of EVENT_TYPE_LIST) {
      if (eventDef.dependsOnUserAction) continue;
      // 碎影走滚动间隔，不做离线槽位回溯（否则离线一天会灌出一堆碎影）
      if (eventDef.id === 'dreamShadow') continue;
      const enabled = (engCfg.enabled && engCfg.enabled[eventDef.id] != null) ? engCfg.enabled[eventDef.id] : true;
      if (!enabled) continue;

      const times = computeEventTimesForDay(dateStr, eventDef);
      for (const slot of times) {
        if (totalGenerated >= MAX_BACKFILL_EVENTS) break;
        
        if (isEventCompleted(eventDef.id, dateStr, slot.index)) continue;
        if (slot.timestamp <= startTime) continue;
        if (slot.timestamp >= now) continue;

        const nonce = getOrCreateDayNonce(dateStr, eventDef.id);
        const slotSeed = dateStr + '_' + eventDef.id + '_' + nonce + '_' + slot.index;
        setBackfillContext(slot.timestamp, seedRandom(slotSeed));
        try {
          await eventDef.generateContent({ timestamp: slot.timestamp });
          totalGenerated++;
        } catch (e) {
          console.warn('Backfill error:', eventDef.id, dateStr, slot.index, e);
        }
        clearBackfillContext();
        markEventCompleted(eventDef.id, dateStr, slot.index);
        
        // ✅ FIX #2.3: 防止UI卡顿，让出线程
        await sleep(10);
      }
      
      if (totalGenerated >= MAX_BACKFILL_EVENTS) break;
    }
    cursor = new Date(cursor.getTime() + dayMs);
  }
  
  console.log('[DreamEngine] 离线回溯完成，共补充 ' + totalGenerated + ' 条事件');
  STORE.lastActive = now;
}

function startBackgroundBackfill() {
  if (state.backfillPromise) return state.backfillPromise;
  function finishBackfill() {
    renderMessages();
    updateRedDots();
    scheduleTodayEvents();
  }
  state.backfillPromise = runBackfill().then(function() {
    finishBackfill();
  }, function(error) {
    console.warn('Background backfill error:', error);
    STORE.lastActive = Date.now();
    finishBackfill();
  }).then(function() {
    state.backfillPromise = null;
  });
  return state.backfillPromise;
}

// ---- Real-time Scheduler ----
function stopAllDreamEventTimers() {
  Object.values(state.dreamEventTimers).forEach(tid => clearTimeout(tid));
  state.dreamEventTimers = {};
  stopShadowTimer();
}

// 碎影：滚动间隔调度（不是当天固定槽位）
// 语义 = 「上次检查之后隔 rand(min,max) 分钟再检查一次」，由 nextAt 自己持有。
// 命中且成功投递后重新掷下一次；未命中/被跳过则短退避重试 ——
// 关键：绝不像固定槽位那样「一次没成就把当天永久标记完成」（那是本次报修的第二个根因）。
var SHADOW_RETRY_MIN_MS = 60 * 1000;

function scheduleShadowTimer() {
  if (state.shadowTimerId) { clearTimeout(state.shadowTimerId); state.shadowTimerId = null; }
  const cfg = STORE.config || {};
  const engCfg = cfg.dreamEngine || {};
  const enabled = (engCfg.enabled && engCfg.enabled.dreamShadow != null) ? engCfg.enabled.dreamShadow : true;
  if (!enabled || !shadowEnabled()) return;

  const now = shadowNowMs();
  const st = shadowRollState();
  if (!(st.nextAt > 0)) {
    // 首次排期：从时间窗内的此刻起算
    st.nextAt = (shadowInWindow(now) ? now : shadowWindowStart(now)) + shadowNextDelayMs();
    shadowSaveRollState(st);
  }
  // 陈旧 nextAt 自愈：config 里可能留着过去的时间点（例如上一版用被 backfill 覆盖的
  // Date.now 排出来的），若不管它，wait 会被 max(1000,…) 夹成 1 秒 ⇒ 加载后立刻出影，
  // 且设置页显示「下次检查约 0 分钟后」。凡读到过去的时间点，一律按新间隔重排。
  if (st.nextAt <= now) {
    st.nextAt = (shadowInWindow(now) ? now : shadowWindowStart(now)) + shadowNextDelayMs();
    shadowSaveRollState(st);
  }
  if (!shadowInWindow(now)) {
    // 不在时间窗：等到窗口起点再判断
    const wake = shadowWindowStart(now);
    st.nextAt = wake + shadowNextDelayMs();
    shadowSaveRollState(st);
    state.shadowTimerId = setTimeout(scheduleShadowTimer, Math.max(1000, wake - now));
    return;
  }

  const wait = Math.max(1000, st.nextAt - now);
  state.shadowTimerId = setTimeout(async function() {
    state.shadowTimerId = null;
    try {
      // 每日上限（0 = 不限）：到顶就顺延到明天窗口起点
      const cap = shadowDailyCap();
      if (cap > 0 && shadowTodayCount(shadowNowMs()) >= cap) {
        const st2 = shadowRollState();
        st2.nextAt = shadowWindowStart(shadowNowMs()) + shadowNextDelayMs();
        shadowSaveRollState(st2);
        scheduleShadowTimer();
        return;
      }
      if (!shadowInWindow(shadowNowMs())) { scheduleShadowTimer(); return; }
      // 门槛没过（正在发消息 / 已有生成任务 / 记录不足）：短退避重试，
      // 这一切**不算一次检查**，所以不消耗完整间隔 —— 否则整点常撞上
      // 梦角正在发消息，1~2 个机会全被吃掉，表现就是"一个都不出"。
      const gate = canCreateShadow();
      if (!gate.ok) {
        const sg = shadowRollState();
        sg.nextAt = shadowNowMs() + SHADOW_RETRY_MIN_MS;
        shadowSaveRollState(sg);
        scheduleShadowTimer();
        return;
      }
      // 真正尝试一次：不论成/不成，都按配置的间隔滚到下一次（不永久作废）
      await deliverShadowFragment(shadowNowMs());
      const st3 = shadowRollState();
      st3.nextAt = shadowNowMs() + shadowNextDelayMs();
      shadowSaveRollState(st3);
    } catch (e) {
      console.warn('Shadow schedule error:', e);
      const st4 = shadowRollState();
      st4.nextAt = shadowNowMs() + shadowNextDelayMs();
      shadowSaveRollState(st4);
    }
    scheduleShadowTimer();
  }, wait);
}

function stopShadowTimer() {
  if (state.shadowTimerId) { clearTimeout(state.shadowTimerId); state.shadowTimerId = null; }
}

function scheduleTodayEvents() {
  const cfg = STORE.config || {};
  const engCfg = cfg.dreamEngine || {};
  const now = Date.now();
  const today = new Date();
  const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  stopAllDreamEventTimers();

  for (const eventDef of EVENT_TYPE_LIST) {
    if (eventDef.dependsOnUserAction) continue;
    // 碎影有自己的滚动间隔调度，不走当天固定槽位表（见 scheduleShadowTimer）
    if (eventDef.id === 'dreamShadow') continue;
    const enabled = (engCfg.enabled && engCfg.enabled[eventDef.id] != null) ? engCfg.enabled[eventDef.id] : true;
    if (!enabled) continue;

    const times = computeEventTimesForDay(dateStr, eventDef);
    for (const slot of times) {
      if (isEventCompleted(eventDef.id, dateStr, slot.index)) continue;

      if (slot.timestamp <= now) {
        // Past-but-not-completed: generate immediately (mini-backfill to prevent data loss)
        const nonce = getOrCreateDayNonce(dateStr, eventDef.id);
        const slotSeed = dateStr + '_' + eventDef.id + '_' + nonce + '_' + slot.index;
        setBackfillContext(slot.timestamp, seedRandom(slotSeed));
        eventDef.generateContent({ timestamp: slot.timestamp })
          .catch(e => console.warn('Catch-up event error:', eventDef.id, slot.index, e))
          .finally(() => {
            clearBackfillContext();
            markEventCompleted(eventDef.id, dateStr, slot.index);
          });
        continue;
      }

      // Future event — schedule
      const delay = Math.max(1000, slot.timestamp - now);
      const timerKey = eventDef.id + '_' + dateStr + '_' + slot.index;
      const nonce = getOrCreateDayNonce(dateStr, eventDef.id);
      const slotSeed = dateStr + '_' + eventDef.id + '_' + nonce + '_' + slot.index;
      state.dreamEventTimers[timerKey] = setTimeout(() => {
        setBackfillContext(slot.timestamp, seedRandom(slotSeed));
        eventDef.generateContent({ timestamp: slot.timestamp })
          .catch(e => console.warn('Scheduled event error:', e))
          .finally(() => {
            clearBackfillContext();
            markEventCompleted(eventDef.id, dateStr, slot.index);
            delete state.dreamEventTimers[timerKey];
          });
      }, delay);
    }
  }

  // 碎影不占固定槽位，单独起滚动间隔的定时器
  scheduleShadowTimer();
}

// ============ Dream: Auto-post Moments ============
const UNSPLASH_ACCESS_KEY = 'bmDstlNyfCVvmhsGCgNik0Nxqa2pia69w-afDgsKyvQ';
const UNSPLASH_API = 'https://api.unsplash.com/photos/random';

async function getRandomPhotoForDream() {
  try {
    const url = `${UNSPLASH_API}?count=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(function() { controller.abort(); }, 6000);
    const resp = await fetch(url, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error(`Unsplash HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data || !Array.isArray(data) || !data[0] || !data[0].urls || !data[0].urls.regular) throw new Error('Unsplash: no results');
    return data[0].urls.regular;
  } catch (e) {
    console.warn('Unsplash failed:', e.name || e.message);
    return 'https://picsum.photos/1080/1920?random=' + (Math.floor((_timeOverride || Date.now()) / 1000) % 1000);
  }
}

async function postDreamMoment() {
  if(!checkWordCards())return;
  const cfg=STORE.config||{};
  const cardMin=cfg.dreamPostCardMin||1, cardMax=cfg.dreamPostCardMax||5;
  const cardCount=Math.floor(randomBetween(cardMin,cardMax+0.999));
  const visible=getVisibleCards();
  const picked=[];
  for(let i=0;i<cardCount;i++){const c=weightedPick(visible);if(c)picked.push(c.text);}
  const content=picked.join(' ');
  if(!content)return;

  // 60% chance to attach a photo
  let imageUrl = '';
  if (Math.random() < 0.6) {
    imageUrl = await getRandomPhotoForDream();
  }

  const moments=STORE.moments||[];
  moments.push({
    id:'dream_'+Date.now(),
    publisher:'dream',
    content,
    timestamp:Date.now(),
    likes:[],
    comments:[],
    imageUrl,
    dreamProcessed:true,
  });
  STORE.moments=moments;
  // Re-render if moments view is open
  if(state.fsView==='moments')renderFeed();
}

function startDreamPostTimer() {
  stopDreamPostTimer();
  const cfg=STORE.config||{};
  const timing=cfg.timing||{dreamPost:{min:2,max:8}};
  const minMs=(timing.dreamPost?.min||2)*60000;
  const maxMs=(timing.dreamPost?.max||8)*60000;
  function scheduleNext(){
    const delay=randomBetween(minMs,maxMs);
    state.dreamPostTimerId=setTimeout(()=>{
      postDreamMoment();
      scheduleNext();
    },delay);
  }
  scheduleNext();
}

function stopDreamPostTimer() {
  clearTimeout(state.dreamPostTimerId);
  state.dreamPostTimerId=null;
}

// ============ Page Load: Restore Pending Reactions ============
function restorePendingReactions() {
  const moments=STORE.moments||[];
  const now=Date.now();
  moments.forEach(m=>{
    if(m.publisher!=='user'||m.dreamProcessed)return;
    if(m.reactionScheduledTime){
      const remaining=m.reactionScheduledTime-now;
      if(remaining<=0){
        // Time already passed, execute immediately
        executeDreamReaction(m.id);
      } else {
        // Schedule for remaining time
        const tid=setTimeout(()=>executeDreamReaction(m.id),remaining);
        state.pendingReactionTimers[m.id]=tid;
      }
    } else {
      // No scheduled time (old data), schedule now
      scheduleDreamReaction(m.id);
    }
  });
}

function checkWordCards() {
  const visible=getVisibleCards();
  if(!visible||visible.length===0){
    alert('字卡库为空，无法生成梦角内容');
    return false;
  }
  return true;
}

function deleteMoment(mid) {
  if(!confirm('确定删除这条动态吗？'))return;
  let moments=STORE.moments||[], liked=STORE.likedMoments||[];
  moments=moments.filter(m=>m.id!==mid);
  liked=liked.filter(id=>id!==mid);
  STORE.moments=moments; STORE.likedMoments=liked;
  renderFeed();
}

function formatTime(ts) {
  const d=new Date(ts), now=new Date();
  const diff=now-d;
  if(diff<60000)return '刚刚';
  if(diff<3600000)return Math.floor(diff/60000)+'分钟前';
  if(diff<86400000)return Math.floor(diff/3600000)+'小时前';
  if(diff<172800000)return '昨天';
  return d.toLocaleDateString('zh-CN',{month:'long',day:'numeric'})+' '+d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
}

// ============ Rendering: Diary (日记) ============
function renderDiary(container) {
  if (state.diaryFullscreenId) {
    renderDiaryFullscreen(container);
    return;
  }
  if(!state.diaryMonth){ const now=new Date(); state.diaryMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'); }
  const todayStr=todayDateString();
  const hasUserDiaryToday=hasDiary(todayStr,'user');

  container.innerHTML=`
  <div class="diary-page">
    <div class="diary-toolbar">
      <span class="dt-month" id="diaryMonthLabel"></span>
      <button class="btn-write-diary" id="btnWriteDiary" ${hasUserDiaryToday?'disabled':''}>${hasUserDiaryToday?'今日已写✍️':'✍️ 写日记'}</button>
    </div>
    <div class="calendar-grid" id="calendarGrid"></div>
    <div class="diary-detail" id="diaryDetail">
      <div class="diary-empty">👆 点击日历上的日期查看日记</div>
    </div>
  </div>`;

  renderCalendar();
  bindDiaryEvents(container);
}

function todayDateString() { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function hasDiary(dateStr,author) { return (STORE.diaries||[]).some(d=>d.date===dateStr&&d.author===author); }

function renderCalendar() {
  const grid=document.getElementById('calendarGrid'); if(!grid)return;
  const lbl=document.getElementById('diaryMonthLabel'); if(!lbl)return;
  const [y,m]=state.diaryMonth.split('-').map(Number);
  lbl.textContent=y+'年'+m+'月';

  const today=new Date(); const todayStr=todayDateString();
  const firstDay=new Date(y,m-1,1).getDay(); // 0=Sun
  const daysInMonth=new Date(y,m,0).getDate();
  const weekHeaders=['日','一','二','三','四','五','六'];

  let html=weekHeaders.map(h=>`<div class="cg-hdr">${h}</div>`).join('');
  // Empty cells before first day
  for(let i=0;i<firstDay;i++) html+=`<div class="cg-day outside"></div>`;
  // Day cells
  for(let d=1;d<=daysInMonth;d++){
    const ds=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday=ds===todayStr;
    const isFuture=ds>todayStr;
    const hasUser=hasDiary(ds,'user'); const hasDream=hasDiary(ds,'dream');
    let cls='cg-day'; if(isToday)cls+=' today'; if(isFuture)cls+=' future';
    html+=`<div class="${cls}" data-date="${ds}">
      <span>${d}</span>
      <div class="cg-dots">${hasUser?'<span class="cg-dot user"></span>':''}${hasDream?'<span class="cg-dot dream"></span>':''}</div>
    </div>`;
  }
  grid.innerHTML=html;
}

function showDiaryDetail(dateStr) {
  state.diarySelectedDate = dateStr;
  const detail=document.getElementById('diaryDetail'); if(!detail)return;
  const diaries=STORE.diaries||[];
  const userDiary=diaries.find(d=>d.date===dateStr&&d.author==='user');
  const dreamDiary=diaries.find(d=>d.date===dateStr&&d.author==='dream');
  const todayStr=todayDateString();
  const isToday=dateStr===todayStr;

  let html=`<div class="diary-date-title">${dateStr}</div>`;

  // User diary
  if(userDiary){
    html+=renderDiaryEntry(userDiary,true);
  } else {
    if(isToday){
      html+=`<div class="diary-empty">今日未写日记 <button class="btn-write-diary" id="btnWriteDiaryDetail" style="margin-left:8px;">✍️ 写日记</button></div>`;
    } else {
      html+=`<div class="diary-empty">这一天没有日记</div>`;
    }
  }

  // Dream diary
  if(dreamDiary){
    html+=renderDiaryEntry(dreamDiary,false);
    html+=`<div style="text-align:center;margin-top:8px;"><button class="btn-refresh-diary" data-date="${dateStr}" style="padding:6px 14px;font-size:12px;border-radius:20px;background:var(--bg-warm);color:var(--accent);border:1px solid var(--border);cursor:pointer;transition:all 0.15s;">🔄 刷新梦角日记</button></div>`;
  } else {
    html+=`<div class="diary-empty">🤔 梦角还在酝酿中...</div>`;
    html+=`<div style="text-align:center;margin-top:8px;"><button class="btn-refresh-diary" data-date="${dateStr}" style="padding:6px 14px;font-size:12px;border-radius:20px;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:all 0.15s;">✨ 生成梦角日记</button></div>`;
  }

  detail.innerHTML=html;

  // Bind detail events
  detail.querySelectorAll('.diary-card-openable').forEach(card=>{
    card.addEventListener('click',function(e){
      if(e.target.closest('button,input,textarea,a,.ai-box,.diary-comments'))return;
      openDiaryFullscreen(this.dataset.did);
    });
  });
  if(userDiary){
    detail.querySelector('.btn-edit-diary')?.addEventListener('click',e=>{
      e.stopPropagation();
      openDiaryFullscreen(userDiary.id);
    });
  }
  if(isToday&&!userDiary){
    detail.querySelector('#btnWriteDiaryDetail')?.addEventListener('click',showWriteDiaryModal);
  }
  // Comment buttons
  detail.querySelectorAll('.btn-comment-diary').forEach(btn=>{
    btn.addEventListener('click',function(){
      const section=this.closest('.diary-comments');
      if(section)section.querySelector('.dc-input-row').style.display='flex';
    });
  });
  detail.querySelectorAll('.dc-send').forEach(btn=>{
    btn.addEventListener('click',function(){
      const diaryId=this.dataset.did;
      const inp=this.parentElement.querySelector('input');
      const text=(inp?.value||'').trim();
      if(!text){alert('请输入批阅内容');return;}
      if(inp)inp.value='';
      addDiaryComment(diaryId,'user',text);
    });
  });
  // AI 解读日记按钮
  detail.querySelectorAll('.btn-ai-diary').forEach(btn=>{
    btn.addEventListener('click',function(){
      if(!isAIInterpretReady()){alert('请先到「设置 → AI 解读」开启功能并填写 API Key');return;}
      var did=this.dataset.did;
      var diaries=STORE.diaries||[];
      var diary=diaries.find(d=>d.id===did);
      if(!diary)return;
      var box=this.closest('.diary-entry').querySelector('.ai-box');
      if(!box)return;
      runAIInterpretOnBox(box, {
        targetText: buildDiaryTarget(diary),
        contextMessages: [],
        scene: 'diary',
        loadingText: '解读日记中',
        favoriteMeta: {
          sourceType: 'diary',
          sourceId: diary.id,
          sourceLabel: '日记',
          text: buildDiaryTarget(diary)
        }
      });
    });
  });
  // 刷新/生成梦角日记按钮
  detail.querySelector('.btn-refresh-diary')?.addEventListener('click',async function(){
    var dateStr = this.dataset.date;
    // 删除已有梦角日记
    var diaries = STORE.diaries || [];
    var idx = diaries.findIndex(function(d) { return d.date === dateStr && d.author === 'dream'; });
    if (idx >= 0) diaries.splice(idx, 1);
    STORE.diaries = diaries;
    this.textContent = '生成中...';
    this.disabled = true;
    await generateDreamDiary(dateStr);
    showDiaryDetail(dateStr);
  });
}

function renderDiaryEntry(diary, isUser) {
  const comments=diary.comments||[];
  let commentsHtml='';
  if(comments.length>0){
    commentsHtml=comments.map(c=>{
      const name=c.author==='user'?(STORE.config||{}).userNickname||'我':(STORE.config||{}).characterName||'梦角';
      return `<div class="dc-item"><span class="dc-author">${escapeHtml(name)}：</span>${escapeHtml(c.content)}</div>`;
    }).join('');
  }
  const editBtn=isUser?`<button class="btn-edit-diary">✏️ 编辑</button>`:'';
  const aiBtnDiary=!isUser?`<button class="btn-ai-diary" data-did="${diary.id}">📖 想说什么？</button>`:'';
  const aiBoxDiary=!isUser?`<div class="ai-box" data-ai-target="diary" data-did="${diary.id}"></div>`:'';
  return `<div class="diary-entry diary-card-openable" data-action="openDiaryFullscreen" data-did="${escapeHtml(diary.id)}">
    <div class="de-header"><span class="de-author">${isUser?'📝 '+((STORE.config||{}).userNickname||'我'):(STORE.config||{}).characterName||'梦角'}的日记</span>${editBtn}</div>
    <div class="de-title">${escapeHtml(diary.title||'无题')}</div>
    <div class="de-body">${escapeHtml(diary.content||'')}</div>
    <div class="de-time">${new Date(diary.updatedAt||diary.createdAt).toLocaleString('zh-CN')}</div>
    <div class="de-actions"><button class="btn-comment-diary">💬 批阅 (${comments.length})</button>${aiBtnDiary}</div>
    ${aiBoxDiary}
    <div class="diary-comments">
      ${commentsHtml}
      <div class="dc-input-row" style="display:none;">
        <input type="text" placeholder="写批阅…" maxlength="200">
        <button class="dc-send" data-did="${diary.id}">发送</button>
      </div>
    </div>
  </div>`;
}

function openDiaryFullscreen(diaryId) {
  state.diaryFullscreenId = diaryId;
  var body = document.getElementById('fsBody');
  if (body) renderDiaryFullscreen(body);
}

function closeDiaryFullscreen() {
  var diaries = STORE.diaries || [];
  var diary = diaries.find(d=>d.id===state.diaryFullscreenId);
  var dateStr = diary ? diary.date : state.diarySelectedDate;
  state.diaryFullscreenId = null;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'diary') {
    renderDiary(body);
    if (dateStr) showDiaryDetail(dateStr);
  }
}

function renderDiaryFullscreen(container) {
  const diaries=STORE.diaries||[];
  const diary=diaries.find(d=>d.id===state.diaryFullscreenId);
  if(!diary){
    state.diaryFullscreenId=null;
    renderDiary(container);
    return;
  }
  const isUser=diary.author==='user';
  const cfg=STORE.config||{};
  const authorName=isUser?(cfg.userNickname||'我'):(cfg.characterName||'梦角');
  const comments=diary.comments||[];
  const commentsHtml=comments.length>0 ? comments.map(c=>{
    const name=c.author==='user'?(cfg.userNickname||'我'):(cfg.characterName||'梦角');
    return `<div class="dc-item"><span class="dc-author">${escapeHtml(name)}：</span>${escapeHtml(c.content)}</div>`;
  }).join('') : '<div class="mc-empty">暂无批阅</div>';
  const editorHtml=isUser
    ? `<input type="text" class="diary-full-title-input" id="diaryFullTitleInput" value="${escapeHtml(diary.title||'')}" maxlength="50">
       <textarea class="diary-full-content-input" id="diaryFullContentInput">${escapeHtml(diary.content||'')}</textarea>`
    : `<div class="diary-full-read-title">${escapeHtml(diary.title||'无题')}</div>
       <div class="diary-full-read-body">${escapeHtml(diary.content||'')}</div>`;
  const aiHtml=!isUser?`<div class="ai-box" data-ai-target="diary" data-did="${escapeHtml(diary.id)}"></div>`:'';
  const saveBtn=isUser?`<button class="diary-full-btn primary btn-diary-full-save" type="button">保存</button>`:'';
  const dreamTools=!isUser?`<button class="diary-full-btn btn-ai-diary" type="button" data-did="${escapeHtml(diary.id)}">📖 想说什么？</button>
    <button class="diary-full-btn btn-refresh-diary" type="button" data-date="${escapeHtml(diary.date)}">🔄 刷新</button>`:'';

  container.innerHTML=`<div class="diary-fullscreen">
    <div class="diary-full-head">
      <button class="diary-full-btn btn-diary-full-back" type="button">‹ 返回</button>
      <div class="diary-full-titlebar">
        <div class="diary-full-date">${escapeHtml(diary.date)}</div>
        <div class="diary-full-name">${escapeHtml(authorName)}的日记</div>
      </div>
      <div class="diary-full-actions">${dreamTools}${saveBtn}</div>
    </div>
    <div class="diary-full-body">
      <div class="diary-full-paper">
        ${editorHtml}
        <div class="diary-full-meta">更新于 ${new Date(diary.updatedAt||diary.createdAt).toLocaleString('zh-CN')}</div>
        ${aiHtml}
      </div>
      <div class="diary-full-extra">
        <div class="diary-comments">
          ${commentsHtml}
          <div class="dc-input-row">
            <input type="text" placeholder="写批阅…" maxlength="200">
            <button class="dc-send" data-did="${escapeHtml(diary.id)}">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  bindDiaryFullscreenEvents(container, diary);
}

function bindDiaryFullscreenEvents(container, diary) {
  container.querySelector('.btn-diary-full-back')?.addEventListener('click',closeDiaryFullscreen);
  container.querySelector('.btn-diary-full-save')?.addEventListener('click',function(){
    saveDiaryFullscreenEdit(diary.id);
  });
  container.querySelector('.dc-send')?.addEventListener('click',function(){
    const inp=this.parentElement.querySelector('input');
    const text=(inp?.value||'').trim();
    if(!text){alert('请输入批阅内容');return;}
    if(inp)inp.value='';
    addDiaryComment(diary.id,'user',text);
  });
  container.querySelector('.btn-ai-diary')?.addEventListener('click',function(){
    if(!isAIInterpretReady()){alert('请先到「设置 → AI 解读」开启功能并填写 API Key');return;}
    var box=container.querySelector('.ai-box[data-ai-target="diary"]');
    if(!box)return;
    runAIInterpretOnBox(box, {
      targetText: buildDiaryTarget(diary),
      contextMessages: [],
      scene: 'diary',
      loadingText: '解读日记中',
      favoriteMeta: {
        sourceType: 'diary',
        sourceId: diary.id,
        sourceLabel: '日记',
        text: buildDiaryTarget(diary)
      }
    });
  });
  container.querySelector('.btn-refresh-diary')?.addEventListener('click',async function(){
    var dateStr=this.dataset.date;
    var diaries=STORE.diaries||[];
    var idx=diaries.findIndex(function(d){return d.date===dateStr&&d.author==='dream';});
    if(idx>=0)diaries.splice(idx,1);
    STORE.diaries=diaries;
    this.textContent='生成中...';
    this.disabled=true;
    var diaryNew=await generateDreamDiary(dateStr);
    if(diaryNew)state.diaryFullscreenId=diaryNew.id;
    renderDiaryFullscreen(container);
  });
}

function saveDiaryFullscreenEdit(diaryId) {
  const diaries=STORE.diaries||[];
  const diary=diaries.find(d=>d.id===diaryId);
  if(!diary)return;
  const titleEl=document.getElementById('diaryFullTitleInput');
  const contentEl=document.getElementById('diaryFullContentInput');
  const title=(titleEl?.value||'').trim()||'无题';
  const content=(contentEl?.value||'').trim();
  if(!content){alert('请输入日记内容');return;}
  diary.title=title;
  diary.content=content;
  diary.updatedAt=Date.now();
  STORE.diaries=diaries;
  var body=document.getElementById('fsBody');
  if(body)renderDiaryFullscreen(body);
}

function bindDiaryEvents(container) {
  // Publish button
  container.querySelector('#btnWriteDiary')?.addEventListener('click',showWriteDiaryModal);
  // Swipe month navigation
  addCalendarSwipe(container.querySelector('#calendarGrid'), (dir) => {
    const [y,m]=state.diaryMonth.split('-').map(Number);
    if (dir === 'prev') {
      state.diaryMonth = m===1 ? (y-1)+'-12' : y+'-'+String(m-1).padStart(2,'0');
    } else {
      state.diaryMonth = m===12 ? (y+1)+'-01' : y+'-'+String(m+1).padStart(2,'0');
    }
    renderCalendar();
    document.getElementById('diaryDetail').innerHTML='<div class="diary-empty">👆 点击日历上的日期查看日记</div>';
  });
  // Calendar day click (delegated)
  container.querySelector('#calendarGrid')?.addEventListener('click',e=>{
    const day=e.target.closest('.cg-day');
    if(!day||!day.dataset.date||day.classList.contains('future'))return;
    showDiaryDetail(day.dataset.date);
  });
}

// Reusable swipe handler for calendar grids
function addCalendarSwipe(grid, onChangeMonth) {
  if (!grid) return;
  let startX = 0, startY = 0, started = false;
  grid.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; started = true; }
  }, { passive: true });
  grid.addEventListener('touchend', e => {
    if (!started) return;
    const dx = (e.changedTouches[0]?.clientX || startX) - startX;
    const dy = (e.changedTouches[0]?.clientY || startY) - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      onChangeMonth(dx > 0 ? 'next' : 'prev');
    }
    started = false;
  });
  grid.addEventListener('mousedown', e => { startX = e.clientX; startY = e.clientY; started = true; });
  grid.addEventListener('mouseup', e => {
    if (!started) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      onChangeMonth(dx > 0 ? 'next' : 'prev');
    }
    started = false;
  });
}

// ============ Diary Actions ============
function showWriteDiaryModal() {
  showModal(`<h3>写日记 - ${todayDateString()}</h3>
    <div class="diary-edit-modal">
      <input type="text" id="deTitle" placeholder="标题（可选）" maxlength="50">
      <textarea id="deContent" placeholder="今天想记录什么..."></textarea>
    </div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="deSave">保存</button></div>`);

  document.getElementById('deSave').addEventListener('click',()=>{
    const title=document.getElementById('deTitle').value.trim()||'无题';
    const content=document.getElementById('deContent').value.trim();
    if(!content){alert('请输入日记内容');return;}
    const dateStr=todayDateString();
    const now=Date.now();
    const diaries=STORE.diaries||[];
    diaries.push({id:dateStr+'_user',date:dateStr,author:'user',title,content,createdAt:now,updatedAt:now,comments:[]});
    STORE.diaries=diaries;
    hideModal();
    // Refresh
    const body=document.getElementById('fsBody');
    if(body&&state.fsView==='diary'){renderDiary(body);showDiaryDetail(dateStr);}
  });
}

function showEditDiaryModal(diaryId) {
  const diaries=STORE.diaries||[], diary=diaries.find(d=>d.id===diaryId);
  if(!diary)return;
  showModal(`<h3>编辑日记 - ${diary.date}</h3>
    <div class="diary-edit-modal">
      <input type="text" id="deTitle" value="${escapeHtml(diary.title||'')}" maxlength="50">
      <textarea id="deContent">${escapeHtml(diary.content||'')}</textarea>
    </div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="deSave">保存修改</button></div>`);

  document.getElementById('deSave').addEventListener('click',()=>{
    diary.title=document.getElementById('deTitle').value.trim()||'无题';
    diary.content=document.getElementById('deContent').value.trim();
    if(!diary.content){alert('请输入日记内容');return;}
    diary.updatedAt=Date.now();
    STORE.diaries=diaries;
    hideModal();
    showDiaryDetail(diary.date);
  });
}

// ============ Dream Diary Generation ============
function collectTodayMaterials(dateStr) {
  var favorites = (STORE.favorites || []).filter(function(f) {
    var d = new Date(f.timestamp).toISOString().slice(0, 10);
    return d === dateStr && f.type === 'message';
  });
  var messages = (STORE.messages || []).filter(function(m) {
    var d = new Date(m.timestamp).toISOString().slice(0, 10);
    return d === dateStr;
  });
  var moments = (STORE.moments || []).filter(function(m) {
    var d = new Date(m.timestamp).toISOString().slice(0, 10);
    return d === dateStr;
  });
  var checkins = (STORE.checkins || []).filter(function(c) {
    var d = new Date(c.timestamp).toISOString().slice(0, 10);
    return d === dateStr;
  });
  return { favorites: favorites, messages: messages, moments: moments, checkins: checkins };
}

function buildMaterialsContext(mat) {
  var cfg = STORE.config || {};
  var charName = cfg.characterName || '梦角';
  var userName = cfg.userNickname || '我';
  var lines = [];

  lines.push('日期：' + new Date().toISOString().slice(0, 10));

  // 聊天记录
  if (mat.messages.length > 0) {
    lines.push('\n【聊天记录】');
    mat.messages.forEach(function(m) {
      var who = m.type === 'user' ? userName : charName;
      var text = m.text || (m.doodle ? '[涂鸦]' : '') || (m.imageData ? '[图片]' : '');
      var t = new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      if (text) lines.push(t + ' ' + who + '：' + text);
    });
  }

  // AI解读收藏
  if (mat.favorites.length > 0) {
    lines.push('\n【收藏的AI解读】');
    mat.favorites.forEach(function(f) {
      var t = f.text || '';
      var interp = f.interpretation || '';
      if (t) lines.push('原文：' + t + (interp ? ' → 解读：' + interp : ''));
    });
  }

  // 朋友圈
  if (mat.moments.length > 0) {
    lines.push('\n【朋友圈动态】');
    mat.moments.forEach(function(m) {
      var publisher = m.publisher === 'dream' ? charName : m.publisher === 'user' ? userName : '未知';
      var content = m.content || '';
      lines.push(publisher + '：' + (content || '(无文字)'));
      var likes = m.likes || [];
      if (likes.length > 0) lines.push('  👍 ' + likes.length + '人赞');
      var comments = m.comments || [];
      comments.forEach(function(c) {
        var name = c.commenter === 'dream' ? charName : c.commenter === 'user' ? userName : c.commenter;
        lines.push('  💬 ' + name + '：' + c.content);
      });
    });
  }

  // 打卡
  if (mat.checkins.length > 0) {
    lines.push('\n【打卡记录】');
    mat.checkins.sort(function(a, b) { return a.timestamp - b.timestamp; });
    mat.checkins.forEach(function(c) {
      var who = c.role === 'user' ? userName : charName;
      var t = new Date(c.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      lines.push(t + ' ' + who + '：' + c.content);
    });
  }

  return lines.join('\n');
}

// 模板兜底的日记
function generateFallbackDiaryContent(mat) {
  var cfg = STORE.config || {};
  var charName = cfg.characterName || '梦角';
  var userName = cfg.userNickname || '我';
  var parts = [];

  parts.push(charName + '的日记\n');

  if (mat.messages.length > 0) {
    var userMsgs = mat.messages.filter(function(m) { return m.type === 'user'; });
    var charMsgs = mat.messages.filter(function(m) { return m.type === 'character'; });
    var userTexts = userMsgs.slice(0, 2).map(function(m) { return m.text || ''; }).filter(Boolean);
    var charTexts = charMsgs.slice(0, 2).map(function(m) { return m.text || ''; }).filter(Boolean);
    var chatStr = '';
    if (userTexts.length > 0) chatStr += userName + '跟我说了些有趣的事';
    if (charTexts.length > 0) chatStr += (chatStr ? '，我也' : '我') + '用字卡回应了';
    if (chatStr) parts.push('今天和' + userName + '聊了天，' + chatStr + '。一共' + mat.messages.length + '条消息。');
  }

  if (mat.checkins.length > 0) {
    parts.push('我们一起打卡了' + mat.checkins.length + '次，记录了今天的生活。');
  }

  if (mat.moments.length > 0) {
    parts.push('朋友圈里也很热闹，大家分享了今天的点滴。');
  }

  if (mat.favorites.length > 0) {
    parts.push('我还收藏了几条特别有感触的对话解读。');
  }

  parts.push('今天也是充实的一天，想对' + userName + '说声谢谢陪伴。——' + charName);
  return parts.join('\n\n');
}

// AI生成日记内容（异步）
function generateAIDiaryContent(mat) {
  return new Promise(function(resolve, reject) {
    var cfg = getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) { reject(new Error('AI not configured')); return; }

    var charName = (STORE.config || {}).characterName || '梦角';
    var userName = (STORE.config || {}).userNickname || '我';

    var systemPrompt = '你扮演' + charName + '本人，用第一人称"我"写一篇今天的日记，约200字。\n\n' +
      '要求：\n' +
      '1. 语言自然口语化，像一个真实的年轻人在写日记\n' +
      '2. 把提供的素材自然地融入日记中，不要逐条罗列\n' +
      '3. 表达出对' + userName + '（用"你"或"ta"称呼）的感情和这一天的感受\n' +
      '4. 风格活泼、真诚，偶尔带点撒娇或小感慨\n' +
      '5. 不要写开头称呼（如"亲爱的日记"），直接写正文\n' +
      '6. 只输出日记正文，不要额外说明';

    var userContent = '以下是我今天的活动素材，请根据这些写一篇日记：\n\n' + buildMaterialsContext(mat);

    fetch(cfg.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.85,
        max_tokens: 2048
      })
    }).then(function(resp) {
      if (!resp.ok) { return resp.text().then(function(t) { reject(new Error('HTTP ' + resp.status + (t ? ': ' + t.slice(0, 200) : ''))); }); }
      return resp.json();
    }).then(function(data) {
      var content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      if (!content) { reject(new Error('AI returned empty')); return; }
      resolve(content);
    }).catch(function(err) { reject(err); });
  });
}

async function generateDreamDiary(dateStr) {
  if (hasDiary(dateStr, 'dream')) return null;

  var mat = collectTodayMaterials(dateStr);
  var content = '';

  // 优先尝试AI生成，失败则用模板兜底
  try {
    content = await generateAIDiaryContent(mat);
  } catch (e) {
    content = generateFallbackDiaryContent(mat);
  }

  if (!content || content.length < 10) return null;

  var now = Date.now();
  var diary = {
    id: dateStr + '_dream',
    date: dateStr,
    author: 'dream',
    title: '梦角的日记',
    content: content,
    createdAt: now,
    updatedAt: now,
    comments: []
  };
  var diaries = STORE.diaries || [];
  diaries.push(diary);
  STORE.diaries = diaries;
  setTimeout(updateRedDots, 300);
  return diary;
}

function scheduleDreamDiaryGen() {
  clearTimeout(state.diaryGenTimerId); state.diaryGenTimerId=null;
  const cfg=STORE.config||{};
  const timing=cfg.timing||{diaryGen:{hourMin:21,hourMax:24}};
  const hourMin=timing.diaryGen?.hourMin||21;
  const hourMax=timing.diaryGen?.hourMax||24;

  const now=new Date(); const today=todayDateString();
  // If already past end hour and today's dream diary doesn't exist, generate now
  if(now.getHours()>=hourMax){
    generateDreamDiary(today);
    return;
  }
  // If before start hour, schedule for random time in window
  if(now.getHours()<hourMin){
    const targetMin=hourMin*60+Math.floor(Math.random()*60);
    const nowMin=now.getHours()*60+now.getMinutes();
    const delayMs=(targetMin-nowMin)*60000;
    state.diaryGenTimerId=setTimeout(()=>{
      generateDreamDiary(todayDateString());
      scheduleDreamDiaryGen(); // re-schedule for next day
    },delayMs);
    return;
  }
  // Within window: random remaining minutes
  const remainingMin=(hourMax-now.getHours())*60-now.getMinutes();
  const delayMs=Math.floor(Math.random()*remainingMin)*60000;
  state.diaryGenTimerId=setTimeout(()=>{
    generateDreamDiary(todayDateString());
    scheduleDreamDiaryGen();
  },Math.max(60000,delayMs));
}

// ============ Diary Comments (批阅) ============
function addDiaryComment(diaryId, author, content) {
  const diaries=STORE.diaries||[];
  const diary=diaries.find(d=>d.id===diaryId);
  if(!diary)return;
  if(!Array.isArray(diary.comments))diary.comments=[];
  diary.comments.push({id:'dc_'+Date.now(),author,content,timestamp:Date.now()});
  STORE.diaries=diaries;
  if(state.diaryFullscreenId===diaryId){
    var body=document.getElementById('fsBody');
    if(body)renderDiaryFullscreen(body);
  } else {
    showDiaryDetail(diary.date);
  }
  // Dream replies to user comment on user's diary
  if(author==='user'&&diary.author==='user'){
    scheduleDiaryCommentReply(diaryId);
  }
}

function scheduleDiaryCommentReply(diaryId) {
  const cfg=STORE.config||{};
  const prob=(cfg.prob?.diaryComment||70);
  if(Math.random()*100>=prob)return;
  const timing=cfg.timing||{diaryComment:{min:30,max:120}};
  const minMs=(timing.diaryComment?.min||30)*60000;
  const maxMs=(timing.diaryComment?.max||120)*60000;
  const delay=randomBetween(minMs,maxMs);

  setTimeout(()=>{
    if(!checkWordCards())return;
    const diaries=STORE.diaries||[];
    const diary=diaries.find(d=>d.id===diaryId);
    if(!diary)return;
    const visible=getVisibleCards();
    const picked=[];
    const nCards=Math.floor(randomBetween(2,5));
    for(let i=0;i<nCards;i++){const c=weightedPick(visible);if(c)picked.push(c.text);}
    const content='梦角说：'+picked.join('，');
    if(!Array.isArray(diary.comments))diary.comments=[];
    diary.comments.push({id:'dc_'+Date.now(),author:'dream',content,timestamp:Date.now()});
    STORE.diaries=diaries;
    if(state.fsView==='diary'){
      if(state.diaryFullscreenId===diaryId){
        var body=document.getElementById('fsBody');
        if(body)renderDiaryFullscreen(body);
      } else {
        showDiaryDetail(diary.date);
      }
    }
  },delay);
}

// ============ Letters (写信) ============
function normalizeLetterRange(minValue, maxValue, fallbackMin, fallbackMax, lowerBound, upperBound) {
  var first = Number(minValue);
  var second = Number(maxValue);
  first = Number.isFinite(first) ? first : fallbackMin;
  second = Number.isFinite(second) ? second : fallbackMax;
  first = Math.max(lowerBound, Math.min(upperBound, first));
  second = Math.max(lowerBound, Math.min(upperBound, second));
  return { min: Math.min(first, second), max: Math.max(first, second) };
}

function getLetterConfig() {
  var source = (STORE.config || {}).letter || {};
  return {
    annotationDelay: normalizeLetterRange(
      source.annotationDelay && source.annotationDelay.min,
      source.annotationDelay && source.annotationDelay.max,
      5, 30, 1, 1440
    ),
    coverage: normalizeLetterRange(
      source.coverage && source.coverage.min,
      source.coverage && source.coverage.max,
      25, 50, 1, 100
    ),
    cardCount: normalizeLetterRange(
      source.cardCount && source.cardCount.min,
      source.cardCount && source.cardCount.max,
      1, 1, 1, 3
    )
  };
}

function revealDueLetterAnnotations(now) {
  var letters = STORE.letters || [];
  var changed = false;
  letters.forEach(function(letter) {
    (letter.annotations || []).forEach(function(annotation) {
      if (!annotation.visible && Number(annotation.dueAt) <= now) {
        annotation.visible = true;
        changed = true;
      }
    });
  });
  if (changed) { STORE.letters = letters; setTimeout(updateRedDots, 300); }
  return changed;
}

function scheduleLetterAnnotationReveal() {
  clearTimeout(state.letterRevealTimerId);
  state.letterRevealTimerId = null;
  var nextDueAt = 0;
  (STORE.letters || []).forEach(function(letter) {
    (letter.annotations || []).forEach(function(annotation) {
      if (!annotation.visible && annotation.dueAt && (!nextDueAt || annotation.dueAt < nextDueAt)) nextDueAt = annotation.dueAt;
    });
  });
  if (!nextDueAt) return;
  var wait = Math.max(300, Math.min(nextDueAt - Date.now(), 2147483647));
  state.letterRevealTimerId = setTimeout(function() {
    revealDueLetterAnnotations(Date.now());
    var body = document.getElementById('fsBody');
    if (body && state.fsView === 'letters') {
      if (state.letterFullscreenId || state.letterDraft) renderLetterFullscreen(body);
      else renderLetters(body);
    }
    scheduleLetterAnnotationReveal();
  }, wait);
}

function letterById(letterId) {
  return (STORE.letters || []).find(function(letter) { return letter.id === letterId; });
}

function formatLetterTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function renderLetters(container) {
  revealDueLetterAnnotations(Date.now());
  scheduleLetterAnnotationReveal();
  var letters = (STORE.letters || []).slice().sort(function(first, second) {
    return (second.sentAt || second.createdAt || 0) - (first.sentAt || first.createdAt || 0);
  });
  var cards = letters.length ? letters.map(function(letter) {
    var visibleCount = (letter.annotations || []).filter(function(annotation) { return annotation.visible; }).length;
    var total = (letter.annotations || []).length;
    var responseLabel = visibleCount ? '已收到 ' + visibleCount + '/' + total + ' 条批注' : '等待回信';
    return '<button type="button" class="letter-card" data-letter-id="' + escapeHtml(letter.id) + '">' +
      '<div class="letter-card-title">' + escapeHtml(letter.title || '给梦角的一封信') + '</div>' +
      '<div class="letter-card-preview">' + escapeHtml(letter.content || '') + '</div>' +
      '<div class="letter-card-meta"><span>' + formatLetterTime(letter.sentAt || letter.createdAt) + '</span><span>' + responseLabel + '</span></div>' +
    '</button>';
  }).join('') : '<div class="letter-empty">还没有寄出的信</div>';

  container.innerHTML = '<div class="letters-page">' +
    '<div class="letters-toolbar"><h2>写信</h2><button type="button" class="btn-write-letter" id="btnWriteLetter">写一封信</button></div>' +
    '<div class="letters-list">' + cards + '</div>' +
  '</div>';
  container.querySelector('#btnWriteLetter')?.addEventListener('click', openLetterComposer);
  container.querySelectorAll('.letter-card').forEach(function(card) {
    card.addEventListener('click', function() { openLetterFullscreen(card.dataset.letterId); });
  });
}

function openLetterComposer() {
  state.letterFullscreenId = null;
  state.letterDraft = { title:'', content:'', createdAt:Date.now() };
  var body = document.getElementById('fsBody');
  if (body) renderLetterFullscreen(body);
}

function openLetterFullscreen(letterId) {
  if (!letterById(letterId)) return;
  state.letterDraft = null;
  state.letterFullscreenId = letterId;
  var body = document.getElementById('fsBody');
  if (body) renderLetterFullscreen(body);
}

function closeLetterFullscreen() {
  state.letterFullscreenId = null;
  state.letterDraft = null;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'letters') renderLetters(body);
}

function renderLetterReadContent(letter) {
  var annotationsBySegment = {};
  (letter.annotations || []).forEach(function(annotation) {
    if (annotation.visible) annotationsBySegment[annotation.segmentIndex] = annotation;
  });
  return (letter.segments || []).map(function(segment, index) {
    var annotation = annotationsBySegment[index];
    var annotationHtml = '';
    if (annotation) {
      annotationHtml = '<aside class="letter-annotation">' +
        '<div class="letter-annotation-text">' + escapeHtml(annotation.text) + '</div>' +
        '<div class="letter-annotation-tools"><button type="button" class="btn-ai-letter-annotation" data-letter-id="' + escapeHtml(letter.id) + '" data-annotation-id="' + escapeHtml(annotation.id) + '">解读这条批注</button></div>' +
        '<div class="ai-box" data-ai-target="letter-annotation" data-letter-id="' + escapeHtml(letter.id) + '" data-annotation-id="' + escapeHtml(annotation.id) + '"></div>' +
      '</aside>';
    }
    return '<div class="letter-segment' + (annotation ? ' has-annotation' : '') + '"><span class="letter-segment-text">' + escapeHtml(segment) + '</span></div>' + annotationHtml;
  }).join('');
}

function renderLetterFullscreen(container) {
  revealDueLetterAnnotations(Date.now());
  var draft = state.letterDraft;
  var letter = draft || letterById(state.letterFullscreenId);
  if (!letter) {
    closeLetterFullscreen();
    return;
  }
  var locked = !!letter.lockedAt;
  var cfg = STORE.config || {};
  var recipient = cfg.characterName || '梦角';
  var paper = locked
    ? '<div class="letter-to">寄给 ' + escapeHtml(recipient) + '</div><div class="letter-read-title">' + escapeHtml(letter.title || '给梦角的一封信') + '</div><div class="letter-read-body">' + renderLetterReadContent(letter) + '</div><div class="letter-meta">寄出于 ' + formatLetterTime(letter.sentAt || letter.createdAt) + '</div>'
    : '<input type="text" class="letter-title-input" id="letterTitleInput" value="' + escapeHtml(letter.title || '') + '" placeholder="信的标题" maxlength="60">' +
      '<textarea class="letter-content-input" id="letterContentInput" placeholder="想说的话…" maxlength="10000">' + escapeHtml(letter.content || '') + '</textarea>';

  container.innerHTML = '<div class="letter-fullscreen">' +
    '<div class="letter-full-head">' +
      '<button type="button" class="letter-full-btn btn-letter-full-back">‹ 返回</button>' +
      '<div class="letter-full-titlebar"><div class="letter-full-date">' + (locked ? '已寄出' : '写给 ' + escapeHtml(recipient)) + '</div><div class="letter-full-name">' + (locked ? escapeHtml(letter.title || '给梦角的一封信') : '一封新信') + '</div></div>' +
      '<div class="letter-full-actions">' + (locked ? '' : '<button type="button" class="letter-full-btn primary btn-send-letter">寄出</button>') + '</div>' +
    '</div>' +
    '<div class="letter-full-body"><article class="letter-paper">' + paper + '</article></div>' +
  '</div>';
  bindLetterFullscreenEvents(container, letter, locked);
}

function sendLetter() {
  if (!state.letterDraft || !window.LetterRules) {
    alert('写信功能还没有准备好，请重新打开页面。');
    return;
  }
  var title = (document.getElementById('letterTitleInput')?.value || '').trim() || '给梦角的一封信';
  var content = (document.getElementById('letterContentInput')?.value || '').trim();
  if (!content) {
    alert('先写下想说的话吧。');
    return;
  }
  var segments = window.LetterRules.splitLetterSegments(content);
  var cards = getVisibleCards();
  if (!cards.length) {
    alert('字卡库里没有可用字卡，先启用至少一张字卡再寄出。');
    return;
  }
  var now = Date.now();
  var annotations = window.LetterRules.selectLetterAnnotations(segments, getLetterConfig().coverage, cards, getLetterConfig().cardCount, Math.random);
  if (!annotations.length) {
    alert('这封信暂时没有可以批注的段落。');
    return;
  }
  var letter = {
    id: 'letter_' + genId(),
    title: title,
    content: content,
    segments: segments,
    annotations: window.LetterRules.scheduleLetterAnnotations(annotations, getLetterConfig().annotationDelay, now, Math.random),
    createdAt: state.letterDraft.createdAt || now,
    sentAt: now,
    lockedAt: now,
  };
  var letters = STORE.letters || [];
  letters.unshift(letter);
  STORE.letters = letters;
  state.letterDraft = null;
  state.letterFullscreenId = letter.id;
  scheduleLetterAnnotationReveal();
  var body = document.getElementById('fsBody');
  if (body) renderLetterFullscreen(body);
}

function bindLetterFullscreenEvents(container, letter, locked) {
  container.querySelector('.btn-letter-full-back')?.addEventListener('click', closeLetterFullscreen);
  if (!locked) {
    container.querySelector('.btn-send-letter')?.addEventListener('click', sendLetter);
    return;
  }
  container.querySelectorAll('.btn-ai-letter-annotation').forEach(function(button) {
    button.addEventListener('click', function() {
      if (!isAIInterpretReady()) {
        alert('请先到「设置 → AI 解读」开启功能并填写 API Key');
        return;
      }
      var annotation = (letter.annotations || []).find(function(item) { return item.id === button.dataset.annotationId; });
      if (!annotation) return;
      var box = container.querySelector('.ai-box[data-letter-id="' + button.dataset.letterId + '"][data-annotation-id="' + button.dataset.annotationId + '"]');
      if (!box) return;
      var segment = (letter.segments || [])[annotation.segmentIndex] || '';
      var targetText = '信里的片段：“' + segment + '”。梦角的批注：“' + annotation.text + '”。';
      runAIInterpretOnBox(box, {
        targetText: targetText,
        contextMessages: [],
        scene: 'letter-annotation',
        loadingText: '解读批注中',
        favoriteMeta: {
          sourceType: 'letter-annotation',
          sourceId: letter.id,
          sourceSubId: annotation.id,
          sourceLabel: '信件批注',
          text: targetText
        }
      });
    });
  });
}

// ============ Checkin (打卡) ============

function renderCheckin(container) {
  if (!state.checkinDate) {
    const d = new Date();
    state.checkinDate = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  const words = STORE.checkinWords || [];
  const cfg = STORE.config || {};

  container.innerHTML = `
  <div class="checkin-page">
    <div class="checkin-words-area">
      <div class="checkin-words-row" id="checkinWordsRow">
        ${words.map((w,i) => `
          <span class="checkin-word-chip">
            ${escapeHtml(w)}
            <span class="cw-del" data-idx="${i}" title="删除">×</span>
          </span>`).join('')}
      </div>
      <div class="checkin-word-add">
        <input type="text" id="newWordInput" placeholder="添加新词…" maxlength="12">
        <button id="btnAddWord">+ 添加</button>
      </div>
    </div>
    <div class="checkin-date-nav">
      <button class="cdn-btn" id="cdnPrev">◀</button>
      <span class="cdn-date" id="cdnDate"></span>
      <button class="cdn-btn" id="cdnNext">▶</button>
    </div>
    <div class="checkin-timeline" id="checkinRecords"></div>
    <div class="checkin-input-bar">
      <textarea id="checkinInput" rows="1" placeholder="记录此刻…" maxlength="200"></textarea>
      <button class="btn-ci" id="btnUserCheckin">✏️ 打卡</button>
    </div>
  </div>`;

  bindCheckinEvents(container);
  renderCheckinRecords();
  updateCheckinDateNav();
}

function bindCheckinEvents(container) {
  // Delete word
  container.querySelectorAll('.cw-del').forEach(btn => {
    btn.addEventListener('click', function() {
      const words = STORE.checkinWords || [];
      if (words.length <= 1) { alert('至少保留一个打卡词'); return; }
      words.splice(parseInt(this.dataset.idx), 1);
      STORE.checkinWords = words;
      renderCheckin(container);
    });
  });
  // Add word
  container.querySelector('#btnAddWord').addEventListener('click', () => {
    const inp = container.querySelector('#newWordInput');
    const v = inp.value.trim();
    if (!v) return;
    const words = STORE.checkinWords || [];
    if (words.includes(v)) { alert('该词已存在'); return; }
    words.push(v);
    STORE.checkinWords = words;
    renderCheckin(container);
  });
  container.querySelector('#newWordInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { container.querySelector('#btnAddWord').click(); }
  });
  // Date nav
  container.querySelector('#cdnPrev').addEventListener('click', () => {
    changeCheckinDate(-1);
  });
  container.querySelector('#cdnNext').addEventListener('click', () => {
    changeCheckinDate(1);
  });
  // User checkin
  container.querySelector('#btnUserCheckin').addEventListener('click', () => {
    const inp = container.querySelector('#checkinInput');
    const v = inp.value.trim();
    if (!v) return;
    addCheckin('user', v);
    inp.value = '';
    inp.focus();
  });
  // Input enter key
  container.querySelector('#checkinInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      container.querySelector('#btnUserCheckin').click();
    }
  });
}

function addCheckin(role, content, timestamp) {
  const checkins = STORE.checkins || [];
  checkins.push({
    id: genId(),
    role: role,
    content: content,
    timestamp: timestamp || Date.now(),
  });
  STORE.checkins = checkins;
  renderCheckinRecords();
}

function changeCheckinDate(offset) {
  const parts = state.checkinDate.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  d.setDate(d.getDate() + offset);
  state.checkinDate = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  updateCheckinDateNav();
  renderCheckinRecords();
}

function updateCheckinDateNav() {
  const el = document.getElementById('cdnDate');
  if (!el) return;
  const parts = state.checkinDate.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  el.textContent = d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
  // Today marker
  const today = new Date();
  const todayStr = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  if (state.checkinDate === todayStr) {
    el.textContent += ' · 今天';
  }
}

function renderCheckinRecords() {
  const area = document.getElementById('checkinRecords');
  if (!area) return;
  const checkins = STORE.checkins || [];
  const dateStr = state.checkinDate; // 'YYYY-MM-DD'
  // Filter by date
  const filtered = checkins.filter(c => {
    const d = new Date(c.timestamp);
    const ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return ds === dateStr;
  });
  // Sort newest first — latest checkin at the top
  filtered.sort((a,b) => b.timestamp - a.timestamp);

  if (filtered.length === 0) {
    area.innerHTML = '<div class="ci-empty">📌 暂无打卡记录<br><span style="font-size:11px;">在下方输入内容，记录今天吧</span></div>';
    return;
  }

  area.innerHTML = filtered.map(c => {
    const d = new Date(c.timestamp);
    const time = d.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
    const isUser = c.role === 'user';
    // 梦角 (dream) on LEFT: content then time · 我 (user) on RIGHT: time then content
    const inner = isUser
      ? `<span class="ci-time-label">${time}</span><span class="ci-content">${escapeHtml(c.content)}</span>`
      : `<span class="ci-content">${escapeHtml(c.content)}</span><span class="ci-time-label">${time}</span>`;
    return `<div class="ci-entry ${isUser?'user':'dream'}">
      <div class="ci-dot"></div>
      <div class="ci-block">${inner}</div>
    </div>`;
  }).join('');
  area.scrollTop = area.scrollHeight;
}

// ============ Checkin Auto Timer ============
function scheduleNextAutoCheckin() {
  clearTimeout(state.checkinAutoTimerId);
  state.checkinAutoTimerId = null;
  const cfg = STORE.config || {};
  if (!cfg.checkinAutoEnabled) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timing = cfg.timing || {checkin: {timeStart: 9, timeEnd: 21, intervalMin: 30, intervalMax: 120}};
  const startMinutes = (timing.checkin?.timeStart || 9) * 60;
  const endMinutes = (timing.checkin?.timeEnd || 21) * 60;

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    // Inside active window — schedule next checkin
    const delayMin = randomBetween(timing.checkin?.intervalMin || 30, timing.checkin?.intervalMax || 120);
    const delayMs = delayMin * 60000;
    state.checkinAutoTimerId = setTimeout(() => {
      const words = STORE.checkinWords || [];
      if (words.length > 0) {
        const lastWord = STORE.lastCheckinWord || null;
        var pool = words;
        if (lastWord && words.length > 1) {
          pool = words.filter(function(w) { return w !== lastWord; });
          if (pool.length === 0) pool = words;
        }
        const word = pool[Math.floor(Math.random() * pool.length)];
        STORE.lastCheckinWord = word;
        addCheckin('dream', word);
        setTimeout(updateRedDots, 300);
        // Update date to today since auto checkin is always today
        const today = new Date();
        state.checkinDate = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
      }
      scheduleNextAutoCheckin();
    }, delayMs);
  } else {
    // Outside active window — wait until next start time
    let nextStart = new Date(now);
    const timing = cfg.timing || {checkin: {timeStart: 9, timeEnd: 21, intervalMin: 30, intervalMax: 120}};
    nextStart.setHours(timing.checkin?.timeStart || 9, 0, 0, 0);
    if (currentMinutes >= endMinutes) {
      // Past today's window — schedule for tomorrow
      nextStart.setDate(nextStart.getDate() + 1);
    }
    const delayMs = nextStart.getTime() - now.getTime();
    state.checkinAutoTimerId = setTimeout(() => {
      // Update date to today on entry
      const today = new Date();
      state.checkinDate = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
      scheduleNextAutoCheckin();
    }, delayMs);
  }
}

function startCheckinAutoTimer() {
  stopCheckinAutoTimer();
  state.checkinDate = null; // reset to today on next render
  scheduleNextAutoCheckin();
}

function stopCheckinAutoTimer() {
  clearTimeout(state.checkinAutoTimerId);
  state.checkinAutoTimerId = null;
}

// ============ Review (锐评) ============
const RATING_LEVELS=[
  {stars:1,text:'拉完了',emoji:'💩'},
  {stars:2,text:'NPC',emoji:'😶'},
  {stars:3,text:'人上人',emoji:'🚀'},
  {stars:4,text:'顶级',emoji:'👑'},
  {stars:5,text:'夯',emoji:'🔥'},
];

function showReviewModal() {
  showModal(`<h3>💥 梦角锐评 - 从夯到拉</h3>
    <div class="review-modal">
      <div class="rm-hint">请描述你想被锐评的人、事、物…</div>
      <textarea class="rm-textarea" id="rmInput" placeholder="例如：我今天做的菜、某款游戏、我的新发型…" maxlength="200"></textarea>
    </div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="rmStart">开始锐评</button></div>`);

  document.getElementById('rmStart').addEventListener('click',()=>{
    const text=document.getElementById('rmInput').value.trim();
    if(!text){alert('请输入你要锐评的内容');return;}
    hideModal();
    // Check counter-question probability
    const cfg=STORE.config||{};
    const prob=(cfg.prob?.reviewCounter||20);
    if(Math.random()*100<prob){
      showCounterQuestion(text);
    } else {
      generateReview(text);
    }
  });
}

function showCounterQuestion(userInput) {
  showModal(`<div class="cq-modal">
    <div class="cq-emoji">😏</div>
    <div class="cq-text">你确定想听真话？</div>
    <div class="modal-btns" style="justify-content:center;">
      <button class="btn-cancel" onclick="hideModal()">算了不听了</button>
      <button class="btn-primary" id="cqOk">确定，说吧！</button>
    </div></div>`);

  document.getElementById('cqOk').addEventListener('click',()=>{
    hideModal();
    generateReview(userInput);
  });
}

function generateReview(userInput) {
  const cfg=STORE.config||{};
  const mode=cfg.reviewMode||'random';

  // Pick rating level
  let levelIdx;
  if(mode==='random'){
    levelIdx=Math.floor(Math.random()*5);
  } else if(mode==='harsh'){
    // Bias towards low ratings
    const weights=[40,30,15,10,5]; // 1★:40%, 2★:30%, etc.
    let r=Math.random()*100;
    for(let i=0;i<5;i++){r-=weights[i];if(r<=0){levelIdx=i;break;}}
    if(levelIdx===undefined)levelIdx=4;
  } else { // gentle
    const weights=[5,10,15,30,40];
    let r=Math.random()*100;
    for(let i=0;i<5;i++){r-=weights[i];if(r<=0){levelIdx=i;break;}}
    if(levelIdx===undefined)levelIdx=4;
  }

  const level=RATING_LEVELS[levelIdx];

  // Generate comment from word cards
  const cardCount=cfg.reviewCardCount||3;
  let comment='';
  const visible=getVisibleCards();
  if(visible.length>0){
    const picked=[];
    for(let i=0;i<cardCount;i++){const c=weightedPick(visible);if(c)picked.push(c.text);}
    comment=picked.join(' ');
  }
  if(!comment)comment='（字卡缺失，梦角词穷了）';

  // Build stars display
  const starsDisplay='★'.repeat(level.stars)+'☆'.repeat(5-level.stars);

  // Save review
  const reviews=STORE.reviews||[];
  const reviewId=Date.now();
  reviews.push({
    id:reviewId,userInput,
    rating:level.stars,ratingText:level.text,ratingEmoji:level.emoji,
    stars:level.stars,comment,timestamp:Date.now(),sharedToMoments:false
  });
  STORE.reviews=reviews;

  // Add as a special chat message
  const messages=STORE.messages||[];
  messages.push({
    id:genId(),type:'character',text:'',timestamp:Date.now(),
    review:{id:reviewId,userInput,starsDisplay,level,comment}
  });
  STORE.messages=messages;
  renderMessages();
}

function shareReviewToMoments(reviewId) {
  const reviews=STORE.reviews||[];
  const review=reviews.find(r=>r.id===reviewId);
  if(!review||review.sharedToMoments)return;
  review.sharedToMoments=true;
  STORE.reviews=reviews;

  const starsDisplay='★'.repeat(review.stars)+'☆'.repeat(5-review.stars);
  const cfg=STORE.config||{};
  const dreamName=cfg.characterName||'梦角';

  // Random template selection
  const templates=[
    `我问${dreamName}：「${review.userInput}」\n${dreamName}锐评：${starsDisplay} ${review.ratingText} ${review.ratingEmoji}\n评语：「${review.comment}」`,
    `今天鼓起勇气让${dreamName}锐评「${review.userInput}」…\n结果${dreamName}给我打了个 ${review.ratingText} ${review.ratingEmoji}，还说「${review.comment}」`,
    `锐评挑战：让${dreamName}评价「${review.userInput}」\n${dreamName}判定：${starsDisplay} ${review.ratingText} ${review.ratingEmoji}\n附加评语："${review.comment}"\n屏幕前的家人们你们觉得公正吗？🤔`,
  ];
  const content=templates[Math.floor(Math.random()*templates.length)];

  const moments=STORE.moments||[];
  moments.push({
    id:'mom_review_'+Date.now(),
    publisher:'user',
    content,
    timestamp:Date.now(),
    likes:[],comments:[],imageUrl:'',dreamProcessed:false,
  });
  STORE.moments=moments;
  // Refresh chat to update button state
  renderMessages();
  if(state.fsView==='moments')renderFeed();
  // Show confirmation
  setTimeout(()=>alert('已分享到朋友圈！'),100);
}

// ============ 语料来源：导入我的字卡库 ============
// 拼音组句的语料就是 pyCorpus() = getVisibleCards() = 你的 STORE.cards。
// 所以「换语料」=「换字卡库」，不需要另造一套语料数据。

// 库里还是不是原封不动的内置演示卡（决定导入时默认勾不勾"连演示卡一起换掉"）
function corpusIsUntouchedDemo() {
  var cards = STORE.cards || [];
  if (cards.length !== PY_DEMO_CARDS.length) return false;
  for (var i = 0; i < cards.length; i++) { if (cards[i].id !== PY_DEMO_CARDS[i].id) return false; }
  return true;
}

// 选字卡库文件（浏览器走隐藏 input，Android 走原生选择器；与工具栏「导入」同一条路）
function pickCardLibFile() {
  if (window.AndroidBridge && typeof window.AndroidBridge.pickImportFile === 'function') {
    window.__importTarget = 'cards';
    if (!window.AndroidBridge.pickImportFile()) alert('无法打开文件选择器');
    return;
  }
  var el = document.getElementById('fileImport');
  if (el) el.click(); else alert('找不到文件选择器');
}

// 导入我的字卡库：首启引导与设置页「语料」行共用这一个弹窗
function showCorpusImportModal() {
  var n = (STORE.cards || []).length, demo = corpusIsUntouchedDemo();
  showModal('<h3>导入我的字卡库</h3>'
    + '<div class="setting-row" style="font-size:12px;color:var(--text-muted);line-height:1.7;">拼音组句用的语料就是<b>你的字卡库</b>（当前 ' + n + ' 张）。整库换成你自己的，输出就是你的口音。</div>'
    + '<div class="form-row"><label>① 选 JSON 文件（本 App「导出」的产物，整体替换）</label>'
    + '<button class="btn-primary" id="mCorpusPick" style="width:auto;padding:8px 18px;">选择文件…</button></div>'
    + '<div class="form-row"><label>② 或者直接粘贴清单（每行一条）</label>'
    + '<textarea id="mCorpusText" rows="6" placeholder="吃饭了吗&#10;早点睡，别熬夜&#10;想你了"></textarea></div>'
    + '<div class="form-row" style="font-size:12px;"><label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="mCorpusReplace" ' + (demo ? 'checked' : '') + ' style="width:auto;"> 粘贴导入时，连现在的卡一起替换掉</label></div>'
    + '<div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button>'
    + '<button class="btn-primary" id="mCorpusOk">粘贴导入</button></div>');
  var pick = document.getElementById('mCorpusPick');
  if (pick) pick.addEventListener('click', function () { pickCardLibFile(); });
  var ok = document.getElementById('mCorpusOk');
  if (ok) ok.addEventListener('click', function () { applyCorpusTextImport(); });
}

// 粘贴式导入：每行一条，落进自动建好的「我的字卡 / 语料」小类（不用先手工建分类）
function applyCorpusTextImport() {
  var ta = document.getElementById('mCorpusText');
  var lines = (ta ? String(ta.value || '') : '').split(/[\n\r]+/).map(function (s) { return s.trim(); }).filter(function (s) { return !!s; });
  if (!lines.length) { alert('请先粘贴要导入的内容（每行一条）'); return; }
  var cb = document.getElementById('mCorpusReplace');
  var replace = !!(cb && cb.checked);
  var keepTa = replace ? taFavExtractSubtree() : null;      // 口径⑫：替换也不动「TA 收下的话」
  var cats = replace ? [] : (STORE.categories || []).slice();
  var subs = replace ? [] : (STORE.subcategories || []).slice();
  var catId = 'mycards', subId = 'mycorpus';
  var has = function (arr, id) { for (var q = 0; q < arr.length; q++) { if (arr[q].id === id) return true; } return false; };
  if (!has(cats, catId)) cats.push({ id: catId, name: '我的字卡', hidden: false });
  if (!has(subs, subId)) subs.push({ id: subId, name: '语料', categoryId: catId, hidden: false });
  var cards = replace ? [] : (STORE.cards || []).slice();
  var seen = Object.create(null), i;
  for (i = 0; i < cards.length; i++) seen[String(cards[i].text || '').trim().toLowerCase()] = 1;
  var added = 0, skipped = 0;
  for (i = 0; i < lines.length; i++) {
    var k = lines[i].toLowerCase();
    if (seen[k]) { skipped++; continue; }
    seen[k] = 1;
    cards.push({ id: genId(), text: lines[i], categoryId: catId, subcategoryId: subId, weight: 1 });
    added++;
  }
  STORE.categories = cats; STORE.subcategories = subs; STORE.cards = cards;
  if (replace && keepTa) { taFavMergeSubtree(keepTa); pruneTaFavs(); }
  pyInvalidate();                       // 语料变了：立刻重建模型，不等下一次生成
  hideModal();
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'cards') renderCardManager(body);
  // 设置页开着就顺手重渲染：那行「语料：当前 N 卡」不能还停在导入前的数量
  if (body && state.fsView === 'settings') renderSettings(body);
  showToast('语料已更新：' + (STORE.cards || []).length + ' 卡' + (skipped ? '（跳过重复 ' + skipped + ' 条）' : ''));
}

// 真·首启才问：语料从哪来（_corpusSeededThisRun 只在 initDefaults 播种那一次为真）
function showCorpusOnboard() {
  showModal('<h3>先说一句：语料从哪来</h3>'
    + '<div class="setting-row" style="font-size:13px;line-height:1.8;">这个站里的 TA 说话，用的是<b>你自己的字卡库</b>当语料。<br>'
    + '现在库里是内置的演示卡（' + (STORE.cards || []).length + ' 张）。先用它看看效果，还是现在就把你自己的导进来？</div>'
    + '<div class="modal-btns"><button class="btn-cancel" id="mOnbLater">先看看演示卡</button>'
    + '<button class="btn-primary" id="mOnbImport">导入我自己的</button></div>');
  var a = document.getElementById('mOnbLater'), b = document.getElementById('mOnbImport');
  if (a) a.addEventListener('click', hideModal);
  if (b) b.addEventListener('click', function () { showCorpusImportModal(); });
}

// ============ Modals ============
function showModal(html){document.getElementById('modalBox').innerHTML=html;document.getElementById('modalOverlay').classList.add('show');}
function hideModal(){document.getElementById('modalOverlay').classList.remove('show');}

function showAddCardModal() {
  const cats=STORE.categories||[],subs=STORE.subcategories||[];
  let curCat=state.selectedCatId||(cats[0]?cats[0].id:'');
  function subOpts(catId){return subs.filter(s=>s.categoryId===catId).map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');}

  showModal(`<h3>添加字卡</h3>
    <div class="form-row"><label>字卡内容</label><input type="text" id="mText" placeholder="输入字卡文字…" maxlength="200"></div>
    <div class="form-row"><label>所属大类</label><select id="mCat">${cats.map(c=>`<option value="${c.id}" ${c.id===curCat?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
    <div class="form-row"><label>所属小类</label><select id="mSub">${subOpts(curCat)}</select></div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="mOk">确认添加</button></div>`);

  document.getElementById('mCat').addEventListener('change',function(){document.getElementById('mSub').innerHTML=subOpts(this.value);});
  document.getElementById('mOk').addEventListener('click',()=>{
    const text=document.getElementById('mText').value.trim();
    if(!text){alert('请输入字卡内容');return;}
    const catId=document.getElementById('mCat').value,subId=document.getElementById('mSub').value;
    if(!catId||!subId){alert('请选择大类和小类');return;}
    const cards=STORE.cards||[];
    if(cards.find(c=>c.text.trim().toLowerCase()===text.toLowerCase())){alert(`重复字卡：${text}，已跳过`);return;}
    cards.push({id:genId(),text,categoryId:catId,subcategoryId:subId,weight:1});STORE.cards=cards;
    hideModal(); renderCardItems();
  });
}

function showEditCardModal(cardId) {
  const cards=STORE.cards||[],card=cards.find(c=>c.id===cardId); if(!card)return;
  const cats=STORE.categories||[],subs=STORE.subcategories||[];
  function subOpts(catId){return subs.filter(s=>s.categoryId===catId).map(s=>`<option value="${s.id}" ${s.id===card.subcategoryId?'selected':''}>${escapeHtml(s.name)}</option>`).join('');}

  showModal(`<h3>编辑字卡</h3>
    <div class="form-row"><label>字卡内容</label><input type="text" id="mText" value="${escapeHtml(card.text)}" maxlength="200"></div>
    <div class="form-row"><label>所属大类</label><select id="mCat">${cats.map(c=>`<option value="${c.id}" ${c.id===card.categoryId?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
    <div class="form-row"><label>所属小类</label><select id="mSub">${subOpts(card.categoryId)}</select></div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="mOk">保存修改</button></div>`);

  document.getElementById('mCat').addEventListener('change',function(){document.getElementById('mSub').innerHTML=subOpts(this.value);});
  document.getElementById('mOk').addEventListener('click',()=>{
    const text=document.getElementById('mText').value.trim();
    if(!text){alert('请输入字卡内容');return;}
    const catId=document.getElementById('mCat').value,subId=document.getElementById('mSub').value;
    if(!catId||!subId){alert('请选择大类和小类');return;}
    // Re-read from localStorage for dedup check, then find card in that same array
    const allCards=STORE.cards||[];
    const target=allCards.find(c=>c.id===cardId);
    if(!target)return;
    if(allCards.find(c=>c.id!==cardId&&c.text.trim().toLowerCase()===text.toLowerCase())){alert(`重复字卡：${text}，已跳过`);return;}
    target.text=text; target.categoryId=catId; target.subcategoryId=subId;
    STORE.cards=allCards; hideModal(); renderCardItems();
  });
}

function showBatchImportModal() {
  const cats=STORE.categories||[],subs=STORE.subcategories||[];
  let curCat=state.selectedCatId||(cats[0]?cats[0].id:'');
  function subOpts(catId){return subs.filter(s=>s.categoryId===catId).map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');}

  showModal(`<h3>批量导入字卡</h3>
    <div class="form-row"><label>每行一条字卡</label><textarea id="mBatchText" rows="8" placeholder="加油！&#10;冲啊！&#10;永不放弃！"></textarea></div>
    <div class="form-row"><label>所属大类</label><select id="mBatchCat">${cats.map(c=>`<option value="${c.id}" ${c.id===curCat?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
    <div class="form-row"><label>所属小类</label><select id="mBatchSub">${subOpts(curCat)}</select></div>
    <div class="modal-btns"><button class="btn-cancel" onclick="hideModal()">取消</button><button class="btn-primary" id="mBatchOk">确认导入</button></div>`);

  document.getElementById('mBatchCat').addEventListener('change',function(){document.getElementById('mBatchSub').innerHTML=subOpts(this.value);});
  document.getElementById('mBatchOk').addEventListener('click',()=>{
    const raw=document.getElementById('mBatchText').value.trim();
    if(!raw){alert('请输入字卡内容');return;}
    const catId=document.getElementById('mBatchCat').value,subId=document.getElementById('mBatchSub').value;
    if(!catId||!subId){alert('请选择大类和小类');return;}
    const lines=raw.split(/[\n\r]+/).map(l=>l.trim()).filter(l=>l);
    const cards=STORE.cards||[], existing=new Set(cards.map(c=>c.text.trim().toLowerCase()));
    let added=0; const skipped=[];
    lines.forEach(line=>{
      if(existing.has(line.toLowerCase())){skipped.push(line);}
      else{cards.push({id:genId(),text:line,categoryId:catId,subcategoryId:subId,weight:1});existing.add(line.toLowerCase());added++;}
    });
    STORE.cards=cards; hideModal();
    if(skipped.length>0)alert(`导入完成：新增 ${added} 条，跳过重复 ${skipped.length} 条\n重复：${skipped.slice(0,5).join('、')}${skipped.length>5?'…':''}`);
    else alert(`导入完成：新增 ${added} 条`);
    renderCardItems();
  });
}

// ============ Export / Import ============
function exportData() {
  const data={categories:STORE.categories,subcategories:STORE.subcategories,cards:STORE.cards,exportedAt:new Date().toISOString()};
  const filename='梦角字卡库_'+new Date().toISOString().slice(0,10)+'.json';
  const json=JSON.stringify(data,null,2);
  // Android WebView：走原生导出通道（与全量导出一致）
  if (window.AndroidBridge && typeof window.AndroidBridge.exportReady === 'function') {
    try {
      window.__exportData = json;
      var ok = window.AndroidBridge.exportReady(filename);
      if (ok) showToast('✅ 请选择保存位置');
      else { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    } catch (e) { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    return;
  }
  // 浏览器：直接下载
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

// 字卡库导入核心逻辑（浏览器 FileReader 与 Android 原生分块共用）
function applyCardImport(text) {
  try {
    const data=JSON.parse(text);
    if(!data.categories||!data.cards){alert('导入失败：JSON格式不正确');return;}
    // 口径⑫：「TA 收下的话」整个子树（大类 + 小类 + 里面的卡）不随导入被替换掉 ——
    // 导入是整体替换，所以先摘出来，替换后按 id + text 去重再并回。
    const keepTa=taFavExtractSubtree();
    if(!confirm(`即将替换现有字卡数据：\n- ${data.categories.length} 个大类\n- ${(data.subcategories||[]).length} 个小类\n- ${data.cards.length} 条字卡\n\n确定替换吗？`))return;
    STORE.categories=data.categories;STORE.subcategories=data.subcategories||[];STORE.cards=data.cards;
    taFavMergeSubtree(keepTa);
    pruneTaFavs();
    state.selectedCatId=null;state.selectedSubId=null; renderHeader();
    const body=document.getElementById('fsBody');
    if(body&&state.fsView==='cards')renderCardManager(body);
    alert('导入成功！');
  }catch(err){alert('导入失败：无法解析JSON文件');}
}

function importData(file) {
  const r=new FileReader();
  r.onerror=function(){alert('导入失败：无法读取所选文件，请重新选择');};
  r.onload=function(e){applyCardImport((e.target && e.target.result) || '');};
  r.readAsText(file);
}

function exportAllData() {
  var data = {
    categories: STORE.categories,
    subcategories: STORE.subcategories,
    cards: STORE.cards,
    config: STORE.config,
    messages: STORE.messages,
    moments: STORE.moments,
    likedMoments: STORE.likedMoments,
    diaries: STORE.diaries,
    letters: STORE.letters,
    shadows: STORE.shadows,
    links: STORE.links,
    linkTags: STORE.linkTags,
    taFavs: STORE.taFavs,
    reviews: STORE.reviews,
    checkins: STORE.checkins,
    checkinWords: STORE.checkinWords,
    dreamEvents: STORE.dreamEvents,
    lastSeen: STORE.lastSeen,
    lastActive: STORE.lastActive,
    savedMessages: STORE.savedMessages,
    periods: STORE.periods,
    periodConfig: STORE.periodConfig,
    exports: STORE.exports,
    memory_library: STORE._read('memory_library'),
    mcard_dream_nonces: STORE._read('mcard_dream_nonces'),
    songCache: STORE.songCache,
    exportedAt: new Date().toISOString()
  };
  var filename = 'mengjiao-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  var json = JSON.stringify(data, null, 2);
  // Android WebView：JSON 存入全局变量，由原生端用 evaluateJavascript 分块拉取写入，
  // 彻底绕开 JS→Java 桥传大字符串（该通道会把大数据传丢导致 0 字节文件）
  if (window.AndroidBridge && typeof window.AndroidBridge.exportReady === 'function') {
    try {
      window.__exportData = json;
      var ok = window.AndroidBridge.exportReady(filename);
      if (ok) showToast('✅ 请选择保存位置');
      else { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    } catch (e) { delete window.__exportData; showToast('❌ 导出失败，请重试'); }
    return;
  }
  // 浏览器：直接下载
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入核心逻辑：解析并应用备份文本（浏览器 FileReader 与 Android 原生分块共用）
function applyImportData(text) {
  if (!text || !text.trim()) {
    alert('导入失败：文件内容为空，可能读取文件失败');
    return;
  }
  try {
    var data = JSON.parse(text);
    var types = [];
    if (data.categories) types.push('大类');
    if (data.subcategories) types.push('小类');
    if (data.cards) types.push('字卡');
    if (data.config) types.push('设置');
    if (data.messages) types.push('聊天记录');
    if (data.moments) types.push('朋友圈');
    if (data.diaries) types.push('日记');
    if (data.letters) types.push('信件');
    if (data.shadows) types.push('碎影');
    if (data.links) types.push('连结簿');
    if (data.taFavs) types.push('TA 的收藏');
    if (data.reviews) types.push('锐评');
    if (data.checkins) types.push('打卡');
    if (data.memory_library) types.push('记忆库');
    if (!confirm('即将导入以下数据：\n' + types.join('、') + '\n\n确定替换吗？')) return;
    if (data.categories) STORE.categories = data.categories;
    if (data.subcategories) STORE.subcategories = data.subcategories;
    if (data.cards) STORE.cards = data.cards;
    if (data.config) STORE.config = data.config;
    applyChatVisual();   // 导入备份后立刻套用背景/光晕（不补这行，「导入后背景不生效」就是 bug）
    if (data.messages) STORE.messages = data.messages;
    if (data.moments) STORE.moments = data.moments;
    if (data.likedMoments) STORE.likedMoments = data.likedMoments;
    if (data.diaries) STORE.diaries = data.diaries;
    if (data.letters) STORE.letters = data.letters;
    if (data.shadows) STORE.shadows = data.shadows;
    if (data.links) STORE.links = data.links;
    if (data.linkTags) STORE.linkTags = data.linkTags;
    if (data.taFavs) STORE.taFavs = data.taFavs;
    if (data.cards) pruneTaFavs();   // 备份里的收藏记录若在卡片里找不到，直接当孤儿清掉
    if (data.reviews) STORE.reviews = data.reviews;
    if (data.checkins) STORE.checkins = data.checkins;
    if (data.checkinWords) STORE.checkinWords = data.checkinWords;
    if (data.dreamEvents) STORE.dreamEvents = data.dreamEvents;
    if (data.lastSeen) STORE.lastSeen = data.lastSeen;
    if (data.lastActive) STORE.lastActive = data.lastActive;
    if (data.savedMessages) STORE.savedMessages = data.savedMessages;
    if (data.periods) STORE.periods = data.periods;
    if (data.periodConfig) STORE.periodConfig = data.periodConfig;
    if (data.exports) STORE.exports = data.exports;
    if (data.memory_library) STORE._write('memory_library', data.memory_library);
    if (data.mcard_dream_nonces) STORE._write('mcard_dream_nonces', data.mcard_dream_nonces);
    if (data.songCache) STORE.songCache = data.songCache;
    state.selectedCatId = null;
    state.selectedSubId = null;
    state.decayRounds = {};
    state.pendingReactionTimers = {};
    state.pendingCommentTimers = {};
    stopAllDreamEventTimers();
    renderHeader();
    renderMessages();
    var body = document.getElementById('fsBody');
    if (body && state.fsView === 'cards') renderCardManager(body);
    if (body && state.fsView === 'settings') renderSettings(body);
    if (body && state.fsView === 'moments') renderMoments(body);
    if (body && state.fsView === 'diary') renderDiary(body);
    if (body && state.fsView === 'checkin') renderCheckin(body);
    if (body && state.fsView === 'letters') renderLetters(body);
    if (body && state.fsView === 'links') renderLinks(body);
    scheduleTodayEvents();
    updateRedDots();
    alert('导入成功！请刷新页面。');
    location.reload();
  } catch (err) { alert('导入失败：无法解析JSON文件\n' + ((err && err.message) ? err.message : '')); }
}

function importAllData(file) {
  var r = new FileReader();
  r.onerror = function() { alert('导入失败：无法读取所选文件，请重新选择'); };
  r.onload = function(e) { applyImportData((e.target && e.target.result) || ''); };
  r.readAsText(file);
}

// Android 原生导入：原生端分块回传内容（按 __importTarget 分发到字卡库或全量导入）
var __importBuf = '';
var __importTarget = 'all';
window.__importChunk = function(chunk) { if (chunk) __importBuf += chunk; };
window.__importChunksDone = function() {
  var t = __importBuf; __importBuf = '';
  if (window.__importTarget === 'cards') { window.__importTarget = 'all'; applyCardImport(t); }
  else { window.__importTarget = 'all'; applyImportData(t); }
};
window.__importFailed = function(msg) { alert('导入失败：' + (msg || '无法读取所选文件')); };

// ============ Period Tracker ============
function parseLocalDate(str) {
  const parts = str.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}
function formatDateStr(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

const PERIOD_MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getPeriodCalendarDotDays() {
  const periods = STORE.periods || [];
  const cfg = STORE.periodConfig || {};
  const cycleLen = cfg.cycleLength || 28;
  const dur = cfg.periodDuration || 5;
  const dots = { period: new Set(), ovulation: new Set(), fertile: new Set() };

  // Mark recorded periods
  periods.forEach(p => {
    const start = parseLocalDate(p.startDate);
    for (let i = 0; i < p.duration; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dots.period.add(formatDateStr(d));
    }
  });

  if (periods.length > 0) {
    // Predict from the most recent period
    const last = periods.reduce((a, b) => a.startDate > b.startDate ? a : b);
    const lastStart = parseLocalDate(last.startDate);
    for (let offset = 1; offset <= 6; offset++) {
      const futureStart = new Date(lastStart);
      futureStart.setDate(futureStart.getDate() + offset * cycleLen);
      const hasRecorded = periods.some(p => Math.abs(parseLocalDate(p.startDate) - futureStart) < 3 * 86400000);
      if (!hasRecorded) {
        for (let i = 0; i < dur; i++) {
          const d = new Date(futureStart);
          d.setDate(d.getDate() + i);
          dots.period.add(formatDateStr(d));
        }
        // Ovulation: cycleLength - 14 days before next period
        const ovDay = new Date(futureStart);
        ovDay.setDate(ovDay.getDate() - 14);
        dots.ovulation.add(formatDateStr(ovDay));
        // Fertile window: 5 days before ovulation + ovulation day
        for (let i = -4; i <= 1; i++) {
          const fd = new Date(ovDay);
          fd.setDate(fd.getDate() + i);
          dots.fertile.add(formatDateStr(fd));
        }
      }
    }
    // Also calculate past ovulation/fertile for display context
    for (let offset = 0; offset >= -6; offset--) {
      const pastStart = new Date(lastStart);
      pastStart.setDate(pastStart.getDate() + offset * cycleLen);
      const ovDay = new Date(pastStart);
      ovDay.setDate(ovDay.getDate() - 14);
      dots.ovulation.add(formatDateStr(ovDay));
      for (let i = -4; i <= 1; i++) {
        const fd = new Date(ovDay);
        fd.setDate(fd.getDate() + i);
        dots.fertile.add(formatDateStr(fd));
      }
    }
  }

  return dots;
}

function getNextPredictedPeriod() {
  const periods = STORE.periods || [];
  if (periods.length === 0) return null;
  const cfg = STORE.periodConfig || {};
  const cycleLen = cfg.cycleLength || 28;
  const last = periods.reduce((a, b) => a.startDate > b.startDate ? a : b);
  const lastStart = parseLocalDate(last.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find the next predicted period after today
  for (let offset = 0; offset <= 3; offset++) {
    const predicted = new Date(lastStart);
    predicted.setDate(predicted.getDate() + offset * cycleLen);
    if (predicted >= today) {
      // Check if already recorded
      const ps = formatDateStr(predicted);
      const alreadyRecorded = periods.some(p => p.startDate === ps);
      if (!alreadyRecorded) return predicted;
    }
  }
  return null;
}

function updatePeriodReminder() {
  const el = document.getElementById('ctPeriodReminder');
  if (!el) return;
  const next = getNextPredictedPeriod();
  if (!next) { el.classList.remove('show'); return; }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((next - today) / 86400000);
  if (diffDays >= 1 && diffDays <= 3) {
    el.textContent = '距离经期还有' + diffDays + '天';
    el.classList.add('show');
  } else {
    el.classList.remove('show');
  }
}

function renderPeriodTracker(container) {
  const periods = STORE.periods || [];
  const cfg = STORE.periodConfig || {};
  const today = formatDateStr(new Date());
  const displayMonth = new Date();

  container.innerHTML = ''
    + '<div class="period-form-area">'
    + '  <div class="period-form-row">'
    + '    <label>上次经期</label>'
    + '    <input type="date" id="periodStartDate" value="' + today + '">'
    + '    <label>持续</label>'
    + '    <select id="periodDuration">'
    + '      <option value="3"' + ((cfg.periodDuration === 3) ? ' selected' : '') + '>3天</option>'
    + '      <option value="4"' + ((cfg.periodDuration === 4) ? ' selected' : '') + '>4天</option>'
    + '      <option value="5"' + ((cfg.periodDuration === 5) ? ' selected' : '') + '>5天</option>'
    + '      <option value="6"' + ((cfg.periodDuration === 6) ? ' selected' : '') + '>6天</option>'
    + '      <option value="7"' + ((cfg.periodDuration === 7) ? ' selected' : '') + '>7天</option>'
    + '    </select>'
    + '    <label>周期</label>'
    + '    <select id="periodCycleLen">'
    + '      <option value="21"' + ((cfg.cycleLength === 21) ? ' selected' : '') + '>21天</option>'
    + '      <option value="24"' + ((cfg.cycleLength === 24) ? ' selected' : '') + '>24天</option>'
    + '      <option value="26"' + ((cfg.cycleLength === 26) ? ' selected' : '') + '>26天</option>'
    + '      <option value="28"' + ((cfg.cycleLength === 28) ? ' selected' : '') + '>28天</option>'
    + '      <option value="30"' + ((cfg.cycleLength === 30) ? ' selected' : '') + '>30天</option>'
    + '      <option value="32"' + ((cfg.cycleLength === 32) ? ' selected' : '') + '>32天</option>'
    + '      <option value="35"' + ((cfg.cycleLength === 35) ? ' selected' : '') + '>35天</option>'
    + '    </select>'
    + '  </div>'
    + '  <button class="btn-period-add" id="btnPeriodAdd">＋ 记录经期</button>'
    + '</div>'
    + '<div class="period-calendar-area" id="periodCalendarArea"></div>'
    + '<div class="period-history-area" id="periodHistoryArea"></div>';

  bindPeriodTrackerEvents(container);
  renderPeriodCalendar(container, displayMonth);
  renderPeriodHistory(container);
}

function bindPeriodTrackerEvents(container) {
  container.querySelector('#btnPeriodAdd').addEventListener('click', function () {
    const start = container.querySelector('#periodStartDate').value;
    const dur = parseInt(container.querySelector('#periodDuration').value, 10);
    const cycle = parseInt(container.querySelector('#periodCycleLen').value, 10);
    if (!start) return;
    // Update config
    const cfg = STORE.periodConfig || {};
    cfg.cycleLength = cycle;
    cfg.periodDuration = dur;
    STORE.periodConfig = cfg;
    // Add period
    addPeriodEntry(start, dur);
    // Re-render
    renderPeriodCalendarFull(container);
    renderPeriodHistory(container);
    updatePeriodReminder();
  });
}

function addPeriodEntry(startDate, duration) {
  const periods = STORE.periods || [];
  // Deduplicate: skip if within 2 days of existing
  const start = parseLocalDate(startDate);
  const exists = periods.some(p => Math.abs(parseLocalDate(p.startDate) - start) < 2 * 86400000);
  if (exists) { alert('此日期附近已有经期记录'); return; }
  periods.push({
    id: 'pd_' + Date.now(),
    startDate: formatDateStr(start),
    duration: duration
  });
  periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
  STORE.periods = periods;
}

function editPeriodEntry(id, newStart, newDur) {
  const periods = STORE.periods || [];
  const entry = periods.find(p => p.id === id);
  if (!entry) return;
  entry.startDate = newStart;
  entry.duration = newDur;
  periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
  STORE.periods = periods;
}

function deletePeriodEntry(id) {
  const periods = STORE.periods || [];
  STORE.periods = periods.filter(p => p.id !== id);
}

function renderPeriodCalendar(container, displayMonth) {
  const area = container.querySelector('#periodCalendarArea');
  if (!area) return;
  const dots = getPeriodCalendarDotDays();
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  area.innerHTML = ''
    + '<span class="dt-month" style="display:block;text-align:center;padding:4px 0 8px;">' + year + '年 ' + PERIOD_MONTHS[month] + '</span>'
    + '<div class="calendar-grid" id="periodCalendarGrid"></div>'
    + '<div class="period-cal-legend">'
    + '  <span><span class="period-legend-dot pd"></span>经期</span>'
    + '  <span><span class="period-legend-dot ov"></span>排卵日</span>'
    + '  <span><span class="period-legend-dot ft"></span>易孕期</span>'
    + '</div>';

  // Store displayMonth as ISO string for swipe handler access
  area.dataset.displayMonth = displayMonth.toISOString();

  // Render week headers + calendar grid
  const grid = area.querySelector('#periodCalendarGrid');
  const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  let gridHTML = weekHeaders.map(h => '<div class="cg-hdr">' + h + '</div>').join('');
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  const today = formatDateStr(new Date());

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const ds = formatDateStr(date);
    const isOtherMonth = date.getMonth() !== month;
    const isToday = ds === today;
    let cls = 'cg-day';
    if (isOtherMonth) cls += ' outside';
    if (isToday) cls += ' today';
    if (dots.period.has(ds)) cls += ' pd-dot';
    else if (dots.ovulation.has(ds)) cls += ' ov-dot';
    else if (dots.fertile.has(ds)) cls += ' ft-dot';
    gridHTML += '<div class="' + cls + '">' + date.getDate() + '</div>';
  }
  grid.innerHTML = gridHTML;

  // Add dot styles for the period calendar (once)
  if (!document.getElementById('period-dot-styles')) {
    const style = document.createElement('style');
    style.id = 'period-dot-styles';
    style.textContent = '.cg-day.pd-dot{background:var(--brand-green)!important;color:#fff!important;font-weight:600} .cg-day.ov-dot{background:var(--brand-orange)!important;color:#fff!important;font-weight:600} .cg-day.ft-dot{background:#FDBF5C!important;color:#fff!important}';
    document.head.appendChild(style);
  }

  // Swipe to change month
  addCalendarSwipe(grid, function (dir) {
    const stored = new Date(area.dataset.displayMonth);
    if (isNaN(stored.getTime())) return;
    stored.setMonth(stored.getMonth() + (dir === 'prev' ? -1 : 1));
    renderPeriodCalendar(container, stored);
  });
}

function renderPeriodCalendarFull(container) {
  const displayMonth = new Date();
  renderPeriodCalendar(container, displayMonth);
}

function renderPeriodHistory(container) {
  const area = container.querySelector('#periodHistoryArea');
  if (!area) return;
  const periods = STORE.periods || [];
  if (periods.length === 0) {
    area.innerHTML = '<div class="period-empty">暂无经期记录，添加第一条开始追踪吧～</div>';
    return;
  }
  area.innerHTML = periods.map(p => {
    const start = parseLocalDate(p.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + p.duration - 1);
    const startStr = start.getFullYear() + '/' + (start.getMonth() + 1) + '/' + start.getDate();
    const endStr = end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate();
    return '<div class="period-entry">'
      + '<div class="pe-info">'
      + '  <div class="pe-date">' + startStr + ' – ' + endStr + '</div>'
      + '  <div class="pe-detail">持续 ' + p.duration + ' 天</div>'
      + '</div>'
      + '<div class="pe-actions">'
      + '  <button class="pe-edit-btn" data-pid="' + p.id + '">✏️</button>'
      + '  <button class="pe-del-btn" data-pid="' + p.id + '">🗑️</button>'
      + '</div></div>';
  }).join('');

  // Bind edit/delete buttons
  area.querySelectorAll('.pe-edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const pid = this.dataset.pid;
      const periods = STORE.periods || [];
      const entry = periods.find(p => p.id === pid);
      if (!entry) return;
      const ns = prompt('修改经期开始日期 (YYYY-MM-DD)：', entry.startDate);
      if (!ns) return;
      const nd = prompt('修改持续时间（天数）：', entry.duration);
      if (!nd) return;
      const ndNum = parseInt(nd, 10);
      if (isNaN(ndNum) || ndNum < 1 || ndNum > 14) { alert('请输入1~14之间的天数'); return; }
      editPeriodEntry(pid, ns.trim(), ndNum);
      renderPeriodHistory(container);
      renderPeriodCalendarFull(container);
      updatePeriodReminder();
    });
  });
  area.querySelectorAll('.pe-del-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (!confirm('确定删除这条经期记录吗？')) return;
      deletePeriodEntry(this.dataset.pid);
      renderPeriodHistory(container);
      renderPeriodCalendarFull(container);
      updatePeriodReminder();
    });
  });
}

// ============ Message Toast ============
var _toastTimer = null;

function showMessageToast(text) {
  var toast = document.getElementById('msgToast');
  if (!toast) return;
  clearTimeout(_toastTimer);
  var cfg = STORE.config || {};
  var name = cfg.characterName || '梦角';
  var avUrl = cfg.avatarUrl || '';
  var avatarHtml = avUrl
    ? '<img src="' + escapeAttr(avUrl) + '" alt="">'
    : '<span>' + escapeHtml(name.slice(0, 1)) + '</span>';
  toast.innerHTML =
    '<div class="toast-inner">' +
      '<div class="toast-avatar">' + avatarHtml + '</div>' +
      '<div class="toast-text">' + escapeHtml(text) + '</div>' +
    '</div>';
  toast.classList.add('show');
  _toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 6000);
}

function returnToChat() {
  var toast = document.getElementById('msgToast');
  if (toast) toast.classList.remove('show');
  clearTimeout(_toastTimer);
  if (state.fsOpen) closeFullscreen();
  if (state.panelOpen) closePanel();
}

// ============ Sticker Panel ============
function openStickerPanel() {
  document.getElementById('stickerPanel').classList.add('open');
  document.getElementById('stickerOverlay').classList.add('show');
  renderStickerGrid();
}

function closeStickerPanel() {
  document.getElementById('stickerPanel').classList.remove('open');
  document.getElementById('stickerOverlay').classList.remove('show');
}

function sendSticker(dataUrl) {
  addMessage('user', '', Date.now(), dataUrl);
  closeStickerPanel();
  scheduleIndicators(); triggerPassiveReply();
}

function deleteSticker(id) {
  if (!confirm('确定删除这个表情吗？')) return;
  var stickers = STORE.stickers || [];
  STORE.stickers = stickers.filter(function(s) { return s.id !== id; });
  renderStickerGrid();
}

function persistStickers(stickers) {
  return STORE._write('mcard_stickers', stickers);
}

function renderStickerGrid() {
  var grid = document.getElementById('stickerGrid');
  if (!grid) return;
  var stickers = STORE.stickers || [];
  if (stickers.length === 0) {
    grid.innerHTML = '<div class="sticker-empty">暂无表情，点击上方按钮添加</div>';
    return;
  }
  grid.innerHTML = stickers.map(function(s) {
    return '<div class="sticker-item" onclick="sendSticker(\'' + s.dataUrl.replace(/'/g,"\\'") + '\')">'
      + '<img src="' + s.dataUrl + '" alt="表情" loading="lazy">'
      + '<button class="sticker-del" onclick="event.stopPropagation();deleteSticker(\'' + s.id + '\')">✕</button>'
      + '</div>';
  }).join('');
}

function addStickersFromFiles(files) {
  var selected = Array.from(files || []);
  if (!selected.length) return;
  var pending = selected.map(function(f) {
    return compressImage(f, 280, 0.6).then(function(dataUrl) {
      return { dataUrl: dataUrl };
    }, function(error) {
      return { error: error };
    });
  });
  Promise.all(pending).then(function(results) {
    var imageData = results.filter(function(result) { return result.dataUrl; });
    if (!imageData.length) {
      alert('图片没有读取成功，请换一张常见格式的图片再试。');
      return;
    }
    var stickers = STORE.stickers || [];
    var now = Date.now();
    imageData.forEach(function(result, index) {
      stickers.push({ id: 'stk_' + now + '_' + index, dataUrl: result.dataUrl, addedAt: now });
    });
    if (!persistStickers(stickers)) {
      alert('表情没有保存成功，可能是本地存储空间不足。请先到设置清理旧图片或数据后再试。');
      return;
    }
    renderStickerGrid();
    var failed = results.length - imageData.length;
    if (failed) alert('有 ' + failed + ' 张图片没有读取成功，其余表情已添加。');
  }).catch(function(e) { console.error('表情压缩失败:', e); alert('表情添加失败，请重试'); });
}

// ============ Search ============
function openSearch() {
  document.getElementById('searchModal').classList.add('show');
  var inp = document.getElementById('searchInput');
  inp.value = ''; inp.focus();
  document.getElementById('searchResults').innerHTML = '<div class="search-empty">输入关键词搜索聊天记录</div>';
}

function closeSearch() {
  document.getElementById('searchModal').classList.remove('show');
}

function performSearch(query) {
  var area = document.getElementById('searchResults');
  if (!query) { area.innerHTML = '<div class="search-empty">输入关键词搜索聊天记录</div>'; return; }
  var q = query.toLowerCase();
  var messages = STORE.messages || [];
  var av = getAvatarHTML();
  var results = [];
  for (var i = messages.length - 1; i >= 0; i--) {
    var m = messages[i];
    var text = m.text || '';
    if (m.doodle) text = '[涂鸦]';
    if (m.review) text = '[锐评] ' + (m.review.comment||'');
    if (m.recall && m.recall.executed) text = '[消息已撤回]';
    if (!text || text.toLowerCase().indexOf(q) === -1) continue;
    results.push(m);
  }
  if (results.length === 0) {
    area.innerHTML = '<div class="search-empty">没有找到包含 "' + escapeHtml(query) + '" 的消息</div>';
    return;
  }
  var html = '<div class="search-hit-count">共找到 ' + results.length + ' 条</div>';
  results.forEach(function(m) {
    var d = new Date(m.timestamp);
    var dateStr = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日 ' +
      d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    var isUser = m.type === 'user';
    var text = m.text || '';
    if (m.doodle) text = '[涂鸦]';
    if (m.review) text = '[锐评] ' + (m.review.comment||'');
    if (m.recall && m.recall.executed) text = '[消息已撤回]';
    // Highlight keyword
    var display = escapeHtml(text).replace(new RegExp('(' + escapeRegex(query) + ')', 'gi'), '<span class="sr-highlight">$1</span>');
    html += '<div class="sr-item">'
      + '<div class="sr-avatar">' + (isUser ? av.user : av.char) + '</div>'
      + '<div class="sr-body"><div class="sr-text">' + display + '</div>'
      + '<div class="sr-time">' + dateStr + '</div></div></div>';
  });
  area.innerHTML = html;
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

var _viewportSyncFrame = null;

function revealFocusedDiaryEditor() {
  var active = document.activeElement;
  if (!active || !active.matches('input, textarea') || !active.closest('.diary-full-body')) return;
  active.scrollIntoView({ block:'nearest', inline:'nearest' });
}

function syncAppViewport() {
  var viewport = window.visualViewport;
  var height = viewport ? viewport.height : window.innerHeight;
  var layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
  document.documentElement.style.setProperty('--app-height', Math.round(height) + 'px');
  document.documentElement.classList.toggle('keyboard-open', !!viewport && layoutHeight - height > 120);
  if (_viewportSyncFrame) cancelAnimationFrame(_viewportSyncFrame);
  _viewportSyncFrame = requestAnimationFrame(revealFocusedDiaryEditor);
}

function bindViewportEvents() {
  syncAppViewport();
  window.addEventListener('resize', syncAppViewport, { passive:true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncAppViewport, { passive:true });
    window.visualViewport.addEventListener('scroll', syncAppViewport, { passive:true });
  }
  document.addEventListener('focusin', function(event) {
    if (event.target.matches('input, textarea')) requestAnimationFrame(revealFocusedDiaryEditor);
  });
}

// ============ Event Bindings ============
function bindEvents() {
  // 💥 Review button
  document.getElementById('btnReview').addEventListener('click',showReviewModal);

  // 🔍 Search button
  document.getElementById('btnSearch').addEventListener('click', openSearch);

  // ☰ → toggle side panel
  document.getElementById('btnMenu').addEventListener('click',()=>{
    if(state.fsOpen){closeFullscreen();}
    else if(state.panelOpen)closePanel();
    else openPanel();
  });

  // Overlay → close side panel
  document.getElementById('menuOverlay').addEventListener('click',closePanel);

  // Side panel close button
  document.getElementById('btnSpClose').addEventListener('click',closePanel);

  // Side panel menu buttons → close panel, open fullscreen
  document.querySelectorAll('.sp-menu .menu-btn').forEach(btn=>{
    btn.addEventListener('click',()=>openFullscreen(btn.dataset.view));
  });

  // Fullscreen back button → return to chat
  document.getElementById('btnBackToChat').addEventListener('click',closeFullscreen);

  // Send message
  function sendMsg(){
    const inp=document.getElementById('msgInput'), text=inp.value.trim();
    if(!text)return;
    const sentMsg=addMessage('user',text); inp.value='';inp.style.height='auto';
    // 口径③：你发消息的当场掷骰子。tryTaFav 内部整段 try/catch，收藏失败绝不影响发消息。
    tryTaFav(text, sentMsg&&sentMsg.id);
    scheduleIndicators(); triggerPassiveReply();
  }
  document.getElementById('btnSend').addEventListener('click',sendMsg);
  // 📷 聊天配图
  document.getElementById('btnPhoto').addEventListener('click',function(){
    document.getElementById('chatFileInput').click();
  });
  document.getElementById('chatFileInput').addEventListener('change',function(){
    var file = this.files[0];
    if (!file) return;
    compressImage(file).then(function(dataUrl) {
      addMessage('user', '', Date.now(), dataUrl);
      scheduleIndicators(); triggerPassiveReply();
    }).catch(function(e) { console.error('图片压缩失败:', e); alert('图片处理失败，请重试'); });
    this.value = '';
  });
  // 😊 表情包面板
  document.getElementById('btnSticker').addEventListener('click', openStickerPanel);
  document.getElementById('stickerOverlay').addEventListener('click', closeStickerPanel);
  document.getElementById('btnAddSticker').addEventListener('click', function(){
    document.getElementById('stickerFileInput').click();
  });
  document.getElementById('stickerFileInput').addEventListener('change', function(){
    addStickersFromFiles(this.files);
    this.value = '';
  });
  document.getElementById('msgInput').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}
  });
  document.getElementById('msgInput').addEventListener('input',function(){
    this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';
  });

  // 单击梦角消息 → 弹出操作浮层（解读/收藏）；点锐评"解读"按钮仍走原逻辑
  document.getElementById('messagesArea').addEventListener('click',function(e){
    // 内心 OS 小气泡：必须最先处理并吃掉事件 —— 否则会落到下面"单击消息行弹操作浮层"那支
    var osBtn = e.target.closest('.msg-os-bubble');
    if(osBtn){
      e.stopPropagation(); e.preventDefault();
      var oidx = parseInt(osBtn.dataset.osIdx);
      var omsgs = STORE.messages || [], om = omsgs[oidx];
      if(om && om.os){
        om.osOpen = !om.osOpen;     // 再点收起
        om.osRead = true;           // 点开过就转"已读"淡色（收起后也保持淡色）
        STORE.messages = omsgs;     // 走 STORE 写入 ⇒ 刷新后状态还在
        var obox = osBtn.parentElement ? osBtn.parentElement.querySelector('.msg-os-box[data-os-box="' + oidx + '"]') : null;
        if(obox) obox.classList.toggle('show', !!om.osOpen);
        osBtn.classList.add('read');
      }
      if(_mabIdx >= 0) hideMsgActionBar();   // 别让既有浮层悬在那儿
      return;
    }
    // 锐评按钮：单独处理
    var reviewBtn = e.target.closest('.btn-ai-review');
    if(reviewBtn){
      e.stopPropagation();
      if(!isAIInterpretReady()){alert('请先到「设置 → AI 解读」开启功能并填写 API Key');return;}
      var rid = reviewBtn.dataset.rid;
      var bubble = reviewBtn.closest('.msg-bubble');
      var box2 = bubble ? bubble.querySelector('.ai-box') : null;
      if(!box2) return;
      var reviews = STORE.reviews || [];
      var rv = reviews.find(x => x.id == rid);
      if(!rv) return;
      runAIInterpretOnBox(box2, {
        targetText: rv.comment || '',
        contextMessages: rv.userInput ? [{ role: 'user', content: rv.userInput }] : [],
        scene: 'review',
        loadingText: '解读锐评中'
      });
      return;
    }
    // 碎影卡：点开碎影列表并定位到这条
    var shadowCard = e.target.closest('.shadow-card[data-shadow]');
    if(shadowCard){
      e.stopPropagation();
      var sid = shadowCard.dataset.shadow;
      if(!sid || !shadowById(sid)){ showToast('这条碎影已被删除'); return; }
      // 先 openFullscreen（它会把 shadowDetailId 重置为 null），再设详情目标并重渲染，
      // 否则刚设好的详情 id 会被 openFullscreen 抹掉，变成只打开列表。
      openFullscreen('shadows');
      state.shadowDetailId = sid;
      var body3 = document.getElementById('fsBody');
      if(body3) renderShadows(body3);
      return;
    }
    // 单击梦角文本消息行 → 弹浮层
    var row = e.target.closest('.msg-row[data-msg-idx]');
    if(row){
      e.stopPropagation();
      var idx = parseInt(row.dataset.msgIdx);
      // 若浮层已对同一消息显示，则收起（toggle）
      if(_mabIdx === idx){ hideMsgActionBar(); return; }
      showMsgActionBarFor(row, idx);
      return;
    }
    // 点到空白处 → 收起浮层
    if(_mabIdx >= 0) hideMsgActionBar();
  });

  // 浮层按钮：解读/收藏/删除
  var actionBar = document.getElementById('msgActionBar');
  if(actionBar){
    actionBar.querySelector('.mab-interpret').addEventListener('click', mabDoInterpret);
    actionBar.querySelector('.mab-fav').addEventListener('click', mabDoFavorite);
    actionBar.querySelector('.mab-del').addEventListener('click', mabDoDelete);
  }
  // 点浮层自身以外（且非消息区）时收起
  document.addEventListener('click', function(e){
    if(_mabIdx < 0) return;
    if(e.target.closest('#msgActionBar')) return;
    if(e.target.closest('#messagesArea')) return; // 消息区有自己的处理
    hideMsgActionBar();
  });
  // 滚动时收起浮层（避免定位错乱）
  document.getElementById('messagesArea').addEventListener('scroll', function(){
    if(_mabIdx >= 0) hideMsgActionBar();
  }, { passive: true });

  // File import
  document.getElementById('fileImport').addEventListener('change',e=>{
    if(e.target.files[0]){importData(e.target.files[0]);e.target.value='';}
  });

  // Modal overlay
  document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)hideModal();});

  // 🔍 Search modal events
  document.getElementById('btnSearchClose').addEventListener('click', closeSearch);
  document.getElementById('searchInput').addEventListener('input', function(){ performSearch(this.value.trim()); });
  document.getElementById('searchModal').addEventListener('click', function(e){ if (e.target === this) closeSearch(); });

  // Escape
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(document.getElementById('modalOverlay').classList.contains('show')){hideModal();}
      else if(document.getElementById('searchModal').classList.contains('show')){closeSearch();}
      else if(document.getElementById('stickerPanel').classList.contains('open')){closeStickerPanel();}
      else if(state.fsOpen){closeFullscreen();}
      else if(state.panelOpen){closePanel();}
    }
  });

  // ---- Dream Engine: heartbeat-based last-active tracking ----
  // Periodic save every 30s. No visibility/beforeunload hooks —
  // those fire during location.reload() and would overwrite test values.
  let _heartbeatId = null;
  function heartbeatSave() {
    STORE.lastActive = Date.now();
    checkPendingRecalls();
    _heartbeatId = setTimeout(heartbeatSave, 30000);
  }
  // Delay first save by 60s so init() backfill has plenty of time to read
  // the pre-existing value before it gets overwritten.
  _heartbeatId = setTimeout(heartbeatSave, 60000);
}

// ============ Init ============
async function init() {
  try { initDefaults(); } catch(e) { console.error('initDefaults error:', e); }
  // 「TA 收下的话」大类一开场就建好，这样字卡库第二行/收藏夹页签/设置项立刻可见，
  // 不用等第一次真的收藏到东西才冒出来（收藏逻辑本身仍按概率触发）。
  try { if (taFavCfg().enabled) taFavEnsureCategory(); } catch(e) { console.error('taFavEnsureCategory error:', e); }
  // 真·首启（这一次运行刚写入内置演示卡）才问一次"语料从哪来"：
  // 已经导入过自己卡的人、以及以后每次打开，都不会看到它。
  if (_corpusSeededThisRun) { try { showCorpusOnboard(); } catch(e) { console.error('corpus onboard error:', e); } }
  try {
    bindViewportEvents();
    bindEvents();
    applyChatVisual();
    renderHeader(); renderMessages();
    updateRedDots();
    // 网易云歌单缓存：为空或过期(24h)时静默拉取
    var _sc = STORE.songCache || {};
    if (getNeteaseConfig().enabled && (!_sc.songs || !_sc.songs.length || Date.now() - (_sc.fetchedAt || 0) > 86400000)) {
      setTimeout(function() { refreshSongCache(); }, 3000);
    }
    // Check for recalls that happened during offline period
    checkPendingRecalls();
    // Lazy recall checker: runs on user interaction (faster than 30s heartbeat)
    let _recallCheckThrottle = 0;
    function lazyRecallCheck() {
      const now = Date.now();
      if (now - _recallCheckThrottle < 5000) return;
      _recallCheckThrottle = now;
      checkPendingRecalls();
    }
    document.addEventListener('scroll', lazyRecallCheck, {passive: true});
    document.addEventListener('click', lazyRecallCheck, {passive: true});
    document.addEventListener('keydown', lazyRecallCheck, {passive: true});

    const cats=STORE.categories||[];
    if(cats.length>0)state.selectedCatId=cats[0].id;
    scheduleActive();
    restorePendingReactions();
    recoverPendingCommentReplies();
    revealDueLetterAnnotations(Date.now());
    scheduleLetterAnnotationReveal();
    if (STORE.lastActive) startBackgroundBackfill();
    else {
      STORE.lastActive = Date.now();
      scheduleTodayEvents();
    }
    // Show period reminder if within 3 days
    updatePeriodReminder();
  } catch(e) {
    console.error('Init error:', e);
    alert('初始化出错：'+e.message+'\n请尝试清除浏览器缓存后刷新页面。');
  }
}
document.addEventListener('DOMContentLoaded',init);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').catch(function(error) {
      console.warn('Service worker registration failed:', error);
    });
  });
}

// 将图片裁剪为朋友圈封面比例，居中取景后再保存，避免只显示左上角
function cropMomentsCover(file, targetWidth, targetHeight) {
  targetWidth = targetWidth || 430;
  targetHeight = targetHeight || 258;
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() {
      var img = new Image();
      img.onload = function() {
        var sourceRatio = img.width / img.height;
        var targetRatio = targetWidth / targetHeight;
        var sw, sh, sx, sy;
        if (sourceRatio > targetRatio) {
          sh = img.height; sw = Math.round(sh * targetRatio); sx = Math.round((img.width - sw) / 2); sy = 0;
        } else {
          sw = img.width; sh = Math.round(sw / targetRatio); sx = 0; sy = Math.round((img.height - sh) / 2);
        }
        var canvas = document.createElement('canvas');
        var scale = Math.min(3, Math.max(1, 1200 / targetWidth));
        canvas.width = Math.round(targetWidth * scale); canvas.height = Math.round(targetHeight * scale);
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = function() { reject(new Error('图片加载失败')); };
      img.src = reader.result;
    };
    reader.onerror = function() { reject(new Error('文件读取失败')); };
    reader.readAsDataURL(file);
  });
}

// ============ Image Compression ============
function compressImage(file, maxSize, quality) {
  maxSize = maxSize || 1000;
  quality = quality || 0.82;
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = function() { reject(new Error('图片加载失败')); };
      img.src = reader.result;
    };
    reader.onerror = function() { reject(new Error('文件读取失败')); };
    reader.readAsDataURL(file);
  });
}

// ============ AI Interpret (字卡解读) ============
// 全局 AbortController：同一时刻只允许一个解读请求，新的请求会取消旧的
var _aiAbortCtrl = null;

// 判断 AI 解读是否已配置可用
function isAIInterpretReady() {
  var ai = (STORE.config || {}).aiInterpret || {};
  return ai.enabled && ai.apiKey && ai.apiUrl;
}

// 取当前 AI 配置（带默认值兜底）
function getAIConfig() {
  var ai = (STORE.config || {}).aiInterpret || {};
  return {
    enabled: !!ai.enabled,
    apiUrl: ai.apiUrl || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: ai.apiKey || '',
    model: ai.model || 'deepseek-chat',
    contextCount: (typeof ai.contextCount === 'number') ? ai.contextCount : 5,
    systemPrompt: ai.systemPrompt || defaultAIInterpret().systemPrompt,
  };
}

// 根据场景拼装系统提示词
function buildAISystemPrompt(scene, cfg) {
  var base = cfg.systemPrompt;
  var userName = (STORE.config||{}).userNickname || '我';
  if (scene === 'moments') {
    return '你扮演梦角本人。下面是你（梦角）发的一条朋友圈，以及你和'+userName+'在评论区的互动。\n' + base;
  }
  if (scene === 'moments-friend') {
    return '你扮演梦角本人。下面是你看到的朋友圈动态（发布者是'+userName+'），以及你和'+userName+'在评论区的互动。\n' + base;
  }
  if (scene === 'moments-comment') {
    return '你扮演梦角本人。下面是一条朋友圈的动态和互动，你（梦角）在其中发表了一条评论。\n' + base;
  }
  if (scene === 'diary') {
    return '你扮演梦角本人。下面是你（梦角）写的日记。\n' + base;
  }
  if (scene === 'letter-annotation') {
    return '你扮演梦角本人。下面是你在一封信上圈出的片段和写下的批注。\n' + base;
  }
  if (scene === 'review') {
    return '你扮演梦角本人。'+userName+'让你对某件事物做"锐评"（打分 + 评语），以下是你的评价。\n' + base;
  }
  return base;
}

// 组装 user 消息内容（含上下文 + 目标文本），按场景不同
function buildAIUserContent(scene, targetText, contextMessages) {
  var userName = (STORE.config||{}).userNickname || '我';
  if (scene === 'chat') {
    var ctx = '';
    if (contextMessages && contextMessages.length > 0) {
      ctx = '\n\n【最近的聊天记录】\n' + contextMessages.map(function(m) {
        return (m.role === "assistant" ? '梦角' : userName) + '：' + m.content;
      }).join('\n');
    }
    return '以下是梦角和' + userName + '的聊天记录。请解读梦角说的这句话：' + targetText + '。' + ctx;
  }
  if (scene === 'moments' || scene === 'moments-friend' || scene === 'moments-comment') {
    var cmts = (contextMessages || []).map(function(m) {
      return '  ' + m.content;
    }).join('\n');
    return '以下是一条朋友圈的动态和评论互动：\n' + (cmts || '（暂无内容）');
  }
  if (scene === 'diary') {
    return '以下是梦角（我）写的日记：\n' + (contextMessages && contextMessages[0] ? contextMessages[0].content : targetText);
  }
  if (scene === 'letter-annotation') {
    return userName + '写给我的信里有这样一段内容。请解读我在下面写下的批注真正想表达的意思：\n' + targetText;
  }
  if (scene === 'review') {
    var reviewed = (contextMessages && contextMessages[0]) ? contextMessages[0].content : '';
    return userName + '让我锐评："' + reviewed + '"。\n我的评价：' + targetText;
  }
  return targetText;
}

/**
 * 发起一次 AI 解读请求（流式）。
 * @param opts { targetText, contextMessages, scene, onResult(chunk), onError(msg), onDone() }
 */
function callAIInterpret(opts) {
  var cfg = getAIConfig();
  if (!cfg.enabled) {
    opts.onError && opts.onError('AI 解读未开启，请到「设置 → AI 解读」中开启。');
    return;
  }
  if (!cfg.apiKey) {
    opts.onError && opts.onError('未配置 API Key，请到「设置 → AI 解读」中填写。');
    return;
  }
  // 取消上一个未完成的请求
  if (_aiAbortCtrl) { try { _aiAbortCtrl.abort(); } catch(e){} }
  _aiAbortCtrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;

  var messages = [
    { role: 'system', content: buildAISystemPrompt(opts.scene, cfg) },
  ];

  // ---- LokulMem: inject recent memories into context ----
  var memories = getMemoryList();
  if (memories.length > 0) {
    var speakerMap = { me: '我', mengjiao: '梦角', general: '共同' };
    var memLines = ['【以下是梦角的历史记忆，供你参考】'];
    var count = 0;
    for (var i = 0; i < memories.length && count < 20; i++) {
      var m = memories[i];
      var label = speakerMap[m.speaker] || m.speaker;
      var dateStr = m.timestamp ? new Date(m.timestamp).toISOString().slice(0, 10) : '';
      memLines.push('[' + dateStr + '] ' + label + '：' + m.content);
      count++;
    }
    messages.push({ role: 'system', content: memLines.join('\n') });
  }

  messages.push({ role: 'user', content: buildAIUserContent(opts.scene, opts.targetText, opts.contextMessages) });

  fetch(cfg.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: messages,
      stream: true,
      temperature: 0.85
    }),
    signal: _aiAbortCtrl ? _aiAbortCtrl.signal : undefined
  }).then(function(resp) {
    if (!resp.ok) {
      return resp.text().then(function(t) {
        throw new Error('HTTP ' + resp.status + (t ? ('：' + t.slice(0, 200)) : ''));
      });
    }
    if (!resp.body || !resp.body.getReader) {
      // 浏览器不支持流式读取，降级为一次性读取
      return resp.json().then(function(data) {
        var content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
        opts.onResult && opts.onResult(content);
        opts.onDone && opts.onDone();
      });
    }
    var reader = resp.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    function pump() {
      reader.read().then(function(res) {
        if (res.done) { opts.onDone && opts.onDone(); return; }
        buffer += decoder.decode(res.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop(); // 保留最后未完整的一行
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || !line.startsWith('data:')) continue;
          var data = line.slice(5).trim();
          if (data === '[DONE]') { opts.onDone && opts.onDone(); return; }
          try {
            var json = JSON.parse(data);
            var delta = json.choices && json.choices[0] && json.choices[0].delta;
            if (delta && delta.content) {
              opts.onResult && opts.onResult(delta.content);
            }
          } catch(e) { /* 忽略无法解析的行 */ }
        }
        pump();
      }).catch(function(err) {
        if (err.name === 'AbortError') return;
        opts.onError && opts.onError('读取失败：' + err.message);
      });
    }
    pump();
  }).catch(function(err) {
    if (err.name === 'AbortError') return;
    var msg = err.message || String(err);
    if (/Failed to fetch|NetworkError|CORS/i.test(msg)) {
      msg = '网络或跨域(CORS)错误，请检查 API 地址是否支持浏览器跨域，以及 Key 是否正确。';
    }
    opts.onError && opts.onError(msg);
  });
}

// 中止当前正在进行的解读请求（用于页面切换/刷新前清理）
function abortAIInterpret() {
  if (_aiAbortCtrl) { try { _aiAbortCtrl.abort(); } catch(e){} _aiAbortCtrl = null; }
}

// ============ AI 解读：UI 渲染辅助 ============
// 把一个 .ai-box 容器初始化为"加载中"状态，并返回用于喂流式文本的元素
function aiBoxStartLoading(box, loadingText) {
  box.classList.add('show', 'loading');
  box.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-loading-text">' + escapeHtml(loadingText || '组织语言中') + '</span></div><div class="ai-text"></div>';
  // Reset memory-actions flag so fresh interpretation can save/ignore again
  box._memoryBtnsAdded = false;
  delete box.dataset.aiDecision;
  return box.querySelector('.ai-text');
}

// 把 .ai-box 切换为流式输出态（隐藏 loading，开始 append 文本）
function aiBoxStartStreaming(box) {
  box.classList.remove('loading');
  box.classList.add('streaming');
  var loader = box.querySelector('.ai-loading');
  if (loader) loader.style.display = 'none';
}

// 流式 append 一个 chunk（带打字机光标）
function aiBoxAppend(box, chunk) {
  var textEl = box.querySelector('.ai-text');
  if (!textEl) return;
  textEl.appendChild(document.createTextNode(chunk));
}

// 解读完成：去掉光标，加"重新解读"小按钮
function aiBoxFinish(box) {
  box.classList.remove('streaming', 'loading');
  var textEl = box.querySelector('.ai-text');
  if (textEl && textEl.textContent.trim() === '') {
    textEl.textContent = '（AI 没有返回内容）';
  }
}

// 解读失败：显示错误信息
function aiBoxError(box, msg) {
  box.classList.remove('streaming', 'loading');
  box.classList.add('error');
  box.innerHTML = '<div class="ai-error">❌ ' + escapeHtml(msg) + '</div>';
}

function makeFavoriteKey(sourceType, sourceId, sourceSubId) {
  return String(sourceType || 'message') + '::' + String(sourceId || '') + '::' + String(sourceSubId || '');
}

function getFavoriteKey(fav) {
  if (!fav) return '';
  if (fav.favoriteKey) return fav.favoriteKey;
  if (fav.sourceType && fav.sourceId) return makeFavoriteKey(fav.sourceType, fav.sourceId, fav.sourceSubId);
  if (fav.messageId) return makeFavoriteKey('message', fav.messageId, '');
  return '';
}

function getFavoriteSourceLabel(fav) {
  if (!fav) return '';
  if (fav.sourceLabel) return fav.sourceLabel;
  if (fav.sourceType === 'moment') return '朋友圈';
  if (fav.sourceType === 'moment-comment') return '朋友圈评论';
  if (fav.sourceType === 'diary') return '日记';
  if (fav.sourceType === 'letter-annotation') return '信件批注';
  if (fav.sourceType === 'review') return '锐评';
  return '聊天';
}

function findFavoriteIndexByKey(key) {
  var favorites = STORE.favorites || [];
  for (var i = 0; i < favorites.length; i++) {
    if (getFavoriteKey(favorites[i]) === key) return i;
  }
  return -1;
}

function getAIBoxInterpretation(box) {
  if (!box || !box.classList.contains('show')) return '';
  var textEl = box.querySelector('.ai-text');
  return textEl ? textEl.textContent.trim() : '';
}

function toggleAIFavorite(meta, box) {
  if (!meta || !meta.sourceType || !meta.sourceId) return false;
  var favorites = STORE.favorites || [];
  var key = makeFavoriteKey(meta.sourceType, meta.sourceId, meta.sourceSubId);
  var existIdx = findFavoriteIndexByKey(key);
  if (existIdx >= 0) {
    favorites.splice(existIdx, 1);
    STORE.favorites = favorites;
    return false;
  }
  var interp = getAIBoxInterpretation(box) || meta.interpretation || '';
  favorites.unshift({
    id: genId(),
    favoriteKey: key,
    sourceType: meta.sourceType,
    sourceId: meta.sourceId,
    sourceSubId: meta.sourceSubId || '',
    sourceLabel: meta.sourceLabel || getFavoriteSourceLabel(meta),
    type: meta.sourceType,
    text: meta.text || '',
    interpretation: interp,
    timestamp: Date.now()
  });
  STORE.favorites = favorites;
  return true;
}

function addAIFavoriteButton(box, meta) {
  if (!box || !meta || !meta.sourceType || !meta.sourceId) return;
  var key = makeFavoriteKey(meta.sourceType, meta.sourceId, meta.sourceSubId);
  var row = box.querySelector('.ai-fav-row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'ai-fav-row';
    box.appendChild(row);
  }
  var btn = row.querySelector('.ai-fav-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-fav-btn';
    if (meta.sourceType === 'diary') btn.classList.add('btn-fav-diary');
    if (meta.sourceType === 'moment-comment') btn.setAttribute('data-action', 'toggleAIFavoriteComment');
    else btn.setAttribute('data-action', 'toggleAIFavorite');
    row.appendChild(btn);
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleAIFavorite(meta, box);
      refreshAIFavoriteButton(btn, key);
    });
  }
  refreshAIFavoriteButton(btn, key);
}

function refreshAIFavoriteButton(btn, key) {
  var isFaved = findFavoriteIndexByKey(key) >= 0;
  btn.classList.toggle('faved', isFaved);
  btn.textContent = isFaved ? '⭐ 已收藏' : '⭐ 收藏解读';
}

// 触发一次解读，自动管理 .ai-box 的生命周期（loading → streaming → finish/error）
function runAIInterpretOnBox(box, aiOpts) {
  var textEl = aiBoxStartLoading(box, aiOpts.loadingText);
  var scene = aiOpts.scene || 'chat';
  var speaker = 'mengjiao'; // All AI interpretations are from 梦角's perspective
  callAIInterpret({
    targetText: aiOpts.targetText,
    contextMessages: aiOpts.contextMessages,
    scene: scene,
    onResult: function(chunk) {
      if (box.classList.contains('loading')) aiBoxStartStreaming(box);
      aiBoxAppend(box, chunk);
    },
    onDone: function() {
      aiBoxFinish(box);
      if (aiOpts.favoriteMeta) addAIFavoriteButton(box, aiOpts.favoriteMeta);
      // Add memory/ignore buttons after finish
      // addMemoryActionButtons(box, scene, speaker);  // <-- 注释掉，后续需要时取消注释
    },
    onError: function(msg) { aiBoxError(box, msg); }
  });
}

function addMemoryActionButtons(box, scene, speaker) {
  if (box._memoryBtnsAdded) return;
  box._memoryBtnsAdded = true;
  // Check if already decided (ignored or saved)
  var decision = box.dataset.aiDecision;
  if (decision === 'ignored') return;
  if (decision === 'saved') return;

  // Check if this interpretation content was previously ignored (saved in session memory)
  var textEl = box.querySelector('.ai-text');
  if (!textEl) return;
  var content = textEl.textContent.trim();
  if (!content) return;
  if (window._ignoredInterpretations && window._ignoredInterpretations.indexOf(content) >= 0) return;

  var btns = document.createElement('div');
  btns.className = 'ai-memory-btns';
  btns.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

  var saveBtn = document.createElement('button');
  saveBtn.textContent = '✅ 存入记忆';
  saveBtn.style.cssText = 'padding:4px 12px;font-size:12px;border-radius:16px;background:var(--accent);color:#fff;cursor:pointer;border:none;';

  var ignoreBtn = document.createElement('button');
  ignoreBtn.textContent = '❌ 忽略';
  ignoreBtn.style.cssText = 'padding:4px 12px;font-size:12px;border-radius:16px;background:var(--bg-warm);color:var(--text-secondary);cursor:pointer;border:1px solid var(--border);';

  saveBtn.addEventListener('click', function() {
    // Check if already in memory library (prevents duplicate on re-interpret)
    var existing = getMemoryList().filter(function(m) { return m.content === content; });
    if (existing.length > 0) {
      saveBtn.textContent = '已存入 ✓';
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.6';
      ignoreBtn.disabled = true;
      ignoreBtn.style.opacity = '0.6';
      box.dataset.aiDecision = 'saved';
      return;
    }
    saveMemory({
      content: content,
      speaker: speaker,
      source: 'ai_approved',
      timestamp: new Date().toISOString()
    });
    saveBtn.textContent = '已存入 ✓';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.6';
    ignoreBtn.disabled = true;
    ignoreBtn.style.opacity = '0.6';
    box.dataset.aiDecision = 'saved';
  });

  ignoreBtn.addEventListener('click', function() {
    if (!window._ignoredInterpretations) window._ignoredInterpretations = [];
    window._ignoredInterpretations.push(content);
    ignoreBtn.textContent = '已忽略 ✗';
    ignoreBtn.disabled = true;
    ignoreBtn.style.opacity = '0.6';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.6';
    box.dataset.aiDecision = 'ignored';
  });

  btns.appendChild(saveBtn);
  btns.appendChild(ignoreBtn);
  box.appendChild(btns);
}

// ============ AI 解读：四个场景的上下文组装 ============

// 聊天：取目标消息前 N 条作为上下文，返回 [{role,content}]
function buildChatContext(targetIdx, contextCount) {
  var messages = STORE.messages || [];
  var ctx = [];
  var start = Math.max(0, targetIdx - contextCount);
  for (var i = start; i < targetIdx; i++) {
    var m = messages[i];
    if (!m) continue;
    // 跳过已撤回、涂鸦、锐评（这些拿不到纯文本）
    if (m.recall && m.recall.executed) continue;
    var content = m.text;
    if (m.doodle) content = '[涂鸦]';
    if (m.review) content = '[锐评：' + (m.review.comment || '') + ']';
    if (!content) continue;
    ctx.push({ role: m.type === 'character' ? 'assistant' : 'user', content: content });
  }
  return ctx;
}

// 朋友圈：动态内容 + 全部评论
function buildMomentContext(moment) {
  var ctx = [];
  (moment.comments || []).forEach(function(c) {
    ctx.push({ role: c.commenter === 'dream' ? 'assistant' : 'user', content: c.content });
  });
  return ctx;
}

// 日记：返回标题+正文作为目标文本
function buildDiaryTarget(diary) {
  return (diary.title ? '【' + diary.title + '】\n' : '') + (diary.content || '');
}

// ============ AI 解读 + 收藏：消息操作浮层 ============
// 全局状态：当前浮层关联的消息 idx（-1 表示无）
var _mabIdx = -1;

function getMsgActionBar() { return document.getElementById('msgActionBar'); }

// 显示浮层并定位到目标消息元素旁
function showMsgActionBarFor(rowEl, idx) {
  var bar = getMsgActionBar(); if (!bar || !rowEl) return;
  _mabIdx = idx;
  // 先显示才能测量尺寸
  bar.classList.add('show');
  var rect = rowEl.getBoundingClientRect();
  var barRect = bar.getBoundingClientRect();
  // 水平居中对齐消息行，限制不超出视口
  var left = rect.left + rect.width / 2 - barRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - barRect.width - 8));
  // 默认在消息上方；若上方空间不足则放下方
  var aboveSpace = rect.top;
  var placeBelow = aboveSpace < barRect.height + 16;
  var top;
  if (placeBelow) { top = rect.bottom + 8; bar.classList.add('below'); }
  else { top = rect.top - barRect.height - 8; bar.classList.remove('below'); }
  bar.style.left = left + 'px';
  bar.style.top = top + 'px';
  // 更新收藏按钮态
  updateMabFavState(idx);
  // 用户消息只显示删除按钮
  var isUser = (STORE.messages || [])[idx] && (STORE.messages || [])[idx].type === 'user';
  var interpBtn = bar.querySelector('.mab-interpret');
  var favBtn = bar.querySelector('.mab-fav');
  if (interpBtn) interpBtn.style.display = isUser ? 'none' : '';
  if (favBtn) favBtn.style.display = isUser ? 'none' : '';
}

function hideMsgActionBar() {
  var bar = getMsgActionBar(); if (!bar) return;
  bar.classList.remove('show', 'below');
  _mabIdx = -1;
}

// 根据当前消息是否已收藏，更新浮层收藏按钮样式
function updateMabFavState(idx) {
  var bar = getMsgActionBar(); if (!bar) return;
  var favBtn = bar.querySelector('.mab-fav');
  if (!favBtn) return;
  var messages = STORE.messages || [];
  var m = messages[idx];
  if (!m) return;
  var key = makeFavoriteKey('message', m.id, '');
  var isFaved = (STORE.favorites || []).some(function(f) { return getFavoriteKey(f) === key || f.messageId === m.id; });
  favBtn.classList.toggle('faved', isFaved);
  favBtn.textContent = isFaved ? '⭐ 已收藏' : '⭐ 收藏';
}

// 触发浮层"解读"按钮
function mabDoInterpret() {
  if (_mabIdx < 0) return;
  var idx = _mabIdx;
  hideMsgActionBar();
  if (!isAIInterpretReady()) {
    alert('请先到「设置 → AI 解读」开启功能并填写 API Key');
    return;
  }
  var messages = STORE.messages || [];
  var m = messages[idx];
  if (!m) return;
  var box = document.querySelector('.msg-row[data-msg-idx="' + idx + '"] .ai-box');
  if (!box) return;
  var cfg = getAIConfig();
  runAIInterpretOnBox(box, {
    targetText: m.text,
    contextMessages: buildChatContext(idx, cfg.contextCount),
    scene: 'chat',
    loadingText: '梦角正在组织语言'
  });
}

// 触发浮层"收藏"按钮
function mabDoFavorite() {
  if (_mabIdx < 0) return;
  var idx = _mabIdx;
  var messages = STORE.messages || [];
  var m = messages[idx];
  if (!m) return;
  var favorites = STORE.favorites || [];
  // 已收藏则取消
  var existIdx = -1;
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].messageId === m.id) { existIdx = i; break; }
  }
  if (existIdx >= 0) {
    favorites.splice(existIdx, 1);
    STORE.favorites = favorites;
    updateMabFavState(idx);
    return;
  }
  // 收藏：尽量带上当前已生成的解读结果
  var interp = '';
  var box = document.querySelector('.msg-row[data-msg-idx="' + idx + '"] .ai-box');
  interp = getAIBoxInterpretation(box);
  favorites.unshift({
    id: genId(),
    favoriteKey: makeFavoriteKey('message', m.id, ''),
    sourceType: 'message',
    sourceId: m.id,
    sourceLabel: '聊天',
    messageId: m.id,
    type: 'message',
    text: m.text,
    interpretation: interp,
    timestamp: Date.now()
  });
  STORE.favorites = favorites;
  updateMabFavState(idx);
}

// 删除收藏
function removeFavorite(favId) {
  var favorites = STORE.favorites || [];
  favorites = favorites.filter(function(f) { return f.id !== favId; });
  STORE.favorites = favorites;
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'favorites') renderFavorites(body);
}

// 浮层"删除消息"按钮
function mabDoDelete() {
  if (_mabIdx < 0) return;
  var idx = _mabIdx;
  hideMsgActionBar();
  var messages = STORE.messages || [];
  var m = messages[idx];
  if (!m) return;
  if (!confirm('确定删除这条消息吗？')) return;
  messages.splice(idx, 1);
  STORE.messages = messages;
  renderMessages();
}

// ============ 收藏夹视图 ============
function renderFavorites(container) {
  // 口径②：收藏夹分两个页签 —— 「我的收藏」原有行为一个像素不改，只把渲染主体分流
  var favTab = state.favTab === 'ta' ? 'ta' : 'mine';
  if (favTab === 'ta' && !taFavCatExists()) state.favTab = 'mine';
  favTab = state.favTab === 'ta' ? 'ta' : 'mine';
  var taCount = taFavVisibleList().length;
  var tabsHtml = '<div class="fav-tabs">'
    + '<span class="fav-tab' + (favTab === 'mine' ? ' active' : '') + '" data-fav-tab="mine">我的收藏</span>'
    + '<span class="fav-tab' + (favTab === 'ta' ? ' active' : '') + '" data-fav-tab="ta">TA 的收藏'
    + (taCount ? '<span class="fav-tab-badge">' + taCount + '</span>' : '') + '</span>'
    + '</div>';

  if (favTab === 'ta') {
    container.innerHTML = '<div class="fav-page">' + tabsHtml + '<div id="taFavListWrap">' + taFavListHtml(taFavVisibleList()) + '</div></div>';
    bindFavTabs(container);
    bindTaFavDelete(container);
    return;
  }

  var favorites = STORE.favorites || [];
  // 按日期分组（今天/昨天/更早）
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var yesterday = new Date(today.getTime() - 86400000);
  var groups = { '今天': [], '昨天': [], '更早': [] };
  favorites.forEach(function(f) {
    var d = new Date(f.timestamp); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['今天'].push(f);
    else if (d.getTime() === yesterday.getTime()) groups['昨天'].push(f);
    else groups['更早'].push(f);
  });
  var cfg = STORE.config || {};
  var name = cfg.characterName || '梦角';

  if (favorites.length === 0) {
    container.innerHTML = '<div class="fav-page">' + tabsHtml + '<div class="fav-empty">⭐ 暂无收藏<br><br>聊天、朋友圈和日记里的 AI 解读<br>都可以收藏到这里</div></div>';
    bindFavTabs(container);
    return;
  }

  var html = '<div class="fav-page">' + tabsHtml;
  ['今天', '昨天', '更早'].forEach(function(g) {
    if (groups[g].length === 0) return;
    html += '<div class="fav-group"><div class="fav-group-title">' + g + '</div>';
    groups[g].forEach(function(f) {
      var timeStr = new Date(f.timestamp).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      var sourceLabel = getFavoriteSourceLabel(f);
      html += '<div class="fav-item">'
        + (sourceLabel ? '<div class="fav-item-source">' + escapeHtml(sourceLabel) + '</div>' : '')
        + '<div class="fav-item-text">' + escapeHtml(f.text) + '</div>'
        + (f.interpretation ? '<div class="fav-item-interp"><div class="fav-item-interp-label">💭 解读</div>' + escapeHtml(f.interpretation) + '</div>' : '')
        + '<div class="fav-item-time">' + timeStr + '</div>'
        + '<button class="fav-del" data-fid="' + f.id + '" title="删除">✕</button>'
        + '</div>';
    });
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
  bindFavTabs(container);
  // 绑定删除按钮
  container.querySelectorAll('.fav-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var fid = this.dataset.fid;
      removeFavorite(fid);
    });
  });
}

// ============ TA 的收藏（梦角收藏我说的话） ============
// 口径见 docs/superpowers/specs/2026-10-13-ta-favorite-design.md
//
// 两处存储，各管一件事：
//   ① 字卡本体 → STORE.cards，形状严格保持四字段 {id,text,categoryId,subcategoryId,weight}，
//      归入专属大类 cat_tafav / 小类 sub_tafav。因为与普通分类完全同构，字卡库的
//      增/删/改/藏/搜/权重全部天然复用，回收也走 getVisibleCards()，generateMessage 零改动。
//   ② 收藏记录 → STORE.taFavs（键 mcard_tafavs），只管字卡装不下的东西。
//      **记录里故意不存 text** —— 文字永远读 STORE.cards 里那张卡。这样「字卡库为准」
//      这条口径是结构上成立的，两边不可能不一致；卡没了记录成孤儿、立刻不显示。
var TAF_CAT_ID = 'cat_tafav';
var TAF_SUB_ID = 'sub_tafav';
var TAF_CAT_NAME = 'TA 收下的话';
var TAF_SUB_NAME = '收下的话';
var TAF_DEFAULT = { enabled: true, prob: 5, dailyMax: 12, minLen: 4 };
var TAF_NOTE_MAX = 20;          // AI 备注字数上限（提示词口径）
var TAF_NOTE_STORE_MAX = 40;    // 落库时截断，防模型不守规矩
var TAF_AI_TIMEOUT_MS = 8000;   // 超时即放弃，绝不挂住 UI
var TAF_NOTE_FALLBACK = '这句话我想留着';

function taFavCfg() {
  var c = (STORE.config || {}).taFav || {};
  var minLen = parseInt(c.minLen, 10);
  if (!(minLen >= 1)) minLen = TAF_DEFAULT.minLen;
  var prob = parseFloat(c.prob);
  if (isNaN(prob) || prob < 0) prob = TAF_DEFAULT.prob;
  if (prob > 100) prob = 100;
  var dailyMax = parseInt(c.dailyMax, 10);
  if (isNaN(dailyMax) || dailyMax < 0) dailyMax = TAF_DEFAULT.dailyMax;
  return { enabled: c.enabled !== false, prob: prob, dailyMax: dailyMax, minLen: minLen };
}

function taFavCatExists() {
  return (STORE.categories || []).some(function(c) { return c && c.id === TAF_CAT_ID; });
}

// 保证大类/小类存在（用户可能在字卡库里把它删掉；下次收藏时重建）
function taFavEnsureCategory() {
  var cats = STORE.categories || [], subs = STORE.subcategories || [];
  var changedCat = false, changedSub = false;
  if (!cats.some(function(c) { return c && c.id === TAF_CAT_ID; })) {
    cats.push({ id: TAF_CAT_ID, name: TAF_CAT_NAME, hidden: false });
    changedCat = true;
  }
  if (!subs.some(function(s) { return s && s.id === TAF_SUB_ID; })) {
    subs.push({ id: TAF_SUB_ID, name: TAF_SUB_NAME, categoryId: TAF_CAT_ID, hidden: false });
    changedSub = true;
  }
  if (changedCat) STORE.categories = cats;
  if (changedSub) STORE.subcategories = subs;
  return changedCat || changedSub;
}

// 日上限用与碎影/收藏夹分组同一个本地日期口径
function taFavTodayCount(ts) {
  var day = shadowDayStr(ts || Date.now());
  var n = 0;
  (STORE.taFavs || []).forEach(function(r) {
    if (r && r.createdAt && shadowDayStr(r.createdAt) === day) n++;
  });
  return n;
}

// 纯标点 / 纯表情 / 纯空白 → 不算有意义的话（口径④）
// 逐字符判：ASCII 字母数字、CJK 表意文字、假名、谚文、全角字母数字 才算「有意义」。
// 不复用 \p{P} 属性转义 —— 老 WebView 不一定支持 u 标志。
function taFavMeaningful(text) {
  var t = String(text == null ? '' : text);
  for (var i = 0; i < t.length; i++) {
    var code = t.charCodeAt(i);
    if (code >= 48 && code <= 57) return true;                 // 0-9
    if (code >= 65 && code <= 90) return true;                 // A-Z
    if (code >= 97 && code <= 122) return true;                // a-z
    if (code >= 0x3040 && code <= 0x30FF) return true;         // 平假名 / 片假名
    if (code >= 0x3400 && code <= 0x4DBF) return true;         // CJK 扩展 A
    if (code >= 0x4E00 && code <= 0x9FFF) return true;         // CJK 基本区
    if (code >= 0xF900 && code <= 0xFAFF) return true;         // CJK 兼容表意
    if (code >= 0xAC00 && code <= 0xD7AF) return true;         // 谚文音节
    if (code >= 0xFF10 && code <= 0xFF19) return true;         // 全角数字
    if (code >= 0xFF21 && code <= 0xFF3A) return true;         // 全角大写
    if (code >= 0xFF41 && code <= 0xFF5A) return true;         // 全角小写
  }
  return false;
}

// 隐私过滤：直接复用碎影那 6 条正则（手机号/身份证/卡号/密码/sk- 等），命中即不收藏
function taFavPrivacyOkText(text) {
  var t = String(text == null ? '' : text);
  for (var i = 0; i < SHADOW_PRIVACY.length; i++) {
    if (SHADOW_PRIVACY[i].test(t)) return false;
  }
  return true;
}

// 同一句话（大小写/首尾空白无关）在整库里找；口径⑮：不重复存，weight +1
function taFavFindExistingCard(text) {
  var key = String(text == null ? '' : text).trim().toLowerCase();
  if (!key) return null;
  var cards = STORE.cards || [];
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    if (c && c.text && String(c.text).trim().toLowerCase() === key) return c;
  }
  return null;
}

function taFavRecordOf(cardId) {
  var list = STORE.taFavs || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].cardId === cardId) return list[i];
  }
  return null;
}

function taFavAddRecord(rec) {
  // STORE 的 getter 每次读都是新副本 —— 必须整体写回，否则改动静默丢失
  var list = STORE.taFavs || [];
  list.unshift(rec);
  STORE.taFavs = list;
}

// 兜底备注：从字卡库抽一张卡的文字（与 TA 平时说话同源），排除 TA 收藏类自己
function taFavFallbackNote() {
  var pool = [];
  try {
    pool = (getVisibleCards() || []).filter(function(c) {
      return c && c.categoryId !== TAF_CAT_ID && c.text && String(c.text).trim();
    });
  } catch (e) { pool = []; }
  var pick = pool.length ? weightedPick(pool) : null;
  return pick ? String(pick.text).trim() : TAF_NOTE_FALLBACK;
}

// 口径⑬：优先让 AI 写备注，其次从字卡库抽。这里只负责「拿到就热更新」，失败静默。
function taFavRequestNote(cardId, text) {
  try {
    var cfg = getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) return null;
    var charName = (STORE.config || {}).characterName || '梦角';
    var userName = (STORE.config || {}).userNickname || '我';
    var systemPrompt = '你扮演' + charName + '本人。' + userName +
      '刚说了一句话，你把它悄悄收了起来。请用一句不超过 ' + TAF_NOTE_MAX +
      ' 字的第一人称口语，写下你为什么要收下这句话。直接输出这句话本身，' +
      '不要引号、不要解释、不要换行。';
    var controller = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = setTimeout(function() { if (controller) controller.abort(); }, TAF_AI_TIMEOUT_MS);
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userName + '说：' + text }
        ],
        stream: false,
        temperature: 0.9,
        max_tokens: 60
      })
    };
    if (controller) opts.signal = controller.signal;
    var p = fetch(cfg.apiUrl, opts).then(function(resp) {
      if (!resp.ok) return null;
      return resp.json();
    }).then(function(data) {
      clearTimeout(timer);
      var content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      var note = String(content).replace(/[\r\n]+/g, ' ').trim().slice(0, TAF_NOTE_STORE_MAX);
      if (!note) return null;
      taFavUpdateNote(cardId, note, 'ai');
      return note;
    }).catch(function() { clearTimeout(timer); return null; });
    return p;
  } catch (e) {
    return null;
  }
}

function taFavUpdateNote(cardId, note, noteSource) {
  var list = STORE.taFavs || [];
  var hit = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].cardId === cardId) { hit = list[i]; break; }
  }
  if (!hit) return false;
  hit.note = note;
  if (noteSource) hit.noteSource = noteSource;
  STORE.taFavs = list;
  if (state.fsView === 'favorites') {
    var body = document.getElementById('fsBody');
    if (body && state.favTab === 'ta') renderFavorites(body);
  }
  return true;
}

// 剪枝：丢掉 cardId 在 STORE.cards 里找不到的记录（口径⑨的写侧）
function pruneTaFavs() {
  var recs = STORE.taFavs || [];
  if (!recs.length) return 0;
  var alive = {};
  (STORE.cards || []).forEach(function(c) { if (c && c.id) alive[c.id] = 1; });
  var kept = recs.filter(function(r) { return r && r.cardId && alive[r.cardId]; });
  if (kept.length !== recs.length) STORE.taFavs = kept;
  return recs.length - kept.length;
}

// 渲染侧的安全带：永远只显示「卡还在」的记录（口径⑨的读侧）
function taFavVisibleList() {
  var byId = {};
  (STORE.cards || []).forEach(function(c) { if (c && c.id) byId[c.id] = c; });
  var out = [];
  (STORE.taFavs || []).forEach(function(r) {
    if (r && r.cardId && byId[r.cardId] && byId[r.cardId].text) out.push({ rec: r, card: byId[r.cardId] });
  });
  out.sort(function(a, b) { return (b.rec.createdAt || 0) - (a.rec.createdAt || 0); });
  return out;
}

function taFavRefreshCardUI() {
  if (state.fsView !== 'cards') return;
  renderCatTabs();
  renderSubchips();
  renderCardItems();
}

// 收藏入口。整段 try/catch —— 收藏失败绝不能影响发消息。
// 返回 {ok:true,...} 或 {skipped:true,reason}，便于测试与自查。
function tryTaFav(text, messageId) {
  try {
    var c = taFavCfg();
    if (!c.enabled) return { skipped: true, reason: 'disabled' };
    var t = String(text == null ? '' : text).trim();
    if (t.length < c.minLen) return { skipped: true, reason: 'too-short' };
    if (!taFavMeaningful(t)) return { skipped: true, reason: 'meaningless' };
    if (!taFavPrivacyOkText(t)) return { skipped: true, reason: 'privacy' };
    if (!(c.prob > 0)) return { skipped: true, reason: 'prob-zero' };
    if (Math.random() * 100 >= c.prob) return { skipped: true, reason: 'roll' };
    if (c.dailyMax > 0 && taFavTodayCount() >= c.dailyMax) return { skipped: true, reason: 'daily-max' };

    taFavEnsureCategory();

    var exist = taFavFindExistingCard(t);
    if (exist) {
      var cards = STORE.cards || [];
      var hit = null;
      for (var i = 0; i < cards.length; i++) { if (cards[i] && cards[i].id === exist.id) { hit = cards[i]; break; } }
      if (hit) { hit.weight = Math.min(100, (hit.weight || 1) + 1); STORE.cards = cards; }
      taFavRefreshCardUI();
      return { ok: true, cardId: exist.id, weightUp: true };
    }

    var list = STORE.cards || [];
    var newCard = { id: genId(), text: t, categoryId: TAF_CAT_ID, subcategoryId: TAF_SUB_ID, weight: 1 };
    list.push(newCard);
    STORE.cards = list;

    var note = taFavFallbackNote();
    taFavAddRecord({
      cardId: newCard.id,
      sourceMessageId: messageId || '',
      note: note,
      noteSource: 'card',
      createdAt: Date.now()
    });

    try { showMessageToast(note); } catch (e2) {}
    taFavRefreshCardUI();
    try { taFavRequestNote(newCard.id, t); } catch (e3) {}
    return { ok: true, cardId: newCard.id, note: note };
  } catch (err) {
    try { console.error('[taFav] 收藏失败（不影响发消息）:', err); } catch (e4) {}
    return { skipped: true, reason: 'error' };
  }
}

// 口径⑧：「TA 的收藏」里删 = 从字卡库真移除（删除键是唯一真移除路径）
function taFavDelete(cardId) {
  if (!cardId) return false;
  STORE.cards = (STORE.cards || []).filter(function(c) { return !c || c.id !== cardId; });
  STORE.taFavs = (STORE.taFavs || []).filter(function(r) { return !r || r.cardId !== cardId; });
  pruneTaFavs();
  var body = document.getElementById('fsBody');
  if (body && state.fsView === 'favorites') renderFavorites(body);
  else if (body && state.fsView === 'cards') taFavRefreshCardUI();
  return true;
}

// ---- 字卡库：专属分类单独一行（口径①⑪） ----
function taFavSecondRowHtml() {
  var cats = STORE.categories || [];
  var c = null;
  for (var i = 0; i < cats.length; i++) { if (cats[i] && cats[i].id === TAF_CAT_ID) { c = cats[i]; break; } }
  if (!c) return '';
  var active = state.selectedCatId === c.id ? ' active' : '';
  var hidden = c.hidden ? ' hidden' : '';
  var cnt = (STORE.cards || []).filter(function(card) { return card && card.categoryId === c.id; }).length;
  var icon = '<svg class="cat-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  return '<span class="cat-tab cat-tab-special' + active + hidden + '" data-cat-id="' + c.id + '">' +
    icon + escapeHtml(c.name) + '<span class="cat-badge">' + cnt + '</span></span>';
}

// 字卡列表里，TA 收下的卡多一行备注（其余卡不显示）
function taFavCardNoteHtml(card) {
  if (!card || card.subcategoryId !== TAF_SUB_ID) return '';
  var rec = taFavRecordOf(card.id);
  if (!rec) return '';
  var timeStr = rec.createdAt
    ? new Date(rec.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
  var label = rec.noteSource === 'ai' ? 'TA 的备注' : 'TA 的备注（取自字卡）';
  return '<div class="card-tafav-note"><span class="card-tafav-label">' + escapeHtml(label) + '</span>' +
    escapeHtml(rec.note || '') +
    (timeStr ? '<span class="card-tafav-time">' + escapeHtml(timeStr) + '</span>' : '') + '</div>';
}

// ---- 收藏夹：「TA 的收藏」列表（口径②） ----
function taFavListHtml(recs) {
  if (!recs.length) {
    return '<div class="fav-empty">🧡 还没有收下的话<br><br>你在聊天里说过的话，TA 偶尔会悄悄收起来<br>收下的会变成字卡，以后 TA 会用它回你</div>';
  }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var yesterday = new Date(today.getTime() - 86400000);
  var groups = { '今天': [], '昨天': [], '更早': [] };
  recs.forEach(function(it) {
    var d = new Date(it.rec.createdAt || 0); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['今天'].push(it);
    else if (d.getTime() === yesterday.getTime()) groups['昨天'].push(it);
    else groups['更早'].push(it);
  });
  var html = '';
  ['今天', '昨天', '更早'].forEach(function(g) {
    if (!groups[g].length) return;
    html += '<div class="fav-group"><div class="fav-group-title">' + g + '</div>';
    groups[g].forEach(function(it) {
      var f = it.rec, card = it.card;
      var timeStr = f.createdAt
        ? new Date(f.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';
      html += '<div class="fav-item fav-item-ta">'
        + '<div class="fav-item-text">' + escapeHtml(card.text) + '</div>'
        + (f.note ? '<div class="fav-item-interp"><div class="fav-item-interp-label">' + escapeHtml(f.noteSource === 'ai' ? '💭 TA 的备注' : '💭 TA 的备注（取自字卡）') + '</div>' + escapeHtml(f.note) + '</div>' : '')
        + (timeStr ? '<div class="fav-item-time">' + escapeHtml(timeStr) + '</div>' : '')
        + '<button class="fav-del" data-tacard="' + escapeHtml(card.id) + '" title="删除（同时从字卡库移除）">✕</button>'
        + '</div>';
    });
    html += '</div>';
  });
  return html;
}

function bindFavTabs(container) {
  var tabs = container.querySelectorAll('.fav-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      state.favTab = this.getAttribute('data-fav-tab') === 'ta' ? 'ta' : 'mine';
      renderFavorites(container);
    });
  }
}

function bindTaFavDelete(container) {
  var btns = container.querySelectorAll('.fav-del');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function() {
      var cardId = this.getAttribute('data-tacard');
      if (!cardId) return;
      if (!confirm('确定删除这句话吗？\n它将同时从字卡库移除，TA 以后也不会再用它。')) return;
      taFavDelete(cardId);
    });
  }
}

// ---- 导入保护（口径⑫） ----
function taFavExtractSubtree() {
  var cats = STORE.categories || [], subs = STORE.subcategories || [], cards = STORE.cards || [];
  return {
    cat: cats.filter(function(c) { return c && c.id === TAF_CAT_ID; }),
    subs: subs.filter(function(s) { return s && (s.id === TAF_SUB_ID || s.categoryId === TAF_CAT_ID); }),
    cards: cards.filter(function(c) { return c && c.categoryId === TAF_CAT_ID; })
  };
}

function taFavMergeSubtree(tree) {
  if (!tree) return { restored: 0 };
  var cats = STORE.categories || [], subs = STORE.subcategories || [], cards = STORE.cards || [];
  var catIds = {}, subIds = {}, cardIds = {}, texts = {}, keyToId = {};
  cats.forEach(function(c) { if (c && c.id) catIds[c.id] = 1; });
  subs.forEach(function(s) { if (s && s.id) subIds[s.id] = 1; });
  cards.forEach(function(c) {
    if (!c) return;
    if (c.id) cardIds[c.id] = 1;
    if (c.text) {
      var k = String(c.text).trim().toLowerCase();
      texts[k] = 1;
      if (c.id && !keyToId[k]) keyToId[k] = c.id;
    }
  });

  var changedCat = false, changedSub = false;
  (tree.cat || []).forEach(function(c) { if (c && c.id && !catIds[c.id]) { cats.push(c); catIds[c.id] = 1; changedCat = true; } });
  if (!catIds[TAF_CAT_ID]) { cats.push({ id: TAF_CAT_ID, name: TAF_CAT_NAME, hidden: false }); catIds[TAF_CAT_ID] = 1; changedCat = true; }
  (tree.subs || []).forEach(function(s) { if (s && s.id && !subIds[s.id]) { subs.push(s); subIds[s.id] = 1; changedSub = true; } });
  if (!subIds[TAF_SUB_ID]) { subs.push({ id: TAF_SUB_ID, name: TAF_SUB_NAME, categoryId: TAF_CAT_ID, hidden: false }); subIds[TAF_SUB_ID] = 1; changedSub = true; }

  var restored = 0;
  var treeTextOf = {};
  (tree.cards || []).forEach(function(c) {
    if (!c || !c.text) return;
    var k = String(c.text).trim().toLowerCase();
    if (c.id) treeTextOf[c.id] = k;
    if (texts[k]) return;                      // 按 text 去重：同一句话不出现两张
    if (c.id && cardIds[c.id]) return;         // 按 id 去重：新库碰巧同 id 也不打架
    cards.push(c);
    texts[k] = 1;
    if (c.id) { cardIds[c.id] = 1; if (!keyToId[k]) keyToId[k] = c.id; }
    restored++;
  });

  if (changedCat) STORE.categories = cats;
  if (changedSub) STORE.subcategories = subs;
  if (restored) STORE.cards = cards;

  // 记录里的 cardId 若已不在库中（那句话恰好在新库别处），改指向现存的那张卡，
  // 这样备注不会因为一次导入就断掉。
  var recs = STORE.taFavs || [], recChanged = false;
  recs.forEach(function(r) {
    if (!r || !r.cardId) return;
    if (cardIds[r.cardId]) return;
    var k = treeTextOf[r.cardId];
    if (k && keyToId[k] && keyToId[k] !== r.cardId) { r.cardId = keyToId[k]; recChanged = true; }
  });
  if (recChanged) STORE.taFavs = recs;

  return { restored: restored, cats: changedCat, subs: changedSub, remapped: recChanged };
}

// ============ Memory Library Rendering ============
function renderMemoryLibrary(container) {
  var memories = getMemoryList();
  var speakerMap = { me: '我', mengjiao: '梦角', general: '共同背景' };
  var sourceMap = { ai_approved: 'AI审批', manual: '手动导入' };

  var html = '<div class="mem-page">'
    + '<div style="text-align:center;padding:0 0 14px;">'
    + '<button class="btn-mem-import" id="btnMemImport">📥 导入历史记忆</button>'
    + '<span class="mem-import-hint" style="display:block;font-size:11px;color:var(--text-muted);margin-top:6px;">点击弹出导入框，支持我：/梦角：前缀</span>'
    + '</div>';

  if (memories.length === 0) {
    html += '<div class="mem-empty">🧠 暂无记忆</div>';
  } else {
    memories.forEach(function(mem) {
      var speakerLabel = speakerMap[mem.speaker] || mem.speaker;
      var sourceLabel = sourceMap[mem.source] || mem.source;
      var sourceIcon = mem.source === 'manual' ? '📥 ' : '🤖 ';
      var timeStr = mem.timestamp ? new Date(mem.timestamp).toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '';
      var speakerCls = mem.speaker === 'me' ? 'speaker-me' : (mem.speaker === 'mengjiao' ? 'speaker-mengjiao' : 'speaker-general');
      var sourceCls = mem.source === 'ai_approved' ? 'source-ai' : 'source-manual';
      html += '<div class="mem-item" data-speaker="' + mem.speaker + '">'
        + '<div class="mem-item-content" title="' + escapeHtml(mem.content) + '">' + escapeHtml(mem.content) + '</div>'
        + '<div class="mem-item-meta">'
        + '<span class="mem-tag ' + speakerCls + '">' + speakerLabel + '</span>'
        + '<span class="mem-tag ' + sourceCls + '">' + sourceIcon + sourceLabel + '</span>'
        + '</div>'
        + '<div class="mem-time">' + timeStr + '</div>'
        + '<div class="mem-item-actions">'
        + '<button class="mem-edit" data-mid="' + mem.id + '" title="编辑">✏️</button>'
        + '<button class="mem-del" data-mid="' + mem.id + '" title="删除">✕</button>'
        + '</div>'
        + '</div>';
    });
  }
  html += '</div>';
  container.innerHTML = html;

  // Bind import button → show modal
  var importBtn = container.querySelector('#btnMemImport');
  if (importBtn) {
    importBtn.addEventListener('click', function() {
      showModal('<h3>📥 导入历史记忆</h3>'
        + '<div class="mem-import-modal">'
        + '<textarea id="memImportText" rows="8" placeholder="每行一条记忆&#10;例如：我：今天去公园散步了&#10;例如：梦角：加油！冲啊！&#10;例如：两个人都喜欢雨天" style="width:100%;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;line-height:1.6;background:var(--bg-warm);resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;line-height:1.6;">📌 每行一条记忆<br>支持前缀：<b>我：</b>、<b>梦角：</b> —— 或直接输入（视为共同背景）</div>'
        + '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;">'
        + '<button class="btn-primary" id="memImportConfirm" style="padding:8px 20px;">✅ 确认导入</button>'
        + '<span id="memImportStatus" style="font-size:12px;color:var(--brand-green);font-weight:600;"></span>'
        + '</div></div>');

      document.getElementById('memImportConfirm').addEventListener('click', function() {
        var textarea = document.getElementById('memImportText');
        var status = document.getElementById('memImportStatus');
        if (!textarea) return;
        var raw = textarea.value.trim();
        if (!raw) { alert('请输入要导入的记忆内容'); return; }
        var lines = raw.split(/[\n\r]+/).map(function(l) { return l.trim(); }).filter(function(l) { return l; });
        var combined = lines.join("\n");
        saveMemory({ content: combined, speaker: 'general', source: 'manual' });
        if (status) status.textContent = '✅ 成功导入 1 组对话（共 ' + lines.length + ' 条消息）';
        textarea.value = '';
        renderMemoryLibrary(container);
      });
    });
  }

  // Bind delete buttons
  container.querySelectorAll('.mem-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var mid = this.dataset.mid;
      if (!confirm('确定删除这条记忆吗？')) return;
      deleteMemory(mid);
      renderMemoryLibrary(container);
    });
  });

  // Bind edit buttons → inline edit
  container.querySelectorAll('.mem-edit').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var mid = this.dataset.mid;
      var memories = getMemoryList();
      var mem = memories.find(function(m) { return m.id === mid; });
      if (!mem) return;

      var item = this.closest('.mem-item');
      if (!item) return;
      var contentDiv = item.querySelector('.mem-item-content');
      if (!contentDiv) return;
      var actions = item.querySelector('.mem-item-actions');
      if (!actions) return;

      // Replace content with textarea
      var origContent = mem.content;
      contentDiv.innerHTML = '<div class="mem-edit-area">'
        + '<textarea class="mem-edit-textarea" rows="3">' + escapeHtml(origContent) + '</textarea>'
        + '<div class="mem-edit-actions">'
        + '<button class="mem-edit-save">保存</button>'
        + '<button class="mem-edit-cancel">取消</button>'
        + '</div></div>';

      // Hide edit/del buttons while editing
      actions.style.display = 'none';

      // Save
      var saveBtn = contentDiv.querySelector('.mem-edit-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var newText = contentDiv.querySelector('.mem-edit-textarea').value.trim();
          if (!newText) { alert('内容不能为空'); return; }
          updateMemory(mid, newText);
          renderMemoryLibrary(container);
        });
      }

      // Cancel
      var cancelBtn = contentDiv.querySelector('.mem-edit-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          renderMemoryLibrary(container);
        });
      }
    });
  });
}
