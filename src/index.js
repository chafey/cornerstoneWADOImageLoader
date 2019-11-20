// import 'regenerator-runtime/runtime';

import {
  convertRGBColorByPixel,
  convertRGBColorByPlane,
  convertYBRFullByPixel,
  convertYBRFullByPlane,
  convertPALETTECOLOR,
} from './imageLoader/colorSpaceConverters/index.js';

import { default as wadouri } from './imageLoader/wadouri/index.js';
import { default as wadors } from './imageLoader/wadors/index.js';
import { default as configure } from './imageLoader/configure.js';
import { default as convertColorSpace } from './imageLoader/convertColorSpace.js';
import { default as createImage } from './imageLoader/createImage.js';
import { default as createDecodeImageFrameTask } from './imageLoader/createDecodeImageFrameTask.js';
import { default as decodeJPEGBaseline8BitColor } from './imageLoader/decodeJPEGBaseline8BitColor.js';
import { default as getImageFrame } from './imageLoader/getImageFrame.js';
// import { default as getMinMax } from '../shared/getMinMax.js';
import { default as isColorImage } from './imageLoader/isColorImage.js';
import { default as isJPEGBaseline8BitColor } from './imageLoader/isJPEGBaseline8BitColor.js';
import { default as webWorkerManager } from './imageLoader/webWorkerManager.js';
// import { default as version } from '../version.js';
import { internal } from './imageLoader/internal/index.js';
import { default as external } from './externalModules.js';

// WEBWORKER
// import { registerTaskHandler } from './index.worker.js';
// import decodeTask from './webWorker/tasks/decodeTask.js';

// function registerDecodeTask() {
//   registerTaskHandler(decodeTask);
// }

const cornerstoneWADOImageLoader = {
  convertRGBColorByPixel,
  convertRGBColorByPlane,
  convertYBRFullByPixel,
  convertYBRFullByPlane,
  convertPALETTECOLOR,
  wadouri,
  wadors,
  configure,
  convertColorSpace,
  createImage,
  createDecodeImageFrameTask,
  decodeJPEGBaseline8BitColor,
  getImageFrame,
  // getMinMax,
  isColorImage,
  isJPEGBaseline8BitColor,
  webWorkerManager,
  // version,
  internal,
  external,
  // WebWorker
  // registerTaskHandler,
  // registerDecodeTask,
};

export {
  convertRGBColorByPixel,
  convertRGBColorByPlane,
  convertYBRFullByPixel,
  convertYBRFullByPlane,
  convertPALETTECOLOR,
  wadouri,
  wadors,
  configure,
  convertColorSpace,
  createImage,
  createDecodeImageFrameTask,
  decodeJPEGBaseline8BitColor,
  getImageFrame,
  // getMinMax,
  isColorImage,
  isJPEGBaseline8BitColor,
  webWorkerManager,
  // version,
  internal,
  external,
  // WebWorker
  // registerTaskHandler,
  // registerDecodeTask,
};

export default cornerstoneWADOImageLoader;
