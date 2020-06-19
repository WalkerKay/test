/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';
// import {accumulateTwoPhaseDispatches} from 'legacy-events/EventPropagators';
import { canUseDOM } from '../../shared/ExecutionEnvironment';
import { TOP_BLUR, TOP_COMPOSITION_START, TOP_COMPOSITION_END, TOP_COMPOSITION_UPDATE, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN, TOP_TEXT_INPUT, TOP_PASTE } from './DOMTopLevelEventTypes';
import { getData as FallbackCompositionStateGetData, initialize as FallbackCompositionStateInitialize, reset as FallbackCompositionStateReset } from './FallbackCompositionState';
import { BeforeInputEvent } from './before-input-event';
// import SyntheticCompositionEvent from './SyntheticCompositionEvent';
// import SyntheticInputEvent from './SyntheticInputEvent';
const END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
const START_KEYCODE = 229;
let HAS_TEXT_INPUT = false;
const canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;
let documentMode = null;
if (canUseDOM && 'documentMode' in document) {
    documentMode = document.documentMode;
}
// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
const canUseTextInputEvent = canUseDOM && 'TextEvent' in window && !documentMode;
// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
const useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || (documentMode && documentMode > 8 && documentMode <= 11));
const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
// Events and their corresponding property names.
const eventTypes = {
    beforeInput: {
        phasedRegistrationNames: {
            bubbled: 'onBeforeInput',
            captured: 'onBeforeInputCapture'
        },
        dependencies: [TOP_COMPOSITION_END, TOP_KEY_PRESS, TOP_TEXT_INPUT, TOP_PASTE]
    },
    compositionEnd: {
        phasedRegistrationNames: {
            bubbled: 'onCompositionEnd',
            captured: 'onCompositionEndCapture'
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_END, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    },
    compositionStart: {
        phasedRegistrationNames: {
            bubbled: 'onCompositionStart',
            captured: 'onCompositionStartCapture'
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_START, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    },
    compositionUpdate: {
        phasedRegistrationNames: {
            bubbled: 'onCompositionUpdate',
            captured: 'onCompositionUpdateCapture'
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_UPDATE, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN]
    }
};
// Track whether we've ever handled a keypress on the space key.
let hasSpaceKeypress = false;
/**
 * Return whether a native keypress event is assumed to be a command.
 * This is required because Firefox fires `keypress` events for key commands
 * (cut, copy, select-all, etc.) even though no character is inserted.
 */
function isKeypressCommand(nativeEvent) {
    return ((nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
        // ctrlKey && altKey is equivalent to AltGr, and is not a command.
        !(nativeEvent.ctrlKey && nativeEvent.altKey));
}
/**
 * Translate native top level events into event types.
 *
 */
function getCompositionEventType(topLevelType) {
    switch (topLevelType) {
        case TOP_COMPOSITION_START:
            return eventTypes.compositionStart;
        case TOP_COMPOSITION_END:
            return eventTypes.compositionEnd;
        case TOP_COMPOSITION_UPDATE:
            return eventTypes.compositionUpdate;
    }
}
/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 */
function isFallbackCompositionStart(topLevelType, nativeEvent) {
    return topLevelType === TOP_KEY_DOWN && nativeEvent.keyCode === START_KEYCODE;
}
/**
 * Does our fallback mode think that this event is the end of composition?
 *
 */
function isFallbackCompositionEnd(topLevelType, nativeEvent) {
    switch (topLevelType) {
        case TOP_KEY_UP:
            // Command keys insert or clear IME input.
            return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
        case TOP_KEY_DOWN:
            // Expect IME keyCode on each keydown. If we get any other
            // code we must have exited earlier.
            return nativeEvent.keyCode !== START_KEYCODE;
        case TOP_KEY_PRESS:
        case TOP_MOUSE_DOWN:
        case TOP_BLUR:
            // Events are not possible without cancelling IME.
            return true;
        default:
            return false;
    }
}
/**
 * Google Input Tools provides composition data via a CustomEvent,
 * with the `data` property populated in the `detail` object. If this
 * is available on the event object, use it. If not, this is a plain
 * composition event and we have nothing special to extract.
 *
 */
function getDataFromCustomEvent(nativeEvent) {
    const detail = nativeEvent.detail;
    if (typeof detail === 'object' && 'data' in detail) {
        return detail.data;
    }
    if (nativeEvent.data) {
        return nativeEvent.data;
    }
    return null;
}
/**
 * Check if a composition event was triggered by Korean IME.
 * Our fallback mode does not work well with IE's Korean IME,
 * so just use native composition events when Korean IME is used.
 * Although CompositionEvent.locale property is deprecated,
 * it is available in IE, where our fallback mode is enabled.
 *
 */
function isUsingKoreanIME(nativeEvent) {
    return nativeEvent.locale === 'ko';
}
// Track the current IME composition status, if any.
let isComposing = false;
function extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    let eventType;
    let fallbackData;
    if (canUseCompositionEvent) {
        eventType = getCompositionEventType(topLevelType);
    }
    else if (!isComposing) {
        if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
            eventType = eventTypes.compositionStart;
        }
    }
    else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionEnd;
    }
    if (!eventType) {
        return null;
    }
    if (useFallbackCompositionData && !isUsingKoreanIME(nativeEvent)) {
        // The current composition is stored statically and must not be
        // overwritten while composition continues.
        if (!isComposing && eventType === eventTypes.compositionStart) {
            isComposing = FallbackCompositionStateInitialize(nativeEventTarget);
        }
        else if (eventType === eventTypes.compositionEnd) {
            if (isComposing) {
                fallbackData = FallbackCompositionStateGetData();
            }
        }
    }
    //   const event = SyntheticCompositionEvent.getPooled(
    //     eventType,
    //     targetInst,
    //     nativeEvent,
    //     nativeEventTarget
    //   );
    const beforeInputEvent = new BeforeInputEvent();
    beforeInputEvent.nativeEvent = nativeEvent;
    if (fallbackData) {
        // Inject data generated from fallback path into the synthetic event.
        // This matches the property of native CompositionEventInterface.
        beforeInputEvent.data = fallbackData;
    }
    else {
        const customData = getDataFromCustomEvent(nativeEvent);
        if (customData !== null) {
            beforeInputEvent.data = customData;
        }
    }
    return beforeInputEvent;
    //   accumulateTwoPhaseDispatches(event);
    //   return event;
}
function getNativeBeforeInputChars(topLevelType, nativeEvent) {
    switch (topLevelType) {
        case TOP_COMPOSITION_END:
            if (HAS_TEXT_INPUT) {
                HAS_TEXT_INPUT = false;
                return;
            }
            return getDataFromCustomEvent(nativeEvent);
        case TOP_KEY_PRESS:
            /**
             * If native `textInput` events are available, our goal is to make
             * use of them. However, there is a special case: the spacebar key.
             * In Webkit, preventing default on a spacebar `textInput` event
             * cancels character insertion, but it *also* causes the browser
             * to fall back to its default spacebar behavior of scrolling the
             * page.
             *
             * Tracking at:
             * https://code.google.com/p/chromium/issues/detail?id=355103
             *
             * To avoid this issue, use the keypress event as if no `textInput`
             * event is available.
             */
            const which = nativeEvent.which;
            if (which !== SPACEBAR_CODE) {
                return null;
            }
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
        case TOP_TEXT_INPUT:
            // Record the characters to be added to the DOM.
            const chars = nativeEvent.data;
            // If it's a spacebar character, assume that we have already handled
            // it at the keypress level and bail immediately. Android Chrome
            // doesn't give us keycodes, so we need to ignore it.
            if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
                return null;
            }
            HAS_TEXT_INPUT = true;
            return chars;
        default:
            // For other native event types, do nothing.
            return null;
    }
}
/**
 * For browsers that do not provide the `textInput` event, extract the
 * appropriate string to use for SyntheticInputEvent.
 *
 */
