// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recorderStates = [
  'Init',
  'RequestingMedia',
  'OpeningWebSocket',
  'Running',
  'FinishingProcessing',
  'Finished',
  'Error',
  'Canceled',
] as const;
export type RecorderState = (typeof recorderStates)[number];

const inactiveStates = ['Init', 'Finished', 'Error', 'Canceled'] as const satisfies Readonly<RecorderState[]>;
type InactiveState = (typeof inactiveStates)[number];

const activeStates = [
  'RequestingMedia',
  'OpeningWebSocket',
  'Running',
  'FinishingProcessing',
] as const satisfies Readonly<RecorderState[]>;
type ActiveState = (typeof activeStates)[number];

const websocketStates = ['OpeningWebSocket', 'Running', 'FinishingProcessing'] as const satisfies Readonly<
  RecorderState[]
>;
type WebSocketState = (typeof websocketStates)[number];

export function isInactiveState(state: RecorderState): state is InactiveState {
  return inactiveStates.includes(state as InactiveState);
}

export function isActiveState(state: RecorderState): state is ActiveState {
  return activeStates.includes(state as ActiveState);
}

export function isWebSocketState(state: RecorderState): state is WebSocketState {
  return websocketStates.includes(state as WebSocketState);
}
