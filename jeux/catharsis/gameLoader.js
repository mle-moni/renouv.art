
function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genScope() {
	let controller = false;
	const innerSocket = io.connect(location.origin);

	if (localStorage.getItem("psd")) {
		sessionStorage.setItem("psd", localStorage.getItem("psd"))
	}
	if (localStorage.getItem("passwd")) {
		sessionStorage.setItem("passwd", localStorage.getItem("passwd"))
	}
	const connectObj = {
		psd: sessionStorage.getItem("psd"),
		passwd: sessionStorage.getItem("passwd")
	};
	if (connectObj.psd !== null && connectObj.passwd !== null) {
		innerSocket.emit("connectemoistp", connectObj, "hard");
	}


	innerSocket.emit("genGame");
	function genGame(password, pseudo, ioSocket) {
		let others = {};
	
		const config = {
			type: Phaser.AUTO,
			width: Math.round(innerWidth*0.5),
			height: Math.round(innerHeight*0.5),
			physics: {
				default: "arcade",
				arcade: {
					gravity: { y: 700 },
					debug: false
				}
			},
			scene: [ Ville_int_1, Ville_ext_1, Ville_ext_2, Ville_ext_3 ],
			pixelArt: true,
			zoom: 1.7
		};
	
		const game = new Phaser.Game(config);
		game.password = password;
		game.pseudo = pseudo;
		game.socket = ioSocket;
		game.spawn = {
			x: 500,
			y: 500
		};
		
		game.conversation = {
			state: false,
            index: 0,
            textArray: [],
            newConversation: (textArray, context) => {
				context.canMove = false;
                game.conversation.state = true;
                game.conversation.index = 0;
				game.conversation.textArray = textArray;
				setTimeout(()=>{
					if (!context.game.conversation.state) {
						context.canMove = true;
					} else {
						context.player.setVelocityX(0);
						context.player.setVelocityY(0);
						context.player.anims.play("idle_"+context.spriteName+"_"+context.sight.x+"_"+context.sight.y);
						context.anim = "idle";
					}
				}, 100);
            },
            avancer: (context) => {
				if (game.conversation.textArray.length === game.conversation.index) {
					game.conversation.state = false;
                    context.canMove = true;
                    context.sight.x *= -1;
                    context.sight.y *= -1;
                }
                if (game.conversation.state) {
					let textNow = game.conversation.textArray[game.conversation.index];
                    if (/\%change%/.test(textNow)) {
						let key = textNow.split("%change%")[1];
                        game.etats[key] = !game.etats[key];
                        game.conversation.index++; 
                        game.conversation.avancer(context);
                    } else if (/\%setTrue%/.test(textNow)) {
						let key = textNow.split("%setTrue%")[1];
                        game.etats[key] = true;
                        game.conversation.index++; 
                        game.conversation.avancer(context);
                    } else if (/\%setFalse%/.test(textNow)) {
						let key = textNow.split("%setFalse%")[1];
                        game.etats[key] = false;
                        game.conversation.index++; 
                        game.conversation.avancer(context);
                    } else if (/\%add%/.test(textNow)) {
						let keys = textNow.split("%add%")[1].split("+=");
						if ( !isNaN( parseInt( keys[1] ) ) ) {
							game.etats[keys[0]] += parseInt(keys[1]);
						} else {
							console.error(keys[1]+ " is not a number !");
						}
                        game.conversation.index++; 
                        game.conversation.avancer(context);
                    } else if (/\%setInt%/.test(textNow)) {
						let keys = textNow.split("%setInt%")[1].split("=");
						if ( !isNaN( parseInt( keys[1] ) ) ) {
							game.etats[keys[0]] = parseInt(keys[1]);
						} else {
							console.error(keys[1]+ " is not a number !");
						}
                        game.conversation.index++; 
                        game.conversation.avancer(context);
                    } else {
						document.getElementById("textDisplayer").children[0].innerHTML = game.conversation.textArray[game.conversation.index];
                        document.getElementById("textDisplayer").style.display = "flex";
                        game.conversation.index++; 
                    }
                } else {
					document.getElementById("textDisplayer").children[0].innerHTML = "";
                    document.getElementById("textDisplayer").style.display = "none";
                }
            }
		};
		
		game.goToMap = (str, context, x=500, y=500) => {
			game.spawn.x = x;
            game.spawn.y = y;
            context.available = false;
            context.scene.start(str);
        }
		game.playerMove = (type, context) => {
			if (type === "rpg") {
				let pressed = 0;
				if (context.canMove) {
					if (context.game.cursors.left.isDown) {
						pressed++;
						context.sight.x = -30;
						context.sight.y = 0;
						if (pressed === 1) {
							context.player.setVelocity(-160, 0);
							context.player.anims.play("left_"+context.spriteName, true);
							context.anim = "left";
						} else {
							context.player.setVelocityX(context.player.body.velocity.x - 160);
						}
					} 
					if (context.game.cursors.right.isDown) {
						pressed++;
						context.sight.x = 30;
						context.sight.y = 0;
						if (pressed === 1) {
							context.player.setVelocity(160, 0);
							context.player.anims.play("right_"+context.spriteName, true);
							context.anim = "right";
						} else {
							context.player.setVelocityX(context.player.body.velocity.x + 160);
						}
					} 
					if (context.game.cursors.up.isDown) {
						pressed++;
						context.sight.x = 0;
						context.sight.y = -30;
						if (pressed === 1) {
							context.player.setVelocity(0, -160);
							context.player.anims.play("up_"+context.spriteName, true);
							context.anim = "up";
						} else {
							context.player.setVelocityY(context.player.body.velocity.y - 160);
						}
					} 
					if (context.game.cursors.down.isDown) {
						pressed++;
						context.sight.x = 0;
						context.sight.y = 30;
						if (pressed === 1) {
							context.player.setVelocity(0, 160);
							context.player.anims.play("down_"+context.spriteName, true);
							context.anim = "down";
						} else {
							context.player.setVelocityY(160 + context.player.body.velocity.y);
						}
					}
					if (pressed === 0) {
						context.player.setVelocityX(0);
						context.player.setVelocityY(0);
						if (context.anim !== "idle") {
							context.player.anims.play("idle_"+context.spriteName+"_"+context.sight.x+"_"+context.sight.y);
							context.anim = "idle";
						} else {
							if (!context.waitAnimRefresh) {
								context.waitAnimRefresh = true;
								setTimeout(()=>{
									context.waitAnimRefresh = false;
									if (context.anim === "idle") {
										context.anim = "down";
									}
								}, 8000);
							}
						}
					}
				} else {
					if (context.busy) {
						context.player.setVelocityX(0);
						context.player.setVelocityY(0);
						if (context.anim !== "idle") {
							context.player.anims.play("idle_"+context.spriteName+"_"+context.sight.x+"_"+context.sight.y);
							context.anim = "idle";
						} else {
							if (!context.waitAnimRefresh) {
								context.waitAnimRefresh = true;
								setTimeout(()=>{
									context.waitAnimRefresh = false;
									if (context.anim === "idle") {
										context.anim = "down";
									}
								}, 8000);
							}
						}
					}
				}
			}
		}

		game.setPersoDepth = (context) => {
			for (let i = 0; i < context.personnages.length; i++) {
				if (context.personnages[i].y < context.player.y) {
					context.personnages[i].setDepth(4);
				} else {
					context.personnages[i].setDepth(6);
				}
			}
		}

		game.createAnims = (context) => {

			context.anims.create({
				key: "left_rudo",
				frames: context.anims.generateFrameNumbers("rudo", { start: 0, end: 3 }),
				frameRate: 5,
				repeat: -1
			});
			context.anims.create({
				key: "up_rudo",
				frames: context.anims.generateFrameNumbers("rudo", { start: 12, end: 15 }),
				frameRate: 5,
				repeat: -1
			});	
			context.anims.create({
				key: "down_rudo",
				frames: context.anims.generateFrameNumbers("rudo", { start: 8, end: 11 }),
				frameRate: 5,
				repeat: -1
			});	
			context.anims.create({
				key: "right_rudo",
				frames: context.anims.generateFrameNumbers("rudo", { start: 4, end: 7 }),
				frameRate: 5,
				repeat: -1
			});
			context.anims.create({
				key: "idle_rudo_0_-30",
				frames: [ { key: "rudo", frame: 22 } ],
				frameRate: 20
			});
			context.anims.create({
				key: "idle_rudo_0_30",
				frames: context.anims.generateFrameNumbers("rudo", { start: 16, end: 19 }),
				frameRate: 5,
				repeat: 0
			});
			context.anims.create({
				key: "idle_rudo_30_0",
				frames: [ { key: "rudo", frame: 21 } ],
				frameRate: 20
			});
			context.anims.create({
				key: "idle_rudo_-30_0",
				frames: [ { key: "rudo", frame: 20 } ],
				frameRate: 20
			});

			for (let i = 0; i < context.persosInfos.length; i++) {
				context.anims.create({
					key: "idle_"+context.persosInfos[i].key+"_down",
					frames: context.anims.generateFrameNumbers(context.persosInfos[i].key, { 
						start: context.persosInfos[i].idleDown.frames.start, 
						end: context.persosInfos[i].idleDown.frames.end 
					}),
					frameRate: context.persosInfos[i].idleDown.speed,
					repeat: 0
				});
				context.anims.create({
					key: "idle_"+context.persosInfos[i].key+"_left",
					frames: [ { key: ""+context.persosInfos[i].key+"", frame: context.persosInfos[i].idleLeft.frame } ],
					frameRate: 10
				});
				context.anims.create({
					key: "idle_"+context.persosInfos[i].key+"_right",
					frames: [ { key: ""+context.persosInfos[i].key+"", frame: context.persosInfos[i].idleRight.frame } ],
					frameRate: 10
				});
				context.anims.create({
					key: "idle_"+context.persosInfos[i].key+"_up",
					frames: [ { key: ""+context.persosInfos[i].key+"", frame: context.persosInfos[i].idleUp.frame } ],
					frameRate: 10
				});
				context.anims.create({
					key: "down_"+context.persosInfos[i].key,
					frames: context.anims.generateFrameNumbers(context.persosInfos[i].key, { start: 0, end: 3 }),
					frameRate: 5,
					repeat: -1
				});	
				context.anims.create({
					key: "left_"+context.persosInfos[i].key,
					frames: context.anims.generateFrameNumbers(context.persosInfos[i].key, { start: 4, end: 7 }),
					frameRate: 5,
					repeat: -1
				});
				context.anims.create({
					key: "right_"+context.persosInfos[i].key,
					frames: context.anims.generateFrameNumbers(context.persosInfos[i].key, { start: 8, end: 11 }),
					frameRate: 5,
					repeat: -1
				});
				context.anims.create({
					key: "up_"+context.persosInfos[i].key,
					frames: context.anims.generateFrameNumbers(context.persosInfos[i].key, { start: 12, end: 15 }),
					frameRate: 5,
					repeat: -1
				});
			}

			for (let i = 0; i < context.portesInfos.length; i++) {
				context.anims.create({
					key: context.portesInfos[i].anim.name,
					frames: context.anims.generateFrameNumbers(context.portesInfos[i].key, context.portesInfos[i].anim.frames),
					frameRate: context.portesInfos[i].anim.speed,
					repeat: 0
				});
				context.anims.create({
					key: context.portesInfos[i].idle.name,
					frames: [ 
						{ key: context.portesInfos[i].key, frame: context.portesInfos[i].idle.frames.frame1 }, 
						{ key: context.portesInfos[i].key, frame: context.portesInfos[i].idle.frames.frame2 } 
					],
					frameRate: context.portesInfos[i].idle.speed,
					repeat: -1
				});
			}
		}

		game.initPortes = (context) => {
			context.portes = [];
			for (let i = 0; i < context.map.objects[1].objects.length; i++) {
				let porte = context.portesInfos.find(obj=>{return obj.key === context.map.objects[1].objects[i].name});
				context.portes.push(context.physics.add.sprite(context.map.objects[1].objects[i].x + (porte.size.frameWidth/2) , context.map.objects[1].objects[i].y - (porte.size.frameHeight/2) +1, porte.key));
				context.portes[i].setDepth(2);
				context.portes[i].code = context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "code"}).value;
				context.portes[i].anims.play(porte.idle.name);
				context.portes[i].key = porte.key;
				context.portes[i].idleName = porte.idle.name;
				context.portes[i].animName = porte.anim.name;
				context.portes[i].target = {
					name: context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "target"}).value,
					x: context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "targetX"}).value,
					y: context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "targetY"}).value
				};
				context.portes[i].succesSound = context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "succesSound"}).value;
				context.portes[i].failSound = context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "failSound"}).value;
				context.portes[i].conditions = context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "conditions"}).value;
				context.portes[i].failText = context.map.objects[1].objects[i].properties.find(obj=>{return obj.name === "failText"}).value;
			}
		}

		game.initPersonnages = (context) => { //init persos + map objects
			context.personnages = [];
			for (let i = 0; i < context.map.objects[0].objects.length; i++) {
				if (game.conditions(context.map.objects[0].objects[i].properties.find(obj=>{return obj.name === "visible"}).value)) {
					let spriteName = context.map.objects[0].objects[i].name;
					context.personnages.push(context.physics.add.sprite(context.map.objects[0].objects[i].x, context.map.objects[0].objects[i].y,  spriteName));
					context.personnages[context.personnages.length-1].properties = context.map.objects[0].objects[i].properties;
					context.personnages[context.personnages.length-1].spriteName = spriteName;
					context.personnages[context.personnages.length-1].anims.play("idle_"+context.personnages[context.personnages.length-1].spriteName+"_down");
					context.personnages[context.personnages.length-1].setDepth(4);
					context.personnages[context.personnages.length-1].surprised = context.map.objects[0].objects[i].properties.find(obj=>{return obj.name === "surprised"}).value.split("&");
					context.personnages[context.personnages.length-1].body.setCircle(11, 6, 25);
					context.personnages[context.personnages.length-1].text = context.add.text(16, 16, "", { fontSize: "18px", fill: "#F00" });
					context.personnages[context.personnages.length-1].text.setDepth(20);
					context.personnages[context.personnages.length-1].isMoving = false;
					context.personnages[context.personnages.length-1].canMove = true;
					context.personnages[context.personnages.length-1].moving = {
						dir: "down",
						nextTimeTrigger: Date.now() + entierAleatoire(2000, 10000),
						timeStart: Date.now() - 100000,
						timeDuration: 1000
					};
					context.physics.add.collider(context.solidLayer, context.personnages[context.personnages.length-1], (sprite, tile)=>{});
					context.physics.add.collider(context.personnages[context.personnages.length-1], context.player, (e)=>{
						context.canMove = false;
						switch (context.anim) {
							case "up":
								context.player.setVelocity(0, 20);
								e.anims.play("idle_"+e.spriteName+"_down");
							break;
							case "down":
								context.player.setVelocity(0, -20);
								e.anims.play("idle_"+e.spriteName+"_up");
							break;
							case "left":
								context.player.setVelocity(20, 0);
								e.anims.play("idle_"+e.spriteName+"_right");
							break;
							case "right":
								context.player.setVelocity(-20, 0);
								e.anims.play("idle_"+e.spriteName+"_left");
							break;
						}
						const surprised = e.surprised;
						e.text.text = surprised[entierAleatoire(0, surprised.length-1)];
						e.text.x = e.x - e.text.width/2;
						e.text.y = e.y - (e.height/2+15);
						setTimeout(()=>{
							e.text.text = "";
						},500);
						setTimeout(()=>{
							if (!context.game.conversation.state) {
								context.canMove = true;
							} else {
								context.player.setVelocityX(0);
								context.player.setVelocityY(0);
								context.player.anims.play("idle_"+context.spriteName+"_"+context.sight.x+"_"+context.sight.y);
								context.anim = "idle";
							}
						}, 500);
						e.setVelocity(0,0);
					}, null, context);
				}
			}
			context.mapObjects = [];
			for (let i = 0; i < context.map.objects[3].objects.length; i++) {
				let obj = {
					name: context.map.objects[3].objects[i].name,
					x: context.map.objects[3].objects[i].x,
					y: context.map.objects[3].objects[i].y,
					width: context.map.objects[3].objects[i].width,
					height: context.map.objects[3].objects[i].height,
					properties: context.map.objects[3].objects[i].properties
				};
				context.mapObjects.push(obj);
			}
		}

		game.keyUp = (key, context) => {
			if (key === "q" && canRestart) {
                context.game.goToMap("Ville_int_1", context);
			}
			if (key === "a" && canRestart) {
                context.game.goToMap("Ville_ext_2", context, 100, 20);
            }
            if (key === "c") {
                if (!context.busy) {
                    if (context.game.conversation.state) {
                        context.game.conversation.avancer(context);
                    } else {
                        for (let n = 0; n < context.portes.length; n++) {
                            if (context.player.interacts(context.portes[n])) {
								if (game.conditions(context.portes[n].conditions)) {
									if (context.portes[n].code !== -1) {
										const CODE = context.portes[n].code;
	
										context.canMove = false;
										context.busy = true;
										context.code = {
											buttons: [],
											str: ""
										};
										let buttonsNumber = 0;
										let mainRec = document.createElement("div");
										mainRec.classList.add("toRemove");
										mainRec.style.position = "absolute";
										mainRec.style.left = ((innerWidth/2) - ((55*3)/2)) - 10 +"px";
										mainRec.style.top = (innerHeight/2) - ((55*4)/2) - 10 -55 +"px";
										mainRec.style.width = "180px";
										mainRec.style.height = "290px";
										mainRec.style.backgroundColor = "rgba(0,0,0)";
										document.body.appendChild(mainRec);
										for (let i = 0; i < 3; i++) {
											for (let j = 0; j < 3; j++) {
												let carre = document.createElement("div");
												carre.className = "touche";
												carre.classList.add("toRemove");
												carre.style.left = ((innerWidth/2) - ((55*3)/2)) + j*55 +"px";
												carre.style.top = (innerHeight/2) - ((55*4)/2) + i*55 +"px";
												carre.style.width = "50px";
												carre.style.height = "50px";
												carre.style.display = "flex";
												carre.appendChild(document.createElement("p"));
												carre.children[0].style.textAlign = "center";
												carre.children[0].style.margin = "auto";
												carre.children[0].style.fontSize = "25px";
												carre.children[0].innerHTML = buttonsNumber;
												// z index ?
												carre.addEventListener("click", e=>{
													context.sounds["beep"].play();
													let newChar = (e.path[0].children.length === 0)?e.path[0].innerHTML : e.path[0].children[0].innerHTML;
													context.code.str += newChar;
													document.getElementById("displayCarre").children[0].innerHTML = context.code.str;
												});
												document.body.appendChild(carre);
												buttonsNumber++;
											}
										}
										for (let i = 0; i < 2; i++) {
											let carre = document.createElement("div");
											carre.className = "touche";
											carre.classList.add("toRemove");
											carre.style.left = ((innerWidth/2) - ((55*3)/2)) + i*82 +"px";
											carre.style.top = (innerHeight/2) - ((55*4)/2) + 3*55 +"px";
											carre.style.width = "79px";
											carre.style.height = "50px";
											carre.style.display = "flex";
											carre.appendChild(document.createElement("p"));
											carre.children[0].style.textAlign = "center";
											carre.children[0].style.margin = "auto";
											carre.children[0].style.fontSize = "25px";
											carre.children[0].innerHTML = (i===0)?"9":"Ok";
											carre.addEventListener("click", e=>{
												let newChar = (e.path[0].children.length === 0)?e.path[0].innerHTML : e.path[0].children[0].innerHTML;
												if (newChar === "9") {
													context.sounds["beep"].play();
													context.code.str += newChar;
													document.getElementById("displayCarre").children[0].innerHTML = context.code.str;
												} else {
													// verifier que ce soit le bon code
													if (parseInt(document.getElementById("displayCarre").children[0].innerHTML) === CODE) {
														context.sounds[context.portes[n].succesSound].play();
														for (let i = document.getElementsByClassName("toRemove").length; i != 0; i=document.getElementsByClassName("toRemove").length) {
															document.body.removeChild(document.getElementsByClassName("toRemove")[0]);
														}
														setTimeout(()=>{
															context.portes[n].anims.play(context.portes[n].animName);
															setTimeout(()=>{
																context.game.goToMap(context.portes[n].target.name, context, context.portes[n].target.x, context.portes[n].target.y);
															}, 1000);
														}, 500);
													} else {
														context.sounds[context.portes[n].failSound].play();
														for (let i = document.getElementsByClassName("toRemove").length; i != 0; i=document.getElementsByClassName("toRemove").length) {
															document.body.removeChild(document.getElementsByClassName("toRemove")[0]);
														}
														context.portes[n].anims.play(context.portes[n].idleName);
														context.canMove = true;
														context.busy = false;
													}
												}
											});
											document.body.appendChild(carre);
										}
										{
											let displayCarre = document.createElement("div");
											displayCarre.id = "displayCarre";
											displayCarre.classList.add("toRemove");
											displayCarre.style.left = ((innerWidth/2) - ((55*3)/2)) +"px";
											displayCarre.style.top = (innerHeight/2) - ((55*4)/2) -55 +"px";
											displayCarre.appendChild(document.createElement("p"));
											displayCarre.children[0].style.textAlign = "center";
											displayCarre.children[0].style.margin = "auto";
											displayCarre.children[0].style.fontSize = "25px";
											displayCarre.children[0].innerHTML = ". . .";
											document.body.appendChild(displayCarre);
										}
									} else {
										context.canMove = false;
										context.busy = true;
										context.sounds[context.portes[n].succesSound].play();
										context.portes[n].anims.play(context.portes[n].animName);
										setTimeout(()=>{
											context.game.goToMap(context.portes[n].target.name, context, context.portes[n].target.x, context.portes[n].target.y);
										}, 1000);
									}
								} else {
									context.player.text.shouldDisplay = context.portes[n].failText;
									context.player.text.timer = Date.now();
								}
                            }
                        }
                        for (let i = 0; i < context.personnages.length; i++) {
                            if (context.player.interacts(context.personnages[i])) {
                                let conditions = context.personnages[i].properties.find(e=>{return e.name === "conditions"}).value.split("#");
                                let conv;
                                
								let convIndex = -1;
								for (let j = 0; j < conditions.length; j++) {
									if (game.conditions(conditions[j])) {
										convIndex = j;
									}
								}
								if (convIndex === -1) {
									console.error("Erreur de conditions : " + context.personnages[i].properties.find(e=>{return e.name === "conditions"}).value)
									return false;
								} else {
									conv = context.personnages[i].properties.find(e=>{return e.name === "conv_"+convIndex}).value.split("\n");
								}
                                
                                context.game.conversation.newConversation(conv, context);
                                context.game.conversation.avancer(context);
                                if (context.sight.x < 0) { //regarde a gauche
                                    context.personnages[i].anims.play("idle_"+context.personnages[i].spriteName+"_right");
                                } else if (context.sight.x > 0) { //regarde a droite
                                    context.personnages[i].anims.play("idle_"+context.personnages[i].spriteName+"_left");
                                } else if (context.sight.y < 0) { //regarde en haut
                                    context.personnages[i].anims.play("idle_"+context.personnages[i].spriteName+"_down");
                                } else if (context.sight.y > 0) { //regarde en bas
                                    context.personnages[i].anims.play("idle_"+context.personnages[i].spriteName+"_up");
                                }
                            }
						}
						for (let i = 0; i < context.mapObjects.length; i++) {
							if (context.player.interacts(context.mapObjects[i], 0, 0, "object")) {
								let conditions = context.mapObjects[i].properties.find(e=>{return e.name === "conditions"}).value.split("#");
                                let conv;
                                
								let convIndex = -1;
								for (let j = 0; j < conditions.length; j++) {
									if (game.conditions(conditions[j])) {
										convIndex = j;
									}
								}
								if (convIndex === -1) {
									console.error("Erreur de conditions : " + context.mapObjects[i].properties.find(e=>{return e.name === "conditions"}).value)
									return false;
								} else {
									conv = context.mapObjects[i].properties.find(e=>{return e.name === "conv_"+convIndex}).value.split("\n");
								}
                                
                                context.game.conversation.newConversation(conv, context);
                                context.game.conversation.avancer(context);
							}
						}
                    }
                }
            }
		}

		game.selfSettings = (context, spriteName) => {
			context.spriteName = spriteName;
			context.waitAnimRefresh = false;
			context.busy = false;
			context.sight = {
				x: 0,
				y: 30
			};
			context.available = true;
			context.anim = "";
			context.canMove = true;
			context.map = context.add.tilemap(context.mapName);

			const tileset = context.map.addTilesetImage(context.tilesetInfos.imageName, context.tilesetInfos.key);

			//layers 
			let ground = context.map.createStaticLayer("ground", [tileset], 0, 0);
			let back =  context.map.createStaticLayer("back", [tileset], 0, 0).setDepth(1);
			let frontOfBack =  context.map.createStaticLayer("frontOfBack", [tileset], 0, 0).setDepth(2);
			let front = context.map.createStaticLayer("front", [tileset], 0, 0).setDepth(10);
			let frontOfFront =  context.map.createStaticLayer("frontOfFront", [tileset], 0, 0).setDepth(11);
			context.solidLayer = context.map.createStaticLayer("solid", [tileset], 0, 0).setDepth(-1);

			context.player = context.physics.add.sprite(context.game.spawn.x, context.game.spawn.y, context.spriteName);
			context.player.body.setCircle(11, 6, 25);
			context.player.setDepth(5);
			context.player.setBounce(0.1);
			context.player.setCollideWorldBounds(true);
			context.player.text = context.add.text(16, 16, "", { fontSize: "12px", fill: "#F00" });
			context.player.shouldDisplay = "";
			context.player.text.timer = Date.now();
			context.player.text.setDepth(20);
			//collisions
			context.solidLayer.setCollisionByProperty({solid: true});
			context.player.interacts = function (obj, decalageX, decalageY, type="sprite") {
				let x1, x2, y1, y2;
				let px, py;
				if (type === "sprite") {
					if (decalageX === undefined) decalageX = Math.round(obj.width/2);
					if (decalageY === undefined) decalageY = Math.round(obj.height/2);
					x1 = obj.x-decalageX;
					x2 = obj.x+decalageX;
					y1 = obj.y-decalageY;
					y2 = obj.y+decalageY;
					px = context.player.x+context.sight.x;
					py = context.player.y+context.sight.y;
				} else if (type === "tp") {
					x1 = obj.x;
					x2 = obj.x+obj.width;
					y1 = obj.y;
					y2 = obj.y+obj.height;
					px = context.player.x;
					py = context.player.y;
				} else if (type === "object") {
					x1 = obj.x;
					x2 = obj.x+obj.width;
					y1 = obj.y;
					y2 = obj.y+obj.height;
					px = context.player.x+context.sight.x;
					py = context.player.y+context.sight.y;
				}
				if (px > x1 && px < x2) {
					if (py > y1 && py < y2) {
						return true;
					}
				}
				return false;
			}
			context.physics.add.collider(context.solidLayer, context.player, (sprite, tile)=>{
				if (tile.properties.hasOwnProperty("dead")) {

				}
			});

			//  Input Events
			context.game.cursors = context.input.keyboard.createCursorKeys();
			//camera 
			context.cameras.main.startFollow(context.player);
			context.physics.world.setBounds(0, 0, context.map.widthInPixels, context.map.heightInPixels);
		}

		game.personnagesMoves = (context) => {
			const now = Date.now();
			const speedTable = [
				{dir: "left", x: -10, y: 0},
				{dir: "right", x: 10, y: 0},
				{dir: "up", x: 0, y: -10},
				{dir: "down", x: 0, y: 10}
			];
			if (!context.game.conversation.state) {
				for (let i = 0; i < context.personnages.length; i++) {
					if (context.personnages[i].isMoving === false && context.personnages[i].canMove) {
						if (context.personnages[i].moving.nextTimeTrigger < now) {
							const tableKey = entierAleatoire(0, 3);
							context.personnages[i].isMoving = true;
							context.personnages[i].moving.dir = speedTable[tableKey].dir;
							context.personnages[i].moving.timeDuration = entierAleatoire(500, 2000);
							context.personnages[i].setVelocity(speedTable[tableKey].x, speedTable[tableKey].y);
							context.personnages[i].moving.timeStart = Date.now();
							context.personnages[i].anims.play( context.personnages[i].moving.dir+"_"+context.personnages[i].spriteName);
						}
					}
				}
			}
			for (let i = 0; i < context.personnages.length; i++) {
				if (context.personnages[i].isMoving) {
					if (context.personnages[i].moving.timeStart + context.personnages[i].moving.timeDuration < Date.now() ) {
						context.personnages[i].isMoving = false;
						context.personnages[i].setVelocity(0, 0);
						context.personnages[i].anims.play( "idle_"+context.personnages[i].spriteName+"_"+context.personnages[i].moving.dir );
						context.personnages[i].moving.nextTimeTrigger = Date.now() + entierAleatoire(5000, 10000);
					}
				}
			}
		}

		game.playerText = (context) => {
			context.player.text.text = context.player.text.shouldDisplay;
			if (context.player.text.timer+2000 > Date.now()) {
				context.player.text.x = context.player.x - context.player.text.width/2;
				context.player.text.y = context.player.y - (context.player.height/2+15);
			} else {
				context.player.text.shouldDisplay = "";	
			}
		}

		game.conditions = (textToParse) => {
			let conditions = textToParse.split("&&");
			let verif = true;
			for (let j = 0; j < conditions.length; j++) {
				let condition = conditions[j].split(" ");
				let test = eval("game.etats[\"".concat(condition[0], "\"]", condition[1]));
				if (!test) {
					verif = false;
				}
			}
			return verif;
		}

		game.checks = (context) => {
			for (let i = 0; i < context.map.objects[2].objects.length; i++) { // on regarde si on doit changer de map
				let rectangle = context.map.objects[2].objects[i];
				if (context.player.interacts(rectangle, 0, 0, "tp")) {
					const targetMap = rectangle.name;
					let verif = game.conditions(rectangle.properties.find(obj=>{return obj.name === "conditions"}).value);
					
					if (verif) {
						let target = {x: context.player.x, y: context.player.y};
						switch (rectangle.properties.find(obj=>{return obj.name === "direction"}).value) {
							case "left": 
								target.x = 1575;
							break;
							case "right": 
								target.x = 25;
							break;
							case "top": 
								target.y = 1575;
							break;
							case "bottom": 
								target.y = 25;
							break;
							case "none":
								target.x = rectangle.properties.find(obj=>{return obj.name === "targetX"}).value;
								target.y = rectangle.properties.find(obj=>{return obj.name === "targetY"}).value;
							break;
						}
						context.game.goToMap(targetMap, context, target.x, target.y);
					} else {
						context.player.text.shouldDisplay = rectangle.properties.find(obj=>{return obj.name === "failText"}).value;
						context.player.text.timer = Date.now();
					}
				}
			}
		}

		game.etats = {
			kratos: 0,
			oubli: 0,
			enfants: false
		};
		
		let controller = function(type, action, psd, obj) {
			
		}
		return controller;
	}
	
	innerSocket.on("getId", (id, psd) => {
		controller = genGame(id, psd, innerSocket);
		let cv = document.getElementsByTagName("canvas")[0];
		cv.style.position = "absolute";
		cv.style.left = ((innerWidth/2) - (cv.width/2)) *0.3+ "px";
		cv.style.top = ((innerHeight/2) - (cv.height/2)) *0.3+ "px";
		
		// init text box
		const textDisplayer = document.createElement("div");
		textDisplayer.id = "textDisplayer";
		textDisplayer.style.position = "absolute";
		textDisplayer.style.left = cv.offsetLeft+"px";
		textDisplayer.style.top = innerHeight-(cv.offsetTop+100) + "px";
        textDisplayer.style.display = "none";
        textDisplayer.style.width = Math.ceil(document.getElementsByTagName("canvas")[0].width*1.7) +1 +"px";
        textDisplayer.style.height = "101px";
        textDisplayer.style.backgroundColor = "rgba(156, 131, 131, 0.9)";
        textDisplayer.appendChild(document.createElement("p"));
        textDisplayer.children[0].style.textAlign = "center";
		textDisplayer.children[0].style.margin = "auto";
		textDisplayer.children[0].style.fontSize = "25px";

		document.body.appendChild(textDisplayer);		
	});

	// sockets events

	innerSocket.on("logAndComeBack", ()=>{
		sessionStorage.setItem("goTo", location.pathname);
		location.replace("/login");
	});

	innerSocket.on("disconnect", ()=>{
		alert("Vous avez ete deconnecte, cela est peut etre du a une mise a jour du serveur, a une inactivite prolongee ou a une perte de connection internet. Nous devons rafraichir la page, desole pour le derrangement");
		location.reload();
	});
}