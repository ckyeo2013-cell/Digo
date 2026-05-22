

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

  // SAFE (lowered slightly for tension)
  add({ name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" }, 8);
  add({ name: "Check", image: "assets/images/misc/check.png", effect: "money" }, 5);
  add({ name: "Cheese", image: "assets/images/misc/cheese.png", effect: "chaosCheese" }, 5);
  add({ name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }, 4);

  // CHAOS
  add({ name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "clutch" }, 3);
  add({ name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" }, 3);
  add({ name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" }, 2);

  // DEFENSE (weaker now = real threat exists)
  add({ name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defense" }, 3);

  // ATTACK
  add({ name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack" }, 2);

  // DEATH (RARER BUT MORE SCARY)
  add({ name: "Digo", image: "assets/images/die/digo.png", effect: "digo" }, 1);
  add({ name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "lego" }, 1);
  add({ name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "usb" }, 1);

  // 🔥 FIXED MELATONIN (NOW GUARANTEED)
  add({ name: "Melatonin", image: "assets/images/misc/melatonin.png", effect: "melatonin" }, 4);

  return deck;
}

let deck = buildDeck();

//////////////////////////
// DRAW SYSTEM (FIXED PRESSURE)
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = structuredClone(deck[Math.floor(Math.random() * deck.length)]);

  // 💀 hand limit system (THIS FIXES "infinite cards")
  if (target === hand && hand.length >= MAX_HAND) {

    discardRandom(hand);

    show("You are overloaded. A card collapses.");

  }

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();

}

function discardRandom(arr) {

  if (arr.length === 0) return;

  let i = Math.floor(Math.random() * arr.length);

  arr.splice(i, 1);
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
// CORE LOGIC (FIXED THREAT SYSTEM)
//////////////////////////

function resolve(card, owner) {

  //////////////////////
  // RESET MELATONIN
  //////////////////////
  if (card.effect !== "melatonin") {
    melatoninStack = 0;
  }

  //////////////////////
  // CHECK
  //////////////////////
  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    show("Check gives you momentum");
    return;
  }

  //////////////////////
  // CHEESE RNG (REAL CHAOS NOW)
  //////////////////////
  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.2) drawCard(enemyHand);
    else if (r < 0.4) drawCard(hand);
    else if (r < 0.6) enemyStunned = true;
    else if (r < 0.8) discardRandom(hand);
    else return endGame("Cheese collapsed reality");

    return;
  }

  //////////////////////
  // MELATONIN (FIXED + NOW ACTUALLY THREAT)
  //////////////////////
  if (card.effect === "melatonin") {

    melatoninStack++;

    show("Melatonin stack: " + melatoninStack);

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    // 💀 also gives drawback immediately
    if (Math.random() < 0.3) {
      discardRandom(hand);
      show("You dropped a card due to drowsiness");
    }

    return;
  }

  //////////////////////
  // STUN
  //////////////////////
  if (card.effect === "stun") {
    enemyStunned = true;
    show("Enemy stunned");
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
  // PIPE BOMB (REAL THREAT NOW)
  //////////////////////
  if (card.name === "Pipe Bomb") {

    if (owner === "player") {

      if (enemyHasDefense()) {
        removeEnemyDefense();
        show("Enemy blocked Pipe Bomb");
      } else {
        return endGame("Pipe Bomb ended everything");
      }

    }

    return;
  }

  //////////////////////
  // LEGO BRICK (UNCHANGED CHAOS)
  //////////////////////
  if (card.name === "Lego Brick") {

    let r = Math.random();

    if (r < 0.4) return endGame("Enemy stepped on Lego Brick");
    if (r < 0.8) return endGame("You stepped on Lego Brick");

    show("Lego Brick did nothing");

    return;
  }

  //////////////////////
  // USB (SCARIER NOW)
  //////////////////////
  if (card.name === "Sus USB") {

    if (owner === "player") {

      if (Math.random() < 0.55) {
        return endGame("USB corrupted everything");
      }

      discardRandom(hand);
      show("USB stole a memory fragment");

    }

    return;
  }

  //////////////////////
  // DIGO (NOW ACTUAL PRESSURE SYSTEM)
  //////////////////////
  if (card.effect === "digo") {

    show("Digo appears. The rules break.");

    let mode = Math.floor(Math.random() * 3);

    if (mode === 0) {

      // MELATONIN CURSE
      hand = hand.map(() => ({
        name: "Melatonin",
        image: "assets/images/misc/melatonin.png",
        effect: "melatonin"
      }));

    } else if (mode === 1) {

      // USB CURSE
      hand = hand.map(() => ({
        name: "Sus USB",
        image: "assets/images/die/susUsb.png",
        effect: "usb"
      }));

    } else {

      // LOSS OF CONTROL
      discardRandom(hand);

    }

    render();

    return;
  }

  //////////////////////
  // CLUTCH POKEBALL (IMPORTANT AGAIN)
  //////////////////////
  if (card.effect === "clutch") {

    if (Math.random() < 0.55) {
      drawCard(hand);
      show("Pokeball saved you");
    } else {
      return endGame("Pokeball failed");
    }

    return;
  }

}

//////////////////////////
// TURN SYSTEM (MORE PRESSURE)
//////////////////////////

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    if (enemyStunned) {
      enemyStunned = false;
      show("Enemy skipped turn");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    drawCard(enemyHand);

    let playable = enemyHand.filter(c => c.effect !== "usb");

    if (playable.length === 0) {
      show("Enemy passes");
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

function showCard(card) {

  let area = document.getElementById("playedCard");

  area.innerHTML = "";

  let img = document.createElement("img");

  img.src = card.image;
  img.className = "card";

  area.appendChild(img);

}

//////////////////////////
// DEFS
//////////////////////////

function enemyHasDefense() {
  return enemyHand.some(c => c.effect === "defense");
}

function removeEnemyDefense() {

  let i = enemyHand.findIndex(c => c.effect === "defense");

  if (i !== -1) enemyHand.splice(i, 1);

  renderEnemy();

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

  overlay.style.background = "rgba(0,0,0,0.85)";
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
// START
//////////////////////////

for (let i = 0; i < 5; i++) {
  drawCard(hand);
  drawCard(enemyHand);
}