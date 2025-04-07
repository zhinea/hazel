import { mergeDeep } from "@/utils/common";

class StateManager {
    public state: Record<string, any> = {};

    get(name: string, defaultValue?: any){
        return this.state[name] || defaultValue;
    }

    set(name: string, value: any){
        this.state[name] = value;
    }

    // merge deep update
    update(name: string, data: any){
        this.state[name] = mergeDeep(this.state[name], data);
    }
}

export const stateManager = new StateManager();