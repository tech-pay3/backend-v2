import { UsersRepository } from "../db/user_repository";
import { QuestRepository } from "../db/quest_repository";
import { Quest } from "../domain/db"; // Adjust the import path if needed

export class Pay3Checker {
  constructor(
    private userRepo: UsersRepository,
    private questRepo: QuestRepository
  ) {}

  // Always return true for non-INVITE quests
  async isQuestCompleted(quest: Quest, externalId: string): Promise<boolean> {
    if (quest.action === "INVITE") {
      return await this.handleInviteQuest(quest, externalId);
    }
    return true;
  }

  private async handleInviteQuest(
    quest: Quest,
    externalId: string
  ): Promise<boolean> {
    // Count the number of quests for the user (assumes countUserQuests returns a Promise<number>)
    const invites = await this.questRepo.countUserQuests(externalId);

    // Convert quest.target (a string) to a number
    const target = parseInt(quest.target, 10);
    if (isNaN(target)) {
      throw new Error(`Invalid target value: ${quest.target}`);
    }

    // Return true if (invites + 1) equals the numeric target
    return invites + 1 === target;
  }
}

// You can instantiate this class in your service layer. For example:
//
// import { db } from "../db/database";
// const pay3Checker = new Pay3Checker(db.users, db.quests);
