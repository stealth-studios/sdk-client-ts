import { ConversationWrapper, SDKData } from "./wrapper.js";
import Character from "./character.js";

export default class ChatbotInterface {
    private apiWrapper: ConversationWrapper;

    constructor(data: SDKData) {
        this.apiWrapper = new ConversationWrapper(data);
    }

    createCharacter(character: unknown): Character {
        return new Character(character, this.apiWrapper);
    }
}
