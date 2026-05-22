

//////////////////////////
// GAME STATE
//////////////////////////

let gameOver = false;
let playerTurn = true;

let hand = [];
let enemyHand = [];

let melatoninStack = 0;
let enemyStunned = false;

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
  add({ name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" }, 10);
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
  add({ name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack" }, 2);

  // DEATH (RARE)
  add({ name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "death" }, 1);
  add({ name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "chanceDeath" }, 1);

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

  show("Digo is watching.");

}

startGame();

//////////////////////////
// DRAW SYSTEM
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = smartDraw();

  if (target === hand && hand.length >= 7) return;

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();

}

function smartDraw() {

  let r = Math.random();

  if (r < 0.05) return pick("death");
  if (r < 0.15) return pick("attack");
  if (r < 0.30) return pick("defense");
  if (r < 0.60) return pick("chaos");

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
// RESOLVE CARDS
//////////////////////////

function resolve(card, owner) {

  // RESET MELATONIN
  if (card.name !== "Melatonin") {
    melatoninStack = 0;
  }

  //////////////////////
  // CHECK
  //////////////////////

  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    show("Check gave you cards");
    return;
  }

  //////////////////////
  // CHEESE
  //////////////////////

  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.25) drawCard(enemyHand);
    else if (r < 0.5) drawCard(hand);
    else if (r < 0.75) enemyStunned = true;
    else show("Cheese did something unexplainable");

    return;
  }

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

  //////////////////////
  // CHAOS
  //////////////////////

  if (card.effect === "chaos") {
    Math.random() < 0.5 ? drawCard(hand) : drawCard(enemyHand);
    return;
  }

  //////////////////////
  // PIPE BOMB
  //////////////////////

  if (card.name === "Pipe Bomb") {

    if (Math.random() < 0.5) {
      return endGame("Enemy got deleted by Pipe Bomb");
    }

    show("Pipe Bomb missed");
    return;
  }

  //////////////////////
  // LEGO BRICK
  //////////////////////

  if (card.name === "Lego Brick") {

    if (Math.random() < 0.5) {
      return endGame("Enemy stepped on Lego Brick");
    }

    show("Lego Brick failed");
    return;
  }

  //////////////////////
  // SUS USB FIXED
  //////////////////////

  if (card.name === "Sus USB") {

    show("The USB is staring at you...");

    let roll = Math.random();

    if (roll < 0.5) {

      setTimeout(() => {
        endGame("Sus USB corrupted your system");
      }, 800);

    } else {

      setTimeout(() => {
        show("You survived the USB. It is still watching.");
      }, 600);

    }

    return;
  }

  //////////////////////
  // DEATH GENERIC
  //////////////////////

  if (card.effect === "death") {
    return endGame("Killed by " + card.name);
  }

}

//////////////////////////
// ENEMY TURN
//////////////////////////

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    if (enemyStunned) {
      enemyStunned = false;
      show("Enemy stunned");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    drawCard(enemyHand);

    let playable = enemyHand.filter(c =>
      c.effect !== "death" &&
      c.effect !== "chanceDeath"
    );

    if (playable.length === 0) {
      show("Enemy passed");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    let card = playable[Math.floor(Math.random() * playable.length)];

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
    el.style.color = "white";
    el.style.background = "rgba(0,0,0,0.7)";
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

render();
renderEnemy();