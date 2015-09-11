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
        currentState  = 0,
        menu          = ['Play', 'Instructions', 'Story'],
        menuSelected  = 0,
        menuTimer     = 0,
        allowPress    = true,
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
        distance      = 0,
        score         = 0,
        enemyRate     = 1,
        enemyCount    = 0,
        animation     = 0,
        keysForUse    = [83, 87, 65, 68, 32, 37, 38, 39, 40],
        player        = {
            x: 0,
            y: 32,
            vx: 0,
            vy: 0,
            hp: 3,
            fr: 2,
            fd: {
                x: 0,
                y: 0
            },
            jumping: false,
            immunity: true,
            immunityCount: 0,
            render: function() {
                ctx.fillStyle = '#00C';
                ctx.fillRect(this.x, this.y, 16, 16);
            }
        };

    function init() {
        //Generating the world
        generateWorld();
        //Calling the main loop
        loop();
    }

    function loop() {
        switch(currentState) {
            case 0:
                //Menu State
                menuUpdateAndRender();
                break;
            case 1:
                //Game State
                processInput();
                update();
                render();
                break;
            case 2:
                //Instructions
                instructionsUpdateAndRender();
                break;
            case 3:
                //Story state
                storyUpdateAndRender();
                break;
            case 9:
                //Game Over State
                gameOverUpdateAndRender();
        }
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
                    if(bullets[j].alive && Math.abs(enemies[i].x + 8 - bullets[j].x) <= 16 && Math.abs(enemies[i].y + 4 - bullets[j].y) <= 16) {
                        enemies[i].alive = false;
                        bullets[j].alive = false;
                        score++;
                    }
                }

                //Firing
                ++enemies[i].fireCount;
                if(enemies[i].fireCount === 75) {
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
            if(enemyBullets[j].alive && Math.abs(player.x + 8 - enemyBullets[j].x) <= 8 && Math.abs(player.y + 8 - enemyBullets[j].y) <= 8 && !player.immunity) {
                player.immunity = true;
                player.hp--;
                enemyBullets[j].alive = false;
            }
        }

        //Check defeat condition
        if(player.hp === 0) {
            currentState = 9;
            allowPress = false;
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
            distance += player.x - 500;
            if(distance % 5000 <= 20) {
                enemyRate = 1 + Math.floor(distance/5000)/2;
            }

            player.x = 500;
            if(worldOffsetX >= 32) {
                worldOffsetX %= 32;
                world.shift();
                generatePlatform(world.length);
            }
        }

        //Fire update
        if(distance >= (player.fr - 1) * 10000 && score >= Math.floor(distance/1000)) {
            player.fr++;
        }
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
                    y: (308 - M) * Math.random() + M + 8,
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
        ctx.fillText('Distance:   ' + Math.floor(distance/10), 5, 300);
        ctx.fillText('Kills:      ' + score, 5, 286);
        if(player.immunity && animation % 10 !== 0) {
            ctx.fillText('IMMUNE', 700, 284);
        }
    }

    function menuUpdateAndRender() {
        var i = 0,
            l = menu.length;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '50px Courier New';
        ctx.fillText('Hsur', 20, 60);
        ctx.font = '25px Courier New';
        for(i = 0; i < l; i++) {
            if(menuSelected === i) {
                ctx.fillStyle = '#00C';
                ctx.fillRect(20, 114 + i*30, 16, 16);
                ctx.fillStyle = '#FF0';
            } else {
                ctx.fillStyle = '#FFF';
            }
            ctx.fillText(menu[i], 50, 130 + i*30);
        }
        ctx.fillStyle = '#FFF';
        ctx.font = '18px Courier New';
        ctx.fillText('Press "W/S" to change options', 450, 260);
        ctx.fillText('and press "space" to select it', 450, 280);

        if(keyPressed[83]) {
            if(menuTimer === 0) {
                menuSelected = (menuSelected + 1)%l;
            }
            if(++menuTimer === 30) {
                menuTimer = 0;
            }
        } else if(keyPressed[87]) {
            if(menuTimer === 0) {
                menuSelected--;
                if(menuSelected === -1) {
                    menuSelected = l-1;
                }
            }
            if(++menuTimer === 30) {
                menuTimer = 0;
            }
        } else {
            menuTimer = 0;
        }

        if(keyPressed[32]) {
            if(allowPress) {
                currentState = menuSelected + 1;
                allowPress = false;
            }
        } else {
            allowPress = true;
        }
    }

    function instructionsUpdateAndRender() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '50px Courier New';
        ctx.fillText('Instructions', 20, 60);
        ctx.font = '18px Courier New';
        ctx.fillText('Movement:', 50, 90);
        ctx.font = '15px Courier New';
        ctx.fillText('Use W and D for moving to left and right.', 70, 105);
        ctx.fillText('Use "space" for jumping.', 70, 120);
        ctx.fillText('Run to the right to increment your distance score.', 70, 135);
        ctx.font = '18px Courier New';
        ctx.fillText('Shooting:', 50, 160);
        ctx.font = '15px Courier New';
        ctx.fillText('Use "arrow keys" for shooting in that direction.', 70, 180);
        ctx.fillText('Hit the enemies with the bullets to increment your kill score.', 70, 195);
        ctx.fillText('Your fire ratio is the number of bullets per second and it', 70, 210);
        ctx.fillText('is incremented by 1 for every 10 kills and 1000 distance score.', 70, 225);
        ctx.font = '18px Courier New';
        ctx.fillText('Defeat:', 50, 250);
        ctx.font = '15px Courier New';
        ctx.fillText('Green bullets and enemies kill you.', 70, 270);
        ctx.fillText('You are immune when hit for a sort period.', 70, 285);
        ctx.fillText('Your final score is: Distance * (1 + Kills).', 70, 300);
        ctx.font = '18px Courier New';
        ctx.fillText('Press "space" to exit', 530, 280);

        if(keyPressed[32]) {
            if(allowPress) {
                currentState = 0;
                allowPress = false;
            }
        } else {
            allowPress = true;
        }
    }

    function storyUpdateAndRender() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '50px Courier New';
        ctx.fillText('Story', 20, 60);
        ctx.font = '18px Courier New';
        ctx.fillText('Press "space" to exit', 530, 280);

        if(keyPressed[32]) {
            if(allowPress) {
                currentState = 0;
                allowPress = false;
            }
        } else {
            allowPress = true;
        }
    }

    function gameOverUpdateAndRender() {
        var i = 0,
            l = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '50px Courier New';
        ctx.fillText('GAME OVER', 20, 60);
        ctx.font = '25px Courier New';
        ctx.fillText('Kills:       ' + score, 50, 130);
        ctx.fillText('Distance:    ' + Math.floor(distance/10), 50, 160);
        ctx.fillText('Final Score: ' + (1 + score) * Math.floor(distance/10), 50, 190);
        ctx.font = '18px Courier New';
        ctx.fillText('Press "space" to restart', 500, 280);

        if(keyPressed[32]) {
            if(allowPress) {
                currentState = 0;
                allowPress   = false;
                menuTimer     = 0;
                worldOffsetX  = 0;
                currentHeight = 0;
                fireCount     = 0;
                generateWorld();
                resetPool(bullets);
                resetPool(enemies);
                resetPool(enemyBullets);
                distance      = 0;
                score         = 0;
                enemyRate     = 1;
                enemyCount    = 0;
                player.x = 0;
                player.y = 32;
                player.hp = 3;
                player.fr = 2;
            }
        } else {
            allowPress = true;
        }
    }

    function resetPool(pool) {
        var i = 0,
            l = pool.length;
        for(; i < l; i++) {
            pool[i].alive = false;
        }
    }

    //Generate World
    function generateWorld() {
        var i;
        world[0] = 32;
        world[1] = 32;
        for(i = 2; i < 26; i++) {
            generatePlatform(i);
        }
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
