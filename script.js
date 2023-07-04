
const canvas = document.getElementById("field")
const context = canvas.getContext("2d")
const FPS = 60
var gameStarted = false
var gameOver = false
const enemiesMaxCount = 75 // 75
var enemiesStarting = 15 // 180
var frames = 0

function checkCollision(obj1, obj2) {
    let delta = {dx: 0, dy: 0}
    if (obj1.y>=obj2.y&&obj1.y<=obj2.y+obj2.sprites.size/2&&obj1.walking.y<=obj2.walking.y) {           // up side
        if ((obj1.x>=obj2.x&&obj1.x<=obj2.x+obj2.sprites.size/2)||
            (obj1.x+obj1.sprites.size/2>=obj2.x&&obj1.x+obj1.sprites.size/2<=obj2.x+obj2.sprites.size/2)) {
            if (Math.abs(obj1.y-obj2.y-obj2.sprites.size/2)<10) {
                if (Math.abs(delta.dx+delta.dy) < obj2.y + obj2.sprites.size/2 - obj1.y) {
                    delta.dy = (obj2.y + obj2.sprites.size/2 - obj1.y)
                }
            }
        }
    } if (obj1.y+obj1.sprites.size/2>=obj2.y&&obj1.y+obj1.sprites.size/2<=obj2.y+obj2.sprites.size/2&&
        obj1.walking.y>=obj2.walking.y) {    // down side
        if ((obj1.x>=obj2.x&&obj1.x<=obj2.x+obj2.sprites.size/2)||
            (obj1.x+obj1.sprites.size/2>=obj2.x&&obj1.x+obj1.sprites.size/2<=obj2.x+obj2.sprites.size/2)) {
            if (Math.abs(obj2.y-obj1.y-obj1.sprites.size/2)<10) {
                if (Math.abs(delta.dx+delta.dy) < obj1.y + obj1.sprites.size/2 - obj2.y) {
                    delta.dy = -(obj1.y + obj1.sprites.size/2 - obj2.y)
                }
            }
        }
    } if (obj1.x+obj1.sprites.size/2>=obj2.x&&obj1.x+obj1.sprites.size/2<=obj2.x+obj2.sprites.size/2&&
        obj1.walking.x>=obj2.walking.x) {    // right side
        if ((obj1.y>=obj2.y&&obj1.y<=obj2.y+obj2.sprites.size/2)||
            (obj1.y+obj1.sprites.size/2>=obj2.y&&obj1.y+obj1.sprites.size/2<=obj2.y+obj2.sprites.size/2)) {
            if (Math.abs(obj2.x-obj1.x-obj1.sprites.size/2)<10) {
                if (Math.abs(delta.dx+delta.dy) < obj1.x + obj1.sprites.size/2 - obj2.x) {
                    delta.dx = -(obj1.x + obj1.sprites.size/2 - obj2.x)
                }
            }
        }
    } if (obj1.x<=obj2.x+obj2.sprites.size/2&&obj1.x>=obj2.x&&obj1.walking.x<=obj2.walking.x) {    // left side
        if ((obj1.y>=obj2.y&&obj1.y<=obj2.y+obj2.sprites.size/2)||
            (obj1.y+obj1.sprites.size/2>=obj2.y&&obj1.y+obj1.sprites.size/2<=obj2.y+obj2.sprites.size/2)) {
            if (Math.abs(obj1.x-obj2.x-obj2.sprites.size/2)<10) {
                if (Math.abs(delta.dx+delta.dy) < obj2.x + obj2.sprites.size/2 - obj1.x) {
                    delta.dx = (obj2.x + obj2.sprites.size/2 - obj1.x)
                }
            }
        }
    }
    return delta
}

function createAngle(point1, point2) {
    return Math.acos((point1[0]-point2[0])/Math.sqrt((point1[0]-point2[0])**2+(point1[1]-point2[1])**2))
}

