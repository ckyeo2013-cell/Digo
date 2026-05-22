

// ==========================
// GAME STATE
// ==========================

let gameOver = false;
let playerTurn = true;

let hand = [];
let enemyHand = [];

let melatoninStack = 0;
let enemyStunned = false;

const MAX_HAND = 7;

let logHistory = [];

// ==========================
// LOG SYSTEM (IMPORTANT)
// ==========================

function log(text) {

  logHistory.unshift(text);

  if (logHistory.length > 6) logHistory.pop();

  const el = document.getElementById("sub");

  if (el) {
    el.innerText = logHistory.join("\n");
  }

}

// ==========================
// START GAME
// ==========================

function startGame() {

  gameOver = false;
  playerTurn = true;

  hand = [];
  enemyHand = [];

  melatoninStack = 0;
  enemyStunned = false;

  logHistory = [];

  for (let i = 0; i < 5; i++) {
    drawCard(hand);
    drawCard(enemyHand);
  }

  render();
  renderEnemy();

  log("Digo is watching the table...");

}

startGame();

// ==========================
// DECK DRAW
// ==========================

function drawCard(target) {

  if (gameOver) return;

  let card = getRandomCard();

  if (target === hand && hand.length >= MAX_HAND) {
    discardRandom(hand);
    log("Your hand overflowed — card lost");
  }

  target.push(card);

  render();
  renderEnemy();

}

function getRandomCard() {

  const deck = [
    { name: "Chair", effect: "nothing", image: "assets/images/misc/chair.png" },
    { name: "Check", effect: "money", image: "assets/images/misc/check.png" },
    { name: "Cheese", effect: "cheese", image: "assets/images/misc/cheese.png" },
    { name: "Wet Fish", effect: "stun", image: "assets/images/misc/wetFish.png" },

    { name: "Pokeball", effect: "pokeball", image: "assets/images/crazy/crazy.png" },
    { name: "U-Haul", effect: "turnSwap", image: "assets/images/crazy/uHaul.png" },

    { name: "Package Defuse", effect: "defense", image: "assets/images/defense/package.png" },
    { name: "Pipe Bomb", effect: "pipe", image: "assets/images/attack/pipeBomb.png" },

    { name: "Digo", effect: "digo", image: "assets/images/die/digo.png" },
    { name: "Lego Brick", effect: "lego", image: "assets/images/die/legoBrick.png" },
    { name: "USB", effect: "usb", image: "assets/images/die/susUsb.png" },

    { name: "Melatonin", effect: "melatonin", image: "assets/images/misc/melatonin.png" }
  ];

  return structuredClone(deck[Math.floor(Math.random() * deck.length)]);
}

// ==========================
// PLAY CARD
// ==========================

function playCard(i) {

  if (!playerTurn || gameOver) return;

  let card = hand.splice(i, 1)[0];

  render();
  showCard(card);

  resolve(card, "player");

  endTurn();

}

// ==========================
// CARD LOGIC (FIXED + READABLE CHAOS)
// ==========================

