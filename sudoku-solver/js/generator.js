/**
 * Sudoku Nexus - Procedural Puzzle Generator & Seed Library
 */
class SudokuGenerator {
  static SAMPLE_PUZZLES = {
    worldHardest: "800000000003600000070090200050007000000045700000100030001000068008500010090000400",
    classicEasy: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    medium: "000000085000210009960080100500800016000000000890006007009070052300054000480000000",
    hard: "000700000100000000000430200000000006000509000000000418000081000002000050040000300",
    expertDiabolical: "000000012000000003002300400001800005060070080000009000008500000900040500470006000"
  };

  /**
   * Parse 81-character string into 9x9 2D array
   */
  static parseString(str) {
    const cleanStr = str.replace(/[^0-9.]/g, '').padEnd(81, '0');
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const char = cleanStr[r * 9 + c];
        const val = (char === '.' || char === '0') ? 0 : parseInt(char, 10);
        row.push(val);
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Convert 9x9 2D array board into 81-char string
   */
  static boardToString(board) {
    let str = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        str += board[r][c] || '0';
      }
    }
    return str;
  }

  /**
   * Generate a random filled valid Sudoku board
   */
  static generateFullBoard() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    
    const fillCell = (r, c) => {
      if (r === 9) return true;
      const nextR = c === 8 ? r + 1 : r;
      const nextC = c === 8 ? 0 : c + 1;

      // Shuffle numbers 1-9
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

      for (const num of nums) {
        if (SudokuSolver.isValid(board, r, c, num)) {
          board[r][c] = num;
          if (fillCell(nextR, nextC)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    };

    fillCell(0, 0);
    return board;
  }

  /**
   * Procedural puzzle generator by difficulty
   */
  static generatePuzzle(difficulty = 'medium') {
    if (difficulty === 'custom') {
      return Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    const fullBoard = this.generateFullBoard();
    const puzzle = fullBoard.map(row => [...row]);

    // Target clue counts
    let targetClues = 34;
    if (difficulty === 'easy') targetClues = 40;
    if (difficulty === 'medium') targetClues = 32;
    if (difficulty === 'hard') targetClues = 26;
    if (difficulty === 'expert') targetClues = 22;

    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cells.push({ r, c });
      }
    }
    cells.sort(() => Math.random() - 0.5);

    let currentClues = 81;
    for (const cell of cells) {
      if (currentClues <= targetClues) break;
      const tempVal = puzzle[cell.r][cell.c];
      puzzle[cell.r][cell.c] = 0;

      // Ensure puzzle remains solvable
      const checkResult = SudokuSolver.solveInstant(puzzle);
      if (!checkResult.solved) {
        puzzle[cell.r][cell.c] = tempVal; // Revert
      } else {
        currentClues--;
      }
    }

    return puzzle;
  }
}

window.SudokuGenerator = SudokuGenerator;
