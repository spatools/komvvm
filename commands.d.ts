import * as ko from "knockout";
export declare type Thenable<T = any> = PromiseLike<T> | {
    then: (resolve: Function, reject: Function) => void;
};
export declare type AsyncExecuteCallback = ((complete?: () => void) => any) | (($data: any, complete?: () => void) => any);
export declare type AsyncThenableCallback = ($data?: any) => Thenable;
export declare type AsyncCommandCallback = AsyncExecuteCallback | AsyncThenableCallback;
export interface CommandOptions {
    execute($data: any): any;
    canExecute?(): boolean;
    context?: any;
}
export declare class Command {
    private canExecuteCallback?;
    private executeCallback;
    private context;
    canExecute: ko.Computed<boolean>;
    constructor(options: CommandOptions);
    execute($data?: any): void;
}
export interface AsyncCommandOptions {
    execute: AsyncCommandCallback;
    canExecute?(isExecuting: boolean): boolean;
    context?: any;
    usePromise?: boolean;
}
export declare class AsyncCommand {
    private canExecuteCallback?;
    private executeCallback;
    private context;
    private usePromise;
    isExecuting: ko.Observable<boolean>;
    canExecute: ko.Computed<boolean>;
    constructor(options: AsyncCommandOptions);
    private completeCallback;
    execute($data?: any): void;
}
export interface PromiseCommandOptions {
    execute: AsyncThenableCallback;
    canExecute?(isExecuting: boolean): boolean;
    context?: any;
}
export declare class PromiseCommand {
    private canExecuteCallback?;
    private executeCallback;
    private context;
    isExecuting: ko.Observable<boolean>;
    canExecute: ko.Computed<boolean>;
    constructor(options: AsyncCommandOptions);
    private completeCallback;
    execute($data?: any): void;
}
export declare type BindingHandlerOptions = Command | AsyncCommand | PromiseCommand | {
    [key: string]: Command | AsyncCommand | PromiseCommand;
};
declare module "knockout" {
    interface BindingHandlers {
        command: {
            init(element: HTMLElement, valueAccessor: () => BindingHandlerOptions, allBindingsAccessor: any, viewModel: any, bindingContext: BindingContext): void | BindingHandlerControlsDescendant;
            update(element: HTMLElement, valueAccessor: () => BindingHandlerOptions): void;
        };
    }
}
