define(["require", "exports", "knockout"], function (require, exports, ko) {
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
            this.usePromise = options.usePromise || false;
            this.canExecute = ko.computed(function () {
                return this.canExecuteCallback ? this.canExecuteCallback.call(this.context, this.isExecuting()) : true;
            }, this);
        }
        AsyncCommand.prototype.completeCallback = function () {
            this.isExecuting(false);
        };
        AsyncCommand.prototype.execute = function ($data) {
            if (this.canExecute() === true) {
                var args = [], complete = this.completeCallback.bind(this), result;
                if (this.executeCallback.length === 2 || this.usePromise)
                    args.push($data);
                if (!this.usePromise)
                    args.push(complete);
                this.isExecuting(true);
                result = this.executeCallback.apply(this.context, args);
                if (result && result.then)
                    result.then(complete, complete);
            }
        };
        return AsyncCommand;
    })();
    exports.AsyncCommand = AsyncCommand;
    function createAccessor(val) {
        return function () { return val; };
    }
    ko.bindingHandlers.command = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, events = {}, bindings = {}, hasEvent = false, event, command, binding, bindingValue;
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
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, result = true;
            if (commands.click) {
                result = commands.click.canExecute();
            }
            else if (commands.default) {
                result = commands.default.canExecute();
            }
            ko.bindingHandlers.enable.update(element, createAccessor(result), allBindingsAccessor, viewModel, bindingContext);
        }
    };
});
