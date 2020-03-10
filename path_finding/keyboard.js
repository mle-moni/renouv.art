function setupKeyboard(motor) {
    document.onkeydown = e=>{
        if (e.keyCode == 13) {
            motor.findPath();
            return ;
        } else if (e.keyCode == 32) {
            motor.addWall();
        }
        switch (e.keyCode) {
            case 38: // up
                motor.ctrlHandler("up");
            break;
            case 40: // down
                motor.ctrlHandler("down");
            break;
            case 39: // right
                motor.ctrlHandler("right");
            break;
            case 37: // left
                motor.ctrlHandler("left");
            break;
        }
    }
}