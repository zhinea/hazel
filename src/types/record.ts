
export interface Record {
    id: string
    name: string
    description?: string
    options: RecordOptions
    createdAt?: Date
    color?: string
}

export interface RecordOptionValue <T extends 'boolean' | 'string' | 'number'>{
    type: T,
    meta:  {
        value?: T extends 'boolean' ? boolean : T extends 'string' ? string : T extends 'number' ? number : never
    }
}

export const RecordOption = {
    BYPASS_CAPTCHA: 'bypassCaptcha',
    XHR_INTERCEPT: 'xhrIntercept',
    MULTI_TAB: 'multiTab',
    MAGIC_SCRAPE: 'magicScrape',
}

export interface RecordOptions {
    [RecordOption.BYPASS_CAPTCHA]: RecordOptionValue<'boolean'>,
    [RecordOption.XHR_INTERCEPT]: RecordOptionValue<'boolean'>,
    [RecordOption.MULTI_TAB]: RecordOptionValue<'boolean'>,
    [RecordOption.MAGIC_SCRAPE]: RecordOptionValue<'boolean'>,
}

export const CustomVariableTypes = {
    STATIC: 'static',
    AI: 'ai',
    API: 'api',
}
export type CustomVariableType = typeof CustomVariableTypes[keyof typeof CustomVariableTypes]

export interface CustomVariable<T extends CustomVariableType = CustomVariableType> {
    id: string
    name: string
    type: CustomVariableType
    meta?: {
        api?: {
            url?: string;
            extractPath?: string;
            verified?: boolean | null ;
        };
        prompt?: string;
        value?: string;
    }
}

export const EventType = {
    CLICK: 'click',
    INITIAL_STATE: 'initial-state',
    SCROLL: 'scroll',
    INPUT: 'input',
    PING: 'ping',

    CREATE_TAB: 'create-tab',
    CLOSE_TAB: 'close-tab',
    CHANGE_TAB: 'change-tab',
    ACTIVE_TAB: 'active-tab',
}

export type EventTypes = typeof EventType[keyof typeof EventType]

export type IEvent = {
    id: string;
    type: EventTypes;
    tabId: string|number;
    data: {
        url?: string;
        selector?: {
            type: 'xpath' | 'css';
            path: string; // Path selector
            tagname: string;
            targetType?: string;
            targetValue?: string;
            attributes: {
                [key: string]: string;
            };
        };

        type?: string;
        incognito?: string;
        newTab?: boolean;
        windowState?: string;

        [EventType.SCROLL]?: {
            scrollX: number;
            scrollY: number;
        };
        value?: string|number;
    }
    timestamp: number;
    sequence: number;
}