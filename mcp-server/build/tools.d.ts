export declare const tools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            workspaceId: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            workspaceId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            icon?: undefined;
            id?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            icon?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            scope: {
                type: string;
                description: string;
            };
            projectId: {
                type: string;
                description: string;
            };
            workspaceId: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            scope: {
                type: string;
                description: string;
            };
            workspaceId: {
                type: string;
                description: string;
            };
            projectId: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            fields: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                            description: string;
                        };
                        name: {
                            type: string;
                            description: string;
                        };
                        type: {
                            type: string;
                            description: string;
                        };
                        options: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    id: {
                                        type: string;
                                    };
                                    label: {
                                        type: string;
                                    };
                                    color: {
                                        type: string;
                                    };
                                };
                                required: string[];
                            };
                            description: string;
                        };
                        required: {
                            type: string;
                            description: string;
                        };
                        relationObjectId: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            id?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            fields: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                            description: string;
                        };
                        name: {
                            type: string;
                            description: string;
                        };
                        type: {
                            type: string;
                            description: string;
                        };
                        options: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    id: {
                                        type: string;
                                    };
                                    label: {
                                        type: string;
                                    };
                                    color: {
                                        type: string;
                                    };
                                };
                                required: string[];
                            };
                            description: string;
                        };
                        required: {
                            type: string;
                            description: string;
                        };
                        relationObjectId: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            objectId: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            objectId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            projectId: {
                type: string;
                description: string;
            };
            fieldValues: {
                type: string;
                description: string;
            };
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            fields?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            fieldValues: {
                type: string;
                description: string;
            };
            icon?: undefined;
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            itemId: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            itemId: {
                type: string;
                description: string;
            };
            nodes: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                            description: string;
                        };
                        content: {
                            type: string;
                            description: string;
                        };
                        parentId: {
                            type: string[];
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            itemId: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            parentId: {
                type: string[];
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            nodes?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectId: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
            };
            category?: undefined;
            id?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            icon: {
                type: string;
                description: string;
            };
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
            type?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            content?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            name?: undefined;
            icon?: undefined;
            category?: undefined;
            workspaceId?: undefined;
            scope?: undefined;
            projectId?: undefined;
            fields?: undefined;
            objectId?: undefined;
            fieldValues?: undefined;
            itemId?: undefined;
            nodes?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
