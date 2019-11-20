import webWorkerManager from './../webWorkerManager.js';

/**
 *
 * @param {*} imageFrame
 * @param {*} transferSyntax
 * @param {*} pixelData
 * @param {*} canvas
 * @param {object} [options={}]
 * @param {bool} [options.priority]
 * @returns Promise<>
 */
export default function _decodeOnWorker(
  imageFrame,
  transferSyntax,
  pixelData,
  canvas,
  options = {}
) {
  const transferList = [pixelData.buffer];
  const priority = options.priority || undefined;

  console.log('decode on worker...');

  return webWorkerManager.addTask(
    'decodeTask',
    {
      imageFrame,
      transferSyntax,
      pixelData,
      options,
    },
    priority,
    transferList
  ).promise;
}
