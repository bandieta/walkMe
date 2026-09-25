import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Keyboard, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../../utils/theme';
import { Icon, IconName } from '../../components/Icon';
import { Hairline, PrettyText, ShelterHeartBadge, useScreenInsets } from '../../ui';
import { TypingDots } from './TypingDots';

/**
 * The chat thread from the prototype ("07 chat thread"): one layout for the walk group chat and a direct message.
 * Header (back, 38px avatar, title + subtitle, outlined action pill) / message list / composer.
 * Screens own the data (Redux + socket); this component only draws it and reports `onSend`.
 */
export interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
  /** Optimistic message that the server has not confirmed yet. */
  pending?: boolean;
}

interface Props {
  kind: 'group' | 'direct';
  title: string;
  subtitle: string;
  /** Group: Phosphor icon in the rounded-square avatar. Direct: initials in the round avatar. */
  avatarIcon?: IconName;
  avatarText?: string;
  /** The direct-message avatar is for a shelter's dog (DogRequestChatScreen) — shows the gradient heart badge. */
  avatarShelter?: boolean;
  /** When set, the title/subtitle become a button (a shelter tapping through to the requester's PersonProfile
   * from DogRequestChatScreen — see that screen for why only the shelter side gets this). */
  onTitlePress?: () => void;
  actionLabel: string;
  actionIcon: IconName;
  onAction: () => void;
  onBack: () => void;
  messages: ThreadMessage[];
  myId?: string;
  /** While the history loads nothing is drawn (no flash of the empty state). */
  loading?: boolean;
  emptyTitle: string;
  emptyBody: string;
  /** Resolve false when sending failed: the text goes back into the composer. */
  onSend: (text: string) => Promise<boolean | void> | void;
  /** Whether the other person in this thread is typing right now — shows the bouncing three dots. */
  otherTyping?: boolean;
  /** Called on every keystroke and once more when the composer empties or blurs, to drive the other side's dots. */
  onTyping?: () => void;
  onStoppedTyping?: () => void;
}

const DIV = 'rgba(233,233,237,0.16)';
const PRESSED = 'rgba(233,233,237,0.07)';
const BACK_ICON: IconName = 'caret-left';
// The prototype's `border-radius: 16px 16px 4px 16px` (own) / `16px 16px 16px 4px` (others).
const RADIUS_OWN = { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16 };
const RADIUS_OTHER = { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };

const Bubble: React.FC<{ msg: ThreadMessage; mine: boolean; showName: boolean; cont: boolean }> = React.memo(({ msg, mine, showName, cont }) => {
  // CSS sizes a bubble whose text wraps to its full max-width; RN would shrink it to the longest line. Match CSS.
  const [wrapped, setWrapped] = useState(false);
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', rowGap: 3, marginTop: cont ? 0 : 8, opacity: msg.pending ? 0.7 : 1 }}>
      {showName && <Text style={{ fontSize: 11, color: Ramp.neutral[500], paddingHorizontal: 10, transform: [{ translateY: -1 }] }}>{msg.senderName}</Text>}
      <View
        style={[
          { maxWidth: '78%', paddingVertical: 9, paddingHorizontal: 13, backgroundColor: mine ? Ramp.accent[800] : Colors.surfaceDark },
          wrapped && { width: '78%' },
          mine ? RADIUS_OWN : RADIUS_OTHER,
        ]}
      >
        <PrettyText
          onTextLayout={(e) => setWrapped(e.nativeEvent.lines.length > 1)}
          style={{ fontSize: 14, lineHeight: 19.6, color: mine ? Ramp.accent[100] : Colors.textPrimary }}
        >
          {msg.content}
        </PrettyText>
      </View>
    </View>
  );
});

