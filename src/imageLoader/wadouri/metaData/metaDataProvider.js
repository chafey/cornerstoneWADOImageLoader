import external from '../../../externalModules.js';
import getNumberValues from './getNumberValues.js';
import parseImageId from '../parseImageId.js';
import dataSetCacheManager from '../dataSetCacheManager.js';
import getImagePixelModule from './getImagePixelModule.js';
import getOverlayPlaneModule from './getOverlayPlaneModule.js';
import getLUTs from './getLUTs.js';
import getModalityLUTOutputPixelRepresentation from './getModalityLUTOutputPixelRepresentation.js';

function metaDataProvider(type, imageId) {
  const { dicomParser } = external;
  const parsedImageId = parseImageId(imageId);

  const dataSet = dataSetCacheManager.get(parsedImageId.url);

  if (!dataSet) {
    return;
  }

  if (type === 'generalSeriesModule') {
    return {
      modality: dataSet.string('x00080060'),
      seriesInstanceUID: dataSet.string('x0020000e'),
      seriesNumber: dataSet.intString('x00200011'),
      studyInstanceUID: dataSet.string('x0020000d'),
      seriesDate: dicomParser.parseDA(dataSet.string('x00080021')),
      seriesTime: dicomParser.parseTM(dataSet.string('x00080031') || ''),
    };
  }

  if (type === 'patientStudyModule') {
    return {
      patientAge: dataSet.intString('x00101010'),
      patientSize: dataSet.floatString('x00101020'),
      patientWeight: dataSet.floatString('x00101030'),
    };
  }

  if (type === 'imagePlaneModule') {
    const imageOrientationPatient = getNumberValues(dataSet, 'x00200037', 6);
    const imagePositionPatient = getNumberValues(dataSet, 'x00200032', 3);
    const pixelSpacing = getNumberValues(dataSet, 'x00280030', 2);

    let columnPixelSpacing = null;

    let rowPixelSpacing = null;

    if (pixelSpacing) {
      rowPixelSpacing = pixelSpacing[0];
      columnPixelSpacing = pixelSpacing[1];
    }

    let rowCosines = null;

    let columnCosines = null;

    if (imageOrientationPatient) {
      rowCosines = [
        parseFloat(imageOrientationPatient[0]),
        parseFloat(imageOrientationPatient[1]),
        parseFloat(imageOrientationPatient[2]),
      ];
      columnCosines = [
        parseFloat(imageOrientationPatient[3]),
        parseFloat(imageOrientationPatient[4]),
        parseFloat(imageOrientationPatient[5]),
      ];
    }

    return {
      frameOfReferenceUID: dataSet.string('x00200052'),
      rows: dataSet.uint16('x00280010'),
      columns: dataSet.uint16('x00280011'),
      imageOrientationPatient,
      rowCosines,
      columnCosines,
      imagePositionPatient,
      sliceThickness: dataSet.floatString('x00180050'),
      sliceLocation: dataSet.floatString('x00201041'),
      pixelSpacing,
      rowPixelSpacing,
      columnPixelSpacing,
    };
  }

  if (type === 'imagePixelModule') {
    return getImagePixelModule(dataSet);
  }

  if (type === 'modalityLutModule') {
    return {
      rescaleIntercept: dataSet.floatString('x00281052'),
      rescaleSlope: dataSet.floatString('x00281053'),
      rescaleType: dataSet.string('x00281054'),
      modalityLUTSequence: getLUTs(
        dataSet.uint16('x00280103'),
        dataSet.elements.x00283000
      ),
    };
  }

  if (type === 'voiLutModule') {
    const modalityLUTOutputPixelRepresentation = getModalityLUTOutputPixelRepresentation(
      dataSet
    );

    return {
      windowCenter: getNumberValues(dataSet, 'x00281050', 1),
      windowWidth: getNumberValues(dataSet, 'x00281051', 1),
      voiLUTSequence: getLUTs(
        modalityLUTOutputPixelRepresentation,
        dataSet.elements.x00283010
      ),
    };
  }

  if (type === 'sopCommonModule') {
    return {
      sopClassUID: dataSet.string('x00080016'),
      sopInstanceUID: dataSet.string('x00080018'),
    };
  }

  if (type === 'petIsotopeModule') {
    const radiopharmaceuticalInfo = dataSet.elements.x00540016;

    if (radiopharmaceuticalInfo === undefined) {
      return;
    }

    const firstRadiopharmaceuticalInfoDataSet =
      radiopharmaceuticalInfo.items[0].dataSet;

    return {
      radiopharmaceuticalInfo: {
        radiopharmaceuticalStartTime: dicomParser.parseTM(
          firstRadiopharmaceuticalInfoDataSet.string('x00181072') || ''
        ),
        radionuclideTotalDose: firstRadiopharmaceuticalInfoDataSet.floatString(
          'x00181074'
        ),
        radionuclideHalfLife: firstRadiopharmaceuticalInfoDataSet.floatString(
          'x00181075'
        ),
      },
    };
  }

  if (type === 'overlayPlaneModule') {
    return getOverlayPlaneModule(dataSet);
  }

  if (type === 'multiframeModule') {
    return {
      numberOfFrames: dataSet.floatString('x00280008'), // Number of frames in a Multi-frame Image
      frameIncrementPointer: dataSet.attributeTag('x00280009') // Contains the Data Element Tag of the attribute that is used as the frame increment in Multi-frame pixel data
    };
  }

  if (type === 'cineModule') {
    const frameTimeVector = [];
    const vecSize = dataSet.numStringValues('x00181065');
    if (vecSize && vecSize > 0) {
      for (let i = 0; i < vecSize; i++) {
        frameTimeVector.push(dataSet.floatString('x00181065', i));
      }
    }

    return {
      preferredPlaybackSequencing: dataSet.intString('x00181244'), // Describes the preferred playback sequencing for a multi-frame image.
      frameTime: dataSet.floatString('x00181063'), // Nominal time (in msec) per individual frame. Required if Frame Increment Pointer (0028,0009) points to Frame Time.
      frameTimeVector, // An array that contains the real time increments (in msec) between frames for a Multi-frame image. Required if Frame Increment Pointer (0028,0009) points to Frame Time Vector.
      startTrim: dataSet.intString('x00082142'), // The frame number of the first frame of the Multi-frame image to be displayed.
      stopTrim: dataSet.intString('x00082143'), // The Frame Number of the last frame of a Multi-frame image to be displayed.
      recommendedDisplayFrameRate: dataSet.intString('x0008,2144'), //Recommended rate at which the frames of a Multi-frame image should be displayed in frames/second.
      cineRate: dataSet.intString('x00180040'), // Number of frames per second.
      frameDelay: dataSet.floatString('x00181066'), // Time (in msec) from Content Time (0008,0033) to the start of the first frame in a Multi-frame image.
      imageTriggerDelay: dataSet.floatString('x00181067'), // Delay time in milliseconds from trigger (e.g., X-Ray on pulse) to the first frame of a Multi-frame image.
      effectiveDuration: dataSet.floatString('x00180072'), // Total time in seconds that data was actually taken for the entire Multi-frame image.
      actualFrameDuration: dataSet.intString('x00181242') // Elapsed time of data acquisition in msec per each frame.
    };
  }
}

export default metaDataProvider;
