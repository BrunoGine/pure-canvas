/**
 * WebAuthn helpers for platform biometric authentication (Face ID, Touch ID,
 * Windows Hello, Android fingerprint).
 *
 * IMPORTANT: This module performs the WebAuthn ceremony purely client-side and
 * stores credential metadata in Supabase so the user's devices can be listed
 * and revoked later. The biometric ceremony only UNLOCKS an existing,
 * already-validated Supabase session — it does not replace backend auth.
 */

const RP_NAME = "Pierre";

const enc = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b);
  let bin = "";
  bytes.forEach((c) => (bin += String.fromCharCode(c)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const dec = (s: string): Uint8Array => {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const randomChallenge = (): ArrayBuffer => {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return buf.buffer.slice(0) as ArrayBuffer;
};

const toBuffer = (u: Uint8Array): ArrayBuffer =>
  u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    if (typeof window === "undefined") return false;
    if (!("PublicKeyCredential" in window)) return false;
    // @ts-ignore
    const avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
    return !!avail;
  } catch {
    return false;
  }
};

export const detectDeviceLabel = (): string => {
  const ua = navigator.userAgent;
  let browser = "Navegador";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  let os = "Dispositivo";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "Mac";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return `${browser} em ${os}`;
};

export interface RegisteredCredential {
  credentialId: string; // base64url
  publicKey: string;    // base64url (raw cose key bytes — not verified server-side)
}

export const registerCredential = async (params: {
  userId: string;
  userName: string;
  displayName: string;
}): Promise<RegisteredCredential> => {
  const challenge = randomChallenge();
  const userIdBytes = new TextEncoder().encode(params.userId);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME, id: window.location.hostname },
      user: {
        id: userIdBytes,
        name: params.userName,
        displayName: params.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Biometria cancelada");

  const response = credential.response as AuthenticatorAttestationResponse;
  // @ts-ignore — getPublicKey() exists in modern browsers
  const pkBuf: ArrayBuffer | null = response.getPublicKey?.() ?? null;

  return {
    credentialId: enc(credential.rawId),
    publicKey: pkBuf ? enc(pkBuf) : "",
  };
};

export const verifyCredential = async (credentialId: string): Promise<boolean> => {
  const challenge = randomChallenge();
  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60_000,
        userVerification: "required",
        rpId: window.location.hostname,
        allowCredentials: [
          {
            type: "public-key",
            id: toBuffer(dec(credentialId)),
            transports: ["internal"],
          },
        ],
      },
    })) as PublicKeyCredential | null;
    return !!assertion;
  } catch {
    return false;
  }
};
