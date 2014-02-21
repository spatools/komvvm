/// <reference path="../../../typings/knockout/knockout.d.ts" />
/// <reference path="../../../typings/underscore/underscore.d.ts" />

interface OperationOptions {
    useArguments?: boolean;
    cache?: boolean;
    cacheDuration?: number;
    message?: string;

    execute: () => any;
    complete: () => any;
    error: () => any;
    progress: () => any;
}

interface OperationFunction extends Function {
    isExecuting: KnockoutObservable<boolean>;
    progress: KnockoutObservable<number>;
    progressDetails: KnockoutObservable<any>;
    error: KnockoutObservable<string>;
    errorDetails: KnockoutObservable<any>;
    hasError: KnockoutObservable<boolean>;
}

interface KnockoutBindingHandlers {
    loader: KnockoutBindingHandler;
}

