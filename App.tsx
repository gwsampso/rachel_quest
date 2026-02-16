import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, PlayerState } from './types';
import { SCENARIOS, ASSET_PATHS } from './constants';
import { loadImagesAsBase64 } from './utils';
import Typewriter from './components/Typewriter';
import RetroCard from './components/RetroCard';
import PixelAvatar from './components/PixelAvatar';
import ItemIcon from './components/ItemIcon';
import { GoogleGenAI } from "@google/genai";
import { Heart, Skull, Trophy, RefreshCcw, Volume2, VolumeX, Star, ArrowRight, Loader2, BookOpen, Home } from 'lucide-react';

interface SuccessData {
  text: string;
  loveGain: number;
  item?: string;
  nextScenarioId: string;
  isLevelUp: boolean;
  newLevelTitle?: string;
  familyAdded?: string;
  houseUpgraded?: boolean;
}

// --- Singleton 8-Bit Audio Engine ---
let audioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playBleep = (freq: number = 440, type: OscillatorType = 'square', duration: number = 0.1, gainVal: number = 0.1) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { 
    console.warn("Bleep failed", e); 
  }
};

const playStartSound = () => {
  [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playBleep(f, 'square', 0.2), i * 100));
};

const playBossChime = () => {
  [110, 82, 110, 164, 110, 220, 164, 220].forEach((f, i) => setTimeout(() => playBleep(f, 'sawtooth', 0.1, 0.2), i * 120));
};

const playCoinSound = () => {
  playBleep(987.77, 'square', 0.1, 0.05);
  setTimeout(() => playBleep(1318.51, 'square', 0.2, 0.05), 50);
};

const playTypewriterTick = () => {
  playBleep(150, 'sawtooth', 0.01, 0.01);
};

const playLevelUp = () => {
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playBleep(freq, 'square', 0.15), i * 150);
  });
};

const playMaleGreeting = () => {
  playBleep(110, 'sawtooth', 0.2, 0.15);
  setTimeout(() => playBleep(146, 'sawtooth', 0.2, 0.1), 100);
};

const playBabyGreeting = () => {
  playBleep(1200, 'triangle', 0.1, 0.1);
  setTimeout(() => playBleep(1500, 'triangle', 0.3, 0.05), 80);
};

const playProposalChime = () => {
  [440, 554, 659, 880, 1108, 1318].forEach((freq, i) => {
    setTimeout(() => playBleep(freq, 'sine', 0.3, 0.05), i * 100);
  });
};

const playGameOverChime = () => {
  [200, 150, 100].forEach((freq, i) => {
    setTimeout(() => playBleep(freq, 'sawtooth', 0.4), i * 300);
  });
};

const HeartParticle: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div 
    className="absolute pointer-events-none animate-ping text-pink-500"
    style={{ left: x, top: y, fontSize: Math.random() * 20 + 10 }}
  >
    ❤
  </div>
);

