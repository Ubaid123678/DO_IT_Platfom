import React from 'react';

import { useWizard } from '@/src/context/VerificationWizardContext';
import CategorySelectionStep from '@/src/components/verification/CategorySelectionStep';
import SkillSelectionStep from '@/src/components/verification/SkillSelectionStep';
import EvidenceTypeChoiceStep from '@/src/components/verification/EvidenceTypeChoiceStep';
import CertificateUploadStep from '@/src/components/verification/CertificateUploadStep';
import PriorWorkPhotosStep from '@/src/components/verification/PriorWorkPhotosStep';
import PortfolioLinkStep from '@/src/components/verification/PortfolioLinkStep';
import OauthIntegrationStep from '@/src/components/verification/OauthIntegrationStep';
import SkillTestStep from '@/src/components/verification/SkillTestStep';
import ResumeBioStep from '@/src/components/verification/ResumeBioStep';
import StatusHubScreen from '@/src/components/verification/StatusHubScreen';
import RejectionDetailScreen from '@/src/components/verification/RejectionDetailScreen';

const stepComponents: Record<string, React.FC> = {
  'category-selection': CategorySelectionStep,
  'skill-selection': SkillSelectionStep,
  'evidence-type-choice': EvidenceTypeChoiceStep,
  'certificate-upload': CertificateUploadStep,
  'prior-work-photos': PriorWorkPhotosStep,
  'portfolio-link': PortfolioLinkStep,
  'oauth-integration': OauthIntegrationStep,
  'skill-test': SkillTestStep,
  'resume-bio': ResumeBioStep,
  'status-hub': StatusHubScreen,
  'rejection-detail': RejectionDetailScreen,
};

export default function VerificationWizardScreen() {
  const { state } = useWizard();
  const StepComponent = stepComponents[state.currentStep];

  if (!StepComponent) {
    return <CategorySelectionStep />;
  }

  return <StepComponent />;
}
