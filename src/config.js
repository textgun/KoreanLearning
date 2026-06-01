/* =========================================================
   CONFIG
   ========================================================= */
const LANGS = [
  { code: 'en', name: 'English',      flag: '🇺🇸' },
  { code: 'zh', name: '中文',         flag: '🇨🇳' },
  { code: 'ja', name: '日本語',       flag: '🇯🇵' },
  { code: 'th', name: 'ภาษาไทย',    flag: '🇹🇭' },
  { code: 'es', name: 'Español',     flag: '🇪🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ne', name: 'नेपाली',      flag: '🇳🇵' },
  { code: 'hi', name: 'हिन्दी',      flag: '🇮🇳' }
];

const SAMPLE_UNIT = {
  id: 1,
  title: '9단원 - 공원에서 산책했어요',
  vocabulary: [
    { word: '영화관', romanization: 'yeong-hwa-gwan', emoji: '🎦', translations: { en: 'movie theater', zh: '电影院', ja: '映画館', th: 'โรงภาพยนตร์', es: 'cine', vi: 'rạp chiếu phim', ne: 'चलचित्र हल', hi: 'सि네마 हॉल' }},
    { word: '백화점', romanization: 'baek-hwa-jeom', emoji: '🏬', translations: { en: 'department store', zh: '百货商店', ja: 'デパート', th: 'ห้างสรรพสินค้า', es: 'grandes almacenes', vi: 'cửa hàng bách hóa', ne: 'ডিপार्ट메न्ट स्टोर', hi: 'डिपार्टमेंट स्टोर' }},
    { word: '놀이공원', romanization: 'no-ri-gong-won', emoji: '🎡', translations: { en: 'amusement park', zh: '游乐场', ja: '遊園地', th: 'สวนสนุก', es: 'parque de atracciones', vi: 'công viên giải trí', ne: 'मनोरञ्जन पार्क', hi: 'मनोरंजन पार्क' }},
    { word: '도서관', romanization: 'do-seo-gwan', emoji: '📚', translations: { en: 'library', zh: '图书馆', ja: '図書館', th: 'ห้องสมุด', es: 'biblioteca', vi: 'thư viện', ne: 'पुस्तकालय', hi: 'पुस्तकालय' }},
    { word: '박물관', romanization: 'bak-mul-gwan', emoji: '🏛', translations: { en: 'museum', zh: '博物馆', ja: '博物館', th: 'พิพิธภัณฑ์', es: 'museo', vi: 'bảo tàng', ne: 'संग्रहालय', hi: 'संग्रहालय' }},
    { word: '수영장', romanization: 'su-yeong-jang', emoji: '🏊', translations: { en: 'swimming pool', zh: '游泳池', ja: 'プール', th: 'สระว่ายน้ำ', es: 'piscina', vi: 'hồ bơi', ne: 'पौडी पोखरी', hi: 'तैराकी का तालाब' }},
    { word: '공원', romanization: 'gong-won', emoji: '🌿', translations: { en: 'park', zh: '公园', ja: '공원', th: 'สวนสาธารณะ', es: 'parque', vi: 'công viên', ne: 'बगैंचा', hi: 'पार्क' }},
    { word: '산책하다', romanization: 'san-chae-ka-da', emoji: '🚶', translations: { en: 'to take a walk', zh: '散步', ja: '散歩する', th: 'เดินเล่น', es: 'pasear', vi: 'đi dạo', ne: 'हिँड्न जानु', hi: 'टहलना' }},
    { word: '쇼핑하다', romanization: 'syo-ping-ha-da', emoji: '🛍', translations: { en: 'to shop', zh: '购物', ja: '買い物する', th: 'ช้อปปิ้ง', es: 'comprar', vi: 'mua sắm', ne: 'किन멜 गर्नु', hi: 'खरीदारी करना' }},
    { word: '자전거를 타다', romanization: 'ja-jeon-geo-reul ta-da', emoji: '🚴', translations: { en: 'to ride a bike', zh: '骑自行车', ja: '自転車に乗る', th: 'ขี่จักรยาน', es: 'andar en bici', vi: 'đi xe đạp', ne: 'साइकल चलाउनु', hi: 'साइकल चलाना' }}
  ],
  grammar: [
    {
      pattern: '~에서 (장소)',
      explanation: { en: 'Particle attached to a place noun, indicating where an action takes place.', zh: '附加在场所名词后，表示动作发生的地点。', ja: '場所を表す名詞에付き、動作が行われる場所を示します。', th: 'คำภาคีที่ติดกับคำนามสถานที่ บ่งบอกสถานที่ที่การกระทำเกิดขึ้น', es: 'Partícula que se añade a un lugar para indicar dónde ocurre la acción.', vi: 'Trợ từ gắn với danh từ chỉ nơi chốn.', ne: 'स्थान बताउने शब्द요जी — क्रिया कहाँ हुन्छ भनी देखाउँछ।', hi: 'स्थान सूचक कण — बताता है कि क्रिया कहाँ होती है।' },
      examples: [
        { ko: '집에서 청소해요.', en: 'I clean at home.' },
        { ko: '회사에서 일해요.', en: 'I work at the company.' },
        { ko: '공원에서 산책해요.', en: 'I walk in the park.' }
      ]
    },
    {
      pattern: '-었/았 (과거형)',
      explanation: { en: 'Past tense marker attached to verbs/adjectives. Use 았 after vowels ㅏ/ㅗ, 었 after others.', zh: '过去时态标记，附加于动词和形容词。', ja: '動詞・形容詞의語幹に付く過去形語尾。', th: 'เครื่องหมายอดีตติดกับกริยา/คุณศัพท์', es: 'Marca de pasado para verbos y adjetivos.', vi: 'Dấu hiệu quá khứ gắn với động/tính từ.', ne: 'क्रिया/विशेषणमा लाग्ने भूतकालको प्रत्यय।', hi: 'क्रिया/विशेषण के साथ लगने वाला भूतकाल का प्रत्यय।' },
      examples: [
        { ko: '도서관에서 책을 읽었어요.', en: 'I read a book at the library.' },
        { ko: '날씨가 좋았어요.', en: 'The weather was good.' },
        { ko: '친구를 만났어요.', en: 'I met a friend.' }
      ]
    }
  ],
  quizzes: [
    { question: '도서관 ___ 책을 읽어요', options: ['에서', '이', '을', '은'], correct: 0, hint: { en: 'I read a book at the library.', zh: '我在지구관에서 책을 읽어요.', ja: '図書館で本を読みます。', th: 'ฉันอ่านหนังสือที่ห้องสมุด', es: 'Leo un libro en la biblioteca.', vi: 'Tôi đọc sách ở thư viện.', ne: 'म पुस्तकालयमा किताब पढ्छु।', hi: 'मैं पुस्तकालय में किताब पढ़ता हूँ।' }},
    { question: '공원 ___ 산책해요.', options: ['이', '에서', '를', '은'], correct: 1, hint: { en: 'I take a walk at the park.', zh: '我在공원에서 산책해요.', ja: '公園で散歩します。', th: 'ฉันเดินเล่นที่สวน', es: 'Paseo en el parque.', vi: 'Tôi đi dạo ở công viên.', ne: 'म बगैंचामा हिँड्छु।', hi: 'मैं पार्क में टहलता हूँ।' }},
    { question: '어제 친구를 ___.', options: ['만나요', '만났어요', '만날 거예요', '만나'], correct: 1, hint: { en: 'I met a friend yesterday. (past tense)', zh: '어제 친구를 만났어요.', ja: '昨日友達에会いました。', th: 'เมื่อวานฉันพบเพื่อน', es: 'Ayer vi a un amigo.', vi: 'Hôm qua tôi gặp bạn.', ne: 'हिजो साथीलाई भेटें। (भूतकाल)', hi: 'कल मैं दोस्त से मिला। (भूतकाल)' }},
    { question: '토요일에 도서관에서 책을 ___.', options: ['읽어요', '읽을 거예요', '읽었어요', '읽다'], correct: 2, hint: { en: 'I read a book at the library on Saturday. (past)', zh: '토요일에 도서관에서 책을 읽었어요.', ja: '土曜日に図書館で本を読みました。', th: 'วันเสาร์ฉันอ่านหนังสือที่ห้องสมุด', es: 'El sábado leí en la biblioteca.', vi: 'Thứ bảy tôi đọc sách ở thư viện.', ne: 'शनिबार पुस्तकालयमा किताब पढें।', hi: 'शनिवार को पुस्तकालय में किताब पढ़ी।' }},
    { question: '날씨가 아주 ___.', options: ['좋다', '좋아요', '좋았어요', '좋을 거예요'], correct: 2, hint: { en: 'The weather was very good. (past)', zh: '날씨가 아주 좋았어요.', ja: '天気がとても良かったです。', th: 'อากาศดีมาก', es: 'El tiempo estuvo muy bueno.', vi: 'Thời tiết rất đẹp.' }},
    { question: '백화점 ___ 쇼핑했어요', options: ['에서', '이', '을', '은'], correct: 0, hint: { en: 'I shopped at the department store.', zh: '백화점에서 쇼핑했어요.', ja: 'デパートで買い物しました。', th: 'ฉันช้อปปิ้งที่ห้าง', es: 'Compré en la tienda.', vi: 'Tôi mua sắm ở cửa hàng.' }}
  ]
};

