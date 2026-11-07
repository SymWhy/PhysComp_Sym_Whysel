/* 
    SS6: Analog Sequencer p5 
    by Sym Whysel
*/


/// SERIAL VARIABLES ///
let port;                       // variable for Web Serial port instance
let baudRate = 115200;          // NOTE: baud rate must match in Arduino sketch


/// CONSTANTS///

const X_COUNT = 8;
const Y_COUNT = 1;
const BOX_W = 75;
const BOX_H = 75;


/// VARIABLES ///

let notes = [ 0, 0, 0, 0, 0, 0, 0, 0 ]; // notes that have been toggled
let currentNote = 0;
let waiting = false;
let clicked = false;
let lastState;

let start_X;
let start_Y;

let values_X = [];
let playing;
let beat;
let speed;

let inData;

/// SYSTEM FUNCTIONS ///

function setup() {
    //serial communication setup
    port = createSerial();          // create the serial port instance

    let used = usedSerialPorts();   // store previously used serial ports

    if (used.length > 0)            // if there are previously used ports...
    {
        port.open(used[0], baudRate); // reopen last used serial port
    }

    createCanvas(1080, 720); //set size of canvas
    background(255);

    start_X = width/5;
    start_Y = height/3;

    populateX();

    playing = false;

    port.clear(); // clear the buffer after reading
    //NOTE: VERY IMPORTANT TO CLEAR BUFFER each frame, otherwise old data will accumulate and cause lag
}

function draw() {
    readIncoming();
    
    speed = map(inData, 0, 255, 40, 270);
    beat = getBeat(speed);

    drawSequencer();

    if (playing && waiting == false) {

        waiting = true;
        sendData(notes[currentNote]);
        
        // source, timeout: https://www.w3schools.com/jsref/met_win_settimeout.asp#gsc.tab=0
        // set an asynchronous timer to pause a beat before updating the 
        // current note variable.
        setTimeout(updateNote, beat);
    }
    
    if (!port.opened()) //if the port is not open...
    {
        fill(0);
        strokeWeight(1);
        textSize(48);
        text("press the spacebar to connect", width / 5, height / 8);  //show message
    }
}


/// ACTION FUNCTIONS ///


function populateX() {
    let currentX = start_X;

    for (let i = 0; i < notes.length; i++) {
        values_X.push(currentX);
        currentX += BOX_W;
    }
}



function readIncoming() {
    if (port.availableBytes() > 0) //if there is data available on serial port...
  {
    inData = port.readByte(); // store incoming byte (0-255)
    print(inData);
    port.clear(); // clear the buffer after reading to avoid buffer overflow
  }
}


function drawSequencer() {
    background(255);
    fill(255);
    stroke(0);
    strokeWeight(3);

    let currentY;

    for (let i = 0; i < notes.length; i++) {
        currentY = start_Y;

        // if playing, and the current note is active, fill red
        // if playing, and the current note is inactive, fill dk grey
        // if not playing, and current note is active, fill pink
        // if not playing, and the current note is inactive, fill lt grey

        if (playing && currentNote == i) {
            notes[currentNote] == 1 ? fill(255,100,100) : fill(150);
        } else {
            notes[i] == 1 ? fill(255,200,200) : fill(200);
        }

        for (let j = 0; j < Y_COUNT; j++) {
            rect(values_X[i], currentY, BOX_W, BOX_H);

            currentY += BOX_H;
        }
    }
}

function updateNote() {

    // source, math: https://stackoverflow.com/questions/52883995/how-to-loop-through-wrap-around-an-array-based-on-starting-index
    // set an asynchronous timer to pause a beat before updating the 
    // current note variable.
    currentNote = (currentNote + 1) % notes.length;
    waiting = false;
}


/// UTILITY FUNCTIONS ///

// data sent should look like:
// note placement in array as int
// this will only send on note change
// skipped notes just won't send
function sendData(data) {
    // print(data);
    port.println(data);
}


function getBeat(bpm) {
    //prevent divide by zero
    if (bpm < 1) bpm = 1;

    // source: https://www.guitartrainingstudio.com/bpm-to-ms-calculator-for-delay-and-echo-effects/
    // divide 60,000 by the BPM
    return 60000 / bpm;
}


// source: https://www.reddit.com/r/learnjavascript/comments/rxm8nq/is_there_a_shorthand_way_of_checking_if_a/
function inRange(number, start, end) {
    return number >= start && number <= end
}


/// INTERACTIVE FUNCTIONS ///

function mousePressed() {
    let x = mouseX;
    let y = mouseY;

    clicked = true;

    for (let i = 0; i < notes.length; i++) {
        if (inRange(x, values_X[i], values_X[i] + BOX_W) &&
            inRange(y, start_Y, start_Y + BOX_H)) {

            if (notes[i] == 1) {
                notes[i] = 0;
                lastState = 0;
            } else {
                notes[i] = 1;
                lastState = 1;
            }
        }
    }

    drawSequencer();
}

function mouseReleased() {
    clicked = false;
}

function mouseDragged() {
    if (clicked) {
        let x = mouseX;
        let y = mouseY;

        for (let i = 0; i < notes.length; i++) {
            if (inRange(x, values_X[i], values_X[i] + BOX_W) &&
                inRange(y, start_Y, start_Y + BOX_H)) {
                notes[i] = lastState;
            }
        }
    }
}


function keyPressed() {
    keyLwr = key.toLowerCase();

    if (keyLwr == ' ') {
        if (!port.opened()) //if the serial port is not open yet...
        {
            print("Opening port...");
            port.open(baudRate); //open the serial port (the browser will ask which device to use)
        } else {
            if (playing) currentNote = 0;
            playing = !playing;
        }
    }
}