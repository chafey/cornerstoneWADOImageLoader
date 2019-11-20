import { getOptions } from './../internal/options.js';

/**
 *
 * @param {*} imageFrame
 * @param {*} transferSyntax
 * @param {*} pixelData
 * @param {*} canvas
 * @param {object} [options={}]
 */
export default async function processDecodeTask(
  imageFrame,
  transferSyntax,
  pixelData,
  canvas,
  options = {}
) {
  const { useWebWorkers } = getOptions();

  const decodeStrategyModule =
    useWebWorkers === false
      ? await import(
          /* webpackChunkName: "decodeOnMainThread" */
          './decodeOnMainThread.js'
        )
      : await import(
          /* webpackChunkName: "decodeOnWorker" */
          './decodeOnWorker.js'
        );

  return decodeStrategyModule.default(
    imageFrame,
    transferSyntax,
    pixelData,
    canvas,
    options
  );
}
