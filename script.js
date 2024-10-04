//Variables DOM
const body = document.querySelector("body");

const themes = {
  baby: "theme--level-baby",
  intermediate: "theme--level-intermediate",
  hell: "theme--level-hell",
  nonsence: "theme--level-nonsence",
};

const levelBtns = {
  levelBabyBtn: document.querySelector(".navbar__btn-baby"),
  levelIntermediateBtn: document.querySelector(".navbar__btn-intermediate"),
  levelHellBtn: document.querySelector(".navbar__btn-hell"),
  levelNonsenceBtn: document.querySelector(".navbar__btn-nonsence"),
};

const resetBtn = document.querySelector(".minesweeper__reset-btn");
const undeliveredFlagCounter = document.querySelector(".minesweeper__counter");

const cellField = document.querySelector(".minesweeper__cell-field");

const actionPanel = document.querySelector(".minesweeper__action-panel");
const continueBtn = document.querySelector(".minesweeper__continue-btn");

//Variables ordinary global
let isClickable = true;
let isThatTheFirstMove = true;
let clickCounter = 0;
let flagCounter = 0;
//Stopwatch
let stopwatchid;
let totalSeconds = 0;
//Continue
let wasTheContinueButtonPressed = false;
//Awards
let collectedKeys = JSON.parse(localStorage.getItem("gotKeysFrom")) || [];

//Classes
class Cells {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
  }
  //1.Create Cell Field.
  createCellField() {
    cellField.innerHTML = "";
    this.#createCells();
    this.#setRowsAndColsOnTheCellField();
    this.#styleCells();
    this.#createLeftClickAnimation();
  }

  #createCells() {
    for (let row = 1; row <= this.rows; row++) {
      for (let col = 1; col <= this.columns; col++) {
        const cell = document.createElement("div");
        cell.setAttribute("id", `c${col}-r${row}`);
        cellField.appendChild(cell);
      }
    }
  }

  #setRowsAndColsOnTheCellField() {
    cellField.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    cellField.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
  }

  #styleCells() {
    for (const cell of cellField.children) {
      cell.classList.add("minesweeper__cell");
    }
  }

  #createLeftClickAnimation() {
    cellField.addEventListener("pointerdown", (e) => {
      if (
        e.target.classList.length === 1 &&
        e.target.classList.contains("minesweeper__cell") &&
        e.button === 0
      )
        e.target.classList.add("minesweeper__cell--active");
    });

    cellField.addEventListener("pointerup", (e) => {
      setTimeout(() => {
        e.target.classList.remove("minesweeper__cell--active");
      }, 16);
    });

    cellField.addEventListener("pointerleave", (e) => {
      e.target.classList.remove("minesweeper__cell--active");
    });
  }
}

class GameObjects extends Cells {
  constructor(columns, rows, mines) {
    super(columns, rows);
    this.mines = mines;
  }
  //1. Create Game Objects
  createGameObjects(e) {
    if (isThatTheFirstMove) {
      this.#setMines(e);
      this.#setCluesToFindTheMines();
      this.setStopwatch();
      isThatTheFirstMove = false;
    }
  }

  #setMines(e) {
    let unlocatedMines = this.mines;
    while (unlocatedMines > 0) {
      const setMineHere = Math.floor(
        Math.random() * (this.columns * this.rows),
      );
      if (
        cellField.children[setMineHere].mine !== true &&
        cellField.children[setMineHere] !== e.target
      ) {
        cellField.children[setMineHere].mine = true;
        unlocatedMines--;
      } else {
        continue;
      }
    }
    for (let cell of cellField.children) {
      if (cell.mine !== true) {
        cell.mine = false;
      }
    }
  }

  #setCluesToFindTheMines() {
    for (let row = 1; row <= this.rows; row++) {
      for (let col = 1; col <= this.columns; col++) {
        const currentCell = document.querySelector(`#c${col}-r${row}`);
        currentCell.clue = 0;

        const currentCellDirections = {
          top: document.querySelector(`#c${col}-r${row - 1}`),
          topRight: document.querySelector(`#c${col + 1}-r${row - 1}`),
          right: document.querySelector(`#c${col + 1}-r${row}`),
          bottomRight: document.querySelector(`#c${col + 1}-r${row + 1}`),
          bottom: document.querySelector(`#c${col}-r${row + 1}`),
          bottomLeft: document.querySelector(`#c${col - 1}-r${row + 1}`),
          left: document.querySelector(`#c${col - 1}-r${row}`),
          topLeft: document.querySelector(`#c${col - 1}-r${row - 1}`),
        };

        Object.values(currentCellDirections).forEach((direction) => {
          if (direction !== null) {
            if (direction.mine == true && currentCell.mine == false) {
              currentCell.clue++;
            }
          }
        });
      }
    }
  }
  //2.Flag Counter
  setUndeliveredFlagCounter() {
    flagCounter = this.mines;
    undeliveredFlagCounter.textContent = flagCounter;
  }
  //3.Stopwatch
  setStopwatch() {
    stopwatchid = setInterval(() => {
      totalSeconds++;

      // Calculate minutes and seconds
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;

      // Break down minutes into dozens and ones
      let minutesDozens = Math.floor(minutes / 10);
      let minutesOnes = minutes % 10;

      // Break down seconds into dozens and ones
      let secondsDozens = Math.floor(seconds / 10);
      let secondsOnes = seconds % 10;

      // Update the display
      document.querySelector(".minesweeper__minutes--dozens").textContent =
        minutesDozens;
      document.querySelector(".minesweeper__minutes--ones").textContent =
        minutesOnes;
      document.querySelector(".minesweeper__seconds--dozens").textContent =
        secondsDozens;
      document.querySelector(".minesweeper__seconds--ones").textContent =
        secondsOnes;
    }, 1000);
  }
}

