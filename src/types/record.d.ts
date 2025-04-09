
export interface Record {
    id: string
    title: string
    description: string
    createdAt: Date
    color?: string
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
        endpoint?: string;
        extractPath?: string;
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