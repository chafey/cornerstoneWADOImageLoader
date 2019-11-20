import external from '../externalModules.js';
import getImageFrame from './getImageFrame.js';
import createDecodeImageFrameTask from './createDecodeImageFrameTask.js';
import isColorImageFn from './isColorImage.js';
import convertColorSpace from './convertColorSpace.js';
import getMinMax from '../shared/getMinMax.js';
import isJPEGBaseline8BitColor from './isJPEGBaseline8BitColor.js';

let lastImageIdDrawn = '';

function isModalityLUTForDisplay(sopClassUid) {
  // special case for XA and XRF
  // https://groups.google.com/forum/#!searchin/comp.protocols.dicom/Modality$20LUT$20XA/comp.protocols.dicom/UBxhOZ2anJ0/D0R_QP8V2wIJ
  return (
    sopClassUid !== '1.2.840.10008.5.1.4.1.1.12.1' && // XA
    sopClassUid !== '1.2.840.10008.5.1.4.1.1.12.2.1'
  ); // XRF
}

function convertToIntPixelData(floatPixelData) {
  const floatMinMax = getMinMax(floatPixelData);
  const floatRange = Math.abs(floatMinMax.max - floatMinMax.min);
  const intRange = 65535;
  const slope = floatRange / intRange;
  const intercept = floatMinMax.min;
  const numPixels = floatPixelData.length;
  const intPixelData = new Uint16Array(numPixels);

  let min = 65535;

  let max = 0;

  for (let i = 0; i < numPixels; i++) {
    const rescaledPixel = Math.floor((floatPixelData[i] - intercept) / slope);

    intPixelData[i] = rescaledPixel;
    min = Math.min(min, rescaledPixel);
    max = Math.max(max, rescaledPixel);
  }

  return {
    min,
    max,
    intPixelData,
    slope,
    intercept,
  };
}

/**
 * Helper function to set pixel data to the right typed array.  This is needed because web workers
 * can transfer array buffers but not typed arrays
 * @param imageFrame
 */
function setPixelDataType(imageFrame) {
  if (imageFrame.bitsAllocated === 32) {
    imageFrame.pixelData = new Float32Array(imageFrame.pixelData);
  } else if (imageFrame.bitsAllocated === 16) {
    if (imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(imageFrame.pixelData);
    } else {
      imageFrame.pixelData = new Int16Array(imageFrame.pixelData);
    }
  } else {
    imageFrame.pixelData = new Uint8Array(imageFrame.pixelData);
  }
}

/**
 *
 * @param {*} imageId
 * @param {*} encodedPixelData
 * @param {*} transferSyntax
 * @param {*} options
 * @returns Promise<Image>
 */
