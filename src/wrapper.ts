import axios from "axios";
import { setConfig } from "openblox/config";
import {
    StandardDataStoresApi_V2,
    OrderedDataStoresApi_V2,
} from "openblox/cloud";
import { Identifier } from "openblox/types";

export interface SDKData {
    url: string; // URL of the chatbot API
    auth: string; // Authorization token
    openCloudKey?: string; // OpenCloud key for Roblox APIs
}

export interface FunctionParameter {
    name: string; // Name of the parameter
    description: string; // Description of what the parameter does
    type: "string" | "number" | "boolean"; // Type of the parameter
}

export interface User {
    id: string; // Unique user ID
    name: string; // User name
}

export interface ConversationData {
    id: string; // Unique conversation ID
    secret: string; // Secret token for the conversation
}

interface DatastoreData {
    type: "standard" | "ordered";
    universeId: Identifier;
    datastoreName: string;
    entryKey: string;
    scope?: string;
    fieldsMutator?: (fields: any) => Record<string, any>;
    fieldName?: string;
}

interface Context {
    datastores?: DatastoreData[];
    [key: string]: any;
}

export class ConversationWrapper {
    private wrapperData: SDKData = {} as SDKData;

    constructor(data: SDKData) {
        this.wrapperData = data;
        setConfig({ cloudKey: data.openCloudKey });
    }

    private formatDictionary(
        dictionary: Record<string, any>,
    ): Array<{ key: string; value: any }> {
        return Object.entries(dictionary).map(([key, value]) => ({
            key,
            value,
        }));
    }

    async create(
        character: any,
        users: User[] = [],
        persistenceToken?: string,
    ): Promise<ConversationData | null> {
        try {
            const response = await axios.post(
                `${this.wrapperData.url}/api/create`,
                {
                    persistenceToken,
                    character,
                    users,
                },
                { headers: { Authorization: this.wrapperData.auth } },
            );

            if (!response.data) {
                throw new Error("No response data received");
            }

            return response.data;
        } catch (error) {
            console.warn(
                "Failed to create conversation:",
                (error as Error).message,
            );
            return null;
        }
    }

    async send(
        conversation: ConversationData,
        message: string,
        context: Context = {},
        userId: string,
    ): Promise<{
        flagged: boolean;
        cancelled: boolean;
        content: string;
        calls: {
            name: string;
            parameters: Record<string, any>;
        }[];
    } | null> {
        if (context.datastores) {
            const datastoresData = context.datastores;
            delete context.datastores;

            for (const datastoreData of datastoresData) {
                try {
                    if (datastoreData.type === "standard") {
                        const { data } =
                            await StandardDataStoresApi_V2.standardDataStoreEntry(
                                {
                                    dataStore: datastoreData.datastoreName,
                                    universeId:
                                        datastoreData.universeId as Identifier,
                                    entryId: datastoreData.entryKey,
                                    scope: datastoreData.scope || "",
                                },
                            );
                        if (data?.value) {
                            let fields = data.value;
                            if (datastoreData.fieldsMutator) {
                                fields = datastoreData.fieldsMutator(fields);

                                for (const [key, value] of Object.entries(
                                    fields,
                                )) {
                                    if (value === undefined) {
                                        delete fields[key];
                                    }
                                }
                            }
                            Object.assign(context, fields);
                        }
                    } else if (datastoreData.type === "ordered") {
                        const { data } =
                            await OrderedDataStoresApi_V2.orderedDataStoreEntry(
                                {
                                    dataStoreId: datastoreData.datastoreName,
                                    universeId:
                                        datastoreData.universeId as Identifier,
                                    entryId: datastoreData.entryKey,
                                    scope: datastoreData.scope || "",
                                },
                            );
                        if (data) {
                            const fieldName = this.extractFieldNameFromPath(
                                data.path,
                            );
                            context[fieldName] = data.value;
                        }
                    }
                } catch (error) {
                    console.warn(
                        `Failed to fetch ${datastoreData.type} datastore:`,
                        (error as Error).message,
                    );
                }
            }
        }

        try {
            const response = await axios.post(
                `${this.wrapperData.url}/api/send`,
                {
                    secret: conversation.secret,
                    context: Object.keys(context).length
                        ? this.formatDictionary(context)
                        : [],
                    message,
                    playerId: userId,
                },
                { headers: { Authorization: this.wrapperData.auth } },
            );
            return response.data;
        } catch (error) {
            console.warn(
                `Failed to send message to conversation ${conversation.id}:`,
                (error as Error).message,
            );
            return null;
        }
    }

    async update(
        conversation: ConversationData,
        users: User[] = [],
    ): Promise<boolean> {
        try {
            await axios.post(
                `${this.wrapperData.url}/api/update`,
                { secret: conversation.secret, users },
                { headers: { Authorization: this.wrapperData.auth } },
            );
            return true;
        } catch (error) {
            console.warn(
                `Failed to update conversation ${conversation.id}:`,
                (error as Error).message,
            );
            return false;
        }
    }

    async finish(conversation: ConversationData): Promise<boolean> {
        try {
            await axios.post(
                `${this.wrapperData.url}/api/finish`,
                { secret: conversation.secret },
                { headers: { Authorization: this.wrapperData.auth } },
            );
            return true;
        } catch (error) {
            console.warn(
                `Failed to finish conversation ${conversation.id}:`,
                (error as Error).message,
            );
            return false;
        }
    }

    private extractFieldNameFromPath(path: string): string {
        const parts = path.split("/");
        return parts[parts.length - 1];
    }
}
