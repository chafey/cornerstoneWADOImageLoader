let openJPEG;

/**
 *
 */
async function initializeJPEG2000Async() {
  if (openJPEG) {
    return;
  }

  const OpenJpegCodecModule = await import(
    /* webpackPrefetch: true, webpackChunkName: "OpenJPEG" */ './../codecs/openJPEG-FixedMemory.js'
  );

  console.log('OpenJpegCodecModule', OpenJpegCodecModule);

  // eslint-disable-next-line
  openJPEG = OpenJpegCodecModule.default();

  console.log(openJPEG);

  if (!openJPEG || !openJPEG._jp2_decode) {
    throw new Error('OpenJPEG failed to initialize');
  }
}

/**
 * Decodes an image frame by decoding the provided pixelData and updating the
 * imageFrame by reference.
 *
 * @exports
 * @param {*} imageFrame
 * @param {*} pixelData
 * @param {object} decodeConfig
 * @param {bool} [decodeConfig.usePDFJS] - If true, uses PDFJS decoder instead of OPENJPEG
 * @param {object} [options={}]
 * @param {bool} [options.usePDFJS] - If true, uses PDFJS decoder instead of OPENJPEG
 */
async function decodeJPEG2000Async(
  imageFrame,
  pixelData,
  decodeConfig,
  options = {}
) {
  await initializeJPEG2000Async(decodeConfig);

  if (options.usePDFJS || decodeConfig.usePDFJS) {
    return _decodeJpx(imageFrame, pixelData);
  }

  return _decodeOpenJpeg2000(imageFrame, pixelData);
}

/**
 * Decodes an image frame by decoding the provided pixelData and updating the
 * imageFrame by reference. This is the faster, but less reliable, PDFJS decode.
 *
 * @param {*} imageFrame
 * @param {*} pixelData
 */
async function _decodeJpx(imageFrame, pixelData) {
  const JpxImageCodec = await import(
    /* webpackPrefetch: true, webpackChunkName: "JpxImage" */ './../codecs/jpx.min.js'
  );

  console.log('JpxImageCodec', JpxImageCodec);

  const jpxImage = new JpxImageCodec();

  jpxImage.parse(pixelData);

  const tileCount = jpxImage.tiles.length;

  if (tileCount !== 1) {
    throw new Error(
      `JPEG2000 decoder returned a tileCount of ${tileCount}, when 1 is expected`
    );
  }

  imageFrame.columns = jpxImage.width;
  imageFrame.rows = jpxImage.height;
  imageFrame.pixelData = jpxImage.tiles[0].items;

  return imageFrame;
}

/**
 * Decodes an image frame by decoding the provided pixelData and updating the
 * imageFrame by reference. This is the slower, but more accurate, OpenJPEG
 * emscripten decode.
 *
 * @param {*} imageFrame
 * @param {*} pixelData
 */
function _decodeOpenJpeg2000(imageFrame, pixelData) {
  const bytesPerPixel = imageFrame.bitsAllocated <= 8 ? 1 : 2;
  const signed = imageFrame.pixelRepresentation === 1;

  const image = _decodeOpenJPEG(pixelData, bytesPerPixel, signed);

  imageFrame.columns = image.sx;
  imageFrame.rows = image.sy;
  imageFrame.pixelData = image.pixelData;
  if (image.nbChannels > 1) {
    imageFrame.photometricInterpretation = 'RGB';
  }

  return imageFrame;
}

/**
 * This maps our emscripten OpenJPEG decode to the output we expect.
 * It also cleans up after itself (memory).
 *
 * @param {*} data
 * @param {*} bytesPerPixel
 * @param {*} signed
 */
function _decodeOpenJPEG(data, bytesPerPixel, signed) {
  console.warn(`_decodeOpenJPEG`, openJPEG);
  const dataPtr = openJPEG._malloc(data.length);

  openJPEG.writeArrayToMemory(data, dataPtr);

  // create param outpout
  const imagePtrPtr = openJPEG._malloc(4);
  const imageSizePtr = openJPEG._malloc(4);
  const imageSizeXPtr = openJPEG._malloc(4);
  const imageSizeYPtr = openJPEG._malloc(4);
  const imageSizeCompPtr = openJPEG._malloc(4);

  const t0 = new Date().getTime();
  const ret = openJPEG.ccall(
    'jp2_decode',
    'number',
    ['number', 'number', 'number', 'number', 'number', 'number', 'number'],
    [
      dataPtr,
      data.length,
      imagePtrPtr,
      imageSizePtr,
      imageSizeXPtr,
      imageSizeYPtr,
      imageSizeCompPtr,
    ]
  );
  // add num vomp..etc

  if (ret !== 0) {
    console.log('[opj_decode] decoding failed!');
    openJPEG._free(dataPtr);
    openJPEG._free(openJPEG.getValue(imagePtrPtr, '*'));
    openJPEG._free(imageSizeXPtr);
    openJPEG._free(imageSizeYPtr);
    openJPEG._free(imageSizePtr);
    openJPEG._free(imageSizeCompPtr);

    return;
  }

  const imagePtr = openJPEG.getValue(imagePtrPtr, '*');

  const image = {
    length: openJPEG.getValue(imageSizePtr, 'i32'),
    sx: openJPEG.getValue(imageSizeXPtr, 'i32'),
    sy: openJPEG.getValue(imageSizeYPtr, 'i32'),
    nbChannels: openJPEG.getValue(imageSizeCompPtr, 'i32'), // hard coded for now
    perf_timetodecode: undefined,
    pixelData: undefined,
  };

  // Copy the data from the EMSCRIPTEN heap into the correct type array
  const length = image.sx * image.sy * image.nbChannels;
  const src32 = new Int32Array(openJPEG.HEAP32.buffer, imagePtr, length);

  if (bytesPerPixel === 1) {
    if (Uint8Array.from) {
      image.pixelData = Uint8Array.from(src32);
    } else {
      image.pixelData = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        image.pixelData[i] = src32[i];
      }
    }
  } else if (signed) {
    if (Int16Array.from) {
      image.pixelData = Int16Array.from(src32);
    } else {
      image.pixelData = new Int16Array(length);
      for (let i = 0; i < length; i++) {
        image.pixelData[i] = src32[i];
      }
    }
  } else if (Uint16Array.from) {
    image.pixelData = Uint16Array.from(src32);
  } else {
    image.pixelData = new Uint16Array(length);
    for (let i = 0; i < length; i++) {
      image.pixelData[i] = src32[i];
    }
  }

  const t1 = new Date().getTime();

  image.perf_timetodecode = t1 - t0;

  // free
  openJPEG._free(dataPtr);
  openJPEG._free(imagePtrPtr);
  openJPEG._free(imagePtr);
  openJPEG._free(imageSizePtr);
  openJPEG._free(imageSizeXPtr);
  openJPEG._free(imageSizeYPtr);
  openJPEG._free(imageSizeCompPtr);

  return image;
}

export default decodeJPEG2000Async;
export { initializeJPEG2000Async };
