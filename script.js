

//////////////////////////
// GAME STATE
//////////////////////////

let gameOver = false;
let playerTurn = true;
let resolving = false;

let hand = [];
let enemyHand = [];

let playerMelatonin = 0;
let enemyMelatonin = 0;

let enemyStunned = false;

let logLines = [];

/* =========================
   SUBTITLES (FIXED SAFE)
========================= */

function log(text) {

  let el = document.getElementById("sub");

  if (!el) {
    el = document.createElement("div");
    el.id = "sub";

    el.style.position = "fixed";
    el.style.bottom = "20px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";

    el.style.color = "white";
    el.style.fontSize = "16px";
    el.style.textAlign = "center";
    el.style.zIndex = "9999";
    el.style.whiteSpace = "pre-line";

    document.body.appendChild(el);
  }

  logLines.unshift(text);
  if (logLines.length > 3) logLines.pop();

  el.innerText = logLines.join("\n");
}

/* =========================
   CARD POOL
========================= */

const CARD_POOL = [
  { name: "Chair", effect: "nothing", img: "assets/images/misc/chair.png" },
  { name: "Check", effect: "money", img: "assets/images/misc/check.png" },
  { name: "Cheese", effect: "cheese", img: "assets/images/misc/cheese.png" },
  { name: "Fish", effect: "stun", img: "assets/images/misc/wetFish.png" },

  { name: "Pokeball", effect: "pokeball", img: "assets/images/crazy/crazy.png" },
  { name: "U-Haul", effect: "swap", img: "assets/images/crazy/uHaul.png" },

  { name: "Defuse", effect: "defense", img: "assets/images/defense/package.png" },

  { name: "Pipe Bomb", effect: "pipe", img: "assets/images/attack/pipeBomb.png" },
  { name: "Lego Brick", effect: "lego", img: "assets/images/die/legoBrick.png" },

  { name: "Radioactive Goose", effect: "goose", img: "assets/images/crazy/goose.png" },

  { name: "Digo", effect: "digo", img: "assets/images/die/digo.png" },
  { name: "USB", effect: "usb", img: "assets/images/die/susUsb.png" },

  { name: "Melatonin", effect: "melatonin", img: "assets/images/misc/melatonin.png" }
];

/* =========================
   RNG (BALANCED FIXED)
========================= */

let killCounter = 0;
let defenseCounter = 0;

function weightedDraw() {

  let killChance = Math.min(0.05 + killCounter * 0.004, 0.15);
  let defenseChance = Math.min(0.10 + defenseCounter * 0.003, 0.20);

  let r = Math.random();

  if (r < killChance) {
    killCounter = 0;
    return pickKill();
  }

  r -= killChance;

  if (r < defenseChance) {
    defenseCounter = 0;
    return pickDefense();
  }

  killCounter++;
  defenseCounter++;

  return pickNormal();
}

function pickKill() {
  const pool = CARD_POOL.filter(c =>
    ["pipe", "lego", "usb", "goose", "digo"].includes(c.effect)
  );
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

function pickDefense() {
  return structuredClone(CARD_POOL.find(c => c.effect === "defense"));
}

function pickNormal() {
  const pool = CARD_POOL.filter(c =>
    !["pipe", "lego", "usb", "goose", "digo", "defense"].includes(c.effect)
  );
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

/* =========================
   START GAME
========================= */

function startGame() {

  gameOver = false;
  playerTurn = true;
  resolving = false;

  hand = [];
  enemyHand = [];

  playerMelatonin = 0;
  enemyMelatonin = 0;

  enemyStunned = false;

  logLines = [];

  killCounter = 0;
  defenseCounter = 0;

  for (let i = 0; i < 5; i++) {
    hand.push(weightedDraw());
    enemyHand.push(weightedDraw());
  }

  render();
  renderEnemy();

  log("Digo is watching...");
}

startGame();

/* =========================
   DRAW
========================= */

const MAX_HAND = 7;

function drawCard(target) {

  if (gameOver) return;

  if (target === hand && hand.length >= MAX_HAND) {
    log("Hand full");
    return;
  }

  target.push(weightedDraw());

  render();
  renderEnemy();
}

/* =========================
   PLAY CARD
========================= */

function playCard(i) {

  if (!playerTurn || gameOver || resolving) return;

  resolving = true;

  let card = hand.splice(i, 1)[0];

  render();
  showCard(card);

  resolvePlayer(card);
}

/* =========================
   DEFENSE (PLAYER ONLY)
========================= */

function hasDefense() {
  return hand.some(c => c.effect === "defense");
}

function useDefense() {

  let i = hand.findIndex(c => c.effect === "defense");

  if (i !== -1) {
    hand.splice(i, 1);
    render();
    return true;
  }

  return false;
}

/* =========================
   PLAYER RESOLVE
========================= */

function resolvePlayer(card) {

  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    log("Check → +2 cards");
    return endTurn();
  }

  if (card.effect === "cheese") {

    let r = Math.random();

    if (r < 0.25) {
      drawCard(enemyHand);
      log("Cheese → enemy card");
    } else if (r < 0.5) {
      drawCard(hand);
      log("Cheese → your card");
    } else {
      log("Cheese failed");
    }

    return endTurn();
  }

  if (card.effect === "stun") {
    enemyStunned = true;
    log("Fish → enemy stunned");
    return endTurn();
  }

  if (card.effect === "swap") {
    [hand, enemyHand] = [enemyHand, hand];
    log("U-Haul → swap hands");
    render();
    renderEnemy();
    return endTurn();
  }

  /* =========================
     POKEBALL FIX
  ========================= */

  if (card.effect === "pokeball") {

    let r = Math.random();

    if (r < 0.4 && enemyHand.length > 0) {
      enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1);
      log("🟡 PokéBall → enemy captured");
    } else if (r < 0.7) {
      drawCard(hand);
      log("🟡 PokéBall → reward card");
    } else {
      drawCard(enemyHand);
      log("🟡 PokéBall → failed capture");
    }

    return endTurn();
  }

  /* =========================
     MELATONIN (SOLO FIXED)
  ========================= */

  if (card.effect === "melatonin") {

    playerMelatonin++;

    log("😴 Melatonin " + playerMelatonin + "/3");

    if (playerMelatonin >= 3) {
      return endGame("YOU overdosed on Melatonin");
    }

    return endTurn();
  }

  /* =========================
     DIGO BOSS
  ========================= */

  if (card.effect === "digo") {

    log("😈 Digo activates reality shift");

    let r = Math.random();

    if (r < 0.33) {
      hand = hand.map(() => weightedDraw());
      log("Digo reshuffled your deck");
    } else if (r < 0.66) {
      hand = hand.map(() => ({
        name: "USB",
        effect: "usb",
        img: "assets/images/die/susUsb.png"
      }));
      log("Digo turned your hand into USBs 💀");
    } else {
      hand = hand.map(() => ({
        name: "Melatonin",
        effect: "melatonin",
        img: "assets/images/misc/melatonin.png"
      }));
      log("Digo flooded your hand 😴");
    }

    render();
    return endTurn();
  }

  /* =========================
     ATTACKS
  ========================= */

  if (card.effect === "pipe") return attack("Pipe Bomb");
  if (card.effect === "lego") return attack("Lego Brick");
  if (card.effect === "usb") return attack("USB Curse");

  if (card.effect === "goose") {
    log("Goose event triggered");
    return endTurn();
  }
}

