let width = window.innerWidth;
let height = window.innerHeight;
let xSpeed = 0;
let ySpeed = 0;
let drift = -0.5; // Cosmic drift man
let audioOn = false;

const starCount = 300;
const missileSpeed = 50;
const shipTurnRate = 30;
const starSize = 5;
const twinkleFactor = 0.999;
const cannonXOffset = 200;
const cannonYOffset = 200;
const minSpeechDelay = 10000;
const randomSpeechDelay = 5000;

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let sectorNum, sectorLetter = null;
function changeSector() {
  sectorNum = Math.ceil(Math.random() * 9);
  sectorLetter = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}
changeSector();
                                   
let sayings = [
  'Here am I - sitting in a tin can - far above the world',
  'Pong to base - Anyone for electronic tennis?',
  'Major Pong to ground control - Can you hear me?',
  'Pong to base - Experiencing some drift in inertial dampers',
  'Major Pong to ground control - The stars look very different today',
  'Pong to base - Are you all asleep down there?',
  'Pong to base - I\'ve got a bad feeling about this',
  'Pong to base - If it is just us - seems like an awful waste of space.'
];

var synth = window.speechSynthesis;
let messageEl = document.querySelector('#message');
function say(text) {
  if(audioOn) {
    let ssu = new SpeechSynthesisUtterance(text);
    synth.speak(ssu);
  }
  else {
    messageEl.innerHTML = text;
    messageEl.style.display = 'block';
    setTimeout(() => { messageEl.style.display = 'none'; }, 4000);
  }
}

say('This is Major Pong to ground control');

setInterval(() => {
  if(stars.hyperSpeed > 0)
    return;
  if(Math.random() < 0.05) {
    say('Woohoo!');
    volley(6);
  }
  else if(Math.random() > 0.3) 
    say(sayings[Math.floor(Math.random() * sayings.length)]);
  else {
    say(`Pong to base - all clear in sector ${sectorNum}-${sectorLetter}`),
    changeSector();
    setTimeout(() => {
      say(`Moving on to sector ${sectorNum}-${sectorLetter}`);
      stars.hyperJump(); 
    }, 4000);
  }    
}, minSpeechDelay + Math.random() * randomSpeechDelay);

function volley(shots) {
  setTimeout(() => {
    cannon.shoot(width / 2, height / 4);
    shots--;
    if(shots > 0)
      volley(shots);
  }, 500);
}

const audioControlsEl = document.querySelector('.audioControls');
audioControlsEl.onclick = (event) => {
  event.stopPropagation();
  if(audioOn) {
    audioOn = false;
    audioControlsEl.children[1].style.display = 'none';
    audioControlsEl.children[0].style.display = 'block';
  }
  else {
    audioOn = true;
    messageEl.style.display = 'none';
    audioControlsEl.children[1].style.display = 'block';  
    audioControlsEl.children[0].style.display = 'none';
  }
};

class Stars {
  constructor(count, ctx) {
    this.stars = [];
    this.ctx = ctx;
    this.ctx.fillStyle = 'white';
    this.ctx.globalAlpha = 0.5;
    this.hyperAccelleration = 0.0001;
    this.hyperSpeed = 0;
    
    for(let i = 0; i < count; i++) {
      let star = {};
      star.scale = starSize * Math.random();
      this.placeStar(star);
      this.stars.push(star);
    }    
  }
  
  placeStar(star) {
    star.x = Math.floor(Math.random() * width);
    star.y = Math.floor(Math.random() * height); 
  }
  
  hyperJump() {
    this.hyperSpeed = this.hyperAccelleration;
    cockpitEl.style.filter = 'blur(2px)';
    pilotEl.style.filter = 'blur(2px)';
    ctx.clearRect(0, 0, width, height); 
    this.accelerating = true;
    setTimeout(() => { 
      this.stopHyperJump();
    }, 3000);
  }
  
  stopHyperJump() {
    ctx.clearRect(0, 0, width, height); 
    this.accelerating = false;
    cockpitEl.style.filter = '';
    pilotEl.style.filter = '';      
    setTimeout(() => { this.hyperSpeed = 0; }, 500);
  }
  
  hyper() {
    let midX = width / 2;
    let midY = height / 2;    
    this.stars.forEach((star) => {
      let direction = Math.atan2(midY - star.y, midX - star.x);
      if(this.accelerating) {
        this.hyperSpeed += this.hyperAccelleration;
        star.x -= Math.cos(direction) * this.hyperSpeed;
        star.y -= Math.sin(direction) * this.hyperSpeed;
      }
      else {
        this.hyperSpeed -= this.hyperAccelleration;
        star.x += Math.cos(direction) * this.hyperSpeed;
        star.y += Math.sin(direction) * this.hyperSpeed;
      }
      this.drawStar(star);
      if(height < star.y || star.y < 0 || 
         width < star.x || star.x < 0) {
        this.placeStar(star);
      }
    });
  }
  
