/* 
    SS5: GRAPHIC PIANO p5 
    by Sym Whysel
*/

let port;                       // variable for Web Serial port instance
let baudRate = 115200;          // NOTE: baud rate must match in Arduino sketch

let piano_x;
let piano_y;

const WHITE_WIDTH = 80;
const WHITE_HEIGHT = 300;
const BLACK_WIDTH = 54;
const BLACK_HEIGHT = 200;
const BLACK_OFFSET = 54;

let whiteKeys = [];
let blackKeys = [];

let white_chars = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
let black_chars = ['w', 'e', 't', 'y', 'u'];

let keyHeld = 0;
let keyPlayed = false;
let waiting = false;
let waitTime = 100;

let lastKey;
let lastKeyBlack;

let lastMillis;


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
    piano_x = width / 5;
    piano_y = height / 3;

    drawPiano();

    port.clear(); // clear the buffer after reading
    //NOTE: VERY IMPORTANT TO CLEAR BUFFER each frame, otherwise old data will accumulate and cause lag
}


function draw() {
    readIncoming();

    if (keyHeld) {
        drawPiano(true);
    } else drawPiano();

    if (!port.opened()) //if the port is not open...
    {
        fill(0);
        strokeWeight(1);
        textSize(48);
        text("press the spacebar to connect", width / 5, height / 8);  //show message
    }
}

function readIncoming() {
    //***___SERIAL READ___START
    let inString = port.readUntil('\n');

    if (inString.length > 0) //if we received serial data...
    {
        inString = inString.trim(); // remove newline char at end of message
    }

    if (inString) print(inString);
}


function drawPiano(pressed = false) {
    background(255);
    whiteKeys = [];
    blackKeys = [];

    // white keys
    fill(255);
    stroke(0);
    strokeWeight(5);

    let counter = 0;
    for (let i = piano_x; i < (WHITE_WIDTH * 8) + piano_x; i += WHITE_WIDTH) {

        if (pressed && !lastKeyBlack && lastKey == counter) {
            fill(255 - 64);
        } else {
            fill(255);
        }

        rect(i, piano_y, WHITE_WIDTH, WHITE_HEIGHT);
        whiteKeys.push(i);
        counter++;
    }

    counter = 0;

    // black keys
    noStroke();
    textSize(36);
    fill(0);
    for (let i = BLACK_OFFSET + piano_x; i < (BLACK_WIDTH * 5) + (BLACK_OFFSET * 5) + piano_x; i += BLACK_WIDTH + BLACK_OFFSET / 2) {

        // skip one key place
        if (counter == 2) {
            i += BLACK_WIDTH + BLACK_OFFSET / 2;
        }
        if (pressed && lastKeyBlack && lastKey == counter) {
            fill(64);
        } else {
            fill(0);
        }
        rect(i, piano_y, BLACK_WIDTH, BLACK_HEIGHT);
        blackKeys.push(i);

        counter++;
    }

    // white key labels
    fill(0);

    let lettersWht = ["C", "D", "E", "F", "G", "A", "B", "C"];

    for (let i = 0; i < 8; i++) {
        text(lettersWht[i], whiteKeys[i] + (WHITE_WIDTH / 2) - 12, piano_y + WHITE_HEIGHT - 25);  //show message
    }


    // black key labels
    fill(255);
    let lettersBlk = ["C#", "Eb", "F#", "G#", "Bb"];
    for (let i = 0; i < 5; i++) {
        text(lettersBlk[i], blackKeys[i] + (BLACK_WIDTH / 2) - 25, piano_y + BLACK_HEIGHT - 25);  //show message
    }
}

