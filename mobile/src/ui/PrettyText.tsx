import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, StyleSheet, Text, TextLayoutEventData, TextProps, View, ViewStyle } from 'react-native';

/**
 * React Native has no `text-wrap: pretty`, which the prototype puts on titles, bios and message bubbles. Chrome's
 * "pretty" avoids a last line made of a single word (an orphan). This measures the natural wrap and, when the last
 * line is one word, narrows the wrap width step by step until that word gets company; if narrowing only adds a
 * line, the natural wrap is kept. The text stays invisible until the search has settled (a few layout passes).
 * Use for wrapping paragraphs only (not with numberOfLines).
 */
const STEP = 2;

export const PrettyText: React.FC<TextProps & { containerStyle?: ViewStyle }> = ({ style, containerStyle, onTextLayout, children, ...rest }) => {
  const flat = StyleSheet.flatten(style) ?? {};
  const [avail, setAvail] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const [tick, setTick] = useState(0);
  const st = useRef({ natural: 0, gaveUp: false });
  const last = useRef<{ n: number; words: number } | null>(null);
  const textKey = typeof children === 'string' ? children : React.Children.toArray(children).join('');

  useEffect(() => {
    st.current = { natural: 0, gaveUp: false };
    last.current = null;
    setWidth(null);
    setSettled(false);
  }, [textKey]);

  useEffect(() => {
    st.current = { natural: 0, gaveUp: false };
  }, [avail]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    // While narrowed, a shrinking container is our own doing: only follow the width when it is the natural one.
    setAvail((cur) => (cur !== null && width !== null ? cur : w));
  }, [width]);

  const handleLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    onTextLayout?.(e);
    const lines = e.nativeEvent.lines;
    if (!lines.length) return;
    const words = lines[lines.length - 1].text.trim().split(/\s+/).filter(Boolean).length;
    last.current = { n: lines.length, words };
    setTick((t) => t + 1);
  };

  useEffect(() => {
    const L = last.current;
    if (!L || avail === null) return;
    const s = st.current;
    if (s.natural === 0) s.natural = L.n;
    if (s.gaveUp) {
      if (width !== null) setWidth(null);
      else setSettled(true);
      return;
    }
    if (L.n !== s.natural) {
      s.gaveUp = true;
      setWidth(null);
      return;
    }
    const orphan = L.n > 1 && L.words < 2;
    const current = width ?? avail;
    if (orphan) {
      if (current - STEP > avail * 0.6) setWidth(current - STEP);
      else {
        s.gaveUp = true;
        setWidth(null);
      }
      return;
    }
    setSettled(true);
  }, [tick, avail]); // eslint-disable-line react-hooks/exhaustive-deps

  const align = flat.textAlign === 'center' ? 'center' : flat.textAlign === 'right' ? 'flex-end' : 'flex-start';
  return (
    <View onLayout={onLayout} style={containerStyle}>
      <Text
        {...rest}
        onTextLayout={handleLayout}
        style={[style, width !== null && { width, alignSelf: align }, !settled && { opacity: 0 }]}
      >
        {children}
      </Text>
    </View>
  );
};
