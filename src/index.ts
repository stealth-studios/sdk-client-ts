import { ConversationWrapper, SDKData } from "./wrapper.js";
import Character from "./character.js";
import { Conversation } from "conversation.js";

export default class StealthClient {
    private apiWrapper: ConversationWrapper;

    constructor(data: SDKData) {
        this.apiWrapper = new ConversationWrapper(data);
    }

    createCharacter(character: unknown): Character {
        return new Character(character, this.apiWrapper);
    }
}

export type { Conversation, Character };