const WIDTH = canvas.width,
    HEIGHT = canvas.height,
    Player_sprites = {
        size:34,
        count:3,
        row:2,
        src:"sprites/girl1.png",
        img: new Image()
    },
    Enemy_sprites = {
        size:34,
        count:3,
        row:2,
        src:"sprites/enemy1.png",
        img: new Image(src="sprites/enemy1.png")
    },
    Coin_sprites = {
        size:22,
        count:3,
        row:2,
        src:"sprites/coin.png",
        img: new Image(src="sprites/coin.png")
    },
    Weapon_sprites = {
        size:52,
        sizeY:18,
        center_params: [22, 8],
        count:1,
        row:1,
        src:"sprites/m16.png",
        img: new Image(src="sprites/m16.png")
    },
    Bullet_sprites = {
        size:2,
        src:"sprites/m16_bullet.png",
        img: new Image(src="sprites/m16_bullet.png")
    }

Player_sprites.img.src = Player_sprites.src
Enemy_sprites.img.src = Enemy_sprites.src
Coin_sprites.img.src = Coin_sprites.src
Weapon_sprites.img.src = Weapon_sprites.src
Bullet_sprites.img.src = Bullet_sprites.src

function NewCursor() {
    let _offset = {x: 0, y: 0}
    return class Cursor {
        constructor() {}
        get offset() {
            return _offset
        }
        set offset(e) {
            _offset = {
                x: e.offsetX,
                y: e.offsetY
            }
        }
    }
}

const cursor = new (NewCursor())()

class ObjectTime {
    constructor() {
        this.startedTime = performance.now()
    }
}

class Player {
    constructor(master_root, x, y, speed, max_health, dmg, sprites, center) {
        this.master_root = master_root
        this.x = x
        this.y = y
        this.dmg = dmg
        this.health = {cur: max_health, max: max_health}
        this.speed = speed
        this.sprites = sprites
        this.anim = 0
        this.walking = {x: 0, y: 0}
        this.weapon = null
        this.center = center
        this.on_right = true
        this.aim = .8
        
        this.coins = 0

        this.player = sprites.img
    }

    walk() {
        if (this.walking.y > 0) {
            this.y = Math.max(this.y - this.speed, 0)
        } else if (this.walking.y < 0) {
            this.y = Math.min(this.y + this.speed, HEIGHT-this.sprites.size)
        }

        if (this.walking.x > 0) {
            this.x = Math.min(this.x + this.speed, WIDTH-this.sprites.size)
        } else if (this.walking.x < 0) {
            this.x = Math.max(this.x - this.speed, 0)
        }

        if (!this.weapon) {
            if (this.walking.x > 0) {
                this.on_right = true
            } else if (this.walking.x < 0) {
                this.on_right = false
            }
        } else {
            let angle = createAngle([cursor.offset.x, cursor.offset.y], [player.x+Player_sprites.size/2, player.y+player.center])
            let x = cursor.offset.x, y = cursor.offset.y
            this.weapon.angle = y>(this.y+this.center)?angle:-angle
            if (x<this.x+this.sprites.size/2) {
                player.on_right = false
                this.weapon.angle += Math.PI
            } else {
                this.on_right = true
            }
        }
    }

    coins_pick(coins) {
        coins.forEach((c, i) => {
            if (Math.sqrt((c.x-this.x)**2 + (c.y-this.y)**2) < Coin_sprites.size) {
                this.coins++
                coins.splice(i, 1)
            }
        })
    }

    render() {
        this.master_root.drawImage(
            this.player, this.sprites.size*Math.floor((this.anim+this.sprites.count*(this.on_right))%this.sprites.row),
            this.sprites.size*Math.floor((this.anim+this.sprites.count*(this.on_right))/this.sprites.row),
            this.sprites.size, this.sprites.size,
            this.x, this.y, this.sprites.size, this.sprites.size
        )
        if (this.weapon) {
            this.weapon.render()
        }
    }
}

