import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import Organize from './components/Organize';

export default function App() {
  return (
    <View style={styles.view}>
      <Organize />
      <StatusBar  style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,

  }
});