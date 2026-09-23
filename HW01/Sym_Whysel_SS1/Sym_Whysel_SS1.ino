const int ledPin01 = 4;
const int ledPin02 = 5;
const int ledPin03 = 6;
const int ledPin04 = 7;

int phase = 0;
int ms = 500;

void setup() {
  pinMode(ledPin01, OUTPUT);
  pinMode(ledPin02, OUTPUT);
  pinMode(ledPin03, OUTPUT);
  pinMode(ledPin04, OUTPUT);

  Serial.begin(115200);
}

void loop() {
  // all on
  digitalWrite(ledPin01, HIGH);
  digitalWrite(ledPin02, HIGH);
  digitalWrite(ledPin03, HIGH);
  digitalWrite(ledPin04, HIGH);

  delay(ms);

  // all off
  digitalWrite(ledPin01, LOW);
  digitalWrite(ledPin02, LOW);
  digitalWrite(ledPin03, LOW);
  digitalWrite(ledPin04, LOW);

  delay(ms);

  // outer two
  digitalWrite(ledPin01, HIGH);
  digitalWrite(ledPin04, HIGH);

  delay(ms);

  // inner two
  digitalWrite(ledPin01, LOW);
  digitalWrite(ledPin04, LOW);
  digitalWrite(ledPin02, HIGH);
  digitalWrite(ledPin03, HIGH);

  delay(ms);

  // one two three four
  digitalWrite(ledPin02, LOW);
  digitalWrite(ledPin03, LOW);

  digitalWrite(ledPin01, HIGH);
  delay(ms);

  digitalWrite(ledPin02, HIGH);
  delay(ms);

  digitalWrite(ledPin03, HIGH);
  delay(ms);

  digitalWrite(ledPin04, HIGH);

  delay(ms);

  //off
  digitalWrite(ledPin01, LOW);
  digitalWrite(ledPin02, LOW);
  digitalWrite(ledPin03, LOW);
  digitalWrite(ledPin04, LOW);

  delay(ms);
}
