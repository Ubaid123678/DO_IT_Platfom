import { useAuthContext } from '@/src/context/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