const ACTIVITIES = {
  flashcard: { name: '단어카드',      icon: 'copy',           type: 'vocab',   desc: '단어 카드' },
  quiz:      { name: '4지선다 퀴즈', icon: 'help-circle',    type: 'vocab',   desc: '답 맞히기' },
  matching:  { name: '매칭 게임',    icon: 'puzzle',         type: 'vocab',   desc: '쌍 맞추기' },
  fillblank: { name: '빈칸 채우기',  icon: 'edit-3',         type: 'grammar', desc: '문장 완성' },
  sentorder: { name: '문장 순서',    icon: 'align-left',     type: 'grammar', desc: '단어 배열' },
  oxquiz:    { name: 'OX 퀴즈',      icon: 'check-square',   type: 'grammar', desc: '문법 판단' },
  pdfquiz:   { name: 'PDF 퀴즈',     icon: 'file-text',      type: 'pdfquiz', desc: '학습지 문제' }
};

const PROVIDERS = {
  anthropic: { name: 'Anthropic', icon: 'cpu',       models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'], keyHint: 'sk-ant-api03-...' },
  openai:    { name: 'OpenAI',    icon: 'sparkles',  models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], keyHint: 'sk-proj-...' },
  gemini:    { name: 'Gemini',    icon: 'brain',     models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'], keyHint: 'AIzaSy...' },
  groq:      { name: 'Groq',      icon: 'zap',       models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'], keyHint: 'gsk_...' }
};