export const ThreadView: React.FC<Props> = ({
  kind,
  title,
  subtitle,
  avatarIcon,
  avatarText,
  avatarShelter,
  onTitlePress,
  actionLabel,
  actionIcon,
  onAction,
  onBack,
  messages, myId, loading, emptyTitle, emptyBody, onSend, otherTyping, onTyping, onStoppedTyping,
}) => {
  const { t } = useTranslation();
  const { top, bottom } = useScreenInsets();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const empty = draft.trim().length === 0;

  // The 34pt home-indicator padding under the composer only applies at rest; the keyboard replaces it.
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const scrollToEnd = useCallback(() => scrollRef.current?.scrollToEnd({ animated: false }), []);
  useEffect(() => { if (otherTyping) scrollToEnd(); }, [otherTyping, scrollToEnd]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    onStoppedTyping?.();
    const ok = await onSend(text);
    if (ok === false) setDraft((cur) => cur || text);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Header: padding 50 12 10 8, gap 8, divider hairline along the bottom edge. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, paddingTop: top - 6, paddingRight: 12, paddingBottom: 10, paddingLeft: 8 }}>
        <Pressable
          onPress={onBack}
          accessibilityLabel={t('chat.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? PRESSED : 'transparent' })}
        >
          <Icon name={BACK_ICON} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={onTitlePress}
          disabled={!onTitlePress}
          accessibilityLabel={onTitlePress ? title : undefined}
          accessibilityRole={onTitlePress ? 'button' : undefined}
          style={({ pressed }) => [
            { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', columnGap: 10 },
            onTitlePress && pressed && { opacity: 0.7 },
          ]}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: kind === 'group' ? 12 : 19,
              backgroundColor: Ramp.accent[800],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {kind === 'group' && avatarIcon ? (
              <Icon name={avatarIcon} size={18} color={Ramp.accent[200]} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '500', color: Ramp.accent[200] }}>
                {avatarText}
              </Text>
            )}
            {avatarShelter && (
              <ShelterHeartBadge
                size={22}
                style={{ position: 'absolute', bottom: -8, right: -8 }}
              />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 15, fontWeight: '500', transform: [{ translateY: -0.5 }] }}
            >
              {title}
            </Text>
            <Text
              style={{ fontSize: 12, color: Ramp.neutral[500], transform: [{ translateY: -1 }] }}
            >
              {subtitle}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={({ pressed }) => ({
            height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: DIV, flexDirection: 'row', alignItems: 'center',
            columnGap: 6, backgroundColor: pressed ? PRESSED : 'transparent',
          })}
        >
          <Icon name={actionIcon} size={12} color={Colors.textPrimary} />
          <Text numberOfLines={1} style={{ fontSize: 12 }}>{actionLabel}</Text>
        </Pressable>
        <Hairline tone="divider" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
      </View>

      {/* Messages: padding 16 16 8, gap 6. Bubbles of the same sender stack with no extra margin. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 8, rowGap: 6 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
      >
        {!loading && messages.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8, rowGap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: '500' }}>{emptyTitle}</Text>
            <Text style={{ fontSize: 13, color: Ramp.neutral[400] }}>{emptyBody}</Text>
          </View>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          if (m.type === 'system') {
            return (
              <Text key={m.id} style={{ fontSize: 11, color: Ramp.neutral[500], textAlign: 'center', marginTop: 8 }}>{m.content}</Text>
            );
          }
          const mine = !!myId && m.senderId === myId;
          const cont = !!prev && prev.type !== 'system' && prev.senderId === m.senderId;
          return <Bubble key={m.id} msg={m} mine={mine} cont={cont} showName={kind === 'group' && !mine && !cont} />;
        })}
        {otherTyping && <TypingDots />}
      </ScrollView>

      {/* Composer: padding 8 12 34, gap 8. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, paddingTop: 8, paddingHorizontal: 12, paddingBottom: keyboardUp ? 8 : bottom }}>
        <TextInput
          value={draft}
          onChangeText={(text) => { setDraft(text); if (text.trim()) onTyping?.(); else onStoppedTyping?.(); }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onStoppedTyping?.(); }}
          onSubmitEditing={send}
          returnKeyType="send"
          blurOnSubmit={false}
          maxLength={1000}
          placeholder={t('chat.messagePlaceholder')}
          placeholderTextColor={Ramp.neutral[600]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          style={{
            flex: 1, minWidth: 0, height: 44, borderRadius: 22, borderWidth: 1, borderColor: focused ? Colors.primary : DIV,
            backgroundColor: Colors.surfaceDark, paddingTop: 0, paddingBottom: 2.5, paddingHorizontal: 16, fontSize: 14, color: Colors.textPrimary,
          }}
        />
        <Pressable
          onPress={send}
          disabled={empty}
          accessibilityLabel={t('chat.send')}
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
            opacity: empty ? 0.45 : 1,
          }}
        >
          <Icon name="paper-plane-right" size={18} color={Colors.primary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
