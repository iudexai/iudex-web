/**
 * Forked from
 * https://github.com/open-telemetry/opentelemetry-js-contrib
/tree/main/plugins/web/opentelemetry-instrumentation-user-interaction
 */
import { InstrumentationBase, InstrumentationConfig } from '@opentelemetry/instrumentation';
import * as api from '@opentelemetry/api';
import { Span, HrTime } from '@opentelemetry/api';
/**
 * Async Zone task
 */
export type AsyncTask = Task & {
    eventName: EventName;
    target: EventTarget;
    _zone: Zone;
};
/**
 *  Type for patching Zone RunTask function
 */
export type RunTaskFunction = (task: AsyncTask, applyThis?: any, applyArgs?: any) => Zone;
/**
 * interface to store information in weak map per span
 */
export interface SpanData {
    hrTimeLastTimeout?: HrTime;
    taskCount: number;
}
/**
 * interface to be able to check Zone presence on window
 */
export interface WindowWithZone {
    Zone: ZoneTypeWithPrototype;
}
/**
 * interface to be able to use prototype in Zone
 */
interface ZonePrototype {
    prototype: any;
}
/**
 * type to be  able to use prototype on Zone
 */
export type ZoneTypeWithPrototype = ZonePrototype & Zone;
export type EventName = keyof HTMLElementEventMap;
export type ShouldPreventSpanCreation = (eventType: EventName, element: HTMLElement, span: Span) => boolean | void;
export interface UserInteractionInstrumentationConfig extends InstrumentationConfig {
    /**
     * List of events to instrument (like 'mousedown', 'touchend', 'play' etc).
     * By default only 'click' event is instrumented.
     */
    eventNames?: EventName[];
    /**
     * Callback function called each time new span is being created.
     * Return `true` to prevent span recording.
     * You can also use this handler to enhance created span with extra attributes.
     */
    shouldPreventSpanCreation?: ShouldPreventSpanCreation;
}
export declare enum AttributeNames {
    EVENT_TYPE = "event_type",
    TARGET_ELEMENT = "target_element",
    TARGET_XPATH = "target_xpath",
    HTTP_URL = "http.url"
}
/**
 * This class represents a UserInteraction plugin for auto instrumentation.
 * If zone.js is available then it patches the zone otherwise it patches
 * addEventListener of HTMLElement
 */
export declare class UserInteractionInstrumentation extends InstrumentationBase<UserInteractionInstrumentationConfig> {
    readonly version = "0.39.0";
    readonly moduleName: string;
    private _spansData;
    private _zonePatched?;
    private _wrappedListeners;
    private _eventsSpanMap;
    private _eventNames;
    private _shouldPreventSpanCreation;
    spansByPendingEvent: Map<string, api.Span[]>;
    constructor(config?: UserInteractionInstrumentationConfig);
    init(): void;
    /**
     * This will check if last task was timeout and will save the time to
     * fix the user interaction when nothing happens
     * This timeout comes from xhr plugin which is needed to collect information
     * about last xhr main request from observer
     * @param task
     * @param span
     */
    private _checkForTimeout;
    /**
     * Controls whether or not to create a span, based on the event type.
     */
    protected _allowEventName(eventName: EventName): boolean;
    /**
     * Creates a new span
     * @param element
     * @param eventName
     * @param parentSpan
     */
    private _createSpan;
    /**
     * Decrement number of tasks that left in zone,
     * This is needed to be able to end span when no more tasks left
     * @param span
     */
    private _decrementTask;
    /**
     * Return the current span
     * @param zone
     * @private
     */
    private _getCurrentSpan;
    /**
     * Increment number of tasks that are run within the same zone.
     *     This is needed to be able to end span when no more tasks left
     * @param span
     */
    private _incrementTask;
    /**
     * Returns true iff we should use the patched callback; false if it's already been patched
     */
    private addPatchedListener;
    /**
     * Returns the patched version of the callback (or undefined)
     */
    private removePatchedListener;
    private _invokeListener;
    /**
     * This patches the addEventListener of HTMLElement to be able to
     * auto instrument the click events
     * This is done when zone is not available
     */
    private _patchAddEventListener;
    /**
     * This patches the removeEventListener of HTMLElement to handle the fact that
     * we patched the original callbacks
     * This is done when zone is not available
     */
    private _patchRemoveEventListener;
    /**
     * Most browser provide event listener api via EventTarget in prototype chain.
     * Exception to this is IE 11 which has it on the prototypes closest to EventTarget:
     *
     * * - has addEventListener in IE
     * ** - has addEventListener in all other browsers
     * ! - missing in IE
     *
     * HTMLElement -> Element -> Node * -> EventTarget **! -> Object
     * Document -> Node * -> EventTarget **! -> Object
     * Window * -> WindowProperties ! -> EventTarget **! -> Object
     */
    private _getPatchableEventTargets;
    /**
     * Patches the history api
     */
    _patchHistoryApi(): void;
    /**
     * Patches the certain history api method
     */
    _patchHistoryMethod(): (original: any) => (this: History, ...args: unknown[]) => any;
    /**
     * unpatch the history api methods
     */
    _unpatchHistoryApi(): void;
    /**
     * Updates interaction span name
     * @param url
     */
    _updateInteractionName(url: string): void;
    /**
     * Patches zone cancel task - this is done to be able to correctly
     * decrement the number of remaining tasks
     */
    private _patchZoneCancelTask;
    /**
     * Patches zone schedule task - this is done to be able to correctly
     * increment the number of tasks running within current zone but also to
     * save time in case of timeout running from xhr plugin when waiting for
     * main request from PerformanceResourceTiming
     */
    private _patchZoneScheduleTask;
    /**
     * Patches zone run task - this is done to be able to create a span when
     * user interaction starts
     * @private
     */
    private _patchZoneRunTask;
    /**
     * Decides if task should be counted.
     * @param task
     * @param currentZone
     * @private
     */
    private _shouldCountTask;
    /**
     * Will try to end span when such span still exists.
     * @param span
     * @param endTime
     * @private
     */
    private _tryToEndSpan;
    /**
     * implements enable function
     */
    enable(): void;
    /**
     * implements unpatch function
     */
    disable(): void;
    /**
     * returns Zone
     */
    getZoneWithPrototype(): ZoneTypeWithPrototype | undefined;
}
export {};
