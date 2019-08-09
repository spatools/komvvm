(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "knockout"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ko = require("knockout");
    var bindingHandlers = ko.bindingHandlers;
    var Command = /** @class */ (function () {
        function Command(options) {
            this.canExecuteCallback = options.canExecute;
            this.executeCallback = options.execute;
            this.context = options.context;
            this.canExecute = ko.computed(function () {
                return this.canExecuteCallback ? this.canExecuteCallback.call(this.context) : true;
            }, this);
        }
        Command.prototype.execute = function ($data) {
            if (this.canExecute() === true) {
                this.executeCallback.call(this.context, $data);
            }
        };
        return Command;
    }());
    exports.Command = Command;
    var AsyncCommand = /** @class */ (function () {
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
                var args = [], complete = this.completeCallback.bind(this);
                if (this.executeCallback.length === 2 || this.usePromise)
                    args.push($data);
                if (!this.usePromise)
                    args.push(complete);
                this.isExecuting(true);
                try {
                    var result = this.executeCallback.apply(this.context, args);
                    if (isThenable(result))
                        result.then(complete, complete);
                }
                catch (err) {
                    complete();
                }
            }
        };
        return AsyncCommand;
    }());
    exports.AsyncCommand = AsyncCommand;
    var PromiseCommand = /** @class */ (function () {
        function PromiseCommand(options) {
            this.isExecuting = ko.observable(false);
            this.canExecuteCallback = options.canExecute;
            this.executeCallback = options.execute;
            this.context = options.context;
            this.canExecute = ko.computed(function () {
                return this.canExecuteCallback ? this.canExecuteCallback.call(this.context, this.isExecuting()) : true;
            }, this);
        }
        PromiseCommand.prototype.completeCallback = function () {
            this.isExecuting(false);
        };
        PromiseCommand.prototype.execute = function ($data) {
            if (this.canExecute() === true) {
                var complete = this.completeCallback.bind(this);
                this.isExecuting(true);
                try {
                    var result = this.executeCallback.call(this.context, $data);
                    if (isThenable(result)) {
                        result.then(complete, complete);
                    }
                    else {
                        complete();
                    }
                }
                catch (err) {
                    complete();
                }
            }
        };
        return PromiseCommand;
    }());
    exports.PromiseCommand = PromiseCommand;
    bindingHandlers.command = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var commands = createCommands(valueAccessor()), events = {}, bindings = {};
            var hasEvent = false;
            Object.keys(commands).forEach(function (event) {
                if (event === "default") {
                    return;
                }
                var command = commands[event];
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
            Object.keys(bindings).forEach(function (binding) {
                var bindingHandler = bindingHandlers[binding];
                if (bindingHandler && bindingHandler.init) {
                    bindingHandler.init(element, createAccessor(bindings[binding]), allBindingsAccessor, viewModel, bindingContext);
                }
            });
            if (hasEvent) {
                bindingHandlers.event.init(element, createAccessor(events), allBindingsAccessor, viewModel, bindingContext);
            }
        },
        update: function (element, valueAccessor) {
            var commands = createCommands(valueAccessor());
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
    function createCommands(value) {
        return isCommand(value) ? { click: value } : value;
    }
    function createAccessor(val) {
        return function () { return val; };
    }
    function isCommand(val) {
        return val && typeof val.execute === "function";
    }
    function isThenable(val) {
        return val && typeof val.then === "function";
    }
});
