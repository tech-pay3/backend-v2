import { Quest } from "../domain/db"; // Adjust the import path if needed

export interface ChatResult {
  status: string;
}

export interface ChatMemberResponse {
  ok: boolean;
  result: ChatResult;
}

export class TelegramChecker {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async isQuestCompleted(quest: Quest, externalId: string): Promise<boolean> {
    if (quest.action === "GROUP") {
      return await this.handleGroupChatQuest(quest, externalId);
    }
    return false;
  }

  private async handleGroupChatQuest(
    quest: Quest,
    externalId: string
  ): Promise<boolean> {
    // Set the group target (fixed value)
    quest.target = "-1002301616820";
    const url = `https://api.telegram.org/bot${this.token}/getChatMember?chat_id=${quest.target}&user_id=${externalId}`;
    console.log(url);

    const resp = await fetch(url);
    console.log(resp);
    if (!resp.ok) {
      throw new Error("failed to call getChatMember");
    }

    const res: ChatMemberResponse = await resp.json();
    if (!res.ok) {
      throw new Error("telegram API returned error");
    }

    if (["member", "administrator", "creator"].includes(res.result.status)) {
      return true;
    }
    return false;
  }
}

// Factory-like function
export function newTelegramChecker(token: string): TelegramChecker {
  return new TelegramChecker(token);
}
