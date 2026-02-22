/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Delete, 
  Send, 
  History, 
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, GameState, GameRound } from './types';
import { getSolvableHand, evaluateExpression } from './utils/gameLogic';

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const ZOOTOPIA_CHARACTERS: Record<number, { name: string; seed: string }> = {
  1: { name: 'Judy Hopps', seed: 'judy' },
  2: { name: 'Nick Wilde', seed: 'nick' },
  3: { name: 'Chief Bogo', seed: 'bogo' },
  4: { name: 'Mayor Lionheart', seed: 'lion' },
  5: { name: 'Clawhauser', seed: 'donut' },
  6: { name: 'Flash', seed: 'sloth' },
  7: { name: 'Gazelle', seed: 'gazelle' },
  8: { name: 'Mr. Big', seed: 'mouse' },
  9: { name: 'Bellwether', seed: 'sheep' }
};

interface CardComponentProps {
  card: Card;
  isUsed: boolean;
  onClick: () => void;
}

const CardComponent: React.FC<CardComponentProps> = ({ card, isUsed, onClick }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const charData = ZOOTOPIA_CHARACTERS[card.value];
  
  // Display 'A' for 1
  const displayValue = card.value === 1 ? 'A' : card.value;
  
  return (
    <motion.div
      layoutId={card.id}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative w-24 h-36 sm:w-32 sm:h-48 rounded-xl cursor-pointer select-none
        flex flex-col items-center justify-center border-2 transition-all duration-300
        ${isUsed 
          ? 'opacity-30 grayscale border-white/5 bg-white/5' 
          : 'opacity-100 border-white/10 bg-[#f8f5f2] card-shadow hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]'
        }
      `}
    >
      {/* Top Left Value */}
      <div className={`absolute top-2 left-2 flex flex-col items-center leading-none ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
        <span className="text-lg sm:text-xl font-bold">{displayValue}</span>
        <span className="text-[10px] opacity-50">{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      {/* Character Illustration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 opacity-10">
        <img 
          src={`https://picsum.photos/seed/${charData.seed}/200/200`}
          alt={charData.name}
          className="w-full h-full object-cover rounded-full grayscale mix-blend-multiply"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Center Avatar */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 p-0.5 overflow-hidden shadow-inner ${isRed ? 'border-rose-200' : 'border-zinc-200'}`}>
          <img 
            src={`https://picsum.photos/seed/${charData.seed}/100/100`}
            alt={charData.name}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className={`text-2xl sm:text-3xl ${isRed ? 'text-rose-600' : 'text-zinc-900'} drop-shadow-sm`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>

      {/* Bottom Right Value */}
      <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
        <span className="text-lg sm:text-xl font-bold">{displayValue}</span>
        <span className="text-[10px] opacity-50">{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      {/* Character Label */}
      <div className={`absolute bottom-4 w-full text-center text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${isRed ? 'text-rose-400' : 'text-zinc-400'}`}>
        {charData.name}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentCards: [],
    score: 0,
    history: [],
    status: 'idle',
    message: ''
  });
  
  const [expression, setExpression] = useState<string>('');
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const startNewRound = useCallback(() => {
    const newCards = getSolvableHand();
    setGameState(prev => ({
      ...prev,
      currentCards: newCards,
      status: 'playing',
      message: 'Use all 4 cards to make 24!'
    }));
    setExpression('');
    setUsedCardIds(new Set());
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleCardClick = (card: Card) => {
    if (usedCardIds.has(card.id)) return;
    
    setExpression(prev => {
      const lastChar = prev.trim().slice(-1);
      // Automatically add space if needed
      const prefix = prev.length > 0 && !isNaN(Number(lastChar)) ? ' ' : '';
      return prev + prefix + card.value;
    });
    setUsedCardIds(prev => new Set(prev).add(card.id));
  };

  const handleOperatorClick = (op: string) => {
    setExpression(prev => prev + op);
  };

  const handleClear = () => {
    setExpression('');
    setUsedCardIds(new Set());
  };

  const handleDelete = () => {
    // This is tricky because we need to track which card was removed
    // For simplicity, let's just clear for now, or implement a smarter backspace
    // A better way: maintain an array of "tokens" (cards or operators)
    setExpression(prev => {
      const tokens = prev.trim().split(/\s+/);
      if (tokens.length === 0) return '';
      const lastToken = tokens[tokens.length - 1];
      
      // If it's a number, we need to find which card it belonged to
      // This is imperfect if there are duplicate values, but we can try to find the last used card with that value
      if (!isNaN(Number(lastToken))) {
        const val = Number(lastToken);
        const cardToRestore = gameState.currentCards.find(c => c.value === val && usedCardIds.has(c.id));
        if (cardToRestore) {
          setUsedCardIds(prevIds => {
            const next = new Set(prevIds);
            next.delete(cardToRestore.id);
            return next;
          });
        }
      }
      
      tokens.pop();
      return tokens.join(' ');
    });
  };

  const [isHintLoading, setIsHintLoading] = useState(false);

  const getHint = async () => {
    if (isHintLoading) return;
    setIsHintLoading(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const cardValues = gameState.currentCards.map(c => c.value).join(', ');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find one way to get 24 using these four numbers: ${cardValues}. 
        Rules: Use each number exactly once. Use only +, -, *, /. 
        Return ONLY the mathematical expression, nothing else. 
        Example: (3 + 3) * (6 - 2)`,
      });

      const hint = response.text?.trim();
      if (hint) {
        setGameState(prev => ({ ...prev, message: `Hint: ${hint}` }));
      }
    } catch (error) {
      console.error("Hint error:", error);
      setGameState(prev => ({ ...prev, message: "Could not get a hint right now." }));
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleSubmit = () => {
    if (usedCardIds.size !== 4) {
      setGameState(prev => ({ ...prev, message: "You must use all 4 cards!" }));
      return;
    }

    const { result, error } = evaluateExpression(expression, gameState.currentCards.map(c => c.value));
    
    if (error) {
      setGameState(prev => ({ ...prev, message: error }));
      return;
    }

    const isCorrect = Math.abs(result - 24) < 0.0001;

    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const round: GameRound = {
        cards: gameState.currentCards,
        expression,
        result,
        success: true,
        timestamp: Date.now()
      };

      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
        history: [round, ...prev.history],
        status: 'won',
        message: "Correct! That's 24!"
      }));

      setTimeout(startNewRound, 2000);
    } else {
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 1), // Penalty
        message: `Result is ${result.toFixed(2)}, not 24. Penalty: -1 point!`
      }));
    }
  };

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if modals are open
      if (showHelp || showHistory) return;

      const key = e.key;

      // Numbers 1-9
      if (/^[1-9]$/.test(key)) {
        const val = Number(key);
        const card = gameState.currentCards.find(c => c.value === val && !usedCardIds.has(c.id));
        if (card) {
          handleCardClick(card);
        }
      } 
      // Operators
      else if (['+', '-', '*', '/', '(', ')'].includes(key)) {
        handleOperatorClick(key);
      }
      // Backspace
      else if (key === 'Backspace') {
        handleDelete();
      }
      // Enter
      else if (key === 'Enter') {
        handleSubmit();
      }
      // Escape to clear
      else if (key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.currentCards, usedCardIds, showHelp, showHistory]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 max-w-4xl mx-auto relative overflow-hidden">
      {/* Decorative Stickers */}
      <div className="absolute -top-10 -left-10 w-40 h-40 opacity-10 rotate-12 pointer-events-none">
        <img src="https://picsum.photos/seed/judy/200/200" alt="" className="rounded-full grayscale" referrerPolicy="no-referrer" />
      </div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 -rotate-12 pointer-events-none">
        <img src="https://picsum.photos/seed/nick/200/200" alt="" className="rounded-full grayscale" referrerPolicy="no-referrer" />
      </div>
      <div className="absolute top-1/2 -left-20 w-32 h-32 opacity-5 rotate-45 pointer-events-none">
        <img src="https://picsum.photos/seed/sloth/200/200" alt="" className="rounded-full grayscale" referrerPolicy="no-referrer" />
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.5)] border-2 border-yellow-600">
            <span className="text-black font-black text-xs">ZPD</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-serif italic font-bold tracking-tight text-white drop-shadow-lg">
              Crazy 24
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-300/60">Zootopia Police Dept. Training</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="w-6 h-6 text-emerald-200/50" />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-300/60">Score</span>
            <span className="text-2xl font-mono font-bold text-white">{gameState.score}</span>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <History className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center gap-8">
        {/* Cards Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {gameState.currentCards.map((card) => (
              <CardComponent 
                key={card.id} 
                card={card} 
                isUsed={usedCardIds.has(card.id)}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Expression Input Display */}
        <div className="w-full max-w-lg">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-h-[80px] flex items-center justify-center text-3xl sm:text-4xl font-mono tracking-wider shadow-2xl text-white">
              {expression || <span className="text-white/20 italic text-xl">Type or click to build...</span>}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
            {gameState.status === 'won' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {gameState.message}
              </span>
            ) : gameState.message.includes('not 24') || gameState.message.includes('Must use') ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {gameState.message}
              </span>
            ) : (
              <span className="text-emerald-100/60">{gameState.message}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-lg grid grid-cols-4 gap-3">
          {['+', '-', '*', '/', '(', ')'].map((op) => (
            <button
              key={op}
              onClick={() => handleOperatorClick(op)}
              className="h-14 rounded-xl bg-white/10 border border-white/10 text-white text-2xl font-bold hover:bg-white/20 hover:border-white/30 transition-all active:scale-95 shadow-lg"
            >
              {op === '*' ? '×' : op === '/' ? '÷' : op}
            </button>
          ))}
          
          <button
            onClick={handleDelete}
            className="h-14 rounded-xl bg-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          >
            <Delete className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleClear}
            className="h-14 rounded-xl bg-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={usedCardIds.size !== 4}
            className={`
              col-span-4 h-16 rounded-2xl flex items-center justify-center gap-2 text-xl font-bold transition-all active:scale-[0.98]
              ${usedCardIds.size === 4 
                ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-yellow-400' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-5 h-5" /> Submit Answer
          </button>
        </div>
      </main>

      {/* Footer / Instructions */}
      <footer className="mt-12 flex flex-col items-center gap-4">
        <div className="flex gap-6">
          <button 
            onClick={getHint}
            disabled={isHintLoading}
            className="text-sm font-bold uppercase tracking-widest text-emerald-200/40 hover:text-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <HelpCircle className={`w-4 h-4 ${isHintLoading ? 'animate-spin' : ''}`} /> 
            {isHintLoading ? 'Thinking...' : 'Get a Hint'}
          </button>
          
          <button 
            onClick={startNewRound}
            className="text-sm font-bold uppercase tracking-widest text-emerald-200/40 hover:text-white transition-colors flex items-center gap-2"
          >
            Skip this round <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold italic text-white">How to Play</h2>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-4 text-zinc-400 leading-relaxed">
                <p>1. Use all <span className="font-bold text-white">4 cards</span> exactly once.</p>
                <p>2. Use <span className="font-bold text-white">+, -, ×, ÷</span> and parentheses to make exactly <span className="font-bold text-white">24</span>.</p>
                <p>3. Correct answers gain <span className="text-emerald-400 font-bold">+1 point</span>.</p>
                <p>4. Incorrect answers lose <span className="text-rose-400 font-bold">-1 point</span>.</p>
                <p>5. Stuck? Use the <span className="italic">Hint</span> button for an AI-generated solution!</p>
              </div>
              <div className="p-6 bg-white/5 flex justify-center">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="px-8 py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-all"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold italic text-white">Game History</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {gameState.history.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 italic">No rounds played yet.</div>
                ) : (
                  gameState.history.map((round, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-bold text-white">{round.expression} = 24</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {new Date(round.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {round.cards.map(c => (
                          <span key={c.id} className={`text-xs ${c.suit === 'hearts' || c.suit === 'diamonds' ? 'text-rose-400' : 'text-white'}`}>
                            {c.value === 1 ? 'A' : c.value}{SUIT_SYMBOLS[c.suit]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
