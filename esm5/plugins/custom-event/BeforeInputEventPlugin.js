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
var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
var START_KEYCODE = 229;
var HAS_TEXT_INPUT = false;
var canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;
var documentMode = null;
if (canUseDOM && 'documentMode' in document) {
    documentMode = document.documentMode;
}
// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
var canUseTextInputEvent = canUseDOM && 'TextEvent' in window && !documentMode;
// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || (documentMode && documentMode > 8 && documentMode <= 11));
var SPACEBAR_CODE = 32;
var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
// Events and their corresponding property names.
var eventTypes = {
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
var hasSpaceKeypress = false;
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
    var detail = nativeEvent.detail;
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
var isComposing = false;
function extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var eventType;
    var fallbackData;
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
    var beforeInputEvent = new BeforeInputEvent();
    beforeInputEvent.nativeEvent = nativeEvent;
    if (fallbackData) {
        // Inject data generated from fallback path into the synthetic event.
        // This matches the property of native CompositionEventInterface.
        beforeInputEvent.data = fallbackData;
    }
    else {
        var customData = getDataFromCustomEvent(nativeEvent);
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
            var which = nativeEvent.which;
            if (which !== SPACEBAR_CODE) {
                return null;
            }
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
        case TOP_TEXT_INPUT:
            // Record the characters to be added to the DOM.
            var chars = nativeEvent.data;
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
            var chars = FallbackCompositionStateGetData();
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
    var chars;
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
    var beforeInputEvent = new BeforeInputEvent();
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
var ɵ0 = function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);
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
var BeforeInputEventPlugin = {
    //   eventTypes: eventTypes,
    extractEvents: ɵ0
};
export default BeforeInputEventPlugin;
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmVmb3JlSW5wdXRFdmVudFBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInBsdWdpbnMvY3VzdG9tLWV2ZW50L0JlZm9yZUlucHV0RXZlbnRQbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0dBS0c7QUFFSCxzRUFBc0U7QUFFdEUsK0VBQStFO0FBQy9FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUU5RCxPQUFPLEVBQ0gsUUFBUSxFQUNSLHFCQUFxQixFQUNyQixtQkFBbUIsRUFDbkIsc0JBQXNCLEVBQ3RCLFlBQVksRUFDWixhQUFhLEVBQ2IsVUFBVSxFQUNWLGNBQWMsRUFDZCxjQUFjLEVBQ2QsU0FBUyxFQUNaLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUNILE9BQU8sSUFBSSwrQkFBK0IsRUFDMUMsVUFBVSxJQUFJLGtDQUFrQyxFQUNoRCxLQUFLLElBQUksNkJBQTZCLEVBQ3pDLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDeEQsdUVBQXVFO0FBQ3ZFLDJEQUEyRDtBQUUzRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO0FBQ2hFLElBQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUMxQixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFFM0IsSUFBTSxzQkFBc0IsR0FBRyxTQUFTLElBQUksa0JBQWtCLElBQUksTUFBTSxDQUFDO0FBRXpFLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztBQUN4QixJQUFJLFNBQVMsSUFBSSxjQUFjLElBQUksUUFBUSxFQUFFO0lBQ3pDLFlBQVksR0FBSSxRQUFnQixDQUFDLFlBQVksQ0FBQztDQUNqRDtBQUVELG9FQUFvRTtBQUNwRSx1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eUIsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDaEU7U0FBTTtRQUNILEtBQUssR0FBRywyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDbEU7SUFFRCxtRUFBbUU7SUFDbkUsWUFBWTtJQUNaLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDUixPQUFPLElBQUksQ0FBQztLQUNmO0lBRUQsSUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7SUFDaEQsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUM5QixnQkFBZ0IsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBQzNDLE9BQU8sZ0JBQWdCLENBQUM7SUFDeEIsaURBQWlEO0lBQ2pELDhCQUE4QjtJQUM5QixrQkFBa0I7SUFDbEIsbUJBQW1CO0lBQ25CLHdCQUF3QjtJQUN4QixPQUFPO0lBRVAsd0JBQXdCO0lBQ3hCLHlDQUF5QztJQUN6QyxrQkFBa0I7QUFDdEIsQ0FBQztTQXVCa0IsVUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxpQkFBaUI7SUFDcEUsSUFBTSxXQUFXLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7UUFDdEIsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUEzQkw7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsSUFBTSxzQkFBc0IsR0FBRztJQUMzQiw0QkFBNEI7SUFFNUIsYUFBYSxJQU1aO0NBQ0osQ0FBQztBQUVGLGVBQWUsc0JBQXNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8vIGltcG9ydCB0eXBlIHtUb3BMZXZlbFR5cGV9IGZyb20gJ2xlZ2FjeS1ldmVudHMvVG9wTGV2ZWxFdmVudFR5cGVzJztcblxuLy8gaW1wb3J0IHthY2N1bXVsYXRlVHdvUGhhc2VEaXNwYXRjaGVzfSBmcm9tICdsZWdhY3ktZXZlbnRzL0V2ZW50UHJvcGFnYXRvcnMnO1xuaW1wb3J0IHsgY2FuVXNlRE9NIH0gZnJvbSAnLi4vLi4vc2hhcmVkL0V4ZWN1dGlvbkVudmlyb25tZW50JztcblxuaW1wb3J0IHtcbiAgICBUT1BfQkxVUixcbiAgICBUT1BfQ09NUE9TSVRJT05fU1RBUlQsXG4gICAgVE9QX0NPTVBPU0lUSU9OX0VORCxcbiAgICBUT1BfQ09NUE9TSVRJT05fVVBEQVRFLFxuICAgIFRPUF9LRVlfRE9XTixcbiAgICBUT1BfS0VZX1BSRVNTLFxuICAgIFRPUF9LRVlfVVAsXG4gICAgVE9QX01PVVNFX0RPV04sXG4gICAgVE9QX1RFWFRfSU5QVVQsXG4gICAgVE9QX1BBU1RFXG59IGZyb20gJy4vRE9NVG9wTGV2ZWxFdmVudFR5cGVzJztcbmltcG9ydCB7XG4gICAgZ2V0RGF0YSBhcyBGYWxsYmFja0NvbXBvc2l0aW9uU3RhdGVHZXREYXRhLFxuICAgIGluaXRpYWxpemUgYXMgRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlSW5pdGlhbGl6ZSxcbiAgICByZXNldCBhcyBGYWxsYmFja0NvbXBvc2l0aW9uU3RhdGVSZXNldFxufSBmcm9tICcuL0ZhbGxiYWNrQ29tcG9zaXRpb25TdGF0ZSc7XG5pbXBvcnQgeyBCZWZvcmVJbnB1dEV2ZW50IH0gZnJvbSAnLi9iZWZvcmUtaW5wdXQtZXZlbnQnO1xuLy8gaW1wb3J0IFN5bnRoZXRpY0NvbXBvc2l0aW9uRXZlbnQgZnJvbSAnLi9TeW50aGV0aWNDb21wb3NpdGlvbkV2ZW50Jztcbi8vIGltcG9ydCBTeW50aGV0aWNJbnB1dEV2ZW50IGZyb20gJy4vU3ludGhldGljSW5wdXRFdmVudCc7XG5cbmNvbnN0IEVORF9LRVlDT0RFUyA9IFs5LCAxMywgMjcsIDMyXTsgLy8gVGFiLCBSZXR1cm4sIEVzYywgU3BhY2VcbmNvbnN0IFNUQVJUX0tFWUNPREUgPSAyMjk7XG5sZXQgSEFTX1RFWFRfSU5QVVQgPSBmYWxzZTtcblxuY29uc3QgY2FuVXNlQ29tcG9zaXRpb25FdmVudCA9IGNhblVzZURPTSAmJiAnQ29tcG9zaXRpb25FdmVudCcgaW4gd2luZG93O1xuXG5sZXQgZG9jdW1lbnRNb2RlID0gbnVsbDtcbmlmIChjYW5Vc2VET00gJiYgJ2RvY3VtZW50TW9kZScgaW4gZG9jdW1lbnQpIHtcbiAgICBkb2N1bWVudE1vZGUgPSAoZG9jdW1lbnQgYXMgYW55KS5kb2N1bWVudE1vZGU7XG59XG5cbi8vIFdlYmtpdCBvZmZlcnMgYSB2ZXJ5IHVzZWZ1bCBgdGV4dElucHV0YCBldmVudCB0aGF0IGNhbiBiZSB1c2VkIHRvXG4vLyBkaXJlY3RseSByZXByZXNlbnQgYGJlZm9yZUlucHV0YC4gVGhlIElFIGB0ZXh0aW5wdXRgIGV2ZW50IGlzIG5vdCBhc1xuLy8gdXNlZnVsLCBzbyB3ZSBkb24ndCB1c2UgaXQuXG5jb25zdCBjYW5Vc2VUZXh0SW5wdXRFdmVudCA9IGNhblVzZURPTSAmJiAnVGV4dEV2ZW50JyBpbiB3aW5kb3cgJiYgIWRvY3VtZW50TW9kZTtcblxuLy8gSW4gSUU5Kywgd2UgaGF2ZSBhY2Nlc3MgdG8gY29tcG9zaXRpb24gZXZlbnRzLCBidXQgdGhlIGRhdGEgc3VwcGxpZWRcbi8vIGJ5IHRoZSBuYXRpdmUgY29tcG9zaXRpb25lbmQgZXZlbnQgbWF5IGJlIGluY29ycmVjdC4gSmFwYW5lc2UgaWRlb2dyYXBoaWNcbi8vIHNwYWNlcywgZm9yIGluc3RhbmNlIChcXHUzMDAwKSBhcmUgbm90IHJlY29yZGVkIGNvcnJlY3RseS5cbmNvbnN0IHVzZUZhbGxiYWNrQ29tcG9zaXRpb25EYXRhID0gY2FuVXNlRE9NICYmICghY2FuVXNlQ29tcG9zaXRpb25FdmVudCB8fCAoZG9jdW1lbnRNb2RlICYmIGRvY3VtZW50TW9kZSA+IDggJiYgZG9jdW1lbnRNb2RlIDw9IDExKSk7XG5cbmNvbnN0IFNQQUNFQkFSX0NPREUgPSAzMjtcbmNvbnN0IFNQQUNFQkFSX0NIQVIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFNQQUNFQkFSX0NPREUpO1xuXG4vLyBFdmVudHMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgbmFtZXMuXG5jb25zdCBldmVudFR5cGVzID0ge1xuICAgIGJlZm9yZUlucHV0OiB7XG4gICAgICAgIHBoYXNlZFJlZ2lzdHJhdGlvbk5hbWVzOiB7XG4gICAgICAgICAgICBidWJibGVkOiAnb25CZWZvcmVJbnB1dCcsXG4gICAgICAgICAgICBjYXB0dXJlZDogJ29uQmVmb3JlSW5wdXRDYXB0dXJlJ1xuICAgICAgICB9LFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFtUT1BfQ09NUE9TSVRJT05fRU5ELCBUT1BfS0VZX1BSRVNTLCBUT1BfVEVYVF9JTlBVVCwgVE9QX1BBU1RFXVxuICAgIH0sXG4gICAgY29tcG9zaXRpb25FbmQ6IHtcbiAgICAgICAgcGhhc2VkUmVnaXN0cmF0aW9uTmFtZXM6IHtcbiAgICAgICAgICAgIGJ1YmJsZWQ6ICdvbkNvbXBvc2l0aW9uRW5kJyxcbiAgICAgICAgICAgIGNhcHR1cmVkOiAnb25Db21wb3NpdGlvbkVuZENhcHR1cmUnXG4gICAgICAgIH0sXG4gICAgICAgIGRlcGVuZGVuY2llczogW1RPUF9CTFVSLCBUT1BfQ09NUE9TSVRJT05fRU5ELCBUT1BfS0VZX0RPV04sIFRPUF9LRVlfUFJFU1MsIFRPUF9LRVlfVVAsIFRPUF9NT1VTRV9ET1dOXVxuICAgIH0sXG4gICAgY29tcG9zaXRpb25TdGFydDoge1xuICAgICAgICBwaGFzZWRSZWdpc3RyYXRpb25OYW1lczoge1xuICAgICAgICAgICAgYnViYmxlZDogJ29uQ29tcG9zaXRpb25TdGFydCcsXG4gICAgICAgICAgICBjYXB0dXJlZDogJ29uQ29tcG9zaXRpb25TdGFydENhcHR1cmUnXG4gICAgICAgIH0sXG4gICAgICAgIGRlcGVuZGVuY2llczogW1RPUF9CTFVSLCBUT1BfQ09NUE9TSVRJT05fU1RBUlQsIFRPUF9LRVlfRE9XTiwgVE9QX0tFWV9QUkVTUywgVE9QX0tFWV9VUCwgVE9QX01PVVNFX0RPV05dXG4gICAgfSxcbiAgICBjb21wb3NpdGlvblVwZGF0ZToge1xuICAgICAgICBwaGFzZWRSZWdpc3RyYXRpb25OYW1lczoge1xuICAgICAgICAgICAgYnViYmxlZDogJ29uQ29tcG9zaXRpb25VcGRhdGUnLFxuICAgICAgICAgICAgY2FwdHVyZWQ6ICdvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZSdcbiAgICAgICAgfSxcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbVE9QX0JMVVIsIFRPUF9DT01QT1NJVElPTl9VUERBVEUsIFRPUF9LRVlfRE9XTiwgVE9QX0tFWV9QUkVTUywgVE9QX0tFWV9VUCwgVE9QX01PVVNFX0RPV05dXG4gICAgfVxufTtcblxuLy8gVHJhY2sgd2hldGhlciB3ZSd2ZSBldmVyIGhhbmRsZWQgYSBrZXlwcmVzcyBvbiB0aGUgc3BhY2Uga2V5LlxubGV0IGhhc1NwYWNlS2V5cHJlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBSZXR1cm4gd2hldGhlciBhIG5hdGl2ZSBrZXlwcmVzcyBldmVudCBpcyBhc3N1bWVkIHRvIGJlIGEgY29tbWFuZC5cbiAqIFRoaXMgaXMgcmVxdWlyZWQgYmVjYXVzZSBGaXJlZm94IGZpcmVzIGBrZXlwcmVzc2AgZXZlbnRzIGZvciBrZXkgY29tbWFuZHNcbiAqIChjdXQsIGNvcHksIHNlbGVjdC1hbGwsIGV0Yy4pIGV2ZW4gdGhvdWdoIG5vIGNoYXJhY3RlciBpcyBpbnNlcnRlZC5cbiAqL1xuZnVuY3Rpb24gaXNLZXlwcmVzc0NvbW1hbmQobmF0aXZlRXZlbnQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICAobmF0aXZlRXZlbnQuY3RybEtleSB8fCBuYXRpdmVFdmVudC5hbHRLZXkgfHwgbmF0aXZlRXZlbnQubWV0YUtleSkgJiZcbiAgICAgICAgLy8gY3RybEtleSAmJiBhbHRLZXkgaXMgZXF1aXZhbGVudCB0byBBbHRHciwgYW5kIGlzIG5vdCBhIGNvbW1hbmQuXG4gICAgICAgICEobmF0aXZlRXZlbnQuY3RybEtleSAmJiBuYXRpdmVFdmVudC5hbHRLZXkpXG4gICAgKTtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGUgbmF0aXZlIHRvcCBsZXZlbCBldmVudHMgaW50byBldmVudCB0eXBlcy5cbiAqXG4gKi9cbmZ1bmN0aW9uIGdldENvbXBvc2l0aW9uRXZlbnRUeXBlKHRvcExldmVsVHlwZSkge1xuICAgIHN3aXRjaCAodG9wTGV2ZWxUeXBlKSB7XG4gICAgICAgIGNhc2UgVE9QX0NPTVBPU0lUSU9OX1NUQVJUOlxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50VHlwZXMuY29tcG9zaXRpb25TdGFydDtcbiAgICAgICAgY2FzZSBUT1BfQ09NUE9TSVRJT05fRU5EOlxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50VHlwZXMuY29tcG9zaXRpb25FbmQ7XG4gICAgICAgIGNhc2UgVE9QX0NPTVBPU0lUSU9OX1VQREFURTpcbiAgICAgICAgICAgIHJldHVybiBldmVudFR5cGVzLmNvbXBvc2l0aW9uVXBkYXRlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBEb2VzIG91ciBmYWxsYmFjayBiZXN0LWd1ZXNzIG1vZGVsIHRoaW5rIHRoaXMgZXZlbnQgc2lnbmlmaWVzIHRoYXRcbiAqIGNvbXBvc2l0aW9uIGhhcyBiZWd1bj9cbiAqXG4gKi9cbmZ1bmN0aW9uIGlzRmFsbGJhY2tDb21wb3NpdGlvblN0YXJ0KHRvcExldmVsVHlwZSwgbmF0aXZlRXZlbnQpIHtcbiAgICByZXR1cm4gdG9wTGV2ZWxUeXBlID09PSBUT1BfS0VZX0RPV04gJiYgbmF0aXZlRXZlbnQua2V5Q29kZSA9PT0gU1RBUlRfS0VZQ09ERTtcbn1cblxuLyoqXG4gKiBEb2VzIG91ciBmYWxsYmFjayBtb2RlIHRoaW5rIHRoYXQgdGhpcyBldmVudCBpcyB0aGUgZW5kIG9mIGNvbXBvc2l0aW9uP1xuICpcbiAqL1xuZnVuY3Rpb24gaXNGYWxsYmFja0NvbXBvc2l0aW9uRW5kKHRvcExldmVsVHlwZSwgbmF0aXZlRXZlbnQpIHtcbiAgICBzd2l0Y2ggKHRvcExldmVsVHlwZSkge1xuICAgICAgICBjYXNlIFRPUF9LRVlfVVA6XG4gICAgICAgICAgICAvLyBDb21tYW5kIGtleXMgaW5zZXJ0IG9yIGNsZWFyIElNRSBpbnB1dC5cbiAgICAgICAgICAgIHJldHVybiBFTkRfS0VZQ09ERVMuaW5kZXhPZihuYXRpdmVFdmVudC5rZXlDb2RlKSAhPT0gLTE7XG4gICAgICAgIGNhc2UgVE9QX0tFWV9ET1dOOlxuICAgICAgICAgICAgLy8gRXhwZWN0IElNRSBrZXlDb2RlIG9uIGVhY2gga2V5ZG93bi4gSWYgd2UgZ2V0IGFueSBvdGhlclxuICAgICAgICAgICAgLy8gY29kZSB3ZSBtdXN0IGhhdmUgZXhpdGVkIGVhcmxpZXIuXG4gICAgICAgICAgICByZXR1cm4gbmF0aXZlRXZlbnQua2V5Q29kZSAhPT0gU1RBUlRfS0VZQ09ERTtcbiAgICAgICAgY2FzZSBUT1BfS0VZX1BSRVNTOlxuICAgICAgICBjYXNlIFRPUF9NT1VTRV9ET1dOOlxuICAgICAgICBjYXNlIFRPUF9CTFVSOlxuICAgICAgICAgICAgLy8gRXZlbnRzIGFyZSBub3QgcG9zc2libGUgd2l0aG91dCBjYW5jZWxsaW5nIElNRS5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHb29nbGUgSW5wdXQgVG9vbHMgcHJvdmlkZXMgY29tcG9zaXRpb24gZGF0YSB2aWEgYSBDdXN0b21FdmVudCxcbiAqIHdpdGggdGhlIGBkYXRhYCBwcm9wZXJ0eSBwb3B1bGF0ZWQgaW4gdGhlIGBkZXRhaWxgIG9iamVjdC4gSWYgdGhpc1xuICogaXMgYXZhaWxhYmxlIG9uIHRoZSBldmVudCBvYmplY3QsIHVzZSBpdC4gSWYgbm90LCB0aGlzIGlzIGEgcGxhaW5cbiAqIGNvbXBvc2l0aW9uIGV2ZW50IGFuZCB3ZSBoYXZlIG5vdGhpbmcgc3BlY2lhbCB0byBleHRyYWN0LlxuICpcbiAqL1xuZnVuY3Rpb24gZ2V0RGF0YUZyb21DdXN0b21FdmVudChuYXRpdmVFdmVudCkge1xuICAgIGNvbnN0IGRldGFpbCA9IG5hdGl2ZUV2ZW50LmRldGFpbDtcbiAgICBpZiAodHlwZW9mIGRldGFpbCA9PT0gJ29iamVjdCcgJiYgJ2RhdGEnIGluIGRldGFpbCkge1xuICAgICAgICByZXR1cm4gZGV0YWlsLmRhdGE7XG4gICAgfVxuICAgIGlmIChuYXRpdmVFdmVudC5kYXRhKSB7XG4gICAgICAgIHJldHVybiBuYXRpdmVFdmVudC5kYXRhO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGNvbXBvc2l0aW9uIGV2ZW50IHdhcyB0cmlnZ2VyZWQgYnkgS29yZWFuIElNRS5cbiAqIE91ciBmYWxsYmFjayBtb2RlIGRvZXMgbm90IHdvcmsgd2VsbCB3aXRoIElFJ3MgS29yZWFuIElNRSxcbiAqIHNvIGp1c3QgdXNlIG5hdGl2ZSBjb21wb3NpdGlvbiBldmVudHMgd2hlbiBLb3JlYW4gSU1FIGlzIHVzZWQuXG4gKiBBbHRob3VnaCBDb21wb3NpdGlvbkV2ZW50LmxvY2FsZSBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkLFxuICogaXQgaXMgYXZhaWxhYmxlIGluIElFLCB3aGVyZSBvdXIgZmFsbGJhY2sgbW9kZSBpcyBlbmFibGVkLlxuICpcbiAqL1xuZnVuY3Rpb24gaXNVc2luZ0tvcmVhbklNRShuYXRpdmVFdmVudCkge1xuICAgIHJldHVybiBuYXRpdmVFdmVudC5sb2NhbGUgPT09ICdrbyc7XG59XG5cbi8vIFRyYWNrIHRoZSBjdXJyZW50IElNRSBjb21wb3NpdGlvbiBzdGF0dXMsIGlmIGFueS5cbmxldCBpc0NvbXBvc2luZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBleHRyYWN0Q29tcG9zaXRpb25FdmVudCh0b3BMZXZlbFR5cGUsIHRhcmdldEluc3QsIG5hdGl2ZUV2ZW50LCBuYXRpdmVFdmVudFRhcmdldCkge1xuICAgIGxldCBldmVudFR5cGU7XG4gICAgbGV0IGZhbGxiYWNrRGF0YTtcblxuICAgIGlmIChjYW5Vc2VDb21wb3NpdGlvbkV2ZW50KSB7XG4gICAgICAgIGV2ZW50VHlwZSA9IGdldENvbXBvc2l0aW9uRXZlbnRUeXBlKHRvcExldmVsVHlwZSk7XG4gICAgfSBlbHNlIGlmICghaXNDb21wb3NpbmcpIHtcbiAgICAgICAgaWYgKGlzRmFsbGJhY2tDb21wb3NpdGlvblN0YXJ0KHRvcExldmVsVHlwZSwgbmF0aXZlRXZlbnQpKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGVzLmNvbXBvc2l0aW9uU3RhcnQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzRmFsbGJhY2tDb21wb3NpdGlvbkVuZCh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KSkge1xuICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGVzLmNvbXBvc2l0aW9uRW5kO1xuICAgIH1cblxuICAgIGlmICghZXZlbnRUeXBlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh1c2VGYWxsYmFja0NvbXBvc2l0aW9uRGF0YSAmJiAhaXNVc2luZ0tvcmVhbklNRShuYXRpdmVFdmVudCkpIHtcbiAgICAgICAgLy8gVGhlIGN1cnJlbnQgY29tcG9zaXRpb24gaXMgc3RvcmVkIHN0YXRpY2FsbHkgYW5kIG11c3Qgbm90IGJlXG4gICAgICAgIC8vIG92ZXJ3cml0dGVuIHdoaWxlIGNvbXBvc2l0aW9uIGNvbnRpbnVlcy5cbiAgICAgICAgaWYgKCFpc0NvbXBvc2luZyAmJiBldmVudFR5cGUgPT09IGV2ZW50VHlwZXMuY29tcG9zaXRpb25TdGFydCkge1xuICAgICAgICAgICAgaXNDb21wb3NpbmcgPSBGYWxsYmFja0NvbXBvc2l0aW9uU3RhdGVJbml0aWFsaXplKG5hdGl2ZUV2ZW50VGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IGV2ZW50VHlwZXMuY29tcG9zaXRpb25FbmQpIHtcbiAgICAgICAgICAgIGlmIChpc0NvbXBvc2luZykge1xuICAgICAgICAgICAgICAgIGZhbGxiYWNrRGF0YSA9IEZhbGxiYWNrQ29tcG9zaXRpb25TdGF0ZUdldERhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vICAgY29uc3QgZXZlbnQgPSBTeW50aGV0aWNDb21wb3NpdGlvbkV2ZW50LmdldFBvb2xlZChcbiAgICAvLyAgICAgZXZlbnRUeXBlLFxuICAgIC8vICAgICB0YXJnZXRJbnN0LFxuICAgIC8vICAgICBuYXRpdmVFdmVudCxcbiAgICAvLyAgICAgbmF0aXZlRXZlbnRUYXJnZXRcbiAgICAvLyAgICk7XG4gICAgY29uc3QgYmVmb3JlSW5wdXRFdmVudCA9IG5ldyBCZWZvcmVJbnB1dEV2ZW50KCk7XG4gICAgYmVmb3JlSW5wdXRFdmVudC5uYXRpdmVFdmVudCA9IG5hdGl2ZUV2ZW50O1xuXG4gICAgaWYgKGZhbGxiYWNrRGF0YSkge1xuICAgICAgICAvLyBJbmplY3QgZGF0YSBnZW5lcmF0ZWQgZnJvbSBmYWxsYmFjayBwYXRoIGludG8gdGhlIHN5bnRoZXRpYyBldmVudC5cbiAgICAgICAgLy8gVGhpcyBtYXRjaGVzIHRoZSBwcm9wZXJ0eSBvZiBuYXRpdmUgQ29tcG9zaXRpb25FdmVudEludGVyZmFjZS5cbiAgICAgICAgYmVmb3JlSW5wdXRFdmVudC5kYXRhID0gZmFsbGJhY2tEYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGN1c3RvbURhdGEgPSBnZXREYXRhRnJvbUN1c3RvbUV2ZW50KG5hdGl2ZUV2ZW50KTtcbiAgICAgICAgaWYgKGN1c3RvbURhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGJlZm9yZUlucHV0RXZlbnQuZGF0YSA9IGN1c3RvbURhdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJlZm9yZUlucHV0RXZlbnQ7XG4gICAgLy8gICBhY2N1bXVsYXRlVHdvUGhhc2VEaXNwYXRjaGVzKGV2ZW50KTtcbiAgICAvLyAgIHJldHVybiBldmVudDtcbn1cblxuZnVuY3Rpb24gZ2V0TmF0aXZlQmVmb3JlSW5wdXRDaGFycyh0b3BMZXZlbFR5cGU6IGFueSwgbmF0aXZlRXZlbnQpIHtcbiAgICBzd2l0Y2ggKHRvcExldmVsVHlwZSkge1xuICAgICAgICBjYXNlIFRPUF9DT01QT1NJVElPTl9FTkQ6XG4gICAgICAgICAgICBpZiAoSEFTX1RFWFRfSU5QVVQpIHtcbiAgICAgICAgICAgICAgICBIQVNfVEVYVF9JTlBVVCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBnZXREYXRhRnJvbUN1c3RvbUV2ZW50KG5hdGl2ZUV2ZW50KTtcbiAgICAgICAgY2FzZSBUT1BfS0VZX1BSRVNTOlxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBJZiBuYXRpdmUgYHRleHRJbnB1dGAgZXZlbnRzIGFyZSBhdmFpbGFibGUsIG91ciBnb2FsIGlzIHRvIG1ha2VcbiAgICAgICAgICAgICAqIHVzZSBvZiB0aGVtLiBIb3dldmVyLCB0aGVyZSBpcyBhIHNwZWNpYWwgY2FzZTogdGhlIHNwYWNlYmFyIGtleS5cbiAgICAgICAgICAgICAqIEluIFdlYmtpdCwgcHJldmVudGluZyBkZWZhdWx0IG9uIGEgc3BhY2ViYXIgYHRleHRJbnB1dGAgZXZlbnRcbiAgICAgICAgICAgICAqIGNhbmNlbHMgY2hhcmFjdGVyIGluc2VydGlvbiwgYnV0IGl0ICphbHNvKiBjYXVzZXMgdGhlIGJyb3dzZXJcbiAgICAgICAgICAgICAqIHRvIGZhbGwgYmFjayB0byBpdHMgZGVmYXVsdCBzcGFjZWJhciBiZWhhdmlvciBvZiBzY3JvbGxpbmcgdGhlXG4gICAgICAgICAgICAgKiBwYWdlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFRyYWNraW5nIGF0OlxuICAgICAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM1NTEwM1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIFRvIGF2b2lkIHRoaXMgaXNzdWUsIHVzZSB0aGUga2V5cHJlc3MgZXZlbnQgYXMgaWYgbm8gYHRleHRJbnB1dGBcbiAgICAgICAgICAgICAqIGV2ZW50IGlzIGF2YWlsYWJsZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29uc3Qgd2hpY2ggPSBuYXRpdmVFdmVudC53aGljaDtcbiAgICAgICAgICAgIGlmICh3aGljaCAhPT0gU1BBQ0VCQVJfQ09ERSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoYXNTcGFjZUtleXByZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBTUEFDRUJBUl9DSEFSO1xuXG4gICAgICAgIGNhc2UgVE9QX1RFWFRfSU5QVVQ6XG4gICAgICAgICAgICAvLyBSZWNvcmQgdGhlIGNoYXJhY3RlcnMgdG8gYmUgYWRkZWQgdG8gdGhlIERPTS5cbiAgICAgICAgICAgIGNvbnN0IGNoYXJzID0gbmF0aXZlRXZlbnQuZGF0YTtcblxuICAgICAgICAgICAgLy8gSWYgaXQncyBhIHNwYWNlYmFyIGNoYXJhY3RlciwgYXNzdW1lIHRoYXQgd2UgaGF2ZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgICAgICAgIC8vIGl0IGF0IHRoZSBrZXlwcmVzcyBsZXZlbCBhbmQgYmFpbCBpbW1lZGlhdGVseS4gQW5kcm9pZCBDaHJvbWVcbiAgICAgICAgICAgIC8vIGRvZXNuJ3QgZ2l2ZSB1cyBrZXljb2Rlcywgc28gd2UgbmVlZCB0byBpZ25vcmUgaXQuXG4gICAgICAgICAgICBpZiAoY2hhcnMgPT09IFNQQUNFQkFSX0NIQVIgJiYgaGFzU3BhY2VLZXlwcmVzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBIQVNfVEVYVF9JTlBVVCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gY2hhcnM7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIEZvciBvdGhlciBuYXRpdmUgZXZlbnQgdHlwZXMsIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbi8qKlxuICogRm9yIGJyb3dzZXJzIHRoYXQgZG8gbm90IHByb3ZpZGUgdGhlIGB0ZXh0SW5wdXRgIGV2ZW50LCBleHRyYWN0IHRoZVxuICogYXBwcm9wcmlhdGUgc3RyaW5nIHRvIHVzZSBmb3IgU3ludGhldGljSW5wdXRFdmVudC5cbiAqXG4gKi9cbmZ1bmN0aW9uIGdldEZhbGxiYWNrQmVmb3JlSW5wdXRDaGFycyh0b3BMZXZlbFR5cGU6IGFueSwgbmF0aXZlRXZlbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY3VycmVudGx5IGNvbXBvc2luZyAoSU1FKSBhbmQgdXNpbmcgYSBmYWxsYmFjayB0byBkbyBzbyxcbiAgICAvLyB0cnkgdG8gZXh0cmFjdCB0aGUgY29tcG9zZWQgY2hhcmFjdGVycyBmcm9tIHRoZSBmYWxsYmFjayBvYmplY3QuXG4gICAgLy8gSWYgY29tcG9zaXRpb24gZXZlbnQgaXMgYXZhaWxhYmxlLCB3ZSBleHRyYWN0IGEgc3RyaW5nIG9ubHkgYXRcbiAgICAvLyBjb21wb3NpdGlvbmV2ZW50LCBvdGhlcndpc2UgZXh0cmFjdCBpdCBhdCBmYWxsYmFjayBldmVudHMuXG4gICAgaWYgKGlzQ29tcG9zaW5nKSB7XG4gICAgICAgIGlmICh0b3BMZXZlbFR5cGUgPT09IFRPUF9DT01QT1NJVElPTl9FTkQgfHwgKCFjYW5Vc2VDb21wb3NpdGlvbkV2ZW50ICYmIGlzRmFsbGJhY2tDb21wb3NpdGlvbkVuZCh0b3BMZXZlbFR5cGUsIG5hdGl2ZUV2ZW50KSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoYXJzID0gRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlR2V0RGF0YSgpO1xuICAgICAgICAgICAgRmFsbGJhY2tDb21wb3NpdGlvblN0YXRlUmVzZXQoKTtcbiAgICAgICAgICAgIGlzQ29tcG9zaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gY2hhcnM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b3BMZXZlbFR5cGUpIHtcbiAgICAgICAgY2FzZSBUT1BfUEFTVEU6XG4gICAgICAgICAgICAvLyBJZiBhIHBhc3RlIGV2ZW50IG9jY3VycyBhZnRlciBhIGtleXByZXNzLCB0aHJvdyBvdXQgdGhlIGlucHV0XG4gICAgICAgICAgICAvLyBjaGFycy4gUGFzdGUgZXZlbnRzIHNob3VsZCBub3QgbGVhZCB0byBCZWZvcmVJbnB1dCBldmVudHMuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY2FzZSBUT1BfS0VZX1BSRVNTOlxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBcyBvZiB2MjcsIEZpcmVmb3ggbWF5IGZpcmUga2V5cHJlc3MgZXZlbnRzIGV2ZW4gd2hlbiBubyBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAqIHdpbGwgYmUgaW5zZXJ0ZWQuIEEgZmV3IHBvc3NpYmlsaXRpZXM6XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogLSBgd2hpY2hgIGlzIGAwYC4gQXJyb3cga2V5cywgRXNjIGtleSwgZXRjLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIC0gYHdoaWNoYCBpcyB0aGUgcHJlc3NlZCBrZXkgY29kZSwgYnV0IG5vIGNoYXIgaXMgYXZhaWxhYmxlLlxuICAgICAgICAgICAgICogICBFeDogJ0FsdEdyICsgZGAgaW4gUG9saXNoLiBUaGVyZSBpcyBubyBtb2RpZmllZCBjaGFyYWN0ZXIgZm9yXG4gICAgICAgICAgICAgKiAgIHRoaXMga2V5IGNvbWJpbmF0aW9uIGFuZCBubyBjaGFyYWN0ZXIgaXMgaW5zZXJ0ZWQgaW50byB0aGVcbiAgICAgICAgICAgICAqICAgZG9jdW1lbnQsIGJ1dCBGRiBmaXJlcyB0aGUga2V5cHJlc3MgZm9yIGNoYXIgY29kZSBgMTAwYCBhbnl3YXkuXG4gICAgICAgICAgICAgKiAgIE5vIGBpbnB1dGAgZXZlbnQgd2lsbCBvY2N1ci5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAtIGB3aGljaGAgaXMgdGhlIHByZXNzZWQga2V5IGNvZGUsIGJ1dCBhIGNvbW1hbmQgY29tYmluYXRpb24gaXNcbiAgICAgICAgICAgICAqICAgYmVpbmcgdXNlZC4gRXg6IGBDbWQrQ2AuIE5vIGNoYXJhY3RlciBpcyBpbnNlcnRlZCwgYW5kIG5vXG4gICAgICAgICAgICAgKiAgIGBpbnB1dGAgZXZlbnQgd2lsbCBvY2N1ci5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKCFpc0tleXByZXNzQ29tbWFuZChuYXRpdmVFdmVudCkpIHtcbiAgICAgICAgICAgICAgICAvLyBJRSBmaXJlcyB0aGUgYGtleXByZXNzYCBldmVudCB3aGVuIGEgdXNlciB0eXBlcyBhbiBlbW9qaSB2aWFcbiAgICAgICAgICAgICAgICAvLyBUb3VjaCBrZXlib2FyZCBvZiBXaW5kb3dzLiAgSW4gc3VjaCBhIGNhc2UsIHRoZSBgY2hhcmAgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAvLyBob2xkcyBhbiBlbW9qaSBjaGFyYWN0ZXIgbGlrZSBgXFx1RDgzRFxcdURFMEFgLiAgQmVjYXVzZSBpdHMgbGVuZ3RoXG4gICAgICAgICAgICAgICAgLy8gaXMgMiwgdGhlIHByb3BlcnR5IGB3aGljaGAgZG9lcyBub3QgcmVwcmVzZW50IGFuIGVtb2ppIGNvcnJlY3RseS5cbiAgICAgICAgICAgICAgICAvLyBJbiBzdWNoIGEgY2FzZSwgd2UgZGlyZWN0bHkgcmV0dXJuIHRoZSBgY2hhcmAgcHJvcGVydHkgaW5zdGVhZCBvZlxuICAgICAgICAgICAgICAgIC8vIHVzaW5nIGB3aGljaGAuXG4gICAgICAgICAgICAgICAgaWYgKG5hdGl2ZUV2ZW50LmNoYXIgJiYgbmF0aXZlRXZlbnQuY2hhci5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVFdmVudC5jaGFyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobmF0aXZlRXZlbnQud2hpY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUobmF0aXZlRXZlbnQud2hpY2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjYXNlIFRPUF9DT01QT1NJVElPTl9FTkQ6XG4gICAgICAgICAgICByZXR1cm4gdXNlRmFsbGJhY2tDb21wb3NpdGlvbkRhdGEgJiYgIWlzVXNpbmdLb3JlYW5JTUUobmF0aXZlRXZlbnQpID8gbnVsbCA6IG5hdGl2ZUV2ZW50LmRhdGE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBhIFN5bnRoZXRpY0lucHV0RXZlbnQgZm9yIGBiZWZvcmVJbnB1dGAsIGJhc2VkIG9uIGVpdGhlciBuYXRpdmVcbiAqIGB0ZXh0SW5wdXRgIG9yIGZhbGxiYWNrIGJlaGF2aW9yLlxuICpcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEJlZm9yZUlucHV0RXZlbnQodG9wTGV2ZWxUeXBlLCB0YXJnZXRJbnN0LCBuYXRpdmVFdmVudCwgbmF0aXZlRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgY2hhcnM7XG5cbiAgICBpZiAoY2FuVXNlVGV4dElucHV0RXZlbnQpIHtcbiAgICAgICAgY2hhcnMgPSBnZXROYXRpdmVCZWZvcmVJbnB1dENoYXJzKHRvcExldmVsVHlwZSwgbmF0aXZlRXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNoYXJzID0gZ2V0RmFsbGJhY2tCZWZvcmVJbnB1dENoYXJzKHRvcExldmVsVHlwZSwgbmF0aXZlRXZlbnQpO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGNoYXJhY3RlcnMgYXJlIGJlaW5nIGluc2VydGVkLCBubyBCZWZvcmVJbnB1dCBldmVudCBzaG91bGRcbiAgICAvLyBiZSBmaXJlZC5cbiAgICBpZiAoIWNoYXJzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGJlZm9yZUlucHV0RXZlbnQgPSBuZXcgQmVmb3JlSW5wdXRFdmVudCgpO1xuICAgIGJlZm9yZUlucHV0RXZlbnQuZGF0YSA9IGNoYXJzO1xuICAgIGJlZm9yZUlucHV0RXZlbnQubmF0aXZlRXZlbnQgPSBuYXRpdmVFdmVudDtcbiAgICByZXR1cm4gYmVmb3JlSW5wdXRFdmVudDtcbiAgICAvLyAgIGNvbnN0IGV2ZW50ID0gU3ludGhldGljSW5wdXRFdmVudC5nZXRQb29sZWQoXG4gICAgLy8gICAgIGV2ZW50VHlwZXMuYmVmb3JlSW5wdXQsXG4gICAgLy8gICAgIHRhcmdldEluc3QsXG4gICAgLy8gICAgIG5hdGl2ZUV2ZW50LFxuICAgIC8vICAgICBuYXRpdmVFdmVudFRhcmdldFxuICAgIC8vICAgKTtcblxuICAgIC8vICAgZXZlbnQuZGF0YSA9IGNoYXJzO1xuICAgIC8vICAgYWNjdW11bGF0ZVR3b1BoYXNlRGlzcGF0Y2hlcyhldmVudCk7XG4gICAgLy8gICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGBvbkJlZm9yZUlucHV0YCBldmVudCB0byBtYXRjaFxuICogaHR0cDovL3d3dy53My5vcmcvVFIvMjAxMy9XRC1ET00tTGV2ZWwtMy1FdmVudHMtMjAxMzExMDUvI2V2ZW50cy1pbnB1dGV2ZW50cy5cbiAqXG4gKiBUaGlzIGV2ZW50IHBsdWdpbiBpcyBiYXNlZCBvbiB0aGUgbmF0aXZlIGB0ZXh0SW5wdXRgIGV2ZW50XG4gKiBhdmFpbGFibGUgaW4gQ2hyb21lLCBTYWZhcmksIE9wZXJhLCBhbmQgSUUuIFRoaXMgZXZlbnQgZmlyZXMgYWZ0ZXJcbiAqIGBvbktleVByZXNzYCBhbmQgYG9uQ29tcG9zaXRpb25FbmRgLCBidXQgYmVmb3JlIGBvbklucHV0YC5cbiAqXG4gKiBgYmVmb3JlSW5wdXRgIGlzIHNwZWMnZCBidXQgbm90IGltcGxlbWVudGVkIGluIGFueSBicm93c2VycywgYW5kXG4gKiB0aGUgYGlucHV0YCBldmVudCBkb2VzIG5vdCBwcm92aWRlIGFueSB1c2VmdWwgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBoYXNcbiAqIGFjdHVhbGx5IGJlZW4gYWRkZWQsIGNvbnRyYXJ5IHRvIHRoZSBzcGVjLiBUaHVzLCBgdGV4dElucHV0YCBpcyB0aGUgYmVzdFxuICogYXZhaWxhYmxlIGV2ZW50IHRvIGlkZW50aWZ5IHRoZSBjaGFyYWN0ZXJzIHRoYXQgaGF2ZSBhY3R1YWxseSBiZWVuIGluc2VydGVkXG4gKiBpbnRvIHRoZSB0YXJnZXQgbm9kZS5cbiAqXG4gKiBUaGlzIHBsdWdpbiBpcyBhbHNvIHJlc3BvbnNpYmxlIGZvciBlbWl0dGluZyBgY29tcG9zaXRpb25gIGV2ZW50cywgdGh1c1xuICogYWxsb3dpbmcgdXMgdG8gc2hhcmUgY29tcG9zaXRpb24gZmFsbGJhY2sgY29kZSBmb3IgYm90aCBgYmVmb3JlSW5wdXRgIGFuZFxuICogYGNvbXBvc2l0aW9uYCBldmVudCB0eXBlcy5cbiAqL1xuY29uc3QgQmVmb3JlSW5wdXRFdmVudFBsdWdpbiA9IHtcbiAgICAvLyAgIGV2ZW50VHlwZXM6IGV2ZW50VHlwZXMsXG5cbiAgICBleHRyYWN0RXZlbnRzOiAodG9wTGV2ZWxUeXBlLCB0YXJnZXRJbnN0LCBuYXRpdmVFdmVudCwgbmF0aXZlRXZlbnRUYXJnZXQpID0+IHtcbiAgICAgICAgY29uc3QgYmVmb3JlSW5wdXQgPSBleHRyYWN0QmVmb3JlSW5wdXRFdmVudCh0b3BMZXZlbFR5cGUsIHRhcmdldEluc3QsIG5hdGl2ZUV2ZW50LCBuYXRpdmVFdmVudFRhcmdldCk7XG4gICAgICAgIGlmIChiZWZvcmVJbnB1dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJlZm9yZUlucHV0O1xuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IEJlZm9yZUlucHV0RXZlbnRQbHVnaW47XG4iXX0=