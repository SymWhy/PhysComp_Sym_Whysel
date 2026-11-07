const int PIEZO_PIN = 1;
const int RES_PWM = 12;   // resolution of PWM duty cycle, 12 is max value

int pulseWidth = 127;     // 8-bit 0-255 range, 127 is 50% Duty Cycle
float frequency = 440;
unsigned long noteTime = 100; // how long we're holding the note

char inByte;

void setup() {
  {
    Serial.begin(115200);
    ledcAttach(PIEZO_PIN, frequency, RES_PWM);
  }
}

void loop() {
  if(Serial.available()) {
    inByte = Serial.read();
    Serial.println(inByte);
    if(inByte == '1') {
      ledcWriteTone(PIEZO_PIN, frequency);
      ledcWrite(PIEZO_PIN, pulseWidth);

      unsigned long lastTime = millis();
      while (millis() - lastTime < noteTime);
      ledcWrite(PIEZO_PIN, 0);
    }
  }
}
