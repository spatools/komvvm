import * as ko from "knockout";

export type Thenable<T = any> = PromiseLike<T> | { then: (resolve: Function, reject: Function) => void; };
export type AsyncExecuteCallback = ($data: any, complete?: () => void) => any;
export type AsyncThenableCallback = ($data?: any) => Thenable;
export type AsyncCommandCallback = AsyncExecuteCallback | AsyncThenableCallback;

const bindingHandlers = ko.bindingHandlers;

export interface CommandOptions {
    execute($data: any): any;
    canExecute?(): boolean;
    context?: any;
}

export class Command {
    private canExecuteCallback?: () => boolean;
    private executeCallback: ($data: any) => any;
    private context: any;

    public canExecute: ko.Computed<boolean>;

    constructor(options: CommandOptions) {
        this.canExecuteCallback = options.canExecute;
        this.executeCallback = options.execute;
        this.context = options.context;

        this.canExecute = ko.computed<boolean>(function () {
            return this.canExecuteCallback ? this.canExecuteCallback.call(this.context) : true;
        }, this);
    }

    public execute($data?: any): void {
        if (this.canExecute() === true)
            this.executeCallback.call(this.context, $data);
    }
}

export interface AsyncCommandOptions {
    execute: AsyncCommandCallback;
    canExecute?(isExecuting: boolean): boolean;
    context?: any;
    usePromise?: boolean;
}

export class AsyncCommand {
    private canExecuteCallback?: (isExecuting: boolean) => boolean;
    private executeCallback: AsyncCommandCallback;
    private context: any;
    private usePromise: boolean;

    public isExecuting: ko.Observable<boolean> = ko.observable(false);
    public canExecute: ko.Computed<boolean>;

    constructor(options: AsyncCommandOptions) {
        this.canExecuteCallback = options.canExecute;
        this.executeCallback = options.execute;
        this.context = options.context;
        this.usePromise = options.usePromise || false;

        this.canExecute = ko.computed<boolean>(function () {
            return this.canExecuteCallback ? this.canExecuteCallback.call(this.context, this.isExecuting()) : true;
        }, this);
    }

    private completeCallback(): void {
        this.isExecuting(false);
    }

    public execute($data?: any): void {
        if (this.canExecute() === true) {
            var args = [],
                complete = this.completeCallback.bind(this),
                result: Thenable;

            if (this.executeCallback.length === 2 || this.usePromise)
                args.push($data);

            if (!this.usePromise)
                args.push(complete);

            this.isExecuting(true);

            result = this.executeCallback.apply(this.context, args);
            if (isThenable(result)) result.then(complete, complete);
        }
    }
}

export type BindingHandlerOptions = Command | AsyncCommand | { [key: string]: Command | AsyncCommand };

declare module "knockout" {
    export interface BindingHandlers {
        command: {
            init(element: HTMLElement, valueAccessor: () => BindingHandlerOptions, allBindingsAccessor: any, viewModel: any, bindingContext: BindingContext): void | BindingHandlerControlsDescendant;
            update(element: HTMLElement, valueAccessor: () => BindingHandlerOptions): void;
        }
    }
}

bindingHandlers.command = {
    init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        const
            commands = createCommands(valueAccessor()),

            events = {} as { [key: string]: Function },
            bindings = {} as { [key: string]: Function };

        let hasEvent = false;

        Object.keys(commands).forEach(event => {
            if (event === "default") {
                return;
            }

            const command = commands[event];
            if (isCommand(command)) {
                if (bindingHandlers[event]) {
                    bindings[event] = command.execute.bind(command);
                }
                else {
                    events[event] = command.execute.bind(command);
                    hasEvent = true;
                }
            }
        });

        Object.keys(bindings).forEach(binding => {
            const bindingHandler = bindingHandlers[binding];
            if (bindingHandler && bindingHandler.init) {
                bindingHandler.init(element, createAccessor(bindings[binding]), allBindingsAccessor, viewModel, bindingContext);
            }
        });

        if (hasEvent) {
            bindingHandlers.event.init(element, createAccessor(events), allBindingsAccessor, viewModel, bindingContext);
        }
    },
    update(element, valueAccessor) {
        const
            commands = createCommands(valueAccessor());

        bindingHandlers.enable.update(element, enableAccessor);

        function enableAccessor() {
            if (commands.click) {
                return commands.click.canExecute();
            }

            if (commands.default) {
                return commands.default.canExecute();
            }

            return true;
        }
    }
};

function createCommands(value: BindingHandlerOptions): { [key: string]: Command | AsyncCommand } {
    return isCommand(value) ? { click: value } : value
}

function createAccessor(val: any): () => any {
    return () => val;
}

function isCommand(val: any): val is Command | AsyncCommand {
    return val && typeof val.execute === "function";
}

function isThenable(val: any): val is PromiseLike<any> {
    return val && typeof val.then === "function";
}