class Enemy {
    constructor(master_root, x, y, speed, max_health, dmg, sprites) {
        this.master_root = master_root
        this.x = x
        this.y = y
        this.dmg = dmg
        this.health = {cur: max_health, max: max_health}
        this.speed = speed + Math.floor(Math.random()*10-4)/100
        this.sprites = sprites
        this.anim = 0
        this.walking = {x: 0, y: 0}
        this.weapon = null

        this.enemy = new Image(sprites.size, sprites.size)
        this.enemy.src = sprites.src
    }

    walk(dir) {
        let absVal = Math.sqrt(dir[0]**2 + dir[1]**2)
        this.walking.x = this.speed * dir[0] / absVal
        this.walking.y = this.speed * dir[1] / absVal
        this.x += this.walking.x
        this.y += this.walking.y
    }

    attack(player) {
        if (Math.sqrt((this.x-player.x)**2+(this.y-player.y)**2) > this.sprites.size / 2) {
            let dir = [player.x - this.x, player.y - this.y]
            this.walk(dir)
        } else {this.walking.x = this.walking.y = 0}
        if (this.dmg) {
            if (Math.sqrt((player.x-this.x)**2+(player.y-this.y)**2) < this.sprites.size / 2) {
                player.health.cur = Math.max(0, player.health.cur-this.dmg)
                if (player.health.cur == 0) {
                    gameStarted = false
                    gameOver = true
                }
                this.cooldown()
            }
        }
    }

    cooldown() {
        let dmg = this.dmg
        this.dmg = 0
        setTimeout(() => {this.dmg = dmg}, 1000)
    }

    die(coins) {
        coins.push(new Coin(this.master_root, Math.floor(this.x+(this.sprites.size-Coin_sprites.size)/2),
            Math.floor(this.y+this.sprites.size-Coin_sprites.size), Coin_sprites))
    }

    render() {
        this.master_root.drawImage(
            this.enemy, this.sprites.size*Math.floor((this.anim+this.sprites.count*(this.walking.x>=0))%this.sprites.row),
            this.sprites.size*Math.floor((this.anim+this.sprites.count*(this.walking.x>=0))/this.sprites.row),
            this.sprites.size, this.sprites.size,
            Math.floor(this.x), Math.floor(this.y), this.sprites.size, this.sprites.size
        )
        if (this.health.cur!=this.health.max) {
            this.master_root.fillStyle = "black"
            this.master_root.fillRect(this.x+this.sprites.size/4-1, this.y-4,
                this.sprites.size-this.sprites.size/2+2, 5)
            this.master_root.fillStyle = "#FF5B5B"
            this.master_root.fillRect(this.x+this.sprites.size/4, this.y-3,
                this.sprites.size-this.sprites.size/2, 3)
            this.master_root.fillStyle = "#1AB911"
            this.master_root.fillRect(this.x+this.sprites.size/4, this.y-3,
                this.sprites.size * 1/2 * this.health.cur / this.health.max, 3)
        }
    }
}

class Bullet {
    constructor(master_root, x, y, speed, dmg, sprites, angle, on_right, player) {
        this.master_root = master_root
        this.x = x
        this.y = y
        this.angle = angle
        this.on_right = on_right
        this.speed = speed
        this.dmg = dmg
        this.sprites = sprites
        this.ignore = []
        this.player = player

        this.bullet = sprites.img
    }

    move() {
        if (this.angle == Math.PI/2 || this.angle == -Math.PI/2) {
            this.y += this.speed * ((this.angle==Math.PI/2)*2-1)
        } else {
            this.x += this.speed * Math.cos(this.angle) * ((this.on_right)*2-1)
            this.y += this.speed * Math.sin(this.angle) * ((this.on_right)*2-1)
        }
    }

    attack(targets) {
        let ans = false
        targets.forEach((elem, i) => {
            if (this.x>elem.x && this.y>elem.y && this.x<elem.x+elem.sprites.size && this.y<elem.y+elem.sprites.size) {
                if (this.ignore.includes(elem)) {}
                else if (Math.random()>this.player.aim) {
                    this.ignore.push(elem)
                } else {
                    ans = [elem, i]
                    return 1
                }
            }
        })
        return ans
    }

    render() {
        this.master_root.drawImage(
            this.bullet, 0, 0, this.sprites.size, this.sprites.size,
            Math.floor(this.x-this.sprites.size/2), Math.floor(this.y-this.sprites.size/2), this.sprites.size, this.sprites.size
        )
    }
}

class Weapon extends ObjectTime {
    constructor(master_root, x, y, center_params, sprites, angle, owner, shakeMod, scale=.8) {
        super()
        this.master_root = master_root
        this.x = x
        this.y = y
        this.center_params = center_params
        this.sprites = sprites
        this.active = true
        this.angle = angle || 0
        this.owner = owner || 0
        this.bullets = []
        this.scale = scale
        this.onAttack = false

        this.weapon = sprites.img
        this.shakeMod = this.shakeMod.bind(shakeMod)
    }

    shakeMod() {}

    attack() {
        if (this.active) {
            this.active = false
            this.bullets.push(new Bullet(this.master_root, this.owner.x+this.owner.sprites.size/2,
                this.owner.y+this.owner.center, 10, this.owner.dmg, Bullet_sprites, this.angle, this.owner.on_right, this.owner))
            setTimeout(() => {this.active = true}, 30)
        }
    }

    render() {
        if (!this.owner) {
            context.translate(this.x+this.sprites.size/2, this.y+this.sprites.sizeY/2+10)
            context.rotate(this.angle)
            this.master_root.drawImage(
                this.weapon, 0, this.sprites.sizeY,
                this.sprites.size, this.sprites.sizeY,
                -this.sprites.size/2, Math.floor(-this.sprites.sizeY/2+5*Math.sin((this.startedTime-performance.now())/500)),
                    this.sprites.size, this.sprites.sizeY
            )
            context.rotate(-this.angle)
            context.translate(-this.x-this.sprites.size/2, -this.y-this.sprites.sizeY/2-10)
        } else {
            this.bullets.forEach((elem) => {
                elem.render()
            })
            if (!this.owner.on_right) {
                context.translate(this.owner.x+this.owner.sprites.size/2,
                    this.owner.y+this.owner.center)
                context.rotate(this.angle)
                context.scale(-1, 1)
                this.master_root.drawImage(
                    this.weapon, 0, 0,
                    this.sprites.size, this.sprites.sizeY,
                    -this.center_params[0]*this.scale, -this.center_params[1]*this.scale,
                    this.sprites.size*this.scale, this.sprites.sizeY*this.scale
                )
                this.master_root.fillStyle = "red"
                this.master_root.fillRect(0, 0, 1, 1)
                context.scale(-1, 1)
                context.rotate(-this.angle)
                context.translate(-this.owner.x-this.owner.sprites.size/2,
                    -this.owner.y-this.owner.center)
            } else {
                context.translate(this.owner.x+this.owner.sprites.size/2,
                    this.owner.y+this.owner.center)
                context.rotate(this.angle)
                this.master_root.drawImage(
                    this.weapon, 0, 0,
                    this.sprites.size, this.sprites.sizeY,
                    -this.center_params[0]*this.scale, -this.center_params[1]*this.scale,
                    this.sprites.size*this.scale, this.sprites.sizeY*this.scale
                )
                this.master_root.fillStyle = "red"
                this.master_root.fillRect(-1, -1, 1, 1)
                context.rotate(-this.angle)
                context.translate(-this.owner.x-this.owner.sprites.size/2,
                    -this.owner.y-this.owner.center)
            }
        }
    }
}

class Coin extends ObjectTime {
    constructor(master_root, x, y, sprites) {
        super()
        this.master_root = master_root
        this.x = x
        this.y = y
        this.sprites = sprites
        this.anim = 0

        this.coin = sprites.img
    }

