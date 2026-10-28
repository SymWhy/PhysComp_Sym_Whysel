/* 
    SS4: SOUND TRIANGULATION p5 
    by Sym Whysel
*/

let port;                       // variable for Web Serial port instance
let baudRate = 115200;          // NOTE: baud rate must match in Arduino sketch

let myText = `Mic A: 0 | Mic B: 0\nMic C: 0 | Mic D: 0`;

const circAngle = 0; // rotation of the circle
const trisAngle = 0; // rotation of the triangles
const sides = 4;
const master_radius = 150;
const dB_CEILING = 60;

let angle_A;
let angle_B;
let angle_C;
let angle_D;

let angles;

let coords_A;
let coords_B;
let coords_C;
let coords_D;

let smallRadius;
let lastAngle;
var step;

let in_A = 0;
let in_B = 0;
let in_C = 0;
let in_D = 0;

let coordX = 0;
let coordY = 0;

function setup() {
  //serial communication setup
  port = createSerial();          // create the serial port instance

  let used = usedSerialPorts();   // store previously used serial ports

  if (used.length > 0)            // if there are previously used ports...
  {
    port.open(used[0], baudRate); // reopen last used serial port
  }

  createCanvas(1080, 720); //set size of canvas
  textSize(42); // set text size
  textAlign(CENTER, CENTER);  // set text alignment

  smallRadius = master_radius * 0.8;
  step = TWO_PI / sides;

  angle_A = 0;
  angle_B = angle_A + step;
  angle_C = angle_B + step;
  angle_D = angle_C + step;

  lastAngle = 0;

  coords_A = [master_radius * sin(angle_A), master_radius * cos(angle_A)];
  coords_B = [master_radius * sin(angle_B), master_radius * cos(angle_B)];
  coords_C = [master_radius * sin(angle_C), master_radius * cos(angle_C)];
  coords_D = [master_radius * sin(angle_D), master_radius * cos(angle_D)];

  angles = [angle_A, angle_B, angle_C, angle_D];
}

function draw() {

  getData();

  background(255);  // clear frame with background color each draw loop

  // draw text first
  text(myText, width / 2, height - height / 8); // display incoming serial data on canvas

  translate(width / 2, height / 2) // Make the center of the screen the new (0, 0)
  rotate(circAngle);
  let myAngle = 0;

  stroke(0);
  noFill();

  circle(0, 0, smallRadius * 2);

  // source: https://editor.p5js.org/NanoDano/sketches/DPcU4_0ho

  fill(0);  // set fill color to black

  // Mic A
  polygon(coords_A[0], coords_A[1], 50 * (in_A ? in_A : 0.1), sides, trisAngle);
  myAngle += step;

  // Mic B
  polygon(coords_B[0], coords_B[1], 50 * (in_B ? in_B : 0.1), sides, trisAngle);
  myAngle += step;

  // Mic C
  polygon(coords_C[0], coords_C[1], 50 * (in_C ? in_C : 0.1), sides, trisAngle);
  myAngle += step;

  // Mic D
  polygon(coords_D[0], coords_D[1], 50 * (in_D ? in_D : 0.1), sides, trisAngle);
  myAngle = 0;

  circle(coordX, coordY, 25);

  port.clear(); // clear the buffer after reading
  //NOTE: VERY IMPORTANT TO CLEAR BUFFER each frame, otherwise old data will accumulate and cause lag
}

