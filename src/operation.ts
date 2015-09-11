import ko = require("knockout");
import messenger = require("./messenger");

function isFunction(fn: any): boolean {
    return typeof fn === "function";
}

function isNullOrWhiteSpace(value: string): boolean {
    return !value || (/^\s*$/).test(value);
}

/** Create an async operation which result can be cached and progress can be tracked */
function Operation(options: OperationOptions): OperationFunction {
    var
        cache = options.cache || false,
        cacheDuration = options.cacheDuration || 60 * 5,
        useArgs = options.useArguments || false,
        message = options.message || null,

        lastExecution = null,
        memory = null,

        isExecuting = ko.observable(false),
        progress = ko.observable(0),
        progressDetails = ko.observable({}),
        error = ko.observable(""),
        errorDetails = ko.observable({}),

        hasError = ko.pureComputed(() => !isNullOrWhiteSpace(error())),

        onComplete = function () {
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
            error(""); errorDetails({});
            progress(0); progressDetails({});
        },
        onError = function (_error, _errorDetails) {
            if (isFunction(options.error))
                options.error.apply(this, arguments);

            error(_error);
            errorDetails(_errorDetails);
            isExecuting(false);
        },
        onProgress = function (_progress, _progressDetails) {
            if (isFunction(options.progress))
                options.progress.apply(this, arguments);

            progress(_progress);
            progressDetails(_progressDetails);
        },

        execute: any = function () {
            var args = [onComplete, onError, onProgress];
            progress(-1);
            isExecuting(true);

            if (cache === true && !!lastExecution) {
                if (lastExecution + cacheDuration < Date.now()) {
                    return onComplete.apply(null, memory);
                } else {
                    lastExecution = memory = null;
                }
            }

            if (useArgs)
                args.unshift(Array.prototype.slice.call(arguments, 0));

            if (isFunction(options.execute)) {
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
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = ko.unwrap(valueAccessor()),
            template = ko.unwrap(value.template);

        if (template) {
            ko.renderTemplate(template, bindingContext, {}, element);
            return { controlsDescendantBindings: true };
        }
    },
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = ko.unwrap(valueAccessor()),
            valueType = typeof value,
            operations: Array<OperationFunction>, isVisible: boolean;

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

        if (typeof isVisible === "undefined" || isVisible === null) {
            isVisible = operations.some(op => op.isExecuting());
        }

        ko.bindingHandlers.visible.update(element, () => isVisible, allBindingsAccessor, viewModel, bindingContext);
    }
};

export = Operation;
