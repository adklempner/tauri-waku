import { p256 } from "@noble/curves/p256";
import { gcm } from "@noble/ciphers/aes";
import { utf8ToBytes, bytesToUtf8 } from "@noble/ciphers/utils";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { encodeBase64, decodeBase64 } from "@oslojs/encoding";

// Desktop side: Generate key pair and create QR code
export async function generatePairingQRCode() {
  // Generate ECDH key pair
  const priv = p256.utils.randomPrivateKey();
  const pub = p256.getPublicKey(priv);

  const keyPair = {
    privateKey: new Uint8Array(priv),
    publicKey: new Uint8Array(pub),
  };

  // Convert to base64 for QR code
  const publicKeyBase64 = encodeBase64(pub);

  // Convert to JSON and return for QR code generation
  return {
    keyPair,
    publicKeyBase64,
  };
}

export function createKeyPairAndSharedSecret(scannedPublicKeyBase64: string) {
  const scannedPub = decodeBase64(scannedPublicKeyBase64);
  const priv = p256.utils.randomPrivateKey();
  const pub = p256.getPublicKey(priv);
  const shared = p256.getSharedSecret(priv, scannedPub).slice(1);
  return {
    keyPair: { privateKey: new Uint8Array(priv), publicKey: new Uint8Array(pub) },
    publicKeyBase64: encodeBase64(pub),
    sharedSecret: new Uint8Array(shared),
    devicePublicKey: new Uint8Array(scannedPub),
  };
}

export function deriveSharedSecret(priv: Uint8Array, devicePubKey: Uint8Array) {
  return new Uint8Array(p256.getSharedSecret(priv, devicePubKey).slice(1));
}

export function encrypt(data: string, sharedSecret: Uint8Array) {
  const nonce = randomBytes(12);
  const aes = gcm(sharedSecret, nonce);
  const ciphertext = aes.encrypt(utf8ToBytes(data));
  return {
    nonce: new Uint8Array(nonce),
    ciphertext: new Uint8Array(ciphertext),
  };
}

export function decrypt(nonce: Uint8Array, ciphertext: Uint8Array, sharedSecret: Uint8Array) {
  console.log("decrypting");
  console.log(nonce);
  console.log(ciphertext);
  console.log(sharedSecret);
  const aes = gcm(sharedSecret, nonce);
  return new Uint8Array(aes.decrypt(ciphertext));
}
