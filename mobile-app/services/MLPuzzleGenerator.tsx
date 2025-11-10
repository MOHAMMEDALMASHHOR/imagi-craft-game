import React, { createContext, useContext, useState, useEffect } from 'react';
import { PuzzlePiece, GameState } from '@/types';

interface MLPattern {
  id: string;
  type: 'row_swap' | 'column_swap' | 'corner_rotation' | 'spiral' | 'diamond' | 'cross' | 'random';
  difficulty: number; // 0-100
  complexity: number; // 0-100
  solvability: number; // 0-100 (how easy to solve)
  pattern: number[];
  name: string;
  description: string;
  tags: string[];
  optimalMoves: number;
  generationMethod: 'rule_based' | 'genetic' | 'neural' | 'hybrid';
}

interface PlayerProfile {
  id: string;
  skillLevel: number; // 0-100
  solvingSpeed: number; // moves per minute
  preferredDifficulty: number;
  patternStrengths: {
    [key: string]: number; // Performance by pattern type
  };
  learningRate: number;
  frustrationThreshold: number;
  successRate: number;
  averageMovesToSolve: number;
  totalTimePlayed: number;
  puzzlesCompleted: number;
  currentStreak: number;
  bestStreak: number;
}

interface DifficultyConfig {
  targetCompletionTime: number; // seconds
  targetMovesRatio: number; // moves / optimal moves
  frustrationLevel: number; // 0-100
  learningCurve: 'gentle' | 'normal' | 'steep' | 'adaptive';
  customizationLevel: number; // 0-100 how much to tailor to player

  // Weights for difficulty calculation
  patternComplexityWeight: number;
  displacementWeight: number;
  clusteringWeight: number;
  symmetryWeight: number;
}

interface MLPuzzleConfig {
  gridSize: { rows: number; cols: number };
  difficulty: number;
  patternTypes: string[];
  usePlayerProfile: boolean;
  allowAsymmetry: boolean;
  enforceSolvability: boolean;
  includeMultiplePatterns: boolean;
}

class MLPuzzleGenerator {
  private static instance: MLPuzzleGenerator;
  private playerProfiles: Map<string, PlayerProfile> = new Map();
  private patternLibrary: MLPattern[] = [];
  private neuralNetwork: any = null; // TensorFlow.js model
  private isModelLoaded = false;

  private constructor() {
    this.initializePatternLibrary();
    this.loadNeuralNetwork();
  }

  public static getInstance(): MLPuzzleGenerator {
    if (!MLPuzzleGenerator.instance) {
      MLPuzzleGenerator.instance = new MLPuzzleGenerator();
    }
    return MLPuzzleGenerator.instance;
  }

  // Main puzzle generation interface
  public async generatePuzzle(
    config: MLPuzzleConfig,
    playerId?: string
  ): Promise<{ pieces: PuzzlePiece[], metadata: any }> {
    const playerProfile = playerId ? this.getPlayerProfile(playerId) : null;
    const effectiveConfig = this.adaptConfigForPlayer(config, playerProfile);

    // Select generation method based on requirements
    let pieces: PuzzlePiece[];
    let metadata: any;

    if (effectiveConfig.difficulty < 30) {
      // Easy puzzles use rule-based generation
      const result = this.generateRuleBasedPuzzle(effectiveConfig);
      pieces = result.pieces;
      metadata = result.metadata;
    } else if (effectiveConfig.difficulty < 70) {
      // Medium puzzles use genetic algorithm
      const result = await this.generateGeneticPuzzle(effectiveConfig, playerProfile);
      pieces = result.pieces;
      metadata = result.metadata;
    } else {
      // Hard puzzles use neural network
      const result = await this.generateNeuralPuzzle(effectiveConfig, playerProfile);
      pieces = result.pieces;
      metadata = result.metadata;
    }

    // Validate puzzle solvability
    if (effectiveConfig.enforceSolvability) {
      const solvability = await this.assessSolvability(pieces, config.gridSize);
      if (solvability < 0.7) {
        // Regenerate with better solvability
        return this.generatePuzzle({
          ...config,
          difficulty: Math.max(config.difficulty - 10, 0)
        }, playerId);
      }
    }

    // Apply multiple patterns if requested
    if (effectiveConfig.includeMultiplePatterns && Math.random() < 0.3) {
      pieces = this.combinePatterns(pieces, effectiveConfig);
    }

    metadata.generationMethod = this.getGenerationMethod(effectiveConfig.difficulty);
    metadata.playerAdapted = !!playerProfile;
    metadata.solvabilityScore = await this.assessSolvability(pieces, config.gridSize);

    return { pieces, metadata };
  }

