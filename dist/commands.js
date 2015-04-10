define(["require", "exports", "knockout", "koutils/utils"], function (require, exports, ko, utils) {
    var Command = (function () {
        function Command(options) {
            this.canExecuteCallback = options.canExecute;
            this.executeCallback = options.execute;
            this.context = options.context;
            this.canExecute = ko.computed(function () {
                return this.canExecuteCallback ? this.canExecuteCallback.call(this.context) : true;
            }, this);
        }
        Command.prototype.execute = function ($data) {
            if (this.canExecute() === true)
                this.executeCallback.call(this.context, $data);
        };
        return Command;
    })();
    exports.Command = Command;
    var AsyncCommand = (function () {
        function AsyncCommand(options) {
            this.isExecuting = ko.observable(false);
            this.canExecuteCallback = options.canExecute;
            this.executeCallback = options.execute;
            this.context = options.context;
            this.canExecute = ko.computed(function () {
                return this.canExecuteCallback ? this.canExecuteCallback.call(this.context, this.isExecuting()) : true;
            }, this);
        }
        AsyncCommand.prototype.completeCallback = function () {
            this.isExecuting(false);
        };
        AsyncCommand.prototype.execute = function ($data) {
            if (this.canExecute() === true) {
                var args = [];
                if (this.executeCallback.length === 2)
                    args.push($data);
                args.push(this.completeCallback.bind(this));
                this.isExecuting(true);
                this.executeCallback.apply(this.context, args);
            }
        };
        return AsyncCommand;
    })();
    exports.AsyncCommand = AsyncCommand;
    ko.bindingHandlers.command = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, events = {}, bindings = {}, hasEvent = false, event, command, binding, bindingValue;
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
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, result = true;
            if (commands.click) {
                result = commands.click.canExecute();
            }
            ko.bindingHandlers.enable.update(element, utils.createAccessor(result), allBindingsAccessor, viewModel, bindingContext);
        }
    };
});
