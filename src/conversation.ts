import type { ConversationWrapper, User } from "./wrapper.js";

export class Conversation {
    wrapper: ConversationWrapper;
    users: User[];
    id: string;
    secret: string;
    finished: boolean = false;

    constructor(id: string, secret: string, wrapper: ConversationWrapper) {
        this.id = id;
        this.secret = secret;
        this.wrapper = wrapper;
        this.users = [];
    }

    async addUser(user: User) {
        this.users.push(user);
        await this.wrapper.update(
            {
                id: this.id,
                secret: this.secret,
            },
            this.users,
        );
    }

    async removeUser(user: User) {
        this.users = this.users.filter((u) => u.id !== user.id);
        await this.wrapper.update(
            {
                id: this.id,
                secret: this.secret,
            },
            this.users,
        );
    }

    async send(
        id: number,
        message: string,
        context?: Record<string, any>,
    ): Promise<{ flagged: boolean; content: string } | null> {
        return this.wrapper.send(
            {
                id: this.id,
                secret: this.secret,
            },
            message,
            context,
            id,
        );
    }

    async finish(): Promise<void> {
        if (this.finished) {
            return;
        }

        this.finished = true;
        await this.wrapper.finish({
            id: this.id,
            secret: this.secret,
        });
    }

    containsPlayer(player: { id: number }): boolean {
        return this.users.some((user) => user.id === player.id);
    }

    isEmpty(): boolean {
        return this.users.length === 0;
    }

    destroy(): void {
        this.finish();
    }
}
