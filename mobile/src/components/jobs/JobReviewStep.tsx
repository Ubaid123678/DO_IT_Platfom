import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Alert } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { jobService } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

const JOB_TYPE_LABELS: Record<string, string> = {
  physical: 'Physical Service',
  digital: 'Digital Service',
  errand: 'Errand & Delivery',
};

const BUDGET_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Hourly Rate',
};

const formatBudget = (budget: any) => {
  const amount = parseFloat(budget.amount) / 100;
  if (budget.type === 'hourly') {
    return `$${amount.toFixed(2)}/hr × ${budget.estimatedHours}hrs = $${(amount * parseFloat(budget.estimatedHours)).toFixed(2)}`;
  }
  return `$${amount.toFixed(2)} fixed`;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ur: 'Urdu',
  hi: 'Hindi',
  zh: 'Mandarin',
  de: 'German',
  pt: 'Portuguese',
  other: 'Other',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0-2 years)',
  intermediate: 'Intermediate (2-5 years)',
  expert: 'Expert (5+ years)',
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: 'Solo',
  with_helper: 'With Helper',
  with_team: 'With Team',
};

const TRANSPORT_MODE_LABELS: Record<string, string> = {
  on_foot: 'On Foot',
  bicycle: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
  van: 'Van / Truck',
};

const ENGLISH_LABELS: Record<string, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  fluent: 'Fluent / Native',
};

