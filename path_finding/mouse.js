function setupMouse(motor) {
    motor.canvas.oncontextmenu=e=>{return false};
    motor.canvas.onmousedown = (e) => {
        let pos = {
            x: Math.floor(e.layerX / 32),
            y: Math.floor(e.layerY / 32)
        };

        if (e.which == 1) { // left click
            motor.movePlayer(pos);
        } else if (e.which == 3) { // right click
            motor.moveTarget(pos);
        }
        e.preventDefault();
    }
}
