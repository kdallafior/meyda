(function () {
  'use strict';
    const bufferSize = 1024;
  let Audio = require('./audio');
  let a = new Audio(bufferSize);

  document.getElementById('osc1Freq').onchange = function (e) {
    a.synthesizer.osc1.frequency.value = 110 + 1000 * Math.pow(this.value, 2);
  };

  document.getElementById('switchToMicButton').onclick = a.initializeMicrophoneSampling;

  var resolution = 720;
  var aspectRatio = 16 / 10;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 1000);

  var initializeFFTs = function (number, pointCount) {
    var ffts = [];
    for (var i = 0; i < number; i++) {
      ffts.push(Array.apply(null, Array(pointCount)).map(
        Number.prototype.valueOf, 0
      ));
    }

    return ffts;
  };

  var material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  var yellowMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
  });

  var ffts = initializeFFTs(20, bufferSize);
  var buffer = null;

  var renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  renderer.setSize(resolution * aspectRatio, resolution);
  document.body.appendChild(renderer.domElement);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  camera.position.z = 5;

  // Unchanging variables
  var length = 1;
  var hex = 0xffff00;
  var dir = new THREE.Vector3(0, 1, 0);
  var rightDir = new THREE.Vector3(1, 0, 0);
  var origin = new THREE.Vector3(1, -6, -15);

  var g = new THREE.Geometry();
  g.vertices.push(new THREE.Vector3(-11, -3, -15));
  g.vertices.push(new THREE.Vector3(11, -3, -15));

  // Variables we update
  let centroidArrow = new THREE.ArrowHelper(dir, origin, length, hex);
  let rolloffArrow = new THREE.ArrowHelper(dir, origin, length, 0x0000ff);
  let rmsArrow = new THREE.ArrowHelper(rightDir, origin, length, 0xff00ff);
  let lines = new THREE.Group(); // Lets create a seperate group for our lines
  // let loudnessLines = new THREE.Group();
  // let bufferLine = new THREE.Line(g, material);
  scene.add(centroidArrow);
  scene.add(rolloffArrow);
  scene.add(rmsArrow);
  // scene.add(bufferLine);

  // Render Spectrogram
  for (let i = 0; i < ffts.length; i++) {
    if (ffts[i]) {
      let geometry = new THREE.BufferGeometry(); // May be a way to reuse this

      var positions = new Float32Array(ffts[i].length * 3);

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setDrawRange(0, ffts[i].length);

      var line = new THREE.Line(geometry, material);
      lines.add(line);

      var positions = line.geometry.attributes.position.array;
      var index = 0;

      for (var j = 0; j < ffts[i].length; j++) {
        positions[index++] = -11 + (22 * j / ffts[i].length);
        positions[index++] = -5 + ffts[i][j];
        positions[index++] = -15 - i;
      }
    }
  }

  scene.add(lines);

  // scene.add(loudnessLines);
  // scene.add(bufferLine);

  let features = null;

  function render() {
    features = a.get([
      'amplitudeSpectrum',
      'spectralCentroid',
      'spectralRolloff',
      'loudness',
      'rms',
    ]);
    if (features) {
      ffts.pop();
      ffts.unshift(features.amplitudeSpectrum);
      const windowedSignalBuffer = a.meyda._m.windowedSignal;

      for (let i = 0; i < ffts.length; i++) {
        var positions = lines.children[i].geometry.attributes.position.array;
        var index = 0;

          for (var j = 0; j < ffts[i].length*3; j++) {
          positions[index++] = -11 + (22 * j / ffts[i].length);
          positions[index++] = -5 + ffts[i][j];
          positions[index++] = -15 - i;
        }

        lines.children[i].geometry.attributes.position.needsUpdate = true;
      }

      // Render Spectral Centroid Arrow
      if (features.spectralCentroid) {
        // SpectralCentroid is an awesome variable name
        // We're really just updating the x axis
        centroidArrow.position.set(-11 +
          (22 * features.spectralCentroid / bufferSize / 2), -6, -15);
      }

      // Render Spectral Rolloff Arrow
      if (features.spectralRolloff) {
        // We're really just updating the x axis
        rolloffArrow.position.set(
          -11 + (features.spectralRolloff / 44100 * 22), -6, -15);
      }
      // Render RMS Arrow
      if (features.rms) {
        // We're really just updating the x axis
        rmsArrow.position.set(-11, -5 + (10 * features.rms), -15);
      }

      // // Render windowed buffer
      // if (windowedSignalBuffer) {
      //   let geometry = new THREE.Geometry();
      //   for (let i = 0; i < windowedSignalBuffer.length; i++) {
      //     geometry.vertices.push(new THREE.Vector3(
      //       -11 + 22 * i / windowedSignalBuffer.length,
      //       10 + windowedSignalBuffer[i] * 1.5, -35
      //     ));
      //   }

      //   bufferLine.geometry = geometry;
      //   geometry.dispose();

      //   bufferLine.geometry.attributes.position.needsUpdate = true;
      // }

      // // Render loudness
      // if (features.loudness && features.loudness.specific) {
      //   for (var i = 0; i < features.loudness.specific.length; i++) {
      //     let geometry = new THREE.Geometry();
      //     geometry.vertices.push(new THREE.Vector3(
      //       -11 + 22 * i / features.loudness.specific.length,
      //       -6 + features.loudness.specific[i] * 3,
      //       -15
      //     ));
      //     geometry.vertices.push(new THREE.Vector3(
      //       -11 + 22 * i / features.loudness.specific.length + 22 /
      //       features.loudness.specific.length,
      //       -6 + features.loudness.specific[i] * 3,
      //       -15
      //     ));
      //     loudnessLines.add(new THREE.Line(geometry, yellowMaterial));
      //     geometry.dispose();
      //   }
      // }

      // // I feel like there is a faster way to do this?
      // for (let c = 0; c < loudnessLines.children.length; c++) {
      //   loudnessLines.remove(loudnessLines.children[c]); //forEach is slow
      // }
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  render();
})();
