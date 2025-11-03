import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const RuleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-blue-400 mb-2">{title}</h2>
    <div className="text-gray-300 space-y-2 leading-relaxed">
      {children}
    </div>
  </div>
);

const RulesScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-400 hover:text-white transition">
          <ArrowLeftIcon />
          <span>Main Menu</span>
        </button>
        <h1 className="text-4xl font-bold text-center">Game Rules</h1>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="w-full max-w-4xl mx-auto overflow-y-auto pr-4">
        <RuleSection title="Objective">
          <p>The goal of Go is to control more territory on the board than your opponent. The game ends when both players pass consecutively. At that point, the player with the higher score (territory controlled plus captured stones) wins.</p>
        </RuleSection>

        <RuleSection title="Placing Stones">
          <p>Players take turns placing one of their colored stones (black or white) on an empty intersection of the grid. Black always moves first.</p>
          <p>Once placed, stones cannot be moved unless they are captured.</p>
        </RuleSection>
        
        <RuleSection title="Capturing Stones">
          <p>A stone or a group of connected stones is captured and removed from the board when all of its adjacent empty intersections (called "liberties") are occupied by the opponent's stones.</p>
          <p>Captured stones are added to the capturing player's score at the end of the game.</p>
        </RuleSection>

        <RuleSection title="Illegal Moves">
          <p><strong>Suicide:</strong> It is illegal to place a stone on a point where it would have no liberties, unless doing so immediately captures one or more of the opponent's stones.</p>
          <p><strong>Ko Rule:</strong> It is illegal to make a move that would repeat the exact same board position from the immediately preceding turn. This prevents infinite loops of capturing and re-capturing a single stone.</p>
        </RuleSection>

        <RuleSection title="Ending the Game">
          <p>Instead of placing a stone, a player may choose to "pass" their turn. When both players pass consecutively, the game ends.</p>
          <p>The players then count their score. A player's score is the number of empty intersections they have surrounded plus the number of opponent's stones they have captured.</p>
        </RuleSection>
      </div>
    </div>
  );
};

export default RulesScreen;