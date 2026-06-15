/**
 * LocationContext.tsx
 * ─────────────────────────────────────────────────────────
 * Resolves the device's GPS location once at app startup and
 * makes it available everywhere via useDeviceLocation().
 *
 * Wrap your root navigator (or App.tsx) with <LocationProvider>.
 *
 * Usage anywhere in the app:
 *   const { coords, address, loading, refresh } = useDeviceLocation();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import * as Location from "expo-location";

export interface DeviceLocation {
  coords: { latitude: number; longitude: number } | null;
  /** Human-readable label, e.g. "Adabraka" or "Ring Road Central" */
  address: string;
  loading: boolean;
  /** Call to re-resolve (e.g. after permission is granted later) */
  refresh: () => void;
}

const ACCRA_FALLBACK = { latitude: 5.603717, longitude: -0.186964 };

const LocationContext = createContext<DeviceLocation>({
  coords: null,
  address: "Current Location",
  loading: true,
  refresh: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("Current Location");
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setCoords(ACCRA_FALLBACK);
        setAddress("Current Location");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        setAddress(
          place.name ??
            place.street ??
            place.district ??
            place.subregion ??
            place.city ??
            "Current Location"
        );
      }
    } catch {
      setCoords(ACCRA_FALLBACK);
      setAddress("Current Location");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return (
    <LocationContext.Provider value={{ coords, address, loading, refresh: resolve }}>
      {children}
    </LocationContext.Provider>
  );
}

/** Hook — use anywhere inside <LocationProvider> */
export function useDeviceLocation(): DeviceLocation {
  return useContext(LocationContext);
}



