import { useState, useEffect, useCallback } from 'react';
import {
  biometricStorage,
  getSupportedBiometricType,
  authenticateWithBiometrics,
} from '../utils/biometrics';

export function useBiometrics() {
  const [biometricType, setBiometricType] = useState<
    'face' | 'fingerprint' | 'iris' | null
  >(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [type, enabled] = await Promise.all([
        getSupportedBiometricType(),
        biometricStorage.isEnabled(),
      ]);
      setBiometricType(type);
      setIsEnabled(enabled);
      setIsReady(true);
    })();
  }, []);

  const enable = useCallback(async (phone: string, password: string) => {
    const success = await authenticateWithBiometrics(
      'Verify your identity to enable biometrics',
    );
    if (!success) return false;
    await biometricStorage.saveCredentials(phone, password);
    await biometricStorage.setEnabled(true);
    setIsEnabled(true);
    return true;
  }, []);

  const disable = useCallback(async () => {
    await biometricStorage.setEnabled(false);
    await biometricStorage.clearCredentials();
    setIsEnabled(false);
  }, []);

  const prompt = useCallback(async () => {
    return authenticateWithBiometrics('Sign in to VoltGo');
  }, []);

  /** Human-readable label e.g. "Face ID", "Fingerprint" */
  const label =
    biometricType === 'face'
      ? 'Face ID'
      : biometricType === 'fingerprint'
        ? 'Fingerprint'
        : biometricType === 'iris'
          ? 'Iris Scan'
          : 'Biometrics';

  return { biometricType, isEnabled, isReady, label, enable, disable, prompt };
}