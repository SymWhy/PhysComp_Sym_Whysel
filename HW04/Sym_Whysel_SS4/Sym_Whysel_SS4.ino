/*
 --- SS4: Spacial Sound ---
        by Sym Whysel
*/

/* CONSTANTS */
const int BAUD_NUM = 9600;
const int SAMPLE_SIZE = 1024; // also fft size
const float SAMPLE_RATE = 44100.0f; // hz
const int MIC_COUNT = 3;
const int MIC_PIN_A = 1;
const int MIC_PIN_B = 2;
const int MIC_PIN_C = 2;
const int OFFSET_SAMPLES = 1024;

/* VARIABLES */
int offset;
float samples[SAMPLE_SIZE]; // array of samples
float results[MIC_COUNT]; // array of peak values for each mic

unsigned long sampleUS = 23; // fallback to 44100 hz

/* CONSTRUCTORS */
KissFFT fft_A(SAMPLE_SIZE);
KissFFT fft_B(SAMPLE_SIZE);
KissFFT fft_C(SAMPLE_SIZE);

KissFFT ffts = [fft_A, fft_B, fft_C];

/* UTILITY FUNCTIONS */
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

// Source: https://rontersound.com/audio-tools-for-musicians/samples-to-milliseconds-calculator/
float HzToUS(float hertz) {
  return 1000000.0f / hertz;
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

// source: https://forums.mikeholt.com/threads/electrical-theory.4654/
void readPeak(KissFFT myFFT) {
  peak = myFFT.rms() * 1.414;
}

/* SYSTEM FUNCTIONS */
void setup() {
  pinMode(MIC_PIN_A, INPUT);
  pinMode(MIC_PIN_B, INPUT);
  pinMode(MIC_PIN_C, INPUT);
  
  analogReadResolution(16);

  Serial.begin(BAUD_NUM);

  offset = getOffset();
  sampleUS = HzToUS(SAMPLE_RATE);
}

void loop() {
  for (i = 0; i < MIC_COUNT; i++) {
    ffts[i].getSamples();
    ffts[i].processSamples();
    results[i] = readPeak(ffts[i]);
  }

  Serial.printf("%i,%i\n", results[0], results[1]);
}


