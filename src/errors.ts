export class RecordingAlreadyStartedError extends Error {
  constructor() {
    super('Only one RecordTranscribe may be active at a time');
    this.name = 'RecordingAlreadyStartedError';
    // Set the prototype explicitly to maintain the correct prototype chain
    Object.setPrototypeOf(this, RecordingAlreadyStartedError.prototype);
  }
}

export type ErrorStatus =
  | 'get_user_media_failed'
  | 'api_key_fetch_failed'
  | 'queue_limit_exceeded'
  | 'media_recorder_error'
  | 'api_error'
  | 'websocket_error';
