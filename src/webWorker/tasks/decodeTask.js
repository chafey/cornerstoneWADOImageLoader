import { initializeJPEG2000Async } from '../../shared/decoders/decodeJPEG2000Async.js';
import { initializeJPEGLS } from '../../shared/decoders/decodeJPEGLS.js';
import calculateMinMax from '../../shared/calculateMinMax.js';
import decodeImageFrameAsync from '../../shared/decodeImageFrameAsync.js';

// the configuration object for the decodeTask
let decodeConfig;

/**
 * Function to control loading and initializing the codecs
 * @param config
 */
async function loadCodecs(config) {
  // Initialize the codecs
  if (config.decodeTask.initializeCodecsOnStartup) {
    await initializeJPEG2000Async(config.decodeTask);
    initializeJPEGLS(config.decodeTask);
  }
}

/**
 * Task initialization function
 */
async function initialize(config) {
  decodeConfig = config;

  await loadCodecs(config);
}

/**
 * Task handler function
 */

/**
 *
 * @param {*} data
 * @param {*} doneCallback
 */
async function handler(data, doneCallback) {
  // Load the codecs if they aren't already loaded
  await loadCodecs(decodeConfig);

  const strict =
    decodeConfig && decodeConfig.decodeTask && decodeConfig.decodeTask.strict;
  const {
    imageFrame,
    pixelData: encodedArrayBuffer,
    transferSyntax,
    options: decodeOptions,
  } = data.data;

  // Convert from ArrayBuffer to Uint8Array
  // Web workers support passing ArrayBuffers but not typed arrays
  const encodedPixelData = new Uint8Array(encodedArrayBuffer);

  await decodeImageFrameAsync(
    imageFrame,
    transferSyntax,
    encodedPixelData,
    decodeConfig.decodeTask,
    decodeOptions
  );

  console.warn('magic should have happened by now');

  if (!imageFrame.pixelData) {
    throw new Error(
      'decodeTask: imageFrame.pixelData is undefined after decoding'
    );
  }

  calculateMinMax(imageFrame, strict);

  // convert from TypedArray to ArrayBuffer since web workers support passing ArrayBuffers but not
  // typed arrays
  imageFrame.pixelData = imageFrame.pixelData.buffer;

  // invoke the callback with our result and pass the pixelData in the transferList to move it to
  // UI thread without making a copy
  doneCallback(imageFrame, [imageFrame.pixelData]);
}

export default {
  taskType: 'decodeTask',
  handler,
  initialize,
};
