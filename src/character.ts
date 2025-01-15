import { Conversation } from "./conversation.js";
import type { ConversationWrapper, User } from "./wrapper.js";

export default class Character {
    character: unknown;
    wrapper: ConversationWrapper;
    conversations: Conversation[];

    constructor(character: unknown, wrapper: ConversationWrapper) {
        this.character = character;
        this.wrapper = wrapper;
        this.conversations = [];
    }

    async createConversation(
        user: User,
        persistenceToken?: string,
    ): Promise<Conversation> {
        const conversationData = await this.wrapper.create(
            this.character,
            [user],
            persistenceToken,
        );

        if (!conversationData) {
            throw new Error("Failed to create conversation");
        }

        const newConversation = new Conversation(
            conversationData.id,
            conversationData.secret,
            this.wrapper,
        );

        newConversation.addUser(user);
        this.conversations.push(newConversation);

        return newConversation;
    }

    async finishConversation(conversation: Conversation): Promise<void> {
        conversation.finished = true;
        await this.wrapper.finish({
            id: conversation.id,
            secret: conversation.secret,
        });

        this.conversations = this.conversations.filter(
            (c) => c.id !== conversation.id,
        );
    }

    async getConversation(user: User): Promise<Conversation> {
        for (const conversation of this.conversations) {
            if (conversation.containsPlayer(user)) {
                return conversation;
            }
        }

        const conversationData = await this.wrapper.create(this.character, [
            user,
        ]);

        if (!conversationData) {
            throw new Error("Failed to create conversation");
        }

        const newConversation = new Conversation(
            conversationData.id,
            conversationData.secret,
            this.wrapper,
        );

        this.conversations.push(newConversation);
        return newConversation;
    }

    async executeFunctions(
        playerId: number,
        conversation: Conversation,
        response: {
            calls?: Array<{ name: string; parameters: Record<string, any> }>;
        },
    ): Promise<void> {
        if (response && response.calls) {
            const character: any = this.character;

            if (!character || !character.functions) {
                return;
            }

            const functionLocation = character?.functions;

            if (!functionLocation) {
                return;
            }

            for (const call of response.calls) {
                const { name, parameters } = call;
                const func = functionLocation.find((f: any) => f.name === name);

                if (func) {
                    func.callback(conversation, playerId, parameters);
                }
            }
        }
    }

    destroy(): void {
        for (const conversation of this.conversations) {
            conversation.destroy();
        }

        this.conversations = [];
    }
}
