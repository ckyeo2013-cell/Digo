

//////////////////////////
// GAME STATE
//////////////////////////

let gameOver = false;
let playerTurn = true;

let hand = [];
let enemyHand = [];

let melatoninStack = 0;
let enemyStunned = false;

// anti-bad-luck system
let lastDraws = [];

//////////////////////////
// DECK BUILDER
//////////////////////////

function buildDeck() {

  let deck = [];

  function add(card, count) {
    for (let i = 0; i < count; i++) {
      deck.push(structuredClone(card));
    }
  }

  // SAFE
  add({
    name: "Chair",
    image: "assets/images/misc/chair.png",
    effect: "nothing"
  }, 8);

  add({
    name: "Check",
    image: "assets/images/misc/check.png",
    effect: "money"
  }, 6);

  add({
    name: "Cheese",
    image: "assets/images/misc/cheese.png",
    effect: "chaosCheese"
  }, 5);

  add({
    name: "Wet Fish",
    image: "assets/images/misc/wetFish.png",
    effect: "stun"
  }, 5);

  // CHAOS
  add({
    name: "Crazy Pokeball",
    image: "assets/images/crazy/crazy.png",
    effect: "chanceDefense"
  }, 4);

  add({
    name: "Radioactive Goose",
    image: "assets/images/crazy/goose.png",
    effect: "chaos"
  }, 3);

  add({
    name: "U-Haul",
    image: "assets/images/crazy/uHaul.png",
    effect: "turnSwap"
  }, 3);

  // DEFENSE
  add({
    name: "Package Defuse",
    image: "assets/images/defense/package.png",
    effect: "defense"
  }, 4);

  // ATTACK
  add({
    name: "Pipe Bomb",
    image: "assets/images/attack/pipeBomb.png",
    effect: "attack"
  }, 3);

  // DEATH (VERY RARE)
  add({
    name: "Digo",
    image: "assets/images/die/digo.png",
    effect: "death"
  }, 1);

  add({
    name: "Lego Brick",
    image: "assets/images/die/legoBrick.png",
    effect: "death"
  }, 1);

  add({
    name: "Sus USB",
    image: "assets/images/die/susUsb.png",
    effect: "chanceDeath"
  }, 1);

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

  melatoninStack = 0;

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
// DRAW SYSTEM
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = smartDraw();

  lastDraws.push(card.effect);

  if (lastDraws.length > 3) {
    lastDraws.shift();
  }

  // anti-death streak
  if (isDeathStreak()) {
    card = getSafeCard();
  }

  // max hand size
  if (target === hand && hand.length >= 7) return;

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();
}

function smartDraw() {

  let r = Math.random();

  // death chance LOWERED HARD
  if (r < 0.035) return pick("death");

  if (r < 0.13) return pick("attack");

  if (r < 0.28) return pick("defense");

  if (r < 0.52) return pick("chaos");

  return pick("normal");
}

function pick(type) {

  let pool = deck.filter(c => {

    if (type === "death") {
      return c.effect === "death" ||
             c.effect === "chanceDeath";
    }

    if (type === "attack") {
      return c.effect === "attack";
    }

    if (type === "defense") {
      return c.effect === "defense";
    }

    if (type === "chaos") {
      return c.effect === "chaos" ||
             c.effect === "chanceDefense" ||
             c.effect === "turnSwap";
    }

    return c.effect === "nothing" ||
           c.effect === "money" ||
           c.effect === "chaosCheese" ||
           c.effect === "stun";
  });

  return structuredClone(
    pool[Math.floor(Math.random() * pool.length)]
  );
}

function getSafeCard() {

  let safe = deck.filter(c =>
    c.effect !== "death" &&
    c.effect !== "chanceDeath"
  );

  return structuredClone(
    safe[Math.floor(Math.random() * safe.length)]
  );
}

function isDeathStreak() {

  return lastDraws.filter(e =>
    e === "death" ||
    e === "chanceDeath"
  ).length >= 2;
}

//////////////////////////
// PLAY CARD
//////////////////////////

function playCard(i) {

  if (!playerTurn || gameOver) return;

  let card = hand[i];

  // DIGO + USB cannot be played
  if (card.name === "Digo") {

    show("Digo refuses to move.");

    return;
  }

  if (card.name === "Sus USB") {

    show("The USB is staring at you.");

    return;
  }

  hand.splice(i, 1);

  render();

  showCard(card);

  resolve(card, "player");

  endTurn();
}

//////////////////////////
// CARD LOGIC
//////////////////////////

