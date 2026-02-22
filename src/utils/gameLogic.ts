import { Card, CardValue } from '../types';

export const generateDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  
  // 1-9 values, 4 of each (one per suit)
  for (let v = 1; v <= 9; v++) {
    for (const suit of suits) {
      deck.push({
        id: `${suit}-${v}-${Math.random().toString(36).substr(2, 9)}`,
        value: v as CardValue,
        suit,
      });
    }
  }
  return deck;
};

export const drawFour = (): Card[] => {
  const deck = generateDeck();
  const shuffled = deck.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

// Simple solver to ensure the dealt cards have a solution
export const hasSolution = (cards: number[]): boolean => {
  const solve = (nums: number[]): boolean => {
    if (nums.length === 1) {
      return Math.abs(nums[0] - 24) < 0.0001;
    }

    for (let i = 0; i < nums.length; i++) {
      for (let j = 0; j < nums.length; j++) {
        if (i === j) continue;

        const nextNums = nums.filter((_, idx) => idx !== i && idx !== j);
        const a = nums[i];
        const b = nums[j];

        const results = [a + b, a - b, b - a, a * b];
        if (b !== 0) results.push(a / b);
        if (a !== 0) results.push(b / a);

        for (const res of results) {
          if (solve([...nextNums, res])) return true;
        }
      }
    }
    return false;
  };

  return solve(cards);
};

export const getSolvableHand = (): Card[] => {
  let cards = drawFour();
  while (!hasSolution(cards.map(c => c.value))) {
    cards = drawFour();
  }
  return cards;
};

export const evaluateExpression = (expr: string, usedCardValues: number[]): { result: number; error?: string } => {
  try {
    // Basic validation: only numbers, operators, and parentheses
    if (/[^0-9+\-*/().\s]/.test(expr)) {
      return { result: 0, error: "Invalid characters in expression" };
    }

    // Check if all numbers in the expression match the used cards
    const numbersInExpr = expr.match(/\d+/g)?.map(Number) || [];
    if (numbersInExpr.length !== 4) {
      return { result: 0, error: "Must use exactly 4 numbers" };
    }

    const sortedUsed = [...usedCardValues].sort();
    const sortedExpr = [...numbersInExpr].sort();
    
    if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedExpr)) {
      return { result: 0, error: "Must use the exact cards provided" };
    }

    // Use Function constructor for a slightly safer eval (still not perfect, but okay for this game)
    // We've already sanitized the input with the regex above.
    const result = new Function(`return ${expr}`)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: 0, error: "Invalid mathematical expression" };
    }

    return { result };
  } catch (e) {
    return { result: 0, error: "Math error" };
  }
};
