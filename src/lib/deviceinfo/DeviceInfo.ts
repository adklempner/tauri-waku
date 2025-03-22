import Dexie from "dexie";
import { type RamUsage } from "$lib/waku/topics";
import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
export interface RamUsageItem {
  deviceId: string;
  ramUsage: RamUsage;
}

/**
 * Stores RAM usage information received from paired devices.
 */
class DeviceInfo extends Dexie {
  lastUpdate!: Dexie.Table<number, string>;
  ramUsage!: Dexie.Table<RamUsageItem, number>;
  constructor() {
    super("deviceInfo");
    this.version(1).stores({
      lastUpdate: ",deviceId",
      ramUsage: "++id, deviceId",
    });
    this.initDatabase();
  }

  public ready: Writable<boolean> = writable(false);
  private async initDatabase(): Promise<void> {
    try {
      await this.open();
      this.ready.set(true);
    } catch (error) {
      console.error("Error opening database:", error);
      throw new Error("Failed to open database");
    }
  }

  async addRamUsage(ramUsage: RamUsage, deviceId: string) {
    await this.ramUsage.add({ ramUsage, deviceId });
    await this.lastUpdate.put(ramUsage.timestamp, deviceId);
  }

  async getRamUsage(deviceId: string) {
    return await this.ramUsage.where("deviceId").equals(deviceId).toArray();
  }
}

export const deviceInfo = new DeviceInfo();
