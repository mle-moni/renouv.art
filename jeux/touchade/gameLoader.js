
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let dispo = false;

let cameraLock = true;

function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const key = {
    left: false,
    right: false,
    go: false,
    break: false,
    up: false,
	down: false,
	acceleration: false,
	stabilisation: false,
	looping: false,
	tirer: false,
	snipe: false
};

let time = +new Date();
let frames = 0;
let framesTotal = 0;
let rz_to0 = false;
let tay_to0 = false;
let tax_to0 = false;
let taz_to0 = false;

let pingB = true;
let pingTime = 0;
let ping = [];

let spawnPos = {
    x: entierAleatoire(-1500, 1500),
    y: entierAleatoire(-1500, 1500),
    z: entierAleatoire(-1500, 1500)
};


function genGame(id) {
    const password = id;

    let player = false;
	let others = {};
	
	oldScore = 0;
	
	let bonusDispo = {
		accel: true,
		machinegun: true,
		sniper: true
	};

	let timers = {
		accel: 0,
		sniper: 0
	};

	const bullets = [];
	const meteors = [];
	let meteorsNum = 0;
	let nextMeteor = {
		time: 0,
		wait: 0
	};

	const collidable = [];
	let startUpdate = false;

    const renderer = new THREE.WebGLRenderer({antialias:true});
		renderer.setSize(WIDTH-4, HEIGHT-4);
		renderer.setClearColor(0x000000, 1);
		document.body.appendChild(renderer.domElement);

		const scene = new THREE.Scene();

		const camera = new THREE.PerspectiveCamera(70, WIDTH/HEIGHT, 0.1, 2600);

		// var geometry = new THREE.SphereGeometry( 30, 32, 32 );
		// var material = new THREE.MeshBasicMaterial( {color: 0xffff00, transparent: true, opacity: 0.5} );
		// var sphere = new THREE.Mesh( geometry, material );
		// sphere.position.set(500,500,500);
		// scene.add( sphere );

		function render() {
			let timeNow = +new Date();
			let dt = timeNow - time;
			time = timeNow;
			update(dt);
			if (player !== false) {
				if (cameraLock) {
					camera.rotation.y = player.rotation.y;
					camera.rotation.x = player.rotation.x;
					camera.position.x = player.position.x - Math.sin(player.rotation.y + Math.PI) * 150;
					camera.position.z = player.position.z - Math.cos(player.rotation.y + Math.PI) * 150;
				}
				camera.position.y = player.position.y + 50;
			}
			requestAnimationFrame(render);
			renderer.render(scene, camera);
		}
		render();
		// bleu 0x0095DD
		const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
		const material1 = new THREE.MeshBasicMaterial({color: 0xEE8C8C});
		const material2 = new THREE.MeshBasicMaterial({color: 0x7D5C5C});

		const redMaterial = new THREE.MeshBasicMaterial({color: 0xFF0000});
		const blueMaterial = new THREE.MeshBasicMaterial({color: 0x0000FF});
		const whiteMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});

		let colliTest = new THREE.Mesh(boxGeometry, material1);
		scene.add(colliTest);
		collidable.push({mesh: colliTest, hitbox: 50, key: "centerCube"});

		
		// for (let i = -5; i < 5; i++) {
		// 	for (let j = -5; j < 5; j++) {
		// 		let warn1 = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 0), new THREE.MeshBasicMaterial({color: 0xFF0000, side: THREE.DoubleSide }));
		// 		warn1.position.set(j * 600, i * 600, -3000)
		// 		scene.add(warn1)
		// 	}
		// }


		class Mur {
			constructor(x, z, num, materials) {
				let arrCube = [];
				for (let i = 0; i < num; i++) {
					arrCube.push(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), materials[i%materials.length]));
					arrCube[i].position.x = x;
					arrCube[i].position.y = 0;
					arrCube[i].position.z = z + (i*10);
					scene.add(arrCube[i]);
				}
			}
		}

		const balle = new THREE.BoxGeometry(6, 6, 20);
		const balleDeSnipe = new THREE.BoxGeometry(12, 12, 40);
		function fire(type) {
			let fireObj = {
                vx: Math.sin(player.rotation.y),
                vz: Math.cos(player.rotation.y),
                vy: player.moveCoef,
                px: player.position.x,
                pz: player.position.z,
                py: player.position.y,
                ry: player.rotation.y,
				id: password,
				type: type
            };
			socket.emit("fire", fireObj, password);
			shot(fireObj);
        }
        function shot(obj) {
			if (player.alive) {
				let bulletMaterial = redMaterial;
				let bulletMesh = balle;
				let bulletSpd = 5;
				let bulletHitbox = 10;
				let bulletDmg = 4;
				if (obj.type === "snipe") {
					bulletMaterial = blueMaterial;
					bulletSpd = 6;
					bulletMesh = balleDeSnipe;
					bulletHitbox = 30;
					bulletDmg = 25;
				}
				bullets.push({id: obj.id, mesh: new THREE.Mesh(bulletMesh, bulletMaterial), x: obj.vx*bulletSpd, z: obj.vz*bulletSpd, y: obj.vy*bulletSpd, hitbox: bulletHitbox, dmg: bulletDmg});
				bullets[bullets.length-1].mesh.position.x = obj.px;
				bullets[bullets.length-1].mesh.position.z = obj.pz;
				bullets[bullets.length-1].mesh.position.y = obj.py;
				bullets[bullets.length-1].mesh.rotation.y = obj.ry;
				scene.add(bullets[bullets.length-1].mesh);
				setTimeout(()=>{
					scene.remove(bullets[0].mesh);
					bullets.shift();
				}, 5000);
			}
		}
		
		function newMeteor(obj) {
			if (player !== false) {
				meteors.push({id: obj.id, mesh: prototypes["meteor"].clone(), x: obj.vx*obj.spd, z: obj.vz*obj.spd, y: obj.vy*obj.spd, hitbox: 48, dmg: 300, hp: 100, key: obj.key});
				meteors[meteors.length-1].mesh.position.x = obj.px;
				meteors[meteors.length-1].mesh.position.z = obj.pz;
				meteors[meteors.length-1].mesh.position.y = obj.py;
				meteors[meteors.length-1].mesh.rotation.y = obj.ry;
				meteors[meteors.length-1].mesh.rotation.y = obj.ry;
				scene.add(meteors[meteors.length-1].mesh);
				collidable.push({mesh: meteors[meteors.length-1].mesh, hitbox: 48, key: obj.key});
				setTimeout(()=>{
					let exist = false;
					for (let i = 0; i < collidable.length; i++) {
						if (collidable[i].key === obj.key) {
							collidable.splice(i, 1);
							exist = true;
						}
					}
					if (exist) {
						for (let i = 0; i < meteors.length; i++) {
							if (meteors[i].key === obj.key) {
								scene.remove(meteors[i].mesh);
								meteors.splice(i, 1);
							}
						}
					}
				}, 80000);
			}
        }

		for (let i = 0; i < 1500; i ++) {
			let thisStar = new THREE.Mesh(new THREE.BoxGeometry(entierAleatoire(1,3), entierAleatoire(1,3), entierAleatoire(1,3)), whiteMaterial);
			thisStar.position.x = entierAleatoire(-2000, 2000);
			thisStar.position.y = entierAleatoire(-2000, 2000);
			thisStar.position.z = entierAleatoire(-2000, 2000);
			scene.add(thisStar);
		}

		var ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
		scene.add(ambientLight);
		
		let lights = [];
		for (let i = 0; i < 6; i++) {
			let light = new THREE.PointLight( 0xffffff, 0.65, 3000 );
			lights.push(light);
			scene.add( light );
		}
		lights[0].position.set(-1500,  0, 0);
		lights[1].position.set(1500,  0, 0);
		lights[2].position.set(0,  -1500, 0);
		lights[3].position.set(0,  1500, 0);
		lights[4].position.set(0,  0, -1500);
		lights[5].position.set(0,  0, 1500);
		var loader = new THREE.GLTFLoader();
		let prototypes = {};
		let loads = 0;

		loader.load( location.origin+'/jeux/touchade/'+"default"+'.glb', function ( gltf ) {
            // animations dans gltf.animations
			prototypes.default = gltf.scene;
			loads++;
			initPlayer();
		}, undefined, function ( error ) {console.error( error );} );
		
		loader.load( location.origin+'/jeux/touchade/'+"x_wing"+'.glb', function ( gltf ) {
            // animations dans gltf.animations
			prototypes.x_wing = gltf.scene;
			loads++;
			initPlayer();
		}, undefined, function ( error ) {console.error( error );} );

		loader.load( location.origin+'/jeux/touchade/'+"meteor"+'.glb', function ( gltf ) {
            // animations dans gltf.animations
			prototypes.meteor = gltf.scene;
			loads++;
			initPlayer();
		}, undefined, function ( error ) {console.error( error );} );

		loader.load( location.origin+'/jeux/touchade/'+"plane"+'.glb', function ( gltf ) {
            // animations dans gltf.animations
			prototypes.plane = gltf.scene;
			loads++;
			initPlayer();
		}, undefined, function ( error ) {console.error( error );} );

		loader.load( location.origin+'/jeux/touchade/'+"drone"+'.glb', function ( gltf ) {
            // animations dans gltf.animations
			prototypes.drone = gltf.scene;
			loads++;
			initPlayer();
		}, undefined, function ( error ) {console.error( error );} );
		
		function initPlayer() {
			if (loads === 5) {
				let skin = "default";
				player = prototypes[skin].clone();
				player.skin = skin;
				player.moveCoef = 0;
				player.hitbox = 30;
				player.dir = {
					x: 0,
					y: 0,
					z: 0
				};
				player.hp = -1;
				player.score = 0;
				player.alive = true;
				// player.position.set(500,500,500);
				player.position.set(spawnPos.x,spawnPos.y,spawnPos.z);
				cameraLock = true;
				scene.add( player );
				scene.add(camera);
				socket.emit("gameGenerated", {
					rx: 0,
					ry: 0,
					rz: 0,
					px: spawnPos.x,
					py: spawnPos.y,
					pz: spawnPos.z,
					skin: player.skin,
					score: 0
				}, password);
				startUpdate = true;
			}

			let meteorObj = {
                vx: (entierAleatoire(3,10)/10) * -1,
				vz: (entierAleatoire(3,10)/10) * -1,
				vy: [-1,1][entierAleatoire(0,1)] / entierAleatoire(10, 15),
                px: -3000,
				py: 0,
				pz: -3000,
				ry: 0,
				key: password+meteorsNum,
				spd: entierAleatoire(1, 10) / 10
			};
			meteorsNum++;
			socket.emit("meteor", meteorObj, password);
			nextMeteor.time = Date.now();
			nextMeteor.wait = entierAleatoire(10000,20000);
		}

        function tournerD(dt) {
			player.rotation.y -= 0.0015 * dt;
			
			if (player.rotation.z > (-1 * Math.PI / 8)) {
				player.rotation.z -= 0.0015 * dt;
			}
		}

		function tournerG(dt) {
			player.rotation.y += 0.0015 * dt;
			if (player.rotation.z < (Math.PI / 8)) {
				player.rotation.z += 0.0015 * dt;
			}
		}
		function tournerH(dt) {
			if (player.moveCoef > -0.25) {
				player.moveCoef -= 0.0003*dt;
			}
		}
		function tournerB(dt) {
			if (player.moveCoef < 0.25) {
				player.moveCoef += 0.0003*dt;
			}
		}

		function avancer(dt, bonusSpeed=1) {
			let semiX = Math.sin(player.rotation.y)/5;
			let translatX = semiX * dt;
			if (translatX < 0) {
				if (player.dir.x < (translatX*(-1))) {
					player.dir.x -= (semiX*bonusSpeed)/100 * (dt);
				}
			} else {
				if ((player.dir.x * (-1)) < translatX) {
					player.dir.x -= (semiX*bonusSpeed)/100 * (dt);
				}
			}
			let semiZ = Math.cos(player.rotation.y)/5;
			let translatZ = semiZ * dt;
			if (translatZ < 0) {
				if (player.dir.z < (translatZ*(-1))) {
					player.dir.z -= (semiZ*bonusSpeed)/100 * (dt);
				}
			} else {
				if ((player.dir.z * (-1)) < translatZ) {
					player.dir.z -= (semiZ*bonusSpeed)/100 * (dt);
				}
			}
		}

		function update(dt) {
            if (player !== false) {
                frames++;
                framesTotal += dt;
                if (key.go) {
                    avancer(dt)
                }
                if (key.right && key.looping === false) {
                    tournerD(dt);
                }
                if (key.left && key.looping === false) {
                    tournerG(dt);
                }
                if (key.up) {
					tay_to0 = false;
                    tournerH(dt);
                }
                if (key.down) {
					tay_to0 = false;
                    tournerB(dt);
				}
				if (key.down === false && key.up === false) {
					tay_to0 = true;
				}
				if (key.tirer && bonusDispo.machinegun) {
					fire("machine");
					bonusDispo.machinegun = false;
					setTimeout(()=>{
						bonusDispo.machinegun = true;
					}, 100);
				}
				if (key.snipe && bonusDispo.sniper) {
					fire("snipe");
					bonusDispo.sniper = false;
					timers.sniper = Date.now();
					setTimeout(()=>{
						bonusDispo.sniper = true;
					}, 1000);
				}

				if (key.acceleration && bonusDispo.accel) {
					let bonusCoef = 100;
					avancer(dt, bonusCoef);
					bonusDispo.accel = false;
					timers.accel = Date.now();
					setTimeout(()=>{
						bonusDispo.accel = true;
					},2000);
				}

				if (key.stabilisation) {
					tax_to0 = true;
					taz_to0 = true;
				} else {
					tax_to0 = false;
					taz_to0 = false;
				}

				if (key.looping) {
					if (player.alive) {
						if (key.right) {
							player.rotation.z -= (0.005 * dt);
							player.position.x -= (Math.sin(player.rotation.y - (Math.PI/2))/2.5 * dt);
							player.position.z -= (Math.cos(player.rotation.y - (Math.PI/2))/2.5 * dt);
						} else if (key.left) {
							player.rotation.z += (0.005 * dt);
							player.position.x += (Math.sin(player.rotation.y - (Math.PI/2))/2.5 * dt);
							player.position.z += (Math.cos(player.rotation.y - (Math.PI/2))/2.5 * dt);
						}
					}
				}

                for (let i = 0; i < bullets.length; i++) {
                    bullets[i].mesh.position.x -= bullets[i].x * dt;
                    bullets[i].mesh.position.z -= bullets[i].z * dt;
                    bullets[i].mesh.position.y += bullets[i].y * dt;
				}
				for (let i = 0; i < meteors.length; i++) {
                    meteors[i].mesh.position.x -= meteors[i].x * dt;
                    meteors[i].mesh.position.z -= meteors[i].z * dt;
					meteors[i].mesh.position.y += meteors[i].y * dt;
                }
                if (frames === 59) {
                    frames = 0;
                    document.getElementById("fps").innerHTML = "FPS : "+ Math.round(1000/(framesTotal/60));
                    framesTotal = 0;
                }
                
				player.dir.y = player.moveCoef * dt;
				
				if (player.alive) {
					player.position.x += player.dir.x * 3;
					player.position.y += player.dir.y * 3;
					player.position.z += player.dir.z * 3;

					if (player.position.x < -3000) {
						player.hp -= Math.ceil(dt/30);
					}
					if (player.position.y < -3000) {
						player.hp -= Math.ceil(dt/30);
					}
					if (player.position.z < -3000) {
						player.hp -= Math.ceil(dt/30);
					}
	
					if (player.position.x > 3000) {
						player.hp -= Math.ceil(dt/30);
					}
					if (player.position.y > 3000) {
						player.hp -= Math.ceil(dt/30);
					}
					if (player.position.z > 3000) {
						player.hp -= Math.ceil(dt/30);
					}
					if (player.hp < 0) {
						oldScore = player.score;
						player.score = 0;
					}
				}
				
				if (rz_to0) {
					if (player.rotation.z % (2 * Math.PI) < -0.14) {
						if (player.rotation.z % (2 * Math.PI) < (-1 * Math.PI)) {
							player.rotation.z -= 0.003 * dt;
						} else {
							player.rotation.z += 0.003 * dt;
						}
					} else if (player.rotation.z  % (2 * Math.PI) > 0.14) {
						if (player.rotation.z % (2 * Math.PI) < Math.PI) {
							player.rotation.z -= 0.003 * dt;
						} else {
							player.rotation.z += 0.003 * dt;
						}
					} else {
						player.rotation.z = 0;
						rz_to0 = false;
					}
				}
				if (tay_to0) {
					if (player.moveCoef < -0.06) {
						player.moveCoef += 0.00015 * dt;
					} else if (player.moveCoef > 0.06) {
						player.moveCoef -= 0.00015 * dt;
					} else {
						player.moveCoef = 0;
						tay_to0 = false;
					}
				}
				if (tax_to0) {
					if (player.dir.x < -0.09) {
						player.dir.x += 0.0035 * dt;
					} else if (player.dir.x > 0.06) {
						player.dir.x -= 0.0015 * dt;
					} else {
						player.dir.x = 0;
						tax_to0 = false;
					}
				}
				if (taz_to0) {
					if (player.dir.z < -0.09) {
						player.dir.z += 0.0035 * dt;
					} else if (player.dir.z > 0.06) {
						player.dir.z -= 0.0015 * dt;
					} else {
						player.dir.z = 0;
						taz_to0 = false;
					}
				}

				if (player.alive) {
					for (let i = 0; i < collidable.length; i++) {
						if (collidable[i].mesh.position.x < player.position.x +player.hitbox+collidable[i].hitbox &&
						collidable[i].mesh.position.x > player.position.x -player.hitbox-collidable[i].hitbox) {
							if (collidable[i].mesh.position.y < player.position.y +player.hitbox+collidable[i].hitbox &&
							collidable[i].mesh.position.y > player.position.y -player.hitbox-collidable[i].hitbox) {
								if (collidable[i].mesh.position.z < player.position.z +player.hitbox+collidable[i].hitbox &&
								collidable[i].mesh.position.z > player.position.z -player.hitbox-collidable[i].hitbox) {
									player.hp -= 251;
									player.dir.x *= -1;
									player.dir.z *= -1;
									player.moveCoef *= -1;
									if (player.hp < 0) {
										oldScore = player.score;
										player.score = 0;
									}
								}
							}
						}
					}
					for (let i = 0; i < bullets.length; i++) {
						if (bullets[i].id !== password) {
							if (bullets[i].mesh.position.x < player.position.x +player.hitbox+bullets[i].hitbox &&
								bullets[i].mesh.position.x > player.position.x -player.hitbox-bullets[i].hitbox) {
								if (bullets[i].mesh.position.y < player.position.y +player.hitbox+bullets[i].hitbox &&
								bullets[i].mesh.position.y > player.position.y -player.hitbox-bullets[i].hitbox) {
									if (bullets[i].mesh.position.z < player.position.z +player.hitbox+bullets[i].hitbox &&
									bullets[i].mesh.position.z > player.position.z -player.hitbox-bullets[i].hitbox) {
										player.hp -= dt * bullets[i].dmg;
										if (player.hp < 0) {
											socket.emit("deadFrom", {id: bullets[i].id, score: player.score / 2}, password);
											oldScore = player.score;
											player.score = 0;
										}
									}
								}
							}
						}
						for (let m = 0; m < meteors.length; m ++) {
							if (bullets[i].mesh.position.x < meteors[m].mesh.position.x +meteors[m].hitbox+bullets[i].hitbox &&
								bullets[i].mesh.position.x > meteors[m].mesh.position.x -meteors[m].hitbox-bullets[i].hitbox) {
								if (bullets[i].mesh.position.y < meteors[m].mesh.position.y +meteors[m].hitbox+bullets[i].hitbox &&
								bullets[i].mesh.position.y > meteors[m].mesh.position.y -meteors[m].hitbox-bullets[i].hitbox) {
									if (bullets[i].mesh.position.z < meteors[m].mesh.position.z +meteors[m].hitbox+bullets[i].hitbox &&
									bullets[i].mesh.position.z > meteors[m].mesh.position.z -meteors[m].hitbox-bullets[i].hitbox) {
										meteors[m].hp -= dt * bullets[i].dmg;
										if (meteors[m].hp < 0) {
											if (bullets[i].id === password) {
												player.score ++;
												player.hp += 40;
											}
											if (player.hp > 600) {
												player.hp = 600;
											}
											scene.remove(meteors[m].mesh);
											for (let x = 0; x < collidable.length; x++) {
												if (collidable[x].key === meteors[m].key) {
													collidable.splice(x, 1);
												}
											}
											meteors.splice(m, 1);
										}
									}
								}
							}
						}
					}
				}
				colliTest.rotation.y += 0.0015 * dt;
				for (let i = 0; i < meteors.length; i ++) {
					meteors[i].mesh.rotation.y += 0.0015 * dt;
					meteors[i].mesh.rotation.z += 0.0015 * dt;
				}
				if (player.alive) {
					if (player.hp < 0) {
						if (dispo) {
							document.getElementById("dead").style.visibility = "visible";
							document.getElementById("dead").style.left = (innerWidth/2) - (document.getElementById("dead").offsetWidth/2) + "px";
							document.getElementById("dead").style.top = (innerHeight/2) - (document.getElementById("dead").offsetHeight/2) + "px";
							document.getElementById("hp").style.width = 0 + "px";
							player.alive = false;
						} else {
							player.hp = -1;
						}
						player.position.set(0, 0, -6000);
					}
				}
				document.getElementById("protect").innerHTML = "Champ de protection : "+ player.hp+"/500";
				document.getElementById("score").innerHTML = "Score : "+ (player.alive?player.score : oldScore);
				const hpVisu = document.getElementById("hp");
				hpVisu.style.width = player.hp + "px";
				hpVisu.style.left = (innerWidth/2) - (player.hp/2) + "px";
				let visualTimers = document.getElementsByClassName("timers");
				for (let i = 0; i < visualTimers.length; i++) {
					let time2wait = 0;
					switch (visualTimers[i].innerHTML) {
						case "Sniper":
							if (bonusDispo.sniper === false) {
								time2wait = 1000;
								let scd = Date.now() - timers.sniper;
								let percent = (scd/time2wait)*100;
								visualTimers[i].style.width = Math.round(percent) + "px";
							} else {
								visualTimers[i].style.width = "100px";
							}
						break;
						case "Acceleration":
							if (bonusDispo.accel === false) {
								time2wait = 2000;
								let scd = Date.now() - timers.accel;
								let percent = (scd/time2wait)*100;
								visualTimers[i].style.width = Math.round(percent) + "px";
							} else {
								visualTimers[i].style.width = "100px";
							}
						break;
					}
				}
				if (nextMeteor.time !== 0 && nextMeteor.wait !== 0) {
					if (nextMeteor.time + nextMeteor.wait < Date.now()) {
						nextMeteor.time = Date.now();
						nextMeteor.wait = entierAleatoire(5000,10000);
						let meteorObj = {
							vx: (entierAleatoire(3,10)/10) * -1,
							vz: (entierAleatoire(3,10)/10) * -1,
							vy: [-1,1][entierAleatoire(0,1)] / entierAleatoire(10, 15),
							px: -3000,
							py: 0,
							pz: -3000,
							ry: 0,
							key: password+meteorsNum,
							spd: entierAleatoire(1, 10) / 10
						};
						meteorsNum++;
						socket.emit("meteor", meteorObj, password);
					}
				}
            }
		}
		let interval = setInterval(()=>{
			if (startUpdate && player !== false) {
				let updateObj = {
					rx: player.rotation.x,
					ry: player.rotation.y,
					rz: player.rotation.z,
					px: player.position.x,
					py: player.position.y,
					pz: player.position.z,
					skin: player.skin,
					score: player.score
				};
				if (pingB) {
					pingB = false;
					pingTime = Date.now();
				}
				socket.emit("update", updateObj, password);
			}
		}, 40);

        let controller = function(type, action, psd, obj) {
            if (type === 0) {
                switch (action) {
					case "leaderboard":
						let newObj = [];
						for (let key in obj) {
							newObj.push({
								name: key,
								score: obj[key]
							});
						}
						newObj.sort((a,b)=>{
							return  b.score - a.score; // tri decroissant
						});
						let limite = newObj.length;
						if (limite > 5) {
							limite = 5;
						}
						document.getElementById("leaderboard").innerHTML = ""; 
						for (let i = 0; i < limite; i++) {
							document.getElementById("leaderboard").appendChild(document.createTextNode(`${i+1}. ${newObj[i].name} : ${newObj[i].score}`));
							document.getElementById("leaderboard").appendChild(document.createElement("br"));
						}
					break;
					case "undeadme":
						player.alive = true;
						player.dir.x = 0;
						player.dir.y = 0;
						player.moveCoef = 0;
						document.getElementById("dead").style.visibility = "hidden";
						let spawnPosAfterDie = {
							x: entierAleatoire(-1500, 1500),
							y: entierAleatoire(-1500, 1500),
							z: entierAleatoire(-1500, 1500)
						};
						player.hp = 500;
						player.score = 0;
						player.position.x = spawnPosAfterDie.x;
						player.position.y = spawnPosAfterDie.y;
						player.position.z = spawnPosAfterDie.z;
						player.dir = {
							x: 0,
							y: 0,
							z: 0
						};
					break;
					case "deadFrom":
						if (obj.id === password) {
							player.score += (5+Math.ceil(obj.score));
						}
					break;
                    case "shot":
                        shot(obj);
					break;
					case "meteor":
                        newMeteor(obj);
					break;
					case "delete":
						if (others.hasOwnProperty(obj)) {
							scene.remove(others[obj]);
							delete(others[obj]);
							for (let i = 0; i < collidable.length; i++) {
								if (collidable[i].key === obj) {
									collidable.splice(i, 1);
								}
							}
						}
					break;
                }
            } else if (type === 1) {
                if (psd === password) {
                    switch (action) {
						case "update":
							if (pingB === false) {
								ping.push(Date.now() - pingTime);
								pingB = true;
								pingTime = 0;
								if (ping.length === 40) {
									let total = 0;
									for (let i = 0; i < ping.length; i++) {
										total += ping[i];
									}
									document.getElementById("ping").innerHTML = "Ping : "+ (Math.round(total/40));
									ping.length = 0;
								}
							}
                            for (let key in obj) {
                                if (key !== password) {
                                    if (others.hasOwnProperty(key)) {
                                        others[key].position.x = obj[key].px;
                                        others[key].position.y = obj[key].py;
                                        others[key].position.z = obj[key].pz;
                                        others[key].rotation.x = obj[key].rx;
                                        others[key].rotation.y = obj[key].ry;
                                        others[key].rotation.z = obj[key].rz;
                                    } else {
										let skin = obj[key].skin;
										if (prototypes.hasOwnProperty(skin) === false) {
											skin = "default";
										}
                                        let newChallenger = prototypes[skin].clone();
                                        newChallenger.position.x = obj[key].px;
                                        newChallenger.position.y = obj[key].py;
                                        newChallenger.position.z = obj[key].pz;
                                        newChallenger.rotation.x = obj[key].rx;
                                        newChallenger.rotation.y = obj[key].ry;
                                        newChallenger.rotation.z = obj[key].rz;
                                        scene.add(newChallenger);
										others[key] = newChallenger;
										let newHitbox = 30;
										if (skin === "meteor") {
											newHitbox = 48;
										}
										collidable.push({mesh: newChallenger, hitbox: newHitbox, key: key});
                                    }
                                }
                            }
						break;
						case "changeSkin":
							if (prototypes.hasOwnProperty(obj)) {
								scene.remove(player);
								console.log(obj);
								player = prototypes[obj].clone();
								player.skin = obj;
								player.moveCoef = 0;
								player.hitbox = 30;
								player.dir = {
									x: 0,
									y: 0,
									z: 0
								};
								player.hp = -1;
								player.score = 0;
								player.alive = true;
								player.position.set(spawnPos.x,spawnPos.y,spawnPos.z);
								scene.add(player);
								socket.emit("destroyMe");
								socket.emit("gameGenerated", {
									rx: 0,
									ry: 0,
									rz: 0,
									px: spawnPos.x,
									py: spawnPos.y,
									pz: spawnPos.z,
									skin: player.skin,
									score: 0
								}, password);
							}
						break;
                    }
                }
            }
        }
        return controller;
}