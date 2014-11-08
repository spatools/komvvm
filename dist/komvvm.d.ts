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

declare module "koutils/commands" {
export interface CommandOptions {
    execute($data: any): any;
    canExecute?(): boolean;
    context?: any;
}
export interface AsyncCommandOptions {
    execute($data: any, complete: () => void): any;
    canExecute?(isExecuting: boolean): boolean;
    context?: any;
}
export class Command {
    private canExecuteCallback;
    private executeCallback;
    private context;
    canExecute: KnockoutComputed<boolean>;
    constructor(options: CommandOptions);
    execute($data?: any): void;
}
export class AsyncCommand {
    private canExecuteCallback;
    private executeCallback;
    private context;
    isExecuting: KnockoutObservable<boolean>;
    canExecute: KnockoutComputed<boolean>;
    constructor(options: AsyncCommandOptions);
    private completeCallback();
    execute($data?: any): void;
}
}

declare module "koutils/messenger" {
export interface SubscribeOptions {
    context?: any;
    priority?: number;
    once?: boolean;
}
/** Publish message with specified options in the given topic */
export function publish(topic: string, ...args: any[]): boolean;
/** Publish message with specified options in the given topic */
export function subscribe(topic: string, callback: Function, options?: SubscribeOptions): void;
/** Subscribe for the next iteration of the specified topic with given callback and options */
export function subscribeNext(topic: string, callback: Function, options?: SubscribeOptions): void;
/** Publish message with specified options in the given topic */
export function unsubscribe(topic: string, callback: Function): void;
}

declare module "koutils/operation" {
/** Create an async operation which result can be cached and progress can be tracked */
function Operation(options: OperationOptions): OperationFunction;
export = Operation;
}