function resolve(card, owner) {

  //////////////////////
  // MELATONIN
  //////////////////////

  if (card.name === "Melatonin") {

    melatoninStack++;

    show("Melatonin stack: " + melatoninStack);

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    return;
  }

  if (card.name !== "Melatonin") {
    melatoninStack = 0;
  }

  //////////////////////
  // CHECK
  //////////////////////

  if (card.effect === "money") {

    drawCard(owner === "player" ? hand : enemyHand);
    drawCard(owner === "player" ? hand : enemyHand);

    show("Check somehow generated more cards");

    return;
  }

  //////////////////////
  // CHEESE
  //////////////////////

  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.25) {

      drawCard(hand);

      show("The cheese was nutritious");

    } else if (r < 0.5) {

      drawCard(enemyHand);

      show("The cheese became hostile");

    } else if (r < 0.75) {

      enemyStunned = true;

      show("Mold stunned the enemy");

    } else {

      show("The cheese observed reality");

    }

    return;
  }

  //////////////////////
  // FISH
  //////////////////////

  if (card.name === "Wet Fish") {

    enemyStunned = true;

    show("Enemy got slapped by wet fish");

    return;
  }

  //////////////////////
  // GOOSE
  //////////////////////

  if (card.effect === "chaos") {

    Math.random() < 0.5
      ? drawCard(hand)
      : drawCard(enemyHand);

    show("Radioactive Goose caused problems");

    return;
  }

  //////////////////////
  // UHAUL
  //////////////////////

  if (card.effect === "turnSwap") {

    show("U-Haul rearranged reality");

    return;
  }

  //////////////////////
  // PIPE BOMB
  //////////////////////

  if (card.name === "Pipe Bomb") {

    if (owner === "player") {

      if (enemyHasDefense()) {

        removeEnemyDefense();

        moveToGameArea(card);

        show("Enemy blocked Pipe Bomb");

      } else {

        return endGame("Enemy exploded");

      }

    }

    return;
  }

  //////////////////////
  // LEGO BRICK
  //////////////////////

  if (card.name === "Lego Brick") {

    if (owner === "player") {

      if (enemyHasDefense()) {

        removeEnemyDefense();

        moveToGameArea(card);

        show("Enemy survived Lego Brick");

      } else {

        return endGame("Enemy stepped on Lego Brick");

      }

    }

    return;
  }
}

//////////////////////////
// DEFENSE SYSTEM
//////////////////////////

function enemyHasDefense() {

  return enemyHand.some(c =>
    c.effect === "defense"
  );
}

function removeEnemyDefense() {

  let i = enemyHand.findIndex(c =>
    c.effect === "defense"
  );

  if (i !== -1) {

    enemyHand.splice(i, 1);

    renderEnemy();
  }
}

//////////////////////////
// GAME AREA
//////////////////////////

function moveToGameArea(card) {

  let area = document.getElementById("playedCard");

  area.innerHTML = "";

  let img = document.createElement("img");

  img.src = card.image;

  img.className = "card";

  area.appendChild(img);
}

//////////////////////////
// ENEMY TURN
//////////////////////////

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    if (enemyStunned) {

      show("Enemy is stunned");

      enemyStunned = false;

      drawCard(hand);

      render();

      playerTurn = true;

      return;
    }

    drawCard(enemyHand);

    // enemy cannot use death cards
    let playable = enemyHand.filter(card =>

      card.effect !== "death" &&
      card.effect !== "chanceDeath"

    );

    if (playable.length === 0) {

      show("Enemy passed");

      drawCard(hand);

      render();

      playerTurn = true;

      return;
    }

    let enemyPlay =
      playable[Math.floor(Math.random() * playable.length)];

    enemyHand.splice(
      enemyHand.indexOf(enemyPlay),
      1
    );

    renderEnemy();

    showCard(enemyPlay);

    resolve(enemyPlay, "enemy");

    setTimeout(() => {

      drawCard(hand);

      render();

      playerTurn = true;

    }, 700);

  }, 700);
}

//////////////////////////
// RENDER PLAYER
//////////////////////////

function render() {

  let div = document.getElementById("hand");

  div.innerHTML = "";

  hand.forEach((card, i) => {

    let img = document.createElement("img");

    img.src = card.image;

    img.className = "card";

    img.onclick = () => playCard(i);

    // hover description
    img.title = card.name;

    div.appendChild(img);
  });
}

//////////////////////////
// RENDER ENEMY
//////////////////////////

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
// UI SUBTITLE
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

    el.style.background = "rgba(0,0,0,0.7)";

    el.style.padding = "10px 20px";

    el.style.borderRadius = "10px";

    document.body.appendChild(el);
  }

  el.innerText = text;
}

//////////////////////////
// SHOW PLAYED CARD
//////////////////////////

function showCard(card) {

  let area = document.getElementById("playedCard");

  area.innerHTML = "";

  let img = document.createElement("img");

  img.src = card.image;

  img.className = "card";

  area.appendChild(img);
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

  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";

  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  overlay.style.color = "white";

  overlay.style.fontFamily = "Arial";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">
      Restart
    </button>
  `;

  document.body.appendChild(overlay);
}

//////////////////////////
// DIGO STARE EFFECT
//////////////////////////

setInterval(() => {

  if (Math.random() < 0.12 && !gameOver) {

    let img = document.createElement("img");

    img.src = "assets/images/die/digo.png";

    img.style.position = "fixed";
    img.style.bottom = "10px";
    img.style.right = "10px";

    img.style.width = "90px";

    img.style.opacity = "0.35";

    img.style.pointerEvents = "none";

    document.body.appendChild(img);

    setTimeout(() => {

      img.remove();

    }, 2000);
  }

}, 4000);