// src/navigation/AuthNavigator.jsx
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../models/utils/constants';

// ── Screens
import LoginScreen from '../views/screens/LoginScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;