class GameInteractivity extends GameObjects {
  constructor(columns, rows, mines) {
    super(columns, rows, mines);
  }
  //1.Left Click
  leftMouseClick(e) {
    if (isClickable && !e.target.leftMouseClickDisabled) {
      this.createGameObjects(e);
      this.#handleClick0(e);
    }
  }

  #handleClick0(e) {
    if (e.target.mine !== true) {
      this.#revealSafeCells(e);
      if (clickCounter === this.columns * this.rows - this.mines) {
        this.#win();
        return;
      }
    } else {
      this.#lose(e);
      return;
    }
  }

  #revealSafeCells(e) {
    let [currCol, currRow] = this.#detectSpatialPosition(e);
    this.#revealCell(currCol, currRow);
  }

  #detectSpatialPosition(e) {
    let currCol = [];
    let currRow = [];
    let spatialPosition = "col";
    for (const char of e.target.id) {
      if (char === "r") {
        spatialPosition = "row";
      }
      if (!isNaN(Number(char))) {
        spatialPosition === "col" ? currCol.push(char) : currRow.push(char);
      }
    }

    currCol = parseInt(currCol.join(""), 10);
    currRow = parseInt(currRow.join(""), 10);
    return [currCol, currRow];
  }

  #revealCell(currCol, currRow) {
    if (
      currCol < 0 ||
      currCol > this.columns ||
      currRow < 0 ||
      currRow > this.rows
    ) {
      return;
    }
    const currCell = document.querySelector(`#c${currCol}-r${currRow}`);

    if (currCell === null) {
      return;
    }

    if (currCell.classList.contains("minesweeper__cell--revealed-safely")) {
      return;
    }

    currCell.classList.add("minesweeper__cell--revealed-safely");
    clickCounter++;

    if (currCell.classList.contains("minesweeper__cell--victory-flag")) {
      currCell.classList.remove("minesweeper__cell--victory-flag");
      flagCounter++;
      undeliveredFlagCounter.textContent = flagCounter;
    }

    if (currCell.clue > 0) {
      currCell.innerHTML = `<span class="minesweeper__cell--revealed-clue number--${currCell.clue}">${currCell.clue}</span>`;
      currCell.classList.remove("minesweeper__cell--victory-flag");
      return 1;
    }

    this.#revealCell(currCol - 1, currRow - 1); //top left
    this.#revealCell(currCol, currRow - 1); //top
    this.#revealCell(currCol + 1, currRow - 1); //top right

    this.#revealCell(currCol - 1, currRow); //left
    this.#revealCell(currCol + 1, currRow); //right

    this.#revealCell(currCol - 1, currRow + 1); //bottom left
    this.#revealCell(currCol, currRow + 1); //bottom
    this.#revealCell(currCol + 1, currRow + 1); //bottom right
  }

  //2.Right Click
  rightMouseClick(e) {
    if (isClickable) {
      this.createGameObjects(e);
      this.#handleClick2(e);
    }
  }
  #handleClick2(e) {
    if (
      !e.target.classList.contains("minesweeper__cell--revealed-safely") &&
      !e.target.classList.contains("minesweeper__cell--revealed-mine") &&
      !e.target.classList.contains("minesweeper__cell--revealed-clue")
    ) {
      e.target.classList.toggle("minesweeper__cell--victory-flag");
      if (e.target.classList.contains("minesweeper__cell--victory-flag")) {
        e.target.leftMouseClickDisabled = true;
        flagCounter--;
        undeliveredFlagCounter.textContent = flagCounter;
      } else {
        e.target.leftMouseClickDisabled = false;
        flagCounter++;
        undeliveredFlagCounter.textContent = flagCounter;
      }
    }
  }

  //3.Reset
  reset() {
    isClickable = true;
    isThatTheFirstMove = true;
    clickCounter = 0;
    wasTheContinueButtonPressed = false;
    this.setUndeliveredFlagCounter();
    this.#removeAllClassesAndPropertiesExceptDefault();
    this.#resetStopwatch();
    resetBtn.classList.remove("minesweeper__reset-btn--win");
    resetBtn.classList.remove("minesweeper__reset-btn--lose");
    actionPanel.classList.add("state--hidden");
  }

  #removeAllClassesAndPropertiesExceptDefault() {
    const deleteAllExceptThis = new Set(["minesweeper__cell"]);
    for (let cell of cellField.children) {
      this.#deleteAllClassesExceptChosen(cell, deleteAllExceptThis);

      delete cell.clue;
      delete cell.leftMouseClickDisabled;
      delete cell.mine;
      delete cell.explosion;

      if (cell.innerHTML.match(/[^\s+$]/)) {
        cell.innerHTML = "";
      }
    }
  }

  #deleteAllClassesExceptChosen(cell, deleteAllExceptThis) {
    const deleteThis = [];
    cell.classList.forEach((className) => {
      if (!deleteAllExceptThis.has(className)) {
        deleteThis.push(className);
      }
    });

    deleteThis.forEach((className) => {
      cell.classList.remove(className);
    });
  }

  #resetStopwatch() {
    this.#pauseStopwatch();
    totalSeconds = 0;
    document.querySelector(".minesweeper__minutes--dozens").textContent = 0;
    document.querySelector(".minesweeper__minutes--ones").textContent = 0;
    document.querySelector(".minesweeper__seconds--dozens").textContent = 0;
    document.querySelector(".minesweeper__seconds--ones").textContent = 0;
  }

  #pauseStopwatch() {
    clearInterval(stopwatchid);
    stopwatchid = null;
  }

  #win() {
    isClickable = false;
    this.#showFlagsOverMines();
    this.#pauseStopwatch();
    this.#noteTheLevelOfVictory();
    resetBtn.classList.add("minesweeper__reset-btn--win");
  }

  #showFlagsOverMines() {
    for (let cell of cellField.children) {
      if (cell.clue > 0 && cell.childElementCount < 0) {
        cell.innerHTML = `<span class="minesweeper__cell--revealed-clue number--${cell.clue}">${cell.clue}</span>`;
      }
      if (cell.mine == true) {
        cell.classList.add("minesweeper__cell--victory-flag");
        cell.classList.add("minesweeper_cell-victory-flag--guess-right");
        cell.classList.add("minesweeper__cell--cursor-default");
      }
    }
  }

  #noteTheLevelOfVictory() {
    switch (body.className) {
      case themes.baby:
        if (!wasTheContinueButtonPressed) {
          this.#addWinToLocalStorage("baby");
          this.#moveTheKey("baby");
        } else {
          alert("Cheaters don't get awards.");
        }
        break;
      case themes.intermediate:
        if (!wasTheContinueButtonPressed) {
          this.#addWinToLocalStorage("intermediate");
          this.#moveTheKey("intermediate");
        } else {
          alert("Cheaters don't get awards.");
        }
        break;
      case themes.hell:
        if (!wasTheContinueButtonPressed) {
          this.#addWinToLocalStorage("hell");
          this.#moveTheKey("hell");
        } else {
          alert("Cheaters don't get awards.");
        }
        break;
      default:
        if (!wasTheContinueButtonPressed) {
          this.#addWinToLocalStorage("nonsence");
          this.#moveTheKey("nonsence");
        } else {
          alert("Cheaters don't get awards.");
        }
    }
  }

  #addWinToLocalStorage(difficulty) {
    if (collectedKeys.some((key) => key === difficulty)) {
      return;
    }

    collectedKeys.push(difficulty);
    localStorage.setItem("gotKeysFrom", JSON.stringify(collectedKeys));
  }

  #moveTheKey(key) {
    //delete from navbtn or add
    const root = document.documentElement;
    root.style.setProperty(`--${key}`, " ");
    //add to keyholder in .awards
    const keyReceiver = document.querySelector(`.awards__${key}-key`);
    keyReceiver.innerHTML = `<img class="awards__img-${key}-key awards__img-key" src="./assets/icons/key-${key}.png" alt="key" data-key="${key}" draggable="true">`;
    this.#makeKeysDraggableAndSetDragEvents(key);
  }

  #makeKeysDraggableAndSetDragEvents(key) {
    const keyToDrag = document.querySelector(`.awards__img-${key}-key`);
    const chestToDrop = document.querySelector(`.awards__lock-${key}`);
    const chestContainer = document.querySelector(`.awards__${key}`);
    let wasTheChestOpened = false;
    let refKey = null;

    // Reset key's dragged state when reapplying
    keyToDrag.classList.remove("awards__img-key--dragged");

    // Desktop dragstart
    keyToDrag.addEventListener("dragstart", (e) => {
      refKey = e.target;
      keyToDrag.classList.add("awards__img-key--dragged"); // Show it's being dragged
    });

    // For touch events (mobile)
    keyToDrag.addEventListener("touchstart", (e) => {
      e.preventDefault();
      refKey = e.target;
      keyToDrag.classList.add("awards__img-key--dragged");
    });

    // Desktop dragover
    chestToDrop.addEventListener("dragover", (e) => {
      if (refKey && !wasTheChestOpened) {
        const dropZoneValue = e.target.dataset.zone;
        const draggedKeyValue = refKey.dataset.key;
        if (dropZoneValue === draggedKeyValue) {
          e.preventDefault(); // Allow drop
          this.#lockCondition(chestToDrop, key, 4); // Show lock opening visual
        }
      }
    });

    // For mobile touch move
    document.addEventListener("touchmove", (e) => {
      if (refKey && !wasTheChestOpened) {
        const touch = e.touches[0];
        keyToDrag.style.left = `${touch.clientX}px`;
        keyToDrag.style.top = `${touch.clientY}px`;

        const dropZoneValue = chestToDrop.dataset.zone;
        const draggedKeyValue = refKey.dataset.key;

        if (dropZoneValue === draggedKeyValue) {
          e.preventDefault();
          this.#lockCondition(chestToDrop, key, 4);
        }
      }
    });

    // Desktop leave
    chestToDrop.addEventListener("dragleave", () => {
      if (!wasTheChestOpened) {
        this.#lockCondition(chestToDrop, key, 1); // Reset lock visual to closed
      }
    });
    // Desktop drop
    chestToDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      if (refKey && !wasTheChestOpened) {
        wasTheChestOpened = true;
        this.#animateChestOpening(chestContainer, key, chestToDrop);
      }
    });

    // For mobile touch end
    document.addEventListener("touchend", () => {
      if (refKey && !wasTheChestOpened) {
        wasTheChestOpened = true;
        this.#animateChestOpening(chestContainer, key, chestToDrop);
      }
      keyToDrag.classList.remove("awards__img-key--dragged");
      refKey = null;
    });

    keyToDrag.addEventListener("dragend", () => {
      if (!wasTheChestOpened) {
        keyToDrag.classList.remove("awards__img-key--dragged"); // Reset dragged state
        refKey = null;
      }
    });
  }

  #lockCondition(chestToDrop, key, frame) {
    chestToDrop.setAttribute(
      "alt",
      frame === 1 ? "Closed lock" : "Opened lock",
    );
    chestToDrop.setAttribute(
      "src",
      key !== "nonsence"
        ? `./assets/icons/chests-animation/common_chest_frame-${frame}.png`
        : `./assets/icons/chests-animation/nonsence_chest_frame-${frame}.png`,
    );
  }

  #animateChestOpening(chestContainer, key, chestToDrop) {
    let frame = 1;
    let animate = setInterval(() => {
      chestContainer.innerHTML = `<img src="./assets/icons/explosion_animation/explosion-1-b-${frame}.png" alt="Frame ${key}" draggable="false">`;
      if (frame === 8) {
        clearInterval(animate);
        chestContainer.innerHTML = `<img class="awards__coin" src="./assets/icons/coin.png" alt="Gold" draggable="false">`;
        setTimeout(() => {
          if (key !== "nonsence") {
            this.#showAward(key, chestContainer, chestToDrop);
          } else {
            this.#clearProgressConfirmation(key, chestContainer, chestToDrop);
          }
        }, 1000);
      }
      frame++;
    }, 120);
  }

  #showAward(key, chestContainer) {
    const randomPicture = Math.floor(Math.random() * 4 + 1);
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="award">
        <button class="award__close-btn" aria-label="Close picture"></button>
        <img src="./assets/images/awards-${key}/marta-${randomPicture}.jpg" alt="award" class="award-img">
      </div>`,
    );

    document.querySelector(".award").addEventListener("click", () => {
      document.querySelector(".award").remove();
      this.#clearDragAndDropTraces(key, chestContainer);
    });
  }

  #clearDragAndDropTraces(key, chestContainer) {
    if (key !== "nonsence") {
      chestContainer.innerHTML = `<img class="awards__lock awards__lock-${key}"
        src="./assets/icons/chests-animation/common_chest_frame-1.png" alt="Closed lock" draggable="false" data-zone="${key}">`;
    } else {
      chestContainer.innerHTML = `<img class="awards__lock awards__lock-${key}"
        src="./assets/icons/chests-animation/nonsence_chest_frame-1.png" alt="Closed lock" draggable="false" data-zone="nonsence">`;
    }
    const draggedStatusKey = document.querySelector(`.awards__img-${key}-key`);
    if (draggedStatusKey) {
      draggedStatusKey.classList.remove("awards__img-key--dragged");
    }
    // Re-apply the drag-and-drop functionality
    this.#makeKeysDraggableAndSetDragEvents(key);
  }

  #clearProgressConfirmation(key, chestContainer) {
    const question = confirm("Do you want to reset your progress?");
    if (question) {
      if (collectedKeys.length > 0) {
        collectedKeys.forEach((key) => {
          this.#returnTheKey(key);
        });
        chestContainer.innerHTML = `<img class=awards__lock awards__lock-${key}" 
            src="./assets/icons/chests-animation/nonsence_chest_frame-1.png" 
            alt="Closed lock" draggable="false" data-zone="${key}">"`;
        localStorage.removeItem("gotKeysFrom");
      }
    } else {
      this.#clearDragAndDropTraces(key, chestContainer);
    }
  }

  #returnTheKey(key) {
    const root = document.documentElement;
    root.style.setProperty(`--${key}`, `var(--key-${key})`);

    const keyReturner = document.querySelector(`.awards__${key}-key`);
    keyReturner.innerHTML = "";
  }

  moveKeyPerReload(key) {
    this.#moveTheKey(key);
  }

  #lose(e) {
    this.#pauseStopwatch();
    isClickable = false;
    e.target.explosion = true;
    resetBtn.classList.add("minesweeper__reset-btn--lose");
    this.#showMines();
    actionPanel.classList.remove("state--hidden");
  }

  #showMines() {
    let minesToShow = this.mines;
    for (let cell of cellField.children) {
      if (cell.mine == true) {
        cell.classList.add("minesweeper__cell--revealed-mine");
        minesToShow--;
        if (cell.explosion == true) {
          cell.classList.add("minesweeper__cell--explosion");
        }
        if (cell.classList.contains("minesweeper__cell--victory-flag")) {
          cell.classList.add("minesweeper__cell--victory-flag--guessed-right");
        }
        if (minesToShow === 0) {
          return;
        }
      }

      this.#changeUnrevealedCellsCursorToDefault(cell);
    }
  }

  #changeUnrevealedCellsCursorToDefault(cell) {
    if (
      !cell.classList.contains("minesweeper__cell--revealed-safely") &&
      !cell.classList.contains("minesweeper__cell--revealed-mine")
    ) {
      cell.classList.add("minesweeper__cell--cursor-default");
    }
  }

  //4.Continue
  continue() {
    this.#pauseStopwatch();
    this.setStopwatch();
    wasTheContinueButtonPressed = true;
    isClickable = true;
    actionPanel.classList.add("state--hidden");
    resetBtn.classList.remove("minesweeper__reset-btn--lose");

    const cellMines = cellField.querySelectorAll(
      ".minesweeper__cell--revealed-mine",
    );

    const deleteAllExceptThis = new Set([
      "minesweeper__cell",
      "minesweeper__cell--revealed-safely",
      "minesweeper__cell--victory-flag",
    ]);

    for (let cellMine of cellMines) {
      this.#deleteAllClassesExceptChosen(cellMine, deleteAllExceptThis);

      delete cellMine.leftMouseClickDisabled;
      delete cellMine.explosion;
    }

    const cursorDefaultCells = cellField.querySelectorAll(
      ".minesweeper__cell--cursor-default",
    );
    for (let cell of cursorDefaultCells) {
      cell.classList.remove("minesweeper__cell--cursor-default");
    }
  }
}

