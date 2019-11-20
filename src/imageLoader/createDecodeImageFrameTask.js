import processDecodeTask from './processDecodeTask/index.js';
import decodeJPEGBaseline8BitColor from './decodeJPEGBaseline8BitColor.js';

/**
 *
 *
 * @param {*} imageFrame
 * @param {string} transferSyntax
 * @param {*} pixelData
 * @param {*} canvas
 * @param {object} [options={}]
 */
async function createDecodeImageFrameTask(
  imageFrame,
  transferSyntax,
  pixelData,
  canvas,
  options = {}
) {
  try {
    const applyDecodeStrategyForTransferSyntax =
      supportedTransferSyntaxes[transferSyntax];

    if (applyDecodeStrategyForTransferSyntax) {
      const decodedImageFrame = await applyDecodeStrategyForTransferSyntax(
        imageFrame,
        transferSyntax,
        pixelData,
        canvas,
        options
      );

      return decodedImageFrame;
    }
  } catch (err) {
    new Error(`No decoder for transfer syntax ${transferSyntax}`);
  }
}

const supportedTransferSyntaxes = {
  '1.2.840.10008.1.2': processDecodeTask, // Implicit VR Little Endian
  '1.2.840.10008.1.2.1': processDecodeTask, // Explicit VR Little Endian
  '1.2.840.10008.1.2.2': processDecodeTask, // Explicit VR Big Endian (retired)
  '1.2.840.10008.1.2.1.99': processDecodeTask, // Deflate transfer syntax (deflated by dicomParser)
  '1.2.840.10008.1.2.5': processDecodeTask, // RLE Lossless
  '1.2.840.10008.1.2.4.50': _jpegBaselineDecode, // JPEG Baseline lossy process 1 (8 bit)
  '1.2.840.10008.1.2.4.51': processDecodeTask, // JPEG Baseline lossy process 2 & 4 (12 bit)
  '1.2.840.10008.1.2.4.57': processDecodeTask, // JPEG Lossless, Nonhierarchical (Processes 14)
  '1.2.840.10008.1.2.4.70': processDecodeTask, // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
  '1.2.840.10008.1.2.4.80': processDecodeTask, // JPEG-LS Lossless Image Compression
  '1.2.840.10008.1.2.4.81': processDecodeTask, // JPEG-LS Lossy (Near-Lossless) Image Compression
  '1.2.840.10008.1.2.4.90': processDecodeTask, // JPEG 2000 Lossless
  '1.2.840.10008.1.2.4.91': processDecodeTask, // JPEG 2000 Lossy
  // '1.2.840.10008.1.2.4.92': decodeJPEG2000(dataSet, frame), // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
  // '1.2.840.10008.1.2.4.93': decodeJPEG2000(dataSet, frame), // JPEG 2000 Part 2 Multicomponent Image Compression
};

/**
 *
 * @param {*} imageFrame
 * @param {*} transferSyntax
 * @param {*} pixelData
 * @param {*} options
 * @param {*} canvas
 */
function _jpegBaselineDecode(
  imageFrame,
  transferSyntax,
  pixelData,
  options,
  canvas
) {
  // Handle 8-bit JPEG Baseline color images using the browser's built-in
  // JPEG decoding
  if (
    imageFrame.bitsAllocated === 8 &&
    (imageFrame.samplesPerPixel === 3 || imageFrame.samplesPerPixel === 4)
  ) {
    return decodeJPEGBaseline8BitColor(imageFrame, pixelData, canvas);
  }

  return processDecodeTask(imageFrame, transferSyntax, pixelData, options);
}

export default createDecodeImageFrameTask;
