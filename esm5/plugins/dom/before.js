import Debug from 'debug';
import Hotkeys from 'slate-hotkeys';
import getWindow from 'get-window';
import { IS_FIREFOX, IS_IE, IS_IOS } from 'slate-dev-environment';
import DATA_ATTRS from '../../constants/data-attributes';
var debug = Debug('slate:before');
debug.track = Debug('slate:track');
var BeforePlugin = /** @class */ (function () {
    function BeforePlugin() {
    }
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onBeforeInput = function (event, editor, next) {
        var isSynthetic = !!event.nativeEvent;
        if (editor.readOnly)
            return;
        // COMPAT: If the browser supports Input Events Level 2, we will have
        // attached a custom handler for the real `beforeinput` events, instead of
        // allowing React's synthetic polyfill, so we need to ignore synthetics.
        // if (isSynthetic && HAS_INPUT_EVENTS_LEVEL_2) return;
        debug('onBeforeInput', { event: event });
        next();
    };
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onBlur = function (event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        var relatedTarget = event.relatedTarget, target = event.target;
        var window = getWindow(target);
        // COMPAT: If the current `activeElement` is still the previous one, this is
        // due to the window being blurred when the tab itself becomes unfocused, so
        // we want to abort early to allow to editor to stay focused when the tab
        // becomes focused again.
        if (BeforePlugin.activeElement === window.document.activeElement) {
            return;
        }
        // COMPAT: The `relatedTarget` can be null when the new focus target is not
        // a "focusable" element (eg. a `<div>` without `tabindex` set).
        if (relatedTarget) {
            var el = editor.findDOMNode([]);
            // COMPAT: The event should be ignored if the focus is returning to the
            // editor from an embedded editable element (eg. an <input> element inside
            // a void node).
            if (relatedTarget === el)
                return;
            // COMPAT: The event should be ignored if the focus is moving from the
            // editor to inside a void node's spacer element.
            if (relatedTarget.hasAttribute(DATA_ATTRS.SPACER))
                return;
            // COMPAT: The event should be ignored if the focus is moving to a non-
            // editable section of an element that isn't a void node (eg. a list item
            // of the check list example).
            var node = editor.findNode(relatedTarget);
            if (el.contains(relatedTarget) && node && !editor.isVoid(node)) {
                return;
            }
        }
        debug('onBlur', { event: event });
        next();
    };
    /**
     * On composition end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onCompositionEnd = function (event, editor, next) {
        var n = BeforePlugin.compositionCount;
        // The `count` check here ensures that if another composition starts
        // before the timeout has closed out this one, we will abort unsetting the
        // `isComposing` flag, since a composition is still in affect.
        window.setTimeout(function () {
            if (BeforePlugin.compositionCount > n)
                return;
            BeforePlugin.isComposing = false;
        }, 100);
        debug('onCompositionEnd', { event: event });
        next();
    };
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onClick = function (event, editor, next) {
        debug('onClick', { event: event });
        next();
    };
    /**
     * On composition start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onCompositionStart = function (event, editor, next) {
        BeforePlugin.isComposing = true;
        BeforePlugin.compositionCount++;
        var value = editor.value;
        var selection = value.selection;
        if (!selection.isCollapsed) {
            // https://github.com/ianstormtaylor/slate/issues/1879
            // When composition starts and the current selection is not collapsed, the
            // second composition key-down would drop the text wrapping <spans> which
            // resulted on crash in content.updateSelection after composition ends
            // (because it cannot find <span> nodes in DOM). This is a workaround that
            // erases selection as soon as composition starts and preventing <spans>
            // to be dropped.
            editor.delete();
        }
        debug('onCompositionStart', { event: event });
        next();
    };
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onCopy = function (event, editor, next) {
        var window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(function () { return (BeforePlugin.isCopying = false); });
        debug('onCopy', { event: event });
        next();
    };
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onCut = function (event, editor, next) {
        if (editor.readOnly)
            return;
        var window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(function () { return (BeforePlugin.isCopying = false); });
        debug('onCut', { event: event });
        next();
    };
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragEnd = function (event, editor, next) {
        BeforePlugin.isDragging = false;
        debug('onDragEnd', { event: event });
        next();
    };
    /**
     * On drag enter.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragEnter = function (event, editor, next) {
        debug('onDragEnter', { event: event });
        next();
    };
    /**
     * On drag exit.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragExit = function (event, editor, next) {
        debug('onDragExit', { event: event });
        next();
    };
    /**
     * On drag leave.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragLeave = function (event, editor, next) {
        debug('onDragLeave', { event: event });
        next();
    };
    /**
     * On drag over.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragOver = function (event, editor, next) {
        // If the target is inside a void node, and only in this case,
        // call `preventDefault` to signal that drops are allowed.
        // When the target is editable, dropping is already allowed by
        // default, and calling `preventDefault` hides the cursor.
        var node = editor.findNode(event.target);
        if (!node || editor.isVoid(node)) {
            event.preventDefault();
        }
        // COMPAT: IE won't call onDrop on contentEditables unless the
        // default dragOver is prevented:
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/913982/
        // (2018/07/11)
        if (IS_IE) {
            event.preventDefault();
        }
        // If a drag is already in progress, don't do this again.
        if (!BeforePlugin.isDragging) {
            BeforePlugin.isDragging = true;
            // COMPAT: IE will raise an `unspecified error` if dropEffect is
            // set. (2018/07/11)
            if (!IS_IE) {
                event.nativeEvent.dataTransfer.dropEffect = 'move';
            }
        }
        debug('onDragOver', { event: event });
        next();
    };
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDragStart = function (event, editor, next) {
        BeforePlugin.isDragging = true;
        debug('onDragStart', { event: event });
        next();
    };
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onDrop = function (event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent default so the DOM's value isn't corrupted.
        event.preventDefault();
        debug('onDrop', { event: event });
        next();
    };
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onFocus = function (event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        var el = editor.findDOMNode([]);
        // Save the new `activeElement`.
        var window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        // COMPAT: If the editor has nested editable elements, the focus can go to
        // those elements. In Firefox, this must be prevented because it results in
        // issues with keyboard navigation. (2017/03/30)
        if (IS_FIREFOX && event.target !== el) {
            el.focus();
            return;
        }
        debug('onFocus', { event: event });
        next();
    };
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onInput = function (event, editor, next) {
        if (BeforePlugin.isComposing)
            return;
        if (editor.value.selection.isBlurred)
            return;
        debug('onInput', { event: event });
        next();
    };
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onKeyDown = function (event, editor, next) {
        if (editor.readOnly)
            return;
        // When composing, we need to prevent all hotkeys from executing while
        // typing. However, certain characters also move the selection before
        // we're able to handle it, so prevent their default behavior.
        if (BeforePlugin.isComposing) {
            if (Hotkeys.isCompose(event))
                event.preventDefault();
            return;
        }
        // Certain hotkeys have native editing behaviors in `contenteditable`
        // elements which will editor the DOM and cause our value to be out of sync,
        // so they need to always be prevented.
        if (!IS_IOS &&
            (Hotkeys.isBold(event) ||
                Hotkeys.isDeleteBackward(event) ||
                Hotkeys.isDeleteForward(event) ||
                Hotkeys.isDeleteLineBackward(event) ||
                Hotkeys.isDeleteLineForward(event) ||
                Hotkeys.isDeleteWordBackward(event) ||
                Hotkeys.isDeleteWordForward(event) ||
                Hotkeys.isItalic(event) ||
                Hotkeys.isRedo(event) ||
                Hotkeys.isSplitBlock(event) ||
                Hotkeys.isTransposeCharacter(event) ||
                Hotkeys.isUndo(event))) {
            event.preventDefault();
        }
        debug('onKeyDown', { event: event });
        debug.track('track start : onKeyDown');
        next();
    };
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onPaste = function (event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent defaults so the DOM state isn't corrupted.
        event.preventDefault();
        debug('onPaste', { event: event });
        next();
    };
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    BeforePlugin.onSelect = function (event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (BeforePlugin.isComposing)
            return;
        if (editor.readOnly)
            return;
        // Save the new `activeElement`.
        var window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        debug('onSelect', { event: event });
        next();
    };
    BeforePlugin.activeElement = null;
    BeforePlugin.compositionCount = 0;
    BeforePlugin.isComposing = false;
    BeforePlugin.isCopying = false;
    BeforePlugin.isDragging = false;
    return BeforePlugin;
}());
export default BeforePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVmb3JlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsicGx1Z2lucy9kb20vYmVmb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLE9BQU8sTUFBTSxlQUFlLENBQUM7QUFDcEMsT0FBTyxTQUFTLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBNEIsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLFVBQVUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN6RCxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFbkM7SUFBQTtJQW9iQSxDQUFDO0lBN2FHOzs7Ozs7T0FNRztJQUVJLDBCQUFhLEdBQXBCLFVBQXFCLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUNwQyxJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUN4QyxJQUFJLE1BQU0sQ0FBQyxRQUFRO1lBQUUsT0FBTztRQUU1QixxRUFBcUU7UUFDckUsMEVBQTBFO1FBQzFFLHdFQUF3RTtRQUN4RSx1REFBdUQ7UUFFdkQsS0FBSyxDQUFDLGVBQWUsRUFBRSxFQUFFLEtBQUssT0FBQSxFQUFFLENBQUMsQ0FBQztRQUNsQyxJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFFSSxtQkFBTSxHQUFiLFVBQWMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJO1FBQzdCLElBQUksWUFBWSxDQUFDLFNBQVM7WUFBRSxPQUFPO1FBQ25DLElBQUksTUFBTSxDQUFDLFFBQVE7WUFBRSxPQUFPO1FBRXBCLElBQUEsbUNBQWEsRUFBRSxxQkFBTSxDQUFXO1FBQ3hDLElB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LENBQUM7UUFDdkMsWUFBWSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQztRQUUzRCxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxPQUFBLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLElBQUksRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQWpiTSwwQkFBYSxHQUFHLElBQUksQ0FBQztJQUNyQiw2QkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDckIsd0JBQVcsR0FBRyxLQUFLLENBQUM7SUFDcEIsc0JBQVMsR0FBRyxLQUFLLENBQUM7SUFDbEIsdUJBQVUsR0FBRyxLQUFLLENBQUM7SUErYTlCLG1CQUFDO0NBQUEsQUFwYkQsSUFvYkM7QUFFRCxlQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgSG90a2V5cyBmcm9tICdzbGF0ZS1ob3RrZXlzJztcbmltcG9ydCBnZXRXaW5kb3cgZnJvbSAnZ2V0LXdpbmRvdyc7XG5pbXBvcnQgeyBJU19GSVJFRk9YLCBJU19JRSwgSVNfSU9TLCBIQVNfSU5QVVRfRVZFTlRTX0xFVkVMXzIgfSBmcm9tICdzbGF0ZS1kZXYtZW52aXJvbm1lbnQnO1xuaW1wb3J0IERBVEFfQVRUUlMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL2RhdGEtYXR0cmlidXRlcyc7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdzbGF0ZTpiZWZvcmUnKTtcbmRlYnVnLnRyYWNrID0gRGVidWcoJ3NsYXRlOnRyYWNrJyk7XG5cbmNsYXNzIEJlZm9yZVBsdWdpbiB7XG4gICAgc3RhdGljIGFjdGl2ZUVsZW1lbnQgPSBudWxsO1xuICAgIHN0YXRpYyBjb21wb3NpdGlvbkNvdW50ID0gMDtcbiAgICBzdGF0aWMgaXNDb21wb3NpbmcgPSBmYWxzZTtcbiAgICBzdGF0aWMgaXNDb3B5aW5nID0gZmFsc2U7XG4gICAgc3RhdGljIGlzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIE9uIGJlZm9yZSBpbnB1dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkJlZm9yZUlucHV0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgY29uc3QgaXNTeW50aGV0aWMgPSAhIWV2ZW50Lm5hdGl2ZUV2ZW50O1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgLy8gQ09NUEFUOiBJZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBJbnB1dCBFdmVudHMgTGV2ZWwgMiwgd2Ugd2lsbCBoYXZlXG4gICAgICAgIC8vIGF0dGFjaGVkIGEgY3VzdG9tIGhhbmRsZXIgZm9yIHRoZSByZWFsIGBiZWZvcmVpbnB1dGAgZXZlbnRzLCBpbnN0ZWFkIG9mXG4gICAgICAgIC8vIGFsbG93aW5nIFJlYWN0J3Mgc3ludGhldGljIHBvbHlmaWxsLCBzbyB3ZSBuZWVkIHRvIGlnbm9yZSBzeW50aGV0aWNzLlxuICAgICAgICAvLyBpZiAoaXNTeW50aGV0aWMgJiYgSEFTX0lOUFVUX0VWRU5UU19MRVZFTF8yKSByZXR1cm47XG5cbiAgICAgICAgZGVidWcoJ29uQmVmb3JlSW5wdXQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gYmx1ci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkJsdXIoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmlzQ29weWluZykgcmV0dXJuO1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgeyByZWxhdGVkVGFyZ2V0LCB0YXJnZXQgfSA9IGV2ZW50O1xuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3codGFyZ2V0KTtcblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBjdXJyZW50IGBhY3RpdmVFbGVtZW50YCBpcyBzdGlsbCB0aGUgcHJldmlvdXMgb25lLCB0aGlzIGlzXG4gICAgICAgIC8vIGR1ZSB0byB0aGUgd2luZG93IGJlaW5nIGJsdXJyZWQgd2hlbiB0aGUgdGFiIGl0c2VsZiBiZWNvbWVzIHVuZm9jdXNlZCwgc29cbiAgICAgICAgLy8gd2Ugd2FudCB0byBhYm9ydCBlYXJseSB0byBhbGxvdyB0byBlZGl0b3IgdG8gc3RheSBmb2N1c2VkIHdoZW4gdGhlIHRhYlxuICAgICAgICAvLyBiZWNvbWVzIGZvY3VzZWQgYWdhaW4uXG4gICAgICAgIGlmIChCZWZvcmVQbHVnaW4uYWN0aXZlRWxlbWVudCA9PT0gd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBUaGUgYHJlbGF0ZWRUYXJnZXRgIGNhbiBiZSBudWxsIHdoZW4gdGhlIG5ldyBmb2N1cyB0YXJnZXQgaXMgbm90XG4gICAgICAgIC8vIGEgXCJmb2N1c2FibGVcIiBlbGVtZW50IChlZy4gYSBgPGRpdj5gIHdpdGhvdXQgYHRhYmluZGV4YCBzZXQpLlxuICAgICAgICBpZiAocmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlZGl0b3IuZmluZERPTU5vZGUoW10pO1xuXG4gICAgICAgICAgICAvLyBDT01QQVQ6IFRoZSBldmVudCBzaG91bGQgYmUgaWdub3JlZCBpZiB0aGUgZm9jdXMgaXMgcmV0dXJuaW5nIHRvIHRoZVxuICAgICAgICAgICAgLy8gZWRpdG9yIGZyb20gYW4gZW1iZWRkZWQgZWRpdGFibGUgZWxlbWVudCAoZWcuIGFuIDxpbnB1dD4gZWxlbWVudCBpbnNpZGVcbiAgICAgICAgICAgIC8vIGEgdm9pZCBub2RlKS5cbiAgICAgICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0ID09PSBlbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBDT01QQVQ6IFRoZSBldmVudCBzaG91bGQgYmUgaWdub3JlZCBpZiB0aGUgZm9jdXMgaXMgbW92aW5nIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBlZGl0b3IgdG8gaW5zaWRlIGEgdm9pZCBub2RlJ3Mgc3BhY2VyIGVsZW1lbnQuXG4gICAgICAgICAgICBpZiAocmVsYXRlZFRhcmdldC5oYXNBdHRyaWJ1dGUoREFUQV9BVFRSUy5TUEFDRVIpKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIENPTVBBVDogVGhlIGV2ZW50IHNob3VsZCBiZSBpZ25vcmVkIGlmIHRoZSBmb2N1cyBpcyBtb3ZpbmcgdG8gYSBub24tXG4gICAgICAgICAgICAvLyBlZGl0YWJsZSBzZWN0aW9uIG9mIGFuIGVsZW1lbnQgdGhhdCBpc24ndCBhIHZvaWQgbm9kZSAoZWcuIGEgbGlzdCBpdGVtXG4gICAgICAgICAgICAvLyBvZiB0aGUgY2hlY2sgbGlzdCBleGFtcGxlKS5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBlZGl0b3IuZmluZE5vZGUocmVsYXRlZFRhcmdldCk7XG5cbiAgICAgICAgICAgIGlmIChlbC5jb250YWlucyhyZWxhdGVkVGFyZ2V0KSAmJiBub2RlICYmICFlZGl0b3IuaXNWb2lkKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGVidWcoJ29uQmx1cicsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjb21wb3NpdGlvbiBlbmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25Db21wb3NpdGlvbkVuZChldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGNvbnN0IG4gPSBCZWZvcmVQbHVnaW4uY29tcG9zaXRpb25Db3VudDtcblxuICAgICAgICAvLyBUaGUgYGNvdW50YCBjaGVjayBoZXJlIGVuc3VyZXMgdGhhdCBpZiBhbm90aGVyIGNvbXBvc2l0aW9uIHN0YXJ0c1xuICAgICAgICAvLyBiZWZvcmUgdGhlIHRpbWVvdXQgaGFzIGNsb3NlZCBvdXQgdGhpcyBvbmUsIHdlIHdpbGwgYWJvcnQgdW5zZXR0aW5nIHRoZVxuICAgICAgICAvLyBgaXNDb21wb3NpbmdgIGZsYWcsIHNpbmNlIGEgY29tcG9zaXRpb24gaXMgc3RpbGwgaW4gYWZmZWN0LlxuICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmNvbXBvc2l0aW9uQ291bnQgPiBuKSByZXR1cm47XG4gICAgICAgICAgICBCZWZvcmVQbHVnaW4uaXNDb21wb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgfSwgMTAwKTtcblxuICAgICAgICBkZWJ1Zygnb25Db21wb3NpdGlvbkVuZCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjbGljay5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkNsaWNrKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uQ2xpY2snLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gY29tcG9zaXRpb24gc3RhcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25Db21wb3NpdGlvblN0YXJ0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmlzQ29tcG9zaW5nID0gdHJ1ZTtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmNvbXBvc2l0aW9uQ291bnQrKztcblxuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBlZGl0b3I7XG4gICAgICAgIGNvbnN0IHsgc2VsZWN0aW9uIH0gPSB2YWx1ZTtcblxuICAgICAgICBpZiAoIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2lhbnN0b3JtdGF5bG9yL3NsYXRlL2lzc3Vlcy8xODc5XG4gICAgICAgICAgICAvLyBXaGVuIGNvbXBvc2l0aW9uIHN0YXJ0cyBhbmQgdGhlIGN1cnJlbnQgc2VsZWN0aW9uIGlzIG5vdCBjb2xsYXBzZWQsIHRoZVxuICAgICAgICAgICAgLy8gc2Vjb25kIGNvbXBvc2l0aW9uIGtleS1kb3duIHdvdWxkIGRyb3AgdGhlIHRleHQgd3JhcHBpbmcgPHNwYW5zPiB3aGljaFxuICAgICAgICAgICAgLy8gcmVzdWx0ZWQgb24gY3Jhc2ggaW4gY29udGVudC51cGRhdGVTZWxlY3Rpb24gYWZ0ZXIgY29tcG9zaXRpb24gZW5kc1xuICAgICAgICAgICAgLy8gKGJlY2F1c2UgaXQgY2Fubm90IGZpbmQgPHNwYW4+IG5vZGVzIGluIERPTSkuIFRoaXMgaXMgYSB3b3JrYXJvdW5kIHRoYXRcbiAgICAgICAgICAgIC8vIGVyYXNlcyBzZWxlY3Rpb24gYXMgc29vbiBhcyBjb21wb3NpdGlvbiBzdGFydHMgYW5kIHByZXZlbnRpbmcgPHNwYW5zPlxuICAgICAgICAgICAgLy8gdG8gYmUgZHJvcHBlZC5cbiAgICAgICAgICAgIGVkaXRvci5kZWxldGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCdvbkNvbXBvc2l0aW9uU3RhcnQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gY29weS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkNvcHkoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmlzQ29weWluZyA9IHRydWU7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gKEJlZm9yZVBsdWdpbi5pc0NvcHlpbmcgPSBmYWxzZSkpO1xuXG4gICAgICAgIGRlYnVnKCdvbkNvcHknLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gY3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ3V0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKGVkaXRvci5yZWFkT25seSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICBCZWZvcmVQbHVnaW4uaXNDb3B5aW5nID0gdHJ1ZTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiAoQmVmb3JlUGx1Z2luLmlzQ29weWluZyA9IGZhbHNlKSk7XG5cbiAgICAgICAgZGVidWcoJ29uQ3V0JywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyYWcgZW5kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ0VuZChldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIEJlZm9yZVBsdWdpbi5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdFbmQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gZHJhZyBlbnRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkRyYWdFbnRlcihldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdFbnRlcicsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcmFnIGV4aXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25EcmFnRXhpdChldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdFeGl0JywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyYWcgbGVhdmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25EcmFnTGVhdmUoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBkZWJ1Zygnb25EcmFnTGVhdmUnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gZHJhZyBvdmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ092ZXIoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIGluc2lkZSBhIHZvaWQgbm9kZSwgYW5kIG9ubHkgaW4gdGhpcyBjYXNlLFxuICAgICAgICAvLyBjYWxsIGBwcmV2ZW50RGVmYXVsdGAgdG8gc2lnbmFsIHRoYXQgZHJvcHMgYXJlIGFsbG93ZWQuXG4gICAgICAgIC8vIFdoZW4gdGhlIHRhcmdldCBpcyBlZGl0YWJsZSwgZHJvcHBpbmcgaXMgYWxyZWFkeSBhbGxvd2VkIGJ5XG4gICAgICAgIC8vIGRlZmF1bHQsIGFuZCBjYWxsaW5nIGBwcmV2ZW50RGVmYXVsdGAgaGlkZXMgdGhlIGN1cnNvci5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGVkaXRvci5maW5kTm9kZShldmVudC50YXJnZXQpO1xuXG4gICAgICAgIGlmICghbm9kZSB8fCBlZGl0b3IuaXNWb2lkKG5vZGUpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBJRSB3b24ndCBjYWxsIG9uRHJvcCBvbiBjb250ZW50RWRpdGFibGVzIHVubGVzcyB0aGVcbiAgICAgICAgLy8gZGVmYXVsdCBkcmFnT3ZlciBpcyBwcmV2ZW50ZWQ6XG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1pY3Jvc29mdC5jb20vZW4tdXMvbWljcm9zb2Z0LWVkZ2UvcGxhdGZvcm0vaXNzdWVzLzkxMzk4Mi9cbiAgICAgICAgLy8gKDIwMTgvMDcvMTEpXG4gICAgICAgIGlmIChJU19JRSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgZHJhZyBpcyBhbHJlYWR5IGluIHByb2dyZXNzLCBkb24ndCBkbyB0aGlzIGFnYWluLlxuICAgICAgICBpZiAoIUJlZm9yZVBsdWdpbi5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICBCZWZvcmVQbHVnaW4uaXNEcmFnZ2luZyA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIENPTVBBVDogSUUgd2lsbCByYWlzZSBhbiBgdW5zcGVjaWZpZWQgZXJyb3JgIGlmIGRyb3BFZmZlY3QgaXNcbiAgICAgICAgICAgIC8vIHNldC4gKDIwMTgvMDcvMTEpXG4gICAgICAgICAgICBpZiAoIUlTX0lFKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQubmF0aXZlRXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnbW92ZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Zygnb25EcmFnT3ZlcicsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcmFnIHN0YXJ0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ1N0YXJ0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICBkZWJ1Zygnb25EcmFnU3RhcnQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gZHJvcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkRyb3AoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgLy8gUHJldmVudCBkZWZhdWx0IHNvIHRoZSBET00ncyB2YWx1ZSBpc24ndCBjb3JydXB0ZWQuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgZGVidWcoJ29uRHJvcCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBmb2N1cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkZvY3VzKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5pc0NvcHlpbmcpIHJldHVybjtcbiAgICAgICAgaWYgKGVkaXRvci5yZWFkT25seSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGVsID0gZWRpdG9yLmZpbmRET01Ob2RlKFtdKTtcblxuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgYGFjdGl2ZUVsZW1lbnRgLlxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmFjdGl2ZUVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBlZGl0b3IgaGFzIG5lc3RlZCBlZGl0YWJsZSBlbGVtZW50cywgdGhlIGZvY3VzIGNhbiBnbyB0b1xuICAgICAgICAvLyB0aG9zZSBlbGVtZW50cy4gSW4gRmlyZWZveCwgdGhpcyBtdXN0IGJlIHByZXZlbnRlZCBiZWNhdXNlIGl0IHJlc3VsdHMgaW5cbiAgICAgICAgLy8gaXNzdWVzIHdpdGgga2V5Ym9hcmQgbmF2aWdhdGlvbi4gKDIwMTcvMDMvMzApXG4gICAgICAgIGlmIChJU19GSVJFRk9YICYmIGV2ZW50LnRhcmdldCAhPT0gZWwpIHtcbiAgICAgICAgICAgIGVsLmZvY3VzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Zygnb25Gb2N1cycsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBpbnB1dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbklucHV0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5pc0NvbXBvc2luZykgcmV0dXJuO1xuICAgICAgICBpZiAoZWRpdG9yLnZhbHVlLnNlbGVjdGlvbi5pc0JsdXJyZWQpIHJldHVybjtcbiAgICAgICAgZGVidWcoJ29uSW5wdXQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24ga2V5IGRvd24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25LZXlEb3duKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKGVkaXRvci5yZWFkT25seSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFdoZW4gY29tcG9zaW5nLCB3ZSBuZWVkIHRvIHByZXZlbnQgYWxsIGhvdGtleXMgZnJvbSBleGVjdXRpbmcgd2hpbGVcbiAgICAgICAgLy8gdHlwaW5nLiBIb3dldmVyLCBjZXJ0YWluIGNoYXJhY3RlcnMgYWxzbyBtb3ZlIHRoZSBzZWxlY3Rpb24gYmVmb3JlXG4gICAgICAgIC8vIHdlJ3JlIGFibGUgdG8gaGFuZGxlIGl0LCBzbyBwcmV2ZW50IHRoZWlyIGRlZmF1bHQgYmVoYXZpb3IuXG4gICAgICAgIGlmIChCZWZvcmVQbHVnaW4uaXNDb21wb3NpbmcpIHtcbiAgICAgICAgICAgIGlmIChIb3RrZXlzLmlzQ29tcG9zZShldmVudCkpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDZXJ0YWluIGhvdGtleXMgaGF2ZSBuYXRpdmUgZWRpdGluZyBiZWhhdmlvcnMgaW4gYGNvbnRlbnRlZGl0YWJsZWBcbiAgICAgICAgLy8gZWxlbWVudHMgd2hpY2ggd2lsbCBlZGl0b3IgdGhlIERPTSBhbmQgY2F1c2Ugb3VyIHZhbHVlIHRvIGJlIG91dCBvZiBzeW5jLFxuICAgICAgICAvLyBzbyB0aGV5IG5lZWQgdG8gYWx3YXlzIGJlIHByZXZlbnRlZC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIUlTX0lPUyAmJlxuICAgICAgICAgICAgKEhvdGtleXMuaXNCb2xkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVCYWNrd2FyZChldmVudCkgfHxcbiAgICAgICAgICAgICAgICBIb3RrZXlzLmlzRGVsZXRlRm9yd2FyZChldmVudCkgfHxcbiAgICAgICAgICAgICAgICBIb3RrZXlzLmlzRGVsZXRlTGluZUJhY2t3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVMaW5lRm9yd2FyZChldmVudCkgfHxcbiAgICAgICAgICAgICAgICBIb3RrZXlzLmlzRGVsZXRlV29yZEJhY2t3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVXb3JkRm9yd2FyZChldmVudCkgfHxcbiAgICAgICAgICAgICAgICBIb3RrZXlzLmlzSXRhbGljKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNSZWRvKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNTcGxpdEJsb2NrKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNUcmFuc3Bvc2VDaGFyYWN0ZXIoZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc1VuZG8oZXZlbnQpKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Zygnb25LZXlEb3duJywgeyBldmVudCB9KTtcbiAgICAgICAgZGVidWcudHJhY2soJ3RyYWNrIHN0YXJ0IDogb25LZXlEb3duJyk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBwYXN0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvblBhc3RlKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKGVkaXRvci5yZWFkT25seSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdHMgc28gdGhlIERPTSBzdGF0ZSBpc24ndCBjb3JydXB0ZWQuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgZGVidWcoJ29uUGFzdGUnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gc2VsZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uU2VsZWN0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5pc0NvcHlpbmcpIHJldHVybjtcbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5pc0NvbXBvc2luZykgcmV0dXJuO1xuXG4gICAgICAgIGlmIChlZGl0b3IucmVhZE9ubHkpIHJldHVybjtcblxuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgYGFjdGl2ZUVsZW1lbnRgLlxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmFjdGl2ZUVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgICAgICBkZWJ1Zygnb25TZWxlY3QnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEJlZm9yZVBsdWdpbjtcbiJdfQ==