class BindGameInteractivity extends GameInteractivity {
  constructor(columns, rows, mines) {
    super(columns, rows, mines);
  }
  //1.Bind all game actions to mouse clicks.
  bindGameActionsToMouseClicks() {
    this.#bindCellClicksToMouseBtns();
    this.#bindResetBtnClickToLeftMouseBtn();
    this.#bindContinueBtnClickToLeftMouseBtn();
  }

  #bindCellClicksToMouseBtns() {
    for (const cell of cellField.children) {
      cell.addEventListener("click", (e) => {
        this.leftMouseClick(e);
      });

      cell.addEventListener(
        "contextmenu",
        (e) => {
          e.preventDefault();
          this.rightMouseClick(e);
        },
        false,
      );
    }
  }
  #bindResetBtnClickToLeftMouseBtn() {
    resetBtn.addEventListener("click", () => {
      this.reset();
    });
  }
  #bindContinueBtnClickToLeftMouseBtn() {
    continueBtn.addEventListener("click", () => {
      this.continue();
    });
  }
}

class Bar {
  //1.Toggle Bar
  toggleMinimizeMaximizeBar() {
    const barWrapper = document.querySelector(".bar__section-wrapper");
    const barBtn = document.querySelector(".bar__btn-display-toggle");
    const barBtnContainer = document.querySelector(".bar__btn__container");
    const bar = document.querySelector(".bar__container");

    // Set initial state of the button
    barBtn.classList.add("bar__btn-display-toggle--minimize");

    // Toggle the minimize/maximize states on click
    barBtn.addEventListener("click", () => {
      bar.classList.toggle("bar__container--collapsing");

      // Toggle the button's appearance
      barBtn.classList.toggle("bar__btn-display-toggle--minimize");
      barBtn.classList.toggle("bar__btn-display-toggle--maximize");
    });

    // Handle transitions
    bar.addEventListener("transitionstart", () => {
      if (bar.classList.contains("bar__container--collapsing")) {
        bar.classList.add("bar__container--hidden");
        setTimeout(() => {
          barBtnContainer.classList.add("bar__btn__container--nonshadow");
        }, 350);
        setTimeout(() => {
          barWrapper.style.height = "0";
          barBtnContainer.classList.add("bar__btn__container--minimized");
        }, 550);
      } else {
        bar.classList.remove("bar__container--hidden");
        barBtnContainer.classList.remove("bar__btn__container--minimized");
        barBtnContainer.classList.remove("bar__btn__container--nonshadow");
        barWrapper.style.height = "100vh";
      }
    });
  }

