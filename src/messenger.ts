/// <reference path="../_definitions.d.ts" />
/// <amd-dependency path="koutils/underscore" />

import _ = require("underscore");

var priority: number = 1,
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

/** Publish message with specified options in the given topic */
export function publish(topic: string, ...args: any[]): boolean {
    if (!subscriptions[topic]) {
        return true;
    }

    var _subscriptions = _.sortBy(subscriptions[topic], s => s.priority),
        indexFunction = s => s.once,
        result, index;

    _.find(_subscriptions, (subscription: Subscription) => {
        result = subscription.callback.apply(subscription.context, args);
        return result === false;
    });

    while (index !== -1) {
        index = _.index(subscriptions[topic], indexFunction);
        if (index !== -1)
            subscriptions[topic].splice(index, 1);
    }

    return result !== false;
}

/** Publish message with specified options in the given topic */
export function subscribe(topic: string, callback: Function, options?: SubscribeOptions): void {
    if (!topic || !callback) {
        throw new Error("missing topic or callback argument");
    }

    var topics = topic.split(/\s/),
        _options = _.extend({ priority: priority }, options);

    _.each(topics, function (t) {
        if (!subscriptions[topic]) {
            subscriptions[topic] = [];
        }

        subscriptions[topic].push({
            callback: callback,
            context: _options.context,
            priority: _options.priority,
            once: _options.once
        });
    });
}

/** Subscribe for the next iteration of the specified topic with given callback and options */
export function subscribeNext(topic: string, callback: Function, options?: SubscribeOptions): void {
    if (!options) {
        options = {};
    }
    options.once = true;

    this.subscribe(topic, callback, options);
}

/** Publish message with specified options in the given topic */
export function unsubscribe(topic: string, callback: Function) {
    if (!subscriptions[topic]) {
        return;
    }

    var index = _.index(subscriptions[topic], sub => sub.callback === callback);

    if (index !== -1) {
        subscriptions[topic].splice(index, 1);
    }
}
