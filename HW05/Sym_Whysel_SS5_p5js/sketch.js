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

let keyPlayed = false;
let waiting = false;
let waitTime = 100;

let lastKey;
let lastKeyBlack;

let lastMillis;


function setup() {
    createCanvas(1080, 720); //set size of canvas
    background(255);
    piano_x = width / 5;
    piano_y = height / 3;

    drawPiano();
}


function draw() {
    if (keyPlayed) {
        drawPiano(true);

        keyPlayed = false;
        waiting = true;
        lastMillis = millis();
    }

    if (waiting) {
        if (millis() - lastMillis > waitTime) {
            drawPiano();
            waiting = false;
        }
    }
}


function drawPiano(pressed = false) {
    whiteKeys = [];
    blackKeys = [];

    // white keys
    fill(255);
    stroke(0);
    strokeWeight(5);
    print([pressed, lastKeyBlack, lastKey]);

    let counter = 0;
    for (let i = piano_x; i < (WHITE_WIDTH * 8) + piano_x; i += WHITE_WIDTH) {

        if (pressed && !lastKeyBlack && lastKey == counter) {
            fill(127);
            print("Key pressed!");
        } else {
            fill(255);
        }

        rect(i, piano_y, WHITE_WIDTH, WHITE_HEIGHT);
        whiteKeys.push(i);
        counter++;
    }

    counter = 0;

    // black keys
    fill(0);
    for (let i = BLACK_OFFSET + piano_x; i < (BLACK_WIDTH * 5) + (BLACK_OFFSET * 5) + piano_x; i += BLACK_WIDTH + BLACK_OFFSET / 2) {

        // skip one key place
        if (counter == 2) {
            i += BLACK_WIDTH + BLACK_OFFSET / 2;
        }
            if (pressed && lastKeyBlack && lastKey == counter) {
                fill(127);
            } else {
                fill(0);
            }
        rect(i, piano_y, BLACK_WIDTH, BLACK_HEIGHT);
        blackKeys.push(i);

        counter++;
    }
}


function mouseClicked(event) {
    // source: https://stackoverflow.com/questions/23744605/javascript-get-x-and-y-coordinates-on-mouse-click
    // record x and y
    let x = mouseX;
    let y = mouseY;

    print([x, y]);

    // make sure we've actually clicked on the piano
    if (inRange(x, piano_x, (WHITE_WIDTH * 8) + piano_x)
        && inRange(y, piano_y, piano_y + WHITE_HEIGHT)) {
        let blackKey = false;
        let keyID;
        // check if black key
        for (let i = 0; i < 5; i++) {
            if (inRange(x, blackKeys[i], blackKeys[i] + BLACK_WIDTH)
                && inRange(y, piano_y, piano_y + BLACK_HEIGHT)) {
                blackKey = true;
                keyID = i;
            }
        }

        if (!blackKey) {
            for (let i = 0; i < 8; i++) {
                if (inRange(x, whiteKeys[i], whiteKeys[i] + WHITE_WIDTH)
                    && inRange(y, piano_y, piano_y + WHITE_HEIGHT)) {
                    keyID = i;
                }
            }
        }

        keyPlayed = true;
        lastKey = keyID;
        lastKeyBlack = blackKey;
    }
}

// source: https://www.reddit.com/r/learnjavascript/comments/rxm8nq/is_there_a_shorthand_way_of_checking_if_a/
function inRange(number, start, end) {
    return number >= start && number <= end
}