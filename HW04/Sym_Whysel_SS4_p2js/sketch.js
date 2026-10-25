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
const radius = 150;

let smallRadius;
let angle;
var step;

let in_A;
let in_B;
let in_C;

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

    smallRadius = radius * 0.8;
    angle = 0;
    step = TWO_PI / sides;

    myColor = color(0,0,0);
}

function draw() {

    background(255);  // clear frame with background color each draw loop
    translate(width / 2, height / 2) // Make the center of the screen the new (0, 0)
    rotate(circAngle);

    stroke(0);
    noFill();

    circle(0, 0, smallRadius * 2);

    // source: https://editor.p5js.org/NanoDano/sketches/DPcU4_0ho

    fill(0);  // set fill color to black

    // Mic A
    polygon(radius * sin(angle), radius * cos(angle), radius * (in_A ? in_A : 0.1), sides, triAngle); 
    angle += step;

    // Mic B
    polygon(radius * sin(angle), radius * cos(angle), radius * (in_B ? in_B : 0.1), sides, triAngle);
    angle += step;
    
    // Mic C
    polygon(radius * sin(angle), radius * cos(angle), radius * (in_C ? in_C : 0.1), sides, triAngle);
    angle = 0;

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
  print(inData);
  
  if (inData != []) {
    let values = inData.split(",");
    print(values);

    let in_A = Number(values[0]);
    let in_B = Number(values[1]);
    let in_C = Number(values[2]);

    in_A = map(in_A, 0, 4096, 0, 1);
    in_B = map(in_B, 0, 4096, 0, 1);
    in_C = map(in_C, 0, 4096, 0, 1);

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
    let myAngle = 2 * Math.PI / numberOfSides * i + rotationRadians;

    // print(TWO_PI / numberOfSides * i);
    // print(myAngle);

    let sx = x + radius * Math.sin(myAngle);
    let sy = y + radius * Math.cos(myAngle);
    
    vertex(sx, sy);
  }
  endShape(CLOSE);
}