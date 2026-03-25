import { Injectable } from '@nestjs/common';

@Injectable()
export class XpTimeoutService {
  private userRequestTimestamps: Map<string, number> = new Map();

  async getXpTimeout(userId: string) {
    const currentTimestamp = Date.now();
    const lastRequestTimestamp = this.userRequestTimestamps.get(userId);

    // If there's no request or the last request is older than 24 hours
    if (
      !lastRequestTimestamp ||
      currentTimestamp - lastRequestTimestamp > 24 * 60 * 60 * 1000
    ) {
      // Allow request and store the timestamp
      this.userRequestTimestamps.set(userId, currentTimestamp);
      return { isEnableXp: true, message: 'XP timeout check is allowed' };
    } else {
      // If the request was made within 24 hours, show error
      return {
        isEnableXp: false,
        message:
          'You have already used the XP timeout check within the last 24 hours',
      };
    }
  }

  // ----------------getReadstoryXpTimeout----------------
  async getReadstoryXpTimeout(userId: string) {
    const currentTimestamp = Date.now();
    const lastRequestTimestamp = this.userRequestTimestamps.get(userId);

    // If there's no request or the last request is older than 24 hours
    if (
      !lastRequestTimestamp ||
      currentTimestamp - lastRequestTimestamp > 24 * 60 * 60 * 1000
    ) {
      // Allow request and store the timestamp
      this.userRequestTimestamps.set(userId, currentTimestamp);
      return {
        isEnableXp: true,
        message: 'Read story XP timeout check is allowed',
      };
    } else {
      // If the request was made within 24 hours, show error
      return {
        isEnableXp: false,
        message:
          'You have already used the Readstory XP timeout check within the last 24 hours',
      };
    }
  }
}
