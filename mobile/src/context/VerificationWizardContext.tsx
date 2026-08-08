import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type WizardStep =
  | 'category-selection'
  | 'skill-selection'
  | 'evidence-type-choice'
  | 'certificate-upload'
  | 'prior-work-photos'
  | 'portfolio-link'
  | 'oauth-integration'
  | 'pending-review'
  | 'review-approved'
  | 'resume-bio'
  | 'status-hub'
  | 'rejection-detail';

export interface WizardState {
  currentStep: WizardStep;
  selectedCategories: { category_id: string; name: string; job_type: 'physical' | 'digital' }[];
  selectedSkillItems: { category_id: string; skill_items: { _id: string; name: string; requires_certificate?: boolean }[] }[];
  evidenceTypeMap: Record<string, string>;
  completedEvidence: Record<string, string[]>;
  uploadedCertificates: Record<string, { uri: string; name: string }[]>;
  priorWorkPhotos: Record<string, { uri: string; caption: string }[]>;
  portfolios: Record<string, { url: string; description: string }>;
  currentCategoryIndex: number;
  isPhysicalCategory: boolean;
  isDigitalCategory: boolean;
  resumeBioComplete: boolean;
  wizardComplete: boolean;
  rejectionRecordId: string | null;
  inPersonTestScheduled: Record<string, { date: string; location: string }>;
  oauthConnected: Record<string, boolean>;
  githubUsernames: Record<string, string>;
  skillTestResults: Record<string, { score: number; passed: boolean }>;
  // Resubmission mode
  resubmitMode: boolean;
  resubmitCategoryId: string | null;
  resubmitCategoryInfo: { name: string; job_type: 'physical' | 'digital' } | null;
  resubmitOriginalCategoryIds: string[];
}

type WizardAction =
  | { type: 'GO_BACK' }
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_CATEGORIES'; categories: WizardState['selectedCategories'] }
  | { type: 'SET_SKILL_ITEMS'; items: WizardState['selectedSkillItems'] }
  | { type: 'SET_EVIDENCE_TYPE'; skillItemId: string; evidenceType: string }
  | { type: 'ADD_CERTIFICATE'; skillItemId: string; uri: string; name: string }
  | { type: 'DELETE_CERTIFICATE'; skillItemId: string; index: number }
  | { type: 'ADD_PHOTO'; skillItemId: string; uri: string; caption: string }
  | { type: 'DELETE_PHOTO'; skillItemId: string; index: number }
  | { type: 'SET_PORTFOLIO'; skillItemId: string; url: string; description: string }
  | { type: 'NEXT_CATEGORY' }
  | { type: 'MARK_EVIDENCE_COMPLETE'; categoryId: string; evidenceKey: string }
  | { type: 'COMPLETE_CATEGORY' }
  | { type: 'SET_RESUME_BIO_COMPLETE' }
  | { type: 'SET_CURRENT_CATEGORY_INDEX'; index: number }
  | { type: 'COMPLETE_WIZARD' }
  | { type: 'SET_REJECTION_RECORD'; id: string }
  | { type: 'MARK_OAUTH_CONNECTED'; skillItemId: string }
  | { type: 'SET_GITHUB_USERNAME'; skillItemId: string; username: string }
  | { type: 'SET_SKILL_TEST_RESULT'; skillItemId: string; score: number; passed: boolean }
  | { type: 'SET_IN_PERSON_TEST'; skillItemId: string; date: string; location: string }
  | { type: 'RESET' }
  | { type: 'START_RESUBMIT'; categoryId: string; categoryName?: string; jobType?: 'physical' | 'digital' }
  | { type: 'CLEAR_RESUBMIT' };

