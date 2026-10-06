int pins[7] = { 17, 16, 15, 7, 6, 5, 4 };

int peakToggle = 2;
int partyToggle = 42;
int micPin = 1;

bool lastStatePeak = false;
bool currentStatePeak = false;

bool lastStateParty = false;
bool currentStateParty = false;

bool withPeak = false;
bool partyMode = false;

float dynFloor = 0;
float dynCeiling = 2047; // blah value will be ignored
float minWindow = 500;

float lastRMS = 0;

float lastFloor = 0;
float lastCeiling = 2047; // blah value will be ignored

float offset = 2047; // blah value will be ignored

const float range = 4095;  // full range of possible data in or out

// peak read window
const unsigned long windowPeak = 64;

// RMS read sample count
const int samplesRMS = 1024;

const int samplesOffset = 256;

// --- INIT FUNCTIONS ---

void initPins(bool withPeak = false) {
  for (int i = 0; i < (sizeof(pins) / sizeof(pins[0])); i++){
    pinMode(pins[i], OUTPUT);

    if (withPeak) analogWriteResolution(pins[i], 12);
  }
}

float getOffset() {
  float sum = 0;
  int i = 0;

  while (i < samplesOffset) {
    float mySample = analogRead(micPin);
    while (!mySample) mySample = analogRead(micPin);

    sum += mySample;
    i++;
  }

  return sum / samplesOffset;
}

// --- ERROR FUNCTIONS ---

// Safe error handler: https://forum.arduino.cc/t/what-does-abort-do/141312/23?page=2
void catchError(String message = "ERROR: Aborting...") {
  Serial.println(message);
  Serial.flush();
  while (true) {
    digitalWrite(pins[6], 1);
    delay(1000);
    digitalWrite(pins[6], 0);
    delay(1000);
  }
}

// --- UTILITY FUNCTIONS ---

int applyScaling(float volume, float scaling) {
  // map and constrain to a value between 0 and 1
  float mappedVol = mapf(volume, dynFloor, dynCeiling, 0, 1);
  float condVol = constrain(mappedVol, 0, 1);

  return powf(condVol, scaling);
}

// Reference: https://www.physicsoftheuniverse.com/calculator/decibel.html
float getDecibels(float rawVolume) {
  float ratioVolume = rawVolume / (range);

  // Prevent logf(0)!
  if (ratioVolume == 0) ratioVolume = 0.001;

  return 20 * log10f(ratioVolume);
}

