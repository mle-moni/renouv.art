class Motor {
    constructor (canvas, w, h) {
        this.canvas = canvas;
        this.w = w;
        this.h = h;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = w * 32;
        this.canvas.height = h * 32;
        this.canvas.style.left = (innerWidth / 2 - this.canvas.width / 2) + "px";
        this.canvas.style.top = (innerHeight / 2 - this.canvas.height / 2) + "px";
        this.grid = this.genGrid(this.w, this.h);
        this.player = {
            x: entierAleatoire(0, w - 1),
            y: entierAleatoire(0, h - 1)
        };
        this.target = {
            x: entierAleatoire(0, w - 1),
            y: entierAleatoire(0, h - 1)
        };
        this.cursor = {
            x: 0,
            y: 0
        };
        this.pathFound = false;
        this.WALLS = -10;
        this.renderer = this.render();
    }
    render() {
        return setInterval(()=>{
            this.ctx.clearRect(0, 0, this.w * 32, this.h * 32);
            this.ctx.fillStyle = "antiquewhite";
            this.ctx.fillRect(0, 0, this.w * 32, this.h * 32);
            this.drawColums();
            this.drawRows();
            this.drawNums();
            this.drawWalls();
            this.drawTargets();
            if (this.pathFound) {
                this.colorPath(this.target);
            }
        }, 100);
    }
    drawColums() {
        for (let i = 1; i < this.w; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 32, 0);
            this.ctx.lineTo(i * 32, this.h * 32);
            this.ctx.stroke();
        }
    }
    drawRows() {
        for (let i = 1; i < this.h; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * 32);
            this.ctx.lineTo(this.w * 32, i * 32);
            this.ctx.stroke();
        }
    }
    genGrid(w, h) {
        const grid = [];
        for (let j = 0; j < h; j++) {
            grid.push(new Int16Array(w));
            for (let i = 0; i < w; i++)
                grid[j][i] = -1;
        }
        return (grid);
    }
    drawNums() {
        const grid = this.grid;
        const fontSize = 32 / 2;

        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                let number = grid[j][i];

                this.ctx.font = fontSize + "px Courier New";
                this.ctx.fillStyle = "red";
                this.ctx.fillText("" + number, (i * 32 + 32 / 2) - (getNumExtraDigits(number) * fontSize / 2),
                (j * 32 + 32 / 2));
            }
        }
    }
    drawTargets() {
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(this.player.x * 32 + 1, this.player.y * 32 + 1, 30, 30);
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(this.target.x * 32 + 1, this.target.y * 32 + 1, 30, 30);
        this.ctx.fillStyle = "rgba(0,0,0,0.3)";
        this.ctx.fillRect(this.cursor.x * 32 + 1, this.cursor.y * 32 + 1, 30, 30);
    }
    drawWalls() {
        this.ctx.fillStyle = "black";
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                if (this.grid[j][i] == this.WALLS) {
                    this.ctx.fillRect(i * 32 + 1, j * 32 + 1, 30, 30);
                }
            }
        }
    }
    findPath() {
        algo1(this);
        if (!this.pathFound) {
            siiimpleToast.alert("No path found :c", {duration: 2000});
        } else {
            siiimpleToast.success("Path found");
        }
    }
    colorPath(path) {
        if (!this.pathFound || this.grid[path.y][path.x] == 0) {
            return ;
        }
        if (!(path.x == this.target.x && path.y == this.target.y)) {
            this.ctx.fillStyle = "red";
            this.ctx.fillRect(path.x * 32 + 1, path.y * 32 + 1, 30, 30);
        }
        this.colorPath(getLowerPath(this, path), false);
    }
    ctrlHandler(ctrl) {
        if (ctrl == "left" && this.cursor.x > 0) {
            this.cursor.x--;
        }
        if (ctrl == "right" && this.cursor.x < this.w - 1) {
            this.cursor.x++;
        }
        if (ctrl == "up" && this.cursor.y > 0) {
            this.cursor.y--;
        }
        if (ctrl == "down" && this.cursor.y < this.h - 1) {
            this.cursor.y++;
        }
    }
    addWall() {
        this.grid[this.cursor.y][this.cursor.x] = this.WALLS;
        this.pathFound = false;
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                if (this.grid[j][i] != this.WALLS) {
                    this.grid[j][i] = -1;
                }
            }
        }
    }
    movePlayer(pos) {
        this.player = pos;
        this.pathFound = false;
        this.grid = this.genGrid(this.w, this.h);
    }
    moveTarget(pos) {
        this.target = pos;
        this.pathFound = false;
        this.grid = this.genGrid(this.w, this.h);
    }
}

function getNumExtraDigits(number) {
    return number.toString().length - 1;
}

function entierAleatoire(min, max) {
 return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLowerPath(motor, path) {
    let paths = [
        {x: path.x + 1, y: path.y},
        {x: path.x, y: path.y + 1},
        {x: path.x - 1, y: path.y},
        {x: path.x, y: path.y - 1}
    ];
    paths = paths.map(obj=>{
        if (obj.x == motor.player.x && obj.y == motor.player.y) {
            obj.val = 0;
        } else {
            obj.val = pathExists(motor, obj) ? motor.grid[obj.y][obj.x] : -1;
        }
        return (obj);
    });
    let bestPath = paths[0];
    let bestValue = bestPath.val;

    for (let i = 0; i < paths.length; i++) {
        if (bestValue == -1) {
            bestPath = paths[i];
            bestValue = bestPath.val;
        } else if (paths[i].val == -1)
            continue ;
        else if (paths[i].val < bestValue) {
            bestPath = paths[i];
            bestValue = bestPath.val;
        }
    }
    return (bestPath);
}