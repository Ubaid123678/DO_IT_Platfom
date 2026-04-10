import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ClientTabs: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClientTabs</Text>
      <Text style={styles.subtitle}>TODO: Implement UI and logic.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F0F4F4',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ClientTabs;
