import { VideoTemplate, ProcessedClip, Subtitle, SearchQuery } from "./types.js";

export * from "./types.js";

export const UNIVERSAL_VIDEO_PRESETS: VideoTemplate[] = [
  {
    id: "tech-gemini-ai",
    title: "Multimodal AI Agents & Scalable Autonomous Workflows",
    language: "English (US)",
    category: "Technology & Engineering",
    duration: 180,
    description: "An in-depth breakdown of multimodal foundation models, agentic reasoning loops, real-time code synthesis, and low-latency API architectures.",
    transcript: `Welcome everyone. Today we are examining the next paradigm shift in software engineering: autonomous multimodal AI agents. Why is this transition from single-turn chat to persistent, self-healing agentic workflows such a massive leap? First, modern foundation models like Gemini 3.7 Flash do not just parse text; they process high-dimensional video streams, visual canvases, and structured ASTs natively. By combining speculative decoding with instant tool orchestration, response latency drops below 200 milliseconds. When an agent detects a failing integration test, it autonomously inspects stack traces, formulates a hypothesis, generates candidate patches, and verifies compilation in real-time. This eliminates developer toil and accelerates development cycles by more than ten-fold.`,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    aspectRatio: "16:9",
    audienceType: "Software Engineers, AI Researchers, Tech Leads",
    clipStart: "00:10",
    clipEnd: "00:55",
    viralityScore: 96,
    highlightReason: "High-density technical insight explaining sub-200ms multimodal agent latency and automated AST self-healing loops.",
    subtitles: [
      { id: "sub-1", start: 10000, end: 14500, text: "Why is this transition from single-turn chat to persistent agentic workflows such a leap?" },
      { id: "sub-2", start: 14500, end: 19000, text: "Modern foundation models like Gemini 3.7 Flash do not just parse text." },
      { id: "sub-3", start: 19000, end: 24500, text: "They process high-dimensional video streams, visual canvases, and structured ASTs natively." },
      { id: "sub-4", start: 24500, end: 30000, text: "By combining speculative decoding with instant tool orchestration, latency drops below 200ms." },
      { id: "sub-5", start: 30000, end: 36000, text: "When an agent detects a failing test, it inspects stack traces and formulates hypotheses." },
      { id: "sub-6", start: 36000, end: 42000, text: "It generates candidate patches and verifies compilation in real-time." },
      { id: "sub-7", start: 42000, end: 48000, text: "This eliminates developer toil and accelerates development cycles by over ten-fold." },
      { id: "sub-8", start: 48000, end: 55000, text: "Autonomous self-healing engineering workflows are now production ready." }
    ],
    searchQueries: [
      {
        query: "Gemini 3.7 Flash speculative decoding sub-200ms latency benchmarks",
        purpose: "Verify the architectural latency claims and multimodal AST processing speeds.",
        category: "Statistical Claim",
        targetClaim: "Gemini 3.7 Flash speculative decoding achieves sub-200ms response latency."
      },
      {
        query: "Autonomous AI agents AST inspection automated bug fixing compilation",
        purpose: "Validate real-time code synthesis and self-healing agent test verification.",
        category: "Historical & Factual",
        targetClaim: "Agents autonomously inspect stack traces, formulate hypotheses, and verify compilation."
      },
      {
        query: "Multimodal video stream processing foundation models token throughput",
        purpose: "Assess video stream grounding capabilities across modern multimodal LLMs.",
        category: "Regulatory & Policy",
        targetClaim: "Native high-dimensional video and visual canvas processing in foundation models."
      }
    ]
  },
  {
    id: "cha-chaan-teng",
    title: "Hong Kong Diner Culture & Supply Chain Economics (茶餐廳通脹經濟學)",
    language: "Cantonese (香港粵語)",
    category: "Macro Economics & Food Culture",
    duration: 180,
    description: "An analytical deep-dive into how traditional Hong Kong cha chaan teng diner culture reflects global supply chain dynamics, hyper-efficiency, and local currency movements.",
    transcript: `大家好，今日同大家傾下香港最地道嘅茶餐廳文化。點解一杯絲襪奶茶、一碟乾炒牛河，背後可以反映出香港幾十年嚟嘅經濟轉變同埋效率至上嘅精神？首先，茶餐廳嘅出餐速度係世界第一。由你落單，到碟乾炒牛河送到你面前，平均只需要三至五分鐘。呢個速度背後，係一個極度優化嘅廚房運作系統同埋高度分工。但係，隨住全球供應鏈通脹，進口茶葉、牛肉同埋麵粉嘅成本大幅攀升，茶餐廳面臨緊前所未有嘅成本壓力。特別係港幣匯率同租金高企嘅雙重夾擊之下，好多老字號不得不進行數碼轉型，引入智能點餐系統。呢種在極端壓力下展現出嘅靈活性同韌性，正正就係香港經濟精神嘅縮影。`,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    aspectRatio: "16:9",
    audienceType: "Macro Investors & Cultural Analysts",
    clipStart: "00:08",
    clipEnd: "00:53",
    viralityScore: 94,
    highlightReason: "Captivating economic breakdown linking Hong Kong's 3-minute diner service speed to global supply chain cost shocks.",
    subtitles: [
      { id: "sub-1", start: 8000, end: 13500, text: "點解一杯絲襪奶茶、一碟乾炒牛河，背後可以反映出香港幾十年嚟嘅經濟轉變？" },
      { id: "sub-2", start: 13500, end: 18000, text: "首先，茶餐廳嘅出餐速度係世界第一。" },
      { id: "sub-3", start: 18000, end: 23500, text: "由你落單到碟乾炒牛河送到你面前，平均只需要三至五分鐘。" },
      { id: "sub-4", start: 23500, end: 29000, text: "呢個速度背後，係一個極度優化嘅廚房運作系統同埋高度分工。" },
      { id: "sub-5", start: 29000, end: 35000, text: "但隨住全球供應鏈通脹，進口茶葉、牛肉同麵粉成本大幅攀升。" },
      { id: "sub-6", start: 35000, end: 41000, text: "喺港幣匯率同租金高企嘅雙重夾擊下，茶餐廳面臨緊巨大壓力。" },
      { id: "sub-7", start: 41000, end: 47000, text: "好多老字號進行數碼轉型，引入智能點餐與供應鏈管理。" },
      { id: "sub-8", start: 47000, end: 53000, text: "呢種極端壓力下展現嘅靈活性，正正係香港經濟精神嘅縮影。" }
    ],
    searchQueries: [
      {
        query: "Hong Kong Intangible Cultural Heritage silk stocking milk tea craftsmanship",
        purpose: "Verify the official cultural heritage recognition of Hong Kong tea blending techniques.",
        category: "Historical & Factual",
        targetClaim: "Hong Kong silk stocking milk tea is recognized as an Intangible Cultural Heritage item."
      },
      {
        query: "Hong Kong restaurant industry inflation food import supply chain costs",
        purpose: "Examine macroeconomic statistics on beef, tea, and grain import price surges.",
        category: "Statistical Claim",
        targetClaim: "Global import price inflation severely impacts Hong Kong diner operating margins."
      },
      {
        query: "Hong Kong digital F&B POS smart ordering adoption rate",
        purpose: "Ground the trend of digital ordering adoption and kitchen automation.",
        category: "Regulatory & Policy",
        targetClaim: "Traditional cha chaan teng diners are accelerating adoption of digital POS systems."
      }
    ]
  },
  {
    id: "space-exploration",
    title: "Reusable Rockets & Deep Space Orbital Mechanics",
    language: "English (Global)",
    category: "Aerospace & Physics",
    duration: 210,
    description: "Analyzing the physics of supersonic retropropulsion, orbital refueling depots, and heat shield thermal dynamics during planetary re-entry.",
    transcript: `Orbital spaceflight has entered a revolution driven by rapid reusability and methane-fueled propulsion engines. The primary engineering challenge of heavy lift launch vehicles is not simply reaching orbital velocity of 7.8 kilometers per second, but surviving atmospheric re-entry. Supersonic retropropulsion allows orbital boosters to fire against hypersonic shockwaves, decelerating thousands of metric tons within the upper atmosphere. Furthermore, orbital propellant transfer enables missions to venture beyond Low Earth Orbit toward lunar gateways and Mars transfer trajectories. Precision autonomous landing grids ensure booster reuse within hours, driving launch costs down by orders of magnitude.`,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    aspectRatio: "16:9",
    audienceType: "Aerospace Enthusiasts, Physicists, Engineers",
    clipStart: "00:05",
    clipEnd: "00:50",
    viralityScore: 97,
    highlightReason: "Compelling aerospace physics detailing hypersonic retropropulsion and orbital propellant transfer economics.",
    subtitles: [
      { id: "sub-1", start: 5000, end: 10500, text: "Orbital spaceflight has entered a revolution driven by rapid reusability." },
      { id: "sub-2", start: 10500, end: 16000, text: "The primary engineering challenge is not simply reaching orbital velocity of 7.8 km/s." },
      { id: "sub-3", start: 16000, end: 21500, text: "It is surviving intense aerodynamic heating during atmospheric re-entry." },
      { id: "sub-4", start: 21500, end: 27000, text: "Supersonic retropropulsion fires rocket engines directly against hypersonic shockwaves." },
      { id: "sub-5", start: 27000, end: 33000, text: "This decelerates thousands of metric tons safely in the upper atmosphere." },
      { id: "sub-6", start: 33000, end: 39000, text: "Furthermore, orbital propellant transfer enables heavy missions beyond Low Earth Orbit." },
      { id: "sub-7", start: 39000, end: 45000, text: "Autonomous grid fins and landing thrusters enable booster recovery within hours." },
      { id: "sub-8", start: 45000, end: 50000, text: "Driving heavy-lift payload launch costs down by orders of magnitude." }
    ],
    searchQueries: [
      {
        query: "NASA supersonic retropropulsion flight test aerodynamic decelerator data",
        purpose: "Validate the aerodynamics and telemetry of supersonic retropropulsion re-entry.",
        category: "Historical & Factual",
        targetClaim: "Supersonic retropropulsion enables massive orbital booster re-entry deceleration."
      },
      {
        query: "Orbital velocity Low Earth Orbit 7.8 km per second physics calculations",
        purpose: "Check the exact orbital velocity requirements for LEO spaceflight.",
        category: "Statistical Claim",
        targetClaim: "Low Earth Orbit circular velocity is approximately 7.8 km/s."
      },
      {
        query: "Cryogenic orbital propellant transfer zero-g fluid dynamics NASA Artemis",
        purpose: "Assess technical feasibility and milestones for orbital refueling depots.",
        category: "Entity & Location",
        targetClaim: "Orbital propellant transfer is essential for deep-space lunar and interplanetary missions."
      }
    ]
  },
  {
    id: "ai-startup",
    title: "Multilingual AI in Regulated Fintech Markets (多模態AI合規機遇)",
    language: "Cantonese / English",
    category: "Fintech & Regulatory Law",
    duration: 210,
    description: "Evaluating market viability for native multilingual models and multimodal compliance validation layers in global wealth management.",
    transcript: `喺2026年嘅今日，好多人都問，香港做科技研發同埋創業仲有無機會？特別係全球生成式AI發展得咁快，英文同普通話嘅模型已經高度飽和。我地廣東話同混合語言嘅大型語言模型，點樣喺大灣區甚至國際市場中搵到獨特嘅定位？其實，繁體中文同廣東話嘅多模態處理，係一個極具潛力嘅藍海市場。廣東話有九個聲調，語法結構同書面語好唔同，仲有大量嘅中英夾雜同口語俗語。對於金融合規、跨境法律文書審查，以及本地客戶服務，通用模型嘅準確率往往不足。邊個能夠做出口語化廣東話同商業英語混合嘅精準語音識別與分析，邊個就能夠鎖定香港高淨值金融機構嘅龐大市場。`,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    aspectRatio: "16:9",
    audienceType: "Venture Capitalists, Founders & Compliance Officers",
    clipStart: "00:12",
    clipEnd: "00:57",
    viralityScore: 95,
    highlightReason: "High-value enterprise AI fintech analysis explaining Cantonese code-switching models in wealth management.",
    subtitles: [
      { id: "sub-1", start: 12000, end: 17500, text: "全球生成式AI發展得咁快，英文同普通話嘅基礎模型已經高度飽和。" },
      { id: "sub-2", start: 17500, end: 23000, text: "我地廣東話同混合語言嘅多模態模型，點樣喺市場中搵到獨特地位？" },
      { id: "sub-3", start: 23000, end: 29000, text: "繁體中文同廣東話嘅多模態合規處理，係一個極具潛力嘅藍海市場。" },
      { id: "sub-4", start: 29000, end: 35000, text: "廣東話有九個聲調，仲有大量口語俗語同中英夾雜Code-switching。" },
      { id: "sub-5", start: 35000, end: 41000, text: "對於金融合規同跨境法律審查，通用模型嘅準確率往往不足。" },
      { id: "sub-6", start: 41000, end: 47000, text: "能夠精準處理口語化廣東話同商業英語混合嘅專業模型..." },
      { id: "sub-7", start: 47000, end: 52000, text: "就能夠直接鎖定香港高淨值金融與財富管理機構嘅龐大需求。" },
      { id: "sub-8", start: 52000, end: 57000, text: "呢個係香港AI創業同專精化技術落地的絕佳機遇。" }
    ],
    searchQueries: [
      {
        query: "Cantonese nine tones linguistics code-switching speech recognition accuracy",
        purpose: "Verify phonetic and linguistic complexity of Cantonese code-switching in NLP models.",
        category: "Historical & Factual",
        targetClaim: "Cantonese features 9 distinct tones and complex English code-switching patterns."
      },
      {
        query: "Hong Kong SFC financial compliance AI automated regulatory document audit",
        purpose: "Examine Securities & Futures Commission regulations on algorithmic compliance.",
        category: "Regulatory & Policy",
        targetClaim: "Hong Kong financial institutions require localized multilingual compliance AI."
      },
      {
        query: "Hong Kong wealth management private banking assets under management statistics",
        purpose: "Confirm total market scale of high-net-worth wealth management in Hong Kong.",
        category: "Statistical Claim",
        targetClaim: "Hong Kong is a leading global wealth management and private banking hub."
      }
    ]
  }
];

// Alias for backward compatibility if imported elsewhere
export const CANTONESE_TEMPLATES = UNIVERSAL_VIDEO_PRESETS;
