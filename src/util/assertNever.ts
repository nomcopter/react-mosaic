export function assertNever(shouldBeNever: never): never {
  throw new Error('Unhandled case: ' + JSON.stringify(shouldBeNever));
}
