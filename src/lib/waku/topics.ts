import { createEncoder, createDecoder, Decoder, Encoder } from "@waku/sdk";
import * as protobuf from "protobufjs";

const devicePairingContentTopic = "/waku-remote-control/1/device-pairing/proto";
export type DevicePairingMessage = {
    senderPublicKeyBase64: string;
    scannedPublicKeyBase64: string;
    nonceBase64: string;
    ciphertextBase64: string;
    ackId: string;
}
export const devicePairingProto = new protobuf.Type("DevicePairing")
  .add(new protobuf.Field("senderPublicKeyBase64", 1, "string"))
  .add(new protobuf.Field("scannedPublicKeyBase64", 2, "string"))
  .add(new protobuf.Field("nonceBase64", 3, "string"))
  .add(new protobuf.Field("ciphertextBase64", 4, "string"))
  .add(new protobuf.Field("ackId", 5, "string"));

const devicePairing = {
    contentTopic: devicePairingContentTopic,
    encoder: createEncoder({ contentTopic: devicePairingContentTopic }),
    decoder: createDecoder(devicePairingContentTopic),
    protoType: devicePairingProto,
}

const ackContentTopic = "/waku-remote-control/1/ack/proto";
const ackProto = new protobuf.Type("Ack")
  .add(new protobuf.Field("ackId", 1, "string"))
  .add(new protobuf.Field("success", 2, "bool"));

export enum Topic {
    DevicePairing,
    // Ack,
}

type TopicData = {
    [key in Topic]: {
        contentTopic: string;
        encoder: Encoder;
        decoder: Decoder;
        protoType: protobuf.Type;
    };
}

export const topics: TopicData = {
    [Topic.DevicePairing]: devicePairing,
}