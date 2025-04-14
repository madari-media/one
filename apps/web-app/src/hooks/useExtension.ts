import { Stream } from '@/service/stream/base-stream.service';
import { Meta } from '@/service/type';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface WorkerError {
  name: string;
  message: string;
}
export interface CallOptions {
  executionTimeout?: number;
  callTimeout?: number;
  debug?: boolean;
}

interface ScriptStatus {
  id: string;
  scriptHash: string;
  isLoading: boolean;
  isLoaded: boolean;
  error: WorkerError | null;
}

type PendingCall = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: number;
};

const DEFAULT_EXECUTION_TIMEOUT = 30_000;
const DEFAULT_CALL_TIMEOUT = 10000;

export interface ExtensionDef {
  id: string;
  script: string;
}

export interface UseExtensionOptions {
  workerUrl?: string;
  onDebug?: (data: any) => void;
}

export interface UseExtensionReturn {
  /**
   * Attempts to call 'getConfigSchema' for a specific extension ID.
   * @param extensionId The ID of the extension to call.
   * @param options Optional call configurations (timeouts).
   * @returns Promise resolving with the schema or rejecting on error/timeout/not loaded/not implemented.
   */
  callGetConfigSchema: (
    extensionId: string,
    options?: CallOptions,
  ) => Promise<any>;
  /**
   * Attempts to call 'getStreams' for a specific extension ID.
   * @param extensionId The ID of the extension to call.
   * @param config The configuration object for the extension.
   * @param input The metadata input.
   * @param options Optional call configurations (timeouts).
   * @returns Promise resolving with an array of streams or rejecting on error/timeout/not loaded.
   */
  callGetStreams: (
    extensionId: string,
    config: any,
    input: Meta,
    season?: {
      season: number;
      episode: number;
    },
    options?: CallOptions,
  ) => Promise<Stream[]>;
}

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
};

