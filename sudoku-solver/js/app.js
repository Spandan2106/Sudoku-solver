/**
 * Sudoku Nexus - Master Application Controller
 */
class SudokuApp {
  constructor() {
    // Game State
    this.initialBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.currentBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.candidateMarks = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => Array(10).fill(false))
    );

    this.selectedCell = null; // { row, col }
    this.isNotesMode = false;
    this.difficulty = 'easy';

    // Undo / Redo Stacks
    this.historyStack = [];
    this.redoStack = [];

    // Timer State
    this.timerSeconds = 0;
    this.timerInterval = null;

    // Solver Visualizer State
    this.solverState = 'idle'; // 'idle' | 'running' | 'paused'
    this.solverGenerator = null;
    this.solverTimer = null;
    this.solverSpeedMs = 15;
    this.activeHint = null;

    // UI Cache
    this.dom = {};
  }

  init() {
    this.cacheDomElements();
    this.bindEvents();
    this.startNewGame('easy');
    this.startTimer();
  }

  cacheDomElements() {
    this.dom.grid = document.getElementById('sudokuGrid');
    this.dom.statusBanner = document.getElementById('statusBanner');
    this.dom.statusText = document.getElementById('statusText');
    this.dom.timerDisplay = document.getElementById('timerDisplay');

    // Controls & Buttons
    this.dom.difficultySelector = document.getElementById('difficultySelector');
    this.dom.btnNewGame = document.getElementById('btnNewGame');
    this.dom.btnImportExport = document.getElementById('btnImportExport');
    this.dom.btnHowItWorks = document.getElementById('btnHowItWorks');
    this.dom.btnAudioToggle = document.getElementById('btnAudioToggle');

    // Toolbar Buttons
    this.dom.btnUndo = document.getElementById('btnUndo');
    this.dom.btnRedo = document.getElementById('btnRedo');
    this.dom.btnErase = document.getElementById('btnErase');
    this.dom.btnNotesToggle = document.getElementById('btnNotesToggle');
    this.dom.notesBadge = document.getElementById('notesBadge');
    this.dom.btnAutoCandidates = document.getElementById('btnAutoCandidates');
    this.dom.btnHint = document.getElementById('btnHint');

    // Sidebar & Solver
    this.dom.solverStatePill = document.getElementById('solverStatePill');
    this.dom.btnVisualSolve = document.getElementById('btnVisualSolve');
    this.dom.btnInstantSolve = document.getElementById('btnInstantSolve');
    this.dom.solvingActiveControls = document.getElementById('solvingActiveControls');
    this.dom.btnPauseResumeSolve = document.getElementById('btnPauseResumeSolve');
    this.dom.btnStopSolve = document.getElementById('btnStopSolve');

    this.dom.solverSpeedSlider = document.getElementById('solverSpeedSlider');
    this.dom.speedValueText = document.getElementById('speedValueText');

    this.dom.metricSteps = document.getElementById('metricSteps');
    this.dom.metricBacktracks = document.getElementById('metricBacktracks');
    this.dom.metricTime = document.getElementById('metricTime');

    // Numpad & Actions
    this.dom.btnValidateBoard = document.getElementById('btnValidateBoard');
    this.dom.btnResetBoard = document.getElementById('btnResetBoard');

    // Hint Card
    this.dom.hintExplanationCard = document.getElementById('hintExplanationCard');
    this.dom.hintExplanationText = document.getElementById('hintExplanationText');
    this.dom.btnCloseHintCard = document.getElementById('btnCloseHintCard');
    this.dom.btnApplyHint = document.getElementById('btnApplyHint');

    // Modals
    this.dom.modalImportExport = document.getElementById('modalImportExport');
    this.dom.btnCloseImportModal = document.getElementById('btnCloseImportModal');
    this.dom.importBoardString = document.getElementById('importBoardString');
    this.dom.btnCopyBoardString = document.getElementById('btnCopyBoardString');
    this.dom.btnApplyImportString = document.getElementById('btnApplyImportString');

    this.dom.modalHowItWorks = document.getElementById('modalHowItWorks');
    this.dom.btnCloseHowModal = document.getElementById('btnCloseHowModal');
    this.dom.btnCloseHowModal2 = document.getElementById('btnCloseHowModal2');
  }

  bindEvents() {
    // Difficulty selector
    this.dom.difficultySelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-btn');
      if (!btn) return;
      this.dom.difficultySelector.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.difficulty = btn.dataset.difficulty;
      this.startNewGame(this.difficulty);
    });

    // New Game & Preset Actions
    this.dom.btnNewGame.addEventListener('click', () => this.startNewGame(this.difficulty));
    this.dom.btnResetBoard.addEventListener('click', () => this.resetToInitialBoard());
    this.dom.btnValidateBoard.addEventListener('click', () => this.validateUserBoard());

    // Toolbar Actions
    this.dom.btnNotesToggle.addEventListener('click', () => this.toggleNotesMode());
    this.dom.btnErase.addEventListener('click', () => this.eraseSelectedCell());
    this.dom.btnUndo.addEventListener('click', () => this.undo());
    this.dom.btnRedo.addEventListener('click', () => this.redo());
    this.dom.btnAutoCandidates.addEventListener('click', () => this.autoFillCandidates());
    this.dom.btnHint.addEventListener('click', () => this.triggerSmartHint());

    // Numpad Buttons
    document.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value, 10);
        this.inputDigit(val);
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Solver Actions
    this.dom.btnVisualSolve.addEventListener('click', () => this.startVisualSolve());
    this.dom.btnInstantSolve.addEventListener('click', () => this.runInstantSolve());
    this.dom.btnPauseResumeSolve.addEventListener('click', () => this.togglePauseSolve());
    this.dom.btnStopSolve.addEventListener('click', () => this.stopVisualSolve());

    this.dom.solverSpeedSlider.addEventListener('input', (e) => {
      this.solverSpeedMs = parseInt(e.target.value, 10);
      let label = `${this.solverSpeedMs} ms`;
      if (this.solverSpeedMs < 10) label = `Ultra (${this.solverSpeedMs} ms)`;
      else if (this.solverSpeedMs < 50) label = `Fast (${this.solverSpeedMs} ms)`;
      else label = `Step (${this.solverSpeedMs} ms)`;
      this.dom.speedValueText.textContent = label;
    });

    // Hint Card Actions
    this.dom.btnCloseHintCard.addEventListener('click', () => {
      this.dom.hintExplanationCard.classList.add('hidden');
    });

    this.dom.btnApplyHint.addEventListener('click', () => {
      if (this.activeHint && this.activeHint.val) {
        this.selectedCell = { row: this.activeHint.row, col: this.activeHint.col };
        this.inputDigit(this.activeHint.val);
        this.dom.hintExplanationCard.classList.add('hidden');
      }
    });

    // Audio Toggle
    this.dom.btnAudioToggle.addEventListener('click', () => {
      const enabled = window.soundEngine.toggleSound();
      const soundOnIcon = this.dom.btnAudioToggle.querySelector('.icon-sound-on');
      const soundOffIcon = this.dom.btnAudioToggle.querySelector('.icon-sound-off');
      if (enabled) {
        soundOnIcon.classList.remove('hidden');
        soundOffIcon.classList.add('hidden');
      } else {
        soundOnIcon.classList.add('hidden');
        soundOffIcon.classList.remove('hidden');
      }
    });

    // Modals
    this.dom.btnImportExport.addEventListener('click', () => {
      this.dom.importBoardString.value = SudokuGenerator.boardToString(this.currentBoard);
      this.dom.modalImportExport.classList.remove('hidden');
    });

    this.dom.btnCloseImportModal.addEventListener('click', () => {
      this.dom.modalImportExport.classList.add('hidden');
    });

    this.dom.btnCopyBoardString.addEventListener('click', () => {
      navigator.clipboard.writeText(this.dom.importBoardString.value);
      this.setStatus('Board string copied to clipboard!', 'solved');
    });

    this.dom.btnApplyImportString.addEventListener('click', () => {
      const str = this.dom.importBoardString.value.trim();
      if (str.length >= 81) {
        const board = SudokuGenerator.parseString(str);
        this.loadBoard(board);
        this.dom.modalImportExport.classList.add('hidden');
        this.setStatus('Custom puzzle loaded successfully.', 'solved');
      }
    });

    document.querySelectorAll('.sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleKey = btn.dataset.sample;
        const str = SudokuGenerator.SAMPLE_PUZZLES[sampleKey];
        if (str) {
          const board = SudokuGenerator.parseString(str);
          this.loadBoard(board);
          this.dom.modalImportExport.classList.add('hidden');
          this.setStatus(`Loaded sample: ${btn.textContent}`, 'solved');
        }
      });
    });

    this.dom.btnHowItWorks.addEventListener('click', () => {
      this.dom.modalHowItWorks.classList.remove('hidden');
    });
    this.dom.btnCloseHowModal.addEventListener('click', () => {
      this.dom.modalHowItWorks.classList.add('hidden');
    });
    this.dom.btnCloseHowModal2.addEventListener('click', () => {
      this.dom.modalHowItWorks.classList.add('hidden');
    });
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerSeconds = 0;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
    const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
    this.dom.timerDisplay.textContent = `${mins}:${secs}`;
  }

  startNewGame(difficulty = 'easy') {
    this.stopVisualSolve();
    const puzzle = SudokuGenerator.generatePuzzle(difficulty);
    this.loadBoard(puzzle);
    this.startTimer();
    this.setStatus(`New ${difficulty.toUpperCase()} game started. Good luck!`, 'ready');
  }

  loadBoard(board) {
    this.initialBoard = board.map(row => [...row]);
    this.currentBoard = board.map(row => [...row]);
    this.candidateMarks = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => Array(10).fill(false))
    );

    this.historyStack = [];
    this.redoStack = [];
    this.selectedCell = null;
    this.activeHint = null;
    this.dom.hintExplanationCard.classList.add('hidden');

    this.renderGrid();
    this.updateMetrics(0, 0, 0);
  }

  resetToInitialBoard() {
    this.stopVisualSolve();
    this.currentBoard = this.initialBoard.map(row => [...row]);
    this.candidateMarks = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => Array(10).fill(false))
    );
    this.historyStack = [];
    this.redoStack = [];
    this.renderGrid();
    window.soundEngine.playClick();
    this.setStatus('Board reset to initial puzzle.', 'ready');
  }

  renderGrid() {
    this.dom.grid.innerHTML = '';

    const selectedVal = this.selectedCell ? this.currentBoard[this.selectedCell.row][this.selectedCell.col] : 0;
    const valResult = SudokuSolver.validateBoard(this.currentBoard);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        const val = this.currentBoard[r][c];
        const isGiven = this.initialBoard[r][c] !== 0;

        if (isGiven) {
          cellEl.classList.add('given');
          cellEl.textContent = val;
        } else if (val !== 0) {
          cellEl.classList.add('user-input');
          cellEl.textContent = val;
        } else {
          // Render pencil mark candidates
          const candidateGrid = document.createElement('div');
          candidateGrid.className = 'candidate-grid';
          for (let num = 1; num <= 9; num++) {
            const numEl = document.createElement('div');
            numEl.className = 'candidate-num';
            if (this.candidateMarks[r][c][num]) {
              numEl.textContent = num;
            }
            candidateGrid.appendChild(numEl);
          }
          cellEl.appendChild(candidateGrid);
        }

        // Selection & Peer Highlighting
        if (this.selectedCell) {
          const { row: selR, col: selC } = this.selectedCell;
          if (r === selR && c === selC) {
            cellEl.classList.add('selected');
          } else if (r === selR || c === selC || (Math.floor(r / 3) === Math.floor(selR / 3) && Math.floor(c / 3) === Math.floor(selC / 3))) {
            cellEl.classList.add('peer-highlight');
          }

          if (val !== 0 && val === selectedVal) {
            cellEl.classList.add('same-num-highlight');
          }
        }

        // Error Highlighting
        if (valResult.errorCells.has(`${r},${c}`)) {
          cellEl.classList.add('error');
        }

        cellEl.addEventListener('click', () => {
          this.selectedCell = { row: r, col: c };
          this.renderGrid();
          window.soundEngine.playClick();
        });

        this.dom.grid.appendChild(cellEl);
      }
    }
  }

  saveSnapshot() {
    this.historyStack.push({
      board: this.currentBoard.map(row => [...row]),
      notes: this.candidateMarks.map(row => row.map(cell => [...cell]))
    });
    this.redoStack = [];
  }

  undo() {
    if (this.historyStack.length === 0) return;
    const previous = this.historyStack.pop();
    this.redoStack.push({
      board: this.currentBoard.map(row => [...row]),
      notes: this.candidateMarks.map(row => row.map(cell => [...cell]))
    });

    this.currentBoard = previous.board;
    this.candidateMarks = previous.notes;
    this.renderGrid();
    window.soundEngine.playClick();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop();
    this.historyStack.push({
      board: this.currentBoard.map(row => [...row]),
      notes: this.candidateMarks.map(row => row.map(cell => [...cell]))
    });

    this.currentBoard = next.board;
    this.candidateMarks = next.notes;
    this.renderGrid();
    window.soundEngine.playClick();
  }

  toggleNotesMode() {
    this.isNotesMode = !this.isNotesMode;
    if (this.isNotesMode) {
      this.dom.btnNotesToggle.classList.add('active');
      this.dom.notesBadge.textContent = 'ON';
    } else {
      this.dom.btnNotesToggle.classList.remove('active');
      this.dom.notesBadge.textContent = 'OFF';
    }
    window.soundEngine.playClick();
  }

  inputDigit(num) {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;

    // Given cells cannot be edited
    if (this.initialBoard[row][col] !== 0) return;

    this.saveSnapshot();

    if (this.isNotesMode) {
      if (num >= 1 && num <= 9) {
        this.candidateMarks[row][col][num] = !this.candidateMarks[row][col][num];
        window.soundEngine.playNote();
      }
    } else {
      if (this.currentBoard[row][col] === num) {
        this.currentBoard[row][col] = 0; // Toggle erase
      } else {
        this.currentBoard[row][col] = num;
        window.soundEngine.playClick();
      }
    }

    this.renderGrid();
    this.checkAutoCompletion();
  }

  eraseSelectedCell() {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    if (this.initialBoard[row][col] !== 0) return;

    this.saveSnapshot();
    this.currentBoard[row][col] = 0;
    this.candidateMarks[row][col].fill(false);
    this.renderGrid();
    window.soundEngine.playClick();
  }

  autoFillCandidates() {
    this.saveSnapshot();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentBoard[r][c] === 0) {
          const candidates = SudokuSolver.getCandidates(this.currentBoard, r, c);
          this.candidateMarks[r][c].fill(false);
          candidates.forEach(num => {
            this.candidateMarks[r][c][num] = true;
          });
        }
      }
    }
    this.renderGrid();
    window.soundEngine.playNote();
    this.setStatus('Auto-generated pencil candidate marks for all empty cells.', 'ready');
  }

  triggerSmartHint() {
    const hint = HintEngine.findNextHint(this.currentBoard);
    this.activeHint = hint;

    if (hint.type === 'NO_HINT') {
      this.setStatus('No hint available for current state.', 'ready');
      return;
    }

    this.selectedCell = { row: hint.row, col: hint.col };
    this.renderGrid();

    // Highlight hint cell
    const cellEl = this.dom.grid.querySelector(`.cell[data-row="${hint.row}"][data-col="${hint.col}"]`);
    if (cellEl) cellEl.classList.add('state-hint');

    this.dom.hintExplanationText.innerHTML = `
      <h5 style="color: var(--accent-cyan); font-weight:700; margin-bottom:0.35rem;">${hint.title}</h5>
      <p>${hint.description}</p>
    `;
    this.dom.hintExplanationCard.classList.remove('hidden');
    window.soundEngine.playNote();
  }

  validateUserBoard() {
    const valResult = SudokuSolver.validateBoard(this.currentBoard);
    if (!valResult.valid) {
      window.soundEngine.playError();
      this.setStatus(`Validation failed: Found ${valResult.errors.length} conflicting cell(s)!`, 'error');
    } else {
      window.soundEngine.playSolveFanfare();
      this.setStatus('Board is currently valid with zero conflicts!', 'solved');
    }
  }

  checkAutoCompletion() {
    let isFull = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentBoard[r][c] === 0) {
          isFull = false;
          break;
        }
      }
    }

    if (isFull) {
      const valResult = SudokuSolver.validateBoard(this.currentBoard);
      if (valResult.valid) {
        clearInterval(this.timerInterval);
        window.soundEngine.playSolveFanfare();
        this.setStatus(`Congratulations! Sudoku Solved in ${this.dom.timerDisplay.textContent}!`, 'solved');
      }
    }
  }

  // --- SOLVER ALGORITHM VISUALIZER LOGIC ---

  startVisualSolve() {
    if (this.solverState === 'running') return;

    this.solverGenerator = SudokuSolver.solveVisualGenerator(this.currentBoard);
    this.solverState = 'running';
    this.updateSolverUI();
    this.setStatus('Visual backtracking algorithm solver running...', 'solving');

    const startTime = performance.now();

    const stepLoop = () => {
      if (this.solverState !== 'running') return;

      const next = this.solverGenerator.next();
      if (next.done) {
        this.stopVisualSolve();
        return;
      }

      const step = next.value;
      this.updateMetrics(step.steps, step.backtracks, Math.round(performance.now() - startTime));

      if (step.type === 'TRY') {
        this.currentBoard[step.row][step.col] = step.val;
        this.renderGrid();
        const cellEl = this.dom.grid.querySelector(`.cell[data-row="${step.row}"][data-col="${step.col}"]`);
        if (cellEl) cellEl.classList.add('state-trying');
        window.soundEngine.playStep();
      } else if (step.type === 'BACKTRACK') {
        this.currentBoard[step.row][step.col] = 0;
        this.renderGrid();
        const cellEl = this.dom.grid.querySelector(`.cell[data-row="${step.row}"][data-col="${step.col}"]`);
        if (cellEl) cellEl.classList.add('state-backtrack');
      } else if (step.type === 'SOLVED') {
        this.currentBoard = step.solution;
        this.renderGrid();
        this.stopVisualSolve();
        window.soundEngine.playSolveFanfare();
        this.setStatus('Visual Backtracking Solver successfully solved the puzzle!', 'solved');
        return;
      } else if (step.type === 'UNSOLVABLE') {
        this.stopVisualSolve();
        window.soundEngine.playError();
        this.setStatus('Board configuration is UNSOLVABLE!', 'error');
        return;
      }

      this.solverTimer = setTimeout(stepLoop, this.solverSpeedMs);
    };

    stepLoop();
  }

  togglePauseSolve() {
    if (this.solverState === 'running') {
      this.solverState = 'paused';
      clearTimeout(this.solverTimer);
      this.setStatus('Solver visualizer paused.', 'ready');
    } else if (this.solverState === 'paused') {
      this.solverState = 'running';
      this.startVisualSolve();
    }
    this.updateSolverUI();
  }

  stopVisualSolve() {
    this.solverState = 'idle';
    clearTimeout(this.solverTimer);
    this.solverGenerator = null;
    this.updateSolverUI();
  }

  runInstantSolve() {
    this.stopVisualSolve();
    const result = SudokuSolver.solveInstant(this.currentBoard);

    if (result.solved) {
      this.currentBoard = result.solution;
      this.renderGrid();
      this.updateMetrics(result.stats.steps, result.stats.backtracks, result.stats.computeTimeMs);
      window.soundEngine.playSolveFanfare();
      this.setStatus(`Instant Solve completed in ${result.stats.computeTimeMs} ms (${result.stats.steps} steps)!`, 'solved');
    } else {
      window.soundEngine.playError();
      this.setStatus('Puzzle cannot be solved! No valid solution exists.', 'error');
    }
  }

  updateSolverUI() {
    if (this.solverState === 'running') {
      this.dom.solverStatePill.textContent = 'Running';
      this.dom.solverStatePill.className = 'status-pill running';
      this.dom.solvingActiveControls.classList.remove('hidden');
      this.dom.btnVisualSolve.classList.add('hidden');
    } else if (this.solverState === 'paused') {
      this.dom.solverStatePill.textContent = 'Paused';
      this.dom.solverStatePill.className = 'status-pill paused';
    } else {
      this.dom.solverStatePill.textContent = 'Idle';
      this.dom.solverStatePill.className = 'status-pill idle';
      this.dom.solvingActiveControls.classList.add('hidden');
      this.dom.btnVisualSolve.classList.remove('hidden');
    }
  }

  updateMetrics(steps, backtracks, computeTimeMs) {
    this.dom.metricSteps.textContent = steps;
    this.dom.metricBacktracks.textContent = backtracks;
    this.dom.metricTime.textContent = `${computeTimeMs} ms`;
  }

  setStatus(message, state = 'ready') {
    this.dom.statusText.textContent = message;
    this.dom.statusBanner.className = `status-banner ${state}`;
  }

  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key >= '1' && e.key <= '9') {
      this.inputDigit(parseInt(e.key, 10));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      this.eraseSelectedCell();
    } else if (e.key.toLowerCase() === 'n') {
      this.toggleNotesMode();
    } else if (e.key.toLowerCase() === 'h') {
      this.triggerSmartHint();
    } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) this.redo();
      else this.undo();
    } else if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
      this.redo();
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      if (!this.selectedCell) {
        this.selectedCell = { row: 0, col: 0 };
      } else {
        let { row, col } = this.selectedCell;
        if (e.key === 'ArrowUp') row = (row + 8) % 9;
        if (e.key === 'ArrowDown') row = (row + 1) % 9;
        if (e.key === 'ArrowLeft') col = (col + 8) % 9;
        if (e.key === 'ArrowRight') col = (col + 1) % 9;
        this.selectedCell = { row, col };
      }
      this.renderGrid();
    }
  }
}

// Instantiate and initialize on DOMReady
document.addEventListener('DOMContentLoaded', () => {
  window.sudokuApp = new SudokuApp();
  window.sudokuApp.init();
});
