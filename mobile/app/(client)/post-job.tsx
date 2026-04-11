import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet from '@/src/components/common/BottomSheet';
import { Colors, type AppColors } from '@/src/theme/colors';

type JobType = 'physical' | 'digital';
type BudgetType = 'fixed' | 'hourly';
type RadiusValue = 1 | 5 | 10 | 50 | 'worldwide';

type CategoryOption = {
  id: string;
  label: string;
  emoji: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const categoryOptions: CategoryOption[] = [
  { id: 'transport', label: 'Transport', emoji: '🚗', icon: 'car-outline' },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧹', icon: 'sparkles-outline' },
  { id: 'delivery', label: 'Delivery', emoji: '📦', icon: 'cube-outline' },
  { id: 'repair', label: 'Repair', emoji: '🔧', icon: 'build-outline' },
  { id: 'design', label: 'Design', emoji: '✏️', icon: 'color-palette-outline' },
  { id: 'coding', label: 'Coding', emoji: '💻', icon: 'code-slash-outline' },
  { id: 'writing', label: 'Writing', emoji: '📝', icon: 'create-outline' },
  { id: 'teaching', label: 'Teaching', emoji: '📚', icon: 'book-outline' },
  { id: 'photography', label: 'Photography', emoji: '📸', icon: 'camera-outline' },
  { id: 'other', label: 'Other', emoji: '⚙️', icon: 'settings-outline' },
];

const radiusOptions: Array<{ label: string; value: RadiusValue }> = [
  { label: '1km', value: 1 },
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '50km', value: 50 },
  { label: 'Worldwide', value: 'worldwide' },
];

const progressTrackWidth = Math.max(Dimensions.get('window').width - 40, 0);