function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
    // If we are currently composing (IME) and using a fallback to do so,
    // try to extract the composed characters from the fallback object.
    // If composition event is available, we extract a string only at
    // compositionevent, otherwise extract it at fallback events.
    if (isComposing) {
        if (topLevelType === TOP_COMPOSITION_END || (!canUseCompositionEvent && isFallbackCompositionEnd(topLevelType, nativeEvent))) {
            const chars = FallbackCompositionStateGetData();
            FallbackCompositionStateReset();
            isComposing = false;
            return chars;
        }
        return null;
    }
    switch (topLevelType) {
        case TOP_PASTE:
            // If a paste event occurs after a keypress, throw out the input
            // chars. Paste events should not lead to BeforeInput events.
            return null;
        case TOP_KEY_PRESS:
            /**
             * As of v27, Firefox may fire keypress events even when no character
             * will be inserted. A few possibilities:
             *
             * - `which` is `0`. Arrow keys, Esc key, etc.
             *
             * - `which` is the pressed key code, but no char is available.
             *   Ex: 'AltGr + d` in Polish. There is no modified character for
             *   this key combination and no character is inserted into the
             *   document, but FF fires the keypress for char code `100` anyway.
             *   No `input` event will occur.
             *
             * - `which` is the pressed key code, but a command combination is
             *   being used. Ex: `Cmd+C`. No character is inserted, and no
             *   `input` event will occur.
             */
            if (!isKeypressCommand(nativeEvent)) {
                // IE fires the `keypress` event when a user types an emoji via
                // Touch keyboard of Windows.  In such a case, the `char` property
                // holds an emoji character like `\uD83D\uDE0A`.  Because its length
                // is 2, the property `which` does not represent an emoji correctly.
                // In such a case, we directly return the `char` property instead of
                // using `which`.
                if (nativeEvent.char && nativeEvent.char.length > 1) {
                    return nativeEvent.char;
                }
                else if (nativeEvent.which) {
                    return String.fromCharCode(nativeEvent.which);
                }
            }
            return null;
        case TOP_COMPOSITION_END:
            return useFallbackCompositionData && !isUsingKoreanIME(nativeEvent) ? null : nativeEvent.data;
        default:
            return null;
    }
}
/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 */
function extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    let chars;
    if (canUseTextInputEvent) {
        chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
    }
    else {
        chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
    }
    // If no characters are being inserted, no BeforeInput event should
    // be fired.
    if (!chars) {
        return null;
    }
    const beforeInputEvent = new BeforeInputEvent();
    beforeInputEvent.data = chars;
    beforeInputEvent.nativeEvent = nativeEvent;
    return beforeInputEvent;
    //   const event = SyntheticInputEvent.getPooled(
    //     eventTypes.beforeInput,
    //     targetInst,
    //     nativeEvent,
    //     nativeEventTarget
    //   );
    //   event.data = chars;
    //   accumulateTwoPhaseDispatches(event);
    //   return event;
}
const ɵ0 = (topLevelType, targetInst, nativeEvent, nativeEventTarget) => {
    const beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    if (beforeInput === null) {
        return null;
    }
    return beforeInput;
};
/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
const BeforeInputEventPlugin = {
    //   eventTypes: eventTypes,
    extractEvents: ɵ0
};
export default BeforeInputEventPlugin;
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmVmb3JlSW5wdXRFdmVudFBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInBsdWdpbnMvY3VzdG9tLWV2ZW50L0JlZm9yZUlucHV0RXZlbnRQbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0dBS0c7QUFFSCxzRUFBc0U7QUFFdEUsK0VBQStFO0FBQy9FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUU5RCxPQUFPLEVBQ0gsUUFBUSxFQUNSLHFCQUFxQixFQUNyQixtQkFBbUIsRUFDbkIsc0JBQXNCLEVBQ3RCLFlBQVksRUFDWixhQUFhLEVBQ2IsVUFBVSxFQUNWLGNBQWMsRUFDZCxjQUFjLEVBQ2QsU0FBUyxFQUNaLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUNILE9BQU8sSUFBSSwrQkFBK0IsRUFDMUMsVUFBVSxJQUFJLGtDQUFrQyxFQUNoRCxLQUFLLElBQUksNkJBQTZCLEVBQ3pDLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDeEQsdUVBQXVFO0FBQ3ZFLDJEQUEyRDtBQUUzRCxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO0FBQ2hFLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUMxQixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFFM0IsTUFBTSxzQkFBc0IsR0FBRyxTQUFTLElBQUksa0JBQWtCLElBQUksTUFBTSxDQUFDO0FBRXpFLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztBQUN4QixJQUFJLFNBQVMsSUFBSSxjQUFjLElBQUksUUFBUSxFQUFFO0lBQ3pDLFlBQVksR0FBSSxRQUFnQixDQUFDLFlBQVksQ0FBQztDQUNqRDtBQUVELG9FQUFvRTtBQUNwRSx1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eUIsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDaEU7U0FBTTtRQUNILEtBQUssR0FBRywyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDbEU7SUFFRCxtRUFBbUU7SUFDbkUsWUFBWTtJQUNaLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDUixPQUFPLElBQUksQ0FBQztLQUNmO0lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7SUFDaEQsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUM5QixnQkFBZ0IsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQzNDLE9BQU8sZ0JBQWdCLENBQUM7SUFDeEIsaURBQWlEO0lBQ2pELDhCQUE4QjtJQUM5QixrQkFBa0I7SUFDbEIsbUJBQW1CO0lBQ25CLHdCQUF3QjtJQUN4QixPQUFPO0lBRVAsd0JBQXdCO0lBQ3hCLHlDQUF5QztJQUN6QyxrQkFBa0I7QUFDdEIsQ0FBQztXQXVCa0IsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxFQUFFO0lBQ3hFLE1BQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDdEcsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFDRCxPQUFPLFdBQVcsQ0FBQztBQUN2QixDQUFDO0FBM0JMOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUNILE1BQU0sc0JBQXNCLEdBQUc7SUFDM0IsNEJBQTRCO0lBRTVCLGFBQWEsSUFNWjtDQUNKLENBQUM7QUFFRixlQUFlLHNCQUFzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIEZhY2Vib29rLCBJbmMuIGFuZCBpdHMgYWZmaWxpYXRlcy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4vLyBpbXBvcnQgdHlwZSB7VG9wTGV2ZWxUeXBlfSBmcm9tICdsZWdhY3ktZXZlbnRzL1RvcExldmVsRXZlbnRUeXBlcyc7XG5cbi8vIGltcG9ydCB7YWNjdW11bGF0ZVR3b1BoYXNlRGlzcGF0Y2hlc30gZnJvbSAnbGVnYWN5LWV2ZW50cy9FdmVudFByb3BhZ2F0b3JzJztcbmltcG9ydCB7IGNhblVzZURPTSB9IGZyb20gJy4uLy4uL3NoYXJlZC9FeGVjdXRpb25FbnZpcm9ubWVudCc7XG5cbmltcG9ydCB7XG4gICAgVE9QX0JMVVIsXG4gICAgVE9QX0NPTVBPU0lUSU9OX1NUQVJULFxuICAgIFRPUF9DT01QT1NJVElPTl9FTkQsXG4gICAgVE9QX0NPTVBPU0lUSU9OX1VQREFURSxcbiAgICBUT1BfS0VZX0RPV04sXG4gICAgVE9QX0tFWV9QUkVTUyxcbiAgICBUT1BfS0VZX1VQLFxuICAgIFRPUF9NT1VTRV9ET1dOLFxuICAgIFRPUF9URVhUX0lOUFVULFxuICAgIFRPUF9QQVNURVxufSBmcm9tICcuL0RPTVRvcExldmVsRXZlbnRUeXBlcyc7XG5pbXBvcnQge1xuICAgIGdldERhdGEgYXMgRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlR2V0RGF0YSxcbiAgICBpbml0aWFsaXplIGFzIEZhbGxiYWNrQ29tcG9zaXRpb25TdGF0ZUluaXRpYWxpemUsXG4gICAgcmVzZXQgYXMgRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlUmVzZXRcbn0gZnJvbSAnLi9GYWxsYmFja0NvbXBvc2l0aW9uU3RhdGUnO1xuaW1wb3J0IHsgQmVmb3JlSW5wdXRFdmVudCB9IGZyb20gJy4vYmVmb3JlLWlucHV0LWV2ZW50Jztcbi8vIGltcG9ydCBTeW50aGV0aWNDb21wb3NpdGlvbkV2ZW50IGZyb20gJy4vU3ludGhldGljQ29tcG9zaXRpb25FdmVudCc7XG4vLyBpbXBvcnQgU3ludGhldGljSW5wdXRFdmVudCBmcm9tICcuL1N5bnRoZXRpY0lucHV0RXZlbnQnO1xuXG5jb25zdCBFTkRfS0VZQ09ERVMgPSBbOSwgMTMsIDI3LCAzMl07IC8vIFRhYiwgUmV0dXJuLCBFc2MsIFNwYWNlXG5jb25zdCBTVEFSVF9LRVlDT0RFID0gMjI5O1xubGV0IEhBU19URVhUX0lOUFVUID0gZmFsc2U7XG5cbmNvbnN0IGNhblVzZUNvbXBvc2l0aW9uRXZlbnQgPSBjYW5Vc2VET00gJiYgJ0NvbXBvc2l0aW9uRXZlbnQnIGluIHdpbmRvdztcblxubGV0IGRvY3VtZW50TW9kZSA9IG51bGw7XG5pZiAoY2FuVXNlRE9NICYmICdkb2N1bWVudE1vZGUnIGluIGRvY3VtZW50KSB7XG4gICAgZG9jdW1lbnRNb2RlID0gKGRvY3VtZW50IGFzIGFueSkuZG9jdW1lbnRNb2RlO1xufVxuXG4vLyBXZWJraXQgb2ZmZXJzIGEgdmVyeSB1c2VmdWwgYHRleHRJbnB1dGAgZXZlbnQgdGhhdCBjYW4gYmUgdXNlZCB0b1xuLy8gZGlyZWN0bHkgcmVwcmVzZW50IGBiZWZvcmVJbnB1dGAuIFRoZSBJRSBgdGV4dGlucHV0YCBldmVudCBpcyBub3QgYXNcbi8vIHVzZWZ1bCwgc28gd2UgZG9uJ3QgdXNlIGl0LlxuY29uc3QgY2FuVXNlVGV4dElucHV0RXZlbnQgPSBjYW5Vc2VET00gJiYgJ1RleHRFdmVudCcgaW4gd2luZG93ICYmICFkb2N1bWVudE1vZGU7XG5cbi8vIEluIElFOSssIHdlIGhhdmUgYWNjZXNzIHRvIGNvbXBvc2l0aW9uIGV2ZW50cywgYnV0IHRoZSBkYXRhIHN1cHBsaWVkXG4vLyBieSB0aGUgbmF0aXZlIGNvbXBvc2l0aW9uZW5kIGV2ZW50IG1heSBiZSBpbmNvcnJlY3QuIEphcGFuZXNlIGlkZW9ncmFwaGljXG4vLyBzcGFjZXMsIGZvciBpbnN0YW5jZSAoXFx1MzAwMCkgYXJlIG5vdCByZWNvcmRlZCBjb3JyZWN0bHkuXG5jb25zdCB1c2VGYWxsYmFja0NvbXBvc2l0aW9uRGF0YSA9IGNhblVzZURPTSAmJiAoIWNhblVzZUNvbXBvc2l0aW9uRXZlbnQgfHwgKGRvY3VtZW50TW9kZSAmJiBkb2N1bWVudE1vZGUgPiA4ICYmIGRvY3VtZW50TW9kZSA8PSAxMSkpO1xuXG5jb25zdCBTUEFDRUJBUl9DT0RFID0gMzI7XG5jb25zdCBTUEFDRUJBUl9DSEFSID0gU3RyaW5nLmZyb21DaGFyQ29kZShTUEFDRUJBUl9DT0RFKTtcblxuLy8gRXZlbnRzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIHByb3BlcnR5IG5hbWVzLlxuY29uc3QgZXZlbnRUeXBlcyA9IHtcbiAgICBiZWZvcmVJbnB1dDoge1xuICAgICAgICBwaGFzZWRSZWdpc3RyYXRpb25OYW1lczoge1xuICAgICAgICAgICAgYnViYmxlZDogJ29uQmVmb3JlSW5wdXQnLFxuICAgICAgICAgICAgY2FwdHVyZWQ6ICdvbkJlZm9yZUlucHV0Q2FwdHVyZSdcbiAgICAgICAgfSxcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbVE9QX0NPTVBPU0lUSU9OX0VORCwgVE9QX0tFWV9QUkVTUywgVE9QX1RFWFRfSU5QVVQsIFRPUF9QQVNURV1cbiAgICB9LFxuICAgIGNvbXBvc2l0aW9uRW5kOiB7XG4gICAgICAgIHBoYXNlZFJlZ2lzdHJhdGlvbk5hbWVzOiB7XG4gICAgICAgICAgICBidWJibGVkOiAnb25Db21wb3NpdGlvbkVuZCcsXG4gICAgICAgICAgICBjYXB0dXJlZDogJ29uQ29tcG9zaXRpb25FbmRDYXB0dXJlJ1xuICAgICAgICB9LFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtUT1BfQkxVUiwgVE9QX0NPTVBPU0lUSU9OX0VORCwgVE9QX0tFWV9ET1dOLCBUT1BfS0VZX1BSRVNTLCBUT1BfS0VZX1VQLCBUT1BfTU9VU0VfRE9XTl1cbiAgICB9LFxuICAgIGNvbXBvc2l0aW9uU3RhcnQ6IHtcbiAgICAgICAgcGhhc2VkUmVnaXN0cmF0aW9uTmFtZXM6IHtcbiAgICAgICAgICAgIGJ1YmJsZWQ6ICdvbkNvbXBvc2l0aW9uU3RhcnQnLFxuICAgICAgICAgICAgY2FwdHVyZWQ6ICdvbkNvbXBvc2l0aW9uU3RhcnRDYXB0dXJlJ1xuICAgICAgICB9LFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtUT1BfQkxVUiwgVE9QX0NPTVBPU0lUSU9OX1NUQVJULCBUT1BfS0VZX0RPV04sIFRPUF9LRVlfUFJFU1MsIFRPUF9LRVlfVVAsIFRPUF9NT1VTRV9ET1dOXVxuICAgIH0sXG4gICAgY29tcG9zaXRpb25VcGRhdGU6IHtcbiAgICAgICAgcGhhc2VkUmVnaXN0cmF0aW9uTmFtZXM6IHtcbiAgICAgICAgICAgIGJ1YmJsZWQ6ICdvbkNvbXBvc2l0aW9uVXBkYXRlJyxcbiAgICAgICAgICAgIGNhcHR1cmVkOiAnb25Db21wb3NpdGlvblVwZGF0ZUNhcHR1cmUnXG4gICAgICAgIH0sXG4gICAgICAgIGRlcGVuZGVuY2llczogW1RPUF9CTFVSLCBUT1BfQ09NUE9TSVRJT05fVVBEQVRFLCBUT1BfS0VZX0RPV04sIFRPUF9LRVlfUFJFU1MsIFRPUF9LRVlfVVAsIFRPUF9NT1VTRV9ET1dOXVxuICAgIH1cbn07XG5cbi8vIFRyYWNrIHdoZXRoZXIgd2UndmUgZXZlciBoYW5kbGVkIGEga2V5cHJlc3Mgb24gdGhlIHNwYWNlIGtleS5cbmxldCBoYXNTcGFjZUtleXByZXNzID0gZmFsc2U7XG5cbi8qKlxuICogUmV0dXJuIHdoZXRoZXIgYSBuYXRpdmUga2V5cHJlc3MgZXZlbnQgaXMgYXNzdW1lZCB0byBiZSBhIGNvbW1hbmQuXG4gKiBUaGlzIGlzIHJlcXVpcmVkIGJlY2F1c2UgRmlyZWZveCBmaXJlcyBga2V5cHJlc3NgIGV2ZW50cyBmb3Iga2V5IGNvbW1hbmRzXG4gKiAoY3V0LCBjb3B5LCBzZWxlY3QtYWxsLCBldGMuKSBldmVuIHRob3VnaCBubyBjaGFyYWN0ZXIgaXMgaW5zZXJ0ZWQuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5cHJlc3NDb21tYW5kKG5hdGl2ZUV2ZW50KSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgKG5hdGl2ZUV2ZW50LmN0cmxLZXkgfHwgbmF0aXZlRXZlbnQuYWx0S2V5IHx8IG5hdGl2ZUV2ZW50Lm1ldGFLZXkpICYmXG4gICAgICAgIC8vIGN0cmxLZXkgJiYgYWx0S2V5IGlzIGVxdWl2YWxlbnQgdG8gQWx0R3IsIGFuZCBpcyBub3QgYSBjb21tYW5kLlxuICAgICAgICAhKG5hdGl2ZUV2ZW50LmN0cmxLZXkgJiYgbmF0aXZlRXZlbnQuYWx0S2V5KVxuICAgICk7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlIG5hdGl2ZSB0b3AgbGV2ZWwgZXZlbnRzIGludG8gZXZlbnQgdHlwZXMuXG4gKlxuICovXG5mdW5jdGlvbiBnZXRDb21wb3NpdGlvbkV2ZW50VHlwZSh0b3BMZXZlbFR5cGUpIHtcbiAgICBzd2l0Y2ggKHRvcExldmVsVHlwZSkge1xuICAgICAgICBjYXNlIFRPUF9DT01QT1NJVElPTl9TVEFSVDpcbiAgICAgICAgICAgIHJldHVybiBldmVudFR5cGVzLmNvbXBvc2l0aW9uU3RhcnQ7XG4gICAgICAgIGNhc2UgVE9QX0NPTVBPU0lUSU9OX0VORDpcbiAgICAgICAgICAgIHJldHVybiBldmVudFR5cGVzLmNvbXBvc2l0aW9uRW5kO1xuICAgICAgICBjYXNlIFRPUF9DT01QT1NJVElPTl9VUERBVEU6XG4gICAgICAgICAgICByZXR1cm4gZXZlbnRUeXBlcy5jb21wb3NpdGlvblVwZGF0ZTtcbiAgICB9XG59XG5cbi8qKlxuICogRG9lcyBvdXIgZmFsbGJhY2sgYmVzdC1ndWVzcyBtb2RlbCB0aGluayB0aGlzIGV2ZW50IHNpZ25pZmllcyB0aGF0XG4gKiBjb21wb3NpdGlvbiBoYXMgYmVndW4/XG4gKlxuICovXG5mdW5jdGlvbiBpc0ZhbGxiYWNrQ29tcG9zaXRpb25TdGFydCh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KSB7XG4gICAgcmV0dXJuIHRvcExldmVsVHlwZSA9PT0gVE9QX0tFWV9ET1dOICYmIG5hdGl2ZUV2ZW50LmtleUNvZGUgPT09IFNUQVJUX0tFWUNPREU7XG59XG5cbi8qKlxuICogRG9lcyBvdXIgZmFsbGJhY2sgbW9kZSB0aGluayB0aGF0IHRoaXMgZXZlbnQgaXMgdGhlIGVuZCBvZiBjb21wb3NpdGlvbj9cbiAqXG4gKi9cbmZ1bmN0aW9uIGlzRmFsbGJhY2tDb21wb3NpdGlvbkVuZCh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KSB7XG4gICAgc3dpdGNoICh0b3BMZXZlbFR5cGUpIHtcbiAgICAgICAgY2FzZSBUT1BfS0VZX1VQOlxuICAgICAgICAgICAgLy8gQ29tbWFuZCBrZXlzIGluc2VydCBvciBjbGVhciBJTUUgaW5wdXQuXG4gICAgICAgICAgICByZXR1cm4gRU5EX0tFWUNPREVTLmluZGV4T2YobmF0aXZlRXZlbnQua2V5Q29kZSkgIT09IC0xO1xuICAgICAgICBjYXNlIFRPUF9LRVlfRE9XTjpcbiAgICAgICAgICAgIC8vIEV4cGVjdCBJTUUga2V5Q29kZSBvbiBlYWNoIGtleWRvd24uIElmIHdlIGdldCBhbnkgb3RoZXJcbiAgICAgICAgICAgIC8vIGNvZGUgd2UgbXVzdCBoYXZlIGV4aXRlZCBlYXJsaWVyLlxuICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZUV2ZW50LmtleUNvZGUgIT09IFNUQVJUX0tFWUNPREU7XG4gICAgICAgIGNhc2UgVE9QX0tFWV9QUkVTUzpcbiAgICAgICAgY2FzZSBUT1BfTU9VU0VfRE9XTjpcbiAgICAgICAgY2FzZSBUT1BfQkxVUjpcbiAgICAgICAgICAgIC8vIEV2ZW50cyBhcmUgbm90IHBvc3NpYmxlIHdpdGhvdXQgY2FuY2VsbGluZyBJTUUuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogR29vZ2xlIElucHV0IFRvb2xzIHByb3ZpZGVzIGNvbXBvc2l0aW9uIGRhdGEgdmlhIGEgQ3VzdG9tRXZlbnQsXG4gKiB3aXRoIHRoZSBgZGF0YWAgcHJvcGVydHkgcG9wdWxhdGVkIGluIHRoZSBgZGV0YWlsYCBvYmplY3QuIElmIHRoaXNcbiAqIGlzIGF2YWlsYWJsZSBvbiB0aGUgZXZlbnQgb2JqZWN0LCB1c2UgaXQuIElmIG5vdCwgdGhpcyBpcyBhIHBsYWluXG4gKiBjb21wb3NpdGlvbiBldmVudCBhbmQgd2UgaGF2ZSBub3RoaW5nIHNwZWNpYWwgdG8gZXh0cmFjdC5cbiAqXG4gKi9cbmZ1bmN0aW9uIGdldERhdGFGcm9tQ3VzdG9tRXZlbnQobmF0aXZlRXZlbnQpIHtcbiAgICBjb25zdCBkZXRhaWwgPSBuYXRpdmVFdmVudC5kZXRhaWw7XG4gICAgaWYgKHR5cGVvZiBkZXRhaWwgPT09ICdvYmplY3QnICYmICdkYXRhJyBpbiBkZXRhaWwpIHtcbiAgICAgICAgcmV0dXJuIGRldGFpbC5kYXRhO1xuICAgIH1cbiAgICBpZiAobmF0aXZlRXZlbnQuZGF0YSkge1xuICAgICAgICByZXR1cm4gbmF0aXZlRXZlbnQuZGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBjb21wb3NpdGlvbiBldmVudCB3YXMgdHJpZ2dlcmVkIGJ5IEtvcmVhbiBJTUUuXG4gKiBPdXIgZmFsbGJhY2sgbW9kZSBkb2VzIG5vdCB3b3JrIHdlbGwgd2l0aCBJRSdzIEtvcmVhbiBJTUUsXG4gKiBzbyBqdXN0IHVzZSBuYXRpdmUgY29tcG9zaXRpb24gZXZlbnRzIHdoZW4gS29yZWFuIElNRSBpcyB1c2VkLlxuICogQWx0aG91Z2ggQ29tcG9zaXRpb25FdmVudC5sb2NhbGUgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCxcbiAqIGl0IGlzIGF2YWlsYWJsZSBpbiBJRSwgd2hlcmUgb3VyIGZhbGxiYWNrIG1vZGUgaXMgZW5hYmxlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIGlzVXNpbmdLb3JlYW5JTUUobmF0aXZlRXZlbnQpIHtcbiAgICByZXR1cm4gbmF0aXZlRXZlbnQubG9jYWxlID09PSAna28nO1xufVxuXG4vLyBUcmFjayB0aGUgY3VycmVudCBJTUUgY29tcG9zaXRpb24gc3RhdHVzLCBpZiBhbnkuXG5sZXQgaXNDb21wb3NpbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZXh0cmFjdENvbXBvc2l0aW9uRXZlbnQodG9wTGV2ZWxUeXBlLCB0YXJnZXRJbnN0LCBuYXRpdmVFdmVudCwgbmF0aXZlRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgZXZlbnRUeXBlO1xuICAgIGxldCBmYWxsYmFja0RhdGE7XG5cbiAgICBpZiAoY2FuVXNlQ29tcG9zaXRpb25FdmVudCkge1xuICAgICAgICBldmVudFR5cGUgPSBnZXRDb21wb3NpdGlvbkV2ZW50VHlwZSh0b3BMZXZlbFR5cGUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQ29tcG9zaW5nKSB7XG4gICAgICAgIGlmIChpc0ZhbGxiYWNrQ29tcG9zaXRpb25TdGFydCh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KSkge1xuICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlcy5jb21wb3NpdGlvblN0YXJ0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0ZhbGxiYWNrQ29tcG9zaXRpb25FbmQodG9wTGV2ZWxUeXBlLCBuYXRpdmVFdmVudCkpIHtcbiAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlcy5jb21wb3NpdGlvbkVuZDtcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50VHlwZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodXNlRmFsbGJhY2tDb21wb3NpdGlvbkRhdGEgJiYgIWlzVXNpbmdLb3JlYW5JTUUobmF0aXZlRXZlbnQpKSB7XG4gICAgICAgIC8vIFRoZSBjdXJyZW50IGNvbXBvc2l0aW9uIGlzIHN0b3JlZCBzdGF0aWNhbGx5IGFuZCBtdXN0IG5vdCBiZVxuICAgICAgICAvLyBvdmVyd3JpdHRlbiB3aGlsZSBjb21wb3NpdGlvbiBjb250aW51ZXMuXG4gICAgICAgIGlmICghaXNDb21wb3NpbmcgJiYgZXZlbnRUeXBlID09PSBldmVudFR5cGVzLmNvbXBvc2l0aW9uU3RhcnQpIHtcbiAgICAgICAgICAgIGlzQ29tcG9zaW5nID0gRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlSW5pdGlhbGl6ZShuYXRpdmVFdmVudFRhcmdldCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSBldmVudFR5cGVzLmNvbXBvc2l0aW9uRW5kKSB7XG4gICAgICAgICAgICBpZiAoaXNDb21wb3NpbmcpIHtcbiAgICAgICAgICAgICAgICBmYWxsYmFja0RhdGEgPSBGYWxsYmFja0NvbXBvc2l0aW9uU3RhdGVHZXREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAgIGNvbnN0IGV2ZW50ID0gU3ludGhldGljQ29tcG9zaXRpb25FdmVudC5nZXRQb29sZWQoXG4gICAgLy8gICAgIGV2ZW50VHlwZSxcbiAgICAvLyAgICAgdGFyZ2V0SW5zdCxcbiAgICAvLyAgICAgbmF0aXZlRXZlbnQsXG4gICAgLy8gICAgIG5hdGl2ZUV2ZW50VGFyZ2V0XG4gICAgLy8gICApO1xuICAgIGNvbnN0IGJlZm9yZUlucHV0RXZlbnQgPSBuZXcgQmVmb3JlSW5wdXRFdmVudCgpO1xuICAgIGJlZm9yZUlucHV0RXZlbnQubmF0aXZlRXZlbnQgPSBuYXRpdmVFdmVudDtcblxuICAgIGlmIChmYWxsYmFja0RhdGEpIHtcbiAgICAgICAgLy8gSW5qZWN0IGRhdGEgZ2VuZXJhdGVkIGZyb20gZmFsbGJhY2sgcGF0aCBpbnRvIHRoZSBzeW50aGV0aWMgZXZlbnQuXG4gICAgICAgIC8vIFRoaXMgbWF0Y2hlcyB0aGUgcHJvcGVydHkgb2YgbmF0aXZlIENvbXBvc2l0aW9uRXZlbnRJbnRlcmZhY2UuXG4gICAgICAgIGJlZm9yZUlucHV0RXZlbnQuZGF0YSA9IGZhbGxiYWNrRGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjdXN0b21EYXRhID0gZ2V0RGF0YUZyb21DdXN0b21FdmVudChuYXRpdmVFdmVudCk7XG4gICAgICAgIGlmIChjdXN0b21EYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICBiZWZvcmVJbnB1dEV2ZW50LmRhdGEgPSBjdXN0b21EYXRhO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBiZWZvcmVJbnB1dEV2ZW50O1xuICAgIC8vICAgYWNjdW11bGF0ZVR3b1BoYXNlRGlzcGF0Y2hlcyhldmVudCk7XG4gICAgLy8gICByZXR1cm4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIGdldE5hdGl2ZUJlZm9yZUlucHV0Q2hhcnModG9wTGV2ZWxUeXBlOiBhbnksIG5hdGl2ZUV2ZW50KSB7XG4gICAgc3dpdGNoICh0b3BMZXZlbFR5cGUpIHtcbiAgICAgICAgY2FzZSBUT1BfQ09NUE9TSVRJT05fRU5EOlxuICAgICAgICAgICAgaWYgKEhBU19URVhUX0lOUFVUKSB7XG4gICAgICAgICAgICAgICAgSEFTX1RFWFRfSU5QVVQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGF0YUZyb21DdXN0b21FdmVudChuYXRpdmVFdmVudCk7XG4gICAgICAgIGNhc2UgVE9QX0tFWV9QUkVTUzpcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSWYgbmF0aXZlIGB0ZXh0SW5wdXRgIGV2ZW50cyBhcmUgYXZhaWxhYmxlLCBvdXIgZ29hbCBpcyB0byBtYWtlXG4gICAgICAgICAgICAgKiB1c2Ugb2YgdGhlbS4gSG93ZXZlciwgdGhlcmUgaXMgYSBzcGVjaWFsIGNhc2U6IHRoZSBzcGFjZWJhciBrZXkuXG4gICAgICAgICAgICAgKiBJbiBXZWJraXQsIHByZXZlbnRpbmcgZGVmYXVsdCBvbiBhIHNwYWNlYmFyIGB0ZXh0SW5wdXRgIGV2ZW50XG4gICAgICAgICAgICAgKiBjYW5jZWxzIGNoYXJhY3RlciBpbnNlcnRpb24sIGJ1dCBpdCAqYWxzbyogY2F1c2VzIHRoZSBicm93c2VyXG4gICAgICAgICAgICAgKiB0byBmYWxsIGJhY2sgdG8gaXRzIGRlZmF1bHQgc3BhY2ViYXIgYmVoYXZpb3Igb2Ygc2Nyb2xsaW5nIHRoZVxuICAgICAgICAgICAgICogcGFnZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBUcmFja2luZyBhdDpcbiAgICAgICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNTUxMDNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBUbyBhdm9pZCB0aGlzIGlzc3VlLCB1c2UgdGhlIGtleXByZXNzIGV2ZW50IGFzIGlmIG5vIGB0ZXh0SW5wdXRgXG4gICAgICAgICAgICAgKiBldmVudCBpcyBhdmFpbGFibGUuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IHdoaWNoID0gbmF0aXZlRXZlbnQud2hpY2g7XG4gICAgICAgICAgICBpZiAod2hpY2ggIT09IFNQQUNFQkFSX0NPREUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFzU3BhY2VLZXlwcmVzcyA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gU1BBQ0VCQVJfQ0hBUjtcblxuICAgICAgICBjYXNlIFRPUF9URVhUX0lOUFVUOlxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBjaGFyYWN0ZXJzIHRvIGJlIGFkZGVkIHRvIHRoZSBET00uXG4gICAgICAgICAgICBjb25zdCBjaGFycyA9IG5hdGl2ZUV2ZW50LmRhdGE7XG5cbiAgICAgICAgICAgIC8vIElmIGl0J3MgYSBzcGFjZWJhciBjaGFyYWN0ZXIsIGFzc3VtZSB0aGF0IHdlIGhhdmUgYWxyZWFkeSBoYW5kbGVkXG4gICAgICAgICAgICAvLyBpdCBhdCB0aGUga2V5cHJlc3MgbGV2ZWwgYW5kIGJhaWwgaW1tZWRpYXRlbHkuIEFuZHJvaWQgQ2hyb21lXG4gICAgICAgICAgICAvLyBkb2Vzbid0IGdpdmUgdXMga2V5Y29kZXMsIHNvIHdlIG5lZWQgdG8gaWdub3JlIGl0LlxuICAgICAgICAgICAgaWYgKGNoYXJzID09PSBTUEFDRUJBUl9DSEFSICYmIGhhc1NwYWNlS2V5cHJlc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgSEFTX1RFWFRfSU5QVVQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGNoYXJzO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBGb3Igb3RoZXIgbmF0aXZlIGV2ZW50IHR5cGVzLCBkbyBub3RoaW5nLlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG4vKipcbiAqIEZvciBicm93c2VycyB0aGF0IGRvIG5vdCBwcm92aWRlIHRoZSBgdGV4dElucHV0YCBldmVudCwgZXh0cmFjdCB0aGVcbiAqIGFwcHJvcHJpYXRlIHN0cmluZyB0byB1c2UgZm9yIFN5bnRoZXRpY0lucHV0RXZlbnQuXG4gKlxuICovXG5mdW5jdGlvbiBnZXRGYWxsYmFja0JlZm9yZUlucHV0Q2hhcnModG9wTGV2ZWxUeXBlOiBhbnksIG5hdGl2ZUV2ZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGN1cnJlbnRseSBjb21wb3NpbmcgKElNRSkgYW5kIHVzaW5nIGEgZmFsbGJhY2sgdG8gZG8gc28sXG4gICAgLy8gdHJ5IHRvIGV4dHJhY3QgdGhlIGNvbXBvc2VkIGNoYXJhY3RlcnMgZnJvbSB0aGUgZmFsbGJhY2sgb2JqZWN0LlxuICAgIC8vIElmIGNvbXBvc2l0aW9uIGV2ZW50IGlzIGF2YWlsYWJsZSwgd2UgZXh0cmFjdCBhIHN0cmluZyBvbmx5IGF0XG4gICAgLy8gY29tcG9zaXRpb25ldmVudCwgb3RoZXJ3aXNlIGV4dHJhY3QgaXQgYXQgZmFsbGJhY2sgZXZlbnRzLlxuICAgIGlmIChpc0NvbXBvc2luZykge1xuICAgICAgICBpZiAodG9wTGV2ZWxUeXBlID09PSBUT1BfQ09NUE9TSVRJT05fRU5EIHx8ICghY2FuVXNlQ29tcG9zaXRpb25FdmVudCAmJiBpc0ZhbGxiYWNrQ29tcG9zaXRpb25FbmQodG9wTGV2ZWxUeXBlLCBuYXRpdmVFdmVudCkpKSB7XG4gICAgICAgICAgICBjb25zdCBjaGFycyA9IEZhbGxiYWNrQ29tcG9zaXRpb25TdGF0ZUdldERhdGEoKTtcbiAgICAgICAgICAgIEZhbGxiYWNrQ29tcG9zaXRpb25TdGF0ZVJlc2V0KCk7XG4gICAgICAgICAgICBpc0NvbXBvc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGNoYXJzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHN3aXRjaCAodG9wTGV2ZWxUeXBlKSB7XG4gICAgICAgIGNhc2UgVE9QX1BBU1RFOlxuICAgICAgICAgICAgLy8gSWYgYSBwYXN0ZSBldmVudCBvY2N1cnMgYWZ0ZXIgYSBrZXlwcmVzcywgdGhyb3cgb3V0IHRoZSBpbnB1dFxuICAgICAgICAgICAgLy8gY2hhcnMuIFBhc3RlIGV2ZW50cyBzaG91bGQgbm90IGxlYWQgdG8gQmVmb3JlSW5wdXQgZXZlbnRzLlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNhc2UgVE9QX0tFWV9QUkVTUzpcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXMgb2YgdjI3LCBGaXJlZm94IG1heSBmaXJlIGtleXByZXNzIGV2ZW50cyBldmVuIHdoZW4gbm8gY2hhcmFjdGVyXG4gICAgICAgICAgICAgKiB3aWxsIGJlIGluc2VydGVkLiBBIGZldyBwb3NzaWJpbGl0aWVzOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC0gYHdoaWNoYCBpcyBgMGAuIEFycm93IGtleXMsIEVzYyBrZXksIGV0Yy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAtIGB3aGljaGAgaXMgdGhlIHByZXNzZWQga2V5IGNvZGUsIGJ1dCBubyBjaGFyIGlzIGF2YWlsYWJsZS5cbiAgICAgICAgICAgICAqICAgRXg6ICdBbHRHciArIGRgIGluIFBvbGlzaC4gVGhlcmUgaXMgbm8gbW9kaWZpZWQgY2hhcmFjdGVyIGZvclxuICAgICAgICAgICAgICogICB0aGlzIGtleSBjb21iaW5hdGlvbiBhbmQgbm8gY2hhcmFjdGVyIGlzIGluc2VydGVkIGludG8gdGhlXG4gICAgICAgICAgICAgKiAgIGRvY3VtZW50LCBidXQgRkYgZmlyZXMgdGhlIGtleXByZXNzIGZvciBjaGFyIGNvZGUgYDEwMGAgYW55d2F5LlxuICAgICAgICAgICAgICogICBObyBgaW5wdXRgIGV2ZW50IHdpbGwgb2NjdXIuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLSBgd2hpY2hgIGlzIHRoZSBwcmVzc2VkIGtleSBjb2RlLCBidXQgYSBjb21tYW5kIGNvbWJpbmF0aW9uIGlzXG4gICAgICAgICAgICAgKiAgIGJlaW5nIHVzZWQuIEV4OiBgQ21kK0NgLiBObyBjaGFyYWN0ZXIgaXMgaW5zZXJ0ZWQsIGFuZCBub1xuICAgICAgICAgICAgICogICBgaW5wdXRgIGV2ZW50IHdpbGwgb2NjdXIuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmICghaXNLZXlwcmVzc0NvbW1hbmQobmF0aXZlRXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgLy8gSUUgZmlyZXMgdGhlIGBrZXlwcmVzc2AgZXZlbnQgd2hlbiBhIHVzZXIgdHlwZXMgYW4gZW1vamkgdmlhXG4gICAgICAgICAgICAgICAgLy8gVG91Y2gga2V5Ym9hcmQgb2YgV2luZG93cy4gIEluIHN1Y2ggYSBjYXNlLCB0aGUgYGNoYXJgIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgLy8gaG9sZHMgYW4gZW1vamkgY2hhcmFjdGVyIGxpa2UgYFxcdUQ4M0RcXHVERTBBYC4gIEJlY2F1c2UgaXRzIGxlbmd0aFxuICAgICAgICAgICAgICAgIC8vIGlzIDIsIHRoZSBwcm9wZXJ0eSBgd2hpY2hgIGRvZXMgbm90IHJlcHJlc2VudCBhbiBlbW9qaSBjb3JyZWN0bHkuXG4gICAgICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UsIHdlIGRpcmVjdGx5IHJldHVybiB0aGUgYGNoYXJgIHByb3BlcnR5IGluc3RlYWQgb2ZcbiAgICAgICAgICAgICAgICAvLyB1c2luZyBgd2hpY2hgLlxuICAgICAgICAgICAgICAgIGlmIChuYXRpdmVFdmVudC5jaGFyICYmIG5hdGl2ZUV2ZW50LmNoYXIubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmF0aXZlRXZlbnQuY2hhcjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5hdGl2ZUV2ZW50LndoaWNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKG5hdGl2ZUV2ZW50LndoaWNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY2FzZSBUT1BfQ09NUE9TSVRJT05fRU5EOlxuICAgICAgICAgICAgcmV0dXJuIHVzZUZhbGxiYWNrQ29tcG9zaXRpb25EYXRhICYmICFpc1VzaW5nS29yZWFuSU1FKG5hdGl2ZUV2ZW50KSA/IG51bGwgOiBuYXRpdmVFdmVudC5kYXRhO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYSBTeW50aGV0aWNJbnB1dEV2ZW50IGZvciBgYmVmb3JlSW5wdXRgLCBiYXNlZCBvbiBlaXRoZXIgbmF0aXZlXG4gKiBgdGV4dElucHV0YCBvciBmYWxsYmFjayBiZWhhdmlvci5cbiAqXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RCZWZvcmVJbnB1dEV2ZW50KHRvcExldmVsVHlwZSwgdGFyZ2V0SW5zdCwgbmF0aXZlRXZlbnQsIG5hdGl2ZUV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IGNoYXJzO1xuXG4gICAgaWYgKGNhblVzZVRleHRJbnB1dEV2ZW50KSB7XG4gICAgICAgIGNoYXJzID0gZ2V0TmF0aXZlQmVmb3JlSW5wdXRDaGFycyh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjaGFycyA9IGdldEZhbGxiYWNrQmVmb3JlSW5wdXRDaGFycyh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBjaGFyYWN0ZXJzIGFyZSBiZWluZyBpbnNlcnRlZCwgbm8gQmVmb3JlSW5wdXQgZXZlbnQgc2hvdWxkXG4gICAgLy8gYmUgZmlyZWQuXG4gICAgaWYgKCFjaGFycykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBiZWZvcmVJbnB1dEV2ZW50ID0gbmV3IEJlZm9yZUlucHV0RXZlbnQoKTtcbiAgICBiZWZvcmVJbnB1dEV2ZW50LmRhdGEgPSBjaGFycztcbiAgICBiZWZvcmVJbnB1dEV2ZW50Lm5hdGl2ZUV2ZW50ID0gbmF0aXZlRXZlbnQ7XG4gICAgcmV0dXJuIGJlZm9yZUlucHV0RXZlbnQ7XG4gICAgLy8gICBjb25zdCBldmVudCA9IFN5bnRoZXRpY0lucHV0RXZlbnQuZ2V0UG9vbGVkKFxuICAgIC8vICAgICBldmVudFR5cGVzLmJlZm9yZUlucHV0LFxuICAgIC8vICAgICB0YXJnZXRJbnN0LFxuICAgIC8vICAgICBuYXRpdmVFdmVudCxcbiAgICAvLyAgICAgbmF0aXZlRXZlbnRUYXJnZXRcbiAgICAvLyAgICk7XG5cbiAgICAvLyAgIGV2ZW50LmRhdGEgPSBjaGFycztcbiAgICAvLyAgIGFjY3VtdWxhdGVUd29QaGFzZURpc3BhdGNoZXMoZXZlbnQpO1xuICAgIC8vICAgcmV0dXJuIGV2ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBgb25CZWZvcmVJbnB1dGAgZXZlbnQgdG8gbWF0Y2hcbiAqIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTMvV0QtRE9NLUxldmVsLTMtRXZlbnRzLTIwMTMxMTA1LyNldmVudHMtaW5wdXRldmVudHMuXG4gKlxuICogVGhpcyBldmVudCBwbHVnaW4gaXMgYmFzZWQgb24gdGhlIG5hdGl2ZSBgdGV4dElucHV0YCBldmVudFxuICogYXZhaWxhYmxlIGluIENocm9tZSwgU2FmYXJpLCBPcGVyYSwgYW5kIElFLiBUaGlzIGV2ZW50IGZpcmVzIGFmdGVyXG4gKiBgb25LZXlQcmVzc2AgYW5kIGBvbkNvbXBvc2l0aW9uRW5kYCwgYnV0IGJlZm9yZSBgb25JbnB1dGAuXG4gKlxuICogYGJlZm9yZUlucHV0YCBpcyBzcGVjJ2QgYnV0IG5vdCBpbXBsZW1lbnRlZCBpbiBhbnkgYnJvd3NlcnMsIGFuZFxuICogdGhlIGBpbnB1dGAgZXZlbnQgZG9lcyBub3QgcHJvdmlkZSBhbnkgdXNlZnVsIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgaGFzXG4gKiBhY3R1YWxseSBiZWVuIGFkZGVkLCBjb250cmFyeSB0byB0aGUgc3BlYy4gVGh1cywgYHRleHRJbnB1dGAgaXMgdGhlIGJlc3RcbiAqIGF2YWlsYWJsZSBldmVudCB0byBpZGVudGlmeSB0aGUgY2hhcmFjdGVycyB0aGF0IGhhdmUgYWN0dWFsbHkgYmVlbiBpbnNlcnRlZFxuICogaW50byB0aGUgdGFyZ2V0IG5vZGUuXG4gKlxuICogVGhpcyBwbHVnaW4gaXMgYWxzbyByZXNwb25zaWJsZSBmb3IgZW1pdHRpbmcgYGNvbXBvc2l0aW9uYCBldmVudHMsIHRodXNcbiAqIGFsbG93aW5nIHVzIHRvIHNoYXJlIGNvbXBvc2l0aW9uIGZhbGxiYWNrIGNvZGUgZm9yIGJvdGggYGJlZm9yZUlucHV0YCBhbmRcbiAqIGBjb21wb3NpdGlvbmAgZXZlbnQgdHlwZXMuXG4gKi9cbmNvbnN0IEJlZm9yZUlucHV0RXZlbnRQbHVnaW4gPSB7XG4gICAgLy8gICBldmVudFR5cGVzOiBldmVudFR5cGVzLFxuXG4gICAgZXh0cmFjdEV2ZW50czogKHRvcExldmVsVHlwZSwgdGFyZ2V0SW5zdCwgbmF0aXZlRXZlbnQsIG5hdGl2ZUV2ZW50VGFyZ2V0KSA9PiB7XG4gICAgICAgIGNvbnN0IGJlZm9yZUlucHV0ID0gZXh0cmFjdEJlZm9yZUlucHV0RXZlbnQodG9wTGV2ZWxUeXBlLCB0YXJnZXRJbnN0LCBuYXRpdmVFdmVudCwgbmF0aXZlRXZlbnRUYXJnZXQpO1xuICAgICAgICBpZiAoYmVmb3JlSW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiZWZvcmVJbnB1dDtcbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBCZWZvcmVJbnB1dEV2ZW50UGx1Z2luO1xuIl19