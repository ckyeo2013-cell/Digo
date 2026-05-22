

//////////////////////////
// GAME STATE
//////////////////////////

let gameOver = false;
let playerTurn = true;

let hand = [];
let enemyHand = [];

let melatoninStack = 0;

// 💀 anti-bad-luck system
let lastDraws = [];

//////////////////////////
// DECK BUILDER (BALANCED)
//////////////////////////

function buildDeck() {

  let deck = [];

  function add(card, count) {
    for (let i = 0; i < count; i++) deck.push(structuredClone(card));
  }

  // SAFE (most common)
  add({ name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" }, 8);
  add({ name: "Check", image: "assets/images/misc/check.png", effect: "money" }, 6);
  add({ name: "Cheese", image: "assets/images/misc/cheese.png", effect: "chaosCheese" }, 5);
  add({ name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }, 5);

  // CHAOS
  add({ name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "chanceDefense" }, 4);
  add({ name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" }, 3);
  add({ name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" }, 3);

  // DEFENSE
  add({ name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defense" }, 4);

  // ATTACK
  add({ name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack" }, 3);

  // DEATH (RARE NOW)
  add({ name: "Digo", image: "assets/images/die/digo.png", effect: "death" }, 2);
  add({ name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "death" }, 2);
  add({ name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "chanceDeath" }, 2);

  return deck;
}

let deck = buildDeck();

//////////////////////////
// START GAME
//////////////////////////

function startGame() {

  gameOver = false;
  playerTurn = true;

  hand = [];
  enemyHand = [];

  for (let i = 0; i < 5; i++) {
    drawCard(hand);
    drawCard(enemyHand);
  }

  render();
  renderEnemy();

  show("Digo is watching...");
}

startGame();

//////////////////////////
// DRAW SYSTEM (BALANCED RNG)
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = smartDraw();

  // 🚫 anti-streak rule
  lastDraws.push(card.effect);
  if (lastDraws.length > 3) lastDraws.shift();

  // if too many deaths in a row → reroll
  if (isDeathStreak()) {
    card = getSafeCard();
  }

  if (target === hand && hand.length >= 7) return;

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();
}

function smartDraw() {

  let r = Math.random();

  if (r < 0.06) return pick("death");
  if (r < 0.15) return pick("attack");
  if (r < 0.30) return pick("defense");
  if (r < 0.55) return pick("chaos");

  return pick("normal");
}

function pick(type) {

  let pool = deck.filter(c => {

    if (type === "death") return c.effect === "death" || c.effect === "chanceDeath";
    if (type === "attack") return c.effect === "attack";
    if (type === "defense") return c.effect === "defense";
    if (type === "chaos") return c.effect === "chaos" || c.effect === "chanceDefense" || c.effect === "turnSwap";
    return c.effect === "nothing" || c.effect === "money" || c.effect === "chaosCheese";
  });

  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

function getSafeCard() {

  let safe = deck.filter(c =>
    c.effect !== "death" &&
    c.effect !== "chanceDeath"
  );

  return structuredClone(safe[Math.floor(Math.random() * safe.length)]);
}

function isDeathStreak() {

  return lastDraws.filter(e =>
    e === "death" || e === "chanceDeath"
  ).length >= 2;
}

//////////////////////////
// PLAY SYSTEM
//////////////////////////

function playCard(i) {

  if (!playerTurn || gameOver) return;

  let card = hand.splice(i, 1)[0];

  render();
  showCard(card);

  resolve(card);

  endTurn();
}

function showCard(card) {

  let area = document.getElementById("playedCard");
  area.innerHTML = "";

  let img = document.createElement("img");
  img.src = card.image;
  img.className = "card";

  area.appendChild(img);
}

//////////////////////////
// CARD LOGIC
//////////////////////////

function resolve(card) {

  if (card.effect !== "melatonin") {
    melatoninStack = 0;
  }

  // 💰 CHECK FIXED
  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    show("Check gives cards");
    return;
  }

  // 🧀 CHEESE RANDOM
  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.25) drawCard(enemyHand);
    else if (r < 0.5) drawCard(hand);
    else show("Cheese did nothing weird this time");

    return;
  }

  // 💊 MELATONIN OVERDOSE FIXED
  if (card.effect === "melatonin") {

    melatoninStack++;

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    show("You feel sleepy...");
    return;
  }

  // 🪿 CHAOS
  if (card.effect === "chaos") {
    Math.random() < 0.5 ? drawCard(hand) : drawCard(enemyHand);
    return;
  }

  // 💥 PIPE BOMB FIXED
  if (card.name === "Pipe Bomb") {

    if (Math.random() < 0.5) {
      return endGame("Enemy got deleted");
    }

    show("Pipe Bomb missed");
    return;
  }

  // ☠️ DEATH CARDS FIXED
  if (card.effect === "death") {
    return endGame("Killed by " + card.name);
  }

  // ☠️ SUS USB FIXED
  if (card.effect === "chanceDeath") {

    if (Math.random() < 0.5) {
      return endGame("Sus USB killed you");
    }

    show("You survived USB");
    return;
  }
}

//////////////////////////
// TURN SYSTEM
//////////////////////////

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    drawCard(enemyHand);

    let enemyPlay = enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1)[0];

    renderEnemy();

    showCard(enemyPlay);
    resolve(enemyPlay);

    setTimeout(() => {

      drawCard(hand);
      render();

      playerTurn = true;

    }, 700);

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

//////////////////////////
// UI TEXT
//////////////////////////

function show(text) {

  let el = document.getElementById("sub");

  if (!el) {
    el = document.createElement("div");
    el.id = "sub";
    el.style.position = "fixed";
    el.style.bottom = "20px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.color = "white";
    document.body.appendChild(el);
  }

  el.innerText = text;
}

//////////////////////////
// END GAME (CLEAN)
//////////////////////////

function endGame(msg) {

  if (gameOver) return;
  gameOver = true;

  let overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.color = "white";
  overlay.style.fontFamily = "Arial";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">Restart</button>
  `;

  document.body.appendChild(overlay);
}