export default function JobReviewStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goBack, goNext } = useJobCreation();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  const formData = state.formData;
  const jobType = state.jobType;
  const req = formData.requirements;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let locationData: any;
      
      if (jobType === 'digital') {
        locationData = null;
      } else if (jobType === 'errand') {
        locationData = {
          type: 'Point' as const,
          coordinates: formData.location.coordinates || [0, 0] as [number, number],
          address: formData.location.address,
          city: formData.location.city,
          country: formData.location.country,
          formattedAddress: formData.location.formattedAddress,
          pickupLocation: formData.location.pickupLocation ? {
            type: 'Point' as const,
            coordinates: formData.location.pickupLocation.coordinates,
            address: formData.location.pickupLocation.address,
            city: formData.location.pickupLocation.city,
            country: formData.location.pickupLocation.country,
            formattedAddress: formData.location.pickupLocation.formattedAddress,
          } : null,
          deliveryLocation: formData.location.deliveryLocation ? {
            type: 'Point' as const,
            coordinates: formData.location.deliveryLocation.coordinates,
            address: formData.location.deliveryLocation.address,
            city: formData.location.deliveryLocation.city,
            country: formData.location.deliveryLocation.country,
            formattedAddress: formData.location.deliveryLocation.formattedAddress,
          } : null,
        };
      } else {
        locationData = {
          type: 'Point' as const,
          coordinates: formData.location.coordinates || [0, 0] as [number, number],
          address: formData.location.address,
          city: formData.location.city,
          country: formData.location.country,
          formattedAddress: formData.location.formattedAddress,
        };
      }
      
      await jobService.createJob({
        title: formData.title,
        description: formData.description,
        type: jobType!,
        location: locationData,
        budget: {
          type: formData.budget.type,
          amount: Math.round(parseFloat(formData.budget.amount) * 100),
          currency: formData.budget.currency,
          hourlyRate: formData.budget.hourlyRate ? parseFloat(formData.budget.hourlyRate) : undefined,
          estimatedHours: formData.budget.estimatedHours ? parseFloat(formData.budget.estimatedHours) : undefined,
        },
        schedule: {
          startsAt: formData.schedule.startsAt || undefined,
          endsAt: formData.schedule.endsAt || undefined,
          timezone: formData.schedule.timezone,
          isFlexible: formData.schedule.isFlexible,
          preferredDays: formData.schedule.preferredDays,
          preferredShifts: formData.schedule.preferredShifts,
        },
        requirements: {
          categories: formData.requirements.categories,
          skillItems: formData.requirements.skillItems,
          experienceLevel: formData.requirements.experienceLevel || undefined,
          languages: formData.requirements.languages,
          certificationsRequired: formData.requirements.certificationsRequired,
          vehicleRequired: formData.requirements.vehicleRequired,
          
          // Physical-specific
          yearsExperience: formData.requirements.yearsExperience,
          serviceRadiusKm: formData.requirements.serviceRadiusKm,
          toolsEquipment: formData.requirements.toolsEquipment,
          teamSize: formData.requirements.teamSize,
          insurance: formData.requirements.insurance,
          hasTransport: formData.requirements.hasTransport,
          
          // Digital-specific
          techStack: formData.requirements.techStack,
          portfolioUrl: formData.requirements.portfolioUrl,
          githubUsername: formData.requirements.githubUsername,
          timezone: formData.requirements.timezone,
          englishProficiency: formData.requirements.englishProficiency,
          workHistory: formData.requirements.workHistory,
          education: formData.requirements.education,
          
          // Errand-specific
          transportMode: formData.requirements.transportMode,
          baseFee: formData.requirements.baseFee,
          perKmFee: formData.requirements.perKmFee,
          sameDayExpress: formData.requirements.sameDayExpress,
          deliveryCapabilities: formData.requirements.deliveryCapabilities,
          maxPayloadKg: formData.requirements.maxPayloadKg,
          maxPackageSize: formData.requirements.maxPackageSize,
          goodsInsurance: formData.requirements.goodsInsurance,
        },
      });

      dispatch({ type: 'SET_STEP', step: 'complete' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create job';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPhysicalRequirements = () => (
    <>
      {req.yearsExperience && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Years Experience</Text>
          <Text style={styles.reviewValue}>{req.yearsExperience} years</Text>
        </View>
      )}
      {req.serviceRadiusKm && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Service Radius</Text>
          <Text style={styles.reviewValue}>{req.serviceRadiusKm} km</Text>
        </View>
      )}
      {req.toolsEquipment?.length && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Tools & Equipment</Text>
          <Text style={styles.reviewValue}>{req.toolsEquipment.join(', ')}</Text>
        </View>
      )}
      {req.teamSize && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Team Size</Text>
          <Text style={styles.reviewValue}>{TEAM_SIZE_LABELS[req.teamSize]}</Text>
        </View>
      )}
      {req.insurance && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Insurance Required</Text>
          <Text style={styles.reviewValue}>Yes</Text>
        </View>
      )}
      {req.hasTransport?.yes && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Transport</Text>
          <Text style={styles.reviewValue}>{req.hasTransport.mode ? TRANSPORT_MODE_LABELS[req.hasTransport.mode] : 'Required'}</Text>
        </View>
      )}
    </>
  );

  const renderDigitalRequirements = () => (
    <>
      {req.techStack?.length && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Tech Stack</Text>
          <Text style={styles.reviewValue}>{req.techStack.join(', ')}</Text>
        </View>
      )}
      {req.portfolioUrl && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Portfolio</Text>
          <Text style={styles.reviewValue}>{req.portfolioUrl}</Text>
        </View>
      )}
      {req.githubUsername && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>GitHub</Text>
          <Text style={styles.reviewValue}>{req.githubUsername}</Text>
        </View>
      )}
      {req.timezone && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Timezone</Text>
          <Text style={styles.reviewValue}>{req.timezone}</Text>
        </View>
      )}
      {req.englishProficiency && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>English Proficiency</Text>
          <Text style={styles.reviewValue}>{ENGLISH_LABELS[req.englishProficiency]}</Text>
        </View>
      )}
      {req.workHistory?.length && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Work History</Text>
          <Text style={styles.reviewValue}>{req.workHistory.length} entries</Text>
        </View>
      )}
      {req.education?.length && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Education</Text>
          <Text style={styles.reviewValue}>{req.education.length} entries</Text>
        </View>
      )}
    </>
  );

  const renderErrandRequirements = () => (
    <>
      {req.transportMode && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Transport Mode</Text>
          <Text style={styles.reviewValue}>{TRANSPORT_MODE_LABELS[req.transportMode]}</Text>
        </View>
      )}
      {req.baseFee && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Base Fee</Text>
          <Text style={styles.reviewValue}>$${req.baseFee.toFixed(2)}</Text>
        </View>
      )}
      {req.perKmFee && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Per KM Fee</Text>
          <Text style={styles.reviewValue}>$${req.perKmFee.toFixed(2)}</Text>
        </View>
      )}
      {req.sameDayExpress && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Same-Day Express</Text>
          <Text style={styles.reviewValue}>Yes</Text>
        </View>
      )}
      {req.deliveryCapabilities?.length && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Delivery Types</Text>
          <Text style={styles.reviewValue}>{req.deliveryCapabilities.join(', ')}</Text>
        </View>
      )}
      {req.maxPayloadKg && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Max Payload</Text>
          <Text style={styles.reviewValue}>{req.maxPayloadKg} kg</Text>
        </View>
      )}
      {req.maxPackageSize && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Max Package Size</Text>
          <Text style={styles.reviewValue}>{req.maxPackageSize}</Text>
        </View>
      )}
      {req.goodsInsurance && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Goods Insurance</Text>
          <Text style={styles.reviewValue}>Required</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '87.5%' }]} />
        </View>

        <Text style={styles.title}>Review & Post</Text>
        <Text style={styles.subtitle}>Double-check everything before posting</Text>

        {/* Job Type */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="briefcase-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Job Type</Text>
              <Text style={styles.reviewValue}>{JOB_TYPE_LABELS[jobType || '']}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="document-text-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Title</Text>
              <Text style={styles.reviewValue}>{formData.title}</Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={[styles.reviewValue, styles.reviewValueMultiline]}>{formData.description}</Text>
          </View>
        </View>

        {/* Location - only for physical/errand */}
        {jobType !== 'digital' && (
          <View style={styles.reviewSection}>
            {jobType === 'errand' ? (
              <>
                {/* Pickup Location */}
                <View style={styles.reviewRow}>
                  <Ionicons name={"arrow-down-outline" as any} size={20} color={C.primary} />
                  <View>
                    <Text style={styles.reviewLabel}>Pickup Location</Text>
                    <Text style={styles.reviewValue}>
                      {formData.location.pickupLocation?.city}{formData.location.pickupLocation?.country ? `, ${formData.location.pickupLocation.country}` : ''}
                    </Text>
                  </View>
                </View>
                {formData.location.pickupLocation?.address && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Pickup Address</Text>
                    <Text style={styles.reviewValue}>{formData.location.pickupLocation.address}</Text>
                  </View>
                )}
                
                {/* Delivery Location */}
                <View style={styles.reviewRow}>
                  <Ionicons name={"arrow-up-outline" as any} size={20} color={C.primary} />
                  <View>
                    <Text style={styles.reviewLabel}>Delivery Location</Text>
                    <Text style={styles.reviewValue}>
                      {formData.location.deliveryLocation?.city}{formData.location.deliveryLocation?.country ? `, ${formData.location.deliveryLocation.country}` : ''}
                    </Text>
                  </View>
                </View>
                {formData.location.deliveryLocation?.address && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Delivery Address</Text>
                    <Text style={styles.reviewValue}>{formData.location.deliveryLocation.address}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Physical Job Location */}
                <View style={styles.reviewRow}>
                  <Ionicons name="location-outline" size={20} color={C.primary} />
                  <View>
                    <Text style={styles.reviewLabel}>Location</Text>
                    <Text style={styles.reviewValue}>
                      {formData.location.city}{formData.location.country ? `, ${formData.location.country}` : ''}
                    </Text>
                  </View>
                </View>
                {formData.location.address && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Address</Text>
                    <Text style={styles.reviewValue}>{formData.location.address}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Budget */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="cash-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Budget</Text>
              <Text style={styles.reviewValue}>
                {BUDGET_TYPE_LABELS[formData.budget.type]}: {formatBudget(formData.budget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="calendar-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Schedule</Text>
              <Text style={styles.reviewValue}>
                {formData.schedule.isFlexible ? 'Flexible' : 'Fixed dates'}
                {formData.schedule.startsAt && ` • Starts ${new Date(formData.schedule.startsAt).toLocaleDateString()}`}
              </Text>
            </View>
          </View>
          {formData.schedule.preferredDays.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Preferred Days</Text>
              <Text style={styles.reviewValue}>{formData.schedule.preferredDays.join(', ')}</Text>
            </View>
          )}
          {formData.schedule.preferredShifts.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Preferred Shifts</Text>
              <Text style={styles.reviewValue}>{formData.schedule.preferredShifts.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Requirements - Common */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="star-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Categories</Text>
              <Text style={styles.reviewValue}>{formData.requirements.categories.length} selected</Text>
            </View>
          </View>
          {formData.requirements.experienceLevel && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Experience Level</Text>
              <Text style={styles.reviewValue}>
                {EXPERIENCE_LABELS[formData.requirements.experienceLevel]}
              </Text>
            </View>
          )}
          {formData.requirements.languages.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Languages</Text>
              <Text style={styles.reviewValue}>
                {formData.requirements.languages.map((l) => LANGUAGE_NAMES[l] || l).join(', ')}
              </Text>
            </View>
          )}
          {formData.requirements.certificationsRequired && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Certifications Required</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
          {formData.requirements.vehicleRequired && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Vehicle Required</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}

          {/* Type-specific requirements */}
          {jobType === 'physical' && renderPhysicalRequirements()}
          {jobType === 'digital' && renderDigitalRequirements()}
          {jobType === 'errand' && renderErrandRequirements()}
        </View>

        {/* Fee Summary */}
        <View style={styles.feeSummary}>
          <Text style={styles.feeTitle}>Cost Summary</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Job Budget</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform Fee (10%)</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) * 0.1 / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.feeRow, styles.feeTotal]}>
            <Text style={styles.feeLabel}>Total You Pay</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) * 1.1 / 100).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.terms}>
          <Text style={styles.termsText}>
            By posting this job, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Payment Policy</Text>. Funds will be held in escrow until work is completed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} disabled={submitting}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.postBtn, submitting && styles.postBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.postBtnText}>{submitting ? 'Posting...' : 'Post Job'}</Text>
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
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    reviewSection: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
    reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    reviewLabel: { fontSize: 12, color: C.textHint, marginBottom: 2 },
    reviewValue: { fontSize: 14, color: C.textPrimary, flex: 1 },
    reviewValueMultiline: { flex: 1 },
    feeSummary: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.primary },
    feeTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 12 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    feeTotal: { borderTopWidth: 1, borderTopColor: C.primary, marginTop: 4, paddingTop: 10 },
    feeLabel: { fontSize: 14, color: C.textSecondary },
    feeValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    terms: { paddingTop: 16 },
    termsText: { fontSize: 12, color: C.textHint, lineHeight: 18 },
    termsLink: { color: C.primary, fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    postBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    postBtnDisabled: { opacity: 0.5 },
    postBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });