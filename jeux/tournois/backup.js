class Level1 extends Phaser.Scene {
    constructor () {
        super ({
            key: "Level1"
        });
    }

    preload () {
        this.load.image('sky', '../phaser/assets/sky.png');
        this.load.image('ground', '../phaser/assets/platform.png');
        this.load.image('star', '../phaser/assets/star.png');
        this.load.image('bomb', '../phaser/assets/bomb.png');
        this.load.spritesheet('leo', '../phaser/assets/sprites/leo_phaser.png', { frameWidth: 32, frameHeight: 44 });
        this.load.image("tileset", "../phaser/assets/tilesets/classic.png");
        this.load.tilemapTiledJSON("Level1", "../phaser/assets/maps/Level1.json");
    }

    create () {

        const map = this.add.tilemap("Level1");
        map.addTilesetImage("world", "tileset");
        this.input.keyboard.on("keyup", e=>{
            if (e.key === "A") {
                this.scene.start("Level2")
            }
        });
        //  A simple background for our game
        this.add.image(400, 300, 'sky');

        //  The platforms group contains the ground and the 2 ledges we can jump on
        platforms = this.physics.add.staticGroup();

        //  Here we create the ground.
        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        //  Now let's create some ledges
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');

        // The player and its settings
        player = this.physics.add.sprite(100, 450, 'leo');

        //  Player physics properties. Give the little guy a slight bounce.
        player.setBounce(0.1);
        player.setCollideWorldBounds(true);

        //  Our player animations, turning, walking left and walking right. + left and right on air
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('leo', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'leftJump',
            frames: this.anims.generateFrameNumbers('leo', { start: 0, end: 3 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'rightJump',
            frames: this.anims.generateFrameNumbers('leo', { start: 4, end: 7 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'leo', frame: 8 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('leo', { start: 4, end: 7 }),
            frameRate: 5,
            repeat: -1
        });

        //  Input Events
        cursors = this.input.keyboard.createCursorKeys();

        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        stars.children.iterate(function (child) {

            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.5));

        });

        bombs = this.physics.add.group();

        //  The score
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        //  Collide the player and the stars with the platforms
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(bombs, bombs);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        this.physics.add.overlap(player, stars, collectStar, null, this);

        this.physics.add.collider(player, bombs, hitBomb, null, this);
    }

    update () {
        if (gameOver)
        {
            return;
        }

        if (cursors.left.isDown)
        {
            player.setVelocityX(-160);

            if (player.body.touching.down) {
                player.anims.play('left', true);
            } else {
                player.anims.play('leftJump', true);
            }
        }
        else if (cursors.right.isDown)
        {
            player.setVelocityX(160);

            if (player.body.touching.down) {
                player.anims.play('right', true);
            } else {
                player.anims.play('rightJump', true);
            }
        }
        else
        {
            player.setVelocityX(0);

            player.anims.play('turn');
        }

        if (cursors.up.isDown && player.body.touching.down)
        {
            player.setVelocityY(-430);
        }
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(0, 10);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
    setTimeout(()=>{
        gameOver = false;
        player.setTint(0xffffff);
    }, 3000);
}