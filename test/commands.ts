import "should";
import * as sinon from "sinon";
import * as commonHelpers from "./helpers/common";

import * as ko from "knockout";
import * as commands from "../src/commands";

describe("Command", () => {

    describe("canExecute", () => {

        it("should be equal to result of given function", () => {
            const _canExecute = ko.observable(false);

            const command = new commands.Command({
                canExecute: () => _canExecute(),
                execute: commonHelpers.noop
            });

            let canExecuteResult = command.canExecute();
            canExecuteResult.should.not.be.ok;

            _canExecute(true);

            canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;
        });

    });

    describe("execute", () => {

        it("should block execution if canExecute is false", () => {
            const executeSpy = sinon.spy();

            const command = new commands.Command({
                canExecute: () => false,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.notCalled(executeSpy);
        });

        it("should allow execution if canExecute is true", () => {
            const executeSpy = sinon.spy();

            const command = new commands.Command({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
        });

        it("should execute callback with given arguments", () => {
            const executeSpy = sinon.spy(),
                commandParam = commonHelpers.createNote();

            const command = new commands.Command({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute(commandParam);

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.calledWithExactly(executeSpy, commandParam);
        });

        it("should execute callback with given context as this", () => {
            const executeSpy = sinon.spy(),
                commandContext = commonHelpers.createNote();

            const command = new commands.Command({
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
            const _canExecute = ko.observable(false);

            const command = new commands.AsyncCommand({
                canExecute: isExecuting => !isExecuting && _canExecute(),
                execute: commonHelpers.noop
            });

            let canExecuteResult = command.canExecute();
            canExecuteResult.should.not.be.ok;

            _canExecute(true);

            canExecuteResult = command.canExecute();
            canExecuteResult.should.be.ok;
        });

        it("should set isExecuting to true while executing", () => {
            let resolver: any;
            const command = new commands.AsyncCommand({
                canExecute: isExecuting => !isExecuting && true,
                execute: (resolve: () => any) => { resolver = resolve; }
            });

            let canExecuteResult = command.canExecute();
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
            const executeSpy = sinon.spy();

            const command = new commands.AsyncCommand({
                canExecute: () => false,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.notCalled(executeSpy);
        });

        it("should allow execution if canExecute is true", () => {
            const executeSpy = sinon.spy();

            const command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: executeSpy
            });

            command.execute();

            sinon.assert.calledOnce(executeSpy);
        });

        it("should execute callback with given arguments", () => {
            const executeSpy = sinon.spy(),
                commandParam = commonHelpers.createNote();

            const command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: (data, resolve) => executeSpy(data, resolve)
            });

            command.execute(commandParam);

            sinon.assert.calledOnce(executeSpy);
            sinon.assert.calledWith(executeSpy, commandParam, sinon.match.func);
        });

        it("should execute execute complete callback automatically if a thenable object is provided", () => {
            const thenable = {
                resolve: null as Function | null,
                then: function (this: any, onResolve: Function) {
                    this.resolve = onResolve;
                }
            };

            const command = new commands.AsyncCommand({
                canExecute: () => true,
                execute: () => thenable
            });

            command.execute();

            command.isExecuting().should.be.ok;

            thenable.resolve && thenable.resolve();

            command.isExecuting().should.not.be.ok;
        });

        it("should execute callback with given context as this", () => {
            const executeSpy = sinon.spy(),
                commandContext = commonHelpers.createNote();

            const command = new commands.AsyncCommand({
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