// eslint-disable-next-line
async function createImage(imageId, encodedPixelData, transferSyntax, options) {
  if (!encodedPixelData || !encodedPixelData.length) {
    return Promise.reject(new Error('The file does not contain image data.'));
  }

  const { cornerstone } = external;
  const canvas = document.createElement('canvas');
  const encodedImageFrame = getImageFrame(imageId);

  console.warn('~~~~', encodedPixelData.length);

  // Grab all of the metadata we may need
  const imagePlaneModule =
    cornerstone.metaData.get('imagePlaneModule', imageId) || {};
  const { windowCenter, windowWidth, voiLUTSequence } =
    cornerstone.metaData.get('voiLutModule', imageId) || {};
  const { rescaleIntercept, rescaleSlope, modalityLUTSequence } =
    cornerstone.metaData.get('modalityLutModule', imageId) || {};
  const sopCommonModule =
    cornerstone.metaData.get('sopCommonModule', imageId) || {};

  // Decode our pixelData/imageFrame
  const imageFrame = await createDecodeImageFrameTask(
    encodedImageFrame,
    transferSyntax,
    encodedPixelData,
    canvas,
    options
  );

  console.log(encodedImageFrame);
  console.log(imageFrame); // not defined :thinking:

  // Computed from metadata
  const isColorImage = isColorImageFn(
    encodedImageFrame.photometricInterpretation
  );
  const hasModalityLut =
    modalityLUTSequence &&
    modalityLUTSequence.length > 0 &&
    isModalityLUTForDisplay(sopCommonModule.sopClassUID);
  const hasVoiLut = voiLUTSequence && voiLUTSequence.length > 0;

  // encodedPixelData (dataSet) becomes `undefined` on `createDecodeImageFrameTask`
  // encodedPixelData --> imageFrame.pixelData (decoded arrayBuffer)
  // imageFrame.pixelData --> setPixelDataType --> (decoded pixelData)

  // JPEGBaseline (8 bits) is already returning the pixel data in the right format (rgba)
  // because it's using a canvas to load and decode images.
  if (!isJPEGBaseline8BitColor(imageFrame, transferSyntax)) {
    setPixelDataType(imageFrame);

    // convert color space
    if (isColorImage) {
      _convertColorSpace(canvas, imageFrame);
    }
  }

  console.warn('~~~~', encodedPixelData.length);
  console.warn('~~~~ dec: ', imageFrame.pixelData.length);

  const image = {
    imageId,
    color: isColorImage,
    columnPixelSpacing: imagePlaneModule.columnPixelSpacing,
    columns: imageFrame.columns,
    height: imageFrame.rows,
    intercept: rescaleIntercept ? rescaleIntercept : 0,
    invert: imageFrame.photometricInterpretation === 'MONOCHROME1',
    minPixelValue: imageFrame.smallestPixelValue,
    maxPixelValue: imageFrame.largestPixelValue,
    rowPixelSpacing: imagePlaneModule.rowPixelSpacing,
    rows: imageFrame.rows,
    sizeInBytes: imageFrame.pixelData.length,
    slope: rescaleSlope ? rescaleSlope : 1,
    width: imageFrame.columns,
    windowCenter: windowCenter ? windowCenter[0] : undefined,
    windowWidth: windowWidth ? windowWidth[0] : undefined,
    decodeTimeInMS: imageFrame.decodeTimeInMS,
    floatPixelData: undefined,
    //
    modalityLUT: hasModalityLut ? modalityLUTSequence[0] : undefined,
    voiLUT: hasVoiLut ? voiLUTSequence[0] : undefined,
  };

  // add function to return pixel data
  if (imageFrame.pixelData instanceof Float32Array) {
    const floatPixelData = imageFrame.pixelData;
    const results = convertToIntPixelData(floatPixelData);

    image.minPixelValue = results.min;
    image.maxPixelValue = results.max;
    image.slope = results.slope;
    image.intercept = results.intercept;
    image.floatPixelData = floatPixelData;
    image.getPixelData = () => results.intPixelData;
  } else {
    image.getPixelData = () => imageFrame.pixelData;
  }

  if (isColorImage) {
    image.getCanvas = function() {
      if (lastImageIdDrawn === imageId) {
        return canvas;
      }

      canvas.height = image.rows;
      canvas.width = image.columns;
      const context = canvas.getContext('2d');

      context.putImageData(imageFrame.imageData, 0, 0);
      lastImageIdDrawn = imageId;

      return canvas;
    };

    image.windowWidth = 255;
    image.windowCenter = 127;
  }

  // set the ww/wc to cover the dynamic range of the image if no values are supplied
  if (image.windowCenter === undefined || image.windowWidth === undefined) {
    const maxVoi = image.maxPixelValue * image.slope + image.intercept;
    const minVoi = image.minPixelValue * image.slope + image.intercept;

    image.windowWidth = maxVoi - minVoi;
    image.windowCenter = (maxVoi + minVoi) / 2;
  }

  return image;
}

/**
 *
 * @param {*} canvas
 * @param {*} imageFrame
 */
function _convertColorSpace(canvas, imageFrame) {
  // setup the canvas context
  canvas.height = imageFrame.rows;
  canvas.width = imageFrame.columns;

  const context = canvas.getContext('2d');
  const imageData = context.createImageData(
    imageFrame.columns,
    imageFrame.rows
  );

  convertColorSpace(imageFrame, imageData);
  imageFrame.imageData = imageData;
  imageFrame.pixelData = imageData.data;

  // calculate smallest and largest PixelValue of the converted pixelData
  const minMax = getMinMax(imageFrame.pixelData);

  imageFrame.smallestPixelValue = minMax.min;
  imageFrame.largestPixelValue = minMax.max;
}

export default createImage;
