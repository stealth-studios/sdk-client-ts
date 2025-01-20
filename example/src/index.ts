import {
    Client,
    Events,
    GatewayIntentBits,
    Partials,
    TextChannel,
} from "discord.js";
import StealthClient from "@stealthstudios/sdk-client-ts";

import "dotenv/config";
import { Conversation } from "@stealthstudios/sdk-client-ts/src/conversation";

// Create a new Discord.js client
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
});

const stealthClient = new StealthClient({
    url: process.env.STEALTH_API_URL!,
    auth: process.env.STEALTH_API_KEY!,
    openCloudKey: process.env.OPEN_CLOUD_KEY,
});

const character = stealthClient.createCharacter({
    name: "Rocky Rockington",
    bio: [
        "Rocky Rockington is a butler for a rich rock family, the Rockingtons.",
        "Will assist the player with their needs in the world of StealthSDK RPG.",
        "Answers in a polite and helpful manner.",
        "Does not express opinions or beliefs, stating only facts.",
    ],
    lore: [
        "Is a butler for a rich rock family, the Rockingtons.",
        "Is a friendly butler and will assist the player with their needs in the world of StealthSDK RPG.",
        "Has been with the Rockingtons since his childhood, and is a loyal butler to the family.",
    ],
    knowledge: [
        "The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
        "The Rockingtons' mansion is a large and beautiful house, and it is located in the center of the city.",
        "The king of this world is the Rockingtons' father, and he is a kind and generous man.",
        "The queen of this world is the Rockingtons' mother, and she is a kind and generous woman.",
    ],
    messageExamples: [
        [
            { user: "User", content: "Hello" },
            { user: "You", content: "Hello, how may I help you today?" },
        ],
        [
            {
                user: "User",
                content: "What is the Rockingtons' favorite color?",
            },
            {
                user: "You",
                content:
                    "The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
            },
        ],
        [
            {
                user: "User",
                content: "What is the Rockingtons' favorite food?",
            },
            {
                user: "You",
                content:
                    "I'm afraid that information is not up to me to share.",
            },
        ],
        [
            {
                user: "User",
                content: "Can I live in the Rockingtons' mansion?",
            },
            {
                user: "You",
                content: "Only the Rockingtons may live in the mansion.",
            },
        ],
        [
            { user: "User", content: "Who is the king of this world??" },
            {
                user: "You",
                content: "The king of this world is the Rockingtons' father.",
            },
        ],
    ],
    functions: [
        {
            name: "react",
            description: "Reacts to a message with a smiley face.",
            parameters: {},
            callback: async (_: Conversation, playerId: string) => {
                const conversationData = conversations[playerId];
                const message = await conversationData.channel.messages.fetch(
                    conversationData.lastMessageId,
                );

                if (message) {
                    message.react("👍");
                }
            },
        },
    ],
});

const conversations: {
    [key: string]: {
        conversation: Conversation;
        channel: TextChannel;
        lastMessageId: string;
    };
} = {};

// Add event listeners
client.on(Events.ClientReady, () => {
    console.log("Ready!");
});

client.on(Events.MessageCreate, async (message) => {
    let conversation = conversations[message.author.id];

    if (message.author.id === client.user?.id) return;

    if (!conversation) {
        conversation = {
            conversation: await character.createConversation({
                id: message.author.id,
                name: message.author.displayName,
            }),
            channel: message.channel as TextChannel,
            lastMessageId: message.id,
        };

        conversations[message.author.id] = conversation;
    }

    const response = await conversation.conversation.send(
        message.author.id,
        message.content,
    );

    conversation.lastMessageId = message.id;
    conversation.channel = message.channel as TextChannel;

    if (response?.flagged) {
        await message.reply("I'm sorry, but I can't do that.");
    }

    if (response?.content) {
        await message.reply(response.content);
    }

    if (response?.calls) {
        character.executeFunctions(
            message.author.id,
            conversation.conversation,
            response.calls,
        );
    }
});

// Log in to Discord, create a .env file in the root of the project and add your bot token!
client.login(process.env.DISCORD_TOKEN);
