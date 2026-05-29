export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface PushSubscriptionPayload {
  provider: "web_push" | "fcm" | "apns" | "onesignal";
  token: string;
  p256dh?: string;
  auth?: string;
  platform: "web" | "android" | "ios";
  userAgent?: string;
}

export interface PushProvider {
  readonly name: string;
  isSupported(): boolean;
  getPermission(): PushPermissionState;
  requestPermission(): Promise<PushPermissionState>;
  subscribe(): Promise<PushSubscriptionPayload>;
  unsubscribe(): Promise<string | null>; // returns removed token if any
  getExistingToken(): Promise<string | null>;
}
