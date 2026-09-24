import { PixelRatio, TextStyle } from 'react-native';

/**
 * The prototype's CSS gives text a fractional line box (font-size x 1.55, e.g. 21.7px for 14px text) and the browser lays
 * that out exactly. iOS rounds every text line UP to the next physical pixel (1/3pt at 3x), so 21.7 becomes 22 and stacked
 * blocks drift a few points over a screen. Rounding to the *nearest* pixel instead (minus an epsilon so the round-up keeps it)
 * reproduces the design's spacing. Use it for `lineHeight` wherever the layout sits in a tight vertical stack.
 */
export const cssLine = (fontSize: number, multiple = 1.55): number => {
  const px = PixelRatio.get();
  return Math.round(fontSize * multiple * px) / px - 0.001;
};

/** `{ fontSize, lineHeight }` with the design's 1.55 (or given) line box; spread extra style after it. */
export const cssText = (fontSize: number, extra?: TextStyle, multiple = 1.55): TextStyle =>
  ({ fontSize, lineHeight: cssLine(fontSize, multiple), ...extra });
