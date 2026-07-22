import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  kycService,
  type KycDocument,
  type KycDocumentType,
  type KycImageType,
  type KycStatus,
} from '@/src/services/kycService';
import { Colors, type AppColors } from '@/src/theme/colors';

const LIVENESS_STEPS: Array<{
  key: 'face_clear' | 'move_left' | 'move_right' | 'smile';
  instruction: string;
  icon: keyof typeof Ionicons.glyphMap;
  imageType: KycImageType;
}> = [
  { key: 'face_clear', instruction: 'Position your face clearly in the frame', icon: 'scan-outline', imageType: 'face_clear' },
  { key: 'move_left', instruction: 'Slowly turn your head to the left', icon: 'arrow-back-circle-outline', imageType: 'move_left' },
  { key: 'move_right', instruction: 'Slowly turn your head to the right', icon: 'arrow-forward-circle-outline', imageType: 'move_right' },
  { key: 'smile', instruction: 'Now smile naturally', icon: 'happy-outline', imageType: 'smile' },
];

const DOC_OPTIONS: Array<{
  key: KycDocumentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  sides: number;
  description: string;
}> = [
  { key: 'pass', label: 'Pass', icon: 'id-card-outline', sides: 2, description: 'Front & Back' },
  { key: 'driving_license', label: 'Driving License', icon: 'car-outline', sides: 2, description: 'Front & Back' },
  { key: 'passport', label: 'Passport', icon: 'book-outline', sides: 1, description: 'Main Page' },
];

const PREVIEW_SIZE = (Dimensions.get('window').width - 80) / 2;

type CapturedImage = { uri: string; base64: string };

