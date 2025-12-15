import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [apiKeys, setApiKeys] = useState({
    sportsData: '',
    oddsApi: '',
    rapidApi: ''
  });

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('@api_keys', JSON.stringify(apiKeys));
      Alert.alert('Success', 'API keys saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 24, marginBottom: 20}}>API Configuration</Text>
      
      <Text>SportsData.io API Key:</Text>
      <TextInput
        value={apiKeys.sportsData}
        onChangeText={(text) => setApiKeys({...apiKeys, sportsData: text})}
        placeholder="Enter your API key"
        style={{borderWidth: 1, padding: 10, marginBottom: 15}}
      />
      
      <Text>The Odds API Key:</Text>
      <TextInput
        value={apiKeys.oddsApi}
        onChangeText={(text) => setApiKeys({...apiKeys, oddsApi: text})}
        placeholder="Enter your API key"
        style={{borderWidth: 1, padding: 10, marginBottom: 15}}
      />
      
      <Button title="Save Settings" onPress={saveSettings} />
    </View>
  );
};

export default SettingsScreen;
