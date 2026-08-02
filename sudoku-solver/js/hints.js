/**
 * Sudoku Nexus - Logical Hint Engine
 */
class HintEngine {
  static findNextHint(grid) {
    // Step 1: Check for conflicts
    const valResult = SudokuSolver.validateBoard(grid);
    if (!valResult.valid) {
      const err = valResult.errors[0];
      return {
        type: 'ERROR',
        row: err.row,
        col: err.col,
        val: err.val,
        title: 'Conflict Detected!',
        description: `Cell (${err.row + 1}, ${err.col + 1}) has a duplicate number '${err.val}' in its row, column, or 3x3 box.`
      };
    }

    // Step 2: Look for Naked Single (cell with only 1 candidate)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const candidates = SudokuSolver.getCandidates(grid, r, c);
          if (candidates.length === 1) {
            return {
              type: 'NAKED_SINGLE',
              row: r,
              col: c,
              val: candidates[0],
              title: 'Naked Single Found',
              description: `Cell R${r + 1}C${c + 1} has only one remaining valid digit: <strong>${candidates[0]}</strong>, as all other digits 1-9 exist in its row, column, or 3x3 block.`
            };
          }
        }
      }
    }

    // Step 3: Look for Hidden Single in Rows
    for (let r = 0; r < 9; r++) {
      for (let num = 1; num <= 9; num++) {
        const validCols = [];
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0 && SudokuSolver.isValid(grid, r, c, num)) {
            validCols.push(c);
          }
        }
        if (validCols.length === 1) {
          const c = validCols[0];
          return {
            type: 'HIDDEN_SINGLE_ROW',
            row: r,
            col: c,
            val: num,
            title: 'Hidden Single in Row',
            description: `In Row ${r + 1}, the digit <strong>${num}</strong> can only fit in column ${c + 1} (Cell R${r + 1}C${c + 1}).`
          };
        }
      }
    }

    // Step 4: Look for Hidden Single in Columns
    for (let c = 0; c < 9; c++) {
      for (let num = 1; num <= 9; num++) {
        const validRows = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][c] === 0 && SudokuSolver.isValid(grid, r, c, num)) {
            validRows.push(r);
          }
        }
        if (validRows.length === 1) {
          const r = validRows[0];
          return {
            type: 'HIDDEN_SINGLE_COL',
            row: r,
            col: c,
            val: num,
            title: 'Hidden Single in Column',
            description: `In Column ${c + 1}, the digit <strong>${num}</strong> can only fit in row ${r + 1} (Cell R${r + 1}C${c + 1}).`
          };
        }
      }
    }

    // Step 5: Look for Hidden Single in 3x3 Boxes
    for (let box = 0; box < 9; box++) {
      const boxStartRow = 3 * Math.floor(box / 3);
      const boxStartCol = 3 * (box % 3);

      for (let num = 1; num <= 9; num++) {
        const validCells = [];
        for (let i = 0; i < 9; i++) {
          const r = boxStartRow + Math.floor(i / 3);
          const c = boxStartCol + (i % 3);
          if (grid[r][c] === 0 && SudokuSolver.isValid(grid, r, c, num)) {
            validCells.push({ r, c });
          }
        }
        if (validCells.length === 1) {
          const { r, c } = validCells[0];
          return {
            type: 'HIDDEN_SINGLE_BOX',
            row: r,
            col: c,
            val: num,
            title: 'Hidden Single in 3x3 Box',
            description: `In Box ${box + 1}, the digit <strong>${num}</strong> can only fit in Cell R${r + 1}C${c + 1}.`
          };
        }
      }
    }

    // Step 6: Fallback to AI Solver Solution Search
    const solutionResult = SudokuSolver.solveInstant(grid);
    if (solutionResult.solved) {
      // Find first empty cell
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            const correctVal = solutionResult.solution[r][c];
            return {
              type: 'AI_SEARCH_HINT',
              row: r,
              col: c,
              val: correctVal,
              title: 'Advanced AI Suggestion',
              description: `Deep candidate analysis suggests placing digit <strong>${correctVal}</strong> in Cell R${r + 1}C${c + 1}.`
            };
          }
        }
      }
    }

    return {
      type: 'NO_HINT',
      title: 'No Hints Available',
      description: 'The current board has no empty cells or is unsolvable.'
    };
  }
}

window.HintEngine = HintEngine;
