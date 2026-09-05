# 🧩 Sudoku Solver

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build: Passing](https://img.shields.io/badge/Build-Passing-brightgreen.svg)

A fast and efficient Sudoku Solver built to automatically solve standard 9x9 Sudoku puzzles. This project demonstrates the practical application of the Backtracking algorithm and recursive problem-solving techniques.

## 🚀 Features

*   **Standard 9x9 Grid:** Accurately solves any valid 9x9 Sudoku puzzle.
*   **Optimized Algorithm:** Utilizes the Backtracking algorithm for efficient state-space tree traversal.
*   **Validation:** Checks the validity of the initial grid and ensures rule compliance before placing numbers.
*   **Zero Dependencies:** Core logic implemented using standard libraries.

## 🧠 How It Works (Algorithm)

This solver uses the **Backtracking Algorithm**, a depth-first search approach:
1.  **Find Empty:** Scans the grid to find the first empty cell (represented by a 0 or '.').
2.  **Try Digits:** Attempts to place digits 1 through 9 in the empty cell.
3.  **Validate:** For each digit, it checks if the placement violates Sudoku rules (no duplicates in the current row, column, or 3x3 subgrid).
4.  **Recurse:** If valid, it recursively attempts to solve the rest of the board.
5.  **Backtrack:** If no digit works, it undoes the current placement (sets it back to empty) and backtracks to the previous cell to try a different digit.

### Complexity Analysis
*   **Time Complexity:** `O(9^(n*n))` in the worst case (where `n=9`). However, backtracking significantly prunes the search tree by eliminating invalid paths early, making the average execution time near-instantaneous.
*   **Space Complexity:** `O(n*n)` to account for the recursion stack depth during the backtracking process.

## 💻 Getting Started

### Prerequisites
*   A C++ Compiler (like GCC or Clang) or Python environment (depending on the language you used).

### Installation & Usage

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Spandan2106/Sudoku-solver.git](https://github.com/Spandan2106/Sudoku-solver.git)
    cd Sudoku-solver
    ```

2.  **Compile and Run:**
    *If you used C++:*
    ```bash
    g++ main.cpp -o solver
    ./solver
    ```
    *If you used Python:*
    ```bash
    python solver.py
    ```

## 🛠️ Future Improvements
*   [ ] Build a web-based GUI (React/Node.js) to visualize the backtracking process.
*   [ ] Add a feature to read puzzles from images (OCR) or text files.
*   [ ] Implement Algorithm X (Dancing Links) for comparison.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).
