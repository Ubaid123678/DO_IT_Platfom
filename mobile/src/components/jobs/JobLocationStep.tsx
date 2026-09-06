import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function JobLocationStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const { city, address, country, formattedAddress } = state.formData.location;
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const detectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const reverseGeo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        dispatch({
          type: 'UPDATE_NESTED_FORM',
          section: 'location',
          field: 'coordinates',
          value: [location.coords.longitude, location.coords.latitude],
        });
        dispatch({
          type: 'UPDATE_NESTED_FORM',
          section: 'location',
          field: 'city',
          value: place.city || place.subregion || '',
        });
        dispatch({
          type: 'UPDATE_NESTED_FORM',
          section: 'location',
          field: 'country',
          value: place.isoCountryCode || 'US',
        });
        dispatch({
          type: 'UPDATE_NESTED_FORM',
          section: 'location',
          field: 'formattedAddress',
          value: [place.street, place.city, place.region, place.postalCode].filter(Boolean).join(', '),
        });
        if (place.street) {
          dispatch({
            type: 'UPDATE_NESTED_FORM',
            section: 'location',
            field: 'address',
            value: place.street,
          });
        }
      }
    } catch {
      setLocationError('Failed to detect location');
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '37.5%' }]} />
          </View>

          <Text style={styles.title}>Location</Text>
          <Text style={styles.subtitle}>Where should the work be done?</Text>

          <TouchableOpacity style={styles.detectLocationBtn} onPress={detectLocation} disabled={detectingLocation}>
            <View style={styles.detectIcon}>
              <Ionicons name={detectingLocation ? 'refresh' : 'location-outline'} size={24} color={C.primary} />
            </View>
            <View style={styles.detectText}>
              <Text style={styles.detectTitle}>Use current location</Text>
              <Text style={styles.detectSubtitle}>We'll detect your city and address automatically</Text>
            </View>
            {detectingLocation && <ActivityIndicator size="small" color={C.primary} />}
          </TouchableOpacity>

          {locationError && <Text style={styles.errorText}>{locationError}</Text>}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. San Francisco"
              value={city}
              onChangeText={(v) => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'city', value: v })}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Main St, Apt 4B"
              value={address}
              onChangeText={(v) => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'address', value: v })}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. US"
              value={country}
              onChangeText={(v) => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'country', value: v.toUpperCase() })}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>

          {formattedAddress && (
            <View style={styles.formattedAddress}>
              <Ionicons name="map-outline" size={16} color={C.textSecondary} />
              <Text style={styles.formattedText}>{formattedAddress}</Text>
            </View>
          )}

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
            <Text style={styles.noteText}>For digital jobs, only city/country is shown to providers. Exact address is kept private.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]} onPress={goNext} disabled={!canGoNext()}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    keyboardAvoiding: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    detectLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.primaryLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.primary,
    },
    detectIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    detectText: { flex: 1 },
    detectTitle: { fontSize: 15, fontWeight: '600', color: C.primary },
    detectSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    errorText: { color: C.error, fontSize: 13, marginBottom: 16 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    required: { color: C.error },
    input: {
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 10,
      height: 52,
      paddingHorizontal: 16,
      fontSize: 16,
      color: C.textPrimary,
    },
    formattedAddress: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: C.inputBg, borderRadius: 10, marginBottom: 16 },
    formattedText: { fontSize: 13, color: C.textSecondary, flex: 1 },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: C.warning + '15', borderRadius: 10, marginTop: 16 },
    noteText: { fontSize: 12, color: C.textSecondary, flex: 1 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });