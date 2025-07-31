import 'react-native-gesture-handler'; // Required for drawer navigation
import "./global.css";
import AppNavigator from './app/navigation/AppNavigator';
import { AuthProvider } from './app/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
