import { useEffect, useRef } from "react";
import {
  connectCustomerSocket,
  disconnectSocket,
  getSocket,
  joinOrderRoom,
} from "../utils/socket";
import { useAuthStore } from "../stores/authStore";
import { AppState } from "react-native";

export interface OrderStatusPayload {
  order_id: string;
  status: "rider_arriving" | "collected" | "in_transit" | "delivered";
  rider?: { id: string; full_name: string; phone: string; photo_url: string };
  proof_of_delivery_url?: string;
  timestamp: string;
}

export interface RiderLocationPayload {
  order_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

interface Options {
  orderId: string;
  onStatusChanged?: (payload: OrderStatusPayload) => void;
  onRiderLocation?: (payload: RiderLocationPayload) => void;
}

export function useOrderSocket({
  orderId,
  onStatusChanged,
  onRiderLocation,
}: Options) {
  const customer = useAuthStore((s) => s.customer);

  useEffect(() => {
    if (!customer?.id || !orderId) return;

    const socket = connectCustomerSocket(customer.id);

    // THIS is the fix — join the order room every time this hook mounts
    // with a valid orderId. Without this, status_changed and rider:location
    // events never reach the customer on ANY screen.
    joinOrderRoom(orderId);

    const handleStatus = (payload: OrderStatusPayload) => {
      if (payload.order_id !== orderId) return;
      onStatusChanged?.(payload);
    };

    const handleLocation = (payload: RiderLocationPayload) => {
      if (payload.order_id !== orderId) return;
      onRiderLocation?.(payload);
    };

    socket.on("order:status_changed", handleStatus);
    socket.on("rider:location", handleLocation);

    const handleAppState = (state: string) => {
      if (state === "active" && customer?.id) {
        connectCustomerSocket(customer.id);
        joinOrderRoom(orderId); // re-join on foreground resume
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      socket.off("order:status_changed", handleStatus);
      socket.off("rider:location", handleLocation);
      sub.remove();
    };
  }, [orderId, customer?.id]);
}


