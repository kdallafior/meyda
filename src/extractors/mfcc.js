import powerSpectrum from './powerSpectrum';
import freqToMel from './../utilities';
import melToFreq from './../utilities';

var dct = require('dct');

export default function(args) {
  if (typeof args.ampSpectrum !== 'object' ||
       typeof args.melFilterBank !== 'object') {
    throw new TypeError();
  }

  // Tutorial from:
  // http://practicalcryptography.com/miscellaneous/machine-learning
  // /guide-mel-frequency-cepstral-coefficients-mfccs/
  let powSpec = powerSpectrum(args);
  let numFilters = args.melFilterBank.length;
  let filtered = Array(numFilters);

  let loggedMelBands = new Float32Array(numFilters);

  for (let i = 0; i < loggedMelBands.length; i++) {
    filtered[i] = new Float32Array(args.bufferSize / 2);
    loggedMelBands[i] = 0;
    for (let j = 0; j < (args.bufferSize / 2); j++) {
      //point-wise multiplication between power spectrum and filterbanks.
      filtered[i][j] = args.melFilterBank[i][j] * powSpec[j];

      //summing up all of the coefficients into one array
      loggedMelBands[i] += filtered[i][j];
    }

    //log each coefficient unless it's 0.
    loggedMelBands[i] = loggedMelBands[i] > 0.00001 ?
        Math.log(loggedMelBands[i]) : 0;
  }

  //dct
  let loggedMelBandsArray = Array.prototype.slice.call(loggedMelBands);
  let mfccs = dct(loggedMelBandsArray);
  let mfccsArray = new Float32Array(mfccs);

  return mfccsArray;
}
