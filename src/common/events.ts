type EventName = string;

interface Subscription {
    async?: boolean;
    callback: Function;
    once?: boolean;
}

interface EventData {
    subscribers: Array<Subscription>;
}

interface Events {
    [key: string]: EventData;
}

interface EventInterface {
    subscribe(event: EventName, callback: Function | Subscription, async?: boolean): void;
    publish(eventName: EventName, data?: never): void;
    once(event: EventName, callback: Function, async?: boolean): void;
    unsubscribe(eventName?: EventName, callback?: Function | Subscription): void;
}

export default (function EventInterface(): EventInterface {
    let events: Events = {};

    function getEvent(eventName: EventName): EventData {
        if (!events[eventName]) {
            events[eventName] = {
                subscribers: [],
            };
        }
        return events[eventName];
    }

    function clearEvents(): void {
        events = {};
    }

    function publishSubscription(subscription: Subscription, data: never): void {
        if (subscription.async) {
            setTimeout(() => {
                subscription.callback(data);
            }, 4);
        } else {
            subscription.callback(data);
        }
    }

    function _subscribe(event: EventName, callback: Function | Subscription, async?: boolean): void {
        let subscription;

        if (typeof callback === 'function') {
            subscription = {
                callback,
                async,
            };
        } else {
            subscription = callback;
            if (!subscription.callback) {
                throw new Error('Callback was not specified on options');
            }
        }

        getEvent(event).subscribers.push(subscription);
    }

    return {
        subscribe(event: EventName, callback: Function | Subscription, async?: boolean): void {
            return _subscribe(event, callback, async);
        },
        publish(eventName: EventName, data?: never): void {
            const event = getEvent(eventName);
            const { subscribers } = event;

            // Publish one-time subscriptions
            subscribers.filter((subscriber) => !!subscriber.once).forEach((subscriber) => {
                publishSubscription(subscriber, data as never);
            });

            // remove them from the subscriber
            event.subscribers = subscribers.filter((subscriber) => !subscriber.once);

            // publish the rest
            event.subscribers.forEach((subscriber) => {
                publishSubscription(subscriber, data as never);
            });
        },
        once(event: EventName, callback: Function, async = false): void {
            _subscribe(event, {
                callback,
                async,
                once: true,
            });
        },
        unsubscribe(eventName?: EventName, callback?: Function | Subscription): void {
            if (eventName) {
                const event = getEvent(eventName);
                if (event && callback) {
                    event.subscribers = event.subscribers.filter((subscriber) => subscriber.callback !== callback);
                } else {
                    event.subscribers = [];
                }
            } else {
                clearEvents();
            }
        },
    };
}());