function mousePressed() {
    // source: https://stackoverflow.com/questions/23744605/javascript-get-x-and-y-coordinates-on-mouse-click
    // record x and y
    let x = mouseX;
    let y = mouseY;

    // make sure we've actually clicked on the piano
    if (inRange(x, piano_x, (WHITE_WIDTH * 8) + piano_x)
        && inRange(y, piano_y, piano_y + WHITE_HEIGHT)) {

        let blackKey = 0;
        let keyID;
        // check if black key
        for (let i = 0; i < 5; i++) {
            if (inRange(x, blackKeys[i], blackKeys[i] + BLACK_WIDTH)
                && inRange(y, piano_y, piano_y + BLACK_HEIGHT)) {
                blackKey = 1;
                keyID = i;
            }
        }

        if (blackKey == 0) {
            for (let i = 0; i < 8; i++) {
                if (inRange(x, whiteKeys[i], whiteKeys[i] + WHITE_WIDTH)
                    && inRange(y, piano_y, piano_y + WHITE_HEIGHT)) {
                    keyID = i;
                }
            }
        }

        keyPlayed = true;
        keyHeld = 1;
        lastKey = keyID;
        lastKeyBlack = blackKey;

        sendData();
    }
}

function mouseReleased() {
    if (keyHeld) {
        keyHeld = 0;
        sendData();
    }
}

function keyPressed() {
    keyLwr = key.toLowerCase();

    if (keyLwr == ' ') {
        if (!port.opened()) //if the serial port is not open yet...
        {
            print("Opening port...");
            port.open(baudRate); //open the serial port (the browser will ask which device to use)
        }

    } else if ((white_chars.includes(keyLwr) && white_chars.indexOf(keyLwr) == lastKey && lastKeyBlack == 0) 
                || (black_chars.includes(keyLwr) && black_chars.indexOf(keyLwr) == lastKey && lastKeyBlack == 1)) {
        // pass if we're pressing the same key

    } else if (white_chars.includes(keyLwr)) {

        switch (keyLwr) {
            case 'a':
                keyHeld = 1;
                lastKey = 0;
                lastKeyBlack = 0
                break;

            case 's':
                keyHeld = 1;
                lastKey = 1;
                lastKeyBlack = 0
                break;

            case 'd':
                keyHeld = 1;
                lastKey = 2;
                lastKeyBlack = 0
                break;

            case 'f':
                keyHeld = 1;
                lastKey = 3;
                lastKeyBlack = 0
                break;

            case 'g':
                keyHeld = 1;
                lastKey = 4;
                lastKeyBlack = 0;
                break;

            case 'h':
                keyHeld = 1;
                lastKey = 5;
                lastKeyBlack = 0;
                break;

            case 'j':
                keyHeld = 1;
                lastKey = 6;
                lastKeyBlack = 0;
                break;

            case 'k':
                keyHeld = 1;
                lastKey = 7;
                lastKeyBlack = 0;
                break;
        }

        sendData();
    } else if (black_chars.includes(keyLwr)) {

        switch (keyLwr) {
            case 'w':
                keyHeld = 1;
                lastKey = 0;
                lastKeyBlack = 1;
                break;

            case 'e':
                keyHeld = 1;
                lastKey = 1;
                lastKeyBlack = 1;
                break;

            case 't':
                keyHeld = 1;
                lastKey = 2;
                lastKeyBlack = 1;
                break;
            
            case 'y':
                keyHeld = 1;
                lastKey = 3;
                lastKeyBlack = 1;
                break;
            
            case 'u':
                keyHeld = 1;
                lastKey = 4;
                lastKeyBlack = 1;
                break;
        }

        sendData();
    } else {
        keyHeld = 0;
        sendData();
    }
}

function keyReleased() {
    keyLwr = key.toLowerCase();
    if (keyLwr != ' ') {

        // if the current key is a white key, compare its index to the last key's index,
        // so long as the last key was also white.
        // check the same for black.
        if ((white_chars.includes(keyLwr) && white_chars.indexOf(keyLwr) == lastKey && lastKeyBlack == 0) 
                || (black_chars.includes(keyLwr) && black_chars.indexOf(keyLwr) == lastKey) && lastKeyBlack == 1) {
            keyHeld = 0;
            sendData();
        }
    }
}


function sendData() {
    // print(keyHeld + "," + lastKeyBlack + "," + lastKey);
    port.println(keyHeld + "," + lastKeyBlack + "," + lastKey);
}

// source: https://www.reddit.com/r/learnjavascript/comments/rxm8nq/is_there_a_shorthand_way_of_checking_if_a/
function inRange(number, start, end) {
    return number >= start && number <= end
}