var chai = require('chai');
var assert = chai.assert;
var TestData = require('../TestData');

// Setup
var spectralFlatness = require('../../dist/node/extractors/spectralFlatness');

describe('spectralFlatness', function () {
  it('should return correct Spectral Flatness value', function (done) {
    var en = spectralFlatness({
      ampSpectrum:TestData.VALID_AMPLITUDE_SPECTRUM,
    });

    assert.equal(en, 0.4395908170404335);

    done();
  });

  it('should throw an error when passed an empty object', function (done) {
    try {
      var en = spectralFlatness({});
    } catch (e) {
      done();
    }
  });

  it('should throw an error when not passed anything', function (done) {
    try {
      var en = spectralFlatness();
    } catch (e) {
      done();
    }
  });

  it('should throw an error when passed something invalid', function (done) {
    try {
      var en = spectralFlatness({ signal:'not a signal' });
    } catch (e) {
      done();
    }
  });
});
