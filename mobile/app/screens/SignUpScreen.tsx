import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, DollarSign } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuth();
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const success = await register(email, password, name);

    if (success) {
      // The AppNavigator will automatically handle the navigation to the main app
      // because the user state will change upon successful registration.
      // A confirmation message is good practice.
      Alert.alert('Success', 'Account created! You are now logged in.');
    } else {
      Alert.alert('Registration Failed', 'Could not create an account. Please try again.');
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
          <Text className="text-gray-400 mt-2">Create your account</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-300 mb-2">Full Name</Text>
            <View className="flex-row items-center bg-gray-700 rounded-md p-3">
              <UserIcon color="gray" size={20} />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Enter your full name"
                placeholderTextColor="gray"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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
                placeholder="Create a password"
                placeholderTextColor="gray"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-300 mb-2">Confirm Password</Text>
            <View className="flex-row items-center bg-gray-700 rounded-md p-3">
              <Lock color="gray" size={20} />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Confirm your password"
                placeholderTextColor="gray"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            onPress={handleSignUp}
            className="w-full bg-blue-600 py-3 rounded-md items-center justify-center active:opacity-80"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Sign Up</Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Already have an account? </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text className="text-blue-500 font-bold">Sign in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
