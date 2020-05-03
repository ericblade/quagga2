type EventName = string;

declare interface EventData {
    subscribers: Array<any>,
};

declare interface Events {
    [key: string]: EventData,
};

declare interface Subscription {
    async?: boolean,
    callback: Function,
    once?: boolean,
};

export default (function() {
    let events: Events = {};

    function getEvent(eventName: EventName) {
        if (!events[eventName]) {
            events[eventName] = {
                subscribers: [],
            };
        }
        return events[eventName];
    }

    function clearEvents(){
        events = {};
    }

    function publishSubscription(subscription: Subscription, data: any) {
        if (subscription.async) {
            setTimeout(function() {
                subscription.callback(data);
            }, 4);
        } else {
            subscription.callback(data);
        }
    }

    function subscribe(event: EventName, callback: Function | Subscription, async?: boolean) {
        let subscription;

        if ( typeof callback === 'function') {
            subscription = {
                callback: callback,
                async: async,
            };
        } else {
            subscription = callback;
            if (!subscription.callback) {
                throw 'Callback was not specified on options';
            }
        }

        getEvent(event).subscribers.push(subscription);
    }

    return {
        subscribe: function(event: EventName, callback: Function | Subscription, async?: boolean) {
            return subscribe(event, callback, async);
        },
        publish: function(eventName: EventName, data: any) {
            var event = getEvent(eventName),
                subscribers = event.subscribers;

            // Publish one-time subscriptions
            subscribers.filter(function(subscriber) {
                return !!subscriber.once;
            }).forEach((subscriber) => {
                publishSubscription(subscriber, data);
            });

            // remove them from the subscriber
            event.subscribers = subscribers.filter(function(subscriber) {
                return !subscriber.once;
            });

            // publish the rest
            event.subscribers.forEach((subscriber) => {
                publishSubscription(subscriber, data);
            });
        },
        once: function(event: EventName, callback: Function, async: boolean) {
            subscribe(event, {
                callback: callback,
                async: async,
                once: true,
            });
        },
        unsubscribe: function(eventName: EventName, callback?: Function | Subscription) {
            if (eventName) {
                const event = getEvent(eventName);
                if (event && callback) {
                    event.subscribers = event.subscribers.filter(function(subscriber){
                        return subscriber.callback !== callback;
                    });
                } else {
                    event.subscribers = [];
                }
            } else {
                clearEvents();
            }
        },
    };
}());