const PixelRing = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_15px_rgba(255,255,255,0.4)]">
    <defs>
      <filter id="glow-silver">
        <feGaussianBlur stdDeviation="2.0" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#glow-silver)">
      <path d="M30 60 L30 75 L70 75 L70 60 L60 60 L60 68 L40 68 L40 60 Z" fill="#4B5563" /> 
      <path d="M30 60 L30 40 L35 30 L65 30 L70 40 L70 60 L60 60 L60 52 L40 52 L40 60 Z" fill="#9CA3AF" />
      <rect x="35" y="35" width="5" height="20" fill="#D1D5DB" opacity="0.5" />
      <rect x="40" y="22" width="20" height="12" fill="#E5E7EB" />
      <rect x="45" y="5" width="10" height="5" fill="#F0F9FF" />
      <rect x="40" y="10" width="20" height="6" fill="#BAE6FD" />
      <rect x="42.5" y="16" width="15" height="6" fill="#7DD3FC" />
      <rect x="45" y="22" width="10" height="2" fill="#38BDF8" />
      <rect x="45" y="7.5" width="2.5" height="2.5" fill="white" />
      <rect x="55" y="12" width="2" height="2" fill="white" opacity="0.8" />
    </g>
  </svg>
);

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('START');
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});
  const [legendNarrative, setLegendNarrative] = useState<string>('');
  const [loadingLegend, setLoadingLegend] = useState(false);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    hearts: 1,
    currentLevelLove: 0,
    inventory: [],
    currentScenarioId: 'encounter',
    family: ['Rachel'],
    houseLevel: 0
  });
  
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [textCompleted, setTextCompleted] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [particles, setParticles] = useState<{ id: number, x: number, y: number }[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    async function initAssets() {
      try {
        const assets = await loadImagesAsBase64(ASSET_PATHS);
        setLoadedImages(assets);
      } catch (e) {
        console.error("Asset Failure", e);
      } finally {
        setLoadingAssets(false);
      }
    }
    initAssets();
  }, []);

  // Ensure options are always hidden when starting a new scenario
  useEffect(() => {
    setTextCompleted(false);
  }, [playerState.currentScenarioId]);

  const triggerBlackout = () => {
    const overlay = document.getElementById('flash-overlay');
    if (overlay) {
      overlay.classList.remove('animate-flash');
      void overlay.offsetWidth; 
      overlay.classList.add('animate-flash');
    }
  };

  const triggerSlowReveal = () => {
    const overlay = document.getElementById('flash-overlay');
    if (overlay) {
      // Remove any previous animations
      overlay.classList.remove('animate-flash');
      overlay.classList.remove('animate-reveal-slow');
      
      // Ensure it starts from opacity 1 (black)
      void overlay.offsetWidth; 
      
      overlay.classList.add('animate-reveal-slow');
    }
  };

  const triggerBossEncounter = () => {
    const overlay = document.getElementById('boss-overlay');
    const container = document.getElementById('checker-container');
    if (overlay && container) {
      playBossChime();
      overlay.classList.add('animate-boss-encounter');
      
      container.innerHTML = '';
      // Increased grid density (15x15)
      for (let i = 0; i < 225; i++) { 
        const square = document.createElement('div');
        square.className = 'checker-square';
        // Increased delay range to make the transition longer (up to 2.5s delay + 0.8s animation)
        square.style.animationDelay = `${Math.random() * 2.5}s`; 
        square.classList.add('animate-checker');
        container.appendChild(square);
      }

      // Cleanup after the blackout effect takes over
      setTimeout(() => {
        overlay.classList.remove('animate-boss-encounter');
        container.innerHTML = '';
      }, 4000); 
    }
  };

  const generateLegend = async () => {
    setLoadingLegend(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a short, romantic 8-bit RPG style "Legend" summary for Rachel and Glenn. 
      They have been together for 10 years. 
      Their inventory includes: ${playerState.inventory.join(', ')}.
      Their family has grown to include: ${playerState.family.join(', ')}.
      Their house level is ${playerState.houseLevel}/3.
      Mention the 'Dirty Swan' and 'Rotherwood Drive'. 
      Keep it to 3 short sentences. Make it very sweet as if it's the epilogue of a great game.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setLegendNarrative(response.text || "Their journey was legendary, paved with love and laughter.");
    } catch (e) {
      setLegendNarrative("From a chance meeting at the Dirty Swan to a dream home at Rotherwood, Rachel and Glenn's 10-year quest has been the ultimate adventure.");
    } finally {
      setLoadingLegend(false);
    }
  };

  useEffect(() => {
    if (phase === 'VICTORY') {
      generateLegend();
      playProposalChime();
      const interval = setInterval(() => {
        setParticles(prev => [
          ...prev.slice(-20),
          { id: Date.now(), x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }
        ]);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const startGame = () => {
    playStartSound();
    setPhase('PLAYING');
    setPlayerState({
      hearts: 1,
      currentLevelLove: 0,
      inventory: [],
      currentScenarioId: 'encounter',
      family: ['Rachel'],
      houseLevel: 0
    });
    setGameOverReason('');
    setTextCompleted(false);
    setSuccessData(null);
  };
  
  const retryLevel = () => {
    playBleep(440, 'square', 0.1, 0.1);
    setPhase('PLAYING');
    setGameOverReason('');
    // We do NOT reset playerState here, preserving the progress up to this level.
    // The scenario renders again, giving the user a second chance.
  };

  const handleOptionSelect = (optionId: 'A' | 'B') => {
    const currentScenario = SCENARIOS[playerState.currentScenarioId];
    if (!currentScenario) return;

    const selectedOption = currentScenario.options.find(o => o.id === optionId);
    if (!selectedOption) return;

    setTextCompleted(false);

    if (selectedOption.isGameOver) {
      playGameOverChime();
      setGameOverReason(selectedOption.gameOverReason || 'GAME OVER');
      setPhase('GAME_OVER');
    } else {
      if (selectedOption.familyAdd === 'Glenn') playMaleGreeting();
      else if (selectedOption.familyAdd === 'Lachlan' || selectedOption.familyAdd === 'Finley') playBabyGreeting();
      
      const nextId = selectedOption.nextScenarioId || 'VICTORY';
      
      let isLevelUp = false;
      let newLevelTitle = '';
      if (nextId !== 'VICTORY') {
        const nextScenario = SCENARIOS[nextId];
        if (nextScenario && nextScenario.levelTitle !== currentScenario.levelTitle) {
          isLevelUp = true;
          newLevelTitle = nextScenario.levelTitle;
        }
      }

      // Special handling for Major Reno to avoid spoiler feedback
      if (playerState.currentScenarioId === 'major_reno' && !selectedOption.isGameOver) {
        setIsTransitioning(true);
        triggerBlackout();
        
        // Apply state changes silently
        const updatedInventory = selectedOption.inventoryItem ? [...playerState.inventory, selectedOption.inventoryItem] : playerState.inventory;
        const updatedFamily = selectedOption.familyAdd ? [...playerState.family, selectedOption.familyAdd] : playerState.family;
        
        setTimeout(() => {
          setPlayerState(prev => ({
            ...prev,
            hearts: isLevelUp ? prev.hearts + 1 : prev.hearts,
            currentLevelLove: 0,
            inventory: updatedInventory,
            family: updatedFamily,
            houseLevel: prev.houseLevel + (selectedOption.houseLevelChange || 0),
            currentScenarioId: 'final_level'
          }));
          setIsTransitioning(false);
        }, 1500);
        return;
      }

      // Normal path for other scenarios
      if (isLevelUp) playLevelUp(); else playCoinSound();

      setPlayerState(prev => ({
        ...prev,
        hearts: isLevelUp ? prev.hearts + 1 : prev.hearts,
        currentLevelLove: isLevelUp ? 0 : prev.currentLevelLove + (selectedOption.loveMeterChange || 0),
        inventory: selectedOption.inventoryItem ? [...prev.inventory, selectedOption.inventoryItem] : [...prev.inventory],
        family: selectedOption.familyAdd ? [...prev.family, selectedOption.familyAdd] : [...prev.family],
        houseLevel: prev.houseLevel + (selectedOption.houseLevelChange || 0)
      }));

      setSuccessData({
        text: selectedOption.successFeedback || "Great choice!",
        loveGain: selectedOption.loveMeterChange || 0,
        item: selectedOption.inventoryItem,
        nextScenarioId: nextId,
        isLevelUp,
        newLevelTitle,
        familyAdded: selectedOption.familyAdd,
        houseUpgraded: !!selectedOption.houseLevelChange
      });
    }
  };

  const handleContinue = () => {
    if (!successData) return;
    playBleep(440, 'square', 0.05, 0.05);
    
    if (successData.nextScenarioId === 'the_question') {
      setIsTransitioning(true);
      triggerBossEncounter(); // Starts ~3.5s sequence of chaos
      
      // At 3.5s, the screen is covered by black checkers.
      // We swap the scene and trigger the slow reveal (fade from black).
      setTimeout(() => {
        setPlayerState(prev => ({ ...prev, currentScenarioId: successData.nextScenarioId }));
        setTextCompleted(false);
        setSuccessData(null);
        
        triggerSlowReveal();
        
        setIsTransitioning(false);
      }, 3500); 
    } else if (successData.nextScenarioId === 'VICTORY') {
      setPhase('VICTORY');
      setSuccessData(null);
    } else {
      setPlayerState(prev => ({ ...prev, currentScenarioId: successData.nextScenarioId }));
      setTextCompleted(false);
      setSuccessData(null);
    }
  };

  const getHouseIcon = (level: number) => {
    if (level <= 0) return null;
    if (level === 1) return '🏢';
    if (level === 2) return '🏠';
    return '🏰';
  };

  const getMemberStage = (name: string): 'baby' | 'child_blonde' | 'child_brown' | 'adult' => {
    if (name === 'Rachel' || name === 'Glenn') return 'adult';
    const hasFinley = playerState.family.includes('Finley');
    const isDreamHome = playerState.houseLevel >= 3 || phase === 'VICTORY';
    if (name === 'Lachlan') return hasFinley ? 'child_blonde' : 'baby';
    if (name === 'Finley') return isDreamHome ? 'child_brown' : 'baby';
    return 'adult';
  };

  if (loadingAssets) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-green-400 animate-spin mb-4" />
        <p className="text-green-400 text-[10px] animate-pulse">BOOTING QUEST...</p>
      </div>
    );
  }

  if (phase === 'START') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
        <RetroCard borderColor="pink" className="z-10 max-w-lg w-full py-12">
          <h1 className="text-2xl md:text-5xl text-yellow-400 mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] leading-tight">
            THE<br />10<br />YEAR<br />PATH
          </h1>
          <div className="text-green-400 text-[10px] md:text-base mb-8 space-y-4">
            <p className="animate-pulse">RACHEL'S ADVENTURE</p>
          </div>
          <button 
            onClick={startGame}
            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 px-8 border-b-8 border-pink-900 active:border-b-0 active:mt-2 transition-all w-full max-w-xs mx-auto block text-sm"
          >
            START QUEST
          </button>
        </RetroCard>
      </div>
    );
  }

  if (phase === 'GAME_OVER') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <RetroCard borderColor="red" className="max-w-md w-full text-center">
          <Skull className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl text-red-500 mb-4 tracking-tighter uppercase">Wasted</h2>
          <p className="text-white mb-8 text-[10px] leading-loose">{gameOverReason}</p>
          <button onClick={retryLevel} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 border-b-4 border-gray-900 w-full flex items-center justify-center gap-2 text-xs">
            <RefreshCcw size={16} /> TRY AGAIN
          </button>
        </RetroCard>
      </div>
    );
  }

  if (phase === 'VICTORY') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        <div className="py-8 w-full flex flex-col items-center">
          {particles.map(p => <HeartParticle key={p.id} x={p.x} y={p.y} />)}
          <RetroCard borderColor="pink" className="max-w-xl w-full text-center z-10 border-4 border-yellow-300">
            <div className="mb-8 relative h-32 md:h-40 flex items-center justify-center">
               <div className="w-24 h-24 md:w-32 md:h-32 animate-bounce">
                  <PixelRing />
               </div>
            </div>
            <h1 className="text-xl md:text-4xl text-pink-400 mb-6 drop-shadow-md uppercase">Quest Complete!</h1>
            
            <div className="bg-black/50 p-4 md:p-6 rounded border-2 border-gray-600 mb-6 text-left">
               <div className="flex items-center gap-2 text-yellow-300 mb-4 border-b border-gray-700 pb-2">
                  <BookOpen size={16} /> <span className="text-[10px]">THE LEGEND OF RACHEL & GLENN</span>
               </div>
               {loadingLegend ? (
                 <div className="animate-pulse text-[10px] text-gray-500">Retrieving story from the cosmos...</div>
               ) : (
                 <Typewriter text={legendNarrative} speed={40} className="text-[10px] md:text-sm leading-relaxed text-blue-100 italic" />
               )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400 mb-8 uppercase">
               <div className="border border-gray-700 p-2">
                  <p className="mb-1 text-[8px]">Party Size</p>
                  <p className="text-white text-base">{playerState.family.length}</p>
               </div>
               <div className="border border-gray-700 p-2">
                  <p className="mb-1 text-[8px]">Home Rank</p>
                  <p className="text-white text-base">{getHouseIcon(playerState.houseLevel)}</p>
               </div>
            </div>

            <h2 className="text-yellow-400 text-lg md:text-2xl mb-8 animate-pulse">SHE SAID YES!</h2>
            
            <button onClick={startGame} className="text-gray-500 hover:text-white text-[8px] underline">REPLAY THE MEMORIES</button>
          </RetroCard>
        </div>
      </div>
    );
  }

  const currentScenario = SCENARIOS[playerState.currentScenarioId];
  const activeImage = currentScenario?.imageSrcKey ? loadedImages[currentScenario.imageSrcKey] : null;

  if (!currentScenario) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-['Press_Start_2P'] pb-32 relative overflow-y-auto">
      {successData && (
        <div className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-500 ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           <RetroCard borderColor="green" className="max-w-md w-full text-center">
              {successData.isLevelUp && successData.nextScenarioId !== 'the_question' && (
                 <div className="mb-6 animate-bounce">
                    <h3 className="text-yellow-300 text-lg md:text-xl tracking-widest border-y-4 border-yellow-300 py-2 uppercase">Level Up!</h3>
                    <p className="text-green-400 text-[8px] mt-2 uppercase">{successData.newLevelTitle}</p>
                 </div>
              )}
              
              {!successData.isLevelUp && (
                <div className="flex justify-center mb-4"><Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse" /></div>
              )}
              
              <h2 className="text-sm md:text-lg text-green-400 mb-4 uppercase tracking-tighter">Journey Updated</h2>
              <p className="text-white text-[9px] md:text-[10px] leading-relaxed mb-6 italic">"{successData.text}"</p>
              
              <div className="bg-gray-800/80 p-4 border-2 border-green-900 rounded-lg mb-6 space-y-3">
                 <div className="flex justify-between items-center text-[10px] md:text-xs">
                    <span className="text-pink-400 flex items-center gap-2"><Heart size={14} className="fill-pink-400" /> LOVE GAINED</span>
                    <span className="text-white font-bold">+{successData.loveGain}</span>
                 </div>
                 
                 {successData.item && (
                   <div className="flex justify-between items-center text-[10px] md:text-xs pt-2 border-t border-gray-700">
                      <span className="text-blue-400 flex items-center gap-2">🎁 NEW ITEM</span>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 font-bold uppercase">{successData.item}</span>
                        <ItemIcon name={successData.item} size={24} />
                      </div>
                   </div>
                 )}

                 {successData.houseUpgraded && (
                   <div className="flex justify-between items-center text-[10px] md:text-xs pt-2 border-t border-gray-700">
                      <span className="text-orange-400 flex items-center gap-2"><Home size={14} className="fill-orange-400" /> NEW HOME</span>
                      <span className="text-white font-bold text-2xl filter drop-shadow-[0_0_5px_rgba(251,146,60,0.8)] animate-bounce">
                        {getHouseIcon(playerState.houseLevel)}
                      </span>
                   </div>
                 )}
                 
                 {successData.familyAdded && (
                   <div className="flex justify-between items-center text-[10px] md:text-xs pt-2 border-t border-gray-700">
                      <span className="text-purple-400 flex items-center gap-2">👤 NEW MEMBER</span>
                      <span className="text-white font-bold uppercase">{successData.familyAdded}</span>
                   </div>
                 )}
              </div>

              <button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 flex items-center justify-center gap-4 text-[10px] border-b-4 border-green-800 tracking-widest">
                {successData.nextScenarioId === 'the_question' ? 'THE MOMENT...' : 'NEXT STAGE'} <ArrowRight size={16} />
              </button>
           </RetroCard>
        </div>
      )}

      <div className="bg-black border-b-4 border-pink-700 sticky top-0 z-20 shadow-2xl">
        <div className="max-w-4xl mx-auto p-2 md:p-4">
          <div className="text-center mb-2 pb-1 border-b border-gray-800">
             <span className="text-[7px] md:text-[10px] text-green-400 font-bold uppercase tracking-[0.2em]">{currentScenario.levelTitle}</span>
          </div>
          
          <div className="flex justify-center mb-3">
             <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1">
                   {Array.from({ length: playerState.hearts }).map((_, i) => (
                      <Heart key={i} className="text-red-500 fill-red-500 w-3 h-3 md:w-5 md:h-5 animate-pulse" />
                   ))}
                </div>
                <div className="w-32 md:w-64 h-2 md:h-4 bg-gray-800 border border-gray-600 relative">
                   <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000" style={{ width: `${Math.min(playerState.currentLevelLove, 100)}%` }}></div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-1 md:gap-4 items-start text-center">
             <div className="flex flex-col items-center">
                <span className="text-[6px] md:text-[8px] text-gray-500 uppercase tracking-widest mb-1">Family</span>
                <div className="flex items-center -space-x-1 md:-space-x-2 min-h-[28px] md:min-h-[40px]">
                   {playerState.family.map((m, i) => <PixelAvatar key={i} name={m} stage={getMemberStage(m)} size={window.innerWidth < 640 ? 24 : 32} />)}
                </div>
             </div>
             
             <div className="flex flex-col items-center">
                 <span className="text-[6px] md:text-[8px] text-gray-500 uppercase tracking-widest mb-1">House</span>
                 <div className="flex items-center justify-center min-h-[28px] md:min-h-[40px]">
                    <span className="text-base md:text-3xl filter drop-shadow-md">{getHouseIcon(playerState.houseLevel)}</span>
                 </div>
             </div>
             
             <div className="flex flex-col items-center">
                <span className="text-[6px] md:text-[8px] text-gray-500 uppercase tracking-widest mb-1">Items</span>
                <div className="flex flex-wrap gap-1 justify-center min-h-[28px] md:min-h-[40px]">
                   {playerState.inventory.slice(-3).map((item, idx) => (<ItemIcon key={idx} name={item} size={window.innerWidth < 640 ? 24 : 32} />))}
                   {playerState.inventory.length > 3 && <span className="text-[8px] self-center">...</span>}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-4 space-y-6 md:space-y-8">
        <div className="w-full aspect-video bg-gray-900 border-2 md:border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden group">
            {activeImage ? (
              <img src={activeImage} alt={currentScenario.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 space-y-2">
                <Loader2 className="animate-spin" />
                <span className="text-[8px] uppercase">[ Loading Memory... ]</span>
              </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
             <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4">
                <h2 className="text-[9px] md:text-xl text-yellow-300 drop-shadow-md uppercase tracking-tight">{currentScenario.title}</h2>
             </div>
        </div>

        <RetroCard borderColor="blue" className="min-h-[100px] md:min-h-[140px]">
          <Typewriter 
            key={playerState.currentScenarioId} 
            text={currentScenario.description} 
            speed={30} 
            onChar={playTypewriterTick} 
            onComplete={() => !isTransitioning && setTextCompleted(true)} 
            className="text-[8px] md:text-sm leading-relaxed text-blue-100" 
          />
        </RetroCard>

        <div className={`grid gap-3 md:grid-cols-2 transition-all ${textCompleted && !isTransitioning ? 'opacity-100 translate-y-0 duration-700' : 'opacity-0 translate-y-4 pointer-events-none duration-0'}`}>
          {currentScenario.options.map((option) => (
             <button key={option.id} onClick={() => handleOptionSelect(option.id)} className={`bg-gray-900 border border-gray-700 hover:border-pink-500 active:bg-gray-800 p-3 md:p-4 text-left transition-colors relative group ${currentScenario.id === 'final_level' ? 'md:col-span-2' : ''}`}>
               <div className="flex items-center gap-3 md:gap-4 h-full">
                 <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded bg-pink-900/40 border border-pink-500 text-pink-500 font-bold text-[10px] md:text-sm shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                    {option.id}
                 </div>
                 <span className="text-[9px] md:text-[11px] text-gray-200 leading-relaxed uppercase">{option.text}</span>
               </div>
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;