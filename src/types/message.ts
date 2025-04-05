
export type IncommingMessage = {
    action: string;

    [key: string]: any;
}

export type BasicResponseServer<T> = {
    status: boolean;
    data?: T;
    message?: string;
}