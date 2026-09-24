import Sound from 'react-native-sound';

// The three-dot typing indicator's "click click click" — one short tick per bounce (see TypingDots.tsx).
// 'Ambient' mixes with whatever else is playing and stays silent if the phone's silent switch is on, like
// a keyboard click should. The file lives at ios/WalkMe/typing_click.wav (needs adding to the Xcode project's
// target — "Add Files to WalkMe…" — Xcode project files can't be edited safely from here) and
// android/app/src/main/res/raw/typing_click.wav (Android picks up files placed there with no extra step).
//
// Everything below is wrapped defensively: until this is rebuilt with the native react-native-sound module
// linked (`pod install` on iOS; Android needs no extra step), the native module isn't there yet, and calling
// into it would throw — the typing indicator itself must keep working with the dots just silent, not crash.
try {
  Sound.setCategory('Ambient');
} catch (error) {
  console.warn('[typingSound] native module not available yet — rebuild the app to enable typing sounds', error);
}

let clickSound: Sound | null | undefined; // undefined = not attempted yet, null = failed to load

function getClickSound(): Sound | null {
  if (clickSound !== undefined) return clickSound;
  try {
    clickSound = new Sound('typing_click.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('[typingSound] could not load typing_click.wav — is it added to the native build?', error);
        clickSound = null;
      }
    });
  } catch (error) {
    console.warn('[typingSound] native module not available yet — rebuild the app to enable typing sounds', error);
    clickSound = null;
  }
  return clickSound;
}

/** Best-effort: a failed or not-yet-loaded sound must never break the typing indicator itself. */
export function playTypingClick() {
  try {
    const sound = getClickSound();
    if (!sound) return;
    sound.stop(() => sound.play());
  } catch (error) {
    console.warn('[typingSound] playback failed', error);
  }
}
