// New panels are created with a timestamp-based key so each addition produces
// a distinct, stable string ID that also sorts naturally by creation order.
export const createNode = (): string => Date.now().toString();
