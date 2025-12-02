import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateRoundWords } from './services/geminiService';
import { GameCanvas } from './components/GameCanvas';
import { GameState, Difficulty, CATEGORIES, WordBubble, RoundData, Achievement, PopResult } from './types';
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

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#f59e0b" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1 transform transition-all duration-500 hover:scale-110">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
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
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [gameDuration, setGameDuration] = useState<number>(60);
  
  const [score, setScore] = useState(0);
  // Detailed breakdown state
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
    // Load from local storage
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


  // --- Game Logic ---

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

    // 1. Rookie: 800+ Points
    if (score >= 800) unlock('rookie');

    // 2. Speedster: 1500+ Points
    if (score >= 1500) unlock('speedster');

    // 3. Sharpshooter: 2000+ Points
    if (score >= 2000) unlock('sharpshooter');

    // 4. Legend: 2500+ Points
    if (score >= 2500) unlock('legend');

    // 5. Combo Master (Mechanic based)
    if (maxCombo >= 10) unlock('comboMaster');

    // 6. Lightning Reflexes (Mechanic based)
    if (speedBonusCount >= 5) unlock('lightning');

    if (achievementUnlocked) {
        setAchievements(newAchievements);
    }
  };

  const startRound = useCallback(async () => {
    const data: RoundData = await generateRoundWords(category, difficulty);
    
    // Prepare bubbles
    const newBubbles: WordBubble[] = [];
    const allWords = [
      ...data.categoryWords.map(w => ({ text: w, isIntruder: false })),
      { text: data.intruderWord, isIntruder: true }
    ];

    // Shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cx = width / 2;
    // Shift center down by 5% of screen height to avoid HUD overlap
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

    const baseHue = Math.random() * 360; 
    
    allWords.forEach((item, index) => {
      const hue = baseHue + (Math.random() * 30 - 15); 
      const sat = 70 + Math.random() * 20;
      const light = 55 + Math.random() * 10;
      
      newBubbles.push({
        id: `b-${Date.now()}-${index}`,
        text: item.text,
        isIntruder: item.isIntruder,
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
  }, [category, difficulty]);

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

    if (bubble.isIntruder) {
      playSound('correct');
      
      // Calculations
      const now = Date.now();
      const timeTaken = now - roundStartTimeRef.current;
      const isSpeedBonus = timeTaken < 1500; // 1.5s threshold
      
      // Update Combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      // Calculate Score Components
      const basePoints = 100;
      const comboBonus = newCombo * 10;
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

      // Build label text
      let label = `+${totalPoints}`;
      if (newCombo > 1) label += ` Combo x${newCombo}!`;
      if (isSpeedBonus) label += ` ⚡`;

      return {
          scoreDelta: totalPoints,
          label: label,
          color: '#4ade80' // Green
      };

    } else {
      playSound('wrong');
      // Penalty Logic
      const penalty = 20;
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

  // Sidebar Achievement List (for Menu)
  const renderAchievementSidebar = () => (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-4 h-full overflow-y-auto">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <TrophyIcon /> Medal Wall
        </h3>
        <div className="space-y-3">
            {achievements.map(ach => (
                <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500' : 'bg-slate-900/50 border-slate-700 opacity-60 grayscale'}`}>
                    <div className="text-3xl filter drop-shadow-md">{ach.icon}</div>
                    <div>
                        <div className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                        <div className="text-xs text-slate-400">{ach.description}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderMenu = () => (
    <div className="relative z-10 w-full max-w-6xl flex gap-6 p-4 animate-fade-in-up pointer-events-auto items-stretch h-[80vh]">
      
      {/* Settings Panel */}
      <div className="flex-1 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-600 flex flex-col overflow-y-auto">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 filter drop-shadow-lg text-center">
            Word Ninja
        </h1>
        <p className="text-slate-400 mb-8 text-lg text-center">Find the intruder, pop the bubble!</p>

        <div className="space-y-8 flex-1">
            {/* Category */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wide">Category</label>
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                    {CATEGORIES.map(c => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`text-xs px-2 py-3 rounded-xl transition-all duration-200 font-semibold ${category === c ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/40 scale-105 ring-2 ring-cyan-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        {c}
                    </button>
                    ))}
                </div>
            </div>

            {/* Difficulty */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wide">Difficulty</label>
                <div className="flex gap-4">
                    {Object.values(Difficulty).map(d => (
                    <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 rounded-xl transition-all font-bold ${difficulty === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                    >
                        {d}
                    </button>
                    ))}
                </div>
            </div>

            {/* Time Selector */}
            <div>
                <label className="block text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wide">Duration</label>
                <div className="flex gap-3">
                    {[30, 60, 90, 120].map(sec => (
                        <button
                            key={sec}
                            onClick={() => setGameDuration(sec)}
                            className={`flex-1 py-2 rounded-xl transition-all font-bold border ${gameDuration === sec ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            {sec}s
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <button
            onClick={startGame}
            className="mt-8 w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-2xl font-black text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-cyan-400/30 ring-4 ring-cyan-900/20"
        >
            <TapIcon /> START GAME
        </button>
      </div>

      {/* Sidebar */}
      <div className="w-80 hidden lg:block">
          {renderAchievementSidebar()}
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="relative z-50 w-full max-w-5xl pointer-events-auto animate-zoom-in p-4">
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Panel: Score Summary */}
            <div className="p-10 flex-1 flex flex-col items-center border-r border-slate-700/50">
                <h2 className="text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">TIME'S UP</h2>
                
                <div className="flex justify-center my-6 space-x-2">
                    {[1, 2, 3].map(i => (
                        <StarIcon key={i} filled={i <= getStars(score)} />
                    ))}
                </div>

                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 filter drop-shadow-xl mb-4">
                    {score}
                </div>
                
                <div className="mb-8 text-xl font-bold text-white bg-gradient-to-r from-slate-800 to-slate-900 py-3 px-8 rounded-full border border-slate-700 shadow-inner">
                    {getTitle(score)}
                </div>

                {/* Score Breakdown Table */}
                <div className="w-full bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Score Analysis</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-slate-300">
                            <span>Base Score</span>
                            <span className="font-mono font-bold">{scoreBreakdown.base}</span>
                        </div>
                        <div className="flex justify-between text-purple-400">
                            <span className="flex items-center gap-1"><span className="text-lg">🔥</span> Combo Bonus</span>
                            <span className="font-mono font-bold text-lg">+{scoreBreakdown.combo}</span>
                        </div>
                        <div className="flex justify-between text-yellow-400">
                            <span className="flex items-center gap-1"><span className="text-lg">⚡</span> Speed Bonus</span>
                            <span className="font-mono font-bold">+{scoreBreakdown.speed}</span>
                        </div>
                        <div className="flex justify-between text-red-400 text-sm">
                            <span>Mistakes Penalty</span>
                            <span className="font-mono">-{scoreBreakdown.penalty}</span>
                        </div>
                        <div className="border-t border-slate-600 pt-3 mt-2 flex justify-between text-white font-bold text-lg">
                            <span>Total</span>
                            <span>{score}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={startGame} className="py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white text-lg shadow-lg transition-transform hover:scale-[1.02]">
                        Play Again
                    </button>
                    <button onClick={returnToMenu} className="py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 transition-colors">
                        Menu
                    </button>
                </div>
            </div>

            {/* Right Panel: All Achievements List */}
            <div className="w-full md:w-96 bg-slate-800/30 p-8 overflow-y-auto max-h-[800px]">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                    <TrophyIcon /> Medal Collection
                </h3>
                <div className="grid gap-3">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500 border-2' : 'bg-slate-900/40 border-slate-800 opacity-50'}`}>
                            <div className="text-4xl filter drop-shadow-md">{ach.icon}</div>
                            <div>
                                <div className={`font-bold ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                                <div className="text-xs text-slate-400 mt-1">{ach.description}</div>
                            </div>
                            {ach.unlocked && <div className="ml-auto text-yellow-500 font-bold text-xl">✓</div>}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950 font-sans select-none flex items-center justify-center">
      
      {/* Background Game Canvas */}
      {(gameState !== GameState.MENU) && (
          <GameCanvas 
            gameState={gameState} 
            bubbles={bubbles} 
            setBubbles={setBubbles} 
            onBubblePop={handleBubblePop}
          />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        
        {/* HUD */}
        {gameState !== GameState.MENU && gameState !== GameState.GAME_OVER && (
          <div className="absolute top-0 left-0 w-full flex justify-between items-start p-6 pointer-events-auto z-20">
            <div className="flex gap-4">
                <button 
                    onClick={returnToMenu}
                    className="bg-slate-800/80 hover:bg-red-900/80 backdrop-blur-md rounded-2xl px-6 border border-white/10 text-white transition-all flex items-center justify-center gap-2 group shadow-lg"
                >
                    <HomeIcon /> 
                    <span className="font-bold">Quit</span>
                </button>
                <div className="hidden md:block bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white shadow-lg">
                    <div className="text-xs text-slate-400 uppercase font-bold">Category</div>
                    <div className="text-xl font-bold text-cyan-400">{category}</div>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className={`backdrop-blur-md rounded-2xl p-4 border shadow-lg min-w-[140px] text-center transition-colors ${timeLeft <= 10 ? 'bg-red-600/80 border-red-400 animate-pulse' : 'bg-black/40 border-white/10'}`}>
                    <div className="text-xs text-slate-300 uppercase flex items-center justify-center gap-1 font-bold">
                        <ClockIcon /> Time
                    </div>
                    <div className="text-3xl font-mono font-bold text-white tracking-widest">
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white shadow-lg min-w-[140px] text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold">Score</div>
                    <div className="text-3xl font-black text-yellow-400 drop-shadow-md">{score}</div>
                    {combo > 1 && (
                        <div className="text-sm font-bold text-green-400 animate-bounce">
                           Combo x{combo}
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
            
            {/* MENU */}
            {gameState === GameState.MENU && renderMenu()}

            {/* LOADING */}
            {gameState === GameState.LOADING_ROUND && (
            <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-16 rounded-3xl animate-pulse pointer-events-auto border border-white/10 shadow-2xl">
                <div className="w-24 h-24 border-8 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-8"></div>
                <h2 className="text-4xl font-bold text-white tracking-widest uppercase">{loadingMessage}</h2>
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