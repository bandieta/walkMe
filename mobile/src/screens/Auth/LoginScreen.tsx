// The design replaced the single login card with Welcome + a sign-in sheet (see WelcomeScreen / SignInSheet, which
// own the provider flows and the __DEV__ "Continue as test user" link). Kept as an alias so old imports still compile.
export { WelcomeScreen as LoginScreen } from './WelcomeScreen';
