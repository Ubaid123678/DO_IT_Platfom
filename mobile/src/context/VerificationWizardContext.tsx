import React, { createContext, useContext, useState, ReactNode } from 'react';

export type WizardStep =
  | 'category-selection'
  | 'skill-selection'
  | 'evidence-type-choice'
  | 'certificate-upload'
  | 'prior-work-photos'
  | 'portfolio-link'
  | 'oauth-integration'
  | 'resume-bio'
  | 'status-hub'
  | 'rejection-detail';

export interface WizardState {
  currentStep: WizardStep;
  selectedCategories: { category_id: string; name: string; job_type: 'physical' | 'digital' }[];
  selectedSkillItems: { category_id: string; skill_items: { _id: string; name: string; requires_certificate?: boolean }[] }[];
  evidenceTypeMap: Record<string, string>;
  completedEvidence: Record<string, string[]>;  // category_id -> ['certificate', 'prior_work']
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
  skillTestResults: Record<string, { score: number; passed: boolean }>;
}

type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_CATEGORIES'; categories: WizardState['selectedCategories'] }
  | { type: 'SET_SKILL_ITEMS'; items: WizardState['selectedSkillItems'] }
  | { type: 'SET_EVIDENCE_TYPE'; skillItemId: string; evidenceType: string }
  | { type: 'ADD_CERTIFICATE'; skillItemId: string; uri: string; name: string }
  | { type: 'ADD_PHOTO'; skillItemId: string; uri: string; caption: string }
  | { type: 'SET_PORTFOLIO'; skillItemId: string; url: string; description: string }
  | { type: 'NEXT_CATEGORY' }
  | { type: 'MARK_EVIDENCE_COMPLETE'; categoryId: string; evidenceKey: string }
  | { type: 'COMPLETE_CATEGORY' }
  | { type: 'SET_RESUME_BIO_COMPLETE' }
  | { type: 'SET_CURRENT_CATEGORY_INDEX'; index: number }
  | { type: 'COMPLETE_WIZARD' }
  | { type: 'SET_REJECTION_RECORD'; id: string }
  | { type: 'MARK_OAUTH_CONNECTED'; skillItemId: string }
  | { type: 'SET_SKILL_TEST_RESULT'; skillItemId: string; score: number; passed: boolean }
  | { type: 'SET_IN_PERSON_TEST'; skillItemId: string; date: string; location: string }
  | { type: 'RESET' };

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
  skillTestResults: {},
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_CATEGORIES':
      return {
        ...state,
        selectedCategories: action.categories,
        currentCategoryIndex: 0,
        completedEvidence: {},
        isPhysicalCategory: action.categories.some(c => c.job_type === 'physical'),
        isDigitalCategory: action.categories.some(c => c.job_type === 'digital'),
      };
    case 'SET_SKILL_ITEMS':
      return { ...state, selectedSkillItems: action.items };
    case 'SET_EVIDENCE_TYPE':
      return { ...state, evidenceTypeMap: { ...state.evidenceTypeMap, [action.skillItemId]: action.evidenceType } };
    case 'ADD_CERTIFICATE': {
      const existing = state.uploadedCertificates[action.skillItemId] || [];
      return { ...state, uploadedCertificates: { ...state.uploadedCertificates, [action.skillItemId]: [...existing, { uri: action.uri, name: action.name }] } };
    }
    case 'ADD_PHOTO': {
      const existing = state.priorWorkPhotos[action.skillItemId] || [];
      return { ...state, priorWorkPhotos: { ...state.priorWorkPhotos, [action.skillItemId]: [...existing, { uri: action.uri, caption: action.caption }] } };
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
        currentStep: hasMoreCategories ? 'evidence-type-choice' : 'resume-bio',
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
    case 'SET_SKILL_TEST_RESULT':
      return { ...state, skillTestResults: { ...state.skillTestResults, [action.skillItemId]: { score: action.score, passed: action.passed } } };
    case 'SET_IN_PERSON_TEST':
      return { ...state, inPersonTestScheduled: { ...state.inPersonTestScheduled, [action.skillItemId]: { date: action.date, location: action.location } } };
    case 'RESET':
      return initialState;
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

  const reducerDispatch = (action: WizardAction) => {
    dispatch(prev => wizardReducer(prev, action));
  };

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
