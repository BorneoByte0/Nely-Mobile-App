import { useState } from 'react';

interface SuccessConfig {
  title: string;
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export function useSuccessAnimation() {
  const [successConfig, setSuccessConfig] = useState<SuccessConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showSuccess = (config: SuccessConfig) => {
    setSuccessConfig(config);
    setVisible(true);
  };

  const hideSuccess = () => {
    setVisible(false);
    setTimeout(() => {
      if (successConfig?.onComplete) {
        successConfig.onComplete();
      }
      setSuccessConfig(null);
    }, 100); // Small delay to ensure animation completes
  };

  return {
    successConfig,
    visible,
    showSuccess,
    hideSuccess,
  };
}