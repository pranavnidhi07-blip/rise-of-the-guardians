class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.range = 100;
    this.damage = 10;
    this.fireRate = 1000;
    this.lastFireTime = 0;
  }

  attack(enemy) {
    if (this.isInRange(enemy)) {
      enemy.takeDamage(this.damage);
      this.lastFireTime = Date.now();
    }
  }

  isInRange(enemy) {
    const dist = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
    return dist <= this.range;
  }
}

class Enemy {
  constructor(x, y, health) {
    this.x = x;
    this.y = y;
    this.health = health;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) this.die();
  }

  die() {
    console.log('Enemy destroyed');
  }
}

let towers = [];
let enemies = [];

function gameLoop() {
  requestAnimationFrame(gameLoop);
  update();
  render();
}

function update() {
  for (const tower of towers) {
    for (const enemy of enemies) {
      if (Date.now() - tower.lastFireTime >= tower.fireRate) {
        tower.attack(enemy);
      }
    }
  }
}

function render() {
  console.clear(); // Clear the console for simplicity
  console.log('Towers:', towers);
  console.log('Enemies:', enemies);
}

function addTower(x, y) {
  towers.push(new Tower(x, y));
}

function addEnemy(x, y, health) {
  enemies.push(new Enemy(x, y, health));
}

// Example usage
addTower(100, 100);
addEnemy(150, 150, 50);

gameLoop();