const int PIEZO_PIN = 1;
const int RES_PWM = 12;   // resolution of PWM duty cycle, 12 is max value
const unsigned long WAIT_TIME = 100;

int pulseWidth = 127;     // 8-bit 0-255 range, 127 is 50% Duty Cycle
float frequency = 440;

String inString;

bool waiting = false;
unsigned long lastMillis;

// source: https://dobrian.github.io/cmp/topics/physics-of-sound/1.frequency-and-pitch.html
float tonesWht[8] = { 261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3 };
float tonesBlk[5] = { 277.2, 311.1, 370.0, 415.3, 466.2 };


void setup() {
  {
    Serial.begin(115200);
    ledcAttach(PIEZO_PIN, frequency, RES_PWM);
  }
}

void loop() {
  if (Serial.available()) {
    inString = Serial.readStringUntil('\n');

    Serial.println(inString);

    // source: https://arduino.stackexchange.com/questions/79551/read-comma-separated-string
    // only expecting two values, both integers
    int index = inString.indexOf(',');
    int keyHeld = inString.substring(0, index).toInt();

    // if the key has been released, stop playing.
    if (keyHeld == 0) {
      ledcWrite(PIEZO_PIN, 0);
    } else {

      String inString2 = inString.substring(index + 1);
      index = inString2.indexOf(',');
      int blackKey = inString2.substring(0, index).toInt();
      int keyIdx = inString2.substring(index + 1).toInt();

      if (blackKey) frequency = tonesBlk[keyIdx];
      else frequency = tonesWht[keyIdx];

      ledcWriteTone(PIEZO_PIN, frequency);
      ledcWrite(PIEZO_PIN, pulseWidth);
    }
  }
}