const
    PRIORITY = 1,

    subscriptions: { [key: string]: Subscription[] } = {};

interface Subscription {
    priority: number;
    context: any;
    callback: Function;
    once?: boolean;
}

export interface SubscribeOptions {
    context?: any;
    priority?: number;
    once?: boolean;
}

function sortFunction(a: Subscription, b: Subscription): number {
    return a.priority - b.priority;
}

/** Publish message with specified options in the given topic */
export function publish(topic: string, ...args: any[]): boolean {
    if (!subscriptions[topic]) {
        return true;
    }

    const
        subs = subscriptions[topic],
        _subscriptions = subs.sort(sortFunction),
        len = subs.length;

    let i = 0,
        result = true,
        sub: Subscription;

    for (; i < len; i++) {
        sub = _subscriptions[i];

        if (sub.callback.apply(sub.context, args) === false) {
            result = false;
            break;
        }
    }

    i = 0;
    sub = subs[0];

    while (!!sub) {
        if (sub.once) {
            subs.splice(i, 1);
            sub = subs[i];
        }
        else {
            sub = subs[++i];
        }
    }

    return result;
}

/** Publish message with specified options in the given topic */
export function subscribe(topic: string, callback: Function, options: SubscribeOptions = {}): void {
    if (!topic || !callback) {
        throw new Error("missing topic or callback argument");
    }

    const priority =
        typeof options.priority === "number" ?
            options.priority :
            PRIORITY;

    topic.split(/\s/g).forEach(t => {
        if (!subscriptions[t]) {
            subscriptions[t] = [];
        }

        subscriptions[t].push({
            callback: callback,
            context: options.context,
            priority: priority,
            once: options.once
        });
    });
}

/** Subscribe for the next iteration of the specified topic with given callback and options */
export function subscribeNext(topic: string, callback: Function, options: SubscribeOptions = {}): void {
    options.once = true;

    subscribe(topic, callback, options);
}

/** Publish message with specified options in the given topic */
export function unsubscribe(topic: string, callback: Function): void {
    if (!subscriptions[topic]) {
        return;
    }

    const
        subs = subscriptions[topic],
        len = subs.length;

    let i = 0, sub: Subscription;
    for (; i < len; i++) {
        sub = subs[i];

        if (sub.callback === callback) {
            subs.splice(i, 1);
            break;
        }
    }
}
