/**
 * Forked from
 * https://github.com/open-telemetry/opentelemetry-js-contrib
/tree/main/plugins/web/opentelemetry-instrumentation-user-interaction
 */

/// <reference types="zone.js" />
import {
  isWrapped,
  InstrumentationBase,
  InstrumentationConfig,
} from '@opentelemetry/instrumentation';
import * as api from '@opentelemetry/api';
import { Span, HrTime } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';
import { getElementXPath } from '@opentelemetry/sdk-trace-web';
import { emitOtelLog } from '../utils.js';

const PACKAGE_NAME = 'iudex-web/instrumentation-user-interaction';
const PACKAGE_VERSION = '0.39.0';
const ZONE_CONTEXT_KEY = 'OT_ZONE_CONTEXT';
const EVENT_NAVIGATION_NAME = 'Navigation:';
const DEFAULT_EVENT_NAMES: EventName[] = ['click'];

function defaultShouldPreventSpanCreation() {
  return false;
}

/**
 * Async Zone task
 */
export type AsyncTask = Task & {
  eventName: EventName;
  target: EventTarget;
  // Allows access to the private `_zone` property of a Zone.js Task.
  _zone: Zone;
};

/**
 *  Type for patching Zone RunTask function
 */
export type RunTaskFunction = (
  task: AsyncTask,
  applyThis?: any,
  applyArgs?: any
) => Zone;

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

export type ShouldPreventSpanCreation = (
  eventType: EventName,
  element: HTMLElement,
  span: Span
) => boolean | void;