  //2.Difficulty switcher
  difficultySwitcher(difficultyBtn) {
    difficultyBtn.addEventListener("click", () => {
      this.#difficultySwitch(difficultyBtn);
    });
  }

  #difficultySwitch(difficultyBtn) {
    const inputs = {
      inputCols: document.querySelector("#columns__input"),
      inputRows: document.querySelector("#rows__input"),
      inputMines: document.querySelector("#mines__input"),
    };

    Object.values(levelBtns).forEach((btn) => {
      btn.classList.remove("navbar__difficulty-levels--state-selected");
    });

    if (difficultyBtn !== levelBtns.levelNonsenceBtn) {
      difficultyBtn.classList.add("navbar__difficulty-levels--state-selected");
      difficultyBtn.classList.remove(
        "navbar__difficulty-levels--state-hovered",
      );
    }
    switch (difficultyBtn) {
      case levelBtns.levelBabyBtn:
        if (!body.classList.contains("theme--level-baby")) {
          this.#createLevel(9, 9, 10);
          this.#themeSwitch(themes, themes.baby);
          this.#saveDifficulty(".navbar__btn-baby");
          this.#showText("Baby");
        }
        break;
      case levelBtns.levelIntermediateBtn:
        if (!body.classList.contains("theme--level-intermediate")) {
          this.#createLevel(16, 16, 40);
          this.#themeSwitch(themes, themes.intermediate);
          this.#saveDifficulty(".navbar__btn-intermediate");
          this.#showText("Intermediate");
        }
        break;
      case levelBtns.levelHellBtn:
        if (!body.classList.contains("theme--level-hell")) {
          this.#createLevel(30, 16, 99);
          this.#themeSwitch(themes, themes.hell);
          this.#saveDifficulty(".navbar__btn-hell");
          this.#showText("Hell");
        }
        break;
      default:
        this.#createLevel(
          inputs.inputCols.value,
          inputs.inputRows.value,
          inputs.inputMines.value,
        );
        if (
          inputs.inputRows.value <= 9 &&
          inputs.inputCols.value <= 9 &&
          inputs.inputMines.value <= 10
        ) {
          this.#themeSwitch(themes, themes.baby);
          this.#saveDifficulty(".navbar__btn-nonsence");
          this.#showText("Baby");
        } else if (
          inputs.inputRows.value < 30 &&
          inputs.inputCols.value < 16 &&
          inputs.inputMines.value < 99
        ) {
          this.#themeSwitch(themes, themes.intermediate);
          this.#saveDifficulty(".navbar__btn-nonsence");
          this.#showText("Intermediate");
        } else if (
          inputs.inputRows.value >= 30 &&
          inputs.inputCols.value >= 16 &&
          inputs.inputMines.value >= 99
        ) {
          this.#themeSwitch(themes, themes.hell);
          this.#saveDifficulty(".navbar__btn-nonsence");
          this.#showText("Hell");
        } else {
          this.#saveDifficulty(".navbar__btn-nonsence");
          this.#themeSwitch(themes, themes.nonsence);
          this.#showText("Nonsence");
        }
    }
  }

  //Create level
  #createLevel(columns, rows, mines) {
    if (mines > columns * rows) {
      alert("Not enough cells for the mines!");
      return;
    }
    if (rows <= 10 && columns <= 10) {
      body.style.padding = "2.3rem 0";
    } else {
      body.style.padding = "2.3rem";
    }
    const level = new Cells(columns, rows);

    level.createCellField();

    const levelGameObjects = new GameObjects(level.columns, level.rows, mines);

    const levelGameActions = new GameInteractivity(
      level.columns,
      level.rows,
      levelGameObjects.mines,
    );
    levelGameActions.reset();

    const levelBindGameActions = new BindGameInteractivity(
      level.columns,
      level.rows,
      levelGameObjects.mines,
    );
    levelBindGameActions.bindGameActionsToMouseClicks();
  }

  //Theme switcher
  #themeSwitch(deleteThemes, addTheme) {
    Object.values(deleteThemes).forEach((theme) => {
      body.classList.remove(theme);
    });
    body.classList.add(addTheme);
  }
  //Save chosen difficulty
  #saveDifficulty(levelBtn) {
    sessionStorage.setItem("minesweeperDifficulty", levelBtn);
  }
  //Animated each char of text shown per difficulty load
  #showText(text) {
    deleteText();

    document.body.insertAdjacentHTML(
      "afterbegin",
      `<h1 class="text-to-animate">${text}</h1>`,
    );

    const aniText = document.querySelector(".text-to-animate");
    const contentOfTheAniText = aniText.textContent;
    const splitCharsOfTheAniText = contentOfTheAniText.split("");
    aniText.textContent = "";

    for (let i = 0; i < splitCharsOfTheAniText.length; i++) {
      aniText.innerHTML +=
        '<span class="char-to-animate">' +
        splitCharsOfTheAniText[i] +
        "</span>";
    }

    let char = 0;
    let timer = setInterval(onTick, 50);

    function onTick() {
      const chars = document.querySelectorAll(".char-to-animate")[char];
      if (!chars) {
        return;
      }

      chars.classList.add("fade");
      char++;

      if (char === splitCharsOfTheAniText.length) {
        complete();
      }
    }

    //Remove text if difficulty was switched before showText() loading
    function deleteText() {
      if (document.querySelector(".text-to-animate")) {
        document.querySelector(".text-to-animate").remove();
      }
    }
    //Complete when all text has been shown
    function complete() {
      clearInterval(timer);
      timer = null;
      setTimeout(() => {
        aniText.remove();
      }, 1000);
      return;
    }
  }

  //3. Load difficulty per page reload
  loadPreviouslyChosenOrDefaultDifficulty() {
    const savedDifficulty = sessionStorage.getItem("minesweeperDifficulty");
    if (savedDifficulty) {
      document.addEventListener(
        "DOMContentLoaded",
        this.#loadDifficulty(savedDifficulty),
      );
    } else {
      this.setDefaultLevel();
    }
  }
  #loadDifficulty(savedDifficulty) {
    this.#applyDifficulty(savedDifficulty);
  }
  #applyDifficulty(levelBtn) {
    const difficultyBtn = document.querySelector(levelBtn);
    this.#difficultySwitch(difficultyBtn);
  }
  setDefaultLevel() {
    this.#difficultySwitch(levelBtns.levelIntermediateBtn);
  }

  //4.Zoom
  zoom() {
    const zoomInput = document.querySelector(".zoom-bar__input");
    zoomInput.addEventListener("input", (e) => {
      if (+e.target.value <= 1) {
        document.querySelector(".minesweeper").style.transform =
          `scale(${e.target.value})`;
      }
    });
  }

  //5. Navbar Hover
  levelBtnsHover() {
    Object.values(levelBtns).forEach((btn) => {
      btn.addEventListener("mouseover", () => {
        if (
          !btn.classList.contains("navbar__difficulty-levels--state-selected")
        ) {
          btn.classList.add("navbar__difficulty-levels--state-hovered");
        }
      });
      btn.addEventListener("mouseout", () => {
        btn.classList.remove("navbar__difficulty-levels--state-hovered");
      });
    });
  }
  //6.Display of reference and awards sections
  displayOfRefAndAwards() {
    const awardsDisplaySwitchSlider = document.querySelector(
      ".toggle-switch__awards-checkbox",
    );
    const awardsSection = document.querySelector(".awards__section-wrapper");

    const referenceDisplaySwitchSlider = document.querySelector(
      ".toggle-switch__reference-info-checkbox",
    );
    const referenceSection = document.querySelector(
      ".reference-info__section-wrapper",
    );

    awardsDisplaySwitchSlider.addEventListener("change", () => {
      displaySwitcher(awardsDisplaySwitchSlider, awardsSection);
    });

    referenceDisplaySwitchSlider.addEventListener("change", () => {
      displaySwitcher(referenceDisplaySwitchSlider, referenceSection);
    });

    function displaySwitcher(switchSlider, section) {
      if (switchSlider.checked) {
        section.classList.add("state--hidden");
      } else {
        section.classList.remove("state--hidden");
      }
    }
  }
}

