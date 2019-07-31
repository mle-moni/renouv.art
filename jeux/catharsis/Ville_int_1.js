class Ville_int_1 extends Phaser.Scene {
    constructor () {
        super ({
            key: "Ville_int_1"
        });
    }
    
    preload () {
        this.mapName = this.constructor.toString().split("\"")[1];

        this.tilesetInfos = {
            key: "tilesetVilleInt",
            imageName: "ville_interieur"
        };
        this.load.image(this.tilesetInfos.key, "../jeux/catharsis/assets/maps/tilesets/"+this.tilesetInfos.imageName+".png");
        this.load.tilemapTiledJSON("Ville_int_1", "../jeux/catharsis/assets/maps/tilemaps/Ville_int_1.json");

        this.load.spritesheet("rudo", "../jeux/catharsis/assets/sprites/rudo_full.png", { frameWidth: 32, frameHeight: 48 });

        this.load.image('lightOrange', '../jeux/catharsis/assets/sprites/light_orange.png');
        this.load.image('lightBlue', '../jeux/catharsis/assets/sprites/light_blue.png');
        this.load.audio('train', '../jeux/catharsis/assets/audio/ambiance/train.mp3');
        this.load.audio('beep', '../jeux/catharsis/assets/audio/ambiance/beep.mp3');
        this.load.audio('succes', '../jeux/catharsis/assets/audio/ambiance/succes.mp3');
        this.load.audio('vibration', '../jeux/catharsis/assets/audio/ambiance/vibration.mp3');

        // animations à 2 moments (portes)
        this.portesInfos = [
            {
                key: "portes_auto", 
                src: "../jeux/catharsis/assets/sprites/portes/portes_auto.png", 
                size: { frameWidth: 82, frameHeight: 67 }, 
                idle: {name: "idle_porte", frames: { frame1: 0, frame2: 4 }, speed: 1},
                anim: {name: "open_porte", frames: { start: 0, end: 3 }, speed: 10}
            }
        ];
        for (let i = 0; i < this.portesInfos.length; i++) {
            this.load.spritesheet(this.portesInfos[i].key, this.portesInfos[i].src, this.portesInfos[i].size);
        }
        // personnages 
        this.persosInfos = [
            {
                key: "kratos",
                src: "../jeux/catharsis/assets/sprites/ville_depart/kratos_full.png",
                size: { frameWidth: 32, frameHeight: 48 },
                idleDown: {frames: { start: 16, end: 20 }, speed: 10},
                idleLeft: {frame: 22},
                idleRight: {frame: 23},
                idleUp: {frame: 24}
            }
        ];
        for (let i = 0; i < this.persosInfos.length; i++) {
            this.load.spritesheet(this.persosInfos[i].key, this.persosInfos[i].src, this.persosInfos[i].size);
        }
    }
    // pseudo stocké dans this.game.pseudo
    create () {
        let self = this;
        self.game.selfSettings(self, "rudo");
        
        self.physics.add.world.gravity = {x: 0, y: 0};
        
        self.particles = {};
        self.particles["lightBlue"] = self.add.particles("lightBlue");
        self.particles["lightOrange"] = self.add.particles("lightOrange");
        self.particles["lightBlue"].setDepth(12);
        self.particles["lightOrange"].setDepth(12);
        self.emitters = [];

        self.timeSample = Date.now();

        // SOUNDS :
        self.sounds = {};
        self.sounds["train"] = self.sound.add('train', { loop: false });
        self.sounds["train"].volume = 0.5;
        self.sounds["beep"] = self.sound.add('beep', { loop: false });
        self.sounds["vibration"] = self.sound.add('vibration', { loop: false });
        self.sounds["vibration"].volume = 1.3;
        self.sounds["succes"] = self.sound.add('succes', { loop: false });
        
        if (mainAudio.src !== location.href+"/assets/audio/musique/Wistful_Harp.mp3") {
            mainAudio.src = location.href+"/assets/audio/musique/Wistful_Harp.mp3";
            mainAudio.volume = 0.4;
            mainAudio.play();
        }

        // light particles
        for ( let y = 0; y < self.map.layers[3].data.length; y++) {
            for (let x = 0; x < self.map.layers[3].data[y].length; x++) {
                if (self.map.layers[3].data[y][x].index === 1614) {
                    self.emitters.push( self.particles["lightBlue"].createEmitter({
                        x: 16*x,
                        y: 16*y +10,
                        speed: { min: 10, max: -50 },
                        gravityY: -100,
                        scale: { start: 0.2, end: 0.0 },
                        lifespan: 400,
                        blendMode: 'ADD'
                    }) );
                }
            }
        }

        //  Our animations
        self.game.createAnims(self);
        
        self.game.initPersonnages(self);
        self.game.initPortes(self);

        this.input.keyboard.on("keyup", e=>{
            self.game.keyUp(e.key, self);
        });
    }

    update () {
        let self = this;

        self.game.setPersoDepth(self);
        self.game.playerText(self);
        self.game.checks(self);
        self.game.personnagesMoves(self);

        if (self.timeSample + 30000 < Date.now()) {
            self.sounds["train"].play();
            self.timeSample = Date.now();
        }

        self.game.playerMove("rpg", self);
    }
}