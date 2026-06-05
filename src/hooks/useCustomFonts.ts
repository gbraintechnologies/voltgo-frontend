import { useFonts } from 'expo-font';

/**
 * Loads all custom fonts for the application.
 * Font families included: Nunito, Poppins, HelveticaNeue, and Anton.
 */
export function useCustomFonts() {
  const [fontsLoaded, fontError] = useFonts({
    // --- Nunito ---
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('../assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),

    // --- Poppins ---
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),

    // --- Anton ---
    'Anton-Regular': require('../assets/fonts/Anton-Regular.ttf'),

    // --- HelveticaNeue ---
    'HelveticaNeue-CondensedBold': require('../assets/fonts/HelveticaNeue-CondensedBold.otf'), 
    
    // 'helvetica-compressed': require('../assets/fonts/helvetica-compressed.otf'),
  });

  if (fontError) {
    console.warn('Font load error:', fontError);
  }

  // Prevent app hang on failure by falling back to system fonts
  const loadedOrFailed = fontsLoaded || !!fontError;

  return { fontsLoaded: loadedOrFailed, fontError };
}