export default function PostJobScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryOption | null>(null);
  const [jobType, setJobType] = useState<JobType>('physical');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState<RadiusValue>(5);
  const [budgetType, setBudgetType] = useState<BudgetType>('fixed');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState({ code: 'USD', symbol: '$' });
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const progressAnim = useRef(new Animated.Value(step / 3)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / 3,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, step]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressTrackWidth],
  });

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
      return;
    }

    router.back();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleAddPhoto = () => {
    const nextSeed = `${Date.now()}-${photos.length}`;
    setPhotos((prev) => [...prev, `https://picsum.photos/seed/${nextSeed}/200/200`]);
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((item) => item !== uri));
  };

  const handleUseCurrentLocation = () => {
    setLocation('Street 12, DHA, Lahore');
  };

  const handlePickDeadline = () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    setDeadline(future.toLocaleString());
  };

  const handlePostJob = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.replace('/(client)/my-jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <Text style={styles.stepText}>{`Step ${step} of 3`}</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, step < 3 ? styles.scrollWithFixedButton : null]}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <Text style={styles.sectionHeadline}>Tell us what you need</Text>

              <Text style={styles.label}>Title</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  style={styles.inputText}
                  placeholder="e.g. I need a ride to the bus stop"
                  placeholderTextColor={C.textHint}
                />
              </View>

              <Text style={styles.label}>Category</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={() => setShowCategorySheet(true)}>
                {category ? (
                  <>
                    <Ionicons name={category.icon} size={20} color={C.primary} />
                    <Text style={styles.selectorTextSelected}>{category.label}</Text>
                  </>
                ) : (
                  <Text style={styles.selectorTextPlaceholder}>Select a category</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={C.textHint} />
              </TouchableOpacity>

              <Text style={styles.label}>Job Type</Text>
              <View style={styles.twoOptionRow}>
                <TouchableOpacity
                  style={[styles.twoOptionCard, jobType === 'physical' ? styles.optionCardSelected : styles.optionCardIdle]}
                  onPress={() => setJobType('physical')}
                >
                  <Ionicons name="location-outline" size={18} color={C.primary} />
                  <Text style={styles.optionLabel}>Physical / Local</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.twoOptionCard, jobType === 'digital' ? styles.optionCardSelected : styles.optionCardIdle]}
                  onPress={() => setJobType('digital')}
                >
                  <Ionicons name="laptop-outline" size={18} color={C.primary} />
                  <Text style={styles.optionLabel}>Digital / Remote</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Description</Text>
              <View style={styles.textAreaWrap}>
                <TextInput
                  value={description}
                  onChangeText={(value) => setDescription(value.slice(0, 500))}
                  multiline
                  style={styles.textArea}
                  placeholder="Describe your job in detail..."
                  placeholderTextColor={C.textHint}
                  textAlignVertical="top"
                />
                <Text style={styles.counterText}>{`${description.length}/500`}</Text>
              </View>

              <Text style={styles.label}>Photos (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                <TouchableOpacity style={styles.addPhotoCard} onPress={handleAddPhoto}>
                  <Ionicons name="camera-outline" size={24} color={C.primary} />
                </TouchableOpacity>

                {photos.map((uri) => (
                  <View key={uri} style={styles.photoItemWrap}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => handleRemovePhoto(uri)}>
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.sectionHeadline}>Location & Budget</Text>

              <Text style={styles.label}>Job Location</Text>
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={styles.inputText}
                  placeholder="Enter address"
                  placeholderTextColor={C.textHint}
                />
              </View>

              <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.currentLocationBtn}>
                <Text style={styles.currentLocationText}>📍 Use My Current Location</Text>
              </TouchableOpacity>

              {location ? (
                <View style={styles.mapPreviewBox}>
                  <Ionicons name="map-outline" size={48} color={C.primary} />
                  <Text style={styles.mapPreviewText}>~18 providers in this area</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Notify providers within</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
                {radiusOptions.map((item) => {
                  const selected = item.value === radius;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => setRadius(item.value)}
                      style={[styles.radiusChip, selected ? styles.radiusChipSelected : styles.radiusChipIdle]}
                    >
                      <Text style={[styles.radiusText, selected ? styles.radiusTextSelected : styles.radiusTextIdle]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>Budget Type</Text>
              <View style={styles.twoOptionRow}>
                <TouchableOpacity
                  style={[styles.twoOptionCard, budgetType === 'fixed' ? styles.optionCardSelected : styles.optionCardIdle]}
                  onPress={() => setBudgetType('fixed')}
                >
                  <Ionicons name="pricetag-outline" size={18} color={C.primary} />
                  <Text style={styles.optionLabel}>Fixed Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.twoOptionCard, budgetType === 'hourly' ? styles.optionCardSelected : styles.optionCardIdle]}
                  onPress={() => setBudgetType('hourly')}
                >
                  <Ionicons name="time-outline" size={18} color={C.primary} />
                  <Text style={styles.optionLabel}>Hourly Rate</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Budget</Text>
              <View style={styles.budgetBox}>
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="numeric"
                  style={styles.budgetInput}
                  placeholder="0"
                  placeholderTextColor={C.textHint}
                />
                <TouchableOpacity onPress={() => setCurrency((prev) => (prev.code === 'USD' ? { code: 'PKR', symbol: 'Rs' } : { code: 'USD', symbol: '$' }))}>
                  <Text style={styles.currencyCode}>{currency.code}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Deadline</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={handlePickDeadline}>
                <Ionicons name="calendar-outline" size={20} color={C.textHint} />
                <Text style={deadline ? styles.selectorTextSelected : styles.selectorTextPlaceholder}>
                  {deadline || 'Select date & time'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={styles.sectionHeadline}>Review & Post</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category</Text>
                  <Text style={styles.summaryValue}>{category?.label || 'Not selected'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>{jobType === 'physical' ? 'Physical / Local' : 'Digital / Remote'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>{location || 'Not added'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Budget</Text>
                  <Text style={styles.summaryValue}>{budget ? `${currency.symbol}${budget}` : 'Not set'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Deadline</Text>
                  <Text style={styles.summaryValue}>{deadline || 'Not selected'}</Text>
                </View>
                <View style={styles.summaryFinalRow}>
                  <Ionicons name="people-outline" size={16} color={C.primary} />
                  <Text style={styles.summaryNotifyText}>~24 providers to notify</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.postJobButton} onPress={handlePostJob} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.postJobButtonText}>Post Job</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft} disabled={loading}>
                <Text style={styles.saveDraftText}>Save as Draft</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>

        {step < 3 ? (
          <View style={styles.fixedNextWrap}>
            <TouchableOpacity style={styles.fixedNextButton} onPress={handleNext}>
              <Text style={styles.fixedNextText}>{step === 1 ? 'Next: Location & Budget' : 'Next: Review & Post'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="Select Category"
      >
        <View style={styles.categoryGrid}>
          {categoryOptions.map((item) => {
            const selected = category?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.categoryItem, selected ? styles.categoryItemSelected : null]}
                onPress={() => {
                  setCategory(item);
                  setShowCategorySheet(false);
                }}
              >
                <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 8,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      marginRight: 8,
    },
    stepText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.primary,
    },
    progressTrack: {
      marginHorizontal: 20,
      marginBottom: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.cardBorder,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: C.primary,
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 36,
    },
    scrollWithFixedButton: {
      paddingBottom: 120,
    },
    sectionHeadline: {
      marginTop: 24,
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textSecondary,
      marginBottom: 8,
      marginTop: 2,
    },
    inputRow: {
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    inputText: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    selectorRow: {
      height: 52,
      borderRadius: 10,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    selectorTextSelected: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
      fontWeight: '500',
    },
    selectorTextPlaceholder: {
      flex: 1,
      fontSize: 14,
      color: C.textHint,
    },
    twoOptionRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    twoOptionCard: {
      flex: 1,
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    optionCardSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    optionCardIdle: {
      borderColor: C.cardBorder,
      backgroundColor: C.card,
    },
    optionLabel: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    textAreaWrap: {
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
    },
    textArea: {
      minHeight: 96,
      maxHeight: 120,
      fontSize: 14,
      color: C.textPrimary,
    },
    counterText: {
      marginTop: 8,
      textAlign: 'right',
      fontSize: 11,
      color: C.textHint,
    },
    photosRow: {
      gap: 8,
      paddingBottom: 4,
    },
    addPhotoCard: {
      width: 72,
      height: 72,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: C.primary,
      borderStyle: 'dashed',
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoItemWrap: {
      width: 72,
      height: 72,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    },
    photoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    removePhotoBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: C.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leadingIcon: {
      marginRight: 10,
    },
    currentLocationBtn: {
      marginTop: -2,
      marginBottom: 12,
    },
    currentLocationText: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '500',
    },
    mapPreviewBox: {
      height: 140,
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    mapPreviewText: {
      marginTop: 8,
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    radiusRow: {
      gap: 8,
      marginBottom: 12,
      paddingBottom: 2,
    },
    radiusChip: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    radiusChipSelected: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    radiusChipIdle: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
    },
    radiusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    radiusTextSelected: {
      color: 'white',
    },
    radiusTextIdle: {
      color: C.textSecondary,
    },
    budgetBox: {
      height: 64,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    currencySymbol: {
      fontSize: 28,
      fontWeight: '700',
      color: C.primary,
      marginRight: 4,
    },
    budgetInput: {
      flex: 1,
      fontSize: 32,
      fontWeight: '700',
      color: C.textPrimary,
    },
    currencyCode: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    summaryCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    summaryRow: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    summaryLabel: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textPrimary,
      textAlign: 'right',
      flexShrink: 1,
    },
    summaryFinalRow: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryNotifyText: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '500',
    },
    postJobButton: {
      height: 56,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    postJobButtonText: {
      color: 'white',
      fontSize: 17,
      fontWeight: '700',
    },
    saveDraftButton: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    saveDraftText: {
      color: C.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    fixedNextWrap: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 32,
    },
    fixedNextButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fixedNextText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'space-between',
    },
    categoryItem: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    categoryItemSelected: {
      borderColor: C.primary,
    },
    categoryEmoji: {
      fontSize: 24,
    },
    categoryLabel: {
      fontSize: 11,
      color: C.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
      paddingHorizontal: 2,
    },
  });
