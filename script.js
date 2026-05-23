

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

let killPity = 0;

const MAX_HAND = 7;

//////////////////////////
// SUBTITLES
//////////////////////////

function log(text) {

  let el = document.getElementById("sub");

  if (!el) {

    el = document.createElement("div");

    el.id = "sub";

    document.body.appendChild(el);
  }

  logLines.unshift(text);

  if (logLines.length > 3) {
    logLines.pop();
  }

  el.innerText = logLines.join("\n");
}

//////////////////////////
// POPUP
//////////////////////////

function popup(text, buttons = []) {

  let old = document.getElementById("popup");

  if (old) old.remove();

  let box = document.createElement("div");

  box.id = "popup";

  box.innerHTML = `
    <div class="popupInner">
      <p>${text}</p>
      <div id="popupButtons"></div>
    </div>
  `;

  document.body.appendChild(box);

  let btnDiv = document.getElementById("popupButtons");

  buttons.forEach(btn => {

    let b = document.createElement("button");

    b.innerText = btn.text;

    b.onclick = () => {

      box.remove();

      btn.action();
    };

    btnDiv.appendChild(b);
  });
}

//////////////////////////
// CARD POOL
//////////////////////////

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

//////////////////////////
// RNG
//////////////////////////

function getKillChance() {

  let base = 0.03;

  let max = 0.12;

  return Math.min(base + killPity * 0.008, max);
}

function weightedDraw() {

  let killChance = getKillChance();

  let defenseChance = 0.12;

  let r = Math.random();

  // KILL
  if (r < killChance) {

    killPity = 0;

    return pickKill();
  }

  r -= killChance;

  // DEFENSE
  if (r < defenseChance) {

    return pickDefense();
  }

  killPity++;

  return pickNormal();
}

function pickKill() {

  const pool = CARD_POOL.filter(c =>
    ["pipe", "lego", "usb", "goose", "digo"].includes(c.effect)
  );

  return structuredClone(
    pool[Math.floor(Math.random() * pool.length)]
  );
}

function pickDefense() {

  return structuredClone(
    CARD_POOL.find(c => c.effect === "defense")
  );
}

function pickNormal() {

  const pool = CARD_POOL.filter(c =>
    !["pipe", "lego", "usb", "goose", "digo", "defense"].includes(c.effect)
  );

  return structuredClone(
    pool[Math.floor(Math.random() * pool.length)]
  );
}

//////////////////////////
// START GAME
//////////////////////////

function startGame() {

  gameOver = false;

  playerTurn = true;

  resolving = false;

  hand = [];
  enemyHand = [];

  playerMelatonin = 0;
  enemyMelatonin = 0;

  enemyStunned = false;

  killPity = 0;

  for (let i = 0; i < 5; i++) {

    hand.push(weightedDraw());

    enemyHand.push(weightedDraw());
  }

  render();
  renderEnemy();

  log("Digo is watching...");
}

startGame();

//////////////////////////
// DRAW
//////////////////////////

function drawCard(target) {

  if (target === hand && hand.length >= MAX_HAND) {

    log("Hand full");

    return;
  }

  target.push(weightedDraw());

  render();
  renderEnemy();
}

//////////////////////////
// PLAYER PLAY
//////////////////////////

function playCard(i) {

  if (!playerTurn || resolving || gameOver) return;

  resolving = true;

  let card = hand.splice(i, 1)[0];

  render();

  showCard(card);

  resolvePlayer(card);
}

//////////////////////////
// PLAYER RESOLVE
//////////////////////////

function resolvePlayer(card) {

  // MONEY
  if (card.effect === "money") {

    drawCard(hand);
    drawCard(hand);

    log("Check → +2 cards");

    return endTurn();
  }

  // CHEESE
  if (card.effect === "cheese") {

    let r = Math.random();

    if (r < 0.25) {

      drawCard(enemyHand);

      log("Cheese → enemy got card");
    }
    else if (r < 0.5) {

      drawCard(hand);

      log("Cheese → you got card");
    }
    else {

      log("Cheese failed");
    }

    return endTurn();
  }

  // FISH
  if (card.effect === "stun") {

    enemyStunned = true;

    log("Fish stunned enemy");

    return endTurn();
  }

  // UHAUL
  if (card.effect === "swap") {

    [hand, enemyHand] = [enemyHand, hand];

    render();
    renderEnemy();

    log("U-Haul swapped hands");

    return endTurn();
  }

  // POKEBALL
  if (card.effect === "pokeball") {

    let r = Math.random();

    if (r < 0.4 && enemyHand.length > 0) {

      enemyHand.splice(
        Math.floor(Math.random() * enemyHand.length),
        1
      );

      log("🟡 Enemy captured by Pokeball");
    }
    else if (r < 0.7) {

      drawCard(hand);

      log("🟡 Pokeball gave reward");
    }
    else {

      log("🟡 Pokeball failed");
    }

    renderEnemy();

    return endTurn();
  }

  // MELATONIN
  if (card.effect === "melatonin") {

    playerMelatonin++;

    log(`😴 Melatonin ${playerMelatonin}/3`);

    if (playerMelatonin >= 3) {

      return endGame("YOU overdosed on Melatonin");
    }

    return endTurn();
  }

  // DIGO
  if (card.effect === "digo") {

    let r = Math.random();

    if (r < 0.33) {

      hand = hand.map(() => weightedDraw());

      log("😈 Digo reshuffled reality");
    }
    else if (r < 0.66) {

      hand = hand.map(() => ({
        name: "USB",
        effect: "usb",
        img: "assets/images/die/susUsb.png"
      }));

      log("😈 Digo corrupted your hand");
    }
    else {

      hand = hand.map(() => ({
        name: "Melatonin",
        effect: "melatonin",
        img: "assets/images/misc/melatonin.png"
      }));

      log("😈 Digo flooded your brain");
    }

    render();

    return endTurn();
  }

  // ATTACKS
  if (card.effect === "pipe") return attack("Pipe Bomb");

  if (card.effect === "lego") return attack("Lego Brick");

  if (card.effect === "usb") return attack("USB Curse");

  return endTurn();
}

