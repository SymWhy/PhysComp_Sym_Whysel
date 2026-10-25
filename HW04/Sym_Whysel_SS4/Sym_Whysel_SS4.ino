/*
 --- SS4: Spacial Sound ---
        by Sym Whysel
*/

#include <KISS_FFT_Arduino.h>

/* CONSTANTS */
const int BAUD_NUM = 9600;
const int READ_RESOLUTION = 12;
const int READ_RANGE = 4096;

const int SAMPLE_SIZE = 1024; // also fft size
const float SAMPLE_RATE = 44100.0f; // hz

const int MIC_COUNT = 3;

const int MIC_PIN_A = 4;
const int MIC_PIN_B = 5;
const int MIC_PIN_C = 6;

const int OFFSET_SAMPLES = 1024;
const int PEAK_SAMPLES = 1024;

const int MIC_PINS[3] = {MIC_PIN_A, MIC_PIN_B, MIC_PIN_C};

/* VARIABLES */
int offsetA = 1024;
int offsetB = 1024;
int offsetC = 1024;
float samples[SAMPLE_SIZE]; // array of samples
float results[MIC_COUNT]; // array of peak values for each mic

unsigned long sampleUS = 23; // fallback to 44100 hz

/* CONSTRUCTORS */
KissFFT fft(SAMPLE_SIZE);

/* UTILITY FUNCTIONS */
// gets the calibrated midpoint
int getOffset(int micPin) {
  int sum = 0;
  for (int i = 0; i < OFFSET_SAMPLES; i++) {
    int mySample = analogRead(micPin);
    sum += mySample;
  }

  Serial.println(sum / OFFSET_SAMPLES);
  return sum / OFFSET_SAMPLES;
}

// return to AC -1 -> 0 -> 1 scale
int backToAC(int input, int offset) {
  return input - offset;
}

// source: https://forums.mikeholt.com/threads/electrical-theory.4654/
float toPeak(float rms) {
  return rms * 1.414;
}

// Reference: https://www.physicsoftheuniverse.com/calculator/decibel.html
float getDecibels(float rawVolume) {
  float ratioVolume = rawVolume / READ_RANGE;

  // Prevent logf(0)!
  if (ratioVolume == 0) ratioVolume = 0.001;

  return 20 * log10f(ratioVolume);
}

float normalizeAC(float input, int offset) {
  return abs(input - (offset));
}

// Source: https://rontersound.com/audio-tools-for-musicians/samples-to-milliseconds-calculator/
float HzToUS(float hertz) {
  return 1000000.0f / hertz;
}

float mapf(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/* ACTION FUNCTIONS */

// source: https://www.techtarget.com/whatis/definition/peak-to-peak-pk-pk
int catchPeak(int pin, int offset, unsigned long myWindow) {

  // initialize expected signal values
  // start at the opposite end of the spectrum so the minimum will
  // always be lower than initial min, max higher than initial max.
  int signalMin = READ_RANGE;
  int signalMax = 0;

  unsigned long lastMillis = millis();
  unsigned long currentMillis = lastMillis;

  int i = 0;

  while (i < PEAK_SAMPLES) {

    int mySignal = analogRead(pin);

    if (mySignal && mySignal > 0) {
      mySignal = abs(mySignal - (offset));

      // find highest
      signalMax = max(signalMax, mySignal);

      // find lowest
      signalMin = min(signalMin, mySignal);

      i++;
    }
  }

  // convert to peak amplitude
  // P2P is 2x peak amplitude
  return (signalMax - signalMin) / 2;
}

void getSamples(int pin, int offset) {
  // function that reads SAMPLE_SIZE number of samples and assigns them to the samples[] array
  // for SAMPLE_SIZE try to take a sample, process, record, iterate

  // clear the sample array if its already filled
  for (int i = 0; i < SAMPLE_SIZE; i++) samples[i] = 0;

  for (int i = 0; i < SAMPLE_SIZE; i++) {
    
    unsigned long currentMicros = micros();
    unsigned long lastMicros = currentMicros;
    // wait a little
    while (currentMicros - lastMicros < sampleUS) {
      currentMicros = micros();
    }

    float sample = analogRead(pin);

    sample = backToAC(sample, offset);

    // needs to be on a scale of -1 to 1
    sample = mapf(sample, -1.0f * offset, offset, -1.0f, 1.0f);
    sample = constrain(sample, -1.0f, 1.0f);
    samples[i] = sample;
  }
  // Serial.println(samples[0]);
}

void processSamples() {

  // load input
  fft.setInput(samples, SAMPLE_SIZE);

  // smooth input edges
  fft.applyWindowRect();

  // compute fft
  fft.compute();
}

float pipeline(int pin, int offset) {
  getSamples(pin, offset);
  // Serial.println(samples[0]);
  processSamples();
  return toPeak(fft.rms());
}

/* SYSTEM FUNCTIONS */
void setup() {
  pinMode(MIC_PIN_A, INPUT);
  pinMode(MIC_PIN_B, INPUT);
  pinMode(MIC_PIN_C, INPUT);
  
  analogReadResolution(READ_RESOLUTION);

  Serial.begin(BAUD_NUM);

  // offsetA = getOffset(MIC_PIN_A);
  // offsetB = getOffset(MIC_PIN_B);
  // offsetC = getOffset(MIC_PIN_C);

  sampleUS = HzToUS(SAMPLE_RATE);
}

void loop() {
  // results[0] = pipeline(MIC_PIN_A, offsetA);
  // results[1] = pipeline(MIC_PIN_B, offsetB);
  // results[2] = pipeline(MIC_PIN_C, offsetC);

  int a = catchPeak(MIC_PIN_A, offsetA, 64);
  int b = catchPeak(MIC_PIN_B, offsetB, 64);
  int c = catchPeak(MIC_PIN_C, offsetC, 64);

  // Serial.printf("%f,%f,%f\r\n", a, b, c);
}


