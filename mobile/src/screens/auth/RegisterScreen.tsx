import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/src/components/common/Button';
import Input from '@/src/components/common/Input';
import { authService } from '@/src/services/authService';

const RegisterScreen: React.FC = () => {
	const router = useRouter();
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [countryCode, setCountryCode] = useState('PK');
	const [role, setRole] = useState<'client' | 'provider'>('client');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRegister = async (): Promise<void> => {
		if (!fullName || !email || !phone || !password || !countryCode) {
			setError('All fields are required.');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			await authService.register({
				fullName,
				email,
				phone,
				password,
				role,
				countryCode: countryCode.toUpperCase(),
			});

			const otpPath = `/(auth)/otp-verify?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
			router.push(otpPath as unknown as Href);
		} catch (requestError: unknown) {
			const fallback = 'Registration failed.';
			const value = requestError instanceof Error ? requestError.message : fallback;
			setError(value || fallback);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>

			<Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
			<Input
				label="Email"
				value={email}
				onChangeText={setEmail}
				placeholder="you@example.com"
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+923xxxxxxxxx" keyboardType="phone-pad" />
			<Input label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
			<Input label="Country Code" value={countryCode} onChangeText={setCountryCode} placeholder="PK" autoCapitalize="characters" />
			<Input
				label="Role (client/provider)"
				value={role}
				onChangeText={(value) => setRole(value.trim().toLowerCase() === 'provider' ? 'provider' : 'client')}
				placeholder="client"
				autoCapitalize="none"
			/>

			{error ? <Text style={styles.error}>{error}</Text> : null}
			<Button title="Register" onPress={handleRegister} loading={loading} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#F0F4F4',
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1A1A1A',
		marginBottom: 16,
	},
	error: {
		fontSize: 14,
		color: '#E74C3C',
		marginBottom: 12,
	},
});

export default RegisterScreen;
