import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const TIMEZONES = ['UTC-8', 'UTC-5', 'UTC-4', 'UTC-3', 'UTC', 'UTC+1', 'UTC+3', 'UTC+5', 'UTC+8', 'UTC+9', 'Other'];

export default function JobScheduleStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack } = useJobCreation();
  const router = useRouter();

  const { isFlexible, startsAt, endsAt, timezone, preferredDays, preferredShifts } = state.formData.schedule;
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Select date';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateSelect = (date: Date, field: 'startsAt' | 'endsAt') => {
    const isoString = date.toISOString().split('T')[0];
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'schedule', field, value: isoString });
    setShowDatePicker(null);
  };

  const toggleDay = (day: string) => {
    const next = preferredDays.includes(day)
      ? preferredDays.filter((d) => d !== day)
      : [...preferredDays, day];
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'schedule', field: 'preferredDays', value: next });
  };

  const toggleShift = (shift: string) => {
    const next = preferredShifts.includes(shift)
      ? preferredShifts.filter((s) => s !== shift)
      : [...preferredShifts, shift];
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'schedule', field: 'preferredShifts', value: next });
  };

  const handleTimezoneChange = (tz: string) => {
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'schedule', field: 'timezone', value: tz });
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
            <View style={[styles.progressFill, { width: '62.5%' }]} />
          </View>

          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>When should the work be done? (Optional)</Text>

          <TouchableOpacity style={styles.flexibleToggle} onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'schedule', field: 'isFlexible', value: !isFlexible })}>
            <View style={styles.toggleContent}>
              <Ionicons name={isFlexible ? 'checkmark-circle-outline' : 'ellipse-outline'} size={24} color={isFlexible ? C.primary : C.textHint} />
              <View>
                <Text style={styles.toggleTitle}>Flexible schedule</Text>
                <Text style={styles.toggleSubtitle}>Work can be done anytime within the date range</Text>
              </View>
            </View>
          </TouchableOpacity>

          {!isFlexible && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <TouchableOpacity style={[styles.dateBtn, !startsAt && styles.dateBtnEmpty]} onPress={() => setShowDatePicker('start')}>
                  <Ionicons name="calendar-outline" size={20} color={C.textSecondary} />
                  <Text style={[styles.dateBtnText, !startsAt && styles.dateBtnTextEmpty]}>{formatDate(startsAt)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>End Date</Text>
                <TouchableOpacity style={[styles.dateBtn, !endsAt && styles.dateBtnEmpty]} onPress={() => setShowDatePicker('end')}>
                  <Ionicons name="calendar-outline" size={20} color={C.textSecondary} />
                  <Text style={[styles.dateBtnText, !endsAt && styles.dateBtnTextEmpty]}>{formatDate(endsAt)}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Timezone</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowTimezoneModal(true)}>
              <Ionicons name="globe-outline" size={20} color={C.textSecondary} />
              <Text style={styles.dropdownText}>{timezone}</Text>
              <Ionicons name="chevron-down" size={20} color={C.textHint} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Preferred Days</Text>
            <View style={styles.chipRow}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.chip, preferredDays.includes(day) && styles.chipActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.chipText, preferredDays.includes(day) && styles.chipTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Preferred Shifts</Text>
            <View style={styles.chipRow}>
              {SHIFTS.map((shift) => (
                <TouchableOpacity
                  key={shift}
                  style={[styles.chip, preferredShifts.includes(shift) && styles.chipActive]}
                  onPress={() => toggleShift(shift)}
                >
                  <Text style={[styles.chipText, preferredShifts.includes(shift) && styles.chipTextActive]}>{shift}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
            <Text style={styles.noteText}>Schedule is optional. Providers will see your preferences when applying.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowDatePicker(null)}>
          <View style={styles.modalContent} onTouchStart={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showDatePicker === 'start' ? 'Select Start Date' : 'Select End Date'}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                <Ionicons name="close" size={24} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerPlaceholder}>
                Date picker would be implemented with react-native-date-picker
              </Text>
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowDatePicker(null)}>
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    flexibleToggle: { backgroundColor: C.inputBg, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.inputBorder },
    toggleContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleTitle: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    toggleSubtitle: { fontSize: 12, color: C.textHint },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10 },
    dateBtnEmpty: { borderColor: C.inputBorder },
    dateBtnText: { fontSize: 16, color: C.textPrimary, flex: 1 },
    dateBtnTextEmpty: { color: C.textHint },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10 },
    dropdownText: { fontSize: 16, color: C.textPrimary, flex: 1 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBg },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: C.primaryLight, borderRadius: 10, marginTop: 16 },
    noteText: { fontSize: 12, color: C.textSecondary, flex: 1 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.divider },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    datePickerContainer: { padding: 20, alignItems: 'center' },
    datePickerPlaceholder: { fontSize: 16, color: C.textHint, marginBottom: 20 },
    modalDoneBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: C.primary, borderRadius: 12 },
    modalDoneBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  });