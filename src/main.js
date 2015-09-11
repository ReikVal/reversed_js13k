window.rAF = (function() {
    return window.requestAnimationFrame       ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           function(cb) {
               window.setTimeout(cb, 1000/60);
           };
})();

(function() {
    'use strict';

    var canvas        = document.getElementById('game'),
        ctx           = canvas.getContext('2d'),
        keyPressed    = {},
        world         = [],
        worldOffsetX  = 0,
        currentHeight = 0,
        fireCount     = 0,
        dist          = [0, 1],
        fireAllowed   = true,
        bullets       = [],
        enemies       = [],
        enemyBullets  = [],
        enemyRate     = 1,
        enemyCount    = 0,
        animation     = 0,
        keysForUse    = [65, 68, 32, 37, 38, 39, 40],
        player        = {
            x: 0,
            y: 32,
            vx: 0,
            vy: 0,
            hp: 3,
            fr: 3,
            fd: {
                x: 0,
                y: 0
            },
            jumping: false,
            immunity: false,
            immunityCount: 0,
            render: function() {
                ctx.fillStyle = '#00C';
                ctx.fillRect(this.x, this.y, 16, 16);
            }
        };

    function init() {
        var i;
        //Generating the world
        world[0] = 32;
        world[1] = 32;
        for(i = 2; i < 26; i++) {
            generatePlatform(i);
        }
        ctx.font = '18px Courier New';
        //Calling the main loop
        loop();
    }

    function loop() {
        processInput();
        update();
        render();
        window.rAF(loop);
    }

    function processInput() {
        player.vx = 0;

        if(keyPressed[65]) {
            player.vx -= 5;
        }
        if(keyPressed[68]) {
            player.vx += 5;
        }

        if(keyPressed[32] && !player.jumping) {
            player.jumping = true;
            player.vy = 12;
        }

        //Firing
        player.fd.x = 0;
        player.fd.y = 0;

        if(keyPressed[37]) {
            player.fd.x -= 1;
        }
        if(keyPressed[38]) {
            player.fd.y -= 1;
        }
        if(keyPressed[39]) {
            player.fd.x += 1;
        }
        if(keyPressed[40]) {
            player.fd.y += 1;
        }
    }

    function update() {
        var i         = 0,
            l         = 0,
            j         = 0,
            m         = 0,
            M         = 0,
            dx        = 0,
            dy        = 0,
            generated = false,
            vel       = 0;

        //Check collisions
        if(player.immunity) {
            ++player.immunityCount;
            if(player.immunityCount == 120) {
                player.immunityCount = 0;
                player.immunity = false;
            }
        }

        for(i = 0, l = enemies.length; i < l; i++) {
            if(enemies[i].alive){
                //Checking player
                if(Math.abs(enemies[i].x - player.x) <= 16 && Math.abs(enemies[i].y - player.y) <= 16 && !player.immunity) {
                    player.immunity = true;
                    player.hp--;
                    enemies[i].alive = false;
                }
                //Checking bullets
                for(j = 0, m = bullets.length; j < m; j++) {
                    if(Math.abs(enemies[i].x + 8 - bullets[j].x) <= 16 && Math.abs(enemies[i].y + 4 - bullets[j].y) <= 16) {
                        enemies[i].alive = false;
                        bullets[j].alive = false;
                    }
                }

                //Firing
                ++enemies[i].fireCount;
                if(enemies[i].fireCount === 90) {
                    enemies[i].fireCount = 0;
                    for(j = 0, m = enemyBullets.length, generated = false; j < m && !generated; j++) {
                        if(!enemyBullets[j].alive) {
                            enemyBullets[j].x = enemies[i].x;
                            enemyBullets[j].y = enemies[i].y;
                            enemyBullets[j].fd.x = player.x - enemies[i].x;
                            enemyBullets[j].fd.y = player.y - enemies[i].y;
                            enemyBullets[j].fv = 1/Math.sqrt(enemyBullets[j].fd.x*enemyBullets[j].fd.x + enemyBullets[j].fd.y*enemyBullets[j].fd.y);
                            enemyBullets[j].alive = true;
                            generated = true;
                        }
                    }
                    if(!generated) {
                        dx = player.x - enemies[i].x;
                        dy = player.y - enemies[i].y;
                        enemyBullets.push({
                            x: enemies[i].x,
                            y: enemies[i].y,
                            fd: {
                                x: dx,
                                y: dy
                            },
                            fv: 1/Math.sqrt(dx*dx + dy*dy),
                            alive: true
                        });
                    }
                }
            }
        }

        //Enemy bullets collisions
        for(j = 0, m = enemyBullets.length; j < m; j++) {
            if(Math.abs(player.x + 8 - enemyBullets[j].x) <= 8 && Math.abs(player.y + 8 - enemyBullets[j].y) <= 8 && !player.imaamunity) {
                player.immunity = true;
                player.hp--;
                enemyBullets[j].alive = false;
            }
        }

        //Player update
        if(player.vx > 0) {
            if(player.y >= world[Math.floor((16+player.x+player.vx+worldOffsetX)/32)]) {
                player.x += player.vx;
            } else {
                player.x = 32 * Math.floor((16+player.x+player.vx+worldOffsetX)/32) - worldOffsetX - 17;
            }
        } else if(player.vx < 0) {
            if(player.x + player.vx < 0) {
                player.x = 0;
            } else if(player.y >= world[Math.floor((player.x+player.vx+worldOffsetX)/32)]) {
                player.x += player.vx;
            } else {
                player.x = 32*Math.floor((player.x+player.vx+worldOffsetX)/32+1)-worldOffsetX;
            }
        }

        if(player.y + player.vy < Math.max(world[Math.floor((player.x+worldOffsetX)/32)], world[Math.floor((16+player.x+worldOffsetX)/32)])) {
            player.y = Math.max(world[Math.floor((player.x+worldOffsetX)/32)], world[Math.floor((16+player.x+worldOffsetX)/32)]);
            player.vy = 0;
            player.jumping = false;
        } else {
            player.y += player.vy;
            player.vy -= 1;
        }

        //Generating map and scrolling.
        if(player.x > 500) {
            worldOffsetX += player.x - 500;
            player.x = 500;
            if(worldOffsetX >= 32) {
                worldOffsetX %= 32;
                world.shift();
                generatePlatform(world.length);
            }
        }

        //Fire update
        for(i = 0, l = bullets.length; i < l; i++) {
            if(bullets[i].alive) {
                bullets[i].x += bullets[i].vx;
                bullets[i].y += bullets[i].vy;
                bullets[i].alive = bullets[i].x >= 0 && bullets[i].x <= canvas.width && bullets[i].y >= 0 && bullets[i].y <= canvas.height;
            }
        }

        for(i = 0, l = enemyBullets.length; i < l; i++) {
            if(enemyBullets[i].alive) {
                enemyBullets[i].x += 5*enemyBullets[i].fd.x*enemyBullets[i].fv;
                enemyBullets[i].y += 5*enemyBullets[i].fd.y*enemyBullets[i].fv;
                enemyBullets[i].alive = enemyBullets[i].x >= 0 && enemyBullets[i].x <= canvas.width && enemyBullets[i].y >= 0 && enemyBullets[i].y <= canvas.height;
            }
        }

        if(!fireAllowed) {
            fireCount = (fireCount + 1)%(60/player.fr);
            if(!fireCount) {
                fireAllowed = true;
            }
        }

        //Fire generation
        if(fireAllowed && (player.fd.x !== 0 || player.fd.y !== 0)) {
            fireAllowed = false;
            vel = 1/Math.sqrt(player.fd.x*player.fd.x + player.fd.y*player.fd.y);
            for(i = 0, l = bullets.length; i < l && !generated; i++) {
                if(!bullets[i].alive) {
                    generated = true;
                    bullets[i].x = player.x + 8;
                    bullets[i].y = player.y + 8;
                    bullets[i].vx = 5 * player.fd.x * vel;
                    bullets[i].vy = 5 * player.fd.y * vel;
                    bullets[i].alive = true;
                }
            }
            if(!generated) {
                bullets.push({
                    x: player.x + 8,
                    y: player.y + 8,
                    vx: 5 * player.fd.x * vel,
                    vy: 5 * player.fd.y * vel,
                    alive: true
                });
            }
        }

        //Generating enemies
        enemyCount++;
        if(enemyCount%Math.floor(300/enemyRate) === 0) {
            enemyCount = 0;
            M = Math.max.apply(null, world);
            for(i = 0, l = enemies.length, generated = false; i < l && !generated; i++) {
                if(!enemies[i].alive) {
                    enemies[i].x = 800;
                    enemies[i].y = (308 - M) * Math.random() + M + 8;
                    enemies[i].v = 1 + Math.random() * 5;
                    enemies[i].alive = true;
                    enemies[i].fireCount = 0;
                    generated = true;
                }
            }
            if(!generated) {
                enemies.push({
                    x: 800,
                    y: (320 - M) * Math.random() + M + 8,
                    v: 1 + Math.random() * 5,
                    alive: true,
                    fireCount: 0
                });
            }
        }

        //Enemies update
        for(i = 0, l = enemies.length; i < l; i++) {
            if(enemies[i].alive) {
                enemies[i].x -= enemies[i].v;
                //Check if he is dead
                if(enemies[i].x < - 16) {
                    enemies[i].alive = false;
                }
            }
        }

    }
    function render() {
        var i = 0,
            l = bullets.length;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //Bullets rendering
        ctx.fillStyle = '#FF0';
        for(i = 0; i < l; i++) {
            if(bullets[i].alive) {
                ctx.fillRect(bullets[i].x - 2, bullets[i].y - 2, 5, 5);
            }
        }
        //Bullets rendering
        ctx.fillStyle = '#0F0';
        for(i = 0, l = enemyBullets.length; i < l; i++) {
            if(enemyBullets[i].alive) {
                ctx.fillRect(enemyBullets[i].x - 2, enemyBullets[i].y - 2, 5, 5);
            }
        }

        //World rendering
        ctx.fillStyle = '#FFF';
        for(i = 0, l = world.length; i < l; i++) {
            ctx.fillRect(32*i-worldOffsetX, 0, 32, world[i]);
        }

        //Player and enemy rendering
        player.render();
        if(++animation === 10) {
            animation = 0;
        }
        for(i = 0, l = enemies.length; i < l; i++) {
            if(enemies[i].alive) {
                ctx.fillStyle = '#F33';
                ctx.beginPath();
                ctx.moveTo(enemies[i].x, enemies[i].y);
                ctx.lineTo(enemies[i].x + 16, enemies[i].y + 8);
                ctx.lineTo(enemies[i].x + 16, enemies[i].y - 8);
                ctx.fill();
                ctx.fillStyle = '#FF0';
                ctx.fillRect(enemies[i].x+16, enemies[i].y-8, Math.abs(10-animation)%5, 4);
                ctx.fillRect(enemies[i].x+16, enemies[i].y+4, Math.abs(10-animation)%5, 4);
            }
        }

        //UI rendering
        ctx.fillStyle = '#FFF';
        ctx.fillText('HP:', 700, 314);
        for(i = 0; i < player.hp; i++) {
            ctx.fillRect(740+20*i, 300, 16, 16);
        }
        ctx.fillText('Fire ratio: ' + player.fr, 5, 314);
    }

    //For generating the map
    function generatePlatform(i) {
        var r = Math.random();

        if(world[i-1] === world[i-2]) {
            dist[0] = 0.45;
            dist[1] = 0.55;
            currentHeight = world[i-1];
        } else if(world[i-1] > world[i-2]) {
            dist[0] = 0.4;
            dist[1] = 0.6;
            currentHeight = world[i-2];
        } else {
            dist[0] = 0.3;
            dist[1] = 0.5;
            currentHeight = world[i-1];
        }

        if(r <= dist[0]) {
            world.push(currentHeight-(currentHeight > 0?32:0));
        } else if(r <= dist[1]) {
            world.push(currentHeight);
        } else {
            world.push(currentHeight+(currentHeight <= 256?32:0));
        }
    }

    //Adding the input listeners
    document.addEventListener('keydown', function(e) {
        keyPressed[e.which] = true;
        if(keysForUse.indexOf(e.which) !== -1) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', function(e) {
        keyPressed[e.which] = false;
        if(keysForUse.indexOf(e.which) !== -1) {
            e.preventDefault();
        }
    });

    //Starting the game
    init();
}());
