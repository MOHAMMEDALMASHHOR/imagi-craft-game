import { PuzzlePiece, GameState } from '@/types';

interface AIPuzzleHint {
  type: 'optimal_move' | 'pattern_hint' | 'strategy_tip' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  targetPiece?: number;
  suggestedMove?: { from: number; to: number };
  confidence: number;
  visualHint?: {
    pieces: number[];
    highlightColor: string;
    animation: 'pulse' | 'glow' | 'arrow' | 'path';
  };
}

interface PuzzleAnalysisResult {
  difficulty: number;
  optimalMoves: number;
  currentProgress: number;
  stuckLevel: 'none' | 'slight' | 'moderate' | 'severe';
  hints: AIPuzzleHint[];
  nextOptimalMove?: { from: number; to: number };
  estimatedTimeToSolve: number;
  solverPath: { from: number; to: number }[];
}

class AIPuzzleSolver {
  private static instance: AIPuzzleSolver;
  private cache = new Map<string, PuzzleAnalysisResult>();
  private maxCacheSize = 100;

  private constructor() {}

  public static getInstance(): AIPuzzleSolver {
    if (!AIPuzzleSolver.instance) {
      AIPuzzleSolver.instance = new AIPuzzleSolver();
    }
    return AIPuzzleSolver.instance;
  }

