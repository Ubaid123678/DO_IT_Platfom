import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type KycStatus = 'not_started' | 'uploading' | 'pending' | 'approved' | 'rejected';
type UploadTarget = 'front' | 'back' | 'selfie';

const steps = ['Documents', 'Selfie', 'Review'];

const confettiPieces = [
  { top: 8, left: 12, tone: 'primary' },
  { top: 18, left: 28, tone: 'amber' },
  { top: 4, left: 44, tone: 'primary' },
  { top: 22, left: 60, tone: 'amber' },
  { top: 10, left: 78, tone: 'primary' },
  { top: 30, left: 86, tone: 'amber' },
  { top: 58, left: 82, tone: 'primary' },
  { top: 74, left: 68, tone: 'amber' },
  { top: 82, left: 52, tone: 'primary' },
  { top: 74, left: 34, tone: 'amber' },
  { top: 60, left: 16, tone: 'primary' },
  { top: 40, left: 6, tone: 'amber' },
] as const;

const normalizeStatus = (value?: string): KycStatus => {
  if (
    value === 'not_started' ||
    value === 'uploading' ||
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected'
  ) {
    return value;
  }

  return 'not_started';
};

export default function ProviderKycScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kycStatus?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const paramStatus = Array.isArray(params.kycStatus) ? params.kycStatus[0] : params.kycStatus;

  const [kycStatus, setKycStatus] = useState<KycStatus>(() => normalizeStatus(paramStatus));
  const [frontDoc, setFrontDoc] = useState<string | null>(null);
  const [backDoc, setBackDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeUpload, setActiveUpload] = useState<UploadTarget | null>(null);
  const [flowStep, setFlowStep] = useState<1 | 2>(1);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const resolved = normalizeStatus(paramStatus);
    setKycStatus(resolved);
  }, [paramStatus]);

  useEffect(() => {
    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
    }

    return () => {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (kycStatus === 'approved') {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 70,
      }).start();
    }
  }, [kycStatus, scaleAnim]);

  const currentStep = useMemo(() => {
    if (kycStatus === 'pending') {
      return 3;
    }
    return flowStep;
  }, [kycStatus, flowStep]);

  const beginUpload = (target: UploadTarget) => {
    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
    }

    setActiveUpload(target);
    setUploadProgress(0);
    setKycStatus('uploading');

    let progress = 0;
    uploadTimerRef.current = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        if (uploadTimerRef.current) {
          clearInterval(uploadTimerRef.current);
        }

        const sampleImage =
          target === 'selfie'
            ? 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=500&q=60'
            : 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=60';

        if (target === 'front') {
          setFrontDoc(sampleImage);
        }
        if (target === 'back') {
          setBackDoc(sampleImage);
        }
        if (target === 'selfie') {
          setSelfie(sampleImage);
        }

        setActiveUpload(null);
        setUploadProgress(0);
        setKycStatus('not_started');
      }
    }, 120);
  };

  const canContinue = flowStep === 1 ? Boolean(frontDoc && backDoc) : Boolean(selfie);

  const renderUploadZone = (
    label: string,
    target: UploadTarget,
    uri: string | null
  ) => {
    const isUploadingThis = kycStatus === 'uploading' && activeUpload === target;

    return (
      <View style={styles.uploadZone}>
        {uri && !isUploadingThis ? (
          <>
            <Image source={{ uri }} style={styles.uploadedImage} />
            <View style={styles.doneIconWrap}>
              <Ionicons name="checkmark-circle" size={24} color={C.success} />
            </View>
          </>
        ) : isUploadingThis ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{`${uploadProgress}%`}</Text>
          </View>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={32} color={C.primary} />
            <Text style={styles.uploadLabel}>{label}</Text>

            <View style={styles.uploadActionsRow}>
              <TouchableOpacity style={styles.primaryUploadButton} onPress={() => beginUpload(target)}>
                <Text style={styles.primaryUploadButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryUploadButton} onPress={() => beginUpload(target)}>
                <Text style={styles.secondaryUploadButtonText}>Upload File</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identity Verification</Text>
        </View>

        <View style={styles.approvedWrap}>
          <View style={styles.confettiArea}>
            {confettiPieces.map((piece, index) => (
              <View
                key={`${piece.top}-${piece.left}-${index}`}
                style={[
                  styles.confetti,
                  {
                    top: `${piece.top}%`,
                    left: `${piece.left}%`,
                    backgroundColor: piece.tone === 'primary' ? C.primary : C.amber,
                  },
                ]}
              />
            ))}

            <Animated.View style={[styles.approvedIconWrap, { transform: [{ scale: scaleAnim }] }]}>
              <Ionicons name="shield-checkmark" size={48} color="white" />
            </Animated.View>
          </View>

          <Text style={styles.approvedTitle}>KYC Approved!</Text>
          <Text style={styles.approvedSubtitle}>You now have full access to all features.</Text>

          <TouchableOpacity style={styles.fullWidthPrimaryButton} onPress={() => router.push('/(provider)/home')}>
            <Text style={styles.fullWidthPrimaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(kycStatus === 'not_started' || kycStatus === 'uploading' || kycStatus === 'pending') && (
          <View style={styles.stepperWrap}>
            <View style={styles.stepperRow}>
              {steps.map((_, index) => {
                const step = index + 1;
                const completed = step < currentStep;
                const active = step === currentStep;

                return (
                  <React.Fragment key={step}>
                    <View
                      style={[
                        styles.stepCircle,
                        completed || active ? styles.stepCircleFilled : styles.stepCirclePending,
                      ]}
                    >
                      {completed ? (
                        <Ionicons name="checkmark" size={14} color="white" />
                      ) : (
                        <Text
                          style={[
                            styles.stepText,
                            completed || active ? styles.stepTextFilled : styles.stepTextPending,
                          ]}
                        >
                          {step}
                        </Text>
                      )}
                    </View>

                    {index < steps.length - 1 ? (
                      <View
                        style={[
                          styles.stepLine,
                          step < currentStep ? styles.stepLineCompleted : styles.stepLinePending,
                        ]}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.stepLabelsRow}>
              {steps.map((label) => (
                <Text key={label} style={styles.stepLabelText}>
                  {label}
                </Text>
              ))}
            </View>
          </View>
        )}

        {(kycStatus === 'not_started' || kycStatus === 'uploading') && (
          <View style={styles.docCard}>
            <Ionicons name="id-card-outline" size={48} color={C.primary} />
            <Text style={styles.docTitle}>Upload ID Document</Text>
            <Text style={styles.docSubtitle}>Government-issued photo ID</Text>

            <View style={styles.requirementsWrap}>
              {[
                'Original, valid government-issued ID',
                'Clear photo with all corners visible',
                'No glare, blur, or obstructions',
              ].map((item) => (
                <View key={item} style={styles.requirementRow}>
                  <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                  <Text style={styles.requirementText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.uploadZonesWrap}>
              {flowStep === 1 ? (
                <>
                  {renderUploadZone('Front Side', 'front', frontDoc)}
                  {renderUploadZone('Back Side', 'back', backDoc)}
                </>
              ) : (
                renderUploadZone('Selfie Verification', 'selfie', selfie)
              )}
            </View>

            <TouchableOpacity
              style={[styles.fullWidthPrimaryButton, !canContinue ? styles.disabledButton : null]}
              disabled={!canContinue}
              onPress={() => {
                if (flowStep === 1) {
                  setFlowStep(2);
                  return;
                }

                setKycStatus('pending');
              }}
            >
              <Text style={styles.fullWidthPrimaryButtonText}>
                {flowStep === 1 ? 'Continue to Selfie' : 'Submit for Review'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {kycStatus === 'pending' && (
          <>
            <View style={styles.pendingBanner}>
              <Ionicons name="time" size={24} color={C.amber} />

              <View style={styles.pendingTextWrap}>
                <Text style={styles.pendingTitle}>Under Review</Text>
                <Text style={styles.pendingSubtitle}>We'll review within 24-48 hours</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.outlineButton} onPress={() => router.push('/(provider)/home')}>
              <Text style={styles.outlineButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </>
        )}

        {kycStatus === 'rejected' && (
          <>
            <View
              style={[
                styles.rejectedBanner,
                { backgroundColor: isDark ? '#2E1010' : '#FDECEA', borderColor: C.error },
              ]}
            >
              <Ionicons name="close-circle" size={24} color={C.error} />

              <View style={styles.pendingTextWrap}>
                <Text style={styles.rejectedTitle}>Verification Failed</Text>
                <Text style={styles.pendingSubtitle}>Photo was blurry. Please retake all images clearly.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.fullWidthPrimaryButton}
              onPress={() => {
                setFrontDoc(null);
                setBackDoc(null);
                setSelfie(null);
                setFlowStep(1);
                setKycStatus('not_started');
              }}
            >
              <Text style={styles.fullWidthPrimaryButtonText}>Resubmit Documents</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      height: 48,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    stepperWrap: {
      marginVertical: 20,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleFilled: {
      backgroundColor: C.primary,
    },
    stepCirclePending: {
      borderWidth: 2,
      borderColor: C.cardBorder,
      backgroundColor: C.background,
    },
    stepText: {
      fontSize: 13,
      fontWeight: '700',
    },
    stepTextFilled: {
      color: 'white',
    },
    stepTextPending: {
      color: C.textHint,
    },
    stepLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 8,
      borderRadius: 2,
      maxWidth: 86,
    },
    stepLineCompleted: {
      backgroundColor: C.primary,
    },
    stepLinePending: {
      backgroundColor: C.cardBorder,
    },
    stepLabelsRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    stepLabelText: {
      width: '33.33%',
      textAlign: 'center',
      fontSize: 11,
      color: C.textHint,
      fontWeight: '500',
    },
    docCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      alignItems: 'center',
    },
    docTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    docSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: C.textSecondary,
      textAlign: 'center',
    },
    requirementsWrap: {
      marginTop: 12,
      width: '100%',
      gap: 8,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementText: {
      fontSize: 13,
      color: C.textSecondary,
      flex: 1,
    },
    uploadZonesWrap: {
      marginTop: 20,
      width: '100%',
      gap: 12,
    },
    uploadZone: {
      height: 110,
      borderRadius: 12,
      borderStyle: 'dashed',
      borderWidth: 2,
      borderColor: C.primary,
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      paddingHorizontal: 10,
    },
    uploadedImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    doneIconWrap: {
      position: 'absolute',
      right: 8,
      top: 8,
      backgroundColor: C.card,
      borderRadius: 12,
    },
    uploadLabel: {
      marginTop: 4,
      fontSize: 13,
      color: C.primary,
      fontWeight: '500',
    },
    uploadActionsRow: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 10,
    },
    primaryUploadButton: {
      height: 36,
      borderRadius: 8,
      paddingHorizontal: 16,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryUploadButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    secondaryUploadButton: {
      height: 36,
      borderRadius: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryUploadButtonText: {
      color: C.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    progressWrap: {
      width: '100%',
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    progressTrack: {
      width: '100%',
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
    progressText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: C.primary,
    },
    fullWidthPrimaryButton: {
      marginTop: 24,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    fullWidthPrimaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    pendingBanner: {
      marginTop: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.amber,
      backgroundColor: C.amberLight,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pendingTextWrap: {
      flex: 1,
    },
    pendingTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
    },
    pendingSubtitle: {
      marginTop: 2,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 18,
    },
    outlineButton: {
      marginTop: 20,
      width: '100%',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineButtonText: {
      color: C.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    approvedWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    confettiArea: {
      width: 220,
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    approvedIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: '#27AE60',
      alignItems: 'center',
      justifyContent: 'center',
    },
    confetti: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    approvedTitle: {
      marginTop: 24,
      fontSize: 26,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    approvedSubtitle: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    rejectedBanner: {
      marginTop: 20,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rejectedTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.error,
    },
  });
