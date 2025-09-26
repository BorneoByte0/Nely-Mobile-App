import { useState } from 'react';
import { ModernAlertButton } from '../components/ModernAlert';

interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons: ModernAlertButton[];
}

export function useModernAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setAlertConfig(null), 200); // Wait for animation to complete
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => {
            hideAlert();
            onConfirm?.();
          },
        },
      ],
    });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'destructive',
          onPress: () => {
            hideAlert();
            onConfirm?.();
          },
        },
      ],
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => {
            hideAlert();
            onConfirm?.();
          },
        },
      ],
    });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'primary',
          onPress: () => {
            hideAlert();
            onConfirm?.();
          },
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => {
            hideAlert();
            onCancel?.();
          },
        },
        {
          text: confirmText,
          style: 'primary',
          onPress: () => {
            hideAlert();
            onConfirm();
          },
        },
      ],
    });
  };

  return {
    alertConfig,
    visible,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}