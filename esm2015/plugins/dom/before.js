import Debug from 'debug';
import Hotkeys from 'slate-hotkeys';
import getWindow from 'get-window';
import { IS_FIREFOX, IS_IE, IS_IOS } from 'slate-dev-environment';
import DATA_ATTRS from '../../constants/data-attributes';
const debug = Debug('slate:before');
debug.track = Debug('slate:track');
class BeforePlugin {
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBeforeInput(event, editor, next) {
        const isSynthetic = !!event.nativeEvent;
        if (editor.readOnly)
            return;
        // COMPAT: If the browser supports Input Events Level 2, we will have
        // attached a custom handler for the real `beforeinput` events, instead of
        // allowing React's synthetic polyfill, so we need to ignore synthetics.
        // if (isSynthetic && HAS_INPUT_EVENTS_LEVEL_2) return;
        debug('onBeforeInput', { event });
        next();
    }
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onBlur(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        const { relatedTarget, target } = event;
        const window = getWindow(target);
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
            const el = editor.findDOMNode([]);
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
            const node = editor.findNode(relatedTarget);
            if (el.contains(relatedTarget) && node && !editor.isVoid(node)) {
                return;
            }
        }
        debug('onBlur', { event });
        next();
    }
    /**
     * On composition end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionEnd(event, editor, next) {
        const n = BeforePlugin.compositionCount;
        // The `count` check here ensures that if another composition starts
        // before the timeout has closed out this one, we will abort unsetting the
        // `isComposing` flag, since a composition is still in affect.
        window.setTimeout(() => {
            if (BeforePlugin.compositionCount > n)
                return;
            BeforePlugin.isComposing = false;
        }, 100);
        debug('onCompositionEnd', { event });
        next();
    }
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onClick(event, editor, next) {
        debug('onClick', { event });
        next();
    }
    /**
     * On composition start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCompositionStart(event, editor, next) {
        BeforePlugin.isComposing = true;
        BeforePlugin.compositionCount++;
        const { value } = editor;
        const { selection } = value;
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
        debug('onCompositionStart', { event });
        next();
    }
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCopy(event, editor, next) {
        const window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(() => (BeforePlugin.isCopying = false));
        debug('onCopy', { event });
        next();
    }
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onCut(event, editor, next) {
        if (editor.readOnly)
            return;
        const window = getWindow(event.target);
        BeforePlugin.isCopying = true;
        window.requestAnimationFrame(() => (BeforePlugin.isCopying = false));
        debug('onCut', { event });
        next();
    }
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnd(event, editor, next) {
        BeforePlugin.isDragging = false;
        debug('onDragEnd', { event });
        next();
    }
    /**
     * On drag enter.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragEnter(event, editor, next) {
        debug('onDragEnter', { event });
        next();
    }
    /**
     * On drag exit.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragExit(event, editor, next) {
        debug('onDragExit', { event });
        next();
    }
    /**
     * On drag leave.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragLeave(event, editor, next) {
        debug('onDragLeave', { event });
        next();
    }
    /**
     * On drag over.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragOver(event, editor, next) {
        // If the target is inside a void node, and only in this case,
        // call `preventDefault` to signal that drops are allowed.
        // When the target is editable, dropping is already allowed by
        // default, and calling `preventDefault` hides the cursor.
        const node = editor.findNode(event.target);
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
        debug('onDragOver', { event });
        next();
    }
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDragStart(event, editor, next) {
        BeforePlugin.isDragging = true;
        debug('onDragStart', { event });
        next();
    }
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onDrop(event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent default so the DOM's value isn't corrupted.
        event.preventDefault();
        debug('onDrop', { event });
        next();
    }
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onFocus(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (editor.readOnly)
            return;
        const el = editor.findDOMNode([]);
        // Save the new `activeElement`.
        const window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        // COMPAT: If the editor has nested editable elements, the focus can go to
        // those elements. In Firefox, this must be prevented because it results in
        // issues with keyboard navigation. (2017/03/30)
        if (IS_FIREFOX && event.target !== el) {
            el.focus();
            return;
        }
        debug('onFocus', { event });
        next();
    }
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onInput(event, editor, next) {
        if (BeforePlugin.isComposing)
            return;
        if (editor.value.selection.isBlurred)
            return;
        debug('onInput', { event });
        next();
    }
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onKeyDown(event, editor, next) {
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
        debug('onKeyDown', { event });
        debug.track('track start : onKeyDown');
        next();
    }
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onPaste(event, editor, next) {
        if (editor.readOnly)
            return;
        // Prevent defaults so the DOM state isn't corrupted.
        event.preventDefault();
        debug('onPaste', { event });
        next();
    }
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    static onSelect(event, editor, next) {
        if (BeforePlugin.isCopying)
            return;
        if (BeforePlugin.isComposing)
            return;
        if (editor.readOnly)
            return;
        // Save the new `activeElement`.
        const window = getWindow(event.target);
        BeforePlugin.activeElement = window.document.activeElement;
        debug('onSelect', { event });
        next();
    }
}
BeforePlugin.activeElement = null;
BeforePlugin.compositionCount = 0;
BeforePlugin.isComposing = false;
BeforePlugin.isCopying = false;
BeforePlugin.isDragging = false;
export default BeforePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVmb3JlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsicGx1Z2lucy9kb20vYmVmb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLE9BQU8sTUFBTSxlQUFlLENBQUM7QUFDcEMsT0FBTyxTQUFTLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBNEIsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLFVBQVUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN6RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFbkMsTUFBTSxZQUFZO0lBT2Q7Ozs7OztPQU1HO0lBRUgsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUk7UUFDcEMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFDeEMsSUFBSSxNQUFNLENBQUMsUUFBUTtZQUFFLE9BQU87UUFFNUIscUVBQXFFO1FBQ3JFLDBFQUEwRTtRQUMxRSx3RUFBd0U7UUFDeEUsdURBQXVEO1FBRXZELEtBQUssQ0FBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLElBQUksRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUVILE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJO1FBQzdCLElBQUksWUFBWSxDQUFDLFNBQVM7WUFBRSxPQUFPO1FBQ25DLElBQUksTUFBTSxDQUFDLFFBQVE7WUFBRSxPQUFPO1FBRTVCLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxD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QUM3QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVyRSxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMzQixJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFFSCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUM1QixJQUFJLE1BQU0sQ0FBQyxRQUFRO1lBQUUsT0FBTztRQUU1QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVyRSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxQixJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFFSCxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUNoQyxZQUFZLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUNoQyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5QixJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFFSCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUNsQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVB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QUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFFM0QsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDN0IsSUFBSSxFQUFFLENBQUM7SUFDWCxDQUFDOztBQWpiTSwwQkFBYSxHQUFHLElBQUksQ0FBQztBQUNyQiw2QkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDckIsd0JBQVcsR0FBRyxLQUFLLENBQUM7QUFDcEIsc0JBQVMsR0FBRyxLQUFLLENBQUM7QUFDbEIsdUJBQVUsR0FBRyxLQUFLLENBQUM7QUFpYjlCLGVBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBIb3RrZXlzIGZyb20gJ3NsYXRlLWhvdGtleXMnO1xuaW1wb3J0IGdldFdpbmRvdyBmcm9tICdnZXQtd2luZG93JztcbmltcG9ydCB7IElTX0ZJUkVGT1gsIElTX0lFLCBJU19JT1MsIEhBU19JTlBVVF9FVkVOVFNfTEVWRUxfMiB9IGZyb20gJ3NsYXRlLWRldi1lbnZpcm9ubWVudCc7XG5pbXBvcnQgREFUQV9BVFRSUyBmcm9tICcuLi8uLi9jb25zdGFudHMvZGF0YS1hdHRyaWJ1dGVzJztcbmNvbnN0IGRlYnVnID0gRGVidWcoJ3NsYXRlOmJlZm9yZScpO1xuZGVidWcudHJhY2sgPSBEZWJ1Zygnc2xhdGU6dHJhY2snKTtcblxuY2xhc3MgQmVmb3JlUGx1Z2luIHtcbiAgICBzdGF0aWMgYWN0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgc3RhdGljIGNvbXBvc2l0aW9uQ291bnQgPSAwO1xuICAgIHN0YXRpYyBpc0NvbXBvc2luZyA9IGZhbHNlO1xuICAgIHN0YXRpYyBpc0NvcHlpbmcgPSBmYWxzZTtcbiAgICBzdGF0aWMgaXNEcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogT24gYmVmb3JlIGlucHV0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQmVmb3JlSW5wdXQoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBjb25zdCBpc1N5bnRoZXRpYyA9ICEhZXZlbnQubmF0aXZlRXZlbnQ7XG4gICAgICAgIGlmIChlZGl0b3IucmVhZE9ubHkpIHJldHVybjtcblxuICAgICAgICAvLyBDT01QQVQ6IElmIHRoZSBicm93c2VyIHN1cHBvcnRzIElucHV0IEV2ZW50cyBMZXZlbCAyLCB3ZSB3aWxsIGhhdmVcbiAgICAgICAgLy8gYXR0YWNoZWQgYSBjdXN0b20gaGFuZGxlciBmb3IgdGhlIHJlYWwgYGJlZm9yZWlucHV0YCBldmVudHMsIGluc3RlYWQgb2ZcbiAgICAgICAgLy8gYWxsb3dpbmcgUmVhY3QncyBzeW50aGV0aWMgcG9seWZpbGwsIHNvIHdlIG5lZWQgdG8gaWdub3JlIHN5bnRoZXRpY3MuXG4gICAgICAgIC8vIGlmIChpc1N5bnRoZXRpYyAmJiBIQVNfSU5QVVRfRVZFTlRTX0xFVkVMXzIpIHJldHVybjtcblxuICAgICAgICBkZWJ1Zygnb25CZWZvcmVJbnB1dCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBibHVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQmx1cihldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGlmIChCZWZvcmVQbHVnaW4uaXNDb3B5aW5nKSByZXR1cm47XG4gICAgICAgIGlmIChlZGl0b3IucmVhZE9ubHkpIHJldHVybjtcblxuICAgICAgICBjb25zdCB7IHJlbGF0ZWRUYXJnZXQsIHRhcmdldCB9ID0gZXZlbnQ7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyh0YXJnZXQpO1xuXG4gICAgICAgIC8vIENPTVBBVDogSWYgdGhlIGN1cnJlbnQgYGFjdGl2ZUVsZW1lbnRgIGlzIHN0aWxsIHRoZSBwcmV2aW91cyBvbmUsIHRoaXMgaXNcbiAgICAgICAgLy8gZHVlIHRvIHRoZSB3aW5kb3cgYmVpbmcgYmx1cnJlZCB3aGVuIHRoZSB0YWIgaXRzZWxmIGJlY29tZXMgdW5mb2N1c2VkLCBzb1xuICAgICAgICAvLyB3ZSB3YW50IHRvIGFib3J0IGVhcmx5IHRvIGFsbG93IHRvIGVkaXRvciB0byBzdGF5IGZvY3VzZWQgd2hlbiB0aGUgdGFiXG4gICAgICAgIC8vIGJlY29tZXMgZm9jdXNlZCBhZ2Fpbi5cbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5hY3RpdmVFbGVtZW50ID09PSB3aW5kb3cuZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgeyByZXR1cm47IH1cblxuICAgICAgICAvLyBDT01QQVQ6IFRoZSBgcmVsYXRlZFRhcmdldGAgY2FuIGJlIG51bGwgd2hlbiB0aGUgbmV3IGZvY3VzIHRhcmdldCBpcyBub3RcbiAgICAgICAgLy8gYSBcImZvY3VzYWJsZVwiIGVsZW1lbnQgKGVnLiBhIGA8ZGl2PmAgd2l0aG91dCBgdGFiaW5kZXhgIHNldCkuXG4gICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0KSB7XG4gICAgICAgICAgICBjb25zdCBlbCA9IGVkaXRvci5maW5kRE9NTm9kZShbXSk7XG5cbiAgICAgICAgICAgIC8vIENPTVBBVDogVGhlIGV2ZW50IHNob3VsZCBiZSBpZ25vcmVkIGlmIHRoZSBmb2N1cyBpcyByZXR1cm5pbmcgdG8gdGhlXG4gICAgICAgICAgICAvLyBlZGl0b3IgZnJvbSBhbiBlbWJlZGRlZCBlZGl0YWJsZSBlbGVtZW50IChlZy4gYW4gPGlucHV0PiBlbGVtZW50IGluc2lkZVxuICAgICAgICAgICAgLy8gYSB2b2lkIG5vZGUpLlxuICAgICAgICAgICAgaWYgKHJlbGF0ZWRUYXJnZXQgPT09IGVsKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIENPTVBBVDogVGhlIGV2ZW50IHNob3VsZCBiZSBpZ25vcmVkIGlmIHRoZSBmb2N1cyBpcyBtb3ZpbmcgZnJvbSB0aGVcbiAgICAgICAgICAgIC8vIGVkaXRvciB0byBpbnNpZGUgYSB2b2lkIG5vZGUncyBzcGFjZXIgZWxlbWVudC5cbiAgICAgICAgICAgIGlmIChyZWxhdGVkVGFyZ2V0Lmhhc0F0dHJpYnV0ZShEQVRBX0FUVFJTLlNQQUNFUikpIHJldHVybjtcblxuICAgICAgICAgICAgLy8gQ09NUEFUOiBUaGUgZXZlbnQgc2hvdWxkIGJlIGlnbm9yZWQgaWYgdGhlIGZvY3VzIGlzIG1vdmluZyB0byBhIG5vbi1cbiAgICAgICAgICAgIC8vIGVkaXRhYmxlIHNlY3Rpb24gb2YgYW4gZWxlbWVudCB0aGF0IGlzbid0IGEgdm9pZCBub2RlIChlZy4gYSBsaXN0IGl0ZW1cbiAgICAgICAgICAgIC8vIG9mIHRoZSBjaGVjayBsaXN0IGV4YW1wbGUpLlxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGVkaXRvci5maW5kTm9kZShyZWxhdGVkVGFyZ2V0KTtcblxuICAgICAgICAgICAgaWYgKGVsLmNvbnRhaW5zKHJlbGF0ZWRUYXJnZXQpICYmIG5vZGUgJiYgIWVkaXRvci5pc1ZvaWQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Zygnb25CbHVyJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGNvbXBvc2l0aW9uIGVuZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkNvbXBvc2l0aW9uRW5kKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgY29uc3QgbiA9IEJlZm9yZVBsdWdpbi5jb21wb3NpdGlvbkNvdW50O1xuXG4gICAgICAgIC8vIFRoZSBgY291bnRgIGNoZWNrIGhlcmUgZW5zdXJlcyB0aGF0IGlmIGFub3RoZXIgY29tcG9zaXRpb24gc3RhcnRzXG4gICAgICAgIC8vIGJlZm9yZSB0aGUgdGltZW91dCBoYXMgY2xvc2VkIG91dCB0aGlzIG9uZSwgd2Ugd2lsbCBhYm9ydCB1bnNldHRpbmcgdGhlXG4gICAgICAgIC8vIGBpc0NvbXBvc2luZ2AgZmxhZywgc2luY2UgYSBjb21wb3NpdGlvbiBpcyBzdGlsbCBpbiBhZmZlY3QuXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmIChCZWZvcmVQbHVnaW4uY29tcG9zaXRpb25Db3VudCA+IG4pIHJldHVybjtcbiAgICAgICAgICAgIEJlZm9yZVBsdWdpbi5pc0NvbXBvc2luZyA9IGZhbHNlO1xuICAgICAgICB9LCAxMDApO1xuXG4gICAgICAgIGRlYnVnKCdvbkNvbXBvc2l0aW9uRW5kJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGNsaWNrLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ2xpY2soZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBkZWJ1Zygnb25DbGljaycsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjb21wb3NpdGlvbiBzdGFydC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkNvbXBvc2l0aW9uU3RhcnQoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBCZWZvcmVQbHVnaW4uaXNDb21wb3NpbmcgPSB0cnVlO1xuICAgICAgICBCZWZvcmVQbHVnaW4uY29tcG9zaXRpb25Db3VudCsrO1xuXG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IGVkaXRvcjtcbiAgICAgICAgY29uc3QgeyBzZWxlY3Rpb24gfSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICghc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSB7XG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaWFuc3Rvcm10YXlsb3Ivc2xhdGUvaXNzdWVzLzE4NzlcbiAgICAgICAgICAgIC8vIFdoZW4gY29tcG9zaXRpb24gc3RhcnRzIGFuZCB0aGUgY3VycmVudCBzZWxlY3Rpb24gaXMgbm90IGNvbGxhcHNlZCwgdGhlXG4gICAgICAgICAgICAvLyBzZWNvbmQgY29tcG9zaXRpb24ga2V5LWRvd24gd291bGQgZHJvcCB0aGUgdGV4dCB3cmFwcGluZyA8c3BhbnM+IHdoaWNoXG4gICAgICAgICAgICAvLyByZXN1bHRlZCBvbiBjcmFzaCBpbiBjb250ZW50LnVwZGF0ZVNlbGVjdGlvbiBhZnRlciBjb21wb3NpdGlvbiBlbmRzXG4gICAgICAgICAgICAvLyAoYmVjYXVzZSBpdCBjYW5ub3QgZmluZCA8c3Bhbj4gbm9kZXMgaW4gRE9NKS4gVGhpcyBpcyBhIHdvcmthcm91bmQgdGhhdFxuICAgICAgICAgICAgLy8gZXJhc2VzIHNlbGVjdGlvbiBhcyBzb29uIGFzIGNvbXBvc2l0aW9uIHN0YXJ0cyBhbmQgcHJldmVudGluZyA8c3BhbnM+XG4gICAgICAgICAgICAvLyB0byBiZSBkcm9wcGVkLlxuICAgICAgICAgICAgZWRpdG9yLmRlbGV0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVidWcoJ29uQ29tcG9zaXRpb25TdGFydCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjb3B5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ29weShldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICBCZWZvcmVQbHVnaW4uaXNDb3B5aW5nID0gdHJ1ZTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiAoQmVmb3JlUGx1Z2luLmlzQ29weWluZyA9IGZhbHNlKSk7XG5cbiAgICAgICAgZGVidWcoJ29uQ29weScsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjdXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25DdXQoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgY29uc3Qgd2luZG93ID0gZ2V0V2luZG93KGV2ZW50LnRhcmdldCk7XG4gICAgICAgIEJlZm9yZVBsdWdpbi5pc0NvcHlpbmcgPSB0cnVlO1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IChCZWZvcmVQbHVnaW4uaXNDb3B5aW5nID0gZmFsc2UpKTtcblxuICAgICAgICBkZWJ1Zygnb25DdXQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gZHJhZyBlbmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25EcmFnRW5kKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgQmVmb3JlUGx1Z2luLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgZGVidWcoJ29uRHJhZ0VuZCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcmFnIGVudGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ0VudGVyKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uRHJhZ0VudGVyJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyYWcgZXhpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkRyYWdFeGl0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uRHJhZ0V4aXQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gZHJhZyBsZWF2ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkRyYWdMZWF2ZShldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdMZWF2ZScsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcmFnIG92ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25EcmFnT3ZlcihldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgaW5zaWRlIGEgdm9pZCBub2RlLCBhbmQgb25seSBpbiB0aGlzIGNhc2UsXG4gICAgICAgIC8vIGNhbGwgYHByZXZlbnREZWZhdWx0YCB0byBzaWduYWwgdGhhdCBkcm9wcyBhcmUgYWxsb3dlZC5cbiAgICAgICAgLy8gV2hlbiB0aGUgdGFyZ2V0IGlzIGVkaXRhYmxlLCBkcm9wcGluZyBpcyBhbHJlYWR5IGFsbG93ZWQgYnlcbiAgICAgICAgLy8gZGVmYXVsdCwgYW5kIGNhbGxpbmcgYHByZXZlbnREZWZhdWx0YCBoaWRlcyB0aGUgY3Vyc29yLlxuICAgICAgICBjb25zdCBub2RlID0gZWRpdG9yLmZpbmROb2RlKGV2ZW50LnRhcmdldCk7XG5cbiAgICAgICAgaWYgKCFub2RlIHx8IGVkaXRvci5pc1ZvaWQobm9kZSkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElFIHdvbid0IGNhbGwgb25Ecm9wIG9uIGNvbnRlbnRFZGl0YWJsZXMgdW5sZXNzIHRoZVxuICAgICAgICAvLyBkZWZhdWx0IGRyYWdPdmVyIGlzIHByZXZlbnRlZDpcbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubWljcm9zb2Z0LmNvbS9lbi11cy9taWNyb3NvZnQtZWRnZS9wbGF0Zm9ybS9pc3N1ZXMvOTEzOTgyL1xuICAgICAgICAvLyAoMjAxOC8wNy8xMSlcbiAgICAgICAgaWYgKElTX0lFKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkcmFnIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MsIGRvbid0IGRvIHRoaXMgYWdhaW4uXG4gICAgICAgIGlmICghQmVmb3JlUGx1Z2luLmlzRHJhZ2dpbmcpIHtcbiAgICAgICAgICAgIEJlZm9yZVBsdWdpbi5pc0RyYWdnaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gQ09NUEFUOiBJRSB3aWxsIHJhaXNlIGFuIGB1bnNwZWNpZmllZCBlcnJvcmAgaWYgZHJvcEVmZmVjdCBpc1xuICAgICAgICAgICAgLy8gc2V0LiAoMjAxOC8wNy8xMSlcbiAgICAgICAgICAgIGlmICghSVNfSUUpIHtcbiAgICAgICAgICAgICAgICBldmVudC5uYXRpdmVFdmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdtb3ZlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCdvbkRyYWdPdmVyJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyYWcgc3RhcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25EcmFnU3RhcnQoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBCZWZvcmVQbHVnaW4uaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdTdGFydCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcm9wLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJvcChldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGlmIChlZGl0b3IucmVhZE9ubHkpIHJldHVybjtcblxuICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgc28gdGhlIERPTSdzIHZhbHVlIGlzbid0IGNvcnJ1cHRlZC5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBkZWJ1Zygnb25Ecm9wJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGZvY3VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRm9jdXMoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmlzQ29weWluZykgcmV0dXJuO1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZWwgPSBlZGl0b3IuZmluZERPTU5vZGUoW10pO1xuXG4gICAgICAgIC8vIFNhdmUgdGhlIG5ldyBgYWN0aXZlRWxlbWVudGAuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICBCZWZvcmVQbHVnaW4uYWN0aXZlRWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gICAgICAgIC8vIENPTVBBVDogSWYgdGhlIGVkaXRvciBoYXMgbmVzdGVkIGVkaXRhYmxlIGVsZW1lbnRzLCB0aGUgZm9jdXMgY2FuIGdvIHRvXG4gICAgICAgIC8vIHRob3NlIGVsZW1lbnRzLiBJbiBGaXJlZm94LCB0aGlzIG11c3QgYmUgcHJldmVudGVkIGJlY2F1c2UgaXQgcmVzdWx0cyBpblxuICAgICAgICAvLyBpc3N1ZXMgd2l0aCBrZXlib2FyZCBuYXZpZ2F0aW9uLiAoMjAxNy8wMy8zMClcbiAgICAgICAgaWYgKElTX0ZJUkVGT1ggJiYgZXZlbnQudGFyZ2V0ICE9PSBlbCkge1xuICAgICAgICAgICAgZWwuZm9jdXMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCdvbkZvY3VzJywgeyBldmVudCB9KTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGlucHV0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uSW5wdXQoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmlzQ29tcG9zaW5nKSByZXR1cm47XG4gICAgICAgIGlmIChlZGl0b3IudmFsdWUuc2VsZWN0aW9uLmlzQmx1cnJlZCkgcmV0dXJuO1xuICAgICAgICBkZWJ1Zygnb25JbnB1dCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBrZXkgZG93bi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbktleURvd24oZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgLy8gV2hlbiBjb21wb3NpbmcsIHdlIG5lZWQgdG8gcHJldmVudCBhbGwgaG90a2V5cyBmcm9tIGV4ZWN1dGluZyB3aGlsZVxuICAgICAgICAvLyB0eXBpbmcuIEhvd2V2ZXIsIGNlcnRhaW4gY2hhcmFjdGVycyBhbHNvIG1vdmUgdGhlIHNlbGVjdGlvbiBiZWZvcmVcbiAgICAgICAgLy8gd2UncmUgYWJsZSB0byBoYW5kbGUgaXQsIHNvIHByZXZlbnQgdGhlaXIgZGVmYXVsdCBiZWhhdmlvci5cbiAgICAgICAgaWYgKEJlZm9yZVBsdWdpbi5pc0NvbXBvc2luZykge1xuICAgICAgICAgICAgaWYgKEhvdGtleXMuaXNDb21wb3NlKGV2ZW50KSkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENlcnRhaW4gaG90a2V5cyBoYXZlIG5hdGl2ZSBlZGl0aW5nIGJlaGF2aW9ycyBpbiBgY29udGVudGVkaXRhYmxlYFxuICAgICAgICAvLyBlbGVtZW50cyB3aGljaCB3aWxsIGVkaXRvciB0aGUgRE9NIGFuZCBjYXVzZSBvdXIgdmFsdWUgdG8gYmUgb3V0IG9mIHN5bmMsXG4gICAgICAgIC8vIHNvIHRoZXkgbmVlZCB0byBhbHdheXMgYmUgcHJldmVudGVkLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhSVNfSU9TICYmXG4gICAgICAgICAgICAoSG90a2V5cy5pc0JvbGQoZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc0RlbGV0ZUJhY2t3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVGb3J3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVMaW5lQmFja3dhcmQoZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc0RlbGV0ZUxpbmVGb3J3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNEZWxldGVXb3JkQmFja3dhcmQoZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc0RlbGV0ZVdvcmRGb3J3YXJkKGV2ZW50KSB8fFxuICAgICAgICAgICAgICAgIEhvdGtleXMuaXNJdGFsaWMoZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc1JlZG8oZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc1NwbGl0QmxvY2soZXZlbnQpIHx8XG4gICAgICAgICAgICAgICAgSG90a2V5cy5pc1RyYW5zcG9zZUNoYXJhY3RlcihldmVudCkgfHxcbiAgICAgICAgICAgICAgICBIb3RrZXlzLmlzVW5kbyhldmVudCkpXG4gICAgICAgICkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCdvbktleURvd24nLCB7IGV2ZW50IH0pO1xuICAgICAgICBkZWJ1Zy50cmFjaygndHJhY2sgc3RhcnQgOiBvbktleURvd24nKTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIHBhc3RlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uUGFzdGUoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoZWRpdG9yLnJlYWRPbmx5KSByZXR1cm47XG5cbiAgICAgICAgLy8gUHJldmVudCBkZWZhdWx0cyBzbyB0aGUgRE9NIHN0YXRlIGlzbid0IGNvcnJ1cHRlZC5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBkZWJ1Zygnb25QYXN0ZScsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBzZWxlY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25TZWxlY3QoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmlzQ29weWluZykgcmV0dXJuO1xuICAgICAgICBpZiAoQmVmb3JlUGx1Z2luLmlzQ29tcG9zaW5nKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGVkaXRvci5yZWFkT25seSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFNhdmUgdGhlIG5ldyBgYWN0aXZlRWxlbWVudGAuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICBCZWZvcmVQbHVnaW4uYWN0aXZlRWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gICAgICAgIGRlYnVnKCdvblNlbGVjdCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQmVmb3JlUGx1Z2luO1xuIl19