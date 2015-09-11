//// <reference path="../_definitions.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/should/should.d.ts" />
/// <reference path="../typings/sinon/sinon.d.ts" />

import ko = require("knockout");
import commands = require("../src/commands");
import commonHelpers = require("./helpers/common");

describe("Command", () => {

    describe("canExecute", () => {

        it("should be equal to result of given function", () => {
            var _canExecute = ko.observable(false);

            var command = new commands.Command({
                canExecute: () => _canExecute(),
                execute: commonHelpers.noop
            });

            var canExecuteResult = command.canExecute();
            canExecuteResult.should.not.be.ok;

            _canExecute(true);

            canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;
        });

    });

    describe("execute", () => {

        it("should block execution if canExecute is false", () => {
            var executeSpy = sinon.spy();

            var command = new commands.Command({
                canExecute: () => false,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.notCalled(executeSpy);
        });

        it("should allow execution if canExecute is true", () => {
            var executeSpy = sinon.spy();

            var command = new commands.Command({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
        });

        it("should execute callback with given arguments", () => {
            var executeSpy = sinon.spy(),
                commandParam = commonHelpers.createNote();

            var command = new commands.Command({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute(commandParam);

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.calledWithExactly(executeSpy, commandParam);
        });

        it("should execute callback with given context as this", () => {
            var executeSpy = sinon.spy(),
                commandContext = commonHelpers.createNote();

            var command = new commands.Command({
                canExecute: () => true,
                execute: executeSpy,
                context: commandContext
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.alwaysCalledOn(executeSpy, commandContext);
        });

    });

});

describe("AsyncCommand", () => {

    describe("canExecute", () => {

        it("should be equal to result of given function", () => {
            var _canExecute = ko.observable(false);

            var command = new commands.AsyncCommand({
                canExecute: isExecuting => !isExecuting && _canExecute(),
                execute: commonHelpers.noop
            });

            var canExecuteResult = command.canExecute();
            canExecuteResult.should.not.be.ok;

            _canExecute(true);

            canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;
        });

        it("should set isExecuting to true while executing", () => {
            var resolver;
            var command = new commands.AsyncCommand({
                canExecute: isExecuting => !isExecuting && true,
                execute: resolve => { resolver = resolve; }
            });

            var canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;

            command.execute();

            canExecuteResult = command.canExecute();
            canExecuteResult.should.not.be.ok;

            resolver();

            canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;
        });

    });

    describe("execute", () => {

        it("should block execution if canExecute is false", () => {
            var executeSpy = sinon.spy();

            var command = new commands.AsyncCommand({
                canExecute: () => false,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.notCalled(executeSpy);
        });

        it("should allow execution if canExecute is true", () => {
            var executeSpy = sinon.spy();

            var command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
        });

        it("should execute callback with given arguments", () => {
            var executeSpy = sinon.spy(),
                commandParam = commonHelpers.createNote();

            var command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: (data, resolve) => executeSpy(data, resolve)
            });

            command.execute(commandParam);

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.calledWith(executeSpy, commandParam, sinon.match.func);
        });

        it("should execute execute complete callback automatically if a thenable object is provided", () => {
            var thenable = { resolve: null, then: function (onResolve) {
                this.resolve = onResolve;
            } };

            var command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: () => thenable
            });

            command.execute();

            command.isExecuting().should.be.ok;

            thenable.resolve();

            command.isExecuting().should.not.be.ok;
        });

        it("should execute callback with given context as this", () => {
            var executeSpy = sinon.spy(),
                commandContext = commonHelpers.createNote();

            var command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: executeSpy,
                context: commandContext
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.alwaysCalledOn(executeSpy, commandContext);
        });

    });

});
