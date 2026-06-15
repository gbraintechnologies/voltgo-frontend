import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'voltgo_biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'voltgo_biometric_credentials';

export const biometricStorage = {
  isEnabled: async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  },
  setEnabled: (enabled: boolean) =>
    AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false'),

  saveCredentials: (phone: string, password: string) =>
    SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify({ phone, password }),
    ),
  getCredentials: async (): Promise<{ phone: string; password: string } | null> => {
    try {
      const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  clearCredentials: () =>
    SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY),
};

/** Returns what biometric type is available, or null if unsupported */
export async function getSupportedBiometricType(): Promise<
  'face' | 'fingerprint' | 'iris' | null
> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return null;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return null;
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
    return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
    return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS))
    return 'iris';
  return null;
}

/** Prompt the biometric challenge. Returns true on success. */
export async function authenticateWithBiometrics(
  promptMessage = 'Confirm your identity',
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use Password',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}