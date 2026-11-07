/* 
    SS6: Analog Sequencer p5 
    by Sym Whysel
*/

let port;                       // variable for Web Serial port instance
let baudRate = 115200;          // NOTE: baud rate must match in Arduino sketch

const X_COUNT = 8;
const Y_COUNT = 1;
const BOX_W = 75;
const BOX_H = 75;

let notes = [ 1, 0, 1, 0, 1, 0, 1, 0 ]; // notes that have been toggled
let currentNote = 0;
let noteSent = false; // Make sure we don't send the same note twice.

let playing;
let beat;
let speed = 120;

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

    playing = false;
    beat = getBeat(speed);

    port.clear(); // clear the buffer after reading
    //NOTE: VERY IMPORTANT TO CLEAR BUFFER each frame, otherwise old data will accumulate and cause lag
}

function draw() {
    readIncoming();

    drawSequencer(width/5, height/3);

    // if we are playing, send the current note state and then wait a beat.
    if (playing) {
        sendData(notes[currentNote]);
        
        let lastTime = millis();
        while (millis() - lastTime < beat);

        // source: https://stackoverflow.com/questions/52883995/how-to-loop-through-wrap-around-an-array-based-on-starting-index
        // current note, add 1, then divide by the array length and get the remainder
        currentNote = (currentNote + 1) % notes.length;
    }
    
    if (!port.opened()) //if the port is not open...
    {
        fill(0);
        strokeWeight(1);
        textSize(48);
        text("press the spacebar to connect", width / 5, height / 8);  //show message
    }
}


// incoming string set up like:
// 
function readIncoming() {
    //***___SERIAL READ___START
    let inString = port.readUntil('\n');

    if (inString.length > 0) //if we received serial data...
    {
        inString = inString.trim(); // remove newline char at end of message

    }

    if (inString) print(inString);
}


function drawSequencer(startX, startY) {
    background(255);
    fill(255);
    stroke(0);
    strokeWeight(3);

    let currentX = startX;
    let currentY;

    for (let i = 0; i < notes.length; i++) {
        currentY = startY;

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
            rect(currentX, currentY, BOX_W, BOX_H);

            currentY += BOX_H;
        }
        currentX += BOX_W;
    }
}


// data sent should look like:
// note placement in array as int
// this will only send on note change
// skipped notes just won't send
function sendData(data) {
    // print(data);
    port.println(data);
}


function getBeat(bpm) {
    // source: https://www.guitartrainingstudio.com/bpm-to-ms-calculator-for-delay-and-echo-effects/
    // divide 60,000 by the BPM
    return 60000 / bpm;
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