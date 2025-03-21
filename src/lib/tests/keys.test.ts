import { describe, it, expect } from "vitest";
import { generatePairingQRCode, createKeyPairAndSharedSecret, encrypt, decrypt, deriveSharedSecret } from "../credential/Keys";
import { bytesToUtf8 } from "@noble/ciphers/utils";
import * as protobuf from "protobufjs";
import { type DevicePairingMessage, devicePairingProto } from "../waku/topics";
import { encodeBase64, decodeBase64 } from "@oslojs/encoding";

interface TestMessage {
  id: string;
  nonce: Uint8Array;
  ciphertext: Uint8Array;
}

describe("Encryption and Decryption", () => {
  it("should successfully encrypt and decrypt data using shared secret", async () => {
    // Generate initial desktop keys
    const { keyPair: desktopKeys, publicKeyBase64: desktopPublicKeyBase64 } = await generatePairingQRCode();
    
    // Simulate mobile device scanning and creating shared secret
    const { sharedSecret: mobileSharedSecret } = createKeyPairAndSharedSecret(desktopPublicKeyBase64);
    
    // Test data
    const testMessage = "Hello, secure world!";
    
    // Encrypt the message using the shared secret
    const { nonce, ciphertext } = encrypt(testMessage, mobileSharedSecret);
    
    // Decrypt the message
    const decryptedBytes = decrypt(nonce, ciphertext, mobileSharedSecret);
    const decryptedMessage = bytesToUtf8(decryptedBytes);
    
    // Assert the decrypted message matches the original
    expect(decryptedMessage).toBe(testMessage);
  });

  it("should successfully encrypt and decrypt device pairing messages", async () => {
    // Generate keys for desktop
    const { keyPair: desktopKeys, publicKeyBase64: desktopPublicKeyBase64 } = await generatePairingQRCode();

    // Simulate mobile device scanning and creating shared secret
    const { keyPair: mobileKeys, sharedSecret } = createKeyPairAndSharedSecret(desktopPublicKeyBase64);
    
    // Create a test pairing message (mobile -> desktop)
    const { nonce, ciphertext } = encrypt(desktopPublicKeyBase64, sharedSecret);

    console.log("mobileKeys.publicKey before encoding");
    console.log(mobileKeys.publicKey);
    
    const pairingMessage: DevicePairingMessage = {
      senderPublicKeyBase64: encodeBase64(mobileKeys.publicKey),
      scannedPublicKeyBase64: desktopPublicKeyBase64,
      nonceBase64: encodeBase64(nonce),
      ciphertextBase64: encodeBase64(ciphertext),
      ackId: "test-pairing-1"
    };
    
    const serialized = devicePairingProto.encode(pairingMessage).finish();
    
    // Deserialize (simulating desktop receiving the message)
    const decoded = devicePairingProto.decode(serialized) as unknown as DevicePairingMessage;
    console.log("decoded.senderPublicKey");
    console.log(decoded.senderPublicKeyBase64);
    
    // Desktop derives the same shared secret
    const desktopSharedSecret = deriveSharedSecret(desktopKeys.privateKey, decodeBase64(decoded.senderPublicKeyBase64));
    
    // Decrypt the message
    const decryptedBytes = decrypt(decodeBase64(decoded.nonceBase64), decodeBase64(decoded.ciphertextBase64), desktopSharedSecret);
    const decryptedPublicKey = bytesToUtf8(decryptedBytes);
    
    // Assert the decrypted public key matches what was sent
    expect(decryptedPublicKey).toBe(desktopPublicKeyBase64);
    
    // Verify all fields were preserved through serialization
    expect(decoded.senderPublicKeyBase64).toEqual(pairingMessage.senderPublicKeyBase64);
    expect(decoded.scannedPublicKeyBase64).toBe(pairingMessage.scannedPublicKeyBase64);
    expect(decoded.nonceBase64).toEqual(pairingMessage.nonceBase64);
    expect(decoded.ciphertextBase64).toEqual(pairingMessage.ciphertextBase64);
    expect(decoded.ackId).toBe(pairingMessage.ackId);
  });
});
