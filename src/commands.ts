import ko = require("knockout");
import utils = require("koutils/utils");

export interface CommandOptions {
    execute($data: any): any;
    canExecute? (): boolean;
    context?: any;
}

export interface AsyncCommandOptions {
    execute($data: any, complete: () => void ): any;
    canExecute? (isExecuting: boolean): boolean;
    context?: any;
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
    private executeCallback: ($data: any, complete: () => void ) => any;
    private context: any;
    public isExecuting: KnockoutObservable<boolean> = ko.observable(false);

    public canExecute: KnockoutComputed<boolean>;

    constructor(options: AsyncCommandOptions) {
        this.canExecuteCallback = options.canExecute;
        this.executeCallback = options.execute;
        this.context = options.context;

        this.canExecute = ko.computed<boolean>(function () {
            return this.canExecuteCallback ? this.canExecuteCallback.call(this.context, this.isExecuting()) : true;
        }, this);
    }

    private completeCallback(): void {
        this.isExecuting(false);
    }

    public execute($data?: any): void {
        if (this.canExecute() === true) {
            var args = [];

            if (this.executeCallback.length === 2)
                args.push($data);

            args.push(this.completeCallback.bind(this));

            this.isExecuting(true);
            this.executeCallback.apply(this.context, args);
        }
    }
}

(<any>ko.bindingHandlers).command = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor(),
            commands = !!value.execute ? { click: value } : value,
            events = {},
            bindings: any = {},
            hasEvent = false,
            event: string, command: Command,
            binding: string, bindingValue: any;

        for (event in commands) {
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
                ko.bindingHandlers[binding].init(element, utils.createAccessor(bindingValue), allBindingsAccessor, viewModel, bindingContext);
            }
        }

        if (hasEvent) {
            ko.bindingHandlers.event.init(element, utils.createAccessor(events), allBindingsAccessor, viewModel, bindingContext);
        }
    },
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor(),
            commands = !!value.execute ? { click: value } : value,
            result = true;

        if (commands.click) {
            result = commands.click.canExecute();
        }

        ko.bindingHandlers.enable.update(element, utils.createAccessor(result), allBindingsAccessor, viewModel, bindingContext);
    }
};
