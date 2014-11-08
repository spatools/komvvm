define(["require", "exports", "underscore", "koutils/underscore"], function(require, exports, _) {
    var priority = 1, subscriptions = {};

    function publish(topic) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if (!subscriptions[topic]) {
            return true;
        }

        var _subscriptions = _.sortBy(subscriptions[topic], function (s) {
            return s.priority;
        }), indexFunction = function (s) {
            return s.once;
        }, result, index;

        _.find(_subscriptions, function (subscription) {
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
    exports.publish = publish;

    function subscribe(topic, callback, options) {
        if (!topic || !callback) {
            throw new Error("missing topic or callback argument");
        }

        var topics = topic.split(/\s/), _options = _.extend({ priority: priority }, options);

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
    exports.subscribe = subscribe;

    function subscribeNext(topic, callback, options) {
        var _options = _.extend({ once: true }, options);
        exports.subscribe(topic, callback, _options);
    }
    exports.subscribeNext = subscribeNext;

    function unsubscribe(topic, callback) {
        if (!subscriptions[topic]) {
            return;
        }

        var index = _.index(subscriptions[topic], function (sub) {
            return sub.callback === callback;
        });

        if (index !== -1) {
            subscriptions[topic].splice(index, 1);
        }
    }
    exports.unsubscribe = unsubscribe;
});
