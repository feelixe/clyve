export const autoIncrementSymbol = Symbol("autoIncrement");

export function autoIncrementId() {
  return autoIncrementSymbol;
}
