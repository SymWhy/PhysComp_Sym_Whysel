const int PIEZO_PIN = 1;
const int ADC_PIN_SPD = 4;
const int ADC_PIN_FRQ = 5;
const int RES_PWM = 12;   // resolution of PWM duty cycle, 12 is max value

int pulseWidth = 127;     // 8-bit 0-255 range, 127 is 50% Duty Cycle
float frequency = 440;
unsigned long noteTime = 100; // how long we're holding the note

char inByte;
int adcRead;

void setup() {
  {
    Serial.begin(115200);
    ledcAttach(PIEZO_PIN, frequency, RES_PWM);
    pinMode(ADC_PIN_SPD, INPUT);
    pinMode(ADC_PIN_FRQ, INPUT);
    analogReadResolution(8); // 0-255
  }
}

void loop() {
  frequency = map(analogRead(ADC_PIN_FRQ), 0, 255, 110, 880 );
  readSerial();
  Serial.write(analogRead(ADC_PIN_SPD));
}

void readSerial() {
  if(Serial.available()) {
    inByte = Serial.read();

    switch (inByte) {
      case '1': {
        ledcWriteTone(PIEZO_PIN, frequency);
        ledcWrite(PIEZO_PIN, pulseWidth);

        unsigned long lastTime = millis();
        while(millis() - lastTime < noteTime);

        ledcWrite(PIEZO_PIN, 0);
        break;
      }

      default:
        ledcWrite(PIEZO_PIN, 0);
        break;
    }
  }
}