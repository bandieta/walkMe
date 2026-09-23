// Social login provider configuration.
//
// These are placeholders — the buttons in LoginScreen won't complete a real
// sign-in until you create the corresponding developer app and fill these
// in (see README.md "Setting up social login").
//
//  - GOOGLE_WEB_CLIENT_ID: Google Cloud Console → APIs & Services →
//    Credentials → OAuth client ID of type "Web application". This exact
//    value must also be set as GOOGLE_CLIENT_ID in server/.env.
//  - FACEBOOK_APP_ID / FACEBOOK_CLIENT_TOKEN: developers.facebook.com →
//    your app → Settings → Basic (App ID) and Settings → Advanced
//    (Client Token).
//  - Apple needs no client ID here — the identity token's `aud` claim is
//    your app's bundle ID, which the server checks against
//    APPLE_BUNDLE_ID in server/.env.

export const AUTH_CONFIG = {
  GOOGLE_WEB_CLIENT_ID: 'YOUR_GOOGLE_WEB_CLIENT_ID',
  FACEBOOK_APP_ID: '943705752145111',
  FACEBOOK_CLIENT_TOKEN: '3649a51b6009267dd091ea83befc91c1',
};