/* =========================
   ATTACK SYSTEM (FIXED FLOW)
========================= */

function attack(type) {

  if (gameOver) return;

  resolving = true;

  log("⚠ " + type + " GAMBLE incoming!");

  popup(
    type + " is a GAMBLE.\nMay hit YOU or ENEMY.",
    () => {

      if (hasDefense()) {

        popup("Use DEFENSE?", () => {

          if (useDefense()) {
            log("🛡 Blocked " + type);
            resolving = false;
            return endTurn();
          }

          runAttack(type);
        });

      } else {
        runAttack(type);
      }
    }
  );
}

/* =========================
   ATTACK RESOLVE (SAFE FIX)
========================= */

function runAttack(type) {

  let r = Math.random();

  if (type === "Pipe Bomb") {

    if (r < 0.33) return endGame("Pipe hit YOU");
    if (r < 0.66) return endGame("Pipe hit ENEMY");

    log("Pipe failed");
  }

  if (type === "Lego Brick") {

    if (r < 0.4) return endGame("Lego killed YOU");
    if (r < 0.8) return endGame("Lego killed ENEMY");

    log("Lego failed");
  }

  if (type === "USB Curse") {

    if (r < 0.5) return endGame("USB destroyed YOU");
    if (r < 0.8) return endGame("USB destroyed ENEMY");

    log("USB failed");
  }

  resolving = false;
  endTurn();
}

/* =========================
   ENEMY AI (FIXED)
========================= */

function enemyPlay() {

  if (enemyStunned) {
    enemyStunned = false;
    log("Enemy skipped turn");
    return;
  }

  let card = enemyHand.splice(
    Math.floor(Math.random() * enemyHand.length),
    1
  )[0];

  showCard(card);
  resolveEnemy(card);
}

/* =========================
   ENEMY RESOLVE
========================= */

function resolveEnemy(card) {

  if (card.effect === "melatonin") {

    enemyMelatonin++;

    log("Enemy melatonin " + enemyMelatonin);

    if (enemyMelatonin >= 3) {
      return endGame("Enemy overdosed");
    }

    return endTurn();
  }

  if (card.effect === "pipe") return attack("Pipe Bomb");
  if (card.effect === "lego") return attack("Lego Brick");
  if (card.effect === "usb") return attack("USB Curse");

  log("Enemy played " + card.name);

  endTurn();
}

/* =========================
   TURN SYSTEM (FIXED SAFE LOOP)
========================= */

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    drawCard(enemyHand);
    enemyPlay();

    setTimeout(() => {

      drawCard(hand);
      render();

      playerTurn = true;
      resolving = false;

    }, 500);

  }, 500);
}

/* =========================
   RENDER
========================= */

function render() {

  let div = document.getElementById("hand");
  div.innerHTML = "";

  hand.forEach((card, i) => {

    let img = document.createElement("img");
    img.src = card.img;
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
    d.innerText = "🂠";

    div.appendChild(d);
  });
}

/* =========================
   SHOW CARD
========================= */

function showCard(card) {

  let area = document.getElementById("playedCard");
  area.innerHTML = "";

  let img = document.createElement("img");
  img.src = card.img;
  img.className = "card";

  area.appendChild(img);
}

/* =========================
   POPUP (SAFE)
========================= */

function popup(text, callback) {

  let box = document.getElementById("popup");

  if (!box) {
    box = document.createElement("div");
    box.id = "popup";

    box.style.position = "fixed";
    box.style.top = "50%";
    box.style.left = "50%";
    box.style.transform = "translate(-50%, -50%)";

    box.style.background = "#111";
    box.style.color = "white";
    box.style.padding = "20px";
    box.style.zIndex = 9999;

    document.body.appendChild(box);
  }

  box.innerHTML = `
    <p>${text}</p>
    <button id="popupBtn">OK</button>
  `;

  document.getElementById("popupBtn").onclick = () => {
    box.remove();
    if (callback) callback();
  };
}

/* =========================
   GAME OVER
========================= */

function endGame(msg) {

  if (gameOver) return;
  gameOver = true;

  let overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
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