export function useExtension(
  extensions: ExtensionDef[] | null | undefined,
  options?: UseExtensionOptions,
): UseExtensionReturn {
  const { workerUrl = '/worker.js' } = options || {};
  const [, setWorker] = useState<Worker | null>(null);

  const [scriptStatuses, setScriptStatuses] = useState<
    Map<string, ScriptStatus>
  >(new Map());
  const [, setWorkerError] = useState<WorkerError | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const pendingCallsRef = useRef<Map<string, PendingCall>>(new Map());
  const callIdCounterRef = useRef<number>(0);
  const scriptStatusesRef = useRef(scriptStatuses);

  useEffect(() => {
    scriptStatusesRef.current = scriptStatuses;
  }, [scriptStatuses]);

  const updateScriptStatus = useCallback(
    (id: string, updates: Partial<Omit<ScriptStatus, 'id'>>) => {
      setScriptStatuses((prevMap) => {
        const newMap = new Map(prevMap);
        const currentStatus = newMap.get(id) || {
          id,
          scriptHash: '',
          isLoading: false,
          isLoaded: false,
          error: null,
        };
        const newHash = updates.scriptHash ?? currentStatus.scriptHash;
        newMap.set(id, { ...currentStatus, ...updates, scriptHash: newHash });
        return newMap;
      });
    },
    [],
  );

  const removeScriptStatus = useCallback((id: string) => {
    setScriptStatuses((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const cleanup = useCallback((reason?: string) => {
    console.debug(`Cleaning up extension worker hook. Reason: ${reason}`);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setWorker(null);
    }
    pendingCallsRef.current.forEach((call: any, callId: any) => {
      clearTimeout(call.timeoutId);
      call.reject(
        new Error(`Worker terminated. Call ID: ${callId}. Reason: ${reason}`),
      );
    });
    pendingCallsRef.current.clear();
    setScriptStatuses(new Map());
    setWorkerError(null);
  }, []);

  useEffect(() => {
    console.debug('Setting up extension worker...');
    setWorkerError(null);
    let currentWorker: Worker | null = null;

    try {
      currentWorker = new Worker(workerUrl);
      workerRef.current = currentWorker;
      setWorker(currentWorker);

      currentWorker.onmessage = (event) => {
        if (!event.data || !event.data.type) {
          console.warn('Hook received invalid message:', event.data);
          return;
        }
        const { type, payload, error: msgError, callId } = event.data;
        const scriptId = payload?.id;

        console.debug(`Hook received worker message: ${type}`, payload);

        switch (type) {
          case 'debug':
            if (options?.onDebug) {
              options.onDebug(payload);
            }
            break;
          case 'loaded':
            if (scriptId) {
              if (scriptStatusesRef.current.has(scriptId)) {
                updateScriptStatus(scriptId, {
                  isLoading: false,
                  isLoaded: true,
                  error: null,
                });
              }
            }
            break;
          case 'load_error':
            if (scriptId) {
              if (scriptStatusesRef.current.has(scriptId)) {
                updateScriptStatus(scriptId, {
                  isLoading: false,
                  isLoaded: false,
                  error: msgError || {
                    name: 'LoadError',
                    message: 'Unknown loading error',
                  },
                });
              }
            }
            break;
          case 'unloaded':
            if (scriptId) {
              removeScriptStatus(scriptId);
            }
            break;
          case 'unloaded_all':
            setScriptStatuses(new Map());
            break;
          case 'result':
          case 'call_error': {
            const pendingCall = pendingCallsRef.current.get(callId);
            if (pendingCall) {
              clearTimeout(pendingCall.timeoutId);
              if (type === 'result') {
                pendingCall.resolve(payload);
              } else {
                const callError = new Error(
                  msgError?.message || 'Worker function call failed.',
                );
                callError.name = msgError?.name || 'WorkerCallError';
                pendingCall.reject(callError);
              }
              pendingCallsRef.current.delete(callId);
            } else {
              console.warn(
                `Hook: Received result/error for unknown call ID: ${callId}`,
              );
            }
            break;
          }
          case 'worker_internal_error':
            console.error('Hook: Worker reported internal error:', msgError);
            setWorkerError(
              msgError || {
                name: 'WorkerInternalError',
                message: 'Unknown internal worker error',
              },
            );
            break;
          default:
            console.warn(`Hook: Received unknown message type: ${type}`);
            break;
        }
      };

      currentWorker.onerror = (errorEvent) => {
        errorEvent.preventDefault();
        console.error('Hook: Worker onerror triggered:', errorEvent);
        const err = {
          name: 'WorkerError',
          message: errorEvent.message || 'General worker failure',
        };
        setWorkerError(err);
        cleanup(`onerror: ${errorEvent.message}`);
      };
    } catch (err: any) {
      console.error('Hook: Failed to create worker:', err);
      const error = {
        name: 'WorkerCreationError',
        message: err.message || 'Failed to initialize worker.',
      };
      setWorkerError(error);
      cleanup('Creation failed');
    }

    return () => {
      console.debug('Hook: Worker effect cleanup running.');
      cleanup('Component unmounted');
    };
  }, [workerUrl]);

  useEffect(() => {
    if (!workerRef.current) return;

    const currentWorker = workerRef.current;
    const currentStatuses = scriptStatusesRef.current;
    const newExtensionsMap = new Map<
      string,
      { script: string; hash: string }
    >();
    (extensions || []).forEach((ext) => {
      if (ext?.id && typeof ext.script === 'string') {
        newExtensionsMap.set(ext.id, {
          script: ext.script,
          hash: simpleHash(ext.script),
        });
      } else {
        console.warn('Invalid extension definition skipped:', ext);
      }
    });

    currentStatuses.forEach((_, id) => {
      if (!newExtensionsMap.has(id)) {
        console.debug(`Hook: Auto-unloading extension ID: ${id}`);
        currentWorker.postMessage({ type: 'unload', payload: { id } });
        removeScriptStatus(id);
      }
    });

    newExtensionsMap.forEach(({ script, hash }, id) => {
      const currentStatus = currentStatuses.get(id);
      if (
        !currentStatus ||
        currentStatus.scriptHash !== hash ||
        currentStatus.error
      ) {
        console.debug(
          `Hook: Auto-loading extension ID: ${id} (New: ${!currentStatus}, Changed: ${currentStatus?.scriptHash !== hash}, Errored: ${!!currentStatus?.error})`,
        );
        updateScriptStatus(id, {
          isLoading: true,
          isLoaded: false,
          error: null,
          scriptHash: hash,
        });

        currentWorker.postMessage({ type: 'load', payload: { id, script } });
      }
    });
  }, [extensions, updateScriptStatus, removeScriptStatus]);

  const makeWorkerCall = useCallback(
    async (
      extensionId: string,
      functionName: string,
      args: any[],
      options?: CallOptions,
    ): Promise<any> => {
      const currentWorker = workerRef.current;
      const currentStatuses = scriptStatusesRef.current;

      if (!currentWorker) {
        throw new Error('Worker is not initialized.');
      }

      const status = currentStatuses.get(extensionId);

      if (!status || !status.isLoaded) {
        const reason = !status
          ? 'not registered'
          : status.isLoading
            ? 'still loading'
            : status.error
              ? `in error state (${status.error.name})`
              : 'not loaded';

        throw new Error(
          `Extension "${extensionId}" is ${reason}. Cannot call function "${functionName}".`,
        );
      }

      const callId = `${extensionId}_${functionName}_${callIdCounterRef.current++}`;
      const executionTimeout =
        options?.executionTimeout ?? DEFAULT_EXECUTION_TIMEOUT;
      const callTimeout = options?.callTimeout ?? DEFAULT_CALL_TIMEOUT;

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pendingCallsRef.current.delete(callId);
          reject(
            new Error(
              `Call timed out waiting for worker response after ${callTimeout}ms. ID: ${callId}`,
            ),
          );
        }, callTimeout) as never as number;

        pendingCallsRef.current.set(callId, { resolve, reject, timeoutId });

        currentWorker.postMessage({
          type: 'call',
          callId: callId,
          payload: {
            scriptId: extensionId,
            functionName,
            args,
            timeout: executionTimeout,
          },
        });
      });
    },
    [],
  );

  const callGetConfigSchema = useCallback(
    (extensionId: string, options?: CallOptions) => {
      return makeWorkerCall(extensionId, 'getConfigSchema', [], options);
    },
    [makeWorkerCall],
  );

  const callGetStreams = useCallback(
    (
      extensionId: string,
      config: any,
      input: Meta,
      season:
        | {
            season: number;
            episode: number;
          }
        | undefined,
      options?: CallOptions,
    ) => {
      return makeWorkerCall(
        extensionId,
        'getStreams',
        [config, input, season],
        options,
      );
    },
    [makeWorkerCall],
  );

  return {
    callGetConfigSchema,
    callGetStreams,
  };
}
