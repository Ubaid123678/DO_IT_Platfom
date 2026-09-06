import { createContext, useContext, useReducer, ReactNode } from 'react';

export type JobCreationStep =
  | 'job-type'
  | 'details'
  | 'location'
  | 'budget'
  | 'schedule'
  | 'requirements'
  | 'review'
  | 'complete';

export interface JobCreationState {
  currentStep: JobCreationStep;
  jobType: 'physical' | 'digital' | 'errand' | null;
  formData: {
    title: string;
    description: string;
    location: {
      coordinates: [number, number] | null;
      address: string;
      city: string;
      country: string;
      formattedAddress: string;
    };
    budget: {
      type: 'fixed' | 'hourly';
      amount: string;
      currency: string;
      hourlyRate: string;
      estimatedHours: string;
    };
    schedule: {
      startsAt: string;
      endsAt: string;
      timezone: string;
      isFlexible: boolean;
      preferredDays: string[];
      preferredShifts: string[];
    };
    requirements: {
      categories: string[];
      skillItems: string[];
      experienceLevel: 'entry' | 'intermediate' | 'expert' | '';
      languages: string[];
      certificationsRequired: boolean;
      vehicleRequired: boolean;
    };
  } & Record<string, any>;
  selectedCategories: Array<{ id: string; name: string; job_type: string }>;
  selectedSkillItems: Array<{ id: string; name: string }>;
}

export interface JobCreationContextType {
  state: JobCreationState;
  dispatch: React.Dispatch<JobCreationAction>;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: JobCreationStep) => void;
  canGoNext: () => boolean;
}

type JobCreationAction =
  | { type: 'SET_STEP'; step: JobCreationStep }
  | { type: 'SET_JOB_TYPE'; jobType: 'physical' | 'digital' | 'errand' }
  | { type: 'UPDATE_FORM'; field: keyof JobCreationState['formData']; value: any }
  | { type: 'UPDATE_NESTED_FORM'; section: keyof JobCreationState['formData']; field: string; value: any }
  | { type: 'SET_CATEGORIES'; categories: JobCreationState['selectedCategories'] }
  | { type: 'SET_SKILL_ITEMS'; skillItems: JobCreationState['selectedSkillItems'] }
  | { type: 'RESET' };

const initialState: JobCreationState = {
  currentStep: 'job-type',
  jobType: null,
  formData: {
    title: '',
    description: '',
    location: {
      coordinates: null,
      address: '',
      city: '',
      country: '',
      formattedAddress: '',
    },
    budget: {
      type: 'fixed',
      amount: '',
      currency: 'USD',
      hourlyRate: '',
      estimatedHours: '',
    },
    schedule: {
      startsAt: '',
      endsAt: '',
      timezone: 'UTC',
      isFlexible: true,
      preferredDays: [],
      preferredShifts: [],
    },
    requirements: {
      categories: [],
      skillItems: [],
      experienceLevel: '',
      languages: [],
      certificationsRequired: false,
      vehicleRequired: false,
    },
  },
  selectedCategories: [],
  selectedSkillItems: [],
};

const stepOrder: JobCreationStep[] = [
  'job-type',
  'details',
  'location',
  'budget',
  'schedule',
  'requirements',
  'review',
  'complete',
];

const jobCreationReducer = (state: JobCreationState, action: JobCreationAction): JobCreationState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_JOB_TYPE':
      return { ...state, jobType: action.jobType };
    case 'UPDATE_FORM':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'UPDATE_NESTED_FORM':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.section]: { ...state.formData[action.section], [action.field]: action.value },
        },
      };
    case 'SET_CATEGORIES':
      return { ...state, selectedCategories: action.categories };
    case 'SET_SKILL_ITEMS':
      return { ...state, selectedSkillItems: action.skillItems };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const JobCreationContext = createContext<JobCreationContextType | null>(null);

export const JobCreationProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(jobCreationReducer, initialState);

  const currentIndex = stepOrder.indexOf(state.currentStep);

  const goNext = () => {
    if (currentIndex < stepOrder.length - 1) {
      dispatch({ type: 'SET_STEP', step: stepOrder[currentIndex + 1] });
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      dispatch({ type: 'SET_STEP', step: stepOrder[currentIndex - 1] });
    }
  };

  const goToStep = (step: JobCreationStep) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const canGoNext = () => {
    switch (state.currentStep) {
      case 'job-type':
        return !!state.jobType;
      case 'details':
        return state.formData.title.trim().length >= 5 && state.formData.description.trim().length >= 20;
      case 'location':
        return state.formData.location.city.trim().length > 0;
      case 'budget':
        if (state.formData.budget.type === 'hourly') {
          return (
            parseFloat(state.formData.budget.amount) > 0 &&
            parseFloat(state.formData.budget.hourlyRate) > 0 &&
            parseFloat(state.formData.budget.estimatedHours) > 0
          );
        }
        return parseFloat(state.formData.budget.amount) > 0;
      case 'schedule':
        return true; // Optional
      case 'requirements':
        return state.formData.requirements.categories.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <JobCreationContext.Provider
      value={{
        state,
        dispatch,
        goNext,
        goBack,
        goToStep,
        canGoNext,
      }}
    >
      {children}
    </JobCreationContext.Provider>
  );
};

export const useJobCreation = () => {
  const context = useContext(JobCreationContext);
  if (!context) throw new Error('useJobCreation must be used within JobCreationProvider');
  return context;
};