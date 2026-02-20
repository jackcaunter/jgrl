let theShader;

function preload() {

    theShader = loadShader('./js/temp/shader.vert', './js/temp/shader.frag');

}

function setup() {
    createCanvas(200, 200, WEBGL);
    // Disable scaling for retina screens which can create inconsistent scaling between displays
    pixelDensity(1);
    noStroke();
}

function draw() {
    background(200);
    fill(100);
    rect(1,1,30,30)

    //shader(theShader);

    rect(10, 100, 1, 1);

}