  // Main analysis function
  public async analyzePuzzle(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number },
    gameState: GameState
  ): Promise<PuzzleAnalysisResult> {
    const cacheKey = this.generateCacheKey(pieces, gameState);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await this.performDeepAnalysis(pieces, gridSize, gameState);

    // Cache result
    this.cache.set(cacheKey, result);
    this.limitCacheSize();

    return result;
  }

  // Deep AI analysis
  private async performDeepAnalysis(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number },
    gameState: GameState
  ): Promise<PuzzleAnalysisResult> {
    const analysis = {
      currentProgress: this.calculateProgress(pieces),
      difficulty: this.estimateDifficulty(pieces, gridSize),
      hints: [] as AIPuzzleHint[],
    };

    // Generate solver path using advanced algorithms
    const solverPath = this.calculateOptimalPath(pieces, gridSize);
    analysis.optimalMoves = solverPath.length;

    // Analyze if player is stuck
    analysis.stuckLevel = this.assessStuckLevel(pieces, gameState, solverPath);

    // Generate contextual hints
    analysis.hints = await this.generateIntelligentHints(
      pieces,
      gridSize,
      gameState,
      solverPath,
      analysis.stuckLevel
    );

    // Determine next optimal move
    if (solverPath.length > 0) {
      analysis.nextOptimalMove = solverPath[0];
    }

    // Estimate solving time
    analysis.estimatedTimeToSolve = this.estimateSolvingTime(analysis);
    analysis.solverPath = solverPath;

    return analysis as PuzzleAnalysisResult;
  }

  // Calculate puzzle progress percentage
  private calculateProgress(pieces: PuzzlePiece[]): number {
    const correctPieces = pieces.filter(p => p.currentIndex === p.correctIndex).length;
    return (correctPieces / pieces.length) * 100;
  }

  // Estimate difficulty using ML-like heuristics
  private estimateDifficulty(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number }
  ): number {
    const totalPieces = pieces.length;
    const misplacedPieces = pieces.filter(p => p.currentIndex !== p.correctIndex).length;

    // Complexity factors
    const baseComplexity = totalPieces;
    const displacementFactor = this.calculateTotalDisplacement(pieces);
    const clusteringFactor = this.calculateClusteringCoefficient(pieces);
    const patternComplexity = this.detectPatternComplexity(pieces, gridSize);

    // Weighted difficulty score (0-100)
    const difficulty = Math.min(100,
      (baseComplexity * 0.3) +
      (displacementFactor * 0.25) +
      (clusteringFactor * 0.25) +
      (patternComplexity * 0.2)
    );

    return difficulty;
  }

  // Calculate total Manhattan distance for all pieces
  private calculateTotalDisplacement(pieces: PuzzlePiece[]): number {
    return pieces.reduce((total, piece) => {
      const currentPos = this.indexToPosition(piece.currentIndex, pieces.length);
      const correctPos = this.indexToPosition(piece.correctIndex, pieces.length);
      return total + Math.abs(currentPos.row - correctPos.row) + Math.abs(currentPos.col - correctPos.col);
    }, 0);
  }

  // Calculate how clustered misplaced pieces are
  private calculateClusteringCoefficient(pieces: PuzzlePiece[]): number {
    const misplacedPieces = pieces.filter(p => p.currentIndex !== p.correctIndex);
    if (misplacedPieces.length <= 1) return 0;

    let totalDistance = 0;
    let pairCount = 0;

    for (let i = 0; i < misplacedPieces.length; i++) {
      for (let j = i + 1; j < misplacedPieces.length; j++) {
        const pos1 = this.indexToPosition(misplacedPieces[i].currentIndex, pieces.length);
        const pos2 = this.indexToPosition(misplacedPieces[j].currentIndex, pieces.length);
        totalDistance += Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
        pairCount++;
      }
    }

    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  // Detect complex patterns in puzzle
  private detectPatternComplexity(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number }
  ): number {
    let complexity = 0;

    // Check for row swaps
    complexity += this.detectRowSwaps(pieces, gridSize) * 10;

    // Check for corner pieces
    complexity += this.checkCornerPieces(pieces, gridSize) * 5;

    // Check for edge pieces
    complexity += this.checkEdgePieces(pieces, gridSize) * 3;

    // Check for rotated patterns
    complexity += this.detectRotatedPatterns(pieces, gridSize) * 15;

    return Math.min(100, complexity);
  }

  // A* algorithm for finding optimal path
  private calculateOptimalPath(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number }
  ): { from: number; to: number }[] {
    const startState = this.piecesToState(pieces);
    const targetState = this.generateTargetState(pieces.length);

    // A* implementation
    const openSet = [startState];
    const closedSet = new Set();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, { state: any; move: { from: number; to: number } }>();

    gScore.set(this.stateToString(startState), 0);
    fScore.set(this.stateToString(startState), this.heuristic(startState, targetState));

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet.reduce((lowest, node) => {
        const nodeScore = fScore.get(this.stateToString(node)) || Infinity;
        const lowestScore = fScore.get(this.stateToString(lowest)) || Infinity;
        return nodeScore < lowestScore ? node : lowest;
      });

      if (this.isGoalState(current, targetState)) {
        return this.reconstructPath(cameFrom, current, startState);
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(this.stateToString(current));

      // Generate neighbors (all possible swaps)
      const neighbors = this.generateNeighbors(current);

      for (const neighbor of neighbors) {
        const neighborState = this.applyMove(current, neighbor.from, neighbor.to);
        const neighborStr = this.stateToString(neighborState);

        if (closedSet.has(neighborStr)) continue;

        const tentativeGScore = (gScore.get(this.stateToString(current)) || 0) + 1;

        const inOpenSet = openSet.some(node => this.stateToString(node) === neighborStr);

        if (!inOpenSet || tentativeGScore < (gScore.get(neighborStr) || Infinity)) {
          cameFrom.set(neighborStr, { state: current, move: neighbor });
          gScore.set(neighborStr, tentativeGScore);
          fScore.set(neighborStr, tentativeGScore + this.heuristic(neighborState, targetState));

          if (!inOpenSet) {
            openSet.push(neighborState);
          }
        }
      }
    }

    // If no path found, return empty array
    return [];
  }

  // Generate intelligent hints based on analysis
  private async generateIntelligentHints(
    pieces: PuzzlePiece[],
    gridSize: { rows: number; cols: number },
    gameState: GameState,
    solverPath: { from: number; to: number }[],
    stuckLevel: string
  ): Promise<AIPuzzleHint[]> {
    const hints: AIPuzzleHint[] = [];

    // Generate hints based on stuck level
    if (stuckLevel === 'severe') {
      hints.push({
        type: 'strategy_tip',
        priority: 'high',
        description: 'Try focusing on corner and edge pieces first. They have fewer possible positions.',
        confidence: 0.9,
        visualHint: {
          pieces: this.getCornerAndEdgePieces(pieces, gridSize),
          highlightColor: '#FF6B6B',
          animation: 'glow'
        }
      });
    }

    if (stuckLevel === 'moderate') {
      hints.push({
        type: 'pattern_hint',
        priority: 'medium',
        description: 'I notice a pattern. Try working on pieces that are close to their correct position.',
        confidence: 0.8,
        visualHint: {
          pieces: this.getNearCorrectPieces(pieces),
          highlightColor: '#4ECDC4',
          animation: 'pulse'
        }
      });
    }

    // Add hint for next optimal move if solver path exists
    if (solverPath.length > 0) {
      const nextMove = solverPath[0];
      hints.push({
        type: 'optimal_move',
        priority: 'high',
        description: `Swap piece ${nextMove.from + 1} with piece ${nextMove.to + 1} - this gets you closer to the solution!`,
        confidence: 0.95,
        targetPiece: nextMove.from,
        suggestedMove: nextMove,
        visualHint: {
          pieces: [nextMove.from, nextMove.to],
          highlightColor: '#10B981',
          animation: 'arrow'
        }
      });
    }

    // Add warning hints for potential mistakes
    const badMove = this.detectImpendingMistake(pieces, gameState);
    if (badMove) {
      hints.push({
        type: 'warning',
        priority: 'critical',
        description: '⚠️ Be careful! This move might undo recent progress.',
        confidence: 0.7,
        visualHint: {
          pieces: [badMove.from, badMove.to],
          highlightColor: '#EF4444',
          animation: 'pulse'
        }
      });
    }

    return hints.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Helper functions
  private generateCacheKey(pieces: PuzzlePiece[], gameState: GameState): string {
    return pieces.map(p => `${p.id}-${p.currentIndex}`).join(',') +
           gameState.moves.toString();
  }

  private limitCacheSize() {
    if (this.cache.size > this.maxCacheSize) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - this.maxCacheSize);
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  private indexToPosition(index: number, totalPieces: number): { row: number; col: number } {
    const cols = Math.ceil(Math.sqrt(totalPieces));
    return {
      row: Math.floor(index / cols),
      col: index % cols
    };
  }

  private piecesToState(pieces: PuzzlePiece[]): number[] {
    return pieces.map(p => p.currentIndex);
  }

  private generateTargetState(pieceCount: number): number[] {
    return Array.from({ length: pieceCount }, (_, i) => i);
  }

  private stateToString(state: number[]): string {
    return state.join(',');
  }

  private heuristic(state: number[], target: number[]): number {
    return state.reduce((sum, val, index) => {
      const targetIndex = target.indexOf(index);
      return sum + (targetIndex === -1 ? 100 : Math.abs(val - targetIndex));
    }, 0);
  }

  private isGoalState(current: number[], target: number[]): boolean {
    return current.every((val, index) => val === target[index]);
  }

  private generateNeighbors(state: number[]): { from: number; to: number }[] {
    const neighbors = [];
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        neighbors.push({ from: i, to: j });
      }
    }
    return neighbors;
  }

  private applyMove(state: number[], from: number, to: number): number[] {
    const newState = [...state];
    const fromIndex = state.indexOf(from);
    const toIndex = state.indexOf(to);

    if (fromIndex !== -1 && toIndex !== -1) {
      newState[fromIndex] = to;
      newState[toIndex] = from;
    }

    return newState;
  }

  private reconstructPath(
    cameFrom: Map<string, any>,
    current: number[],
    start: number[]
  ): { from: number; to: number }[] {
    const path: { from: number; to: number }[] = [];
    let state = current;

    while (this.stateToString(state) !== this.stateToString(start)) {
      const stateStr = this.stateToString(state);
      const previous = cameFrom.get(stateStr);

      if (!previous) break;

      path.unshift(previous.move);
      state = previous.state;
    }

    return path;
  }

  private assessStuckLevel(
    pieces: PuzzlePiece[],
    gameState: GameState,
    solverPath: { from: number; to: number }[]
  ): string {
    const movesWithoutProgress = gameState.moves - (this.calculateProgress(pieces) * pieces.length / 100);

    if (movesWithoutProgress > pieces.length * 2) return 'severe';
    if (movesWithoutProgress > pieces.length) return 'moderate';
    if (movesWithoutProgress > pieces.length / 2) return 'slight';
    return 'none';
  }

  private estimateSolvingTime(analysis: any): number {
    const baseTime = analysis.optimalMoves * 2; // 2 seconds per optimal move
    const stuckMultiplier = analysis.stuckLevel === 'severe' ? 3 :
                           analysis.stuckLevel === 'moderate' ? 2 :
                           analysis.stuckLevel === 'slight' ? 1.3 : 1;

    return baseTime * stuckMultiplier;
  }

  private detectRowSwaps(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): number {
    let rowSwaps = 0;
    for (let row = 0; row < gridSize.rows; row++) {
      const rowPieces = pieces.filter(p => {
        const pos = this.indexToPosition(p.currentIndex, pieces.length);
        return pos.row === row;
      });

      for (let i = 0; i < rowPieces.length - 1; i++) {
        for (let j = i + 1; j < rowPieces.length; j++) {
          const pos1 = this.indexToPosition(rowPieces[i].correctIndex, pieces.length);
          const pos2 = this.indexToPosition(rowPieces[j].correctIndex, pieces.length);
          if (pos1.row === row && pos2.row === row && pos1.col > pos2.col) {
            rowSwaps++;
          }
        }
      }
    }
    return rowSwaps;
  }

  private checkCornerPieces(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): number {
    const cornerIndices = [
      0, // top-left
      cols - 1, // top-right
      pieces.length - cols, // bottom-left
      pieces.length - 1 // bottom-right
    ];

    return cornerIndices.filter(index => {
      const piece = pieces.find(p => p.currentIndex === index);
      return piece && piece.correctIndex !== index;
    }).length;
  }

  private checkEdgePieces(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): number {
    let edgeMisplaced = 0;

    for (let i = 0; i < pieces.length; i++) {
      const pos = this.indexToPosition(i, pieces.length);
      const isEdge = pos.row === 0 || pos.row === gridSize.rows - 1 ||
                     pos.col === 0 || pos.col === gridSize.cols - 1;

      if (isEdge && pieces.find(p => p.currentIndex === i)?.correctIndex !== i) {
        edgeMisplaced++;
      }
    }

    return edgeMisplaced;
  }

  private detectRotatedPatterns(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): number {
    // Simplified pattern detection - check for 180-degree rotations
    let patterns = 0;

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces.find(p => p.currentIndex === i);
      if (!piece) continue;

      const currentPos = this.indexToPosition(piece.currentIndex, pieces.length);
      const correctPos = this.indexToPosition(piece.correctIndex, pieces.length);

      // Check if piece is in rotated position
      const rotatedRow = gridSize.rows - 1 - correctPos.row;
      const rotatedCol = gridSize.cols - 1 - correctPos.col;

      if (currentPos.row === rotatedRow && currentPos.col === rotatedCol) {
        patterns++;
      }
    }

    return patterns;
  }

  private getCornerAndEdgePieces(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): number[] {
    const edgePieces: number[] = [];

    for (let i = 0; i < pieces.length; i++) {
      const pos = this.indexToPosition(i, pieces.length);
      if (pos.row === 0 || pos.row === gridSize.rows - 1 ||
          pos.col === 0 || pos.col === gridSize.cols - 1) {
        edgePieces.push(i);
      }
    }

    return edgePieces;
  }

  private getNearCorrectPieces(pieces: PuzzlePiece[]): number[] {
    return pieces
      .filter(p => Math.abs(p.currentIndex - p.correctIndex) <= 2)
      .map(p => p.currentIndex);
  }

  private detectImpendingMistake(pieces: PuzzlePiece[], gameState: GameState): { from: number; to: number } | null {
    // Check if the last few moves are undoing progress
    const recentMoves = gameState.moves;
    const progress = this.calculateProgress(pieces);

    if (recentMoves > 10 && progress < 30) {
      // Player might be making random moves - suggest a specific move
      const misplacedPieces = pieces.filter(p => p.currentIndex !== p.correctIndex);
      if (misplacedPieces.length > 0) {
        return {
          from: misplacedPieces[0].currentIndex,
          to: misplacedPieces[0].correctIndex
        };
      }
    }

    return null;
  }
}

export default AIPuzzleSolver;