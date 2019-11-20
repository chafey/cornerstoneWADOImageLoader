/**
 * Decodes an image frame by decoding the provided pixelData and updating the
 * imageFrame by reference.
 *
 * @param {*} imageFrame
 * @param {*} pixelData
 */
async function decodeJPEGLossless(imageFrame, pixelData) {
  const JpegLosslessCodec = await import(
    /* webpackPrefetch: true, webpackChunkName: "JpegLossless" */ './../codecs/jpegLossless.js'
  );

  console.log('JpegLosslessCodec', JpegLosslessCodec);

  // check to make sure codec is loaded
  if (
    typeof JpegLosslessCodec === 'undefined' ||
    typeof JpegLosslessCodec.lossless === 'undefined' ||
    typeof JpegLosslessCodec.lossless.Decoder === 'undefined'
  ) {
    throw new Error('No JPEG Lossless decoder loaded');
  }

  const byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  // console.time('jpeglossless');
  const buffer = pixelData.buffer;
  const decoder = new JpegLosslessCodec.lossless.Decoder();
  const decompressedData = decoder.decode(
    buffer,
    pixelData.byteOffset,
    pixelData.length,
    byteOutput
  );
  // console.timeEnd('jpeglossless');

  if (imageFrame.pixelRepresentation === 0) {
    if (imageFrame.bitsAllocated === 16) {
      imageFrame.pixelData = new Uint16Array(decompressedData.buffer);

      return imageFrame;
    }
    // untested!
    imageFrame.pixelData = new Uint8Array(decompressedData.buffer);

    return imageFrame;
  }
  imageFrame.pixelData = new Int16Array(decompressedData.buffer);

  return imageFrame;
}

export default decodeJPEGLossless;
