import { writable, type Writable } from "svelte/store";
import Dexie from "dexie";
import { createKeyPairAndSharedSecret, decrypt, deriveSharedSecret, encrypt, generatePairingQRCode } from "./Keys";
import { encodeBase64, decodeBase64 } from "@oslojs/encoding";
import { bytesToUtf8 } from "@noble/ciphers/utils";
type CredentialsKey = string;
type DeviceKey = string;
interface Credential {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  sharedSecret?: Uint8Array;
  devicePublicKey?: Uint8Array;
  created_at: number;
  expires_at: number;
  paired: boolean;
  request?: boolean;
}

class CredentialsDatabase extends Dexie {
  // Maps a public key on this device to the credentials for a paired device
  credentials!: Dexie.Table<Credential, CredentialsKey>;
  // Maps paired device public key to the public key on this device
  myKeyFromDeviceKey!: Dexie.Table<CredentialsKey, DeviceKey>;
  constructor() {
    super("credentials_db");
    let c: Partial<Credential> = {}
    this.version(1).stores({
      credentials: Object.keys(c).join(", "),
      myKeyFromDeviceKey: ",publicKeyBase64",
    });
  }
}

class TokenStore {
  private db: CredentialsDatabase;

  // Store to track initialization status
  public ready: Writable<boolean> = writable(false);

  constructor() {
    this.db = new CredentialsDatabase();
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      await this.db.open();
      this.ready.set(true);
    } catch (error) {
      console.error("Error opening database:", error);
      throw new Error("Failed to open database");
    }
  }

  async getDevices() {
    return await this.db.credentials.toArray();
  }

  // Typically called from desktop to generate a key pair for a new device
  // and display the QR code containing the public key encoded in base64
  async startPairing(): Promise<string> {
    // Store the keypair in the database
    const {keyPair, publicKeyBase64} = await generatePairingQRCode();
    await this.db.credentials.put({
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      created_at: Date.now(),
      expires_at: Date.now() + 1000 * 60 * 60, // 1 hour
      paired: false,
    }, publicKeyBase64);
    return publicKeyBase64;
  }

  // Typically called from mobile after scanning the QR code from desktop
  // to generate a shared secret and store the credentials in the database
  async pairNewDevice(devicePubKeyBase64: string) : Promise<boolean> {
    console.log(`Starting to pair new device with key: ${devicePubKeyBase64}`);
    const credential = await this.db.credentials.get(devicePubKeyBase64);
    if (credential) {
      console.log("Device already pairing");
      return false;
    }
    const { keyPair, sharedSecret, devicePublicKey, publicKeyBase64 } = createKeyPairAndSharedSecret(devicePubKeyBase64);
    console.log(`Created key pair with publicKey: ${publicKeyBase64}`);
    
    await this.db.credentials.put({
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      sharedSecret: sharedSecret,
      devicePublicKey: devicePublicKey,
      created_at: Date.now(),
      expires_at: Date.now() + 1000 * 60 * 60, // 1 hour
      paired: false,
      request: true,
    }, publicKeyBase64);
    
    console.log(`Stored credential with request flag for key: ${publicKeyBase64}`);
    await this.db.myKeyFromDeviceKey.put(publicKeyBase64, devicePubKeyBase64);
    console.log(`Mapped ${publicKeyBase64} to device key ${devicePubKeyBase64}`);
    
    return true;
  }

  async getPairing(publicKeyBase64: string): Promise<Credential | null> {
    console.log(`Looking up credential for key: ${publicKeyBase64}`);
    const credential = await this.db.credentials.get(publicKeyBase64);
    if (credential) {
      console.log(`Found credential: paired=${credential.paired}, request=${credential.request}`);
    } else {
      console.log(`No credential found for key: ${publicKeyBase64}`);
    }
    return credential || null;
  }

  async encryptMessageForDevice(message: string, devicePubKeyBase64: string) {
    const publicKey = await this.db.myKeyFromDeviceKey.get(devicePubKeyBase64);
    if (!publicKey) {
      throw new Error("Device not paired");
    }
    const credential = await this.db.credentials.get(publicKey);
    if (!credential) {
      throw new Error("Credential not found");
    }
    if (!credential.sharedSecret) {
      throw new Error("Device not paired");
    }
    const encryptedMessage = encrypt(message, credential.sharedSecret);
    return {myKey: credential.publicKey, encryptedMessage};
  }

  // Typically called by desktop after receiving a device pairing message
  async receiveDevicePairing(encryptedMessage: {nonce: Uint8Array, ciphertext: Uint8Array}, scannedPublicKeyBase64: string, senderPublicKey: Uint8Array) : Promise<boolean> {
    // Did we actually initiate this pairing?
    const credential = await this.db.credentials.get(scannedPublicKeyBase64);
    if (!credential) {
      throw new Error("Credential not found");
    }
    if (credential.paired) {
      throw new Error("Device already paired");
      return false;
    }
    const myDeviceKeyBase64 = encodeBase64(credential.publicKey);
    credential.sharedSecret = deriveSharedSecret(credential.privateKey, senderPublicKey);
    const decryptedMessage = decrypt(encryptedMessage.nonce, encryptedMessage.ciphertext, credential.sharedSecret);
    if (bytesToUtf8(decryptedMessage) !== myDeviceKeyBase64) {
      throw new Error("Invalid pairing message");
    }
    credential.devicePublicKey = senderPublicKey;
    credential.paired = true;
    await this.db.credentials.put(credential, myDeviceKeyBase64);
    await this.db.myKeyFromDeviceKey.put(myDeviceKeyBase64, scannedPublicKeyBase64);
    return true;
  }

  // Called to update a credential's paired status
  async updatePairedStatus(publicKeyBase64: string, paired: boolean): Promise<boolean> {
    try {
      const updateCount = await this.db.credentials.update(publicKeyBase64, { paired });
      if (updateCount === 0) {
        console.error("Credential not found when updating paired status");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error updating credential paired status:", error);
      return false;
    }
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
