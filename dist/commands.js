define(["require", "exports", "knockout", "underscore", "koutils/utils"], function(require, exports, ko, _, utils) {
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

                args.push(_.bind(this.completeCallback, this));

                this.isExecuting(true);
                this.executeCallback.apply(this.context, args);
            }
        };
        return AsyncCommand;
    })();
    exports.AsyncCommand = AsyncCommand;

    ko.bindingHandlers.command = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, events = {}, bindings = {};

            _.each(commands, function (command, event) {
                if (ko.bindingHandlers[event]) {
                    bindings[event] = _.bind(command.execute, command);
                } else {
                    events[event] = _.bind(command.execute, command);
                }
            }), _.each(bindings, function (bindingValue, binding) {
                ko.bindingHandlers[binding].init(element, utils.createAccessor(bindingValue), allBindingsAccessor, viewModel, bindingContext);
            });

            if (_.size(events) > 0)
                ko.bindingHandlers.event.init(element, utils.createAccessor(events), allBindingsAccessor, viewModel, bindingContext);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(), commands = !!value.execute ? { click: value } : value, result = true;

            _.find(commands, function (command) {
                result = command.canExecute();
                return !result;
            });

            ko.bindingHandlers.enable.update(element, utils.createAccessor(result), allBindingsAccessor, viewModel, bindingContext);
        }
    };
});
