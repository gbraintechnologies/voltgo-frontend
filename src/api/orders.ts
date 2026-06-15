import { api } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "searching"
  | "assigned"
  | "rider_arriving"
  | "collected"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export type VehicleType = "motorcycle" | "bicycle" | "e-motorcycle";

export interface Order {
  id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  item_description: string;
  vehicle_type: VehicleType;
  special_instructions?: string;
  rider_id?: string;
  scheduled_at?: any;
  payment_method: string;
  payment_method_id?: string;
  price_ghs: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  rider?: {
    id: string;
    fullName: string;
    phone: string;
    rating?: number;
    photo_url?: string;
    full_name?: string;
    plate_no?: string;
    vehicle?: { plate_no: string; type: string };
  };
}

export interface BookDeliveryBody {
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  item_description: string;
  vehicle_type: VehicleType;
  special_instructions?: string;
  payment_method: string;
  payment_method_id?: string;
  price_ghs: number;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

// ── Orders endpoints ─────────────────────────────────────────────────────────
export const ordersApi = {
  /** Book a new delivery */
  book: (body: BookDeliveryBody) =>
    api.post<OrderResponse>("/orders", body, true),

  /** Get my order history */
  getMyOrders: (params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return api.get<OrdersResponse>(`/orders/my${qs ? "?" + qs : ""}`, true);
  },

  /** Get a single order */
  getOrder: (id: string) => api.get<OrderResponse>(`/orders/${id}`, true),

  /** Cancel a pending order */
  cancelOrder: (id: string, cancellation_reason: string) =>
    api.post<{ success: boolean; message: string }>(
      `/orders/${id}/cancel`,
      { cancellation_reason },
      true,
    ),
};
