function algo1(motor) {
    let firstIter = [{x: motor.player.x, y: motor.player.y}];
    motor.grid[motor.player.y][motor.player.x] = 0;
    execIter(motor, firstIter);
}

function execIter(motor, iter) {
    let newIter = [];
    if (motor.pathFound)
        return ;
    for (let i = 0; i < iter.length; i ++) {
        findNewSteps(motor, iter[i], newIter);
    }
    if (newIter.length != 0) {
        execIter(motor, newIter);
    }
}

function findNewSteps(motor, fromPath, arr) {
    let oldValue = motor.grid[fromPath.y][fromPath.x];
    let nextStep;

    nextStep = {x: fromPath.x + 1, y: fromPath.y};
    tryThisPath(motor, nextStep, oldValue, arr);
    nextStep = {x: fromPath.x, y: fromPath.y + 1};
    tryThisPath(motor, nextStep, oldValue, arr);
    nextStep = {x: fromPath.x - 1, y: fromPath.y};
    tryThisPath(motor, nextStep, oldValue, arr);
    nextStep = {x: fromPath.x, y: fromPath.y - 1};
    tryThisPath(motor, nextStep, oldValue, arr);
}

function tryThisPath(motor, nextStep, oldValue, arr) {
    if (pathExists(motor, nextStep) && motor.grid[nextStep.y][nextStep.x] == -1) {
        arr.push(nextStep);
        motor.grid[nextStep.y][nextStep.x] = oldValue + 1;
    }
}

function pathExists(motor, path) {
    if (path.x == motor.player.x && path.y == motor.player.y)
        return false;
    if (path.x == motor.target.x && path.y == motor.target.y)
        motor.pathFound = true;
    if (path.x < 0 || path.y < 0)
        return false;
    if (path.x >= motor.w || path.y >= motor.h)
        return false;
    if (motor.grid[path.y][path.x] == motor.WALLS)
        return false;
    return true;
}