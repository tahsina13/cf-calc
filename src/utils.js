export const CalculationStatus = Object.freeze({
  CALCULATION_IN_PROGRESS: Symbol(0),
  CALCULATION_DONE: Symbol(1),
  CALCULATION_FAILED: Symbol(2),
});

export function getInverseTheme(theme) {
  return theme === 'light'
    ? 'dark'
    : theme === 'dark'
    ? 'white'
    : '';
}

export function getRatingColor(rating) {
  const ratingRange = [Number.NEGATIVE_INFINITY, 1200, 1400, 1600, 1900, 2200, 2400];
  const ratingColor = ['gray', 'green', 'cyan', 'blue', 'violet', 'orange', 'red'];
  return ratingColor.at(Math.max(-1, ratingRange.findIndex((elem) => elem > rating)-1));
}
