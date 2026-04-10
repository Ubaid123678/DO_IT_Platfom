import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/src/components/common/Button';
import Input from '@/src/components/common/Input';
import { authService } from '@/src/services/authService';

const OtpVerifyScreen: React.FC = () => {
	const params = useLocalSearchParams<{ email?: string; phone?: string }>();
	const email = params.email ?? '';
	const phone = params.phone ?? '';

	const [emailOtp, setEmailOtp] = useState('');
	const [phoneOtp, setPhoneOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleVerify = async (): Promise<void> => {
		if (!email || !phone) {
			setError('Missing email or phone for OTP verification.');
			return;
		}

		if (!emailOtp || !phoneOtp) {
			setError('Both email OTP and phone OTP are required.');
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			await authService.verifyEmail({ email, otp: emailOtp });
			await authService.verifyPhone({ phone, otp: phoneOtp });
			setSuccess('Email and phone verified successfully.');
		} catch (requestError: unknown) {
			const fallback = 'OTP verification failed.';
			const value = requestError instanceof Error ? requestError.message : fallback;
			setError(value || fallback);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Verify OTP</Text>
			<Text style={styles.subtitle}>Email: {email || '-'}</Text>
			<Text style={styles.subtitle}>Phone: {phone || '-'}</Text>

			<Input label="Email OTP" value={emailOtp} onChangeText={setEmailOtp} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} />
			<Input label="Phone OTP" value={phoneOtp} onChangeText={setPhoneOtp} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} />

			{error ? <Text style={styles.error}>{error}</Text> : null}
			{success ? <Text style={styles.success}>{success}</Text> : null}

			<Button title="Verify OTP" onPress={handleVerify} loading={loading} />
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
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 8,
	},
	error: {
		fontSize: 14,
		color: '#E74C3C',
		marginBottom: 12,
	},
	success: {
		fontSize: 14,
		color: '#27AE60',
		marginBottom: 12,
	},
});

export default OtpVerifyScreen;
