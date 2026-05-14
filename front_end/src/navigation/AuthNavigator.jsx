// src/navigation/AuthNavigator.jsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import ForgotPasswordScreen from '../views/screens/ForgotPasswordScreen';
import LoginScreen from '../views/screens/LoginScreen';
import RegisterScreen from '../views/screens/RegisterScreen';
import SetPasswordScreen from '../views/screens/SetPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"          component={LoginScreen} />
    <Stack.Screen name="Register"       component={RegisterScreen} /> 
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="SetPassword"    component={SetPasswordScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;