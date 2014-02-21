//// <reference path="../_definitions.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/should/should.d.ts" />
/// <reference path="../typings/sinon/sinon.d.ts" />

import messenger = require("../src/messenger");
import commonHelpers = require("./helpers/common");

var topic = "__SPA_TEST_TOPIC__",
    expectedResult = "dGhpcyBpcyBhIHRlc3QgZm9yIHNwYSB0b29scyBiYXNlNjQgZW5jb2Rlcg==";

describe("Messenger", () => {

    describe("publish method", () => {

        it("should call every subscriptions on given topic", () => {
            var topic = "__SPA_TEST_TOPIC__",
                spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                spy3 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2);
            messenger.subscribe("blabla", spy3);

            messenger.publish(topic);

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);
            messenger.unsubscribe("blabla", spy3);

            sinon.assert.calledOnce(spy1);
            sinon.assert.calledOnce(spy2);
            sinon.assert.notCalled(spy3);
        });

        it("should call every subscriptions with given arguments", () => {
            var topic = "__SPA_TEST_TOPIC__",
                arg = commonHelpers.createNote(),
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2);

            messenger.publish(topic, arg, "bla");

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);

            sinon.assert.calledOnce(spy1);
            sinon.assert.calledOnce(spy2);

            sinon.assert.alwaysCalledWithExactly(spy1, arg, "bla");
            sinon.assert.alwaysCalledWithExactly(spy2, arg, "bla");
        });

        it("should return true if no callback return false", () => {
            var topic = "__SPA_TEST_TOPIC__",
                result,
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2);

            result = messenger.publish(topic);

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);

            result.should.be.ok;
        });

        it("should return false if no callback return false", () => {
            var topic = "__SPA_TEST_TOPIC__",
                result,
                spy1 = sinon.stub().returns(false),
                spy2 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2);

            result = messenger.publish(topic);

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);

            result.should.not.be.ok;
        });

        it("should not call any callback after one returns false", () => {
            var topic = "__SPA_TEST_TOPIC__",
                result,
                spy1 = sinon.stub().returns(false),
                spy2 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2);

            result = messenger.publish(topic);

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);

            result.should.not.be.ok;

            sinon.assert.calledOnce(spy1);
            sinon.assert.notCalled(spy2);
        });

        it("should execute callbacks by priority", () => {
            var count = 0,
                topic = "__SPA_TEST_TOPIC__",

                cb1 = sinon.spy(() => { count.should.equal(0); count++; }),
                cb2 = sinon.spy(() => { count.should.equal(2); count++; }),
                cb3 = sinon.spy(() => { count.should.equal(1); count++; }),
                cb4 = sinon.spy(() => { count.should.equal(3); count++; });

            messenger.subscribe(topic, cb1, { priority: 1 });
            messenger.subscribe(topic, cb2, { priority: 3 });
            messenger.subscribe(topic, cb3, { priority: 2 });
            messenger.subscribe(topic, cb4, { priority: 4 });

            messenger.publish(topic);

            messenger.unsubscribe(topic, cb1);
            messenger.unsubscribe(topic, cb2);
            messenger.unsubscribe(topic, cb3);
            messenger.unsubscribe(topic, cb4);

            sinon.assert.calledOnce(cb1);
            sinon.assert.calledOnce(cb2);
            sinon.assert.calledOnce(cb3);
            sinon.assert.calledOnce(cb4);

            count.should.equal(4);
        });

        it("should remove callback if SubscriptionOption.once equal true", () => {
            var topic = "__SPA_TEST_TOPIC__",
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(topic, spy1);
            messenger.subscribe(topic, spy2, { once: true });

            messenger.publish(topic);
            messenger.publish(topic);

            messenger.unsubscribe(topic, spy1);
            messenger.unsubscribe(topic, spy2);

            sinon.assert.calledTwice(spy1);
            sinon.assert.calledOnce(spy2);
        });
    });

    describe("subscribeNext method", () => {

        it("should call subscribe method with option once set to true", () => {
            var topic = "__SPA_TEST_TOPIC__",
                spy = sinon.spy(),
                stub = sinon.stub(messenger, "subscribe");

            messenger.subscribeNext(topic, spy);

            stub.restore();

            sinon.assert.calledOnce(stub);
            sinon.assert.alwaysCalledWithMatch(stub,
                sinon.match.same(topic), sinon.match.same(spy), sinon.match.has("once", true)
            );
        });

    });
});
