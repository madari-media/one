// --- worker.js ---
'use strict';

console.log('Worker script v4 loaded (Multi-Script Management).');

/**
 * Stores the loaded functions for multiple scripts, keyed by script ID.
 * @type {Map<string, { getConfigSchema: Function | null, getStreams: Function }>}
 */
const loadedScripts = new Map();

/**
 * Loads and parses a *single* user script, extracting exported functions.
 * Requires `getStreams` and optionally finds `getConfigSchema`.
 * (This function is mostly the same as v3's loadAndExtractFunctions)
 * @param {string} scriptBody The user script code.
 * @returns {Promise<{getConfigSchema: Function | null, getStreams: Function}>}
 */
async function loadAndExtractFunctions(scriptBody) {
  try {
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    const wrappedScript = `
            ${scriptBody}; // Execute user script
            if (typeof getStreams !== 'function') {
                throw new Error('Script must define required function: getStreams');
            }
            let configSchemaFunc = (typeof getConfigSchema === 'function') ? getConfigSchema : null;
            return { getConfigSchema: configSchemaFunc, getStreams: getStreams };
        `;
    const moduleLoader = new AsyncFunction('fetchFn', wrappedScript);
    const loadedModule = await moduleLoader(fetch);

    if (typeof loadedModule.getStreams !== 'function') {
      throw new Error(
        'Internal Error: Failed to extract required function "getStreams".',
      );
    }
    console.debug(
      'Worker: User functions extracted successfully (getConfigSchema optional).',
    );
    return loadedModule;
  } finally {
  }
}

/**
 * Executes a specific function from a specific loaded script.
 * @param {Function} funcToCall The actual function reference to execute.
 * @param {string} functionName For logging/error messages.
 * @param {Array<any>} args Arguments to pass to the function.
 * @param {number} timeout Execution timeout in milliseconds.
 * @returns {Promise<any>} Result from the user function.
 */
async function executeUserFunction(
  funcToCall,
  functionName,
  args = [],
  timeout,
) {
  // funcToCall is assumed to be a valid function reference here
  let executionTimer = null;

  const currentImport = self.importScripts;
  self.importScripts = () => {
    throw new Error('importScripts is disabled.');
  };
  const currentXHR = self.XMLHttpRequest;
  self.XMLHttpRequest = undefined;
  const currentWS = self.WebSocket;
  self.WebSocket = undefined;

  try {
    const executionPromise = funcToCall(...args);
    const timeoutPromise = new Promise((_, reject) => {
      executionTimer = setTimeout(() => {
        const timeoutError = new Error(
          `Function "${functionName}" execution exceeded timeout of ${timeout}ms.`,
        );
        timeoutError.name = 'ExecutionTimeoutError';
        reject(timeoutError);
      }, timeout);
    });
    const result = await Promise.race([executionPromise, timeoutPromise]);
    clearTimeout(executionTimer);
    return result;
  } finally {
    if (executionTimer) clearTimeout(executionTimer);
  }
}

// --- Message Handling ---

self.onmessage = async (event) => {
  if (!event.data || !event.data.type) {
    console.warn('Worker received invalid message:', event.data);
    return;
  }

  const { type, payload, callId } = event.data; // callId used for 'call' type

  switch (type) {
    case 'load': {
      // Renamed from 'register' internally
      const { id, script } = payload || {};
      console.debug(`Worker received load request for ID: ${id}`);
      if (!id || typeof script !== 'string') {
        console.error('Invalid load payload:', payload);
        // Optionally send back an error to main thread
        return;
      }
      try {
        const extractedFunctions = await loadAndExtractFunctions(script);
        loadedScripts.set(id, extractedFunctions);
        console.info(`Worker successfully loaded script ID: ${id}`);
        self.postMessage({ type: 'loaded', payload: { id: id } });
      } catch (error) {
        console.error(`Worker script loading failed for ID ${id}:`, error);
        // Remove potentially partially loaded state
        loadedScripts.delete(id);
        self.postMessage({
          type: 'load_error',
          payload: { id: id },
          error: { name: error.name, message: error.message },
        });
      }
      break;
    } // end case 'load'

    case 'unload': {
      const { id } = payload || {};
      console.debug(`Worker received unload request for ID: ${id}`);
      if (id && loadedScripts.has(id)) {
        loadedScripts.delete(id);
        console.info(`Worker unloaded script ID: ${id}`);
        self.postMessage({ type: 'unloaded', payload: { id: id } });
      } else {
        console.warn(`Worker unload request: ID ${id} not found or invalid.`);
      }
      break;
    } // end case 'unload'

    case 'unload_all': {
      console.debug(`Worker received unload_all request.`);
      const unloadedCount = loadedScripts.size;
      loadedScripts.clear();
      console.info(`Worker unloaded all ${unloadedCount} scripts.`);
      self.postMessage({
        type: 'unloaded_all',
        payload: { count: unloadedCount },
      });
      break;
    } // end case 'unload_all'

    case 'call': {
      const {
        scriptId,
        functionName,
        args = [],
        timeout = 5000,
      } = payload || {};
      console.debug(
        `Worker received call request for "${functionName}" on script ID "${scriptId}" (Call ID: ${callId})`,
      );

      if (!callId) {
        console.warn('Call request received without callId.');
        return;
      }
      if (!scriptId || !functionName) {
        self.postMessage({
          type: 'call_error',
          callId: callId,
          error: {
            name: 'InvalidCall',
            message: 'Missing scriptId or functionName in call payload.',
          },
        });
        return;
      }

      const scriptExports = loadedScripts.get(scriptId);
      if (!scriptExports) {
        self.postMessage({
          type: 'call_error',
          callId: callId,
          error: {
            name: 'ScriptNotLoaded',
            message: `Script with ID "${scriptId}" is not loaded.`,
          },
        });
        return;
      }

      const funcToCall = scriptExports[functionName];
      if (typeof funcToCall !== 'function') {
        // Handles both getStreams not being loaded (error case) or optional getConfigSchema being null
        self.postMessage({
          type: 'call_error',
          callId: callId,
          error: {
            name: 'FunctionNotFound',
            message: `Function "${functionName}" not found or not callable in script ID "${scriptId}".`,
          },
        });
        return;
      }

      try {
        const result = await executeUserFunction(
          funcToCall,
          functionName,
          args,
          timeout,
        );
        self.postMessage({ type: 'result', callId: callId, payload: result });
      } catch (error) {
        console.error(
          `Worker function call "${functionName}" (Script ${scriptId}, Call ${callId}) failed:`,
          error,
        );
        self.postMessage({
          type: 'call_error',
          callId: callId,
          error: {
            name: error.name || 'ExecutionError',
            message: error.message,
          },
        });
      }
      break;
    } // end case 'call'

    default:
      console.warn(`Worker received unknown message type: ${type}`);
      break;
  }
};

// --- Global Error Handling (same as before) ---
self.onerror = (event) => {
  /* ... */
};
self.onunhandledrejection = (event) => {
  /* ... */
};

console.log('Worker multi-script message handler installed.');
