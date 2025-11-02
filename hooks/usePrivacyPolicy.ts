/**
 * usePrivacyPolicy Hook
 * Custom hook for managing privacy policy acceptance state
 */

import { useState, useEffect, useCallback } from 'react';
import { isPrivacyPolicyAccepted, setPrivacyPolicyAccepted } from '../utils/storageUtils';

interface UsePrivacyPolicyReturn {
  showModal: boolean;
  isAccepted: boolean;
  acceptPolicy: () => void;
  declinePolicy: () => void;
}

/**
 * Hook for managing privacy policy state
 */
export const usePrivacyPolicy = (): UsePrivacyPolicyReturn => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  /**
   * Check privacy policy acceptance on mount
   */
  useEffect(() => {
    const accepted = isPrivacyPolicyAccepted();
    setIsAccepted(accepted);
    setShowModal(!accepted);
  }, []);

  /**
   * Accept privacy policy
   */
  const acceptPolicy = useCallback(() => {
    setPrivacyPolicyAccepted(true);
    setIsAccepted(true);
    setShowModal(false);
  }, []);

  /**
   * Decline privacy policy
   */
  const declinePolicy = useCallback(() => {
    setShowModal(false);
    // Note: User can't use the app without accepting
  }, []);

  return {
    showModal,
    isAccepted,
    acceptPolicy,
    declinePolicy,
  };
};
