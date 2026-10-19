/* 
 --- SS3: FREQUENCY VISUALIZER ---
        by Sym Whysel

  Library:
  Kiss FFT, https://github.com/meerzafarnoohani/KISS_FFT

*/


/* LIBRARIES */
#include <KISS_FFT_Arduino.h>

/* CONSTANTS */
const int BAUD_NUM = 9600;
const int SAMPLE_SIZE = 1024; // also fft size
const float SAMPLE_RATE = 44100.0f; // hz
const int MIC_PIN = 1;
const int OFFSET_SAMPLES = 1024;

/* VARIABLES */
int offset;
float samples[SAMPLE_SIZE]; // array of samples
unsigned long sampleUS = 23; // fallback to 44100 hz

/* CONSTRUCTORS */
KissFFT fft(SAMPLE_SIZE);

/* SETUP FUNCTIONS */

int getOffset() {
  int sum = 0;
  int i = 0;

  while (i < OFFSET_SAMPLES) {
    int mySample = analogRead(MIC_PIN);
    sum += mySample;
    i++;
  }

  return sum / OFFSET_SAMPLES;
}


/* UTILITY FUNCTIONS */

// return to AC -1 -> 0 -> 1 scale
int backToAC(int input) {
  return input - offset;
}

// Source: https://rontersound.com/audio-tools-for-musicians/samples-to-milliseconds-calculator/
float HzToUS(float hertz) {
  return 1000000.0f / hertz;
}

float mapf(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// map and constrain incoming values to the appropriate scale
float processValue(float value, float in_min, float in_max, float out_min, float out_max) {
  float mappedVal = mapf(value, in_min, in_max, out_min, out_max);
  return constrain(mappedVal, out_min, out_max);
}

/* ACTION FUNCTIONS */

void getSamples() {
  // function that reads SAMPLE_SIZE number of samples and assigns them to the samples[] array
  // for SAMPLE_SIZE try to take a sample, process, record, iterate

  int i = 0;

  for (int i = 0; i < SAMPLE_SIZE; i++) {
    
    unsigned long currentMicros = micros();
    unsigned long lastMicros = currentMicros;
    // wait a little
    while (currentMicros - lastMicros < sampleUS) {
      currentMicros = micros();
    }

    float sample = analogRead(MIC_PIN);

    sample = backToAC(sample);

    sample = mapf(sample, -1 * offset, offset, -1, 1);
    sample = constrain(sample, -1, 1);
    samples[i] = sample;
  }
}

void processSamples() {
  // load input
  fft.setInput(samples, SAMPLE_SIZE);

  // smooth input edges
  fft.applyWindowRect();

  // compute fft
  fft.compute();
}

// each fft call returns a frequency in hz, and a magnitude
// these are mapped to 0-255, and used for hue and value respectively

void printValues() {

  float bin = fft.dominantBin();
  float freq = fft.binToFrequency(bin, SAMPLE_RATE);
  float rms = fft.rms();

  int freqMapped = processValue(freq, 60, 3000, 0, 255);
  int rmsMapped = processValue(rms, 0, 1, 0, 255);

  // print to serial
  Serial.printf("%f,%f,%i,%i\r\n", freq, rms, freqMapped, rmsMapped);
}


/* SYSTEM FUNCTIONS */

void setup() {
  pinMode(MIC_PIN, INPUT);
  
  analogReadResolution(16);

  Serial.begin(BAUD_NUM);

  offset = getOffset();
  sampleUS = HzToUS(SAMPLE_RATE);
}

void loop() {
  
  getSamples(); 

  processSamples();

  printValues();
}