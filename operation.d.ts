import * as ko from "knockout";
/** Create an async operation which result can be cached and progress can be tracked */
declare function Operation(options: Operation.OperationOptions): Operation.OperationFunction;
declare namespace Operation {
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
        isExecuting: ko.Observable<boolean>;
        progress: ko.Observable<number>;
        progressDetails: ko.Observable<any>;
        error: ko.Observable<string>;
        errorDetails: ko.Observable<any>;
        hasError: ko.PureComputed<boolean>;
    }
    type BindingHandlerOptions = ko.MaybeSubscribable<boolean | OperationFunction[] | BindingHandlerObjectOptions>;
    interface BindingHandlerObjectOptions {
        template?: ko.MaybeSubscribable<string | Node | null | undefined>;
        isVisible?: ko.MaybeSubscribable<boolean | null | undefined>;
        operations?: ko.MaybeSubscribable<OperationFunction[] | null | undefined>;
        operation?: ko.MaybeSubscribable<OperationFunction | null | undefined>;
    }
}
declare module "knockout" {
    interface BindingHandlers {
        loader: {
            init(element: HTMLElement, valueAccessor: () => Operation.BindingHandlerOptions, allBindingsAccessor: any, viewModel: any, bindingContext: BindingContext): void | BindingHandlerControlsDescendant;
            update(element: HTMLElement, valueAccessor: () => Operation.BindingHandlerOptions): void;
        };
    }
}
export = Operation;