class Awards extends GameInteractivity {
  //1.Display toggling
  awardsDisplayToggling() {
    const awardsToggleBtn = document.querySelector(".awards__toggle-btn");
    const awards = document.querySelector(".awards");
    const awardsIcon = document.querySelector(".awards__toggle-icon");

    awardsToggleBtn.addEventListener("click", () => {
      awards.classList.toggle("awards--expanded");
      awardsIcon.classList.toggle("awards__toggle-icon--rotate");

      if (awards.classList.contains("awards--expanded")) {
        awards.style.zIndex = "1";
      }

      awards.addEventListener("transitionend", () => {
        if (!awards.classList.contains("awards--expanded")) {
          awards.style.zIndex = "-1";
        }
      });
    });
  }
  //2.Load Progress
  loadProgress() {
    if (collectedKeys.length > 0) {
      collectedKeys.forEach((key) => {
        this.moveKeyPerReload(key);
      });
    }
  }
}

class ReferenceInfo {
  //Switching the display of help information
  infoDispayToggling() {
    const refToggleBtn = document.querySelector(".reference-info__toggle-btn");
    const refInfo = document.querySelector(".reference-info");
    const refIcon = document.querySelector(".reference-info__toggle-icon");
    const refInfoContainer = document.querySelector(
      ".reference-info__container",
    );

    refToggleBtn.addEventListener("click", () => {
      refInfo.classList.toggle("reference-info--expanded");
      refIcon.classList.toggle("reference-info__toggle-icon--rotate");

      if (refInfo.classList.contains("reference-info--expanded")) {
        refInfoContainer.style.zIndex = "1";
      }

      refInfo.addEventListener("transitionend", () => {
        if (!refInfo.classList.contains("reference-info--expanded")) {
          refInfoContainer.style.zIndex = "-1";
        }
      });
    });
  }
}

const bar = new Bar();
bar.loadPreviouslyChosenOrDefaultDifficulty();
bar.toggleMinimizeMaximizeBar();
bar.difficultySwitcher(levelBtns.levelBabyBtn);
bar.difficultySwitcher(levelBtns.levelIntermediateBtn);
bar.difficultySwitcher(levelBtns.levelHellBtn);
bar.difficultySwitcher(levelBtns.levelNonsenceBtn);
bar.levelBtnsHover();
bar.zoom();
bar.displayOfRefAndAwards();
const awards = new Awards();
awards.loadProgress();
awards.awardsDisplayToggling();
const refInfo = new ReferenceInfo();
refInfo.infoDispayToggling();
