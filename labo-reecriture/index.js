var backgroundImages; 
var monde; 
var balle;
var flash_power; 
var versdroite = true; 
var inCombo = false; 
var Breakout = new Phaser.Class({

    Extends: Phaser.Scene,
    
    initialize:
    
    function Breakout ()
    {
        Phaser.Scene.call(this, { key: 'breakout' });
    
        this.bricks;
        this.paddle;
        this.ball;
    },
    
    preload: function ()
    {
        this.load.atlas('assets', 'breakout/breakout.png', 'breakout/breakout.json', 'breakout/meadow.jpg');
        this.load.audio('beeh', 'breakout/beeh.mp3');
        this.load.audio('ost', 'breakout/field.mp3');
        this.load.audio('bounce', 'breakout/bounce.mp3');
        this.load.audio('combo', 'breakout/combo.mp3');
        this.load.audio('youdied', 'breakout/gameover.mp3');
        this.load.audio('lost', 'breakout/lost.wav');
        this.load.audio('vicutolii', 'breakout/victory.mp3');
        this.load.image('powerup', 'breakout/powerup.png');
        this.load.image('meadow', 'breakout/meadow.jpg')
    },
    
    create: function ()
    {
        backgroundImages = this.add.image(400, 300, 'meadow');
        backgroundImages.width = 800;
        monde = this.physics.world;
        balle = this.ball;
        scoreText = this.add.text(20, 20, 'Score : 0', { fontFamily: '"Roboto Condensed"' });
        comboText = this.add.text(20, 40, 'Combo x0', { fontFamily: '"Roboto Condensed"' });
        lifeText = this.add.text(750, 20, 'Life x5'+ballLeft, { fontFamily: '"Roboto Condensed"' });
    
        flash_power = this.add.image(400, 300, 'powerup');
        flash_power.alpha = 0;
    
        this.music = this.sound.add('ost',{loop: true})
        this.music.play()
    
        //  Enable world bounds, but disable the floor
        monde.setBoundsCollision(true, true, true, false);
    
        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.group({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 },
            timedEvent: this.time.addEvent({ delay: 500, callback: this.onEvent, callbackScope: this, loop: true })
        });
    
        this.bricks.children.each(e => {
            e.setImmovable();
            e.vers_droite = true;
        });
    
        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);
    
        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();
    
        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
    
        //  Input events
        this.input.on('pointermove', function (pointer) {
    
            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);
    
            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }
    
        }, this);
    
        this.input.on('pointerup', function (pointer) {
    
            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }
    
        }, this);
    },
    onEvent: function ()
    {
        //console.log("OUI")
        //this.bricks = this.physics.setVelocity(0,100);
        //this.bricks = this.physics.moveTo(112, 64);
    },
    
    hitBrick: function (ball, brick)
    {
        brick.disableBody(true, true);
        // son mouton capturé
        this.sound.play('beeh',{volume: 0.25});
    
        score+= 100+(100*multiplier);
        multiplier = freeBounce*0.05;
        freeBounce++;
        comboText.setText("Combo x"+freeBounce);
        console.log(score + " " + freeBounce + " " + multiplier);
        scoreText.setText("Score : "+score);
        if(freeBounce == 10 && inCombo == false)
        {
            inCombo = true
            this.sound.play('combo');
            this.combo();
        }
    
        if (this.bricks.countActive() === 0)
        {
            //insérer un écran de victoire
            //arrêter musique et jouer son victoire
            this.music.stop();
            this.sound.play('vicutolii');
            //score
            //si on appuie sur un bouton/touche -->
            this.scene.start('victoryscreen');
        }
    },
    
    combo: function ()
    {
        //superpower
        monde.setBoundsCollision(true);
        flash_power.alpha = 0.5;
        balle = this.ball.body.velocity;
        balle.x*=2;
        balle.y*=2;        
        setTimeout(function(){ 
            monde.setBoundsCollision(true, true, true, false);
            flash_power.alpha = 0;
            balle.x /= 2;
            balle.y /= 2;
            inCombo = false;
        }, 5000);
    },
    
    resetBall: function ()
    {   
        this.ball.setVelocity(0);
        freeBounce = 0;
        comboText.setText("Combo x"+freeBounce);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
        //son perte balle
        this.sound.play('lost');
    },
    
    resetLevel: function ()
    {
        this.resetBall();
        freeBounce = 0;
        score = 0;
        scoreText.setText("Score : "+score);
        ballLeft = 5;
        lifeText.setText("Life x"+ballLeft);
    
        this.bricks.children.each(function (brick) {
    
            brick.enableBody(false, 0, 0, true, true);
    
        });
    },
    
    hitPaddle: function (ball, paddle)
    {
        var diff = 0;
        freeBounce = 0;
        comboText.setText("Combo x"+freeBounce);
        // son rebond
        this.sound.play('bounce');
    
        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    },
    
    update: function ()
    {
        this.bricks.children.each(mouton => {
            if(mouton.x>config.width-16 && mouton.vers_droite){
                mouton.vers_droite = false;
                mouton.y += 16;
            }
            if(mouton.x<16 && !mouton.vers_droite){
                mouton.vers_droite = true;
                mouton.y += 16;
            }
            if(mouton.vers_droite){
                mouton.x +=1;
            }
            else{
                mouton.x -=1;
            }
    
        })
    
    
        if (this.ball.y > 600)
        {
            ballLeft--;
            lifeText.setText("Life x"+ballLeft);
            if(ballLeft <= 0){
                //arrêter musique et jouer son game over
                this.music.stop();
                this.sound.play('youdied');
                //insère un écran de game over
                //si on appuie sur une touche/bouton -->
                //this.resetLevel();
                ballLeft = 5;
                score = 0;
                multiplier = 0;
                this.scene.start('gameover');
            }
            this.resetBall();
        }
    }
    });
    
    var GameOver = new Phaser.Class({
    
    Extends: Phaser.Scene,
    
    initialize:
    
    function GameOver ()
    {
        Phaser.Scene.call(this, { key: 'gameover'});
        window.OVER = this;
    },
    
    create: function()
    {
        this.add.text(100, 200, 'GAME OVER', { fontSize: 100, fontFamily: '"Roboto Condensed"' });
        this.add.text(250, 300, 'click to restart the game', { fontSize: 30, fontFamily: '"Roboto Condensed"'})
        this.input.once('pointerup', function (event) {
            this.scene.start('breakout');
        },this);
    }
    });
    
    var VictoryScreen = new Phaser.Class({
    
    Extends: Phaser.Scene,
    
    initialize:
    
    function VictoryScreen ()
    {
        Phaser.Scene.call(this, { key: 'victoryscreen' });
        window.OVER = this;
    },
    
    create: function()
    {
        this.add.text(100, 200, 'YOU WON!!!', { fontSize: 100, fontFamily: '"Roboto Condensed"' });
        this.add.text(250, 300, 'click to restart the game', { fontSize: 30, fontFamily: '"Roboto Condensed"'});
        this.add.text(250, 350, 'you scored : '+score+' points', { fontSize: 30, fontFamily: '"Roboto Condensed"'});
        this.input.once('pointerup', function (event) {
            this.scene.start('breakout');
        },this);
    }
    });
    
    var config = { 
        type: Phaser.WEBGL, 
        width: 800, 
        height: 600, 
        parent: 'phaser-example', 
        scene: [ Breakout, GameOver, VictoryScreen ], 
        physics: { 
            default: 'arcade', 
            /*arcade : { 
                debug : true 
            } */
        }, 
    };
    
    var ballLeft = 5; 
    var score = 0; 
    var multiplier = 0; 
    var freeBounce = 0; 
    var scoreText; 
    var comboText; 
    var lifeText;
    
    var game = new Phaser.Game(config);