  // Rule-based puzzle generation for easy difficulties
  private generateRuleBasedPuzzle(config: MLPuzzleConfig): {
    pieces: PuzzlePiece[],
    metadata: any
  } {
    const totalPieces = config.gridSize.rows * config.gridSize.cols;
    const pieces: PuzzlePiece[] = [];

    // Start with solved state
    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: `piece-${i}`,
        currentIndex: i,
        correctIndex: i,
        position: this.indexToPosition(i, config.gridSize.cols),
        isCorrect: true,
        rotation: 0,
      });
    }

    // Apply simple, controlled patterns
    const pattern = this.selectPatternByDifficulty(config.difficulty);
    pieces = this.applyPattern(pieces, pattern, config);

    const metadata = {
      patternType: pattern.type,
      difficulty: config.difficulty,
      optimalMoves: pattern.optimalMoves,
      generationTime: performance.now(),
    };

    return { pieces, metadata };
  }

  // Genetic algorithm puzzle generation for medium difficulties
  private async generateGeneticPuzzle(
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): Promise<{ pieces: PuzzlePiece[], metadata: any }> {
    const populationSize = 20;
    const generations = 50;
    const mutationRate = 0.1;
    const eliteSize = 4;

    // Initialize population
    let population = this.initializePopulation(config, populationSize);

    // Evolution loop
    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitnessScores = await Promise.all(
        population.map(puzzle => this.evaluatePuzzleFitness(puzzle, config, playerProfile))
      );

      // Select elite
      const elite = this.selectElite(population, fitnessScores, eliteSize);

      // Create new generation
      const newPopulation: PuzzlePiece[][] = [...elite];

      while (newPopulation.length < populationSize) {
        const parent1 = this.tournamentSelection(population, fitnessScores);
        const parent2 = this.tournamentSelection(population, fitnessScores);
        const child = this.crossover(parent1, parent2);

        if (Math.random() < mutationRate) {
          this.mutate(child, config);
        }

        newPopulation.push(child);
      }

      population = newPopulation;

      // Early termination if we found a good solution
      const bestFitness = Math.max(...fitnessScores);
      if (bestFitness > 0.9) {
        break;
      }
    }

    // Select best puzzle
    const finalFitnessScores = await Promise.all(
      population.map(puzzle => this.evaluatePuzzleFitness(puzzle, config, playerProfile))
    );

    const bestIndex = finalFitnessScores.indexOf(Math.max(...finalFitnessScores));
    const bestPuzzle = population[bestIndex];

    const metadata = {
      generationMethod: 'genetic',
      generations,
      finalFitness: finalFitnessScores[bestIndex],
      populationSize,
      difficulty: config.difficulty,
      generationTime: performance.now(),
    };

    return { pieces: bestPuzzle, metadata };
  }

  // Neural network puzzle generation for hard difficulties
  private async generateNeuralPuzzle(
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): Promise<{ pieces: PuzzlePiece[], metadata: any }> {
    if (!this.isModelLoaded) {
      await this.waitForModelLoad();
    }

    // Generate candidate puzzles
    const candidates = this.generateNeuralCandidates(config, 10);

    // Score candidates using neural network
    const scores = await Promise.all(
      candidates.map(puzzle => this.scoreWithNeuralNetwork(puzzle, config, playerProfile))
    );

    // Select best candidate
    const bestIndex = scores.indexOf(Math.max(...scores));
    const bestPuzzle = candidates[bestIndex];

    // Apply fine-tuning
    const tunedPuzzle = await this.fineTunePuzzle(bestPuzzle, config, playerProfile);

    const metadata = {
      generationMethod: 'neural',
      neuralScore: scores[bestIndex],
      candidatesGenerated: candidates.length,
      difficulty: config.difficulty,
      generationTime: performance.now(),
      modelVersion: '1.0',
    };

    return { pieces: tunedPuzzle, metadata };
  }

  // Player profile management
  public updatePlayerProfile(
    playerId: string,
    gameState: GameState,
    moves: number,
    timeSpent: number,
    completed: boolean
  ): void {
    let profile = this.playerProfiles.get(playerId);

    if (!profile) {
      profile = this.createNewPlayerProfile(playerId);
      this.playerProfiles.set(playerId, profile);
    }

    // Update basic stats
    profile.totalTimePlayed += timeSpent;
    profile.currentStreak = completed ? profile.currentStreak + 1 : 0;
    profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak);

    if (completed) {
      profile.puzzlesCompleted++;
      profile.successRate = (profile.successRate * (profile.puzzlesCompleted - 1) + 1) / profile.puzzlesCompleted;

      // Update skill level
      const performanceScore = this.calculatePerformanceScore(gameState, moves, timeSpent);
      profile.skillLevel = Math.min(100, profile.skillLevel + performanceScore * 0.1);

      // Update solving speed
      const movesPerMinute = moves / (timeSpent / 60);
      profile.solvingSpeed = (profile.solvingSpeed * 0.8) + (movesPerMinute * 0.2);

      // Update average moves to solve
      profile.averageMovesToSolve = (profile.averageMovesToSolve * 0.9) + (moves * 0.1);
    } else {
      // Update frustration
      profile.frustrationThreshold = Math.max(0, profile.frustrationThreshold - 5);
    }

    // Save updated profile
    this.savePlayerProfile(playerId, profile);
  }

  public getPlayerProfile(playerId: string): PlayerProfile | null {
    return this.playerProfiles.get(playerId) || null;
  }

  public predictPlayerSuccess(
    playerId: string,
    puzzleDifficulty: number,
    patternTypes: string[]
  ): number {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return 0.5;

    // Calculate success probability based on profile
    let successProbability = 0.5;

    // Factor in skill level vs difficulty
    const skillDifficultyRatio = profile.skillLevel / puzzleDifficulty;
    successProbability += (skillDifficultyRatio - 1) * 0.3;

    // Factor in pattern strengths
    const patternStrength = patternTypes.reduce((sum, type) => {
      return sum + (profile.patternStrengths[type] || 0.5);
    }, 0) / patternTypes.length;
    successProbability += (patternStrength - 0.5) * 0.2;

    // Factor in recent success rate
    successProbability += (profile.successRate - 0.5) * 0.2;

    // Factor in current streak
    const streakBonus = Math.min(profile.currentStreak / 10, 0.1);
    successProbability += streakBonus;

    return Math.max(0, Math.min(1, successProbability));
  }

  // Pattern analysis and recommendation
  public analyzePlayerPatterns(playerId: string): {
    strengths: string[],
    weaknesses: string[],
    recommendations: string[],
  } {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) {
      return {
        strengths: [],
        weaknesses: [],
        recommendations: ['Play more puzzles to build your profile'],
      };
    }

    const sortedPatterns = Object.entries(profile.patternStrengths)
      .sort(([, a], [, b]) => b - a);

    const strengths = sortedPatterns
      .filter(([, strength]) => strength > 0.7)
      .map(([type]) => type);

    const weaknesses = sortedPatterns
      .filter(([, strength]) => strength < 0.3)
      .map(([type]) => type);

    const recommendations = this.generateRecommendations(profile, strengths, weaknesses);

    return { strengths, weaknesses, recommendations };
  }

  // Adaptive difficulty adjustment
  public adaptDifficulty(
    playerId: string,
    currentDifficulty: number,
    recentPerformance: number[]
  ): number {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return currentDifficulty;

    const averagePerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;

    let targetDifficulty = currentDifficulty;

    if (averagePerformance > 0.8 && recentPerformance.length >= 3) {
      // Player is doing well, increase difficulty
      targetDifficulty = Math.min(100, currentDifficulty + 5 * profile.learningRate);
    } else if (averagePerformance < 0.4 && recentPerformance.length >= 3) {
      // Player is struggling, decrease difficulty
      targetDifficulty = Math.max(0, currentDifficulty - 10 * profile.learningRate);
    }

    // Consider frustration threshold
    if (profile.frustrationThreshold < 30) {
      targetDifficulty = Math.max(0, targetDifficulty - 5);
    }

    return targetDifficulty;
  }

  // Private helper methods
  private async loadNeuralNetwork(): Promise<void> {
    try {
      // In a real implementation, this would load a TensorFlow.js model
      // For now, we'll simulate the model loading
      setTimeout(() => {
        this.isModelLoaded = true;
        this.neuralNetwork = this.createMockNeuralNetwork();
      }, 1000);
    } catch (error) {
      console.error('Failed to load neural network:', error);
      this.isModelLoaded = false;
    }
  }

  private createMockNeuralNetwork(): any {
    return {
      predict: (input: number[]) => {
        // Simple mock prediction
        return Math.random();
      },
    };
  }

  private async waitForModelLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isModelLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private initializePatternLibrary(): void {
    this.patternLibrary = [
      {
        id: 'row_swap_1',
        type: 'row_swap',
        difficulty: 20,
        complexity: 15,
        solvability: 95,
        pattern: [],
        name: 'Simple Row Swap',
        description: 'Two adjacent rows are swapped',
        tags: ['easy', 'pattern', 'rows'],
        optimalMoves: 4,
        generationMethod: 'rule_based',
      },
      {
        id: 'corner_rotation_1',
        type: 'corner_rotation',
        difficulty: 35,
        complexity: 40,
        solvability: 80,
        pattern: [],
        name: 'Corner Rotation',
        description: 'Corner pieces are rotated 180 degrees',
        tags: ['medium', 'corners', 'rotation'],
        optimalMoves: 8,
        generationMethod: 'rule_based',
      },
      {
        id: 'spiral_1',
        type: 'spiral',
        difficulty: 60,
        complexity: 75,
        solvability: 70,
        pattern: [],
        name: 'Spiral Pattern',
        description: 'Pieces follow a spiral displacement pattern',
        tags: ['hard', 'spiral', 'complex'],
        optimalMoves: 15,
        generationMethod: 'genetic',
      },
      {
        id: 'diamond_1',
        type: 'diamond',
        difficulty: 75,
        complexity: 85,
        solvability: 65,
        pattern: [],
        name: 'Diamond Shuffle',
        description: 'Diamond-shaped区域的 pieces are shuffled',
        tags: ['expert', 'geometric', 'diamond'],
        optimalMoves: 20,
        generationMethod: 'neural',
      },
    ];
  }

  private createNewPlayerProfile(playerId: string): PlayerProfile {
    return {
      id: playerId,
      skillLevel: 50,
      solvingSpeed: 10, // moves per minute
      preferredDifficulty: 50,
      patternStrengths: {},
      learningRate: 0.1,
      frustrationThreshold: 70,
      successRate: 0.5,
      averageMovesToSolve: 50,
      totalTimePlayed: 0,
      puzzlesCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  private adaptConfigForPlayer(
    config: MLPuzzleConfig,
    playerProfile: PlayerProfile | null
  ): MLPuzzleConfig {
    if (!playerProfile || !config.usePlayerProfile) {
      return config;
    }

    const adaptedConfig = { ...config };

    // Adjust difficulty based on player skill
    const difficultyOffset = (playerProfile.skillLevel - 50) * 0.2;
    adaptedConfig.difficulty = Math.max(0, Math.min(100,
      config.difficulty + difficultyOffset
    ));

    // Select pattern types based on player strengths/weaknesses
    if (playerProfile.patternStrengths) {
      const playerPatterns = Object.entries(playerProfile.patternStrengths);
      const strongPatterns = playerPatterns
        .filter(([, strength]) => strength > 0.6)
        .map(([type]) => type);

      if (strongPatterns.length > 0 && Math.random() < 0.7) {
        adaptedConfig.patternTypes = strongPatterns;
      }
    }

    return adaptedConfig;
  }

  private indexToPosition(index: number, cols: number): { x: number; y: number } {
    return {
      x: (index % cols) * 100,
      y: Math.floor(index / cols) * 100,
    };
  }

  private selectPatternByDifficulty(difficulty: number): MLPattern {
    const suitablePatterns = this.patternLibrary.filter(
      pattern => Math.abs(pattern.difficulty - difficulty) < 20
    );

    return suitablePatterns[Math.floor(Math.random() * suitablePatterns.length)] ||
           this.patternLibrary[0];
  }

  private applyPattern(pieces: PuzzlePiece[], pattern: MLPattern, config: MLPuzzleConfig): PuzzlePiece[] {
    // This is a simplified pattern application
    // In a real implementation, this would be much more sophisticated

    switch (pattern.type) {
      case 'row_swap':
        return this.applyRowSwap(pieces, config);
      case 'corner_rotation':
        return this.applyCornerRotation(pieces, config);
      case 'spiral':
        return this.applySpiralPattern(pieces, config);
      default:
        return this.shuffleRandomly(pieces, config.difficulty);
    }
  }

  private applyRowSwap(pieces: PuzzlePiece[], config: MLPuzzleConfig): PuzzlePiece[] {
    const result = [...pieces];
    const rows = config.gridSize.rows;
    const row1 = Math.floor(Math.random() * rows);
    let row2 = Math.floor(Math.random() * rows);
    while (row2 === row1) {
      row2 = Math.floor(Math.random() * rows);
    }

    // Swap the rows
    for (let col = 0; col < config.gridSize.cols; col++) {
      const index1 = row1 * config.gridSize.cols + col;
      const index2 = row2 * config.gridSize.cols + col;

      const temp = result[index1].currentIndex;
      result[index1].currentIndex = result[index2].currentIndex;
      result[index2].currentIndex = temp;

      result[index1].isCorrect = result[index1].currentIndex === result[index1].correctIndex;
      result[index2].isCorrect = result[index2].currentIndex === result[index2].correctIndex;
    }

    return result;
  }

  private applyCornerRotation(pieces: PuzzlePiece[], config: MLPuzzleConfig): PuzzlePiece[] {
    const result = [...pieces];
    const totalPieces = result.length;
    const size = Math.sqrt(totalPieces);

    const corners = [0, size - 1, totalPieces - size, totalPieces - 1];
    const rotated = [...corners].reverse();

    corners.forEach((corner, index) => {
      result[corner].currentIndex = rotated[index];
      result[corner].isCorrect = result[corner].currentIndex === result[corner].correctIndex;
    });

    return result;
  }

  private applySpiralPattern(pieces: PuzzlePiece[], config: MLPuzzleConfig): PuzzlePiece[] {
    // Simplified spiral pattern
    const result = [...pieces];
    const totalPieces = result.length;
    const spiralOrder = this.generateSpiralOrder(config.gridSize.rows, config.gridSize.cols);

    for (let i = 0; i < spiralOrder.length - 1; i++) {
      const currentIndex = spiralOrder[i];
      const nextIndex = spiralOrder[i + 1];

      const temp = result[currentIndex].currentIndex;
      result[currentIndex].currentIndex = result[nextIndex].currentIndex;
      result[nextIndex].currentIndex = temp;
    }

    result.forEach(piece => {
      piece.isCorrect = piece.currentIndex === piece.correctIndex;
    });

    return result;
  }

  private shuffleRandomly(pieces: PuzzlePiece[], difficulty: number): PuzzlePiece[] {
    const result = [...pieces];
    const shuffleIntensity = Math.floor((difficulty / 100) * result.length * 0.5);

    for (let i = 0; i < shuffleIntensity; i++) {
      const index1 = Math.floor(Math.random() * result.length);
      const index2 = Math.floor(Math.random() * result.length);

      const temp = result[index1].currentIndex;
      result[index1].currentIndex = result[index2].currentIndex;
      result[index2].currentIndex = temp;
    }

    result.forEach(piece => {
      piece.isCorrect = piece.currentIndex === piece.correctIndex;
    });

    return result;
  }

  private generateSpiralOrder(rows: number, cols: number): number[] {
    const spiral: number[] = [];
    let top = 0, bottom = rows - 1, left = 0, right = cols - 1;

    while (top <= bottom && left <= right) {
      for (let col = left; col <= right; col++) {
        spiral.push(top * cols + col);
      }
      top++;

      for (let row = top; row <= bottom; row++) {
        spiral.push(row * cols + right);
      }
      right--;

      if (top <= bottom) {
        for (let col = right; col >= left; col--) {
          spiral.push(bottom * cols + col);
        }
        bottom--;
      }

      if (left <= right) {
        for (let row = bottom; row >= top; row--) {
          spiral.push(row * cols + left);
        }
        left++;
      }
    }

    return spiral;
  }

  // Additional helper methods for genetic and neural generation would be implemented here
  private initializePopulation(config: MLPuzzleConfig, size: number): PuzzlePiece[][] {
    // Initialize population with random puzzles
    const population: PuzzlePiece[][] = [];

    for (let i = 0; i < size; i++) {
      const puzzle = this.shuffleRandomly(
        this.createSolvedPuzzle(config),
        config.difficulty
      );
      population.push(puzzle);
    }

    return population;
  }

  private createSolvedPuzzle(config: MLPuzzleConfig): PuzzlePiece[] {
    const totalPieces = config.gridSize.rows * config.gridSize.cols;
    const pieces: PuzzlePiece[] = [];

    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: `piece-${i}`,
        currentIndex: i,
        correctIndex: i,
        position: this.indexToPosition(i, config.gridSize.cols),
        isCorrect: true,
        rotation: 0,
      });
    }

    return pieces;
  }

  private async evaluatePuzzleFitness(
    puzzle: PuzzlePiece[],
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): Promise<number> {
    // Simplified fitness evaluation
    let fitness = 0.5;

    // Difficulty matching
    const puzzleDifficulty = this.estimatePuzzleDifficulty(puzzle);
    const difficultyMatch = 1 - Math.abs(puzzleDifficulty - config.difficulty) / 100;
    fitness += difficultyMatch * 0.3;

    // Player adaptation bonus
    if (playerProfile) {
      const playerSuccessProb = this.predictPlayerSuccess(
        playerProfile.id,
        config.difficulty,
        config.patternTypes
      );
      fitness += (playerSuccessProb - 0.5) * 0.2;
    }

    return Math.max(0, Math.min(1, fitness));
  }

  private estimatePuzzleDifficulty(puzzle: PuzzlePiece[]): number {
    // Simplified difficulty estimation
    const misplacedPieces = puzzle.filter(p => !p.isCorrect).length;
    return (misplacedPieces / puzzle.length) * 100;
  }

  private selectElite(population: PuzzlePiece[][], fitnessScores: number[], eliteSize: number): PuzzlePiece[][] {
    const indexed = population.map((puzzle, index) => ({ puzzle, fitness: fitnessScores[index] }));
    indexed.sort((a, b) => b.fitness - a.fitness);
    return indexed.slice(0, eliteSize).map(item => item.puzzle);
  }

  private tournamentSelection(population: PuzzlePiece[][], fitnessScores: number[]): PuzzlePiece[] {
    const tournamentSize = 5;
    const tournament: { puzzle: PuzzlePiece[], fitness: number }[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const index = Math.floor(Math.random() * population.length);
      tournament.push({
        puzzle: population[index],
        fitness: fitnessScores[index],
      });
    }

    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0].puzzle;
  }

  private crossover(parent1: PuzzlePiece[], parent2: PuzzlePiece[]): PuzzlePiece[] {
    // Simple crossover - take half from each parent
    const crossoverPoint = Math.floor(parent1.length / 2);
    const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    return this.validatePuzzle(child);
  }

  private mutate(puzzle: PuzzlePiece[], config: MLPuzzleConfig): void {
    const mutationCount = Math.max(1, Math.floor(puzzle.length * 0.1));

    for (let i = 0; i < mutationCount; i++) {
      const index1 = Math.floor(Math.random() * puzzle.length);
      const index2 = Math.floor(Math.random() * puzzle.length);

      const temp = puzzle[index1].currentIndex;
      puzzle[index1].currentIndex = puzzle[index2].currentIndex;
      puzzle[index2].currentIndex = temp;
    }
  }

  private validatePuzzle(puzzle: PuzzlePiece[]): PuzzlePiece[] {
    // Ensure each index is unique
    const usedIndices = new Set<number>();

    puzzle.forEach((piece, index) => {
      if (!usedIndices.has(piece.currentIndex)) {
        usedIndices.add(piece.currentIndex);
      } else {
        // Fix duplicate indices
        for (let i = 0; i < puzzle.length; i++) {
          if (!usedIndices.has(i)) {
            piece.currentIndex = i;
            usedIndices.add(i);
            break;
          }
        }
      }

      piece.isCorrect = piece.currentIndex === piece.correctIndex;
    });

    return puzzle;
  }

  private generateNeuralCandidates(config: MLPuzzleConfig, count: number): PuzzlePiece[][] {
    const candidates: PuzzlePiece[][] = [];

    for (let i = 0; i < count; i++) {
      const puzzle = this.shuffleRandomly(
        this.createSolvedPuzzle(config),
        config.difficulty
      );
      candidates.push(puzzle);
    }

    return candidates;
  }

  private async scoreWithNeuralNetwork(
    puzzle: PuzzlePiece[],
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): Promise<number> {
    if (!this.neuralNetwork) {
      return Math.random();
    }

    // Create input features for the neural network
    const features = this.extractPuzzleFeatures(puzzle, config, playerProfile);
    return this.neuralNetwork.predict(features);
  }

  private extractPuzzleFeatures(
    puzzle: PuzzlePiece[],
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): number[] {
    const features = [];

    // Basic puzzle features
    features.push(puzzle.length);
    features.push(puzzle.filter(p => !p.isCorrect).length / puzzle.length);
    features.push(config.difficulty / 100);

    // Player features
    if (playerProfile) {
      features.push(playerProfile.skillLevel / 100);
      features.push(playerProfile.successRate);
      features.push(playerProfile.solvingSpeed / 50);
    } else {
      features.push(0.5, 0.5, 0.5);
    }

    return features;
  }

  private async fineTunePuzzle(
    puzzle: PuzzlePiece[],
    config: MLPuzzleConfig,
    playerProfile?: PlayerProfile
  ): Promise<PuzzlePiece[]> {
    // Simple fine-tuning - adjust a few pieces to improve the score
    const result = [...puzzle];
    const adjustments = Math.max(1, Math.floor(result.length * 0.05));

    for (let i = 0; i < adjustments; i++) {
      const index1 = Math.floor(Math.random() * result.length);
      let index2 = Math.floor(Math.random() * result.length);
      while (index2 === index1) {
        index2 = Math.floor(Math.random() * result.length);
      }

      // Swap pieces
      const temp = result[index1].currentIndex;
      result[index1].currentIndex = result[index2].currentIndex;
      result[index2].currentIndex = temp;
    }

    return result;
  }

  private combinePatterns(pieces: PuzzlePiece[], config: MLPuzzleConfig): PuzzlePiece[] {
    // Apply multiple patterns to create more complex puzzles
    let result = [...pieces];

    const patterns = this.patternLibrary.filter(p => p.difficulty <= config.difficulty);
    const numPatterns = Math.min(2, patterns.length);

    for (let i = 0; i < numPatterns; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      result = this.applyPattern(result, pattern, config);
    }

    return result;
  }

  private getGenerationMethod(difficulty: number): string {
    if (difficulty < 30) return 'rule_based';
    if (difficulty < 70) return 'genetic';
    return 'neural';
  }

  private async assessSolvability(pieces: PuzzlePiece[], gridSize: { rows: number; cols: number }): Promise<number> {
    // Simplified solvability assessment
    // In a real implementation, this would use a puzzle solver
    const misplacedPieces = pieces.filter(p => !p.isCorrect).length;
    const totalPieces = pieces.length;

    if (misplacedPieces === 0) return 1.0;
    if (misplacedPieces === totalPieces) return 0.1;

    // Simple heuristic: easier to solve if fewer pieces are misplaced
    return 1.0 - (misplacedPieces / totalPieces) * 0.8;
  }

  private calculatePerformanceScore(gameState: GameState, moves: number, timeSpent: number): number {
    // Calculate performance score based on moves and time
    const optimalMoves = gameState.pieces?.length || 50;
    const moveEfficiency = Math.max(0, 1 - (moves - optimalMoves) / optimalMoves);
    const timeEfficiency = Math.max(0, 1 - (timeSpent - 60) / 120); // 2 minutes as baseline

    return (moveEfficiency + timeEfficiency) / 2;
  }

  private generateRecommendations(
    profile: PlayerProfile,
    strengths: string[],
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (weaknesses.length > 0) {
      recommendations.push(`Practice patterns with ${weaknesses.join(', ')} to improve your skills`);
    }

    if (profile.skillLevel < 30) {
      recommendations.push('Try easier puzzles to build confidence');
    } else if (profile.skillLevel > 80) {
      recommendations.push('Challenge yourself with harder puzzles');
    }

    if (profile.frustrationThreshold < 50) {
      recommendations.push('Take breaks between puzzles to stay fresh');
    }

    if (profile.currentStreak > 5) {
      recommendations.push('Great streak! Keep up the momentum!');
    }

    return recommendations;
  }

  private savePlayerProfile(playerId: string, profile: PlayerProfile): void {
    // In a real implementation, this would save to persistent storage
    this.playerProfiles.set(playerId, profile);
  }
}

export default MLPuzzleGenerator;