/* 
    SS4: SOUND TRIANGULATION p5 
    by Sym Whysel
*/

let serial; // Variable for an instance of the serialport library
let portName = "COM6"; // my specific port name
let options = {baudRate: 9600}; // rate of comms

let myColor;

let myText = `Mic A: 0\nMic B: 0 | Mic C: 0`;

const circAngle = 45; // rotation of the circle
const triAngle = 0; // rotation of the triangles
const sides = 3;
const master_radius = 150;
const dB_CEILING = 60;

let angle_A;
let angle_B;
let angle_C;

let angles;

let coords_A;
let coords_B;
let coords_C;

let smallRadius;
var step;

let in_A = 0;
let in_B = 0;
let in_C = 0;

let coordX = 0;
let coordY = 0;

function setup() {
    // p5 serial setup
    // list of available callback functions
    serial = new p5.SerialPort();
    serial.on('list', printList);
    serial.on('connected', serverConnected);
    serial.on('open', portOpen);
    serial.on('data', serialEvent);
    serial.on('error', serialError);
    serial.on('close', portClose);
 
    serial.list();                            // list the serial ports
    serial.open(portName, options);           // open a serial port

    createCanvas(1080, 720); //set size of canvas
    textSize(42); // set text size
    textAlign(CENTER, CENTER);  // set text alignment

    smallRadius = master_radius * 0.8;
    step = TWO_PI / sides;

    angle_A = 0;
    angle_B = angle_A + step;
    angle_C = angle_B + step;

    coords_A = [master_radius * sin(angle_A), master_radius * cos(angle_A)];
    coords_B = [master_radius * sin(angle_B), master_radius * cos(angle_B)];
    coords_C = [master_radius * sin(angle_C), master_radius * cos(angle_C)];

    myColor = color(0,0,0);

    angles = [angle_A, angle_B, angle_C];
}

function draw() {

    background(255);  // clear frame with background color each draw loop
    translate(width / 2, height / 2) // Make the center of the screen the new (0, 0)
    rotate(circAngle);
    let myAngle = 0;

    stroke(0);
    noFill();

    circle(0, 0, smallRadius * 2);

    // source: https://editor.p5js.org/NanoDano/sketches/DPcU4_0ho

    fill(0);  // set fill color to black

    // Mic A
    polygon(coords_A[0], coords_A[1], 50 * (in_A ? in_A : 0.1), sides, triAngle); 
    myAngle += step;

    // Mic B
    polygon(coords_B[0], coords_B[1], 50 * (in_B ? in_B : 0.1), sides, triAngle);
    myAngle += step;
    
    // Mic C
    polygon(coords_C[0], coords_C[1], 50 * (in_C ? in_C : 0.1), sides, triAngle);
    myAngle = 0;

    circle(coordX, coordY, 25);

    text(myText, width/2, height - height/8); // display incoming serial data on canvas
}


/* SERIAL FUNCTIONS */

function printList(portList) // gets called when the serial.list() function is called
{
  print("List of Available Serial Ports: ");
  for (var i = 0; i < portList.length; i++) 
  {
    print(i + portList[i]); //print list of available serial ports to console
  }
}

function serverConnected() //gets called when we connect to the serial server
{
  print("CONNECTED TO SERVER");
}
 
function portOpen() //gets called when the serial port opens
{
  print("SERIAL PORT OPEN");
}
 
function serialEvent() //gets called when new data arrives
{
  let inData = serial.readLine(); //Store incoming data as a string
  
  if (inData != []) {
    // print(inData);
    let values = inData.split(",");

    let new_A = float(values[0]);
    let new_B = float(values[1]);
    let new_C = float(values[2]);

    // pulsing triangles

    let mapped_A = map(new_A, 0, dB_CEILING, 0, 1);
    let mapped_B = map(new_B, 0, dB_CEILING, 0, 1);
    let mapped_C = map(new_C, 0, dB_CEILING, 0, 1);

    in_A = lerp(in_A, mapped_A, 0.6);
    in_B = lerp(in_B, mapped_B, 0.6);
    in_C = lerp(in_C, mapped_C, 0.6);

    // get point on circle between angle A and angle B
    let myAngle;

    let indexes = getTopTwoIx(values);

    // print(indexes);

    let firstAngle = angles[indexes[0]];
    let secondAngle = angles[indexes[1]];

    if (firstAngle > secondAngle) {
      myAngle = map(values[indexes[0]], 0, 1, firstAngle, secondAngle);
    } else {
      myAngle = map(1 - values[indexes[0]], 0, 1, secondAngle, firstAngle);
    }

    // print(myAngle);

    let coords = pointOnCircle(0, 0, master_radius, myAngle);

    coordX = lerp(coordX, coords[0], 0.2);
    coordY = lerp(coordY, coords[1], 0.2);

    print(coordX, coordY);

    // myColor = color(in_A, in_B, in_C);

    myText = `Mic A: ${values[0]}\nMic B: ${values[1]} | Mic C: ${values[2]}`;
  }
}
 
function serialError(err) //gets called when there's an error
{
  print('ERROR: ' + err);
}
 
function portClose() //gets called when the serial port closes
{
  print("*____SERIAL PORT CLOSED");
}


// Source: Sundar Singh
// https://observablehq.com/@eesur/p5js-regular-polygon
// https://observablehq.com/@eesur/canvas-polygon 

function polygon(x, y, radius, numberOfSides, rotationDegrees) {

  const rotationRadians = rotationDegrees * Math.PI / 180; // Convert degrees to radians

  beginShape();
  
  for (let i = 0; i < numberOfSides; i++) {
    let plyAngle = 2 * Math.PI / numberOfSides * i + rotationRadians;

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
function normalizeValues(a, b, c) {
  let sum = abs(a) + abs(b) + abs(c);
  
  let norm_A = a / sum;
  let norm_B = b / sum;
  let norm_C = c / sum;

  return [norm_A, norm_B, norm_C];
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