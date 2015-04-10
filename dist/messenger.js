define(["require", "exports"], function (require, exports) {
    var priority = 1, subscriptions = {};
    function sortFunction(a, b) {
        return a.priority - b.priority;
    }
    /** Publish message with specified options in the given topic */
    function publish(topic) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!subscriptions[topic]) {
            return true;
        }
        var subs = subscriptions[topic], _subscriptions = subs.sort(sortFunction), result = true, i = 0, len = subs.length, sub;
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
    exports.publish = publish;
    /** Publish message with specified options in the given topic */
    function subscribe(topic, callback, options) {
        if (!topic || !callback) {
            throw new Error("missing topic or callback argument");
        }
        if (!options) {
            options = {};
        }
        if (typeof options.priority === "undefined") {
            options.priority = priority;
        }
        topic.split(/\s/g).forEach(function (t) {
            if (!subscriptions[t]) {
                subscriptions[t] = [];
            }
            subscriptions[t].push({
                callback: callback,
                context: options.context,
                priority: options.priority,
                once: options.once
            });
        });
    }
    exports.subscribe = subscribe;
    /** Subscribe for the next iteration of the specified topic with given callback and options */
    function subscribeNext(topic, callback, options) {
        if (!options) {
            options = {};
        }
        options.once = true;
        this.subscribe(topic, callback, options);
    }
    exports.subscribeNext = subscribeNext;
    /** Publish message with specified options in the given topic */
    function unsubscribe(topic, callback) {
        if (!subscriptions[topic]) {
            return;
        }
        var subs = subscriptions[topic], i = 0, len = subs.length, sub;
        for (; i < len; i++) {
            sub = subs[i];
            if (sub.callback === callback) {
                subs.splice(i, 1);
                break;
            }
        }
    }
    exports.unsubscribe = unsubscribe;
});