function getData() {
  let inData = port.readUntil('\n'); // separate incoming data by newlines

  if (inData.length > 0) {
    let values = inData.split(",");

    values[3] = values[3].split("\n")[0];

    let new_A = Number(values[0]);
    let new_B = Number(values[1]);
    let new_C = Number(values[2]);
    let new_D = Number(values[3]);

    // pulsing triangles

    let mapped_A = map(new_A, 0, dB_CEILING, 0, 1, true);
    let mapped_B = map(new_B, 0, dB_CEILING, 0, 1, true);
    let mapped_C = map(new_C, 0, dB_CEILING, 0, 1, true);
    let mapped_D = map(new_D, 0, dB_CEILING, 0, 1, true);

    in_A = lerp(in_A, mapped_A, 0.3);
    in_B = lerp(in_B, mapped_B, 0.3);
    in_C = lerp(in_C, mapped_C, 0.3);
    in_D = lerp(in_C, mapped_D, 0.3);

    // get point on circle between angle A and angle B

    let indexes = getTopTwoIx(values);

    // get the angles of the loudest and second loudest mics
    let firstAngle = angles[indexes[0]];
    let secondAngle = angles[indexes[1]];

    // get the mic volume value from the loudest mic
    let firstValue = Number(values[indexes[0]]);
    let secondValue = Number(values[indexes[1]]);

    // get proportions btwn these two values so they fit in a 0-1 scale
    let myValues = normalizeValues(firstValue, secondValue);

    // this plots the volume value between the loudest and second loudest angle
    myAngle = map(myValues[0], 0, 1, firstAngle, secondAngle);

    myAngle = lerp(lastAngle, myAngle, 0.1);

    lastAngle = myAngle;

    // print(values[indexes[0]]);

    let radiusMod = map(Number(values[indexes[0]]), 0, dB_CEILING, 0, 1);

    let coords = pointOnCircle(0, 0, smallRadius * radiusMod, myAngle);

    coordX = coords[0];
    coordY = coords[1];

    myText = `Mic A: ${values[0]} | Mic B: ${values[1]}\nMic C: ${values[2]} | Mic D: ${values[3]}`;
  }
}


// Source: Sundar Singh
// https://observablehq.com/@eesur/p5js-regular-polygon
// https://observablehq.com/@eesur/canvas-polygon 

function polygon(x, y, radius, numberOfSides, rotationDegrees) {

  const rotationRadians = rotationDegrees * Math.PI / 180; // Convert degrees to radians

  beginShape();

  for (let i = 0; i <= numberOfSides; i++) {
    let plyAngle = TWO_PI / numberOfSides * i + rotationRadians;

    let sx = x + radius * Math.sin(plyAngle);
    let sy = y + radius * Math.cos(plyAngle);

    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function pointOnCircle(startX, startY, radius, angle) {
  let pointX = (radius * sin(angle)) + startX;
  let pointY = (radius * cos(angle)) + startY;

  let points = [pointX, pointY];
  return points;
}

// Source: codefinity, https://codefinity.com/courses/v2/df141e1d-1b9c-4a2f-afae-b2b2d432758d/2773b6c0-87b3-426e-9375-93864ccc9297/e3482c9d-62fd-4849-966b-3b489bb3ad14
function normalizeValues(a, b, c=0, d=0) {
  let sum = abs(a) + abs(b) + abs(c) + abs(d);

  let norm_A = a / sum;
  let norm_B = b / sum;
  let norm_C = c / sum;
  let norm_D = d / sum;

  return [norm_A, norm_B, norm_C, norm_D];
}

// source: https://stackoverflow.com/questions/17039770/how-do-i-get-the-second-largest-element-from-an-array-in-javascript
function getTopTwoIx(values) {
  // initialize with the lowest possible values
  let max = -Infinity
  let second = -Infinity;
  for (const value of values) {
    if (value > max) {
      // if the value is higher than our recorded maximum
      // the old maximum is now our second
      second = max;
      // the new value is now our maximum
      max = value;

    } else if (value < max && value > second) {
      // otherwise if the value is less than our recorded maximum
      // but greater than our recorded second
      // the value becomes our second
      second = value;
    }
  }

  return [values.indexOf(max), values.indexOf(second)];
}

function mousePressed() 
{
  if (!port.opened()) //if the port is not connected...
  {
    port.open(baudRate); // open the serial port using selection pop-up
  }
}