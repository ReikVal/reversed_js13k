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
        //TODO: Make constant fps
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
            generated = false,
            vel       = 0;
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

        if(!fireAllowed) {
            fireCount = (fireCount + 1)%(60/player.fr);
            if(!fireCount) {
                fireAllowed = true;
            }
        }

        //Fire generation
        if(player.fd.x + player.fd.y !== 0 && fireAllowed) {
            fireAllowed = false;
            vel = Math.sqrt(player.fd.x*player.fd.x + player.fd.y*player.fd.y);
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

    }
    function render() {
        var i = 0,
            l = world.length;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        for(i = 0; i < l; i++) {
            ctx.fillRect(32*i-worldOffsetX, 0, 32, world[i]);
        }
        player.render();

        //Bullets rendering
        ctx.fillStyle = '#A00';
        for(i = 0, l = bullets.length; i < l; i++) {
            if(bullets[i].alive) {
                ctx.fillRect(bullets[i].x - 2, bullets[i].y - 1, 5, 5);
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
