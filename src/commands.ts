import ko = require("knockout");

export type Thenable = { then: (resolve: Function, reject: Function) => void; };
export type AsyncExecuteCallback = ($data: any, complete?: () => void) => any;
export type AsyncThenableCallback = ($data?: any) => Thenable;
export type AsyncCommandCallback = AsyncExecuteCallback | AsyncThenableCallback;

export interface CommandOptions {
    execute($data: any): any;
    canExecute?(): boolean;
    context?: any;
}

export interface AsyncCommandOptions {
    execute: AsyncCommandCallback;
    canExecute?(isExecuting: boolean): boolean;
    context?: any;
    usePromise?: boolean;
}

export class Command {
    private canExecuteCallback: () => boolean;
    private executeCallback: ($data: any) => any;
    private context: any;

    public canExecute: KnockoutComputed<boolean>;

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

export class AsyncCommand {
    private canExecuteCallback: (isExecuting: boolean) => boolean;
    private executeCallback: AsyncCommandCallback;
    private context: any;
    private usePromise: boolean;

    public isExecuting: KnockoutObservable<boolean> = ko.observable(false);
    public canExecute: KnockoutComputed<boolean>;

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
            if (result && result.then) result.then(complete, complete);
        }
    }
}

function createAccessor(val: any): () => any {
    return () => val;
}

(<any>ko.bindingHandlers).command = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor(),
            commands = !!value.execute ? { click: value } : value,
            events = {},
            bindings: any = {},
            hasEvent = false,
            event: string, command: Command,
            binding: string, bindingValue: any;

        for (event in commands) {
            if (event === "default") {
                continue;
            }

            if ((command = commands[event])) {
                if (ko.bindingHandlers[event]) {
                    bindings[event] = command.execute.bind(command);
                }
                else {
                    events[event] = command.execute.bind(command);
                    hasEvent = true;
                }
            }
        }

        for (binding in bindings) {
            if ((bindingValue = bindings[binding])) {
                ko.bindingHandlers[binding].init(element, createAccessor(bindingValue), allBindingsAccessor, viewModel, bindingContext);
            }
        }

        if (hasEvent) {
            ko.bindingHandlers.event.init(element, createAccessor(events), allBindingsAccessor, viewModel, bindingContext);
        }
    },
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor(),
            commands = !!value.execute ? { click: value } : value,
            result = true;

        if (commands.click) {
            result = commands.click.canExecute();
        }
        else if (commands.default) {
            result = commands.default.canExecute();
        }

        ko.bindingHandlers.enable.update(element, createAccessor(result), allBindingsAccessor, viewModel, bindingContext);
    }
};
