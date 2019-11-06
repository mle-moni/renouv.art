const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const miniCanvas = document.getElementById("miniCanvas");
const minimap = miniCanvas.getContext("2d");

function	degToRad(deg) {
	return (deg * (Math.PI / 180));
}

function	radToDeg(rad) {
	return (rad * (180 / Math.PI))
}

class Map {
	constructor () {
		this.walls = [
			[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
			[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
		];
		this.tileSize = 32;
		this.NUM_COLLS = this.walls[0].length;
		this.NUM_ROWS = this.walls.length;
		miniCanvas.width = this.NUM_COLLS * this.tileSize;
		miniCanvas.height = this.NUM_ROWS * this.tileSize;
		this.distanceToPjtPlane = (canvas.width / 2) / Math.tan(Math.PI / 6);
	}
	display() {
		minimap.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
		miniCanvas.width = this.NUM_COLLS * this.tileSize;
		miniCanvas.height = this.NUM_ROWS * this.tileSize;
		for (let y = 0; y < this.NUM_ROWS; y++) {
			for (let x = 0; x < this.NUM_COLLS; x++)
			{
				if (this.walls[y][x] == 1)
				{
					minimap.fillStyle = "blue";
					minimap.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
				}
			}
		}
	}
	render(player) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.display();
		player.display(this);
		castAll(player);
		for (let x = 0; x < this.walls[0].length; x++) {
			minimap.strokeStyle = "white";
			minimap.beginPath();
			minimap.moveTo(x * this.tileSize, 0);
			minimap.lineTo(x * this.tileSize, miniCanvas.height);
			minimap.stroke();
		}
		for (let y = 0; y < this.walls.length; y++) {
			minimap.strokeStyle = "white";
			minimap.beginPath();
			minimap.moveTo(0, y * this.tileSize);
			minimap.lineTo(miniCanvas.width, y * this.tileSize);
			minimap.stroke();
		}
	}
	isInWall(x, y) {
		let posX = Math.floor(x / this.tileSize);
		let posY = Math.floor(y / this.tileSize);

		if (this.walls[posY][posX] == 1)
			return (1);
		return (0);
	}
}

class Player {
	constructor (x, y, tileSize) {
		this.x = x * tileSize + (tileSize / 2);
		this.y = y * tileSize + (tileSize / 2);
		this.angle = 0; //rad
		this.tileSize = tileSize;
	}
	right(walls) {
		this.angle -= 0.1;
		this.angle %= 2 * Math.PI;
		if (this.angle < 0)
			this.angle += Math.PI * 2;
	}
	left(walls) {
		this.angle += 0.1;
		this.angle %= 2 * Math.PI;
	}
	forward(walls) {
		let nextX = this.x + Math.cos(this.angle) * this.tileSize / 7;
		let nextY = this.y - Math.sin(this.angle) * this.tileSize / 7;
		if (this.is_hitting(walls, nextX, nextY))
			return ;
		this.x = nextX;
		this.y = nextY;
	}
	backward(walls) {
		let nextX = this.x - Math.cos(this.angle) * this.tileSize / 7;
		let nextY = this.y + Math.sin(this.angle) * this.tileSize / 7;
		if (this.is_hitting(walls, nextX, nextY))
			return ;
		this.x = nextX;
		this.y = nextY;
	}
	move(touches, walls) {
		if (touches.up)
			this.forward(walls);
		if (touches.down)
			this.backward(walls);
		if (touches.left)
			this.left(walls);
		if (touches.right)
			this.right(walls);
	}
	is_hitting(walls, x, y) {
		let nextX = Math.floor(x / this.tileSize);
		let nextY = Math.floor(y / this.tileSize);

		if (walls[nextY][nextX] == 1)
			return (1);
		return (0);
	}
	display(world) {
		// console.log(player.angle)
		player.move(touches, world.walls);
		player.tileSize = this.tileSize;
		minimap.fillStyle = "red";
		minimap.beginPath();
		minimap.arc(player.x, player.y, this.tileSize / 8, 0, Math.PI * 2);
		minimap.fill();
		minimap.strokeStyle = "red";
		minimap.strokeWidth = "5px";
		minimap.beginPath();
		minimap.moveTo(player.x, player.y);
		minimap.lineTo(player.x + Math.cos(player.angle) * player.tileSize, player.y - Math.sin(player.angle) * player.tileSize);
		minimap.stroke();
	}
}

function drawRay(player, x, y) {
	minimap.strokeStyle = "yellow";
	minimap.beginPath();
	minimap.moveTo(player.x, player.y);
	minimap.lineTo(x, y);
	minimap.stroke();
}

class CastVars {
	constructor (angle) {
		this.angle = angle;
		this.xintercept = 0;
		this.yintercept = 0;
		this.distance = 0;
		this.wallHitX = 0;
		this.wallHitY = 0;
		this.xstep = 0;
		this.ystep = 0;
		this.repX = -42;
		this.repY = -42;
		this.distance = -42;
		this.faceDown = angle > Math.PI;
		this.faceUp = !this.faceDown;
		this.faceLeft = angle < Math.PI + (Math.PI / 2) && angle > Math.PI / 2;
		this.faceRight = !this.faceLeft;
	}
	setHoriz(angle) {
		let zone;
	
		this.ystep = world.tileSize;
		if (this.faceUp && this.faceLeft) {
			angle = angle - (Math.PI / 2);
			this.angle = angle;
			this.yintercept = Math.floor(player.y / world.tileSize) * world.tileSize;
			this.xintercept = player.x - ((player.y - this.yintercept) * Math.tan(angle));
			this.xstep = (world.tileSize * Math.tan(angle));
			this.xstep *= -1; // BONNNNNNN
		} else if (this.faceDown && this.faceLeft) {
			angle = angle - Math.PI;
			this.angle = angle;
			this.yintercept = Math.floor(player.y / world.tileSize) * world.tileSize + world.tileSize;
			this.xintercept = player.x + ((player.y - this.yintercept) / Math.tan(angle));
			this.xstep = (world.tileSize / Math.tan(angle));
			this.xstep *= -1;
			this.ystep *= -1;
		} else if (this.faceDown && this.faceRight) {
			angle = (angle - Math.PI) - (Math.PI / 2);
			this.angle = angle;
			this.yintercept = Math.floor(player.y / world.tileSize) * world.tileSize + world.tileSize;
			this.xintercept = player.x + (Math.tan(angle) * (this.yintercept - player.y));
			
			this.xstep = (world.tileSize * Math.tan(angle));
			this.ystep *= -1;
		} else {
			this.yintercept = Math.floor(player.y / world.tileSize) * world.tileSize; //bon
			this.xintercept = player.x + ((player.y - this.yintercept) / Math.tan(angle)); // BON !!!!
			this.xstep = (world.tileSize / Math.tan(angle));
		}
	}
	setVerti(angle) {
		let zone;
	
		this.xstep = world.tileSize;
		if (this.faceUp && this.faceLeft) {
			angle = angle - (Math.PI / 2);
			this.angle = angle;
			this.xintercept = Math.ceil(player.x / world.tileSize) * world.tileSize - world.tileSize;
			this.yintercept = player.y - (player.x - this.xintercept) / Math.tan(angle) ;
			
			this.ystep = (world.tileSize / Math.tan(angle));
			this.xstep *= -1;
		} else if (this.faceDown && this.faceLeft) {
			angle = angle - Math.PI;
			this.angle = angle;
			this.xintercept = Math.ceil(player.x / world.tileSize) * world.tileSize - world.tileSize;
			this.yintercept = player.y - Math.tan(angle) * (this.xintercept - player.x);
			this.ystep = (world.tileSize * Math.tan(angle));

			this.xstep *= -1;
			this.ystep *= -1;
		} else if (this.faceDown && this.faceRight) {
			angle = (angle - Math.PI) - (Math.PI / 2);
			this.angle = angle;
			this.xintercept = Math.ceil(player.x / world.tileSize) * world.tileSize;
			this.yintercept = player.y + (this.xintercept - player.x) / Math.tan(angle);
			
			this.ystep = (world.tileSize / Math.tan(angle));
			this.ystep *= -1;
		} else {
			this.xintercept = Math.ceil(player.x / world.tileSize) * world.tileSize;
			this.yintercept = player.y - Math.tan(angle) * (this.xintercept - player.x);
			
			this.ystep = (world.tileSize * Math.tan(angle));
		}
	}
}

function getDistance(x, y, castVars) {
	if (castVars.faceUp && castVars.faceLeft) {
		return (Math.abs(player.x - x) / Math.sin(castVars.angle));
	} else if (castVars.faceDown && castVars.faceLeft) {
		return (Math.abs(player.x - x) / Math.cos(castVars.angle));
	} else if (castVars.faceDown && castVars.faceRight) {
		return (Math.abs(player.x - x) / Math.sin(castVars.angle));
	} else {
		return (Math.abs(player.x - x) / Math.cos(castVars.angle));
	}
}

function findHorizontal(castVars, angle) {
	
	castVars.setHoriz(angle);
	let nextInterX = castVars.xintercept;
	let nextInterY = castVars.yintercept;
	
	while (nextInterX > 0 && nextInterX < miniCanvas.width && nextInterY > 0 && nextInterY < miniCanvas.height) {
		// minimap.fillStyle = "green";
		// minimap.beginPath();
		// minimap.arc(nextInterX, nextInterY, 6, 0, Math.PI * 2);
		// minimap.fill();
		// drawRay(player, nextInterX, nextInterY);
		let test = (castVars.faceDown) ? 1 : -1;
		if (world.isInWall(nextInterX, nextInterY + test)) {
			castVars.repX = nextInterX;
			castVars.repY = nextInterY;
			castVars.distance = getDistance(nextInterX, nextInterY, castVars);
			break ;
		} else {
			nextInterX += castVars.xstep;
			nextInterY -= castVars.ystep;
		}
	}
}

function findVertical(castVars, angle) {
	
	castVars.setVerti(angle);
	let nextInterX = castVars.xintercept;
	let nextInterY = castVars.yintercept;
	let distance;
	
	while (nextInterX > 0 && nextInterX < miniCanvas.width && nextInterY > 0 && nextInterY < miniCanvas.height) {
		// minimap.fillStyle = "red";
		// minimap.beginPath();
		// minimap.arc(nextInterX, nextInterY, 6, 0, Math.PI * 2);
		// minimap.fill();
		// drawRay(player, nextInterX, nextInterY);
		let test = (castVars.faceRight) ? 1 : -1;
		if (world.isInWall(nextInterX + test, nextInterY)) {
			distance = getDistance(nextInterX, nextInterY, castVars); 
			if (castVars.distance < 0 || (castVars.distance >= 0 && castVars.distance > distance))
			{
				castVars.repX = nextInterX;
				castVars.repY = nextInterY;
				castVars.distance = distance;
			}
			break ;
		} else {
			nextInterX += castVars.xstep;
			nextInterY -= castVars.ystep;
		}
	}
}

function antiFish(castVars, rayAngle) {
	// if (castVars.faceUp && castVars.faceLeft) {
	// 	return (Math.abs(player.x - x) / Math.sin(castVars.angle));
	// } else if (castVars.faceDown && castVars.faceLeft) {
	// 	return (Math.abs(player.x - x) / Math.cos(castVars.angle));
	// } else if (castVars.faceDown && castVars.faceRight) {
	// 	return (Math.abs(player.x - x) / Math.sin(castVars.angle));
	// } else {
	// 	return (Math.abs(player.x - x) / Math.cos(castVars.angle));
	// }
	return (castVars.distance * Math.cos(Math.abs(player.angle - rayAngle)));
}

function rayCast(column, player, angle) {
	angle %= (2 * Math.PI);
	if (angle < 0)
		angle += 2 * Math.PI;
	
	const castVars = new CastVars(angle);
	findHorizontal(castVars, angle);
	findVertical(castVars, angle);
	// console.log(`rep x = ${castVars.repX} rep y = ${castVars.repY} distance is ${castVars.distance}`);
	if (castVars.repX >= 0 && castVars.repY >= 0)
	{
		drawRay(player, castVars.repX, castVars.repY);
		// draw walls
		const realDistance = antiFish(castVars, angle);
		let wallVisionHeight = (world.tileSize / realDistance) * world.distanceToPjtPlane;
		let color = (realDistance * 255) / (world.tileSize * 12);
		ctx.fillStyle = `RGB(${color}, ${color}, ${color})`;
		ctx.fillRect(canvas.width - column, (canvas.height / 2) - (wallVisionHeight / 2), 1, wallVisionHeight);
	}
}

function castAll(player) {
	let column = 0;
	let angle = (player.angle - (Math.PI / 6)) % (2 * Math.PI);
	// let angle = player.angle;
	if (angle < 0)
		angle += 2 * Math.PI;
	// rayCast(column, player, player.angle); //tests only
	while (column < canvas.width) {
		rayCast(column, player, angle);
		angle += (Math.PI / 3) / canvas.width;
		column++;
	}
}

const world = new Map();
const player = new Player(2, 4, world.tileSize);

setInterval(()=>{
	world.render(player);
}, 50);