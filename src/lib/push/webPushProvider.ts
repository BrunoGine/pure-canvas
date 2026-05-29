import { supabase } from "@/integrations/supabase/client";
import type { PushProvider, PushPermissionState, PushSubscriptionPayload } from "./types";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function arrayBufferToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function detectPlatform(): "android" | "ios" | "web" {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return await navigator.serviceWorker.register("/sw.js");
}

let cachedPublicKey: string | null = null;
async function fetchPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  const { data, error } = await supabase.functions.invoke("push-vapid-public-key");
  if (error) throw error;
  cachedPublicKey = (data as { publicKey: string }).publicKey;
  return cachedPublicKey;
}

export const webPushProvider: PushProvider = {
  name: "web_push",

  isSupported() {
    return typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && "Notification" in window;
  },

  getPermission(): PushPermissionState {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission as PushPermissionState;
  },

  async requestPermission() {
    if (!this.isSupported()) return "unsupported";
    const result = await Notification.requestPermission();
    return result as PushPermissionState;
  },

  async subscribe(): Promise<PushSubscriptionPayload> {
    if (!this.isSupported()) throw new Error("Web Push não suportado neste dispositivo");
    const reg = await getRegistration();
    const publicKey = await fetchPublicKey();

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
    }

    const p256dh = arrayBufferToBase64Url(sub.getKey("p256dh"));
    const auth = arrayBufferToBase64Url(sub.getKey("auth"));

    return {
      provider: "web_push",
      token: sub.endpoint,
      p256dh,
      auth,
      platform: detectPlatform(),
      userAgent: navigator.userAgent,
    };
  },

  async unsubscribe() {
    if (!this.isSupported()) return null;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return null;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    return endpoint;
  },

  async getExistingToken() {
    if (!this.isSupported()) return null;
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return null;
    const sub = await reg.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  },
};
