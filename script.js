

//////////////////////////
// 🧠 GAME STATE
//////////////////////////

let cardPool = [

  // ATTACK
  { name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack", rarity: 35 },

  // CRAZY
  { name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "chanceDefense" },
  { name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" },
  { name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" },

  // DEFENSE
  { name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defuse" },

  // DIE (1/35 REAL)
  { name: "Digo", image: "assets/images/die/digo.png", effect: "death", rarity: 35 },
  { name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "death", rarity: 35 },
  { name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "chanceDeath", rarity: 35 },

  // MISC
  { name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" },
  { name: "Check", image: "assets/images/misc/check.png", effect: "money" },

  // 🧀 CHAOS CHEESE (UPDATED)
  { name: "Cheese", image: "assets/images/misc/cheese.png", effect: "chaosCheese" },

  { name: "Melatonin", image: "assets/images/misc/melatonin.png", effect: "melatonin" },
  { name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }
];

//////////////////////////
// 🎮 STATE
//////////////////////////

let hand = [];
let enemyHand = [];

let playerTurn = true;
let gameOver = false;

let turnCount = 0;
let melatoninStack = 0;

let handDiv = document.getElementById("hand");
let enemyDiv = document.querySelector(".enemyCards");
let playedCardArea = document.getElementById("playedCard");

//////////////////////////
// 🧾 SUBTITLE SYSTEM
//////////////////////////

let subtitle = document.createElement("div");
subtitle.style.position = "fixed";
subtitle.style.bottom = "20px";
subtitle.style.left = "50%";
subtitle.style.transform = "translateX(-50%)";
subtitle.style.color = "white";
subtitle.style.fontFamily = "Arial";
subtitle.style.fontSize = "18px";
subtitle.style.opacity = "0";
subtitle.style.transition = "0.3s";
document.body.appendChild(subtitle);

function showSubtitle(text, time = 1200) {
  subtitle.innerText = text;
  subtitle.style.opacity = "1";
  setTimeout(() => subtitle.style.opacity = "0", time);
}

//////////////////////////
// 🔁 START GAME
//////////////////////////

function initGame() {

  hand = [];
  enemyHand = [];
  gameOver = false;
  playerTurn = true;
  turnCount = 0;
  melatoninStack = 0;

  for (let i = 0; i < 5; i++) {
    drawCard(hand);
    drawCard(enemyHand);
  }

  renderHand();
  renderEnemy();

  showSubtitle("Digo is watching...");
}

initGame();

//////////////////////////
// 🎲 DRAW SYSTEM (FIXED)
//////////////////////////

function weightedDraw() {

  let pool = [];

  for (let card of cardPool) {

    let chance = 1 / (card.rarity || 1);

    // 💀 DIE RARITY CONTROL (1/35 FEELING)
    if (card.effect === "death") {

      if (turnCount < 5) chance *= 1.3;
      else if (turnCount < 10) chance *= 0.9;
      else chance *= 0.6;
    }

    if (Math.random() < chance) {
      pool.push(card);
    }
  }

  if (pool.length === 0) {
    pool = cardPool.filter(c => c.effect !== "death");
  }

  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

function drawCard(target) {

  if (gameOver) return;

  let card = weightedDraw();
  target.push(card);

  if (target === hand) renderHand();
  if (target === enemyHand) renderEnemy();
}

//////////////////////////
// 🃏 RENDER HAND
//////////////////////////

function renderHand() {

  handDiv.innerHTML = "";

  hand.forEach((card, index) => {

    let img = document.createElement("img");
    img.src = card.image;
    img.classList.add("card");
    img.title = card.name;

    img.onclick = () => playCard(index);

    handDiv.appendChild(img);
  });
}

//////////////////////////
// 🤖 RENDER ENEMY
//////////////////////////

function renderEnemy() {

  enemyDiv.innerHTML = "";

  enemyHand.forEach(() => {
    let div = document.createElement("div");
    div.classList.add("enemyCard");
    enemyDiv.appendChild(div);
  });
}

//////////////////////////
// 🎮 PLAY CARD
//////////////////////////

function playCard(index) {

  if (!playerTurn || gameOver) return;

  let card = hand[index];

  hand.splice(index, 1);

  renderHand();

  showPlayedCard(card);

  resolveCard(card, hand);

  checkWin();

  endTurn();
}

//////////////////////////
// 🧾 CENTER CARD
//////////////////////////

function showPlayedCard(card) {

  playedCardArea.innerHTML = "";

  let img = document.createElement("img");
  img.src = card.image;
  img.classList.add("card");

  playedCardArea.appendChild(img);
}

//////////////////////////
// ⚙️ CARD LOGIC
//////////////////////////

function resolveCard(card, target) {

  // 💰 CHECK
  if (card.effect === "money") {
    showSubtitle("Check doubles your chaos");
    drawCard(hand);
    drawCard(hand);
    drawCard(hand);
    return;
  }

  // 🧠 WET FISH / STUN
  if (card.effect === "stun") {
    showSubtitle("Wet fish slap 🐟");
    return;
  }

  // 🧀 CHAOS CHEESE (NEW SYSTEM)
  if (card.effect === "chaosCheese") {

    let roll = Math.random();

    if (roll < 0.25) {
      showSubtitle("Moldy cheese stuns enemy 🧀");
      drawCard(enemyHand);
    }

    else if (roll < 0.5) {
      showSubtitle("Cheese backfires 💀");
      handleDeath(card, hand);
    }

    else if (roll < 0.75) {
      showSubtitle("Cheese does nothing...");
    }

    else {
      showSubtitle("Cheese evolves reality ???");
      drawCard(hand);
      drawCard(enemyHand);
    }

    return;
  }

  // 😴 MELATONIN STACK SYSTEM
  if (card.effect === "melatonin") {

    melatoninStack++;

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose 💀");
    }

    showSubtitle("You feel sleepy...");
    return;
  }

  // 🪿 CHAOS
  if (card.effect === "chaos") {
    showSubtitle("Goose distorts reality");

    Math.random() < 0.5
      ? drawCard(hand)
      : drawCard(enemyHand);

    return;
  }

  // 💀 DEATH SYSTEM (PLAYER HIT)
  if (card.effect === "death" || card.effect === "chanceDeath") {

    let died = handleDeath(card, hand);

    if (died) {
      endGame("💀 You died to " + card.name);
    }

    return;
  }

  // ⚔️ PIPE BOMB FIX (ATTACK ENEMY)
  if (card.name === "Pipe Bomb") {

    showSubtitle("Pipe Bomb launched 💥");

    let died = handleDeath(card, enemyHand);

    if (died) {
      endGame("💀 Enemy got deleted by Pipe Bomb");
    }

    return;
  }
}

//////////////////////////
// ☠️ DEATH ENGINE
//////////////////////////

function handleDeath(card, target) {

  let defuse = target.some(c => c.effect === "defuse");
  let pokeball = target.some(c => c.effect === "chanceDefense");

  if (defuse) {
    removeCard(target, "defuse");
    showSubtitle("Defuse blocked death");
    return false;
  }

  if (pokeball && Math.random() < 0.7) {
    removeCard(target, "chanceDefense");
    showSubtitle("Pokeball saved you");
    return false;
  }

  return true;
}

function removeCard(target, effect) {

  let i = target.findIndex(c => c.effect === effect);

  if (i !== -1) target.splice(i, 1);

  renderHand();
  renderEnemy();
}

//////////////////////////
// 🔁 TURN SYSTEM (FIXED)
//////////////////////////

function endTurn() {

  playerTurn = false;

  turnCount++;

  showSubtitle("Enemy thinking...");

  setTimeout(enemyTurn, 900);
}

//////////////////////////
// 🤖 ENEMY TURN
//////////////////////////

function enemyTurn() {

  if (gameOver) return;

  drawCard(enemyHand);

  let index = Math.floor(Math.random() * enemyHand.length);
  let card = enemyHand.splice(index, 1)[0];

  renderEnemy();

  showPlayedCard(card);

  showSubtitle("Enemy played " + card.name);

  if (card.effect === "death" || card.effect === "chanceDeath") {

    let died = handleDeath(card, enemyHand);

    if (died) {
      return endGame("💀 Enemy died → YOU WIN");
    }
  }

  checkWin();

  setTimeout(() => {

    drawCard(hand);
    renderHand();

    playerTurn = true;

    showSubtitle("Your turn");

  }, 900);
}

//////////////////////////
// 🏁 WIN CHECK
//////////////////////////

function checkWin() {

  if (enemyHand.length === 0) {
    endGame("Enemy out of cards → YOU WIN");
  }

  if (hand.length === 0) {
    endGame("You out of cards → YOU LOSE");
  }
}

//////////////////////////
// 💀 END GAME (CLEAN RESET FIX)
//////////////////////////

function endGame(msg) {

  if (gameOver) return;

  gameOver = true;

  handDiv.innerHTML = "";
  enemyDiv.innerHTML = "";
  playedCardArea.innerHTML = "";

  document.body.style.background = "#2b0d0d";

  let overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";

  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  overlay.style.background = "rgba(0,0,0,0.75)";
  overlay.style.color = "white";
  overlay.style.fontFamily = "Arial";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()" style="padding:10px 20px; font-size:18px; cursor:pointer;">
      Restart
    </button>
  `;

  document.body.appendChild(overlay);

  showSubtitle("Game Over");
}