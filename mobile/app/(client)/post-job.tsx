import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, BackHandler, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useJobCreation } from '@/src/context/JobCreationContext';
import { jobService } from '@/src/services/jobService';
import JobTypeStep from '@/src/components/jobs/JobTypeStep';
import JobDetailsStep from '@/src/components/jobs/JobDetailsStep';
import JobLocationStep from '@/src/components/jobs/JobLocationStep';
import JobBudgetStep from '@/src/components/jobs/JobBudgetStep';
import JobScheduleStep from '@/src/components/jobs/JobScheduleStep';
import JobRequirementsStep from '@/src/components/jobs/JobRequirementsStep';
import JobReviewStep from '@/src/components/jobs/JobReviewStep';

const stepComponents: Record<string, React.FC> = {
  'job-type': JobTypeStep,
  'details': JobDetailsStep,
  'location': JobLocationStep,
  'budget': JobBudgetStep,
  'schedule': JobScheduleStep,
  'requirements': JobRequirementsStep,
  'review': JobReviewStep,
};

const FIRST_STEP = 'job-type';

// Digital jobs don't need location step
const getStepOrder = (jobType: string | null): string[] => {
  if (jobType === 'digital') {
    return ['job-type', 'details', 'budget', 'schedule', 'requirements', 'review', 'complete'];
  }
  return ['job-type', 'details', 'location', 'budget', 'schedule', 'requirements', 'review', 'complete'];
};

export default function PostJobScreen() {
  const { state, dispatch, goBack } = useJobCreation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const stepOrder = useMemo(() => getStepOrder(state.jobType), [state.jobType]);
  const currentIndex = stepOrder.indexOf(state.currentStep);

  useFocusEffect(
    useCallback(() => {
      // The client tab stays mounted, so mount/unmount reset is not enough.
      // Always start a fresh wizard whenever this tab is opened.
      dispatch({ type: 'RESET' });
    }, [dispatch]),
  );

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.currentStep !== FIRST_STEP) {
        goBack();
        return true; // Prevent default back behavior
      }
      // The post-job tab is kept in the tab navigator; replace explicitly
      // so back never reveals a previous wizard step.
      router.replace('/(client)/home');
      return true;
    });

    return () => backHandler.remove();
  }, [state.currentStep, goBack]);

  useEffect(() => {
    if (state.jobType === 'digital' && state.currentStep === 'location') {
      dispatch({ type: 'SET_STEP', step: 'budget' });
    }
  }, [dispatch, state.currentStep, state.jobType]);

  const StepComponent = stepComponents[state.currentStep];
  if (!StepComponent) {
    return <JobTypeStep />;
  }

  if (state.currentStep === 'complete') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Creating your job...</Text>
      </View>
    );
  }

  // If somehow on location step for digital, render the next valid step
  if (state.jobType === 'digital' && state.currentStep === 'location') {
    return <JobBudgetStep />;
  }

  return <StepComponent />;
}

import { useState } from 'react';
import { Text } from 'react-native';