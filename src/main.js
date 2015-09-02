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
        currentHeight = 0,
        dist          = [0, 1],
        keysForUse    = [65, 68, 32, 37, 38, 39, 40],
        player        = {
            x: 0,
            y: 32,
            vx: 0,
            vy: 0,
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
        console.log(world);
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
        if(player.vx > 0) {
            if(player.y >= world[Math.floor((16+player.x+player.vx)/32)]) {
                player.x += player.vx;
            } else {
                player.x = 32 * Math.floor((16+player.x+player.vx)/32) - 17;
            }
        } else if(player.vx < 0) {
            if(player.y >= world[Math.floor((player.x+player.vx)/32)]) {
                player.x += player.vx;
            } else {
                player.x = 32*(Math.floor((player.x+player.vx)/32)+1);
            }
        }


        if(player.y + player.vy < Math.max(world[Math.floor(player.x/32)], world[Math.floor((16+player.x)/32)])) {
            player.y = Math.max(world[Math.floor(player.x/32)], world[Math.floor((16+player.x)/32)]);
            player.vy = 0;
            player.jumping = false;
        } else {
            player.y += player.vy;
            player.vy -= 1;
        }

    }
    function render() {
        var i = 0,
            l = world.length;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        for(i = 0; i < l; i++) {
            ctx.fillRect(32*i, 0, 32, world[i]);
        }
        player.render();
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
