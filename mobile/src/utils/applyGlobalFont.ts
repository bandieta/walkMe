import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts } from './theme';

/**
 * Makes every Text/TextInput behave like text in the design prototype, which is plain CSS:
 *  - Inter at Regular/Medium only ("hierarchy is size and space"): weights >= 500 -> Inter Medium, else Regular.
 *  - the body's default colour (a light text, not React Native's black), 15px size and 1.55 line-height.
 *  - no extra Android font padding.
 * React Native has no global font/colour setting, so this wraps the render of Text and TextInput once.
 * In RN 0.74 a top-level Text renders `<TextAncestor.Provider><NativeText/></TextAncestor.Provider>`; text nested
 * inside another Text renders the native element directly and inherits size/colour/line-height from its parent.
 * An explicit fontFamily (e.g. an icon font) is left alone.
 */
type Flat = { fontFamily?: string; fontWeight?: string | number; fontSize?: number; lineHeight?: number; color?: unknown };

function familyFor(weight: Flat['fontWeight']): string {
  const w = String(weight ?? '400');
  return w === 'bold' || Number(w) >= 500 ? Fonts.medium : Fonts.regular;
}

function decorate(el: any, nested: boolean): any {
  const flat = (StyleSheet.flatten(el.props.style) ?? {}) as Flat;
  if (flat.fontFamily) return el;
  const extra: Record<string, unknown> = {};
  if (!nested || flat.fontWeight !== undefined) {
    // Name the exact face AND repeat its weight: on iOS a mismatching weight makes RN swap to another face of the family.
    extra.fontFamily = familyFor(flat.fontWeight);
    extra.fontWeight = extra.fontFamily === Fonts.medium ? '500' : '400';
  }
  if (!nested) {
    const fontSize = flat.fontSize ?? 15;
    extra.fontSize = fontSize;
    extra.lineHeight = flat.lineHeight ?? fontSize * 1.55;
    extra.includeFontPadding = true;
    if (flat.color === undefined) extra.color = Colors.textPrimary;
  }
  // Android's default "highQuality" breaker balances lines; CSS (the design) breaks greedily. Ignored on iOS.
  const props: Record<string, unknown> = { style: [el.props.style, extra] };
  if (!nested && el.props.textBreakStrategy === undefined) props.textBreakStrategy = 'simple';
  return React.cloneElement(el, props);
}

function patch(Component: any, isInput: boolean) {
  const original = Component?.render;
  if (!original) return;
  Component.render = function render(...args: any[]) {
    const element = original.apply(this, args);
    if (!element?.props) return element;
    // Provider wrapper -> style the native element inside it (a top-level Text).
    if (!isInput && 'value' in element.props && element.props.children && !('style' in element.props)) {
      const child = React.Children.only(element.props.children) as any;
      return React.cloneElement(element, {}, child?.props ? decorate(child, false) : child);
    }
    // No wrapper: a Text nested inside another Text (inherits from its parent), or a TextInput.
    return decorate(element, !isInput);
  };
}

patch(Text, false);
patch(TextInput, true);
