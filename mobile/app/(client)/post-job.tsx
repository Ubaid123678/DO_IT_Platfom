import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

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

export default function PostJobScreen() {
  const { state, dispatch } = useJobCreation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset wizard on mount
    dispatch({ type: 'RESET' });
  }, []);

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

  return <StepComponent />;
}

// Need to import useState
import { useState } from 'react';
import { Text } from 'react-native';