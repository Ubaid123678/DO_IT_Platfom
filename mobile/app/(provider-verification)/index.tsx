import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import CategorySelectionStep from '@/src/components/verification/CategorySelectionStep';
import SkillSelectionStep from '@/src/components/verification/SkillSelectionStep';
import EvidenceTypeChoiceStep from '@/src/components/verification/EvidenceTypeChoiceStep';
import CertificateUploadStep from '@/src/components/verification/CertificateUploadStep';
import PriorWorkPhotosStep from '@/src/components/verification/PriorWorkPhotosStep';
import PortfolioLinkStep from '@/src/components/verification/PortfolioLinkStep';
import OauthIntegrationStep from '@/src/components/verification/OauthIntegrationStep';
import BackgroundCheckStep from '@/src/components/verification/BackgroundCheckStep';
import VehicleDocsStep from '@/src/components/verification/VehicleDocsStep';
import ServiceAreaReferencesStep from '@/src/components/verification/ServiceAreaReferencesStep';
import ProfileCompletionStep from '@/src/components/verification/ProfileCompletionStep';
import StatusHubScreen from '@/src/components/verification/StatusHubScreen';
import RejectionDetailScreen from '@/src/components/verification/RejectionDetailScreen';
import PendingReviewScreen from '@/src/components/verification/PendingReviewScreen';

const stepComponents: Record<string, React.FC> = {
  'category-selection': CategorySelectionStep,
  'skill-selection': SkillSelectionStep,
  'evidence-type-choice': EvidenceTypeChoiceStep,
  'certificate-upload': CertificateUploadStep,
  'prior-work-photos': PriorWorkPhotosStep,
  'portfolio-link': PortfolioLinkStep,
  'oauth-integration': OauthIntegrationStep,
  'background-check': BackgroundCheckStep,
  'vehicle-docs': VehicleDocsStep,
  'service-area-references': ServiceAreaReferencesStep,
  'pending-review': PendingReviewScreen,
  'review-approved': ProfileCompletionStep,
  'resume-bio': ProfileCompletionStep,
  'status-hub': StatusHubScreen,
  'rejection-detail': RejectionDetailScreen,
};

export default function VerificationWizardScreen() {
  const { state, dispatch } = useWizard();
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let attempts = 0;
    const determineStep = async () => {
      try {
        const status = await verificationService.getVerificationStatus();
        // Any pending or rejected record means the provider must see the status
        // screen first (it handles approved/pending/rejected states internally).
        // Checked before the verified branches so a mixed set of records (e.g.
        // some approved, some still pending) doesn't skip the status screen.
        if (status.has_pending || status.has_rejected) {
          dispatch({ type: 'SET_STEP', step: 'pending-review' });
        } else {
          const hasIncompleteCategories = status.categories?.some(
            (c: { status?: string }) => c.status === 'incomplete'
          );
          if (status.overall_status === 'verified' && !hasIncompleteCategories) {
            // All categories verified → profile completion
            dispatch({ type: 'SET_STEP', step: 'review-approved' });
          } else {
            // Not verified, or verified but has incomplete categories
            dispatch({ type: 'SET_STEP', step: 'category-selection' });
          }
        }
        setLoading(false);
      } catch {
        // Network/transient failure — retry while keeping the loader up, rather
        // than dumping a verified provider back on category selection.
        attempts += 1;
        if (attempts <= 5) {
          setTimeout(() => { void determineStep(); }, 1500);
          return;
        }
        // Give up gracefully: start at the beginning.
        dispatch({ type: 'SET_STEP', step: 'category-selection' });
        setLoading(false);
      }
    };
    void determineStep();
  }, [dispatch]);

  // Wait for the status check before rendering so the provider lands directly on
  // the correct screen (status, resume/profile, or categories) — matching the KYC
  // flow. The step components have their own loaders for their data fetches.
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const StepComponent = stepComponents[state.currentStep];
  if (!StepComponent) {
    return <CategorySelectionStep />;
  }
  return <StepComponent />;
}
