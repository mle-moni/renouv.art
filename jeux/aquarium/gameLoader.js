
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

    const renderer = new THREE.WebGLRenderer({antialias:true, alpha: true});
	renderer.setSize(WIDTH-4, HEIGHT-4);
	renderer.setClearColor(0x0000ff, 0.5);
	document.body.appendChild(renderer.domElement);

	const scene = new THREE.Scene();

	const camera = new THREE.PerspectiveCamera(70, WIDTH/HEIGHT, 0.1, 100000);

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
	const blueArr = [
		new THREE.MeshBasicMaterial({color: 0x0000FF}),
		new THREE.MeshBasicMaterial({color: 0x4F98E6}),
		new THREE.MeshBasicMaterial({color: 0x441DDD}),
		new THREE.MeshBasicMaterial({color: 0x6447DA})
	];
	const blueMaterial = new THREE.MeshBasicMaterial({color: 0x0000FF});
	const whiteMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF});

	const bulleArr = [
		new THREE.SphereGeometry( 1, 32, 32 ),
		new THREE.SphereGeometry( 2, 32, 32 ),
		new THREE.SphereGeometry( 3, 32, 32 ),
	];
	
	function fire(num) {
		let obj = {
			vx: (-Math.sin(player.rotation.y) + (entierAleatoire(-5, 5)/10))/50,
			vz: (-Math.cos(player.rotation.y) + (entierAleatoire(-5, 5)/10))/50,
			vy: (player.moveCoef + (entierAleatoire(-5, 5)/10)) /50,
			px: player.position.x +( Math.cos(player.rotation.y) *num),
			pz: player.position.z -( Math.sin(player.rotation.y) *num),
			py: player.position.y-7,
			ry: player.rotation.y,
			id: password
		};
		if (player.alive) {
			let bulletMaterial = blueArr[entierAleatoire(0, blueArr.length-1)];
			let bulletGeo = bulleArr[entierAleatoire(0, bulleArr.length-1)];
			let bulletSpd = 5;
			let bulletHitbox = 10;
			let bulletDmg = 4;
			bullets.push({
				id: obj.id, 
				mesh: new THREE.Mesh ( bulletGeo, bulletMaterial), 
				x: obj.vx*bulletSpd, 
				z: obj.vz*bulletSpd,
				y: obj.vy*bulletSpd, 
				hitbox: bulletHitbox, 
				dmg: bulletDmg
			});
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
	function shot(obj) {
		
	}
	
	function newMeteor(obj, fishSkin) {
		if (player !== false) {
			meteors.push({
				id: obj.id, 
				mesh: prototypes[fishSkin].clone(),
				x: obj.vx*obj.spd,
				z: obj.vz*obj.spd,
				y: obj.vy*obj.spd, 
				hitbox: 20, dmg: 300,
				hp: 100, 
				key: obj.key,
				spd: entierAleatoire(1, 10),
				lastR: 0
			});
			meteors[meteors.length-1].mesh.position.x = obj.px;
			meteors[meteors.length-1].mesh.position.z = obj.pz;
			meteors[meteors.length-1].mesh.position.y = obj.py;
			scene.add(meteors[meteors.length-1].mesh);
			collidable.push({mesh: meteors[meteors.length-1].mesh, hitbox: 48, key: obj.key});
		}
	}

	// for (let i = 0; i < 1500; i ++) {
	// 	let thisStar = new THREE.Mesh(new THREE.BoxGeometry(entierAleatoire(1,3), entierAleatoire(1,3), entierAleatoire(1,3)), whiteMaterial);
	// 	thisStar.position.x = entierAleatoire(-2000, 2000);
	// 	thisStar.position.y = entierAleatoire(-2000, 2000);
	// 	thisStar.position.z = entierAleatoire(-2000, 2000);
	// 	scene.add(thisStar);
	// }

	var ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
	scene.add(ambientLight);
	
	let lights = [];
	for (let i = 0; i < 8; i++) {
		let light = new THREE.PointLight( 0xffffff, 0.75, 3000 );
		light.position.set(entierAleatoire(0, 3000), entierAleatoire(0, 3000), entierAleatoire(0, 3000));
		lights.push(light);
		scene.add( light );
	}

	var loader = new THREE.GLTFLoader();
	let prototypes = {};
	let loads = 0;

	loader.load( location.origin+'/jeux/aquarium/'+"default"+'.glb', function ( gltf ) {
		// animations dans gltf.animations
		prototypes.default = gltf.scene;
		loads++;
		document.getElementById("enter").innerHTML = "Chargement : "+ "étape " + loads + "/5";
		initPlayer();
	}, undefined, function ( error ) {console.error( error );} );
	

	loader.load( location.origin+'/jeux/aquarium/'+"fish1"+'.glb', function ( gltf ) {
		// animations dans gltf.animations
		prototypes.meteor = gltf.scene;
		loads++;
		document.getElementById("enter").innerHTML = "Chargement : "+ "étape " + loads + "/5";
		initPlayer();
	}, undefined, function ( error ) {console.error( error );} );

	loader.load( location.origin+'/jeux/aquarium/'+"fish2"+'.glb', function ( gltf ) {
		// animations dans gltf.animations
		prototypes.fish2 = gltf.scene;
		loads++;
		document.getElementById("enter").innerHTML = "Chargement : "+ "étape " + loads + "/5";
		initPlayer();
	}, undefined, function ( error ) {console.error( error );} );

	loader.load( location.origin+'/jeux/aquarium/'+"fish3"+'.glb', function ( gltf ) {
		// animations dans gltf.animations
		prototypes.fish3 = gltf.scene;
		loads++;
		document.getElementById("enter").innerHTML = "Chargement : "+ "étape " + loads + "/5";
		initPlayer();
	}, undefined, function ( error ) {console.error( error );} );

	
	
	function initPlayer() {
		if (loads === 4) {
			document.getElementById("enter").innerHTML = "Chargement : "+ "encore un tout petit peu :/";
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
			player.position.set(1500,1500,1500);
			//player.position.set(spawnPos.x,spawnPos.y,spawnPos.z);
			cameraLock = true;
			scene.add( player );
			scene.add(camera);
			startUpdate = true;
		}

		for (let i = 0; i < 100; i ++) {
			let meteorObj = {
				vx: (entierAleatoire(1,6)/10) * -1,
				vz: (entierAleatoire(1,6)/10) * -1,
				vy: [-1,1][entierAleatoire(0,1)] / entierAleatoire(10, 15),
				px: entierAleatoire(0, 3000),
				py: entierAleatoire(0, 3000),
				pz: entierAleatoire(0, 3000),
				ry: 0,
				key: password+meteorsNum,
				spd: entierAleatoire(1, 10) / 10
			};
			meteorsNum++;
			
			newMeteor(meteorObj, ["meteor", "fish2", "fish3"][entierAleatoire(0, 2)]);
		}
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
		fire(-13);
		fire(13);
	}

	function update(dt) {
		if (player !== false) {
			if (!rdy) {
				rdy = true;
				document.getElementById("enter").innerHTML = "Chargement terminé !";
			}
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
				bonusDispo.machinegun = false;
				setTimeout(()=>{
					bonusDispo.machinegun = true;
				}, 100);
			}
			if (key.snipe && bonusDispo.sniper) {
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
				meteors[i].mesh.position.x -= Math.sin(meteors[i].mesh.rotation.y) * dt/meteors[i].spd;
				meteors[i].mesh.position.z -= Math.cos(meteors[i].mesh.rotation.y) * dt/meteors[i].spd;
				meteors[i].mesh.position.y += meteors[i].y * dt;
				if (entierAleatoire(0, 50)%10 === 0) {
					meteors[i].mesh.rotation.y += [0.1, -0.1][Date.now()%2];
				}
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
					player.position.x = 3000;
				}
				if (player.position.y < -3000) {
					player.position.y = 3000;
				}
				if (player.position.z < -3000) {
					player.position.z = 3000;
				}

				if (player.position.x > 3000) {
					player.position.x = 0;
				}
				if (player.position.y > 3000) {
					player.position.y = 0;
				}
				if (player.position.z > 3000) {
					player.position.z = 0;
				}
			}

			for (let i = 0; i < meteors.length; i++) {
				
				if (meteors[i].mesh.position.x < 0) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
				}
				if (meteors[i].mesh.position.y < 0) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
				}
				if (meteors[i].mesh.position.z < 0) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
				}

				if (meteors[i].mesh.position.x > 3000) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
				}
				if (meteors[i].mesh.position.y > 3000) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
				}
				if (meteors[i].mesh.position.z > 3000) {
					if (meteors[i].lastR+700 < Date.now()) {
						meteors[i].lastR = Date.now();
						meteors[i].mesh.rotation.y += Math.PI;
					}
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
								player.dir.x *= -0.4;
								player.dir.z *= -0.4;
								player.moveCoef *= -0.1;
								if (collidable[i].lastR+700 < Date.now()) {
									collidable[i].lastR = Date.now();
									collidable[i].mesh.rotation.y += entierAleatoire(20, 43)/10;
								}
							}
						}
					}
				}
			}
			// for (let i = 0; i < meteors.length; i ++) {
			// 	meteors[i].mesh.rotation.y += 0.0015 * dt;
			// 	meteors[i].mesh.rotation.z += 0.0015 * dt;
			// }
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
		}
	}, 40);

	let controller = function(type, action, psd, obj) {
		if (type === 0) {
			switch (action) {
				case "undeadme":
					player.alive = true;
					player.dir.x = 0;
					player.dir.y = 0;
					player.moveCoef = 0;
					player.hp = 500;
					player.score = 0;
					player.position.set(1500, 1500, 1500);
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
							player.position.set(1500, 1500, 1500);
							scene.add(player);
						}
					break;
				}
			}
		}
	}
	return controller;
}