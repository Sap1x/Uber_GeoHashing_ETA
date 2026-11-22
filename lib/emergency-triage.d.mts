export type EmergencyCategory = "stopped" | "route" | "threat" | "collision" | "medical" | "breakdown" | "other";
export type EmergencySelection = EmergencyCategory | "auto";
export interface EmergencyScenario {
  readonly id: Exclude<EmergencyCategory, "other">;
  readonly label: string;
  readonly hint: string;
}
export interface EmergencyTriage {
  category: EmergencyCategory;
  source: "selected" | "keyword" | "example-nlp" | "unknown";
  title: string;
  urgency: "high" | "caution" | "unknown";
  actions: string[];
}
export interface EmergencyLocation {
  latitude: number;
  longitude: number;
}
export interface EmergencyShareContext {
  city?: string | null;
  bookingId?: string | number | null;
  driverName?: string | null;
  position?: EmergencyLocation | null;
  pickupLocation?: { lat: number; lng: number } | null;
}
export declare const EMERGENCY_SCENARIOS: readonly EmergencyScenario[];
export declare function triageEmergency(description: string, selectedCategory?: EmergencySelection): EmergencyTriage;
export declare function buildEmergencyShareMessage(context?: EmergencyShareContext): string;
