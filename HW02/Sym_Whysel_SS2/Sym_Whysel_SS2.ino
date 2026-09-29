/// Short Sketch II
/// aka not-that-short janky lil arcade game
/// BEHOLD THE SCOPE CREEP


const int buttonPin = 2;

const int ledPin01 = 4;
const int ledPin02 = 5;
const int ledPin03 = 6;
const int ledPin04 = 7;

const int ms01 = 500;
const int ms02 = 300;
const int ms03 = 200;
const int ms04 = 100;

const int p1 = 1;
const int p2 = 2;
const int p3 = 3;
const int p4 = 4;

int nextPhase = p1;
int currentDiff = ms01;

unsigned long lastMillis = 0;

bool currentState = false;
bool lastState = false;
bool onRed = false;
bool startingUp = true;
bool buttonPressed = false;

void setup() {
  pinMode(ledPin01, OUTPUT);
  pinMode(ledPin02, OUTPUT);
  pinMode(ledPin03, OUTPUT);
  pinMode(ledPin04, OUTPUT);

  pinMode(buttonPin, INPUT_PULLUP);

  Serial.begin(115200);
}

void loop() {

  // Startup buffer/fluff
  if (startingUp) {
    cycleStartup(ms01);
    startingUp = false;
  }

  // Check if our difficulty's millisecond count has passed.
  if (millis() - lastMillis <= currentDiff) {
    currentState = !digitalRead(buttonPin);

    // Has our state changed, and is the button down.
    // Should stop the unclick from registering as a press.
    if (currentState == 1 && lastState != 1) {
      Serial.println("Button pressed!");

      // Are we on red?
      if (onRed) {
        Serial.println("You hit red!");
        // Increase difficulty or win.
        cycleDiff(currentDiff);
        delay(500);

      } else if (!onRed) {
        
        // We are not on red.
        Serial.println("You missed!");
        delay(500);
      }
    }
    // update lastState
    lastState = currentState;
    
  } else {
    lastMillis = millis();
    // Continue
    cyclePhase(currentDiff);
  }
  
}

void cycleStartup(float d) {
    digitalWrite(ledPin01, LOW);
    digitalWrite(ledPin02, LOW);
    digitalWrite(ledPin03, LOW);
    digitalWrite(ledPin04, LOW);
  
    delay(d);

    digitalWrite(ledPin01, HIGH);
    digitalWrite(ledPin02, HIGH);
    digitalWrite(ledPin03, HIGH);
    digitalWrite(ledPin04, HIGH);

    delay(d);

    digitalWrite(ledPin01, LOW);
    digitalWrite(ledPin02, LOW);
    digitalWrite(ledPin03, LOW);
    digitalWrite(ledPin04, LOW);

    delay(d * 1.5);
}

void cyclePhase(float d) {
  switch (nextPhase) {
    case 1:
      onRed = true;
      digitalWrite(ledPin04, LOW);
      digitalWrite(ledPin01, HIGH);

      nextPhase = 2;
      break;

    case 2:
      onRed = false;
      digitalWrite(ledPin01, LOW);
      digitalWrite(ledPin02, HIGH);

      nextPhase = 3;
      break;

    case 3:
      digitalWrite(ledPin02, LOW);
      digitalWrite(ledPin03, HIGH);

      nextPhase = 4;
      break;

    case 4:  
      digitalWrite(ledPin03, LOW);
      digitalWrite(ledPin04, HIGH);

      nextPhase = 1;
      break;
  }
}

void cycleDiff(int lastDiff) {
  switch (lastDiff) {
    case ms01:
      currentDiff = ms02;
      break;

    case ms02:
      currentDiff = ms03;
      break;

    case ms03:
      currentDiff = ms04;
      break;

    case ms04:
      Serial.println("You win!");

      digitalWrite(ledPin01, HIGH);
      digitalWrite(ledPin02, HIGH);
      digitalWrite(ledPin03, HIGH);
      digitalWrite(ledPin04, HIGH);

      delay(500);

      digitalWrite(ledPin01, LOW);
      digitalWrite(ledPin02, LOW);
      digitalWrite(ledPin03, LOW);
      digitalWrite(ledPin04, LOW);

      delay(500);

      currentDiff = ms01;
      break;
  }
}