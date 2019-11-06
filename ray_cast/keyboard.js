const touches = {
	up: false,
	down: false,
	right: false,
	left: false
};

document.onkeydown = e => {
    // console.log(e.keyCode);
    switch (e.keyCode) {
        case 38:
            touches.up = true;
            break;
        case 40:
            touches.down = true;
            break;
        case 37:
            touches.left = true;
            break;
        case 39:
            touches.right = true;
            break;
    }
}

document.onkeyup = e => {
    // console.log(e.keyCode);
    switch (e.keyCode) {
        case 38:
            touches.up = false;
            break;
        case 40:
            touches.down = false;
            break;
        case 37:
            touches.left = false;
            break;
        case 39:
            touches.right = false;
            break;
    }
}