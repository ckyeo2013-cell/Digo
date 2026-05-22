

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
// DECK
//////////////////////////

function buildDeck() {

  let deck = [];

  function add(card, count) {
    for (let i = 0; i < count; i++) {
      deck.push(structuredClone(card));
    }
  }

  // SAFE CARDS
  add({ name: "Chair", image: "assets/images/misc/chair.png", effect: "nothing" }, 10);
  add({ name: "Check", image: "assets/images/misc/check.png", effect: "money" }, 6);
  add({ name: "Cheese", image: "assets/images/misc/cheese.png", effect: "chaosCheese" }, 5);
  add({ name: "Wet Fish", image: "assets/images/misc/wetFish.png", effect: "stun" }, 5);

  // CHAOS
  add({ name: "Crazy Pokeball", image: "assets/images/crazy/crazy.png", effect: "clutch" }, 4);
  add({ name: "Radioactive Goose", image: "assets/images/crazy/goose.png", effect: "chaos" }, 3);
  add({ name: "U-Haul", image: "assets/images/crazy/uHaul.png", effect: "turnSwap" }, 3);

  // DEFENSE
  add({ name: "Package Defuse", image: "assets/images/defense/package.png", effect: "defense" }, 4);

  // ATTACK
  add({ name: "Pipe Bomb", image: "assets/images/attack/pipeBomb.png", effect: "attack" }, 2);

  // DEATH (RARE)
  add({ name: "Digo", image: "assets/images/die/digo.png", effect: "death" }, 1);
  add({ name: "Lego Brick", image: "assets/images/die/legoBrick.png", effect: "lego" }, 1);
  add({ name: "Sus USB", image: "assets/images/die/susUsb.png", effect: "usb" }, 1);

  return deck;
}

let deck = buildDeck();

//////////////////////////
// GAME START
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
  show("Digo is watching...");
}

startGame();

//////////////////////////
// DRAW SYSTEM (SAFE)
//////////////////////////

function drawCard(target) {

  if (gameOver) return;

  let card = structuredClone(deck[Math.floor(Math.random() * deck.length)]);

  target.push(card);

  if (target === hand) render();
  if (target === enemyHand) renderEnemy();
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

  if (card.name !== "Melatonin") {
    melatoninStack = 0;
  }

  //////////////////////
  // CHECK
  //////////////////////
  if (card.effect === "money") {
    drawCard(hand);
    drawCard(hand);
    show("Check gives you cards");
    return;
  }

  //////////////////////
  // CHEESE (RNG)
  //////////////////////
  if (card.name === "Cheese") {

    let r = Math.random();

    if (r < 0.25) drawCard(enemyHand);
    else if (r < 0.5) drawCard(hand);
    else if (r < 0.75) enemyStunned = true;
    else show("Cheese did nothing weird");
    return;
  }

  //////////////////////
  // WET FISH (STUN)
  //////////////////////
  if (card.name === "Wet Fish") {
    enemyStunned = true;
    show("Enemy stunned by fish");
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
  // CHAOS GOOSE
  //////////////////////
  if (card.effect === "chaos") {
    Math.random() < 0.5 ? drawCard(hand) : drawCard(enemyHand);
    return;
  }

  //////////////////////
  // PIPE BOMB
  //////////////////////
  if (card.name === "Pipe Bomb") {

    if (owner === "player") {

      if (enemyHasDefense()) {
        removeEnemyDefense();
        show("Enemy blocked Pipe Bomb");
      } else {
        return endGame("Enemy got destroyed by Pipe Bomb");
      }

    }

    return;
  }

  //////////////////////
  // LEGO BRICK (YOUR REQUEST)
  //////////////////////
  if (card.name === "Lego Brick") {

    let r = Math.random();

    // 40% kill enemy
    if (r < 0.4) {
      return endGame("Enemy stepped on Lego Brick");
    }

    // 40% kill player
    if (r < 0.8) {
      return endGame("You stepped on Lego Brick");
    }

    // 20% miss
    show("Lego Brick did nothing...");
    return;
  }

  //////////////////////
  // SUS USB
  //////////////////////
  if (card.name === "Sus USB") {

    if (owner === "player") {

      if (Math.random() < 0.5) {
        return endGame("USB corrupted your system");
      } else {
        show("USB survived… but it's watching");
      }

    }

    return;
  }

  //////////////////////
  // CLUTCH POKEBALL
  //////////////////////
  if (card.effect === "clutch") {

    if (Math.random() < 0.6) {
      drawCard(hand);
      show("Pokeball saved you");
    } else {
      return endGame("Pokeball failed");
    }

    return;
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
      show("Enemy is stunned");
      drawCard(hand);
      render();
      playerTurn = true;
      return;
    }

    drawCard(enemyHand);

    let playable = enemyHand.filter(c =>
      c.effect !== "usb"
    );

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
// START HAND
//////////////////////////

for (let i = 0; i < 5; i++) {
  drawCard(hand);
  drawCard(enemyHand);
}