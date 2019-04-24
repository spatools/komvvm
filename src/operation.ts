import * as ko from "knockout";

import * as messenger from "./messenger";

const unwrap = ko.unwrap;

/** Create an async operation which result can be cached and progress can be tracked */
function Operation(options: Operation.OperationOptions): Operation.OperationFunction {
    const
        cache = options.cache || false,
        cacheDuration = options.cacheDuration || 60 * 5,
        useArgs = options.useArguments || false,
        message = options.message || null,

        isExecuting = ko.observable(false),
        progress = ko.observable(0),
        progressDetails = ko.observable({}),
        error = ko.observable(""),
        errorDetails = ko.observable({}),

        hasError = ko.pureComputed(() => !isNullOrWhiteSpace(error()));

    let
        lastExecution: number | null = null,
        memory: any[] | null = null;

    const self = execute as any as Operation.OperationFunction;

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

    function execute(this: Operation.OperationFunction) {
        const args = [onComplete, onError, onProgress] as any[];
        progress(-1);
        isExecuting(true);

        if (cache === true && !!lastExecution) {
            if (lastExecution + cacheDuration < Date.now()) {
                return onComplete.apply(this, memory as any);
            } else {
                lastExecution = memory = null;
            }
        }

        if (useArgs)
            args.unshift(Array.prototype.slice.call(arguments, 0));

        if (isFunction(options.execute)) {
            options.execute.apply(this, args as any);
        }
    }

    function onComplete(this: Operation.OperationFunction): void {
        const args = Array.prototype.slice.call(arguments, 0);

        if (isFunction(options.complete))
            options.complete.apply(this, args as any);

        if (message)
            messenger.publish(message + "Response", args);

        if (cache === true && !lastExecution) {
            memory = args;
            lastExecution = Date.now();
        }

        isExecuting(false);
        error(""); errorDetails({});
        progress(0); progressDetails({});
    }

    function onError(this: Operation.OperationFunction, err: string, errDetails: any): void {
        if (isFunction(options.error)) {
            options.error.apply(this, arguments as any);
        }

        error(err);
        errorDetails(errDetails);
        isExecuting(false);
    }

    function onProgress(this: Operation.OperationFunction, progr: number, pogrDetails: any): void {
        if (isFunction(options.progress))
            options.progress.apply(this, arguments as any);

        progress(progr);
        progressDetails(progressDetails);
    }
}

namespace Operation {
    export interface OperationOptions {
        useArguments?: boolean;
        cache?: boolean;
        cacheDuration?: number;
        message?: string;

        execute: () => any;
        complete: () => any;
        error: () => any;
        progress: () => any;
    }

    export interface OperationFunction extends Function {
        isExecuting: ko.Observable<boolean>;
        progress: ko.Observable<number>;
        progressDetails: ko.Observable<any>;
        error: ko.Observable<string>;
        errorDetails: ko.Observable<any>;
        hasError: ko.PureComputed<boolean>;
    }

    export type BindingHandlerOptions = ko.MaybeSubscribable<boolean | OperationFunction[] | BindingHandlerObjectOptions>;

    export interface BindingHandlerObjectOptions {
        template?: ko.MaybeSubscribable<string | Node | null | undefined>;
        isVisible?: ko.MaybeSubscribable<boolean | null | undefined>;
        operations?: ko.MaybeSubscribable<OperationFunction[] | null | undefined>;
        operation?: ko.MaybeSubscribable<OperationFunction | null | undefined>;
    }

}

declare module "knockout" {
    export interface BindingHandlers {
        loader: {
            init(element: HTMLElement, valueAccessor: () => Operation.BindingHandlerOptions, allBindingsAccessor: any, viewModel: any, bindingContext: BindingContext): void | BindingHandlerControlsDescendant;
            update(element: HTMLElement, valueAccessor: () => Operation.BindingHandlerOptions): void;
        }
    }
}

ko.bindingHandlers.loader = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const
            value = unwrap(valueAccessor()) as any,
            template = unwrap(value.template);

        if (template) {
            ko.renderTemplate(template, bindingContext, {}, element);
            return { controlsDescendantBindings: true };
        }
    },
    update(element, valueAccessor) {
        const
            value = unwrap(valueAccessor()),
            valueType = typeof value;

        let operations = [] as Operation.OperationFunction[],
            isVisible: boolean | null | undefined;

        if (typeof value === "boolean") {
            isVisible = value;
        }
        else if (Array.isArray(value)) {
            operations = value;
        }
        else {
            isVisible = unwrap(value.isVisible);
            operations = unwrap(value.operations) || [];

            let op = unwrap(value.operation);
            op && operations.push(op);
        }

        if (typeof isVisible === "undefined" || isVisible === null) {
            isVisible = operations.some(op => op.isExecuting());
        }

        ko.bindingHandlers.visible.update(element, () => isVisible);
    }
};

export = Operation;

function isFunction(fn: any): fn is Function {
    return typeof fn === "function";
}

function isNullOrWhiteSpace(value: string): boolean {
    return !value || (/^\s*$/).test(value);
}
