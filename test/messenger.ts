import "should";
import * as sinon from "sinon";
import * as commonHelpers from "./helpers/common";

import * as ko from "knockout";
import * as messenger from "../src/messenger";

const
    TOPIC = "__SPA_TEST_TOPIC__";

describe("Messenger", () => {

    describe("publish method", () => {

        it("should call every subscriptions on given topic", () => {
            const
                spy1 = sinon.spy(),
                spy2 = sinon.spy(),
                spy3 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2);
            messenger.subscribe("blabla", spy3);

            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);
            messenger.unsubscribe("blabla", spy3);

            sinon.assert.calledOnce(spy1);
            sinon.assert.calledOnce(spy2);
            sinon.assert.notCalled(spy3);
        });

        it("should call every subscriptions with given arguments", () => {
            const
                arg = commonHelpers.createNote(),
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2);

            messenger.publish(TOPIC, arg, "bla");

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);

            sinon.assert.calledOnce(spy1);
            sinon.assert.calledOnce(spy2);

            sinon.assert.alwaysCalledWithExactly(spy1, arg, "bla");
            sinon.assert.alwaysCalledWithExactly(spy2, arg, "bla");
        });

        it("should return true if no callback return false", () => {
            const
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2);

            const result = messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);

            result.should.be.ok;
        });

        it("should return false if no callback return false", () => {
            const
                spy1 = sinon.stub().returns(false),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2);

            const result = messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);

            result.should.not.be.ok;
        });

        it("should not call any callback after one returns false", () => {
            const
                spy1 = sinon.stub().returns(false),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2);

            const result = messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);

            result.should.not.be.ok;

            sinon.assert.calledOnce(spy1);
            sinon.assert.notCalled(spy2);
        });

        it("should execute callbacks by priority", () => {
            let count = 0;
            const
                cb1 = sinon.spy(() => { count.should.equal(0); count++; }),
                cb2 = sinon.spy(() => { count.should.equal(2); count++; }),
                cb3 = sinon.spy(() => { count.should.equal(1); count++; }),
                cb4 = sinon.spy(() => { count.should.equal(3); count++; });

            messenger.subscribe(TOPIC, cb1, { priority: 1 });
            messenger.subscribe(TOPIC, cb2, { priority: 3 });
            messenger.subscribe(TOPIC, cb3, { priority: 2 });
            messenger.subscribe(TOPIC, cb4, { priority: 4 });

            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, cb1);
            messenger.unsubscribe(TOPIC, cb2);
            messenger.unsubscribe(TOPIC, cb3);
            messenger.unsubscribe(TOPIC, cb4);

            sinon.assert.calledOnce(cb1);
            sinon.assert.calledOnce(cb2);
            sinon.assert.calledOnce(cb3);
            sinon.assert.calledOnce(cb4);

            count.should.equal(4);
        });

        it("should remove callback if SubscriptionOption.once equal true", () => {
            const
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.subscribe(TOPIC, spy2, { once: true });

            messenger.publish(TOPIC);
            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);
            messenger.unsubscribe(TOPIC, spy2);

            sinon.assert.calledTwice(spy1);
            sinon.assert.calledOnce(spy2);
        });
    });

    describe("subscribeNext method", () => {

        it("should only be called once", () => {
            const
                spy = sinon.spy();

            messenger.subscribeNext(TOPIC, spy);

            messenger.publish(TOPIC);
            messenger.publish(TOPIC);

            sinon.assert.calledOnce(spy);
        });

    });

    describe("unsubscribe method", () => {

        it("should remove subscription matched by given callback from topic", () => {
            const spy1 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);

            messenger.publish(TOPIC);

            sinon.assert.calledOnce(spy1);
        });

        it("should not remove any subscription if nothing matched the given callback", () => {
            const
                spy1 = sinon.spy(),
                spy2 = sinon.spy();

            messenger.subscribe(TOPIC, spy1);
            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy2);

            messenger.publish(TOPIC);

            messenger.unsubscribe(TOPIC, spy1);

            sinon.assert.calledTwice(spy1);
        });

    });
});