    render() {
        this.master_root.drawImage(
            this.coin, this.sprites.size*Math.floor(this.anim%this.sprites.row),
            this.sprites.size*Math.floor(this.anim/this.sprites.row),
            this.sprites.size, this.sprites.size, this.x,
                Math.floor(this.y+5*Math.sin((this.startedTime-performance.now())/500)), this.sprites.size, this.sprites.size
        )
    }
}

const shadow = new Image(34, 36)
shadow.src = "sprites/shadow.png"
const background = new Image(WIDTH, HEIGHT)
background.src = "sprites/background.png"

var player = new Player(context, WIDTH/2, HEIGHT/2, 2, 100, 10, Player_sprites, 21)
var coins = []
var enemies = []
var weapons = [new Weapon(context, WIDTH/2, HEIGHT/3, Weapon_sprites.center_params, Weapon_sprites, () => {})]
var startTime = performance.now()

window.addEventListener("keydown", (e) => {
    if (e.key == "w") {
        player.walking.y = 1
    } else if (e.key == "s") {
        player.walking.y = -1
    }
    if (e.key == "d") {
        player.walking.x = 1
    } else if (e.key == "a") {
        player.walking.x = -1
    }
    if (e.key == " ") {
        player.onAttack = true
    }
})

window.addEventListener("keyup", (e) => {
    if ("ws".includes(e.key)) {
        if (e.key == "w" && player.walking.y == 1) {
            player.walking.y = 0
        } else if (e.key == "s" && player.walking.y == -1) {
            player.walking.y = 0
        }
    }
    if ("ad".includes(e.key)) {
        if (e.key == "a" && player.walking.x == -1) {
            player.walking.x = 0
        } else if (e.key == "d" && player.walking.x == 1) {
            player.walking.x = 0
        }
    }
    if (e.key == " ") {
        player.onAttack = false
    }
})

canvas.addEventListener("mousemove", (e) => {
    cursor.offset = e
    if (player.weapon) {
        let angle = createAngle([e.offsetX, e.offsetY], [player.x+Player_sprites.size/2, player.y+player.center])
        player.weapon.angle = e.offsetY>(player.y+player.center)?angle:-angle
        if (e.offsetX<player.x+Player_sprites.size/2) {
            player.on_right = false
            player.weapon.angle += Math.PI
        } else {
            player.on_right = true
        }
    }
})

canvas.addEventListener("mousedown", (e) => {
    player.onAttack = true
})

canvas.addEventListener("mouseup", (e) => {
    player.onAttack = false
})

function render() {
    if (performance.now() - startTime > 1000 / FPS) {
        context.drawImage(background, 0, 0, WIDTH, HEIGHT)
        let translation = 0
        if (player.onAttack) {
            translation = Math.sin(performance.now())
        }
        context.translate(0, translation)
        if (player.weapon) {
            player.weapon.bullets.forEach(elem => {
                elem.render()
            })
        }
        let renderList = [...coins, ...enemies, ...weapons, player].sort((a, b) => {
            return a.y - b.y
        })
        context.globalAlpha = 0.2
        renderList.forEach((elem) => {
            context.drawImage(shadow, elem.x+(elem.sprites.size-34)/2, elem.y, 34, 36)
        })
        context.globalAlpha = 1
        renderList.forEach((elem) => {
            elem.render()
        })

        context.font = "20px monospace"; context.fillStyle = "white"
        context.drawImage(
            Coin_sprites.img, 0, 0, Coin_sprites.size, Coin_sprites.size, 5, 5, Coin_sprites.size, Coin_sprites.size
        )
        context.fillText(player.coins, Coin_sprites.size+10, Coin_sprites.size)
        context.fillText("HP", WIDTH-35-100, Coin_sprites.size)
        context.fillStyle = "#FF5B5B"
        context.fillRect(WIDTH-5-100, 5, 100, Coin_sprites.size)
        context.fillStyle = "#1AB911"
        context.fillRect(WIDTH-5-100, 5, Math.max(0, Math.floor(player.health.cur/player.health.max*100)), Coin_sprites.size)
        frames++

        startTime = performance.now()

        context.translate(0, -translation)
        translation = 0
    }
}

