import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateRoundWords } from './services/geminiService';
import { GameCanvas } from './components/GameCanvas';
import { GameState, Difficulty, CATEGORIES, WordBubble, RoundData, Achievement, PopResult, GameMode, Theme } from './types';
import { playSound } from './services/audio';

// --- Icons ---
const TapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
);

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
);

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#f59e0b" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-0.5 transform transition-all duration-500 hover:scale-110">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

// --- Brand Logo ---
const WonderLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    {/* Open Book Shape */}
    <path d="M10 50 Q 30 50 50 70 Q 70 50 90 50 L 90 85 Q 70 85 50 95 Q 30 85 10 85 Z" fill="url(#logoGradient)" />
    {/* Page Lines */}
    <path d="M15 60 Q 30 60 45 72" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
    <path d="M55 72 Q 70 60 85 60" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
    
    {/* Rising W Star */}
    <path d="M30 35 L 40 60 L 50 40 L 60 60 L 70 35" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="25" r="8" fill="#fbbf24" className="animate-pulse" />
    <circle cx="70" cy="15" r="4" fill="#fbbf24" fillOpacity="0.7" />
    <circle cx="30" cy="15" r="4" fill="#fbbf24" fillOpacity="0.7" />
  </svg>
);

// --- Achievement Definitions ---
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'rookie', title: '初出茅庐', description: 'Score 800+', icon: '🌱', unlocked: false },
  { id: 'speedster', title: '眼疾手快', description: 'Score 1500+', icon: '⚡', unlocked: false },
  { id: 'sharpshooter', title: '百步穿杨', description: 'Score 2000+', icon: '🎯', unlocked: false },
  { id: 'legend', title: '传奇玩家', description: 'Score 2500+', icon: '👑', unlocked: false },
  { id: 'comboMaster', title: 'Combo Master', description: 'Reach 10x Combo', icon: '🔥', unlocked: false },
  { id: 'lightning', title: 'Lightning Reflexes', description: 'Get 5 Speed Bonuses', icon: '🐆', unlocked: false },
];

