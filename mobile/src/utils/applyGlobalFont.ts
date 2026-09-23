import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { Fonts } from './theme';

/**
 * Nocturne is set in Inter at Regular/Medium only ("hierarchy is size and
 * space"). React Native has no global font setting, so this wraps the render of
 * Text and TextInput once: any weight of 500 or heavier becomes Inter Medium,
 * everything else Inter Regular. An explicit fontFamily (e.g. an icon font)
 * is left untouched.
 */
function familyFor(style: unknown): string | undefined {
  const flat = (StyleSheet.flatten(style as any) ?? {}) as { fontFamily?: string; fontWeight?: string | number };
  if (flat.fontFamily) return undefined;
  const weight = String(flat.fontWeight ?? '400');
  const heavy = weight === 'bold' || Number(weight) >= 500;
  return heavy ? Fonts.medium : Fonts.regular;
}

function patch(Component: any) {
  const original = Component?.render;
  if (!original) return;
  Component.render = function render(...args: any[]) {
    const element = original.apply(this, args);
    const family = familyFor(element?.props?.style);
    if (!family) return element;
    return React.cloneElement(element, {
      style: [element.props.style, { fontFamily: family, fontWeight: 'normal' }],
    });
  };
}

patch(Text);
patch(TextInput);
