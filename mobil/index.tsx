import { registerRootComponent } from 'expo';
import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';

import App from './App';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Uygulama Hatası</Text>
          <ScrollView style={eb.scroll}>
            <Text style={eb.msg}>{this.state.error.message}</Text>
            <Text style={eb.stack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 60, paddingHorizontal: 20 },
  title: { color: '#e94560', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  scroll: { flex: 1 },
  msg: { color: '#fff', fontSize: 16, marginBottom: 12 },
  stack: { color: '#999', fontSize: 12 },
});

function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

registerRootComponent(Root);
