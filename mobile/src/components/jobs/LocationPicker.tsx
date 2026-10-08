import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, useColorScheme, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, type AppColors } from '@/src/theme/colors';

interface LocationPickerProps {
  title: string;
  subtitle?: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onLocationSelect: (location: {
    coordinates: [number, number];
    address: string;
    city: string;
    country: string;
    formattedAddress: string;
  }) => void;
  onCancel: () => void;
  onUseCurrentLocation?: () => Promise<void>;
  visible?: boolean;
}

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
} as const;

// Use Nominatim (OpenStreetMap) for free geocoding - no API key needed
const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';
const MAPTILER_KEY = (Constants.expoConfig?.extra?.mapTilerKey || process.env.EXPO_PUBLIC_MAPTILER_KEY) as string | undefined;
const MAPTILER_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : '';

const createMapHtml = (latitude: number, longitude: number) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
    <style>html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script>
      const map = new maplibregl.Map({
        container: 'map',
        style: ${JSON.stringify(MAPTILER_STYLE_URL)},
        center: [${longitude}, ${latitude}],
        zoom: 13,
        attributionControl: true,
      });
      const selected = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [${longitude}, ${latitude}] },
        properties: {},
      };
      map.on('load', () => {
        map.addSource('selected-location', { type: 'geojson', data: selected });
        map.addLayer({
          id: 'selected-location-point',
          type: 'circle',
          source: 'selected-location',
          paint: {
            'circle-radius': 9,
            'circle-color': '#0d9488',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
          },
        });
      });
      map.on('click', (event) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapPress',
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        }));
      });
      window.setLocation = (nextLatitude, nextLongitude) => {
        map.flyTo({ center: [nextLongitude, nextLatitude], zoom: 15, essential: true });
        selected.geometry.coordinates = [nextLongitude, nextLatitude];
        const source = map.getSource('selected-location');
        if (source) source.setData(selected);
      };
      window.zoomMap = (amount) => map.zoomTo(map.getZoom() + amount, { duration: 250 });
    </script>
  </body>