function resolve(card, owner) {

  if (card.effect !== "melatonin") {
    melatoninStack = 0;
  }

  // ======================
  // MONEY
  // ======================
  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    log("Check → You gained 2 cards");
    return;
  }

  // ======================
  // CHEESE
  // ======================
  if (card.effect === "cheese") {

    let r = Math.random();

    if (r < 0.25) {
      drawCard(enemyHand);
      log("Cheese → enemy gained a card");
    }

    else if (r < 0.5) {
      drawCard(hand);
      log("Cheese → you gained a card");
    }

    else if (r < 0.75) {
      enemyStunned = true;
      log("Cheese → enemy stunned");
    }

    else {
      discardRandom(hand);
      log("Cheese backfired → you lost a card");
    }

    return;
  }

  // ======================
  // MELATONIN (NOW STABLE)
  // ======================
  if (card.effect === "melatonin") {

    melatoninStack++;

    log("Melatonin stack: " + melatoninStack);

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    if (Math.random() < 0.25) {
      discardRandom(hand);
      log("Melatonin made you drop a card");
    }

    return;
  }

  // ======================
  // STUN
  // ======================
  if (card.effect === "stun") {
    enemyStunned = true;
    log("Wet Fish → enemy stunned");
    return;
  }

  // ======================
  // U-HAUL (FIXED)
  // ======================
  if (card.effect === "turnSwap") {

    let temp = hand;
    hand = enemyHand;
    enemyHand = temp;

    log("U-Haul → hands swapped");

    render();
    renderEnemy();

    return;
  }

  // ======================
  // POKEBALL (READABLE RNG)
  // ======================
  if (card.effect === "pokeball") {

    let r = Math.random();

    if (r < 0.5) {
      drawCard(hand);
      log("Pokeball → you gained a card");
    }

    else {
      drawCard(enemyHand);
      log("Pokeball → enemy gained a card");
    }

    return;
  }

  // ======================
  // PIPE BOMB (CLEAN RNG)
  // ======================
  if (card.effect === "pipe") {

    let r = Math.random();

    if (r < 0.33) {
      return endGame("Pipe Bomb hit YOU");
    }

    else if (r < 0.66) {
      return endGame("Pipe Bomb hit ENEMY");
    }

    else {
      log("Pipe Bomb failed");
    }

    return;
  }

  // ======================
  // LEGO BRICK
  // ======================
  if (card.effect === "lego") {

    let r = Math.random();

    if (r < 0.4) return endGame("You stepped on Lego Brick");
    if (r < 0.8) return endGame("Enemy stepped on Lego Brick");

    log("Lego Brick did nothing");

    return;
  }

  // ======================
  // USB
  // ======================
  if (card.effect === "usb") {

    if (Math.random() < 0.5) {
      return endGame("USB corrupted everything");
    }

    discardRandom(hand);
    log("USB stole a card");

    return;
  }

  // ======================
  // DIGO (MAIN CHARACTER MODE)
  // ======================
  if (card.effect === "digo") {

    log("Digo bends reality");

    let mode = Math.floor(Math.random() * 3);

    if (mode === 0) {
      hand = hand.map(() => ({
        name: "Melatonin",
        effect: "melatonin",
        image: "assets/images/misc/melatonin.png"
      }));
      log("Digo → everything became melatonin");
    }

    else if (mode === 1) {
      hand = hand.map(() => ({
        name: "USB",
        effect: "usb",
        image: "assets/images/die/susUsb.png"
      }));
      log("Digo → everything became USBs");
    }

    else {
      discardRandom(hand);
      log("Digo removed a card");
    }

    render();
    return;
  }

  // ======================
  // DEFENSE (PLACEHOLDER STABLE)
  // ======================
  if (card.effect === "defense") {
    log("Defense held ready");
    return;
  }

}

// ==========================
// TURN SYSTEM
// ==========================

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    if (enemyStunned) {
      enemyStunned = false;
      log("Enemy skipped turn");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    drawCard(enemyHand);

    let card = enemyHand[Math.floor(Math.random() * enemyHand.length)];

    enemyHand.splice(enemyHand.indexOf(card), 1);

    renderEnemy();

    showCard(card);

    resolve(card, "enemy");

    setTimeout(() => {

      drawCard(hand);
      render();

      playerTurn = true;

    }, 700);

  }, 700);

}

// ==========================
// RENDER
// ==========================

function render() {

  let div = document.getElementById("hand");

  div.innerHTML = "";

  hand.forEach((card, i) => {

    let img = document.createElement("img");

    img.src = card.image;
    img.className = "card";

    img.onclick = () => playCard(i);

    div.appendChild(img);

  });

}

function renderEnemy() {

  let div = document.querySelector(".enemyCards");

  div.innerHTML = "";

  enemyHand.forEach(() => {

    let d = document.createElement("div");
    d.className = "enemyCard";

    div.appendChild(d);

  });

}

// ==========================
// UI
// ==========================

function showCard(card) {

  let area = document.getElementById("playedCard");

  area.innerHTML = "";

  let img = document.createElement("img");

  img.src = card.image;
  img.className = "card";

  area.appendChild(img);

}

// ==========================
// HELPERS
// ==========================

function discardRandom(arr) {
  if (arr.length === 0) return;
  arr.splice(Math.floor(Math.random() * arr.length), 1);
}

// ==========================
// END GAME
// ==========================

function endGame(msg) {

  if (gameOver) return;
  gameOver = true;

  let overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";

  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  overlay.style.color = "white";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">Restart</button>
  `;

  document.body.appendChild(overlay);

}