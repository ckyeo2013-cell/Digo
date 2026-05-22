

//////////////////////////
// GAME STATE
//////////////////////////

let gameOver = false;
let playerTurn = true;

let hand = [];
let enemyHand = [];

let melatoninStack = 0;
let enemyStunned = false;

const MAX_HAND = 7;

//////////////////////////
// DECK
//////////////////////////

function buildDeck() {

  let deck = [];

  function add(card, count) {
    for (let i = 0; i < count; i++) {
      deck.push(structuredClone(card));
    }
  }

  // SAFE
  add({ name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" }, 8);
  add({ name: "Check", image: "assets/images/misc/check.png", effect: "money" }, 5);
  add({ name: "Cheese", image: "assets/images/misc/cheese.png", effect: "cheese" }, 5);
  add({ name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }, 4);

  // CHAOS
  add({ name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "clutch" }, 3);
  add({ name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" }, 3);
  add({ name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" }, 2);

  // DEFENSE
  add({ name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defense" }, 3);

  // ATTACK
  add({ name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "pipe" }, 2);

  // RARE DEATHS
  add({ name: "Digo", image: "assets/images/die/digo.png", effect: "digo" }, 1);
  add({ name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "lego" }, 1);
  add({ name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "usb" }, 1);

  // MELATONIN (FIXED)
  add({ name: "Melatonin", image: "assets/images/misc/melatonin.png", effect: "melatonin" }, 4);

  return deck;
}

let deck = buildDeck();

//////////////////////////
// START
//////////////////////////

function startGame() {

  gameOver = false;
  playerTurn = true;

  hand = [];
  enemyHand = [];

  melatoninStack = 0;
  enemyStunned = false;

  for (let i = 0; i < 5; i++) {
    drawCard(hand);
    drawCard(enemyHand);
  }

  render();
  renderEnemy();
  show("Digo watches the board...");

}

startGame();

//////////////////////////
// DRAW SYSTEM
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = structuredClone(deck[Math.floor(Math.random() * deck.length)]);

  if (target === hand && hand.length >= MAX_HAND) {
    discardRandom(hand);
    log("Hand overloaded — card lost");
  }

  target.push(card);

  render();
  renderEnemy();

}

function discardRandom(arr) {
  if (arr.length === 0) return;
  arr.splice(Math.floor(Math.random() * arr.length), 1);
}

//////////////////////////
// PLAY CARD
//////////////////////////

function playCard(i) {

  if (!playerTurn || gameOver) return;

  let card = hand.splice(i, 1)[0];

  render();
  showCard(card);

  resolve(card, "player");

  endTurn();

}

//////////////////////////
// CORE LOGIC
//////////////////////////

function resolve(card, owner) {

  if (card.effect !== "melatonin") {
    melatoninStack = 0;
  }

  //////////////////////
  // CHECK
  //////////////////////
  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    log("Check paid out — +2 cards");
    return;
  }

  //////////////////////
  // CHEESE (FIXED FEEDBACK)
  //////////////////////
  if (card.effect === "cheese") {

    let r = Math.random();

    if (r < 0.25) {
      drawCard(enemyHand);
      log("Cheese helped enemy");
    }

    else if (r < 0.5) {
      drawCard(hand);
      log("Cheese helped you");
    }

    else if (r < 0.75) {
      enemyStunned = true;
      log("Cheese stunned enemy");
    }

    else {
      discardRandom(hand);
      log("Cheese backfired — you lost a card");
    }

    return;
  }

  //////////////////////
  // MELATONIN (FIXED + CLEAR)
  //////////////////////
  if (card.effect === "melatonin") {

    melatoninStack++;

    log("Melatonin stack: " + melatoninStack);

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    if (Math.random() < 0.2) {
      discardRandom(hand);
      log("Melatonin made you drop a card");
    }

    return;
  }

  //////////////////////
  // STUN
  //////////////////////
  if (card.effect === "stun") {
    enemyStunned = true;
    log("Enemy stunned");
    return;
  }

  //////////////////////
  // CHAOS
  //////////////////////
  if (card.effect === "chaos") {
    Math.random() < 0.5 ? drawCard(hand) : drawCard(enemyHand);
    return;
  }

  //////////////////////
  // PIPE BOMB (FIXED + CLEAN)
  //////////////////////
  if (card.effect === "pipe") {

    let r = Math.random();

    if (r < 0.33) {

      if (enemyHasDefense()) {
        removeEnemyDefense();
        log("Enemy blocked Pipe Bomb");
      } else {
        return endGame("Pipe Bomb destroyed enemy");
      }

      return;
    }

    if (r < 0.66) {

      if (hasPlayerDefense()) {
        removePlayerDefense();
        log("You blocked Pipe Bomb");
      } else {
        return endGame("Pipe Bomb destroyed you");
      }

      return;
    }

    log("Pipe Bomb failed");

    return;
  }

  //////////////////////
  // LEGO BRICK
  //////////////////////
  if (card.effect === "lego") {

    let r = Math.random();

    if (r < 0.4) return endGame("Enemy stepped on Lego Brick");
    if (r < 0.8) return endGame("You stepped on Lego Brick");

    log("Lego Brick did nothing");

    return;
  }

  //////////////////////
  // USB
  //////////////////////
  if (card.effect === "usb") {

    if (owner === "player") {

      if (Math.random() < 0.5) {
        return endGame("USB corrupted everything");
      }

      discardRandom(hand);
      log("USB stole a card");

    }

    return;
  }

  //////////////////////
  // DIGO (CLEAN + FUN)
  //////////////////////
  if (card.effect === "digo") {

    log("Digo rewrites reality");

    let mode = Math.floor(Math.random() * 3);

    if (mode === 0) {

      hand = hand.map(() => ({
        name: "Melatonin",
        image: "assets/images/misc/melatonin.png",
        effect: "melatonin"
      }));

    }

    else if (mode === 1) {

      hand = hand.map(() => ({
        name: "Sus USB",
        image: "assets/images/die/susUsb.png",
        effect: "usb"
      }));

    }

    else {

      discardRandom(hand);

    }

    render();

    return;
  }

  //////////////////////
  // POKEBALL
  //////////////////////
  if (card.effect === "clutch") {

    if (Math.random() < 0.55) {
      drawCard(hand);
      log("Pokeball saved you");
    } else {
      return endGame("Pokeball failed");
    }

    return;
  }

}

//////////////////////////
// TURN SYSTEM
//////////////////////////

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

    let playable = enemyHand.filter(c => c.effect !== "usb");

    if (playable.length === 0) {
      log("Enemy passes");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    let play = playable[Math.floor(Math.random() * playable.length)];

    enemyHand.splice(enemyHand.indexOf(play), 1);

    renderEnemy();

    showCard(play);

    resolve(play, "enemy");

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

    img.title = card.name;

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
// UI
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

    el.style.background = "rgba(0,0,0,0.7)";
    el.style.color = "white";
    el.style.padding = "10px 20px";
    el.style.borderRadius = "10px";

    document.body.appendChild(el);
  }

  el.innerText = text;

}

function log(text) {
  show(text);
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
// HELPERS
//////////////////////////

function enemyHasDefense() {
  return enemyHand.some(c => c.effect === "defense");
}

function removeEnemyDefense() {
  let i = enemyHand.findIndex(c => c.effect === "defense");
  if (i !== -1) enemyHand.splice(i, 1);
  renderEnemy();
}

function hasPlayerDefense() {
  return hand.some(c => c.effect === "defense");
}

function removePlayerDefense() {
  let i = hand.findIndex(c => c.effect === "defense");
  if (i !== -1) hand.splice(i, 1);
  render();
}

//////////////////////////
// END GAME
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

  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">Restart</button>
  `;

  document.body.appendChild(overlay);

}

//////////////////////////
// START GAME
//////////////////////////

for (let i = 0; i < 5; i++) {
  drawCard(hand);
  drawCard(enemyHand);
}