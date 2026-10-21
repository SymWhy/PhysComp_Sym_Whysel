/* 
    SS3: FREQUENCY VISUALIZER p5 
    by Sym Whysel
*/

let serial; // Variable for an instance of the serialport library
let portName = "COM6"; // my specific port name
let options = {baudRate: 9600}; // rate of comms

let lineEven = false;
let inHue = 0;
let inSat = 0;
let inBrt = 127;

let myColor;
let myText = `Hue: ${inHue} | Sat: ${inSat}`;

let sides = 3;

let red = 0;
let orange = 24;
let yellow = 39;
let green = 70;
let blue = 230;
let violet = 252;

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

    colorMode(HSB); // set color mode
    myColor = color(inHue, inSat, inBrt);
    createCanvas(1080, 720); //set size of canvas
    textSize(42); // set text size
    textAlign(CENTER, CENTER);  // set text alignment
}

function draw() //  draw function loops forever at frame rate
{ 
    colorMode(HSB); // set color mode
    background(0, 0, 255);  // clear frame with background color each draw loop

    fill(inHue, inSat, inBrt); // set fill color using incoming serial data
    polygon(width/2, height/2, 250, sides);  // draw polygon in center of canvas with diameter based on serial data
 
    fill(0);  // set fill color to black for text
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
    let values = inData.split(",");
    print(values);

    let newHue = parseInt(values[2]);
    let newSat = parseInt(values[3]);

    myColor = lerpColor(myColor, color(newHue, newSat, inBrt), 0.2);

    inHue = Math.round(hue(myColor));
    inSat = Math.round(saturation(myColor));

    myText = `Freq: ${values[0]} | RMS: ${values[1]}`;

    if (inHue < orange) sides = 3;
    else if (inHue < yellow) sides = 4;
    else if (inHue < green) sides = 5;
    else if (inHue < blue) sides = 6;
    else if (inHue < violet) sides = 7;
    else sides = 8;
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

// Source: Sundar Singh, https://observablehq.com/@eesur/p5js-regular-polygon

function polygon(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}