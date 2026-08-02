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
import ResumeBioStep from '@/src/components/verification/ResumeBioStep';
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
  'pending-review': PendingReviewScreen,
  'review-approved': ResumeBioStep,
  'resume-bio': ResumeBioStep,
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

    const determineStep = async () => {
      try {
        const status = await verificationService.getVerificationStatus();
        if (status.overall_status === 'verified' || status.overall_status === 'partially_verified') {
          const profile = await verificationService.getProfile().catch(() => null);
          const profileComplete = profile?.headline || profile?.bio;
          if (!profileComplete) {
            dispatch({ type: 'SET_STEP', step: 'review-approved' });
          } else {
            await verificationService.markVerificationComplete();
            dispatch({ type: 'COMPLETE_WIZARD' });
          }
          return;
        }
        // If any records exist (pending or rejected) the provider must not redo the
        // category process — show the status screen, which handles both states.
        if (status.has_pending || status.has_rejected) {
          dispatch({ type: 'SET_STEP', step: 'pending-review' });
        }
      } catch {
        // Start from beginning if error
      } finally {
        setLoading(false);
      }
    };
    void determineStep();
  }, [dispatch]);

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