float mapf(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float normalizeAC(float input) {
  return abs(input - (offset));
}

float smoothVol(float vol, float lastVol, float w) {
  // source: MegunoLink https://www.megunolink.com/articles/coding/3-methods-filter-noisy-arduino-measurements/
  return ((w * vol) + (1 - w) * lastVol);
}

// --- ACTION FUNCTIONS ---

void updateWindow(float currentVol) {
  // check if the last volume is above the last ceiling or below the last floor
  // and update accordingly

  if (currentVol > lastCeiling) {
    dynCeiling = (0.1 * currentVol) + (0.9 * lastCeiling);

  } else {
    dynCeiling = (0.001 * currentVol) + (0.999 * lastCeiling);
  }

  if (currentVol < lastFloor) {
    dynFloor = (0.1 * currentVol) + (0.9 * lastFloor);
  } else {
    dynFloor = (0.001 * currentVol) + (0.999 * lastFloor);
  }

  float currentWindow = dynCeiling - dynFloor;

  dynFloor = max(dynFloor, 0.0f);
  dynCeiling = min(dynCeiling, offset);

  if (currentWindow < minWindow) {
    // get distance from each side of the scale
    float lowWindow = 0 + dynFloor;
    float highWindow = offset - dynCeiling;

    // find whichever one is lower than 500, drop it, 
    if (lowWindow < highWindow) {
      dynFloor = dynCeiling - 500;
    } else {
      dynCeiling = dynFloor + 500;
    }
  }

  // Apparently the i in %i is for integer
  // %f should work better for floats
  Serial.printf("Floor: %f - Ceiling: %f \n", dynFloor, dynCeiling);
  lastFloor = dynFloor;
  lastCeiling = dynCeiling;
}

// Root Mean Square - https://en.wikipedia.org/wiki/Root_mean_square
float catchRMS(unsigned long myWindow) {
  
  float sum = 0;
  int i = 0;

  while (i < samplesRMS) {
    // Get first sampled value
    float rawInput = analogRead(micPin);

    // Make sure we actually have a sample!
    while (!rawInput) {
      rawInput = analogRead(micPin);
    }

    // normalize to DC, flip any negatives
    float normInput = normalizeAC(rawInput);

    // add squared  to sample sum
    sum += normInput * normInput;

    // Bookkeeping
    i++;
  }

  return sqrt(sum / samplesRMS);
}

float catchPeak(unsigned long myWindow) {

  // initialize expected signal values
  // start at the opposite end of the spectrum so the minimum will
  // always be lower than initial min, max higher than initial max.
  float signalMin = range;
  float signalMax = 0;

  unsigned long lastMillis = millis();
  unsigned long currentMillis = lastMillis;

  while (currentMillis - lastMillis < myWindow) {

    float mySignal = analogRead(micPin);

    mySignal = normalizeAC(mySignal);

    // update peaks
    if (mySignal > signalMax) {
      signalMax = mySignal;
    }

    if (mySignal < signalMin) {
      signalMin = mySignal;
    }
    // bookkeeping
    currentMillis = millis();
  }

  // get peak-to-peak and convert to peak amplitude
  return (signalMax - signalMin) / 2;
}

// map and constrain incoming values to the appropriate scale
float processValue(float value, float in_min, float in_max, float out_min, float out_max) {
  float mappedVal = mapf(value, in_min, in_max, out_min, out_max);
  return constrain(mappedVal, out_min, out_max);
}

void updateLEDs(float decFloor = 50) {
  float rawVol = 0;

  if (withPeak) {
    rawVol = catchPeak(windowPeak);
  } else {
    rawVol = catchRMS(samplesRMS);
  }

  if (partyMode) {
    // adjust window according to ambient volume
    updateWindow(rawVol);
    // lie to the decibels function
    rawVol = processValue(rawVol, dynFloor, dynCeiling, 0, offset);
  }

  // get decibels and normalize to 0 -> 50
  float volumedB = getDecibels(rawVol) + decFloor;

  int pinCount = sizeof(pins) / sizeof(pins[0]);

  // split 50 between the existing LEDs
  float segment = decFloor / pinCount;

  if (withPeak) {
    for (int i = 0; i < pinCount; i++) {

      float zoneMin = (segment * i);
      float zoneMax = (segment * (i + 1));

      bool isOn = false;

      if (volumedB > zoneMin) {
        isOn = true;
        // Serial.print("[x] ");
      } else {
        // Serial.print("[o] ");
      }

      digitalWrite(pins[i], isOn);
    }

    // Serial.print("\n");

  } else {
    float smoothedRMS = smoothVol(volumedB, lastRMS, 0.5);

    for (int i = 0; i < pinCount; i++) {
      float zoneMin = segment * i;
      float zoneMax = segment * (i + 1);

      float processedRMS = processValue(smoothedRMS, zoneMin, zoneMax, 0, offset);

      lastRMS = processedRMS;

      // Serial.printf("[%i] ", processedVol ? processedVol : 0);
      analogWrite(pins[i], processedRMS);
    }
  }
}

// --- SYSTEM FUNCTIONS ---

void setup() {
  analogReadResolution(12);  // read 0-4095 (default)

  initPins();

  pinMode(peakToggle, INPUT_PULLUP);
  pinMode(partyToggle, INPUT_PULLUP);
  pinMode(micPin, INPUT);

  Serial.begin(115200);
  delay(500); // setup delay

  offset = getOffset();
  dynCeiling = offset;
  lastCeiling = offset;

  // Safety checks
  if (range <= minWindow) {
    catchError("ERROR: minWindow must be < range. Aborting...");
  }  

  if (offset <= minWindow || offset >= range) {
    catchError("ERROR: Bad offset calculated. Aborting...");
  }
}

void loop() {
  currentStatePeak = !digitalRead(peakToggle);

  if (currentStatePeak == 1 && lastStatePeak != 1) {
    // toggle algorithms
    withPeak = !withPeak;

    withPeak ? Serial.println("Using Peak algorithm.") : Serial.println("Using RMS algorithm");

    // re-initialize pins to prevent sticking
    initPins();
  }

  currentStateParty = !digitalRead(partyToggle);

  if (currentStateParty == 1 && lastStateParty != 1) {
    // toggle algorithms
    partyMode = !partyMode;

    if (partyMode) {
      Serial.println("Starting the party...");
    } else {
      Serial.println("Party's over, go home.");

      // reset window values
      dynFloor = 0;
      dynCeiling = offset;

      lastFloor = 0;
      lastCeiling = offset;
    }
  }

  updateLEDs(50);

  lastStatePeak = currentStatePeak;
  lastStateParty = currentStateParty;
}
