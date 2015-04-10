define(["require", "exports", "knockout", "./messenger", "koutils/utils"], function (require, exports, ko, messenger, utils) {
    /** Create an async operation which result can be cached and progress can be tracked */
    function Operation(options) {
        var cache = options.cache || false, cacheDuration = options.cacheDuration || 60 * 5, useArgs = options.useArguments || false, message = options.message || null, lastExecution = null, memory = null, isExecuting = ko.observable(false), progress = ko.observable(0), progressDetails = ko.observable({}), error = ko.observable(""), errorDetails = ko.observable({}), hasError = ko.computed(function () { return utils.isNullOrWhiteSpace(error()); }), onComplete = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            if (utils.is(options.complete, "function"))
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
        }, onError = function (_error, _errorDetails) {
            if (utils.is(options.error, "function"))
                options.error.apply(this, arguments);
            error(_error);
            errorDetails(_errorDetails);
            isExecuting(false);
        }, onProgress = function (_progress, _progressDetails) {
            if (utils.is(options.progress, "function"))
                options.progress.apply(this, arguments);
            progress(_progress);
            progressDetails(_progressDetails);
        }, execute = function () {
            var args = [onComplete, onError, onProgress];
            progress(-1);
            isExecuting(true);
            if (cache === true && !!lastExecution) {
                if (lastExecution + cacheDuration < Date.now()) {
                    return onComplete.apply(null, memory);
                }
                else {
                    lastExecution = memory = null;
                }
            }
            if (useArgs)
                args.unshift(Array.prototype.slice.call(arguments, 0));
            if (utils.is(options.execute, "function")) {
                options.execute.apply(this, args);
            }
        };
        if (message)
            messenger.subscribe(message + "Request", execute);
        execute.isExecuting = isExecuting;
        execute.progress = progress;
        execute.progressDetails = progressDetails;
        execute.error = error;
        execute.errorDetails = errorDetails;
        execute.hasError = hasError;
        return execute;
    }
    ko.bindingHandlers.loader = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor()), template = ko.unwrap(value.template);
            if (template) {
                ko.renderTemplate(template, bindingContext, {}, element);
                return { controlsDescendantBindings: true };
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.unwrap(valueAccessor()), valueType = typeof value, operations, isVisible;
            if (valueType === "boolean")
                isVisible = value;
            else if (valueType === "array")
                operations = value;
            else {
                isVisible = ko.unwrap(value.isVisible);
                operations = value.operations ? ko.unwrap(value.operations) : [];
                if (value.operation)
                    operations.push(ko.unwrap(value.operation));
            }
            if (utils.isNullOrUndefined(isVisible)) {
                isVisible = operations.some(function (op) { return op.isExecuting(); });
            }
            ko.bindingHandlers.visible.update(element, utils.createAccessor(isVisible), allBindingsAccessor, viewModel, bindingContext);
        }
    };
    return Operation;
});
