import { useRouter } from 'expo-router';
import React from 'react';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';
import PhysicalRequirementsStep from './PhysicalRequirementsStep';
import DigitalRequirementsStep from './DigitalRequirementsStep';
import ErrandRequirementsStep from './ErrandRequirementsStep';

export default function JobRequirementsStep() {
  const { state } = useJobCreation();

  // Render the appropriate type-specific requirements step
  switch (state.jobType) {
    case 'physical':
      return <PhysicalRequirementsStep />;
    case 'digital':
      return <DigitalRequirementsStep />;
    case 'errand':
      return <ErrandRequirementsStep />;
    default:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Select a job type first</Text>
        </View>
      );
  }
}

import { View, Text } from 'react-native';