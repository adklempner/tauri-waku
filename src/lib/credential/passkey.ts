import { encodeBase64 } from "@oslojs/encoding";

// Get the effective domain for the relying party ID
export function getRelyingPartyId(): string {
  // First check if there's an environment variable defined
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RP_ID) {
    return import.meta.env.VITE_RP_ID;
  }
  
  // In browser environments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check if we're running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
    
    // For production, use the actual domain
    // WebAuthn requires an RP ID that's a valid domain or subdomain
    return hostname;
  }
  
  // Default for SSR contexts
  return 'localhost';
}

// Create the relying party config dynamically
const rp = {
  id: getRelyingPartyId(),
  name: "Waku Remote Control",
};

export async function createCredential(
  deviceName: string,
  challenge: Uint8Array
): Promise<Uint8Array> {
  console.log(`Creating credential with RP ID: ${rp.id}`);
  
  const credential = await navigator.credentials.create({
    publicKey: {
      attestation: "none",
      rp,
      user: {
        id: crypto.getRandomValues(new Uint8Array(32)),
        name: deviceName,
        displayName: deviceName,
      },
      pubKeyCredParams: [
        {
          type: "public-key",
          // ECDSA with SHA-256
          alg: -7,
        },
      ],
      challenge,
      authenticatorSelection: {
        // See note below.
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true,
      },
      // list of existing credentials
      excludeCredentials: [],
    },
  });
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("Failed to create credential");
  }
  const response = credential.response;
  if (!(response instanceof AuthenticatorAttestationResponse)) {
    throw new Error("Unexpected");
  }

  const clientDataJSON: ArrayBuffer = response.clientDataJSON;
  const attestationObject: ArrayBuffer = response.attestationObject;

  const jsonString = JSON.stringify({
    attestationObject: encodeBase64(new Uint8Array(response.attestationObject)),
    clientDataJSON: encodeBase64(new Uint8Array(response.clientDataJSON)),
  });

  const payload = Uint8Array.from(jsonString);

  return payload;
}

import {
  parseAttestationObject,
  AttestationStatementFormat,
  parseClientDataJSON,
  coseAlgorithmES256,
  coseEllipticCurveP256,
  ClientDataType,
} from "@oslojs/webauthn";
import { ECDSAPublicKey, p256 } from "@oslojs/crypto/ecdsa";

export async function verifyPasskey(encodedAttestationObject: Uint8Array, clientDataJSON: Uint8Array, expectedChallenge: string) {
  const { attestationStatement, authenticatorData } = parseAttestationObject(
    encodedAttestationObject
  );
  if (attestationStatement.format !== AttestationStatementFormat.None) {
    throw new Error("Invalid attestation statement format");
  }
  
  // Verify the relying party ID hash using the same dynamic ID
  console.log(`Verifying with RP ID: ${rp.id}`);
  if (!authenticatorData.verifyRelyingPartyIdHash(rp.id)) {
    throw new Error("Invalid relying party ID hash");
  }
  
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
    throw new Error("User must be present and verified");
  }
  if (authenticatorData.credential === null) {
    throw new Error("Missing credential");
  }
  if (
    authenticatorData.credential.publicKey.algorithm() !== coseAlgorithmES256
  ) {
    throw new Error("Unsupported algorithm");
  }

  // Parse the COSE key as an EC2 key
  // .rsa() for RSA, .okp() for EdDSA, etc
  const cosePublicKey = authenticatorData.credential.publicKey.ec2();
  if (cosePublicKey.curve !== coseEllipticCurveP256) {
    throw new Error("Unsupported algorithm");
  }

  const clientData = parseClientDataJSON(clientDataJSON);
  if (clientData.type !== ClientDataType.Create) {
    throw new Error("Invalid client data type");
  }
  // decode challenge to string
  const challengeString = new TextDecoder().decode(clientData.challenge);
  if (challengeString !== expectedChallenge) {
    throw new Error("Invalid challenge");
  }

  // Check if the origin matches the current origin
  if (typeof window !== 'undefined') {
    const expectedOrigin = window.location.origin;
    if (clientData.origin !== expectedOrigin) {
      console.warn(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`);
      // Consider whether you want to make this a hard error or just a warning
      // throw new Error("Invalid origin");
    }
    
    if (clientData.crossOrigin !== null && clientData.crossOrigin) {
      console.warn("Credential was created in a cross-origin context");
      // Consider whether you want to make this a hard error or just a warning
      // throw new Error("Invalid origin");
    }
  }

  // Store the credential ID, algorithm (ES256), and public key with the user's user ID
  const credentialId = authenticatorData.credential.id;
  const encodedPublicKey = new ECDSAPublicKey(
    p256,
    cosePublicKey.x,
    cosePublicKey.y
  ).encodeSEC1Uncompressed();

  return {
    credentialId,
    encodedPublicKey,
  };
}
