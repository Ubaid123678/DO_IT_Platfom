import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { AuthProvider } from '@/src/context/AuthContext';

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(onboarding)" />
                    <Stack.Screen name="(client)" />
                    <Stack.Screen name="(provider)" />
                    <Stack.Screen name="(shared)" />
                    <Stack.Screen name="(help)" />
                </Stack>
            </AuthProvider>
        </ErrorBoundary>
    );
}
