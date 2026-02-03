export interface ApiResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}
export declare function callAPI(method: string, path: string, body?: unknown): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
