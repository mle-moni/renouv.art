class Level2 extends Phaser.Scene {
    constructor () {
        super ({
            key: "Level2"
        });
    }

    preload () {
        this.load.image("tileset", "../jeux/tournois/assets/maps/tilesets/marioTileset.png");
        this.load.tilemapTiledJSON("Level2", "../jeux/tournois/assets/maps/tilemaps/Level2.json");
        this.load.spritesheet('leo', '../jeux/tournois/assets/sprites/leo_full.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('victorieux', '../jeux/tournois/assets/sprites/victorieux_full.png', { frameWidth: 32, frameHeight: 48 });
    }

    create () {
        let self = this;
        self.available = true;
        self.anim = "idle";
        self.accel = false;
        self.accelBol = true;
        this.spriteName = (this.game.pseudo === "Mordka" || this.game.pseudo === "Redz") ? "victorieux" : "leo";
        this.canMove = true;
        this.notWonYet = true;
        this.jumps = 0;
        this.timeStart = Date.now();
        this.goToMap = (str) => {
            jumpSetter(0);
            clearInterval(self.liveInterval);
            self.available = false;
            self.game.socket.off("livePos", self.liveHandler);
            self.game.socket.off("deletePlayer", self.delHandler);
            this.scene.start(str);
        }

        const map = this.add.tilemap("Level2");
        const tileset = map.addTilesetImage("marioTileset", "tileset");        

        //layers 
        let solidLayer = map.createStaticLayer("solid", [tileset], 0, 0);
        // let skyLayer = map.createStaticLayer("sky", [tileset], 0, 0).setDepth(-1);

        // pour restart cette map
        this.input.keyboard.on("keyup", e=>{
            if (e.key === "r" && canRestart) {
                this.goToMap("Level2");
                document.getElementById("ladder").style.visibility = "hidden";
                document.getElementsByTagName("canvas")[0].style.visibility = "visible";
            }
            if (e.key === "q" && canRestart) {
                this.goToMap("MainMenu");
            }
            if (e.key === "A") {
                this.goToMap("Level1");
            }
        });

        this.othersPlayers = {};
        this.mapName = "Level2";

        this.player = this.physics.add.sprite(80, 1250, this.spriteName);
        
        this.player.body.setCircle(11, 6, 25);

        // fais legerement rebondir le perso
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);

        //collisions
        solidLayer.setCollisionByProperty({solid: true});

        this.physics.add.collider(solidLayer, this.player, (sprite, tile)=>{
            if (self.accelBol) {
                self.accel = false;
            }
            if (tile.properties.hasOwnProperty("win")) {
                if (self.notWonYet) {
                    self.notWonYet = false;
                    self.canMove = false;
                    let dTime = Math.round((Date.now()-self.timeStart)/10)/100;
                    let score = ".iMon score est de : "+self.jumps+" sauts et "+Math.round((Date.now()-self.timeStart)/10)/100+" secondes sur la map 2 !!i";
                    self.game.socket.emit("scoreTournois", {jumps: self.jumps, time: dTime, password: self.game.password});
                    scoreActuel.score = dTime * self.jumps * 100;
                    scoreActuel.jumps = self.jumps;
                    scoreActuel.time = dTime;
                    sendTxt(score);
                    document.getElementById("ladder").style.visibility = "visible";
                    document.getElementsByTagName("canvas")[0].style.visibility = "hidden";
                }
            } else if (tile.properties.hasOwnProperty("bounce")) {
                self.player.setVelocityY(tile.properties["bounce"]);
            } else if (tile.properties.hasOwnProperty("dead")) {
                this.goToMap("Level2");
                document.getElementById("ladder").style.visibility = "hidden";
                document.getElementsByTagName("canvas")[0].style.visibility = "visible";
            } else if (tile.properties.hasOwnProperty("accel")) {
                self.accel = true;
                self.accelBol  = false;
                self.player.setVelocityX(tile.properties.accel);
                setTimeout(()=>{
                    self.accelBol = true;
                }, 1000);
            }
        });

        //  Our this.player animations, idleing, walking left and walking right. + left and right on air
        this.anims.create({
            key: 'left_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'up_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 12, end: 15 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'down_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 8, end: 11 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'leftJump_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 0, end: 3 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'rightJump_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 4, end: 7 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'idle_leo',
            frames: [ { key: "leo", frame: 8 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right_leo',
            frames: this.anims.generateFrameNumbers("leo", { start: 4, end: 7 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'left_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'leftJump_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 0, end: 3 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'rightJump_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 4, end: 7 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'idle_victorieux',
            frames: [ { key: "victorieux", frame: 8 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 4, end: 7 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'up_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 12, end: 15 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'down_victorieux',
            frames: this.anims.generateFrameNumbers("victorieux", { start: 8, end: 11 }),
            frameRate: 5,
            repeat: -1
        });

        //  Input Events
        self.game.cursors = this.input.keyboard.createCursorKeys();


        //camera 
        this.cameras.main.startFollow(this.player);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        self.liveInterval = setInterval(()=>{
            const gameObj = {
                x: self.player.x,
                y: self.player.y,
                skin: self.spriteName,
                map: self.mapName,
                anim: self.anim
            };
            self.game.socket.emit("livePos", gameObj, self.game.password);
        }, 40);

        self.liveHandler = (obj)=>{
            if (self.available) {
                for (let key in obj) {
                    if (key !== self.game.pseudo) {
                        if (self.mapName === obj[key].map) {
                            if (self.othersPlayers.hasOwnProperty(key)) {
                                self.othersPlayers[key].x = obj[key].x;
                                self.othersPlayers[key].y = obj[key].y;
                                self.othersPlayers[key].nameDisplayer.x = obj[key].x - (self.othersPlayers[key].nameDisplayer.width/2);
                                self.othersPlayers[key].nameDisplayer.y = obj[key].y-50;
                                self.othersPlayers[key].anims.play(obj[key].anim+"_"+obj[key].skin, true);
                            } else {
                                const localBody = self.physics.add.sprite(obj[key].x, obj[key].y, obj[key].skin);
        
                                localBody.body.setCircle(11, 6, 25);
                                localBody.setCollideWorldBounds(true);
                                localBody.body.moves = false;
                                self.physics.collide(self.player, localBody);
                                self.physics.add.collider(self, true, self.player, localBody, ()=>{});
                                self.othersPlayers[key] = localBody;
                                self.othersPlayers[key].nameDisplayer = this.add.text(16, 16, key, { fontSize: '18px', fill: '#F00' });
                            }
                        } else {
                            if (self.othersPlayers.hasOwnProperty(key)) {
                                self.othersPlayers[key].disableBody(true, true);
                                self.othersPlayers[key].nameDisplayer.destroy();
                            }
                        }
                    }
                }
            }
        }
        self.delHandler = pseudo=>{
            if (self.othersPlayers.hasOwnProperty(pseudo)) {
                self.othersPlayers[pseudo].disableBody(true, true);
                self.othersPlayers[pseudo].nameDisplayer.destroy();
                delete(self.othersPlayers[pseudo]);
            }
        }
        self.game.socket.on("livePos", self.liveHandler);
        self.game.socket.on("deletePlayer", self.delHandler);
    }

    update () {
        let self = this;

        if (this.canMove) {
            if (self.game.cursors.left.isDown && !self.accel) {
                this.player.setVelocityX(-160);
    
                if (this.player.body.onFloor()) {
                    this.player.anims.play('left_'+self.spriteName, true);
                    self.anim = "left";
                } else {
                    this.player.anims.play('leftJump_'+self.spriteName, true);
                    self.anim = "leftJump";
                }
            }
            else if (self.game.cursors.right.isDown && !self.accel) {
                this.player.setVelocityX(160);
    
                if (this.player.body.onFloor()) {
                    this.player.anims.play('right_'+self.spriteName, true);
                    self.anim = "right";
                } else {
                    this.player.anims.play('rightJump_'+self.spriteName, true);
                    self.anim = "rightJump";
                }
            }
            else {
                if (!self.accel) {
                    this.player.setVelocityX(0);
                }
    
                this.player.anims.play('idle_'+self.spriteName);
                self.anim = "idle";
            }
            if (self.game.cursors.up.isDown && this.player.body.onFloor()) {
                this.player.setVelocityY(-430);
                this.jumps++;
                jumpSetter(this.jumps);
            }
        }
    }
}