const takePicture = async (): Promise<CapturedImage | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.4,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  return { uri: asset.uri, base64: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` };
};

function canProceed(
  step: number,
  selectedDocType: KycDocumentType | null,
  docImages: { front: CapturedImage | null; back: CapturedImage | null },
  docUploading: { front: boolean; back: boolean },
  livenessDone: boolean,
  uploading: boolean,
): boolean {
  if (uploading) return false;
  if (step === 0) return selectedDocType !== null;
  if (step === 1) {
    if (!docImages.front || docUploading.front) return false;
    if (selectedDocType && selectedDocType !== 'passport' && (!docImages.back || docUploading.back)) return false;
    return true;
  }
  if (step === 2) return livenessDone;
  if (step === 3) return true;
  return false;
}

export default function ProviderKycScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [step, setStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [selectedDocType, setSelectedDocType] = useState<KycDocumentType | null>(null);
  const [docImages, setDocImages] = useState<{ front: CapturedImage | null; back: CapturedImage | null }>({ front: null, back: null });
  const [docImageIds, setDocImageIds] = useState<{ front: string | null; back: string | null }>({ front: null, back: null });
  const [docUploading, setDocUploading] = useState<{ front: boolean; back: boolean }>({ front: false, back: false });

  const [livenessImageIds, setLivenessImageIds] = useState<Record<string, string | null>>({
    face_clear: null, move_left: null, move_right: null, smile: null,
  });
  const [currentLivenessStep, setCurrentLivenessStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeTransition = useCallback((next: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      next();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const bootstrap = useCallback(async () => {
    try {
      const status = await kycService.getProviderStatus();
      setKycStatus(status.status);
      if (status.status === 'approved') setStep(5);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void bootstrap(); }, [bootstrap]);

  const uploadDocImage = useCallback(async (side: 'front' | 'back', image: CapturedImage) => {
    setDocUploading((prev) => ({ ...prev, [side]: true }));
    try {
      const result = await kycService.uploadImage({
        imageType: side === 'front' ? 'document_front' : 'document_back',
        data: image.base64,
      });
      setDocImageIds((prev) => ({ ...prev, [side]: result.imageId }));
      return result.imageId;
    } catch (err: unknown) {
      setDocImages((prev) => ({ ...prev, [side]: null }));
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Upload failed (${(err as { response: { status: number } }).response?.status || 'network error'})`
          : 'Failed to upload image. Please try again.';
      throw new Error(message);
    } finally {
      setDocUploading((prev) => ({ ...prev, [side]: false }));
    }
  }, []);

  const handleCaptureDoc = useCallback(async (side: 'front' | 'back') => {
    const picture = await takePicture();
    if (!picture) return;
    setDocImages((prev) => ({ ...prev, [side]: picture }));
    try {
      await uploadDocImage(side, picture);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.');
    }
  }, [uploadDocImage]);

  const captureAndUploadLiveness = useCallback(async () => {
    const picture = await takePicture();
    if (!picture) return;
    const stepKey = LIVENESS_STEPS[currentLivenessStep].key;
    const imageType = LIVENESS_STEPS[currentLivenessStep].imageType;
    try {
      setUploading(true);
      const result = await kycService.uploadImage({ imageType, data: picture.base64 });
      setLivenessImageIds((prev) => ({ ...prev, [stepKey]: result.imageId }));
      if (currentLivenessStep < LIVENESS_STEPS.length - 1) {
        setCurrentLivenessStep((prev) => prev + 1);
      }
    } catch {
      setError('Failed to upload liveness image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [currentLivenessStep]);

  const handleSubmit = useCallback(async () => {
    if (!selectedDocType || !docImageIds.front) { setError('Missing document images.'); return; }
    const livenessAll = LIVENESS_STEPS.every((s) => livenessImageIds[s.key]);
    if (!livenessAll) { setError('Complete all liveness steps.'); return; }
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        documentType: selectedDocType,
        documentImageIds: {
          front: docImageIds.front,
          ...(selectedDocType !== 'passport' && docImageIds.back ? { back: docImageIds.back } : {}),
        },
        livenessImageIds: {
          face_clear: livenessImageIds.face_clear!,
          move_left: livenessImageIds.move_left!,
          move_right: livenessImageIds.move_right!,
          smile: livenessImageIds.smile!,
        },
        countryCode: 'PK',
      };
      if (kycStatus === 'rejected') {
        await kycService.resubmitKyc(payload);
      } else {
        await kycService.submitKyc(payload);
      }
      fadeTransition(() => setStep(4));
    } catch {
      setError('Unable to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedDocType, docImageIds, livenessImageIds, kycStatus, fadeTransition]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={C.primary} /></View>
      </SafeAreaView>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <View style={[styles.iconCircleLg, { backgroundColor: isDark ? '#0A2E1A' : '#E8F8EF' }]}>
            <Ionicons name="shield-checkmark" size={60} color={C.success} />
          </View>
          <Text style={styles.bigTitle}>KYC Approved</Text>
          <Text style={styles.bigSubtitle}>Your identity has been verified. All provider features are unlocked.</Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(provider)/home')}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (step === 0) { router.back(); return; } fadeTransition(() => setStep((prev) => prev - 1)); }}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 0 ? 'Identity Verification' : step === 1 ? 'Capture Document' : step === 2 ? 'Liveness Check' : step === 3 ? 'Review & Submit' : 'Submitted'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(step, 4) / 4 * 100}%` }]} /></View>
        <View style={styles.progressDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i <= Math.min(step, 3) ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 0 && <StepDocSelect C={C} isDark={isDark} selected={selectedDocType} onSelect={setSelectedDocType} status={kycStatus} />}
          {step === 1 && <StepDocCapture C={C} isDark={isDark} selectedDocType={selectedDocType} docImages={docImages} docUploading={docUploading} onCapture={handleCaptureDoc} />}
          {step === 2 && <StepLiveness C={C} isDark={isDark} currentStep={currentLivenessStep} livenessImageIds={livenessImageIds} onCapture={captureAndUploadLiveness} uploading={uploading} />}
          {step === 3 && <StepReview C={C} isDark={isDark} selectedDocType={selectedDocType} docImages={docImages} livenessImageIds={livenessImageIds} />}
          {step === 4 && <StepPending C={C} isDark={isDark} onHome={() => router.push('/(provider)/home')} />}
        </ScrollView>
      </Animated.View>

      {step < 4 && (
        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.continueBtn, !canProceed(step, selectedDocType, docImages, docUploading, LIVENESS_STEPS.every((s) => livenessImageIds[s.key]), submitting) ? styles.continueBtnDisabled : null]}
            disabled={!canProceed(step, selectedDocType, docImages, docUploading, LIVENESS_STEPS.every((s) => livenessImageIds[s.key]), submitting)}
            onPress={() => { if (step === 3) { void handleSubmit(); return; } fadeTransition(() => setStep((prev) => prev + 1)); }}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.continueBtnText}>{step === 3 ? 'Submit KYC' : 'Continue'}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function StepDocSelect({ C, isDark, selected, onSelect, status }: {
  C: AppColors; isDark: boolean; selected: KycDocumentType | null; onSelect: (t: KycDocumentType) => void; status: KycStatus | null;
}) {
  return (
    <View>
      <DocIcon C={C} name="document-text-outline" />
      <Title>Select Document Type</Title>
      <Subtitle C={C}>Choose the ID document you want to use for verification</Subtitle>
      {status === 'rejected' ? (
        <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 20, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#2E1010' : '#FDECEA', alignItems: 'flex-start', marginTop: 16 }}>
          <Ionicons name="close-circle" size={18} color={C.error} />
          <Text style={{ fontSize: 12, lineHeight: 18, color: C.textPrimary, flex: 1 }}>Your previous submission was rejected. Please resubmit with correct documents.</Text>
        </View>
      ) : null}
      <View style={{ gap: 14, marginTop: 24, paddingHorizontal: 16 }}>
        {DOC_OPTIONS.map((opt) => {
          const active = selected === opt.key;
          return (
            <TouchableOpacity key={opt.key} activeOpacity={0.85} onPress={() => onSelect(opt.key)}
              style={{ borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderWidth: active ? 2 : 1, borderColor: active ? C.primary : C.cardBorder }}>
              <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? C.primaryLight : 'transparent' }}>
                <Ionicons name={opt.icon} size={28} color={active ? C.primary : C.textHint} />
              </View>
              <View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: '600', color: active ? C.primary : C.textPrimary }}>{opt.label}</Text></View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.textSecondary, marginRight: 4 }}>{opt.sides === 1 ? '1 photo' : '2 photos'}</Text>
              <Text style={{ fontSize: 11, color: C.textHint }}>{opt.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StepDocCapture({ C, isDark, selectedDocType, docImages, docUploading, onCapture }: {
  C: AppColors; isDark: boolean; selectedDocType: KycDocumentType | null;
  docImages: { front: CapturedImage | null; back: CapturedImage | null };
  docUploading: { front: boolean; back: boolean };
  onCapture: (s: 'front' | 'back') => void;
}) {
  const needsBack = selectedDocType && selectedDocType !== 'passport';
  const renderCard = (side: 'front' | 'back', label: string) => {
    const img = side === 'front' ? docImages.front : docImages.back;
    const isUploading = side === 'front' ? docUploading.front : docUploading.back;
    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{label}</Text>
        {img ? (
          <View>
            <Image source={{ uri: img.uri }} style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE * 0.7, borderRadius: 12, backgroundColor: C.cardBorder }} />
            {isUploading ? (
              <View style={{ position: 'absolute', inset: 0, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.textSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 6, alignSelf: 'center' }} onPress={() => onCapture(side)}>
                <Ionicons name="refresh-outline" size={16} color="white" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>Retake</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity onPress={() => onCapture(side)} activeOpacity={0.8}
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE * 0.7, borderRadius: 12, borderWidth: 2, borderColor: C.cardBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
            <Ionicons name="camera-outline" size={40} color={C.textHint} />
            <Text style={{ marginTop: 8, fontSize: 12, color: C.textHint }}>Tap to capture</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View>
      <DocIcon C={C} name="camera-outline" />
      <Title>Capture Document</Title>
      <Subtitle C={C}>Take clear photos of your {selectedDocType === 'pass' ? 'Pass' : selectedDocType === 'driving_license' ? 'Driving License' : 'Passport'}</Subtitle>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, paddingHorizontal: 20 }}>
        {renderCard('front', 'Front Side')}
        {needsBack ? renderCard('back', 'Back Side') : null}
      </View>
      {needsBack && docImages.front && !docImages.back ? (
        <Text style={{ textAlign: 'center', fontSize: 13, color: C.primary, fontWeight: '600', marginTop: 16 }}>Now capture the back side of your document</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, marginHorizontal: 20, padding: 14, borderRadius: 14, backgroundColor: isDark ? '#1A1A00' : '#FEF3DC' }}>
        <Ionicons name="bulb-outline" size={18} color={C.amber} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>Tips for best results</Text>
          <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18 }}>Place document on a dark, flat surface</Text>
          <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18 }}>Ensure all four corners are visible</Text>
          <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18 }}>Avoid glare and shadows</Text>
        </View>
      </View>
    </View>
  );
}

