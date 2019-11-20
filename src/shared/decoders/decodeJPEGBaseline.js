/**
 * Decodes an image frame by decoding the provided pixelData and updating the
 * imageFrame by reference.
 *
 * @param {*} imageFrame
 * @param {*} pixelData
 */
async function decodeJPEGBaseline(imageFrame, pixelData) {
  const JpegImageCodec = await import(
    /* webpackPrefetch: true, webpackChunkName: "JpegBaseline" */ './../codecs/jpeg.js'
  );

  console.log('JpegImageCodec', JpegImageCodec);

  if (typeof JpegImageCodec === 'undefined') {
    throw new Error('No JPEG Baseline decoder loaded');
  }

  const jpeg = new JpegImageCodec();

  jpeg.parse(pixelData);

  // Do not use the internal jpeg.js color transformation,
  // since we will handle this afterwards
  jpeg.colorTransform = false;

  if (imageFrame.bitsAllocated === 8) {
    imageFrame.pixelData = jpeg.getData(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  } else if (imageFrame.bitsAllocated === 16) {
    imageFrame.pixelData = jpeg.getData16(imageFrame.columns, imageFrame.rows);

    return imageFrame;
  }
}

export default decodeJPEGBaseline;
