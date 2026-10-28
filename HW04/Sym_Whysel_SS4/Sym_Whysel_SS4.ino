/*
 --- SS4: Spacial Sound ---
        by Sym Whysel
*/

#include <KISS_FFT_Arduino.h>

/* CONSTANTS */
const int BAUD_NUM = 115200;
const int READ_RESOLUTION = 12;
const int READ_RANGE = 4096;

const int SAMPLE_SIZE = 1024; // also fft size
const float SAMPLE_RATE = 44100.0f; // hz

const int MIC_COUNT = 4;

const int MIC_PIN_A = 4;
const int MIC_PIN_B = 5;
const int MIC_PIN_C = 6;
const int MIC_PIN_D = 7;

const int PEAK_SAMPLES = 1024;

const int MIC_PINS[4] = {MIC_PIN_A, MIC_PIN_B, MIC_PIN_C, MIC_PIN_D};

int lastVol = 0;

/* ARRAYS */
int16_t samples[SAMPLE_SIZE]; // array of samples
float results[MIC_COUNT]; // array of peak values for each mic

unsigned long sampleUS = 23; // fallback to 44100 hz

/* CONSTRUCTORS */
KissFFT fft(SAMPLE_SIZE);

/* UTILITY FUNCTIONS */

// Reference: https://www.physicsoftheuniverse.com/calculator/decibel.html
float getDecibels(float ratio, float ceiling) {

  // Prevent logf(0)!
  if (ratio == 0) ratio = 0.001;

  float dB = 20 * log10f(ratio);

  dB += ceiling;

  return dB;
}

// Source: https://rontersound.com/audio-tools-for-musicians/samples-to-milliseconds-calculator/
float HzToUS(float hertz) {
  return 1000000.0f / hertz;
}

/* ACTION FUNCTIONS */

int getSamples(int pin) {
  // function that reads SAMPLE_SIZE number of samples and assigns them to the samples[] array
  // for SAMPLE_SIZE try to take a sample, process, record, iterate

  // clear the sample array if its already filled
  for (int i = 0; i < SAMPLE_SIZE; i++) samples[i] = 0;

  // prep dynamic offset
  int sum = 0;

  for (int i = 0; i < SAMPLE_SIZE; i++) {
    
    unsigned long currentMicros = micros();
    unsigned long lastMicros = currentMicros;

    // wait a little
    while (currentMicros - lastMicros < sampleUS) {
      currentMicros = micros();
    }

    int sample = analogRead(pin);
    samples[i] = sample;
    sum += sample;
  }
  // Serial.printf("Sample 0: %i | Sum: %i\n", samples[0], sum);
  
  int offset = sum / SAMPLE_SIZE;

  for (int i = 0; i < SAMPLE_SIZE; i++) {
    samples[i] = samples[i] - offset;
  }

  return offset;
}

float pipeline(int pin) {

  int offset = getSamples(pin);

  // load input
  fft.setInput(samples, SAMPLE_SIZE, offset);

  // smooth input edges
  fft.applyWindowHann();

  // compute fft
  fft.compute();

  // get dominant bin
  // int bin = fft.dominantBin();

  // // get magnitude array
  // float* mags = fft.getMagnitude();

  // // get magnitude of dominant bin
  // float max = mags[bin];

  // Serial.println(max);

  float dB = getDecibels(fft.rms() * 1.414, 50);

  // Serial.printf("Offset: %f | RMS: %f | dB: %f\n" , offset, fft.rms(), dB);

  return dB;
}

/* SYSTEM FUNCTIONS */
void setup() {
  pinMode(MIC_PIN_A, INPUT);
  pinMode(MIC_PIN_B, INPUT);
  pinMode(MIC_PIN_C, INPUT);
  pinMode(MIC_PIN_D, INPUT);
  
  analogReadResolution(READ_RESOLUTION);

  Serial.begin(BAUD_NUM);

  sampleUS = HzToUS(SAMPLE_RATE);
}

void loop() {
  
  float a = pipeline(MIC_PIN_A);
  float b = pipeline(MIC_PIN_B);
  float c = pipeline(MIC_PIN_C);
  float d = pipeline(MIC_PIN_D);

  Serial.printf("%f,%f,%f,%f\n", a, b, c, d);
}