  update() {
    this.stars.forEach((star) => {
      star.x += xSpeed / shipTurnRate;
      star.y += drift + ySpeed / shipTurnRate;
      if(height < star.y || star.y < 0 || 
         width < star.x || star.x < 0) {
        this.placeStar(star);
      }
      else if(Math.random() > twinkleFactor)
        this.placeStar(star);
      this.drawStar(star);
    });
  }
  
  drawStar(star) { 
    this.ctx.beginPath();
    this.ctx.rect(star.x, star.y, star.scale, star.scale);
    this.ctx.fill();
  }
}

class Cannon {
  constructor(ctx) {
    this.ctx = ctx;
    this.missile = null;
    this.ctx.strokeStyle = 'white';
    this.ctx.lineCap = 'round';
    this.switchCannon = false; 
  }
  
  update() {
    if(this.missile) { 
      let m = this.missile;
      m.lastX = m.x;
      m.lastY = m.y;
      
      let dx = m.x2 - m.x;
      let dy = m.y2 - m.y;
      let length = Math.sqrt((dy*dy) + (dx*dx)); 
      let mX = dx / length;
      let mY = dy / length;

      m.x += mX * m.speed;
      m.y += mY * m.speed;
      m.size = Math.sqrt(length);      
      
      this.drawMissile();
      if(length <= m.speed * 2)
        this.missile = null;
    }
  }
  
  drawMissile() {
    this.ctx.save();
    this.ctx.globalAlpha = 1;   
    this.ctx.fill();
    this.ctx.lineWidth = this.missile.size; 
    this.ctx.beginPath();
    this.ctx.moveTo(this.missile.x, this.missile.y);
    this.ctx.lineTo(this.missile.lastX, this.missile.lastY);
    this.ctx.stroke();    
    this.ctx.restore();
  }
  
  shoot(x, y) {
    if(this.missile) // Only allow one missile at a time
      return;
    play('lazerSound', 0.1);
    this.switchCannon = this.switchCannon != true; // Alternate left and right cannons
    let side = width + cannonXOffset; 
    if(this.switchCannon)
      side = -cannonXOffset;    
    this.missile = { x1: side, y1: height - cannonYOffset, x2: x, y2: y, speed: missileSpeed };
    this.missile.x = this.missile.lastX = this.missile.x1;
    this.missile.y = this.missile.lastY = this.missile.y1;
  }
}

function play(id, volume) {
  if(!audioOn)
    return;
  let audio = document.getElementById(id);
  audio.volume = volume;
  audio.play();
}

const canvas = document.querySelector('.stars');
const ctx = canvas.getContext('2d');
ctx.canvas.width = width;
ctx.canvas.height = height;
let stars = new Stars(starCount, ctx);
let cannon = new Cannon(ctx);

const cockpitEl = document.querySelector('.cockpit');
const pilotEl = document.querySelector('.pilot');

stars.hyperSpeed = 0;
function animate() {
  if(stars.hyperSpeed > 0) {
    stars.hyper();
  }
  else {
    ctx.clearRect(0, 0, width, height);
    stars.update();
    cannon.update();
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

let resizeTimer;
function resize() {
  beta = null;
  gamma = null;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    ctx.canvas.width = width = window.innerWidth;
    ctx.canvas.height = height = window.innerHeight;
    stars = new Stars(starCount, ctx);
    cannon = new Cannon(ctx);
  }, 200);
}
window.onresize = resize;

function shift() { // Parallax FTW!!!
  if(stars.hyperSpeed > 0)
    return;
  cockpitEl.style.left = -150 - xSpeed / 50 + "px";
  cockpitEl.style.top = -120 - ySpeed / 25 + "px"; 
  pilotEl.style.left = `${ (-xSpeed / width) * -10 }px`;
  pilotEl.style.bottom = `${ -20 + (-ySpeed / height) * 10 }px`;
}

let mouseParralax = true;
document.body.onmousemove = function (event) {
  if(!mouseParralax || stars.hyperSpeed > 0)
    return;
  event.preventDefault() 
  xSpeed = (width / 2) - event.clientX; 
  ySpeed = (height / 2) - event.clientY;
  shift();  
}

let beta = 0, gamma = 0;
function handleOrientation(event) {
  // If device tilt is detected turn off mouse based parralax to avoid jank on mobile
  if(event.beta)
     mouseParralax = false; 
  if(beta === 0)
    beta = event.beta;
  if(!gamma === 0)
    gamma = event.gamma;
  if (screen.orientation.type.includes('landscape')) {
    xSpeed = (event.beta - beta) * 10;
    ySpeed = (event.gamma - gamma) * 10;
    shift();  
  }
  else {
    ySpeed = (event.beta - beta) * 10;
    xSpeed = (event.gamma - gamma) * 10;
    shift();
  }  
}
window.addEventListener('deviceorientation', handleOrientation);

document.onclick = (event) => { 
  event.stopPropagation();
  if(stars.hyperSpeed === 0) {
    cannon.shoot(event.x, event.y);
  }
};

document.ondblclick = (event) => { 
  event.stopPropagation();
  setTimeout(() => { stars.hyperJump(); }, 300 ); 
};