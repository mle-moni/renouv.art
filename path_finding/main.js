const canvas = document.getElementById("canvas");

const motor = new Motor(canvas, 40, 24);

setupKeyboard(motor);
setupMouse(motor);
