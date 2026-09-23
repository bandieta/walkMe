import { AppRegistry } from 'react-native';
import './src/utils/applyGlobalFont';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