const App: React.FC = () => {
  // --- User State ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- Game Config State ---
  const [gameState, setGameState] = useState<GameState>(GameState.LOGIN);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [gameDuration, setGameDuration] = useState<number>(60);
  const [theme, setTheme] = useState<Theme>('TECH');
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.FIND_INTRUDER);
  
  // --- Gameplay State ---
  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({
      base: 0,
      combo: 0,
      speed: 0,
      penalty: 0
  });

  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [bubbles, setBubbles] = useState<WordBubble[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Preparing...");
  
  // Game stats for achievements
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gamesPlayedSession, setGamesPlayedSession] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [speedBonusCount, setSpeedBonusCount] = useState(0);
  
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('wordNinjaAchievements');
    if (saved) {
      const parsed = JSON.parse(saved);
      return INITIAL_ACHIEVEMENTS.map(init => {
        const found = parsed.find((p: Achievement) => p.id === init.id);
        return found ? { ...init, unlocked: found.unlocked } : init;
      });
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const timerRef = useRef<number | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  // --- Effects ---

  // Timer Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Persist Achievements
  useEffect(() => {
    localStorage.setItem('wordNinjaAchievements', JSON.stringify(achievements));
  }, [achievements]);


  // --- Logic ---

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === 'Wonder') {
          setGameState(GameState.MENU);
          setLoginError("");
      } else {
          setLoginError("Incorrect password. Hint: Wonder");
      }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['TECH', 'CYBERPUNK', 'NATURE'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('gameOver');
    setGamesPlayedSession(prev => prev + 1);

    // Check Achievements
    const newAchievements = [...achievements];
    let achievementUnlocked = false;

    const unlock = (id: string) => {
        const idx = newAchievements.findIndex(a => a.id === id);
        if (idx !== -1 && !newAchievements[idx].unlocked) {
            newAchievements[idx].unlocked = true;
            achievementUnlocked = true;
        }
    }

    if (score >= 800) unlock('rookie');
    if (score >= 1500) unlock('speedster');
    if (score >= 2000) unlock('sharpshooter');
    if (score >= 2500) unlock('legend');
    if (maxCombo >= 10) unlock('comboMaster');
    if (speedBonusCount >= 5) unlock('lightning');

    if (achievementUnlocked) {
        setAchievements(newAchievements);
    }
  };

  const startRound = useCallback(async () => {
    const data: RoundData = await generateRoundWords(category, difficulty, gameMode);
    
    // Prepare bubbles
    const newBubbles: WordBubble[] = [];
    const allWords = data.words;

    // Shuffle layout positions
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cx = width / 2;
    const cy = height * 0.55; 
    const radius = Math.min(width, height) * 0.35; 

    // Dynamic Anchors
    const count = allWords.length;
    const anchors = [];
    for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI / count) - Math.PI / 2; 
        anchors.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius
        });
    }

    // Color generation based on theme
    let baseHue = Math.random() * 360; 
    let satBase = 70;
    let lightBase = 55;

    if (theme === 'CYBERPUNK') {
        // Neon colors: Hot Pink, Lime, Cyan
        const neons = [320, 120, 180, 280]; 
        baseHue = neons[Math.floor(Math.random() * neons.length)];
        satBase = 90;
        lightBase = 60;
    } else if (theme === 'NATURE') {
        // Earth/Green tones
        const earth = [100, 150, 40, 30]; 
        baseHue = earth[Math.floor(Math.random() * earth.length)];
        satBase = 50;
        lightBase = 45;
    }
    
    allWords.forEach((item, index) => {
      const hue = baseHue + (Math.random() * 30 - 15); 
      const sat = satBase + Math.random() * 20;
      const light = lightBase + Math.random() * 10;
      
      newBubbles.push({
        id: `b-${Date.now()}-${index}`,
        text: item.text,
        isTarget: item.isTarget, // In Mode 1: Intruder. In Mode 2: Category Member.
        x: cx,
        y: cy, 
        anchorX: anchors[index].x,
        anchorY: anchors[index].y,
        vx: 0,
        vy: 0,
        radius: 70, 
        color: `hsla(${hue}, ${sat}%, ${light}%, 0.6)`,
        isPopped: false,
        scale: 1,
        phaseOffset: Math.random() * Math.PI * 2
      });
    });

    setBubbles(newBubbles);
    roundStartTimeRef.current = Date.now(); // Track when round visually starts
  }, [category, difficulty, theme, gameMode]);

  const startGame = async () => {
    setScore(0);
    setScoreBreakdown({ base: 0, combo: 0, speed: 0, penalty: 0 });
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setSpeedBonusCount(0);
    setTimeLeft(gameDuration);
    setGameState(GameState.LOADING_ROUND);
    setLoadingMessage("Get Ready!");
    
    playSound('pop'); 
    
    await startRound();
    setGameState(GameState.PLAYING);
  };

  // Interaction logic
  const handleBubblePop = useCallback((bubble: WordBubble): PopResult => {
    setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, isPopped: true } : b));
    playSound('pop');

    if (bubble.isTarget) {
      // Correct Hit
      playSound('correct');
      
      // Calculations
      const now = Date.now();
      const timeTaken = now - roundStartTimeRef.current;
      const isSpeedBonus = timeTaken < 1500; // 1.5s threshold
      
      // Update Combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      // --- SCORING LOGIC UPDATED ---
      const basePoints = 100;
      
      // Combo Tiers: 1-5 (+10ea), 6-10 (+15ea), 11+ (+20ea)
      let comboMultiplier = 10;
      if (newCombo >= 6 && newCombo <= 10) comboMultiplier = 15;
      if (newCombo >= 11) comboMultiplier = 20;
      
      const comboBonus = newCombo * comboMultiplier;

      const speedBonus = isSpeedBonus ? 50 : 0;
      const totalPoints = basePoints + comboBonus + speedBonus;

      // Update State
      setScore(s => s + totalPoints);
      setScoreBreakdown(prev => ({
          ...prev,
          base: prev.base + basePoints,
          combo: prev.combo + comboBonus,
          speed: prev.speed + speedBonus
      }));

      setHits(h => h + 1);
      if (isSpeedBonus) setSpeedBonusCount(c => c + 1);

      // Schedule next round
      setTimeout(() => {
        startRound();
      }, 400); 

      let label = `+${totalPoints}`;
      if (newCombo > 1) label += ` Combo x${newCombo}!`;
      if (isSpeedBonus) label += ` ⚡`;

      return {
          scoreDelta: totalPoints,
          label: label,
          color: '#4ade80' // Green
      };

    } else {
      // Wrong Hit
      playSound('wrong');
      const penalty = 50;
      setScore(s => Math.max(0, s - penalty));
      setScoreBreakdown(prev => ({
          ...prev,
          penalty: prev.penalty + penalty
      }));
      setMisses(m => m + 1);
      setCombo(0); // Reset Combo

      return {
          scoreDelta: -penalty,
          label: `-${penalty}`,
          color: '#ef4444' // Red
      };
    }
  }, [combo, maxCombo, startRound]);


  const returnToMenu = () => {
      setScore(0);
      setGameState(GameState.MENU);
  };

  // --- Score Helpers ---
  const getStars = (finalScore: number) => {
      if (finalScore >= 2500) return 3;
      if (finalScore >= 1500) return 2;
      if (finalScore >= 800) return 1;
      return 0;
  };

  const getTitle = (finalScore: number) => {
      if (finalScore >= 2500) return "传奇玩家 👑";
      if (finalScore >= 2000) return "百步穿杨 🎯";
      if (finalScore >= 1500) return "眼疾手快 ⚡";
      if (finalScore >= 800) return "初出茅庐 🌱";
      return "新手上路 🥚";
  };

  // --- Render Components ---

  const renderLogin = () => (
      <div className="relative z-50 w-full px-4 flex justify-center animate-fade-in-up pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-cyan-500/30 p-8 w-full max-w-sm flex flex-col items-center">
              <div className="mb-6 relative group text-center flex flex-col items-center">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <WonderLogo className="w-20 h-20 text-cyan-400 mb-2 relative z-10 filter drop-shadow-lg" />
                  <h1 className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 tracking-tighter">
                      WonderEnglish
                  </h1>
                  <div className="text-center text-cyan-500/80 text-[10px] tracking-[0.3em] mt-1 font-bold uppercase">新知旺豆</div>
              </div>
              
              <form onSubmit={handleLogin} className="w-full space-y-4">
                  <div>
                      <label className="block text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1">Agent Name</label>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-center font-mono placeholder-slate-600"
                        placeholder="Your Name"
                        required
                      />
                  </div>
                  <div>
                      <label className="block text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1">Passcode</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-center font-mono placeholder-slate-600"
                        placeholder="••••••"
                        required
                      />
                      {loginError && <div className="text-red-400 text-xs mt-2 text-center font-bold">{loginError}</div>}
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform">
                      ENTER SYSTEM
                  </button>
              </form>
          </div>
      </div>
  );

  const renderMedalGrid = () => (
    <div className="grid grid-cols-2 gap-2 mt-2">
        {achievements.map(ach => (
            <div key={ach.id} className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}>
                <div className="text-2xl">{ach.icon}</div>
                <div className="overflow-hidden">
                    <div className={`font-bold text-xs truncate ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{ach.description}</div>
                </div>
            </div>
        ))}
    </div>
  );

  const renderMenu = () => (
    <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row gap-4 p-4 animate-fade-in-up pointer-events-auto items-stretch h-full max-h-screen overflow-hidden">
      
      {/* Settings Panel */}
      <div className={`flex-1 backdrop-blur-xl p-4 md:p-8 rounded-3xl shadow-2xl border flex flex-col overflow-y-auto ${theme === 'NATURE' ? 'bg-teal-900/90 border-teal-600' : theme === 'CYBERPUNK' ? 'bg-zinc-900/90 border-pink-500/50' : 'bg-slate-900/90 border-slate-600'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="flex items-center gap-3">
                <WonderLogo className={`w-10 h-10 md:w-12 md:h-12 ${theme === 'CYBERPUNK' ? 'text-pink-500' : theme === 'NATURE' ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 filter drop-shadow-lg tracking-tight">
                        WonderEnglish
                    </h1>
                    <span className="text-[10px] md:text-xs text-white/50 font-normal tracking-wide block uppercase">新知旺豆</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={cycleTheme}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all active:scale-90"
                    title="Switch Skin"
                 >
                     <PaletteIcon />
                 </button>
                 <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Agent</div>
                    <div className="text-lg font-bold text-white leading-tight">{username}</div>
                </div>
            </div>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
             <div>
                <label className="block text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-wide">Game Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.values(GameMode).map(m => (
                        <button key={m} onClick={() => setGameMode(m)} className={`text-xs py-3 px-3 rounded-xl border transition-all text-left ${gameMode === m ? 'bg-cyan-600/40 border-cyan-400 text-cyan-100' : 'bg-black/20 text-slate-400 border-white/10'}`}>
                            {m === GameMode.FIND_INTRUDER ? '🔍 Find Intruder' : '🔗 Find Belonging'}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="border-white/10" />

            {/* Category */}
            <div>
                <label className="block text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-wide">Category</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {CATEGORIES.map(c => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`text-[10px] sm:text-xs px-1 py-3 rounded-lg transition-all duration-200 font-semibold truncate active:scale-95 ${category === c ? 'bg-cyan-600 text-white shadow-lg ring-1 ring-cyan-400' : 'bg-black/40 text-slate-300'}`}
                    >
                        {c}
                    </button>
                    ))}
                </div>
            </div>

            {/* Difficulty & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-wide">Difficulty</label>
                    <div className="flex gap-2">
                        {Object.values(Difficulty).map(d => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-lg text-xs font-bold border transition-colors active:scale-95 ${difficulty === d ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/20 border-white/10 text-slate-400'}`}>
                            {d}
                        </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-cyan-400 mb-2 uppercase tracking-wide">Timer</label>
                    <div className="flex gap-2">
                        {[30, 60, 90, 120].map(sec => (
                            <button key={sec} onClick={() => setGameDuration(sec)} className={`flex-1 py-3 rounded-lg text-xs font-bold border transition-colors active:scale-95 ${gameDuration === sec ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/20 border-white/10 text-slate-400'}`}>
                                {sec}s
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Mobile Badge Preview */}
            <div className="lg:hidden mt-4">
                <label className="block text-[10px] font-bold text-yellow-500 mb-1 uppercase tracking-wide">Medal Collection</label>
                {renderMedalGrid()}
            </div>
        </div>

        <button
            onClick={startGame}
            className={`mt-4 w-full py-4 rounded-2xl text-xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border ring-4 ${theme === 'CYBERPUNK' ? 'bg-pink-600 border-pink-400 ring-pink-900/20' : theme === 'NATURE' ? 'bg-emerald-600 border-emerald-400 ring-emerald-900/20' : 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400/30 ring-cyan-900/20'}`}
        >
            <TapIcon /> START MISSION
        </button>
      </div>

      {/* Sidebar - Desktop Only */}
      <div className="w-72 hidden lg:flex flex-col gap-4">
          <div className={`flex-1 backdrop-blur-md rounded-3xl border p-5 overflow-y-auto ${theme === 'NATURE' ? 'bg-teal-900/80 border-teal-700' : theme === 'CYBERPUNK' ? 'bg-black/80 border-pink-900' : 'bg-slate-800/80 border-slate-700'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme === 'CYBERPUNK' ? '#f472b6' : '#fbbf24' }}>
                <TrophyIcon /> Medal Wall
            </h3>
            <div className="space-y-3">
                {achievements.map(ach => (
                    <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500' : 'bg-black/20 border-white/5 opacity-60 grayscale'}`}>
                        <div className="text-3xl filter drop-shadow-md">{ach.icon}</div>
                        <div>
                            <div className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                            <div className="text-[10px] text-slate-400">{ach.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="relative z-50 w-full max-w-4xl pointer-events-auto animate-zoom-in p-4 h-full md:h-auto overflow-y-auto flex items-center justify-center">
        <div className={`w-full backdrop-blur-2xl border rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden ${theme === 'CYBERPUNK' ? 'bg-zinc-900/95 border-pink-500/30' : 'bg-slate-900/95 border-cyan-500/30'}`}>
            
            {/* Main Score Panel */}
            <div className="p-6 md:p-10 flex-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700/50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mission Report</div>
                <div className="text-2xl font-bold text-white mb-4">{username}</div>
                
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-lg">TIME'S UP</h2>
                
                <div className="flex justify-center my-4 space-x-2">
                    {[1, 2, 3].map(i => (
                        <StarIcon key={i} filled={i <= getStars(score)} />
                    ))}
                </div>

                <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 filter drop-shadow-xl mb-4">
                    {score}
                </div>
                
                <div className="mb-6 text-lg font-bold text-white bg-gradient-to-r from-slate-800 to-slate-900 py-2 px-6 rounded-full border border-slate-700 shadow-inner">
                    {getTitle(score)}
                </div>

                {/* Score Breakdown Table */}
                <div className="w-full bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700 text-sm">
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Score Analysis</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-300">
                            <span>Base Score</span>
                            <span className="font-mono font-bold">{scoreBreakdown.base}</span>
                        </div>
                        <div className="flex justify-between text-purple-400">
                            <span className="flex items-center gap-1">🔥 Combo Bonus</span>
                            <span className="font-mono font-bold">+{scoreBreakdown.combo}</span>
                        </div>
                        <div className="flex justify-between text-yellow-400">
                            <span className="flex items-center gap-1">⚡ Speed Bonus</span>
                            <span className="font-mono font-bold">+{scoreBreakdown.speed}</span>
                        </div>
                        <div className="flex justify-between text-red-400">
                            <span>Penalties</span>
                            <span className="font-mono">-{scoreBreakdown.penalty}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={startGame} className="py-3 md:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform">
                        Replay
                    </button>
                    <button onClick={returnToMenu} className="py-3 md:py-4 bg-slate-800 rounded-xl font-bold text-slate-300 active:scale-95 transition-transform">
                        Menu
                    </button>
                </div>
            </div>

            {/* Achievement Panel */}
            <div className="w-full md:w-80 bg-black/20 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <TrophyIcon /> Medal Collection
                </h3>
                {/* Always show full grid of badges to reflect total progress */}
                <div className="grid gap-2">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500 border' : 'bg-slate-900/40 border-slate-800 opacity-50'}`}>
                            <div className="text-3xl filter drop-shadow-md">{ach.icon}</div>
                            <div className="min-w-0">
                                <div className={`font-bold text-sm truncate ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                                <div className="text-[10px] text-slate-400 truncate">{ach.description}</div>
                            </div>
                            {ach.unlocked && <div className="ml-auto text-yellow-500 font-bold text-lg">✓</div>}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 overflow-hidden font-sans select-none flex items-center justify-center ${theme === 'NATURE' ? 'bg-teal-950' : 'bg-slate-950'}`}>
      
      {/* Background Game Canvas */}
      {(gameState !== GameState.LOGIN && gameState !== GameState.MENU) && (
          <GameCanvas 
            gameState={gameState} 
            bubbles={bubbles} 
            setBubbles={setBubbles} 
            onBubblePop={handleBubblePop}
            theme={theme}
          />
      )}

      {/* Background pattern for Login/Menu */}
      {(gameState === GameState.LOGIN || gameState === GameState.MENU) && (
          <div className={`absolute inset-0 z-0 opacity-30 ${theme === 'TECH' ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]' : ''}`} />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        
        {/* HUD */}
        {gameState !== GameState.LOGIN && gameState !== GameState.MENU && gameState !== GameState.GAME_OVER && (
          <div className="absolute top-0 left-0 w-full flex justify-between items-start p-4 md:p-6 pointer-events-auto z-20">
            <div className="flex gap-2 md:gap-4">
                <button 
                    onClick={returnToMenu}
                    className="bg-red-900/80 hover:bg-red-800/80 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-white transition-all flex items-center justify-center gap-2 group shadow-lg"
                >
                    <HomeIcon /> 
                    <span className="font-bold hidden md:inline">Quit</span>
                </button>
                <div className="hidden md:block bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-white shadow-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Category</div>
                    <div className="text-lg font-bold text-cyan-400">{category}</div>
                </div>
            </div>
            
            <div className="flex gap-2 md:gap-4">
                <div className={`backdrop-blur-md rounded-xl px-4 py-2 border shadow-lg min-w-[80px] md:min-w-[120px] text-center transition-colors ${timeLeft <= 10 ? 'bg-red-600/80 border-red-400 animate-pulse' : 'bg-black/40 border-white/10'}`}>
                    <div className="text-[10px] text-slate-300 uppercase flex items-center justify-center gap-1 font-bold">
                        <ClockIcon /> Time
                    </div>
                    <div className="text-xl md:text-3xl font-mono font-bold text-white tracking-widest">
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-white shadow-lg min-w-[80px] md:min-w-[120px] text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Score</div>
                    <div className="text-xl md:text-3xl font-black text-yellow-400 drop-shadow-md">{score}</div>
                    {combo > 1 && (
                        <div className="text-[10px] md:text-sm font-bold text-green-400 animate-bounce absolute -bottom-4 right-0">
                           x{combo} Streak
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
            
            {/* LOGIN */}
            {gameState === GameState.LOGIN && renderLogin()}

            {/* MENU */}
            {gameState === GameState.MENU && renderMenu()}

            {/* LOADING */}
            {gameState === GameState.LOADING_ROUND && (
            <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-10 rounded-3xl animate-pulse pointer-events-auto border border-white/10 shadow-2xl">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">{loadingMessage}</h2>
            </div>
            )}

            {/* GAME OVER */}
            {gameState === GameState.GAME_OVER && renderGameOver()}
        </div>
      </div>
    </div>
  );
};

export default App;