export interface UserInteractionInstrumentationConfig
  extends InstrumentationConfig {
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

export enum AttributeNames {
  EVENT_TYPE = 'event_type',
  TARGET_ELEMENT = 'target_element',
  TARGET_XPATH = 'target_xpath',
  HTTP_URL = 'http.url',
}

/**
 * This class represents a UserInteraction plugin for auto instrumentation.
 * If zone.js is available then it patches the zone otherwise it patches
 * addEventListener of HTMLElement
 */
export class UserInteractionInstrumentation
  extends InstrumentationBase<UserInteractionInstrumentationConfig>
{
  readonly version = PACKAGE_VERSION;
  readonly moduleName: string = 'user-interaction';
  private _spansData = new WeakMap<api.Span, SpanData>();
  private _zonePatched?: boolean;
  // for addEventListener/removeEventListener state
  private _wrappedListeners = new WeakMap<
    Function | EventListenerObject,
    Map<string, Map<HTMLElement, Function>>
  >();
  // for event bubbling
  private _eventsSpanMap: WeakMap<Event, api.Span> = new WeakMap<
    Event,
    api.Span
  >();
  private _eventNames: Set<EventName>;
  private _shouldPreventSpanCreation: ShouldPreventSpanCreation;

  // How to connect event with when react handles it?
  spansByPendingEvent = new Map<string, api.Span[]>();

  constructor(config: UserInteractionInstrumentationConfig = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config);
    this._eventNames = new Set(config?.eventNames ?? DEFAULT_EVENT_NAMES);
    this._shouldPreventSpanCreation =
      typeof config?.shouldPreventSpanCreation === 'function'
        ? config.shouldPreventSpanCreation
        : defaultShouldPreventSpanCreation;
  }

  init() {}

  /**
   * This will check if last task was timeout and will save the time to
   * fix the user interaction when nothing happens
   * This timeout comes from xhr plugin which is needed to collect information
   * about last xhr main request from observer
   * @param task
   * @param span
   */
  private _checkForTimeout(task: AsyncTask, span: api.Span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      if (task.source === 'setTimeout') {
        spanData.hrTimeLastTimeout = hrTime();
      } else if (
        task.source !== 'Promise.then' &&
        task.source !== 'setTimeout'
      ) {
        spanData.hrTimeLastTimeout = undefined;
      }
    }
  }

  /**
   * Controls whether or not to create a span, based on the event type.
   */
  protected _allowEventName(eventName: EventName): boolean {
    return this._eventNames.has(eventName);
  }

  /**
   * Creates a new span
   * @param element
   * @param eventName
   * @param parentSpan
   */
  private _createSpan(
    element: EventTarget | null | undefined,
    eventName: EventName,
    parentSpan?: api.Span,
  ): api.Span | undefined {
    if (!(element instanceof HTMLElement)) {
      return undefined;
    }
    if (!element.getAttribute) {
      return undefined;
    }
    if (element.hasAttribute('disabled')) {
      return undefined;
    }
    if (!this._allowEventName(eventName)) {
      return undefined;
    }
    const xpath = getElementXPath(element, true);
    try {
      const span = this.tracer.startSpan(
        eventName,
        {
          attributes: {
            [AttributeNames.EVENT_TYPE]: eventName,
            [AttributeNames.TARGET_ELEMENT]: element.tagName,
            [AttributeNames.TARGET_XPATH]: xpath,
            [AttributeNames.HTTP_URL]: window.location.href,
          },
        },
        parentSpan
          ? api.trace.setSpan(api.context.active(), parentSpan)
          : undefined,
      );

      if (this._shouldPreventSpanCreation(eventName, element, span) === true) {
        return undefined;
      }

      this._spansData.set(span, {
        taskCount: 0,
      });

      return span;
    } catch (e) {
      this._diag.error('failed to start create new user interaction span', e);
    }
    return undefined;
  }

  /**
   * Decrement number of tasks that left in zone,
   * This is needed to be able to end span when no more tasks left
   * @param span
   */
  private _decrementTask(span: api.Span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      spanData.taskCount--;
      if (spanData.taskCount === 0) {
        this._tryToEndSpan(span, spanData.hrTimeLastTimeout);
      }
    }
  }

  /**
   * Return the current span
   * @param zone
   * @private
   */
  private _getCurrentSpan(zone: Zone): api.Span | undefined {
    const context: api.Context | undefined = zone.get(ZONE_CONTEXT_KEY);
    if (context) {
      return api.trace.getSpan(context);
    }
    return context;
  }

  /**
   * Increment number of tasks that are run within the same zone.
   *     This is needed to be able to end span when no more tasks left
   * @param span
   */
  private _incrementTask(span: api.Span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      spanData.taskCount++;
    }
  }

  /**
   * Returns true iff we should use the patched callback; false if it's already been patched
   */
  private addPatchedListener(
    on: HTMLElement,
    type: string,
    listener: Function | EventListenerObject,
    wrappedListener: Function,
  ): boolean {
    let listener2Type = this._wrappedListeners.get(listener);
    if (!listener2Type) {
      listener2Type = new Map();
      this._wrappedListeners.set(listener, listener2Type);
    }
    let element2patched = listener2Type.get(type);
    if (!element2patched) {
      element2patched = new Map();
      listener2Type.set(type, element2patched);
    }
    if (element2patched.has(on)) {
      return false;
    }
    element2patched.set(on, wrappedListener);
    return true;
  }

  /**
   * Returns the patched version of the callback (or undefined)
   */
  private removePatchedListener(
    on: HTMLElement,
    type: string,
    listener: Function | EventListenerObject,
  ): Function | undefined {
    const listener2Type = this._wrappedListeners.get(listener);
    if (!listener2Type) {
      return undefined;
    }
    const element2patched = listener2Type.get(type);
    if (!element2patched) {
      return undefined;
    }
    const patched = element2patched.get(on);
    if (patched) {
      element2patched.delete(on);
      if (element2patched.size === 0) {
        listener2Type.delete(type);
        if (listener2Type.size === 0) {
          this._wrappedListeners.delete(listener);
        }
      }
    }
    return patched;
  }

  // utility method to deal with the Function|EventListener nature of addEventListener
  private _invokeListener(
    listener: Function | EventListenerObject,
    target: any,
    args: any[],
  ): any {
    if (typeof listener === 'function') {
      return listener.apply(target, args);
    } else {
      return listener.handleEvent(args[0]);
    }
  }

  /**
   * This patches the addEventListener of HTMLElement to be able to
   * auto instrument the click events
   * This is done when zone is not available
   */
  private _patchAddEventListener() {
  }

  /**
   * This patches the removeEventListener of HTMLElement to handle the fact that
   * we patched the original callbacks
   * This is done when zone is not available
   */
  private _patchRemoveEventListener() {
  }

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
  private _getPatchableEventTargets(): EventTarget[] {
    return window.EventTarget
      ? [EventTarget.prototype]
      : [Node.prototype, Window.prototype];
  }

  /**
   * Patches the history api
   */
  _patchHistoryApi() {
    this._unpatchHistoryApi();

    this._wrap(history, 'replaceState', this._patchHistoryMethod());
    this._wrap(history, 'pushState', this._patchHistoryMethod());
    this._wrap(history, 'back', this._patchHistoryMethod());
    this._wrap(history, 'forward', this._patchHistoryMethod());
    this._wrap(history, 'go', this._patchHistoryMethod());
  }

  /**
   * Patches the certain history api method
   */
  _patchHistoryMethod() {
    const plugin = this;
    return (original: any) => {
      return function patchHistoryMethod(this: History, ...args: unknown[]) {
        const url = `${location.pathname}${location.hash}${location.search}`;
        const result = original.apply(this, args);
        const urlAfter = `${location.pathname}${location.hash}${location.search}`;
        if (url !== urlAfter) {
          plugin._updateInteractionName(urlAfter);
        }
        return result;
      };
    };
  }

  /**
   * unpatch the history api methods
   */
  _unpatchHistoryApi() {
    if (isWrapped(history.replaceState)) this._unwrap(history, 'replaceState');
    if (isWrapped(history.pushState)) this._unwrap(history, 'pushState');
    if (isWrapped(history.back)) this._unwrap(history, 'back');
    if (isWrapped(history.forward)) this._unwrap(history, 'forward');
    if (isWrapped(history.go)) this._unwrap(history, 'go');
  }

  /**
   * Updates interaction span name
   * @param url
   */
  _updateInteractionName(url: string) {
    const span: api.Span | undefined = api.trace.getSpan(api.context.active());
    if (span && typeof span.updateName === 'function') {
      span.updateName(`${EVENT_NAVIGATION_NAME} ${url}`);
    }
  }

  /**
   * Patches zone cancel task - this is done to be able to correctly
   * decrement the number of remaining tasks
   */
  private _patchZoneCancelTask() {
    const plugin = this;
    return (original: any) => {
      return function patchCancelTask<T extends Task>(
        this: Zone,
        task: AsyncTask,
      ) {
        const currentZone = Zone.current;
        const currentSpan = plugin._getCurrentSpan(currentZone);
        if (currentSpan && plugin._shouldCountTask(task, currentZone)) {
          plugin._decrementTask(currentSpan);
        }
        return original.call(this, task) as T;
      };
    };
  }

  /**
   * Patches zone schedule task - this is done to be able to correctly
   * increment the number of tasks running within current zone but also to
   * save time in case of timeout running from xhr plugin when waiting for
   * main request from PerformanceResourceTiming
   */
  private _patchZoneScheduleTask() {
    const plugin = this;
    return (original: any) => {
      return function patchScheduleTask<T extends Task>(
        this: Zone,
        task: AsyncTask,
      ) {
        const currentZone = Zone.current;
        const currentSpan = plugin._getCurrentSpan(currentZone);
        if (currentSpan && plugin._shouldCountTask(task, currentZone)) {
          plugin._incrementTask(currentSpan);
          plugin._checkForTimeout(task, currentSpan);
        }
        return original.call(this, task) as T;
      };
    };
  }

  /**
   * Patches zone run task - this is done to be able to create a span when
   * user interaction starts
   * @private
   */
  private _patchZoneRunTask() {
    const plugin = this;
    return (original: RunTaskFunction): RunTaskFunction => {
      return function patchRunTask(
        this: Zone,
        task: AsyncTask,
        applyThis?: any,
        applyArgs?: any,
      ): Zone {
        const event = Array.isArray(applyArgs) && applyArgs[0] instanceof Event
          ? applyArgs[0]
          : undefined;
        const target = event?.target;

        const activeZone = this;
        const span: api.Span | undefined = target
          ? plugin._createSpan(target, task.eventName)
          : plugin._getCurrentSpan(this);

        if (target && span) {
          plugin._incrementTask(span);

          // Queues React event span
          const isReactEvent = Object.keys(target).some(k => k.startsWith('__reactFiber$'));
          if (isReactEvent) {
            plugin._incrementTask(span);
            const spans = plugin.spansByPendingEvent.get(task.eventName) || [];
            spans.push(span);
            plugin.spansByPendingEvent.set(task.eventName, spans);
          }

          return activeZone.run(() => {
            try {
              return api.context.with(
                api.trace.setSpan(api.context.active(), span),
                () => {
                  const currentZone = Zone.current;
                  task._zone = currentZone;
                  return original.call(
                    currentZone,
                    task,
                    applyThis,
                    applyArgs,
                  );
                },
              );
            } catch (e) {
              const error = e as Error;
              span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
              span.recordException(error);
              emitOtelLog({ level: 'ERROR', body: error.zoneAwareStack || error.stack });
              throw e;
            } finally {
              plugin._decrementTask(span);
            }
          });
        }

        // Handles React synthetic event work
        if (event?.type?.startsWith('react-')) {
          const eventType = event.type.split('react-', 2)[1];
          if (eventType) {
            const spans = plugin.spansByPendingEvent.get(eventType);
            if (spans?.length) {
              const span = spans.shift();
              if (span) {
                return activeZone.run(() => {
                  try {
                    return api.context.with(
                      api.trace.setSpan(api.context.active(), span),
                      () => {
                        const currentZone = Zone.current;
                        task._zone = currentZone;
                        return original.call(
                          currentZone,
                          task,
                          applyThis,
                          applyArgs,
                        );
                      },
                    );
                  } catch (e) {
                    const error = e as Error;
                    span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
                    span.recordException(error);
                    emitOtelLog({ level: 'ERROR', body: error.zoneAwareStack || error.stack });
                    throw e;
                  } finally {
                    plugin._decrementTask(span);
                  }
                });
              }
            }
          }
        }

        try {
          return original.call(activeZone, task, applyThis, applyArgs);
        } catch (e) {
          const error = e as Error;
          span?.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
          span?.recordException(error);
          emitOtelLog({ level: 'ERROR', body: error.zoneAwareStack || error.stack });
          throw e;
        } finally {
          if (span && plugin._shouldCountTask(task, activeZone)) {
            plugin._decrementTask(span);
          }
        }
      };
    };
  }

  /**
   * Decides if task should be counted.
   * @param task
   * @param currentZone
   * @private
   */
  private _shouldCountTask(task: AsyncTask, currentZone: Zone): boolean {
    if (task._zone) {
      currentZone = task._zone;
    }
    if (!currentZone || !task.data || task.data.isPeriodic) {
      return false;
    }
    const currentSpan = this._getCurrentSpan(currentZone);
    if (!currentSpan) {
      return false;
    }
    if (!this._spansData.get(currentSpan)) {
      return false;
    }
    return task.type === 'macroTask' || task.type === 'microTask';
  }

  /**
   * Will try to end span when such span still exists.
   * @param span
   * @param endTime
   * @private
   */
  private _tryToEndSpan(span: api.Span, endTime?: api.HrTime) {
    if (span) {
      const spanData = this._spansData.get(span);
      if (spanData) {
        span.end(endTime);
        this._spansData.delete(span);
      }
    }
  }

  /**
   * implements enable function
   */
  override enable() {
    const ZoneWithPrototype = this.getZoneWithPrototype();
    this._diag.debug(
      'applying patch to',
      this.moduleName,
      this.version,
      'zone:',
      !!ZoneWithPrototype,
    );
    if (ZoneWithPrototype) {
      if (isWrapped(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'runTask');
        this._diag.debug('removing previous patch from method runTask');
      }
      if (isWrapped(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'scheduleTask');
        this._diag.debug('removing previous patch from method scheduleTask');
      }
      if (isWrapped(ZoneWithPrototype.prototype.cancelTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'cancelTask');
        this._diag.debug('removing previous patch from method cancelTask');
      }

      this._zonePatched = true;
      this._wrap(
        ZoneWithPrototype.prototype,
        'runTask',
        this._patchZoneRunTask(),
      );
      this._wrap(
        ZoneWithPrototype.prototype,
        'scheduleTask',
        this._patchZoneScheduleTask(),
      );
      this._wrap(
        ZoneWithPrototype.prototype,
        'cancelTask',
        this._patchZoneCancelTask(),
      );
    } else {
      this._zonePatched = false;
      const targets = this._getPatchableEventTargets();
      targets.forEach(target => {
        if (isWrapped(target.addEventListener)) {
          this._unwrap(target, 'addEventListener');
          this._diag.debug(
            'removing previous patch from method addEventListener',
          );
        }
        if (isWrapped(target.removeEventListener)) {
          this._unwrap(target, 'removeEventListener');
          this._diag.debug(
            'removing previous patch from method removeEventListener',
          );
        }
        this._wrap(target, 'addEventListener', this._patchAddEventListener() as any);
        this._wrap(
          target,
          'removeEventListener',
          this._patchRemoveEventListener() as any,
        );
      });
    }

    this._patchHistoryApi();
  }

  /**
   * implements unpatch function
   */
  override disable() {
    const ZoneWithPrototype = this.getZoneWithPrototype();
    this._diag.debug(
      'removing patch from',
      this.moduleName,
      this.version,
      'zone:',
      !!ZoneWithPrototype,
    );
    if (ZoneWithPrototype && this._zonePatched) {
      if (isWrapped(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'runTask');
      }
      if (isWrapped(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'scheduleTask');
      }
      if (isWrapped(ZoneWithPrototype.prototype.cancelTask)) {
        this._unwrap(ZoneWithPrototype.prototype, 'cancelTask');
      }
    } else {
      const targets = this._getPatchableEventTargets();
      targets.forEach(target => {
        if (isWrapped(target.addEventListener)) {
          this._unwrap(target, 'addEventListener');
        }
        if (isWrapped(target.removeEventListener)) {
          this._unwrap(target, 'removeEventListener');
        }
      });
    }
    this._unpatchHistoryApi();
  }

  /**
   * returns Zone
   */
  getZoneWithPrototype(): ZoneTypeWithPrototype | undefined {
    const _window: WindowWithZone = window as unknown as WindowWithZone;
    return _window.Zone;
  }
}
