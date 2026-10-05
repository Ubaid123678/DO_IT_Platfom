import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, useColorScheme, Alert } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';
import LocationPicker from './LocationPicker';

export default function JobLocationStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const jobType = state.jobType;
  const location = state.formData.location;

  const [showPicker, setShowPicker] = useState<'pickup' | 'delivery' | 'physical' | null>(null);

  // For physical jobs - single location
  const physicalLocation = {
    coordinates: location.coordinates,
    address: location.address,
    city: location.city,
    country: location.country,
    formattedAddress: location.formattedAddress,
  };

  // For errand jobs - pickup location
  const pickupLocation = location.pickupLocation || {
    coordinates: null,
    address: '',
    city: '',
    country: '',
    formattedAddress: '',
  };

  // For errand jobs - delivery location
  const deliveryLocation = location.deliveryLocation || {
    coordinates: null,
    address: '',
    city: '',
    country: '',
    formattedAddress: '',
  };

  const openPhysicalPicker = () => setShowPicker('physical');
  const openPickupPicker = () => setShowPicker('pickup');
  const openDeliveryPicker = () => setShowPicker('delivery');

  const closePicker = () => setShowPicker(null);

  const handlePhysicalLocationSelect = (loc: any) => {
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'coordinates', value: loc.coordinates });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'address', value: loc.address });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'city', value: loc.city });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'country', value: loc.country });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'formattedAddress', value: loc.formattedAddress });
    closePicker();
  };

  const handlePickupLocationSelect = (loc: any) => {
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'pickupLocation', value: loc });
    closePicker();
  };

  const handleDeliveryLocationSelect = (loc: any) => {
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'location', field: 'deliveryLocation', value: loc });
    closePicker();
  };

  const handleUseCurrentLocation = async (type: 'physical' | 'pickup' | 'delivery') => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const reverseGeo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        const locationData = {
          coordinates: [loc.coords.longitude, loc.coords.latitude] as [number, number],
          address: place.street || '',
          city: place.city || place.subregion || '',
          country: place.isoCountryCode || 'US',
          formattedAddress: [place.street, place.city, place.region, place.postalCode].filter(Boolean).join(', '),
        };
        
        if (type === 'physical') {
          handlePhysicalLocationSelect(locationData);
        } else if (type === 'pickup') {
          handlePickupLocationSelect(locationData);
        } else if (type === 'delivery') {
          handleDeliveryLocationSelect(locationData);
        }
      }
    } catch (error) {
      console.error('Current location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  // Render location card for display
  const renderLocationCard = (title: string, loc: any, onPress: () => void, icon: string, required: boolean = false) => {
    const hasLocation = loc.city && loc.city.trim().length > 0;
    
    return (
      <TouchableOpacity style={styles.locationCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.locationCardHeader}>
          <View style={styles.locationIcon}>
            <Ionicons name={icon as any} size={24} color={C.primary} />
          </View>
          <View style={styles.locationCardTitle}>
            <Text style={styles.locationTitle}>{title} {required && <Text style={styles.required}>*</Text>}</Text>
            <Text style={styles.locationSubtitle}>{hasLocation ? 'Set' : 'Tap to set location'}</Text>
          </View>
        </View>
        {hasLocation && (
          <View style={styles.locationCardDetails}>
            <Ionicons name={"location-outline" as any} size={16} color={C.textSecondary} />
            <Text style={styles.locationDetailText} numberOfLines={2}>
              {loc.formattedAddress || `${loc.city}, ${loc.country}`}
            </Text>
          </View>
        )}
        {!hasLocation && (
          <View style={styles.locationCardPrompt}>
            <Ionicons name={"add-circle-outline" as any} size={16} color={C.primary} />
            <Text style={styles.locationPromptText}>Tap to select on map</Text>
          </View>
        )}
      </TouchableOpacity>
    );
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

      <View style={styles.content}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: jobType === 'digital' ? '25%' : '37.5%' }]} />
        </View>

        {jobType === 'physical' && (
          <>
            <Text style={styles.title}>Work Location</Text>
            <Text style={styles.subtitle}>Where should the work be done? You can pick any address on the map.</Text>
            
            {renderLocationCard(
              'Job Site',
              physicalLocation,
              openPhysicalPicker,
              'home-outline',
              true
            )}

            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
              <Text style={styles.noteText}>
                Tap "Job Site" to select the exact address on the map. You can also use your current location.
              </Text>
            </View>
          </>
        )}

        {jobType === 'errand' && (
          <>
            <Text style={styles.title}>Pickup & Delivery Locations</Text>
            <Text style={styles.subtitle}>Where should the provider pick up and deliver the items?</Text>
            
            <View style={styles.errandLocationsRow}>
              {renderLocationCard(
                'Pickup Location',
                pickupLocation,
                openPickupPicker,
                'arrow-down-outline',
                true
              )}
              {renderLocationCard(
                'Delivery Location',
                deliveryLocation,
                openDeliveryPicker,
                'arrow-up-outline',
                true
              )}
            </View>

            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
              <Text style={styles.noteText}>
                Both pickup and delivery locations are required. Tap each card to select on the map.
              </Text>
            </View>
          </>
        )}

        {jobType === 'digital' && (
          <>
            <Text style={styles.title}>Location Not Required</Text>
            <Text style={styles.subtitle}>Digital jobs are performed remotely. No location needed.</Text>
            <View style={styles.digitalNote}>
              <Ionicons name="wifi-outline" size={48} color={C.primary} />
              <Text style={styles.digitalNoteText}>Work from anywhere!</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]} onPress={goNext} disabled={!canGoNext()}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Location Picker Modals */}
      <LocationPicker
        title="Job Site"
        subtitle="Select where the work will be done"
        initialRegion={physicalLocation.coordinates ? {
          latitude: physicalLocation.coordinates[1],
          longitude: physicalLocation.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onLocationSelect={handlePhysicalLocationSelect}
        onCancel={closePicker}
        onUseCurrentLocation={() => handleUseCurrentLocation('physical')}
        visible={showPicker === 'physical'}
      />
      
      <LocationPicker
        title="Pickup Location"
        subtitle="Select where to pick up the items"
        initialRegion={pickupLocation.coordinates ? {
          latitude: pickupLocation.coordinates[1],
          longitude: pickupLocation.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onLocationSelect={handlePickupLocationSelect}
        onCancel={closePicker}
        onUseCurrentLocation={() => handleUseCurrentLocation('pickup')}
        visible={showPicker === 'pickup'}
      />
      
      <LocationPicker
        title="Delivery Location"
        subtitle="Select where to deliver the items"
        initialRegion={deliveryLocation.coordinates ? {
          latitude: deliveryLocation.coordinates[1],
          longitude: deliveryLocation.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onLocationSelect={handleDeliveryLocationSelect}
        onCancel={closePicker}
        onUseCurrentLocation={() => handleUseCurrentLocation('delivery')}
        visible={showPicker === 'delivery'}
      />
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    locationCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      marginBottom: 16,
    },
    locationCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    locationIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationCardTitle: { flex: 1 },
    locationTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    required: { color: C.error, marginLeft: 4 },
    locationSubtitle: { fontSize: 12, color: C.textHint },
    locationCardDetails: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    locationDetailText: { fontSize: 13, color: C.textPrimary, flex: 1 },
    locationCardPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    locationPromptText: { fontSize: 13, color: C.primary, fontWeight: '500' },
    errandLocationsRow: {
      gap: 12,
      marginBottom: 16,
    },
    note: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      backgroundColor: C.warning + '15',
      borderRadius: 10,
      marginTop: 16,
    },
    noteText: { fontSize: 12, color: C.textSecondary, flex: 1 },
    digitalNote: {
      alignItems: 'center',
      padding: 40,
      backgroundColor: C.primaryLight,
      borderRadius: 16,
      marginTop: 16,
    },
    digitalNoteText: { marginTop: 12, fontSize: 16, fontWeight: '600', color: C.primary },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });