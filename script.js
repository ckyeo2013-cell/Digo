

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
   LOG SYSTEM
========================= */

function log(text) {

  let el = document.getElementById("sub");

  if (!el) {
    el = document.createElement("div");
    el.id = "sub";
    document.body.appendChild(el);
  }

  logLines.unshift(text);
  if (logLines.length > 3) logLines.pop();

  el.innerText = logLines.join("\n");
}

/* =========================
   POPUP SYSTEM (NEW)
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
    box.style.border = "2px solid white";
    box.style.zIndex = 9999;
    box.style.textAlign = "center";

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
   CARD POOL
========================= */

const CARD_POOL = [
  { name: "Chair", effect: "nothing", img: "assets/images/misc/chair.png", w: 12 },
  { name: "Check", effect: "money", img: "assets/images/misc/check.png", w: 10 },
  { name: "Cheese", effect: "cheese", img: "assets/images/misc/cheese.png", w: 7 },
  { name: "Fish", effect: "stun", img: "assets/images/misc/wetFish.png", w: 6 },

  { name: "Pokeball", effect: "pokeball", img: "assets/images/crazy/crazy.png", w: 5 },
  { name: "U-Haul", effect: "swap", img: "assets/images/crazy/uHaul.png", w: 4 },

  { name: "Defuse", effect: "defense", img: "assets/images/defense/package.png", w: 5 },

  { name: "Pipe Bomb", effect: "pipe", img: "assets/images/attack/pipeBomb.png", w: 2 },
  { name: "Lego Brick", effect: "lego", img: "assets/images/die/legoBrick.png", w: 2 },

  { name: "Radioactive Goose", effect: "goose", img: "assets/images/crazy/goose.png", w: 3 },

  { name: "Digo", effect: "digo", img: "assets/images/die/digo.png", w: 1 },
  { name: "USB", effect: "usb", img: "assets/images/die/susUsb.png", w: 1 },

  { name: "Melatonin", effect: "melatonin", img: "assets/images/misc/melatonin.png", w: 3 }
];

/* =========================
   RNG SYSTEM
========================= */

let killCounter = 0;
let defenseCounter = 0;

function weightedDraw() {

  let killChance = (1 / 30) + killCounter * 0.01;
  let defenseChance = (1 / 15) + defenseCounter * 0.008;

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
    ["pipe", "lego", "digo", "usb", "goose"].includes(c.effect)
  );
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

function pickDefense() {
  return structuredClone(CARD_POOL.find(c => c.effect === "defense"));
}

function pickNormal() {
  const pool = CARD_POOL.filter(c =>
    !["pipe", "lego", "digo", "usb", "goose", "defense"].includes(c.effect)
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
   DRAW SYSTEM
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

  setTimeout(() => endTurn(), 300);
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
    return;
  }

  if (card.effect === "cheese") {

    let r = Math.random();

    if (r < 0.25) {
      drawCard(enemyHand);
      log("Cheese → enemy card");
    } else if (r < 0.5) {
      drawCard(hand);
      log("Cheese → you card");
    } else {
      log("Cheese failed");
    }

    return;
  }

  if (card.effect === "stun") {
    enemyStunned = true;
    log("Fish → enemy stunned");
    return;
  }

  if (card.effect === "swap") {
    [hand, enemyHand] = [enemyHand, hand];
    log("U-Haul → swap hands");
    render();
    renderEnemy();
    return;
  }

  /* =========================
     POKEBALL UPGRADED
  ========================= */

  if (card.effect === "pokeball") {

    let r = Math.random();

    if (r < 0.4 && enemyHand.length > 0) {

      enemyHand.splice(
        Math.floor(Math.random() * enemyHand.length),
        1
      );

      log("PokéBall → enemy got captured 🟡");

    } else if (r < 0.7) {

      drawCard(hand);
      log("PokéBall → reward card");

    } else {

      drawCard(enemyHand);
      log("PokéBall → failed capture");

    }

    return;
  }

  /* =========================
     MELATONIN (SOLO FIXED)
  ========================= */

  if (card.effect === "melatonin") {

    playerMelatonin++;

    log("Melatonin " + playerMelatonin + "/3");

    if (playerMelatonin >= 3) {
      return endGame("Melatonin overdose (YOU)");
    }

    return;
  }

  /* =========================
     DIGO BOSS SYSTEM
  ========================= */

  if (card.effect === "digo") {

    log("Digo activates reality shift");

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
    return;
  }

  /* =========================
     ATTACKS
  ========================= */

  if (card.effect === "pipe") return attack("Pipe Bomb");
  if (card.effect === "lego") return attack("Lego Brick");
  if (card.effect === "usb") return attack("USB Curse");

  if (card.effect === "goose") return gooseEvent();
}

/* =========================
   GOOSE
========================= */

function gooseEvent() {

  let r = Math.random();

  if (r < 0.33) {
    drawCard(hand);
    log("Goose → you got card");
  } else if (r < 0.66) {
    drawCard(enemyHand);
    log("Goose → enemy got card");
  } else {
    log("Goose did nothing");
  }
}

/* =========================
   ATTACK SYSTEM (POPUP + GAMBLE WARNING)
========================= */

function attack(type) {

  popup(
    "⚠ GAMBLE MODE: " + type +
    " can hit YOU or ENEMY. Defense only protects YOU.",
    () => {

      if (hasDefense()) {

        popup("Use DEFENSE?", () => {

          if (useDefense()) {
            log("Blocked " + type);
            resolving = false;
            return;
          }

          resolveAttack(type);
        });

      } else {
        resolveAttack(type);
      }
    }
  );
}

/* =========================
   ATTACK RESOLVE
========================= */

function resolveAttack(type) {

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

    log("USB unstable");
  }

  resolving = false;
}

/* =========================
   ENEMY AI (SMART + STABLE)
========================= */

function enemyPlay() {

  if (enemyStunned) {
    enemyStunned = false;
    log("Enemy skipped turn");
    return;
  }

  let card;

  let attackCard = enemyHand.find(c =>
    ["pipe", "lego", "usb"].includes(c.effect)
  );

  if (attackCard) {
    card = attackCard;
    enemyHand.splice(enemyHand.indexOf(card), 1);
  } else {
    card = enemyHand.splice(
      Math.floor(Math.random() * enemyHand.length),
      1
    )[0];
  }

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
      endGame("Enemy overdosed");
    }

    return;
  }

  if (card.effect === "pipe") return attack("Pipe Bomb");
  if (card.effect === "lego") return attack("Lego Brick");
  if (card.effect === "usb") return attack("USB Curse");

  log("Enemy played " + card.name);
}

/* =========================
   TURN SYSTEM
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
   RENDER PLAYER
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

/* =========================
   RENDER ENEMY
========================= */

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