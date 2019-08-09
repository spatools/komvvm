export interface SubscribeOptions {
    context?: any;
    priority?: number;
    once?: boolean;
}
/** Publish message with specified options in the given topic */
export declare function publish(topic: string, ...args: any[]): boolean;
/** Publish message with specified options in the given topic */
export declare function subscribe(topic: string, callback: Function, options?: SubscribeOptions): void;
/** Subscribe for the next iteration of the specified topic with given callback and options */
export declare function subscribeNext(topic: string, callback: Function, options?: SubscribeOptions): void;
/** Publish message with specified options in the given topic */
export declare function unsubscribe(topic: string, callback: Function): void;
