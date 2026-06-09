// ─────────────────────────────────────────────
//  Root Stack
// ─────────────────────────────────────────────
export type RootStackParamList = {
  // Onboarding
  Splash: undefined;
  Onboarding: undefined;
  PhoneAuth: undefined;
  OTPVerification: { phone?: string };
  CreateProfile: undefined;
  BiometricSetup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { phone: string };
  // Main
  MainTabs: undefined;
  // Modal flows (presented over tabs)
  DeliveryFlow: undefined;
  BundlesFlow: undefined;
};

// ─────────────────────────────────────────────
//  Bottom Tab Navigator
// ─────────────────────────────────────────────
export type MainTabParamList = {
  HomeMap: undefined;
  Activities: undefined;
  Account: undefined;
};

// ─────────────────────────────────────────────
//  Delivery / Tracking Flow Stack
// ─────────────────────────────────────────────
export type DeliveryStackParamList = {
  ChooseRoute: { scheduledTime?: string } | undefined;
  SchedulePickup: undefined;
  DeliveryDetails: {
    pickup: string;
    dropoff: string;
    pickupCoords?: { latitude: number; longitude: number };
    dropoffCoords?: { latitude: number; longitude: number };
    isScheduled?: boolean;
    scheduledTime?: string;
  };

  SelectVehicle: {
    pickup: string;
    dropoff: string;
    pickupCoords?: { latitude: number; longitude: number };
    dropoffCoords?: { latitude: number; longitude: number };
    itemType: string;
    weight: string;
    specialInstructions?: string;
    isScheduled?: boolean;
    scheduledTime?: string;
  };
  ReviewDelivery: {
    senderName?: string;
    pickup: string;
    dropoff: string;
    itemType: string;
    weight: "lightweight" | "standard" | "heavy";
    specialInstructions?: string;
    vehicleType: "bicycle" | "e-motorcycle";
    price: number;
    scheduledTime?: string;
    scheduledDate?: string;
    paymentMethod?: string;
    isScheduled?: boolean;
  };
  PayWith: {
    vehicleType: "bicycle" | "e-motorcycle";
    price: number;
    pickup: string;
    dropoff: string;
  };
  AddPaymentMethod: undefined;
  // Tracking
  RiderMatching: {
    pickup?: string;
    dropoff?: string;
    itemType?: string;
    orderId: string;
    weight?: "lightweight" | "standard" | "heavy";
    vehicleType?: "bicycle" | "e-motorcycle";
    specialInstructions?: string;
    paymentMethod?: string;
    pickupCoords?: { latitude: number; longitude: number };
    dropoffCoords?: { latitude: number; longitude: number };
  };
  RiderFound: {
    riderName?: string;
    riderPlate?: string;
    riderRating?: number;
    vehicleType?: "bicycle" | "e-motorcycle";
    itemType?: string;
    weight?: "lightweight" | "standard" | "heavy";
    specialInstructions?: string;
    paymentMethod?: string;
    pickup?: string;
    dropoff?: string;
  };
  RiderArriving: {
    riderName?: string;
    riderPlate?: string;
    riderRating?: number;
    vehicleType?: "bicycle" | "e-motorcycle";
    pickup?: string;
    dropoff?: string;
  };
  ActiveDelivery: {
    riderName?: string;
    riderRating?: number;
    vehicleType?: "bicycle" | "e-motorcycle";
    itemType?: string;
    weight?: "lightweight" | "standard" | "heavy";
    pickup?: string;
    etaMinutes?: number;
    dropoff?: string;

    riderPlate?: string;
    specialInstructions?: string;
    paymentMethod?: string;
  };
  DeliveryComplete: {
    riderName?: string;
    riderRating?: number;
    itemType?: string;
    isScheduled?: boolean;
    scheduledTime?: string;
  };
  AddMobileMoney: undefined;
  AddCard: undefined;
};

// ─────────────────────────────────────────────
//  Bundles / Credits Flow Stack
// ─────────────────────────────────────────────
export type BundlesStackParamList = {
  BundlesCredits: undefined;
  Topup: undefined;
  Renew: undefined;
  BundlePayment: undefined;
  BundleSuccess: undefined;
  BundleHistory: undefined;
};
