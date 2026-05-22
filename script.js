

//////////////////////////
// GAME STATE
//////////////////////////

const MAX_HAND = 7;

let deck = [

  { name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack" },

  { name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "chanceDefense" },
  { name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" },
  { name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" },

  { name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defense" },

  { name: "Digo", image: "assets/images/die/digo.png", effect: "death" },
  { name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "death" },
  { name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "chanceDeath" },

  { name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" },
  { name: "Check", image: "assets/images/misc/check.png", effect: "money" },

  { name: "Cheese", image: "assets/images/misc/cheese.png", effect: "chaosCheese" },

  { name: "Melatonin", image: "assets/images/misc/melatonin.png", effect: "melatonin" },
  { name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }
];

let hand = [];
let enemyHand = [];

let playerTurn = true;
let gameOver = false;

let melatoninStack = 0;

let handDiv = document.getElementById("hand");
let enemyDiv = document.querySelector(".enemyCards");
let playedArea = document.getElementById("playedCard");

//////////////////////////
// SUBTITLES
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
    el.style.fontFamily = "Arial";
    document.body.appendChild(el);
  }

  el.innerText = text;
}

//////////////////////////
// START GAME
//////////////////////////

function startGame() {

  hand = [];
  enemyHand = [];
  gameOver = false;

  for (let i = 0; i < 5; i++) {
    draw(hand);
    draw(enemyHand);
  }

  render();
  renderEnemy();

  show("Digo is watching...");
}

startGame();

//////////////////////////
// DRAW SYSTEM
//////////////////////////

function draw(target) {

  if (gameOver) return;

  let card = deck[Math.floor(Math.random() * deck.length)];

  if (target === hand && hand.length >= MAX_HAND) return;

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();
}

//////////////////////////
// RENDER HAND
//////////////////////////

function render() {

  handDiv.innerHTML = "";

  hand.forEach((card, i) => {

    let img = document.createElement("img");
    img.src = card.image;
    img.className = "card";

    img.onclick = () => play(i);

    handDiv.appendChild(img);
  });
}

function renderEnemy() {

  enemyDiv.innerHTML = "";

  enemyHand.forEach(() => {
    let d = document.createElement("div");
    d.className = "enemyCard";
    enemyDiv.appendChild(d);
  });
}

//////////////////////////
// PLAY CARD
//////////////////////////

function play(i) {

  if (!playerTurn || gameOver) return;

  let card = hand.splice(i, 1)[0];

  render();

  showCard(card);

  resolve(card);

  endTurn();
}

function showCard(card) {

  playedArea.innerHTML = "";

  let img = document.createElement("img");
  img.src = card.image;
  img.className = "card";

  playedArea.appendChild(img);
}

//////////////////////////
// GAME LOGIC
//////////////////////////

function resolve(card) {

  if (card.effect !== "melatonin") {
    melatoninStack = 0;
  }

  // 💰 CHECK FIXED
  if (card.effect === "money") {
    draw(hand);
    draw(hand);
    show("Check gives cards");
    return;
  }

  // 🧀 CHEESE RANDOM
  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.25) draw(enemyHand);
    else if (r < 0.5) draw(hand);
    else show("Cheese did something weird");

    return;
  }

  // 💊 MELATONIN FIXED
  if (card.effect === "melatonin") {

    melatoninStack++;

    if (melatoninStack >= 3) {
      return endGame("Melatonin overdose");
    }

    show("You feel sleepy");
    return;
  }

  // 🪿 CHAOS
  if (card.effect === "chaos") {
    Math.random() < 0.5 ? draw(hand) : draw(enemyHand);
    return;
  }

  // 💥 PIPE BOMB FIXED (ENEMY TARGET)
  if (card.name === "Pipe Bomb") {

    if (Math.random() < 0.5) {
      return endGame("Enemy destroyed");
    }

    show("Pipe Bomb missed");
    return;
  }

  // ☠️ DEATH CARDS FIXED
  if (card.effect === "death") {
    return endGame("You died to " + card.name);
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
// ENEMY TURN
//////////////////////////

function endTurn() {

  playerTurn = false;

  setTimeout(() => {

    draw(enemyHand);

    let card = enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1)[0];

    renderEnemy();

    showCard(card);

    resolve(card);

    setTimeout(() => {

      draw(hand);
      render();

      playerTurn = true;

    }, 800);

  }, 700);
}

//////////////////////////
// END GAME (FIXED OVERLAY)
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
  overlay.style.fontFamily = "Arial";

  overlay.innerHTML = `
    <h1>${msg}</h1>
    <button onclick="location.reload()">Restart</button>
  `;

  document.body.appendChild(overlay);
}