</html>`;

export default function LocationPicker({
  title,
  subtitle,
  initialRegion = DEFAULT_REGION,
  onLocationSelect,
  onCancel,
  onUseCurrentLocation,
  visible = true,
}: LocationPickerProps & { visible?: boolean }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  
  const mapRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [formattedAddress, setFormattedAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta,
    longitudeDelta: initialRegion.longitudeDelta,
  });
  const hasOpenedRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (!visible) {
      hasOpenedRef.current = false;
      return;
    }

    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setSelectedLocation({
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
      });
      setMapRegion({
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        latitudeDelta: initialRegion.latitudeDelta,
        longitudeDelta: initialRegion.longitudeDelta,
      });
      setAddress('');
      setCity('');
      setCountry('');
      setFormattedAddress('');
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [visible, initialRegion.latitude, initialRegion.longitude, initialRegion.latitudeDelta, initialRegion.longitudeDelta]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    setLoadingAddress(true);
    try {
      try {
        const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeo.length > 0) {
          const place = reverseGeo[0];
          const addr = place.street || '';
          const cityName = place.city || place.subregion || '';
          const countryCode = place.isoCountryCode || 'US';
          const formatted = [place.street, place.city, place.region, place.postalCode].filter(Boolean).join(', ');

          setAddress(addr);
          setCity(cityName);
          setCountry(countryCode);
          setFormattedAddress(formatted);

          return {
            coordinates: [longitude, latitude] as [number, number],
            address: addr,
            city: cityName,
            country: countryCode,
            formattedAddress: formatted,
          };
        }
      } catch (error) {
        console.warn('expo-location reverse geocode failed, trying Nominatim:', error);
      }

      try {
        const response = await fetch(
          `${REVERSE_GEOCODE_URL}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { headers: { 'User-Agent': 'DoItPlatform/1.0' } }
        );
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address.road || data.address.pedestrian || data.address.footway || '';
          const cityName = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
          const countryCode = data.address.country_code?.toUpperCase() || 'US';
          const formatted = data.display_name || '';

          setAddress(addr);
          setCity(cityName);
          setCountry(countryCode);
          setFormattedAddress(formatted);

          return {
            coordinates: [longitude, latitude] as [number, number],
            address: addr,
            city: cityName,
            country: countryCode,
            formattedAddress: formatted,
          };
        }
      } catch (error) {
        console.error('Nominatim reverse geocode failed:', error);
      }
    } finally {
      setLoadingAddress(false);
    }
    return null;
  };

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const response = await fetch(
        `${GEOCODE_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'DoItPlatform/1.0' } }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    setSelectedLocation({ latitude, longitude });
    setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    mapRef.current?.injectJavaScript(`window.setLocation?.(${latitude}, ${longitude}); true;`);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Get detailed address
    reverseGeocode(latitude, longitude).then((locationData) => {
      if (!locationData) Alert.alert('Address unavailable', 'The location is selected, but its address could not be loaded yet.');
    });
  };

  const onMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    mapRef.current?.injectJavaScript(`window.setLocation?.(${latitude}, ${longitude}); true;`);
    setShowSearchResults(false);
    
    const locationData = await reverseGeocode(latitude, longitude);
    if (!locationData) Alert.alert('Address unavailable', 'The location is selected, but its address could not be loaded yet.');
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use current location');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      setSelectedLocation({ latitude, longitude });
      setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      mapRef.current?.injectJavaScript(`window.setLocation?.(${latitude}, ${longitude}); true;`);

      const locationData = await reverseGeocode(latitude, longitude);
      if (!locationData) Alert.alert('Address unavailable', 'Your location is selected, but its address could not be loaded yet.');
    } catch (error) {
      console.error('Current location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleMapMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'mapPress') {
        onMapPress({ nativeEvent: { coordinate: message } });
      }
    } catch (error) {
      console.warn('Invalid map message:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation || loadingAddress) {
      Alert.alert('Select Location', 'Please tap on the map or search for a location');
      return;
    }

    onLocationSelect({
      coordinates: [selectedLocation.longitude, selectedLocation.latitude],
      address,
      city: city || 'Selected location',
      country,
      formattedAddress: formattedAddress || city || 'Selected location',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaViewCompat style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search address, city, or landmark..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchLocations(text);
            }}
            onFocus={() => setShowSearchResults(searchResults.length > 0)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            autoCapitalize="words"
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity style={styles.searchIcon} onPress={() => searchLocations(searchQuery)}>
            <Ionicons name="search" size={24} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.place_id}
                style={styles.searchResultItem}
                onPress={() => selectSearchResult(result)}
              >
                <Ionicons name="location-outline" size={20} color={C.primary} />
                <Text style={styles.searchResultText} numberOfLines={2}>{result.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={28} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={handleConfirm} disabled={!city || loadingAddress}>
            <Text style={[
              styles.confirmBtn, 
              (!city || loadingAddress) && styles.confirmBtnDisabled
            ]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={mapRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: createMapHtml(mapRegion.latitude, mapRegion.longitude) }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMapMessage}
            onError={(event) => console.error('MapTiler WebView error:', event.nativeEvent)}
          />

          <View style={styles.mapControls}>
            <TouchableOpacity
              accessibilityLabel="Zoom in"
              style={styles.mapControlButton}
              onPress={() => mapRef.current?.injectJavaScript('window.zoomMap?.(1); true;')}
            >
              <Ionicons name="add" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Zoom out"
              style={styles.mapControlButton}
              onPress={() => mapRef.current?.injectJavaScript('window.zoomMap?.(-1); true;')}
            >
              <Ionicons name="remove" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Use current location"
              style={styles.mapControlButton}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="locate" size={21} color={C.primary} />
            </TouchableOpacity>
          </View>

          {loadingAddress && (
            <View pointerEvents="none" style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.loadingText}>Getting address...</Text>
            </View>
          )}

          {city && (
            <View style={styles.selectedLocationCard}>
              <Ionicons name="location-outline" size={20} color={C.primary} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>{title}</Text>
                <Text style={styles.locationAddress}>{formattedAddress || `${city}, ${country}`}</Text>
              </View>
            </View>
          )}

        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.currentLocationBtn} onPress={handleUseCurrentLocation}>
            <Ionicons name="locate" size={20} color={C.primary} />
            <Text style={styles.currentLocationBtnText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaViewCompat>
    </Modal>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background, width: '100%', height: '100%' },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: C.background,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    searchInput: {
      flex: 1,
      height: 44,
      backgroundColor: C.inputBg,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: C.textPrimary,
      paddingRight: 48,
    },
    searchIcon: {
      position: 'absolute',
      right: 16,
      padding: 8,
    },
    searchResultsContainer: {
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 100,
      maxHeight: 300,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    searchResultText: { flex: 1, fontSize: 14, color: C.textPrimary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, flex: 1, textAlign: 'center', marginRight: 44 },
    confirmBtn: { fontSize: 16, fontWeight: '600', color: C.primary },
    confirmBtnDisabled: { color: C.textHint },
    mapContainer: { flex: 1, width: '100%', height: '100%' },
    map: { ...StyleSheet.absoluteFill },
    mapControls: {
      position: 'absolute',
      top: 16,
      right: 16,
      gap: 8,
    },
    mapControlButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 10,
    },
    loadingText: { marginTop: 8, color: '#fff', fontSize: 14 },
    selectedLocationCard: {
      position: 'absolute',
      bottom: 100,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    locationInfo: { flex: 1 },
    locationLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    locationAddress: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    actions: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      paddingBottom: 32,
      backgroundColor: C.background,
    },
    currentLocationBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      borderWidth: 1,
      borderColor: C.primary,
    },
    currentLocationBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
  });