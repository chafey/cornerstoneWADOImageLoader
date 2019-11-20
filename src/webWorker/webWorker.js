// TODO: Not sure if this is necessary, but we probably need it for deflate in dicomParser
/* eslint-disable-next-line import/extensions */
import 'pako';

// an object of task handlers
const taskHandlers = {};

// Flag to ensure web worker is only initialized once
let initialized = false;

// the configuration object passed in when the web worker manager is initialized
let config;

/**
 * Initialization function that loads additional web workers and initializes them
 * @param data
 */
function initialize(data) {
  // console.log('web worker initialize ', data.workerIndex);
  // prevent initialization from happening more than once
  if (initialized) {
    return;
  }

  // save the config data
  config = data.config;

  // Additional web worker tasks can self-register by calling self.registerTaskHandler
  self.registerTaskHandler = registerTaskHandler;

  // load any additional web worker tasks
  if (data.config.webWorkerTaskPaths) {
    for (let i = 0; i < data.config.webWorkerTaskPaths.length; i++) {
      self.importScripts(data.config.webWorkerTaskPaths[i]);
    }
  }

  // initialize each task handler
  Object.keys(taskHandlers).forEach(function(key) {
    taskHandlers[key].initialize(config.taskConfiguration);
  });

  console.log(1);
  // tell main ui thread that we have completed initialization
  self.postMessage({
    taskType: 'initialize',
    status: 'success',
    result: {},
    workerIndex: data.workerIndex,
  });

  initialized = true;
}

/**
 * Function to load a new web worker task with updated configuration
 * @param data
 */
function loadWebWorkerTask(data) {
  config = data.config;
  self.importScripts(data.sourcePath);
}

/**
 * Web worker message handler:
 * dispatches messages to the registered task handlers
 *
 * @param msg
 */
self.onmessage = function(msg) {
  console.log('!! ~~ web worker onmessage', msg.data);

  if (msg.data.taskType === undefined) {
    console.warn('Task dispatched with undefined task type');
    return;
  }

  // handle initialize message
  if (msg.data.taskType === 'initialize') {
    initialize(msg.data);

    return;
  }

  // handle loadWebWorkerTask message
  if (msg.data.taskType === 'loadWebWorkerTask') {
    loadWebWorkerTask(msg.data);

    return;
  }

  // dispatch the message if there is a handler registered for it
  const taskHandler = taskHandlers[msg.data.taskType];

  if (taskHandler) {
    console.log('HANDLING TASK: ', msg.data.taskType);
    console.log(taskHandler);

    try {
      taskHandler.handler(msg.data, function(result, transferList) {
        console.log('task handler......... handling');
        self.postMessage(
          {
            taskType: msg.data.taskType,
            status: 'success',
            result,
            workerIndex: msg.data.workerIndex,
          },
          transferList
        );
      });
    } catch (error) {
      console.log(`task ${msg.data.taskType} failed - ${error.message}`);
      console.log(3);
      self.postMessage({
        taskType: msg.data.taskType,
        status: 'failed',
        result: error.message,
        workerIndex: msg.data.workerIndex,
      });
    }

    return;
  }

  // not task handler registered - send a failure message back to ui thread
  self.postMessage({
    taskType: msg.data.taskType,
    status: 'failed - no task handler registered',
    result: 'error message',
    workerIndex: msg.data.workerIndex,
  });
};

/**
 * Function exposed to web worker tasks to register themselves
 *
 * @param {*} taskHandler
 */
export function registerTaskHandler(taskHandler) {
  if (taskHandlers[taskHandler.taskType]) {
    console.log(
      'attempt to register duplicate task handler "',
      taskHandler.taskType,
      '"'
    );

    return false;
  }
  taskHandlers[taskHandler.taskType] = taskHandler;
  if (initialized) {
    taskHandler.initialize(config.taskConfiguration);
  }
}
