/**
 * Sudoku Nexus - Solver Engine & Backtracking Visualizer
 */
class SudokuSolver {
  /**
   * Check if placing `num` at board[row][col] is valid
   */
  static isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
      // Row check
      if (board[row][i] === num && i !== col) return false;
      // Column check
      if (board[i][col] === num && i !== row) return false;
      // 3x3 Box check
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (board[boxRow][boxCol] === num && (boxRow !== row || boxCol !== col)) return false;
    }
    return true;
  }

  /**
   * Get valid candidates for board[row][col]
   */
  static getCandidates(board, row, col) {
    if (board[row][col] !== 0) return [];
    const candidates = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  /**
   * Find empty cell with Minimum Remaining Values (MRV Heuristic)
   */
  static findBestEmptyCell(board) {
    let minCandidates = 10;
    let bestCell = null;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const count = this.getCandidates(board, r, c).length;
          if (count < minCandidates) {
            minCandidates = count;
            bestCell = { row: r, col: c, candidatesCount: count };
            if (count === 0) return bestCell; // Dead end early return
          }
        }
      }
    }
    return bestCell;
  }

  /**
   * Fast Instant Backtracking Solver
   */
  static solveInstant(grid) {
    const board = grid.map(row => [...row]);
    const startTime = performance.now();
    let steps = 0;
    let backtracks = 0;

    const solveRecursive = () => {
      steps++;
      const cell = this.findBestEmptyCell(board);
      if (!cell) return true; // Board is full & valid!

      const { row, col, candidatesCount } = cell;
      if (candidatesCount === 0) {
        backtracks++;
        return false; // No candidates -> backtrack
      }

      const candidates = this.getCandidates(board, row, col);
      for (const val of candidates) {
        board[row][col] = val;
        if (solveRecursive()) return true;
        board[row][col] = 0;
        backtracks++;
      }
      return false;
    };

    const solved = solveRecursive();
    const endTime = performance.now();

    return {
      solved,
      solution: solved ? board : null,
      stats: {
        steps,
        backtracks,
        computeTimeMs: Math.round((endTime - startTime) * 100) / 100
      }
    };
  }

  /**
   * Generator Function for Animated Backtracking Solver Visualizer
   */
  static *solveVisualGenerator(grid) {
    const board = grid.map(row => [...row]);
    let steps = 0;
    let backtracks = 0;

    function* solveStep() {
      steps++;
      const cell = SudokuSolver.findBestEmptyCell(board);
      if (!cell) return true;

      const { row, col, candidatesCount } = cell;
      if (candidatesCount === 0) {
        backtracks++;
        yield { type: 'DEAD_END', row, col, steps, backtracks };
        return false;
      }

      const candidates = SudokuSolver.getCandidates(board, row, col);
      for (const val of candidates) {
        board[row][col] = val;
        yield { type: 'TRY', row, col, val, steps, backtracks };

        const success = yield* solveStep();
        if (success) return true;

        board[row][col] = 0;
        backtracks++;
        yield { type: 'BACKTRACK', row, col, val, steps, backtracks };
      }
      return false;
    }

    const solved = yield* solveStep();
    if (solved) {
      yield { type: 'SOLVED', solution: board, steps, backtracks };
    } else {
      yield { type: 'UNSOLVABLE', steps, backtracks };
    }
  }

  /**
   * Validate entire board for current illegal placement errors
   */
  static validateBoard(grid) {
    const errors = [];
    const errorCells = new Set();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = grid[r][c];
        if (val !== 0) {
          if (!this.isValid(grid, r, c, val)) {
            errors.push({ row: r, col: c, val });
            errorCells.add(`${r},${c}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      errorCells
    };
  }
}

window.SudokuSolver = SudokuSolver;
