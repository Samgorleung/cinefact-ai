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
    audienceType: "Software Engineers, AI Researchers, Tech Leads"
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
    audienceType: "Macro Investors & Cultural Analysts"
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
    audienceType: "Aerospace Enthusiasts, Physicists, Engineers"
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
    audienceType: "Venture Capitalists, Founders & Compliance Officers"
  }
];

// Alias for backward compatibility if imported elsewhere
export const CANTONESE_TEMPLATES = UNIVERSAL_VIDEO_PRESETS;
