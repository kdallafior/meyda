(function () {
  var _this;
  const Audio = function (bufferSize) {
    this.context = new AudioContext();

    this.synthesizer = {};
    this.synthesizer.out = this.context.createGain();

    this.meyda = Meyda.createMeydaAnalyzer({
      audioContext: this.context,
      source: this.synthesizer.out,
      bufferSize: bufferSize,
      windowingFunction: 'blackman',
    });
    _this = this;
    this.initializeMicrophoneSampling();
  };

  Audio.prototype.initializeMicrophoneSampling = function () {
    console.groupCollapsed('Initializing Microphone Sampling');
    navigator.getUserMedia = navigator.webkitGetUserMedia ||
      navigator.getUserMedia;
    var constraints = { video: false, audio: true };
    var successCallback = function (mediaStream) {
      console.log('User allowed microphone access.');
      console.log('Initializing AudioNode from MediaStream');
      var source = _this.context.createMediaStreamSource(mediaStream);
      console.log('Setting Meyda Source to Microphone');
      _this.meyda.setSource(source);
      console.groupEnd();
    };

    var errorCallback = function (err) {
      // We should fallback to an audio file here, but that's difficult on mobile
      console.err('Error: ', err);
      console.groupEnd();
    };

    try {
      console.log('Asking for permission...');
      navigator.getUserMedia(
        constraints,
        successCallback,
        errorCallback
      );
    }
    catch (e) {
      var p = navigator.mediaDevices.getUserMedia(constraints);
      p.then(successCallback);
      p.catch(errorCallback);
    }
  };

  Audio.prototype.get = function (features) {
    return _this.meyda.get(features);
  };

  module.exports = Audio;
})();