function update() {
    if (Math.abs(player.walking.x)||Math.abs(player.walking.y)) {
        player.anim = Math.max(1, player.anim+.08)
    } else {player.anim=0}
    player.coins_pick(coins)
    coins.forEach((c) => {
        c.anim = c.anim+.08>=Coin_sprites.count ? 0 : c.anim+.08
    })
    player.anim = player.anim>=Player_sprites.count ? 1 : player.anim
    player.health.cur = Math.min(player.health.max, player.health.cur+.03)
    player.walk()
    if (player.weapon) {
        if (player.onAttack) {
            player.weapon.attack()
        }
        player.weapon.bullets = player.weapon.bullets.filter((elem) => {
            elem.move()
            if (elem.x < 0 || elem.x > WIDTH ||
                elem.y < 0 || elem.y > HEIGHT) {
                    return false
                }
            let hit = elem.attack(enemies)
            if (hit != false) {
                hit[0].health.cur = Math.max(0, hit[0].health.cur-elem.dmg)
                if (hit[0].health.cur == 0) {
                    hit[0].die(coins)
                    enemies.splice(hit[1], 1)
                }
                return false
            }
            return true
        })
    }
    weapons.forEach((elem) => {
        if (Math.sqrt((elem.x-player.x)**2 + (elem.y-player.y)**2) < player.sprites.size/2) {
            console.log("Weapon picked")
            gameStarted = true
            elem.owner = player
            player.weapon = elem
            weapons.splice(0, 1)
        }
    })
    if (gameStarted) {
        enemiesProceed()
    }
    if (player.coins == 10) {
        enemiesStarting = 120
    } else if (player.coins == 30) {
        enemiesStarting = 100
    } else if (player.coins == 80) {
        enemiesStarting = 80
    } else if (player.coins == 150) {
        enemiesStarting = 40
    } else if (player.coins == 300) {
        enemiesStarting = 20
    }
}

function enemiesProceed() {
    if (frames > enemiesStarting) {
        if (enemies.length < enemiesMaxCount) {
            let side = Math.floor(Math.random()*4)
            if (side == 0) {
                enemies.push(new Enemy(context, Math.floor(Math.random()*(2*Enemy_sprites.size+WIDTH)-Enemy_sprites.size),
                    -Enemy_sprites.size, 1.5, 100, 10, Enemy_sprites))
            } else if (side == 1) {
                enemies.push(new Enemy(context, WIDTH,
                    Math.floor(Math.random()*(2*Enemy_sprites.size+HEIGHT)-Enemy_sprites.size), 1.5, 100, 10, Enemy_sprites))
            } else if (side == 2) {
                enemies.push(new Enemy(context, Math.floor(Math.random()*(2*Enemy_sprites.size+WIDTH)-Enemy_sprites.size),
                    HEIGHT, 1.5, 100, 10, Enemy_sprites))
            } else if (side == 3) {
                enemies.push(new Enemy(context, -Enemy_sprites.size,
                    Math.floor(Math.random()*(2*Enemy_sprites.size+HEIGHT)-Enemy_sprites.size), 1.5, 100, 10, Enemy_sprites))
            }
        }

        frames = 0
    }

    enemies.forEach((e) => {
        e.attack(player)
        if (Math.abs(e.walking.x)||Math.abs(e.walking.y)) {
            e.anim = Math.max(1, e.anim+.08)
        } else {e.anim=0}
        e.anim = e.anim>=Enemy_sprites.count ? 1 : e.anim
    })
    for (let i = 0; i < enemies.length-1; i++) {
        for (let j = i+1; j < enemies.length; j++) {
            let delta = checkCollision(enemies[i], enemies[j])
            enemies[i].x += delta.dx/2
            enemies[i].y += delta.dy/2
            enemies[j].x += -delta.dx/2
            enemies[j].y += -delta.dy/2
        }
    }
}

var frame = () => {
    update()
    render()
    requestAnimationFrame(frame)
}

window.onload = () => {
    frame()
}
