(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "knockout", "./messenger"], factory);
    }
})(function (require, exports) {
    "use strict";
    var ko = require("knockout");
    var messenger = require("./messenger");
    var unwrap = ko.unwrap;
    /** Create an async operation which result can be cached and progress can be tracked */
    function Operation(options) {
        var cache = options.cache || false, cacheDuration = options.cacheDuration || 60 * 5, useArgs = options.useArguments || false, message = options.message || null, isExecuting = ko.observable(false), progress = ko.observable(0), progressDetails = ko.observable({}), error = ko.observable(""), errorDetails = ko.observable({}), hasError = ko.pureComputed(function () { return !isNullOrWhiteSpace(error()); });
        var lastExecution = null, memory = null;
        var self = execute;
        self.isExecuting = isExecuting;
        self.progress = progress;
        self.progressDetails = progressDetails;
        self.error = error;
        self.errorDetails = errorDetails;
        self.hasError = hasError;
        if (message) {
            messenger.subscribe(message + "Request", self.bind(self));
        }
        return self;
        function execute() {
            var args = [onComplete, onError, onProgress];
            progress(-1);
            isExecuting(true);
            if (cache === true && !!lastExecution) {
                if (lastExecution + cacheDuration < Date.now()) {
                    return onComplete.apply(this, memory);
                }
                else {
                    lastExecution = memory = null;
                }
            }
            if (useArgs)
                args.unshift(Array.prototype.slice.call(arguments, 0));
            if (isFunction(options.execute)) {
                options.execute.apply(this, args);
            }
        }
        function onComplete() {
            var args = Array.prototype.slice.call(arguments, 0);
            if (isFunction(options.complete))
                options.complete.apply(this, args);
            if (message)
                messenger.publish(message + "Response", args);
            if (cache === true && !lastExecution) {
                memory = args;
                lastExecution = Date.now();
            }
            isExecuting(false);
            error("");
            errorDetails({});
            progress(0);
            progressDetails({});
        }
        function onError(err, errDetails) {
            if (isFunction(options.error)) {
                options.error.apply(this, arguments);
            }
            error(err);
            errorDetails(errDetails);
            isExecuting(false);
        }
        function onProgress(progr, pogrDetails) {
            if (isFunction(options.progress))
                options.progress.apply(this, arguments);
            progress(progr);
            progressDetails(progressDetails);
        }
    }
    ko.bindingHandlers.loader = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = unwrap(valueAccessor()), template = unwrap(value.template);
            if (template) {
                ko.renderTemplate(template, bindingContext, {}, element);
                return { controlsDescendantBindings: true };
            }
        },
        update: function (element, valueAccessor) {
            var value = unwrap(valueAccessor()), valueType = typeof value;
            var operations = [], isVisible;
            if (typeof value === "boolean") {
                isVisible = value;
            }
            else if (Array.isArray(value)) {
                operations = value;
            }
            else {
                isVisible = unwrap(value.isVisible);
                operations = unwrap(value.operations) || [];
                var op = unwrap(value.operation);
                op && operations.push(op);
            }
            if (typeof isVisible === "undefined" || isVisible === null) {
                isVisible = operations.some(function (op) { return op.isExecuting(); });
            }
            ko.bindingHandlers.visible.update(element, function () { return isVisible; });
        }
    };
    function isFunction(fn) {
        return typeof fn === "function";
    }
    function isNullOrWhiteSpace(value) {
        return !value || (/^\s*$/).test(value);
    }
    return Operation;
});
