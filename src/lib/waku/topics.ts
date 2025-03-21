import { createEncoder, createDecoder, Decoder, Encoder } from "@waku/sdk";
import * as protobuf from "protobufjs";

const devicePairingContentTopic = "/waku-remote-control/1/device-pairing/proto";
export type DevicePairingMessage = {
  senderPublicKeyBase64: string;
  scannedPublicKeyBase64: string;
  nonceBase64: string;
  ciphertextBase64: string;
  ackId: string;
};
export const devicePairingProto = new protobuf.Type("DevicePairing")
  .add(new protobuf.Field("senderPublicKeyBase64", 1, "string"))
  .add(new protobuf.Field("scannedPublicKeyBase64", 2, "string"))
  .add(new protobuf.Field("nonceBase64", 3, "string"))
  .add(new protobuf.Field("ciphertextBase64", 4, "string"))
  .add(new protobuf.Field("ackId", 5, "string"));

const devicePairing = {
  contentTopic: devicePairingContentTopic,
  encoder: createEncoder({
    contentTopic: devicePairingContentTopic,
    pubsubTopicShardInfo: {
      clusterId: 42,
      shard: 0,
    },
  }),
  decoder: createDecoder(devicePairingContentTopic, {
    clusterId: 42,
    shard: 0,
  }),
  protoType: devicePairingProto,
};

const ackContentTopic = "/waku-remote-control/1/ack/proto";
export type AckMessage = {
  ackId: string;
  success: boolean;
};
const ackProto = new protobuf.Type("Ack")
  .add(new protobuf.Field("ackId", 1, "string"))
  .add(new protobuf.Field("success", 2, "bool"));

const ack = {
  contentTopic: ackContentTopic,
  encoder: createEncoder({
    contentTopic: ackContentTopic,
    pubsubTopicShardInfo: {
      clusterId: 42,
      shard: 0,
    },
  }),
  decoder: createDecoder(ackContentTopic, {
    clusterId: 42,
    shard: 0,
  }),
  protoType: ackProto,
};

export enum Topic {
  DevicePairing,
  Ack,
}

export const topics = {
  [Topic.DevicePairing]: devicePairing,
  [Topic.Ack]: ack,
};
