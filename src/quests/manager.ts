import { Quest } from "../domain/db"; // Adjust the import path if needed

export interface QuestChecker {
  isQuestCompleted(quest: Quest, externalId: string): Promise<boolean>;
}

export class QuestManager {
  private checkers: { [platform: string]: QuestChecker };

  // A static error for verification failures (similar to VerifyErr in Go)
  public static VerifyErr = new Error("failed to verify quest");

  constructor(checkers: { [platform: string]: QuestChecker }) {
    this.checkers = checkers;
  }

  async isQuestCompleted(quest: Quest, externalId: string): Promise<boolean> {
    const checker = this.checkers[quest.platform];
    if (!checker) {
      // If no checker is found for the platform, throw an error
      throw new Error("no quest for that platform");
    }
    return await checker.isQuestCompleted(quest, externalId);
  }
}

// Factory-like function is not necessary in TS since you can just call `new QuestManager(...)`
// However, if you prefer a function that acts like a factory, you could add:
//
// export function newQuestManager(
//   checkers: { [platform: string]: QuestChecker }
// ): QuestManager {
//   return new QuestManager(checkers);
// }