const initialState: WizardState = {
  currentStep: 'category-selection',
  selectedCategories: [],
  selectedSkillItems: [],
  evidenceTypeMap: {},
  completedEvidence: {},
  uploadedCertificates: {},
  priorWorkPhotos: {},
  portfolios: {},
  currentCategoryIndex: 0,
  isPhysicalCategory: false,
  isDigitalCategory: false,
  resumeBioComplete: false,
  wizardComplete: false,
  rejectionRecordId: null,
  inPersonTestScheduled: {},
  oauthConnected: {},
  githubUsernames: {},
  skillTestResults: {},
  resubmitMode: false,
  resubmitCategoryId: null,
  resubmitCategoryInfo: null,
  resubmitOriginalCategoryIds: [],
};

const clearEvidenceState = (state: WizardState): WizardState => ({
  ...state,
  evidenceTypeMap: {},
  completedEvidence: {},
  uploadedCertificates: {},
  priorWorkPhotos: {},
  portfolios: {},
  oauthConnected: {},
  githubUsernames: {},
});

export function getEvidenceKey(
  _state: WizardState,
  category: { category_id: string },
): string {
  return category.category_id;
}

export function getCategoryCompletedKeys(
  state: WizardState,
  category: { category_id: string; job_type: 'physical' | 'digital' },
): string[] {
  const key = getEvidenceKey(state, category);
  const completed = new Set<string>(state.completedEvidence[category.category_id] || []);

  if ((state.uploadedCertificates[key] || []).length > 0) completed.add('certificate');

  if (category.job_type === 'physical') {
    if ((state.priorWorkPhotos[key] || []).length >= 3) completed.add('prior_work');
  } else {
    if (state.portfolios[key]?.url) completed.add('portfolio');
    if (state.oauthConnected[key]) completed.add('oauth');
  }

  return Array.from(completed);
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'GO_BACK':
      switch (state.currentStep) {
        case 'skill-selection':
          return { ...state, currentStep: 'category-selection' };
        case 'evidence-type-choice':
          if (state.currentCategoryIndex > 0) {
            return { ...state, currentCategoryIndex: state.currentCategoryIndex - 1, currentStep: 'evidence-type-choice' };
          }
          return clearEvidenceState({ ...state, currentStep: 'skill-selection' });
        case 'certificate-upload':
        case 'prior-work-photos':
        case 'portfolio-link':
        case 'oauth-integration':
          return { ...state, currentStep: 'evidence-type-choice' };
        case 'pending-review':
          // Block navigation back to evidence while verification is under review.
          return state;
        case 'review-approved':
        case 'resume-bio':
          return { ...state, currentStep: 'pending-review' };
        case 'status-hub':
          return { ...state, currentStep: 'resume-bio' };
        case 'rejection-detail':
          return { ...state, currentStep: 'status-hub' };
        default:
          return state;
      }
    case 'SET_CATEGORIES':
      return {
        ...state,
        selectedCategories: action.categories,
        selectedSkillItems: [],
        evidenceTypeMap: {},
        completedEvidence: {},
        uploadedCertificates: {},
        priorWorkPhotos: {},
        portfolios: {},
        oauthConnected: {},
        githubUsernames: {},
        currentCategoryIndex: 0,
        isPhysicalCategory: action.categories.some(c => c.job_type === 'physical'),
        isDigitalCategory: action.categories.some(c => c.job_type === 'digital'),
      };
    case 'SET_SKILL_ITEMS':
      return clearEvidenceState({ ...state, selectedSkillItems: action.items });
    case 'SET_EVIDENCE_TYPE':
      return { ...state, evidenceTypeMap: { ...state.evidenceTypeMap, [action.skillItemId]: action.evidenceType } };
    case 'ADD_CERTIFICATE': {
      const existing = state.uploadedCertificates[action.skillItemId] || [];
      return { ...state, uploadedCertificates: { ...state.uploadedCertificates, [action.skillItemId]: [...existing, { uri: action.uri, name: action.name }] } };
    }
    case 'DELETE_CERTIFICATE': {
      const existing = state.uploadedCertificates[action.skillItemId] || [];
      const updated = existing.filter((_, i) => i !== action.index);
      return { ...state, uploadedCertificates: { ...state.uploadedCertificates, [action.skillItemId]: updated } };
    }
    case 'ADD_PHOTO': {
      const existing = state.priorWorkPhotos[action.skillItemId] || [];
      return { ...state, priorWorkPhotos: { ...state.priorWorkPhotos, [action.skillItemId]: [...existing, { uri: action.uri, caption: action.caption }] } };
    }
    case 'DELETE_PHOTO': {
      const existing = state.priorWorkPhotos[action.skillItemId] || [];
      const updated = existing.filter((_, i) => i !== action.index);
      return { ...state, priorWorkPhotos: { ...state.priorWorkPhotos, [action.skillItemId]: updated } };
    }
    case 'SET_PORTFOLIO':
      return { ...state, portfolios: { ...state.portfolios, [action.skillItemId]: { url: action.url, description: action.description } } };
    case 'NEXT_CATEGORY':
      return { ...state, currentCategoryIndex: state.currentCategoryIndex + 1 };
    case 'MARK_EVIDENCE_COMPLETE': {
      const existing = state.completedEvidence[action.categoryId] || [];
      if (existing.includes(action.evidenceKey)) return state;
      return {
        ...state,
        completedEvidence: {
          ...state.completedEvidence,
          [action.categoryId]: [...existing, action.evidenceKey],
        },
        currentStep: 'evidence-type-choice',
      };
    }
    case 'COMPLETE_CATEGORY': {
      const nextIndex = state.currentCategoryIndex + 1;
      const hasMoreCategories = nextIndex < state.selectedCategories.length;
      return {
        ...state,
        currentCategoryIndex: nextIndex,
        currentStep: hasMoreCategories ? 'evidence-type-choice' : 'pending-review',
      };
    }
    case 'SET_RESUME_BIO_COMPLETE':
      return { ...state, resumeBioComplete: true };
    case 'SET_CURRENT_CATEGORY_INDEX':
      return { ...state, currentCategoryIndex: action.index };
    case 'COMPLETE_WIZARD':
      return { ...state, wizardComplete: true, currentStep: 'status-hub' };
    case 'SET_REJECTION_RECORD':
      return { ...state, rejectionRecordId: action.id, currentStep: 'rejection-detail' };
    case 'MARK_OAUTH_CONNECTED':
      return { ...state, oauthConnected: { ...state.oauthConnected, [action.skillItemId]: true } };
    case 'SET_GITHUB_USERNAME':
      return { ...state, githubUsernames: { ...state.githubUsernames, [action.skillItemId]: action.username } };
    case 'SET_SKILL_TEST_RESULT':
      return { ...state, skillTestResults: { ...state.skillTestResults, [action.skillItemId]: { score: action.score, passed: action.passed } } };
    case 'SET_IN_PERSON_TEST':
      return { ...state, inPersonTestScheduled: { ...state.inPersonTestScheduled, [action.skillItemId]: { date: action.date, location: action.location } } };
    case 'RESET':
      return initialState;
    case 'START_RESUBMIT':
      return {
        ...state,
        resubmitMode: true,
        resubmitCategoryId: action.categoryId,
        resubmitCategoryInfo: action.categoryName
          ? { name: action.categoryName, job_type: action.jobType ?? 'digital' }
          : null,
        currentStep: 'category-selection',
        // Clear evidence state for the resubmit category only
        completedEvidence: Object.fromEntries(
          Object.entries(state.completedEvidence).filter(([catId]) => catId !== action.categoryId),
        ),
      };
    case 'CLEAR_RESUBMIT':
      return {
        ...state,
        resubmitMode: false,
        resubmitCategoryId: null,
        resubmitCategoryInfo: null,
      };
    default:
      return state;
  }
}

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function VerificationWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useState(initialState);

  const reducerDispatch = useCallback((action: WizardAction) => {
    dispatch(prev => wizardReducer(prev, action));
  }, [dispatch]);

  return (
    <WizardContext.Provider value={{ state, dispatch: reducerDispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within VerificationWizardProvider');
  return ctx;
}