//////////////////////////
// DEFENSE
//////////////////////////

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

//////////////////////////
// ATTACKS
//////////////////////////

function attack(type) {

  popup(
    `${type} may hit YOU or ENEMY.`,
    [

      {
        text: hasDefense() ? "Use Defense" : "Continue",

        action: () => {

          if (hasDefense()) {

            useDefense();

            log(`🛡 Blocked ${type}`);

            return endTurn();
          }

          runAttack(type);
        }
      },

      {
        text: "No",

        action: () => runAttack(type)
      }

    ]
  );
}

function runAttack(type) {

  let r = Math.random();

  if (type === "Pipe Bomb") {

    if (r < 0.33) return endGame("💥 Pipe hit YOU");

    if (r < 0.66) return endGame("💥 Pipe hit ENEMY");

    log("Pipe failed");
  }

  if (type === "Lego Brick") {

    if (r < 0.4) return endGame("🧱 Lego killed YOU");

    if (r < 0.8) return endGame("🧱 Lego killed ENEMY");

    log("Lego failed");
  }

  if (type === "USB Curse") {

    if (r < 0.5) return endGame("💀 USB destroyed YOU");

    if (r < 0.8) return endGame("💀 USB destroyed ENEMY");

    log("USB unstable");
  }

  endTurn();
}

//////////////////////////
// SMART AI
//////////////////////////

function enemyPlay() {

  if (gameOver) return;

  if (enemyStunned) {

    enemyStunned = false;

    log("Enemy skipped turn");

    return playerRecover();
  }

  let attackCards = enemyHand.filter(c =>
    ["pipe", "lego", "usb"].includes(c.effect)
  );

  let defenseLikely = hasDefense();

  let card;

  if (!defenseLikely && attackCards.length > 0) {

    card = attackCards[
      Math.floor(Math.random() * attackCards.length)
    ];
  }
  else {

    card = enemyHand[
      Math.floor(Math.random() * enemyHand.length)
    ];
  }

  if (!card) {

    return playerRecover();
  }

  enemyHand.splice(enemyHand.indexOf(card), 1);

  renderEnemy();

  showCard(card);

  setTimeout(() => {

    resolveEnemy(card);

  }, 500);
}

//////////////////////////
// ENEMY RESOLVE
//////////////////////////

function resolveEnemy(card) {

  if (card.effect === "melatonin") {

    enemyMelatonin++;

    log(`Enemy Melatonin ${enemyMelatonin}/3`);

    if (enemyMelatonin >= 3) {

      return endGame("Enemy overdosed");
    }

    return playerRecover();
  }

  if (card.effect === "pipe") return attack("Pipe Bomb");

  if (card.effect === "lego") return attack("Lego Brick");

  if (card.effect === "usb") return attack("USB Curse");

  log(`Enemy used ${card.name}`);

  playerRecover();
}

//////////////////////////
// TURN SYSTEM
//////////////////////////

function endTurn() {

  if (gameOver) return;

  resolving = false;

  playerTurn = false;

  setTimeout(() => {

    if (gameOver) return;

    drawCard(enemyHand);

    enemyPlay();

  }, 700);
}

function playerRecover() {

  if (gameOver) return;

  setTimeout(() => {

    drawCard(hand);

    render();

    playerTurn = true;

    resolving = false;

  }, 700);
}

//////////////////////////
// RENDER
//////////////////////////

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

//////////////////////////
// SHOW PLAYED CARD
//////////////////////////

function showCard(card) {

  let area = document.getElementById("playedCard");

  area.innerHTML = "";

  let img = document.createElement("img");

  img.src = card.img;

  img.className = "card playedAnim";

  area.appendChild(img);
}

//////////////////////////
// GAME OVER
//////////////////////////

function endGame(msg) {

  if (gameOver) return;

  gameOver = true;

  let overlay = document.createElement("div");

  overlay.className = "gameOver";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">Restart</button>
  `;

  document.body.appendChild(overlay);
}