function StepLiveness({ C, isDark, currentStep, livenessImageIds, onCapture, uploading }: {
  C: AppColors; isDark: boolean; currentStep: number; livenessImageIds: Record<string, string | null>; onCapture: () => void; uploading: boolean;
}) {
  const stepInfo = LIVENESS_STEPS[currentStep];
  const isDone = livenessImageIds[stepInfo.key] !== null;
  return (
    <View>
      <DocIcon C={C} name="scan-outline" />
      <Title>Liveness Check</Title>
      <Subtitle C={C}>We need to verify your identity with a quick face scan</Subtitle>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 24 }}>
        {LIVENESS_STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: livenessImageIds[s.key] ? C.success : i === currentStep ? C.primary : C.cardBorder }}>
              {livenessImageIds[s.key] ? <Ionicons name="checkmark" size={14} color="white" /> : <Text style={{ fontSize: 11, fontWeight: '700', color: i === currentStep ? 'white' : C.textHint }}>{i + 1}</Text>}
            </View>
            {i < LIVENESS_STEPS.length - 1 ? <View style={{ width: 40, height: 2, backgroundColor: livenessImageIds[s.key] ? C.success : C.cardBorder }} /> : null}
          </React.Fragment>
        ))}
      </View>
      <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 16 }}>Step {currentStep + 1} of {LIVENESS_STEPS.length}</Text>
      <View style={{ alignItems: 'center', gap: 16, marginHorizontal: 20, padding: 28, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder }}>
        <Ionicons name={stepInfo.icon} size={48} color={C.primary} />
        <Text style={{ fontSize: 17, fontWeight: '600', color: C.textPrimary, textAlign: 'center', lineHeight: 24 }}>{stepInfo.instruction}</Text>
      </View>
      {isDone ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, marginHorizontal: 20, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0A2E1A' : '#E8F8EF' }}>
          <Ionicons name="checkmark-circle" size={20} color={C.success} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.success }}>Photo captured successfully</Text>
        </View>
      ) : (
        <TouchableOpacity disabled={uploading} onPress={onCapture} activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, marginHorizontal: 40, height: 56, borderRadius: 16, backgroundColor: uploading ? C.textHint : C.primary }}>
          {uploading ? <ActivityIndicator color="white" /> : <Ionicons name="camera" size={24} color="white" />}
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>{uploading ? 'Uploading...' : 'Capture Photo'}</Text>
        </TouchableOpacity>
      )}
      {isDone && currentStep < LIVENESS_STEPS.length - 1 ? (
        <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, height: 48 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>Next Step</Text>
          <Ionicons name="arrow-forward" size={18} color={C.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StepReview({ C, isDark, selectedDocType, docImages, livenessImageIds }: {
  C: AppColors; isDark: boolean; selectedDocType: KycDocumentType | null;
  docImages: { front: CapturedImage | null; back: CapturedImage | null };
  livenessImageIds: Record<string, string | null>;
}) {
  const docLabel = DOC_OPTIONS.find((o) => o.key === selectedDocType)?.label || '';
  return (
    <View>
      <DocIcon C={C} name="checkmark-circle-outline" />
      <Title>Review Your Submission</Title>
      <Subtitle C={C}>Verify all images before submitting</Subtitle>
      <View style={{ marginTop: 20, marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Ionicons name="document-text-outline" size={18} color={C.primary} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>Document: {docLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {docImages.front ? <Image source={{ uri: docImages.front.uri }} style={{ width: 100, height: 72, borderRadius: 10 }} /> : null}
          {docImages.back ? <Image source={{ uri: docImages.back.uri }} style={{ width: 100, height: 72, borderRadius: 10 }} /> : null}
        </View>
      </View>
      <View style={{ marginTop: 16, marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Ionicons name="scan-outline" size={18} color={C.primary} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>Liveness Check</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {LIVENESS_STEPS.map((s) => (
            <View key={s.key} style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 72, height: 56, borderRadius: 8, backgroundColor: C.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                {livenessImageIds[s.key] ? (
                  <Ionicons name="checkmark-circle" size={24} color={C.success} />
                ) : (
                  <Ionicons name="close-circle" size={24} color={C.error} />
                )}
              </View>
              <Text style={{ fontSize: 10, fontWeight: '500', color: C.textSecondary }}>
                {s.key === 'face_clear' ? 'Face' : s.key === 'move_left' ? 'Left' : s.key === 'move_right' ? 'Right' : 'Smile'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function StepPending({ C, isDark, onHome }: { C: AppColors; isDark: boolean; onHome: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40, paddingTop: 40 }}>
      <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: isDark ? '#0A2E1A' : '#E8F8EF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ionicons name="checkmark-circle" size={72} color={C.success} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: C.textPrimary, textAlign: 'center' }}>Submission Received!</Text>
      <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 10 }}>
        Your KYC documents are being reviewed. This typically takes 24 to 48 hours.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card, width: '100%' }}>
        <Ionicons name="time-outline" size={22} color={C.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>What happens next?</Text>
          <Text style={{ fontSize: 12, lineHeight: 18, color: C.textSecondary }}>An admin will review your documents and liveness check. You will be notified once the review is complete.</Text>
        </View>
      </View>
      <TouchableOpacity style={{ marginTop: 32, height: 52, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', width: '100%' }} onPress={onHome}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function DocIcon({ C, name }: { C: AppColors; name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 12, marginBottom: 14 }}>
      <Ionicons name={name} size={36} color={C.primary} />
    </View>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const textColor = (scheme === 'dark' ? Colors.dark : Colors.light).textPrimary;
  return <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', color: textColor }}>{children}</Text>;
}

function Subtitle({ C, children }: { C: AppColors; children: React.ReactNode }) {
  return <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 20 }}>{children}</Text>;
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    iconCircleLg: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    bigTitle: { fontSize: 24, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
    bigSubtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 10 },
    headerRow: { height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
    headerRight: { width: 36 },
    progressWrap: { paddingHorizontal: 20, marginBottom: 8 },
    progressTrack: { height: 4, borderRadius: 2, backgroundColor: C.cardBorder },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: C.primary },
    progressDots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: -8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    dotActive: { backgroundColor: C.primary },
    dotInactive: { backgroundColor: C.cardBorder },
    content: { flex: 1 },
    scrollContent: { paddingBottom: 30 },
    footer: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.divider, backgroundColor: C.background },
    continueBtn: { height: 52, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    continueBtnDisabled: { opacity: 0.5 },
    continueBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    errorText: { textAlign: 'center', color: C.error, fontSize: 13, marginBottom: 8 },
    homeButton: { marginTop: 32, height: 52, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', width: '100%' },
    homeButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  });
