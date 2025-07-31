import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, DollarSign } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the type for the navigation prop for type safety
type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

type SignInScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignIn'>;


export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigation = useNavigation<SignInScreenNavigationProp>();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    const { error } = await login(email, password);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      // Navigation to the main app will be handled automatically by the AppNavigator
      // because the user state will change.
      // We could show a success message here if desired.
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 p-6">
      <View className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg">
        <View className="items-center">
          <View className="w-16 h-16 items-center justify-center bg-blue-600 rounded-full mb-4">
            <DollarSign color="white" size={32} />
          </View>
          <Text className="text-3xl font-bold text-white">Balance Tracker</Text>
          <Text className="text-gray-400 mt-2">Sign in to your account</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-300 mb-2">Email</Text>
            <View className="flex-row items-center bg-gray-700 rounded-md p-3">
              <Mail color="gray" size={20} />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Enter your email"
                placeholderTextColor="gray"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-300 mb-2">Password</Text>
            <View className="flex-row items-center bg-gray-700 rounded-md p-3">
              <Lock color="gray" size={20} />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Enter your password"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            onPress={handleSignIn}
            className="w-full bg-blue-600 py-3 rounded-md items-center justify-center active:opacity-80"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Sign In</Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text className="text-blue-500 font-bold">Sign up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
