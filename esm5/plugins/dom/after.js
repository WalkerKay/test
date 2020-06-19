import * as tslib_1 from "tslib";
import Base64 from 'slate-base64-serializer';
import Debug from 'debug';
import Hotkeys from 'slate-hotkeys';
import Plain from 'slate-plain-serializer';
import getWindow from 'get-window';
import { IS_IOS, IS_IE, IS_EDGE } from 'slate-dev-environment';
import cloneFragment from '../../utils/clone-fragment';
import getEventTransfer from '../../utils/get-event-transfer';
import setEventTransfer from '../../utils/set-event-transfer';
import { TAB } from '@angular/cdk/keycodes';
var TAB_SPACE = '    ';
/**
 * Debug.
 *
 * @type {Function}
 */
var debug = Debug('slate:after');
debug.beforeInput = Debug('slate:after-before-input');
var AfterPlugin = /** @class */ (function () {
    function AfterPlugin() {
    }
    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onBeforeInput = function (event, editor, next) {
        var value = editor.value;
        var isSynthetic = !!event.nativeEvent;
        // let mustPreventNative = false;
        // const globalThis = window;
        // const nativeSelection = window.getSelection();
        // if (!mustPreventNative) {
        //     if (
        //         nativeSelection.anchorNode &&
        //         nativeSelection.anchorNode.nodeType === Node.TEXT_NODE
        //     ) {
        //         const parentNode = nativeSelection.anchorNode.parentNode;
        //         mustPreventNative =
        //             parentNode.nodeName === 'SPAN' &&
        //             parentNode.firstChild.nodeType === Node.TEXT_NODE &&
        //             !editor.value.anchorText.text &&
        //             !editor.value.endText.text;
        //     } else {
        //         mustPreventNative = true;
        //     }
        // }
        // If the event is synthetic, it's React's polyfill of `beforeinput` that
        // isn't a true `beforeinput` event with meaningful information. It only
        // gets triggered for character insertions, so we can just insert directly.
        if (isSynthetic) {
            debug.beforeInput('onBeforeInput', { event: event });
            // cancel preventDefault, prevent emit native selectionchange to move focus next component
            if (editor.value.anchorText.text === '') {
                setTimeout(function () {
                    editor.insertText(event.data);
                });
                return next();
            }
            event.nativeEvent.preventDefault();
            editor.insertText(event.data);
            // if (mustPreventNative) {
            //     event.nativeEvent.preventDefault();
            //     editor.insertText(event.data);
            // } else {
            //     // setImmediate(() => {
            //     //     editor.insertText(event.data);
            //     // });
            // }
            return next();
        }
        // Otherwise, we can use the information in the `beforeinput` event to
        // figure out the exact change that will occur, and prevent it.
        var _a = tslib_1.__read(event.getTargetRanges(), 1), targetRange = _a[0];
        if (!targetRange) {
            return next();
        }
        debug('onBeforeInput', { event: event });
        event.preventDefault();
        var document = value.document, selection = value.selection;
        var range = editor.findRange(targetRange);
        switch (event.inputType) {
            case 'deleteByDrag':
            case 'deleteByCut':
            case 'deleteContent':
            case 'deleteContentBackward':
            case 'deleteContentForward': {
                editor.deleteAtRange(range);
                break;
            }
            case 'deleteWordBackward': {
                editor.deleteWordBackwardAtRange(range);
                break;
            }
            case 'deleteWordForward': {
                editor.deleteWordForwardAtRange(range);
                break;
            }
            case 'deleteSoftLineBackward':
            case 'deleteHardLineBackward': {
                editor.deleteLineBackwardAtRange(range);
                break;
            }
            case 'deleteSoftLineForward':
            case 'deleteHardLineForward': {
                editor.deleteLineForwardAtRange(range);
                break;
            }
            case 'insertLineBreak':
            case 'insertParagraph': {
                var hasVoidParent = document.hasVoidParent(selection.start.path, editor);
                if (hasVoidParent) {
                    editor.moveToStartOfNextText();
                }
                else {
                    editor.splitBlockAtRange(range);
                }
                break;
            }
            case 'insertFromYank':
            case 'insertReplacementText':
            case 'insertText': {
                // COMPAT: `data` should have the text for the `insertText` input type
                // and `dataTransfer` should have the text for the
                // `insertReplacementText` input type, but Safari uses `insertText` for
                // spell check replacements and sets `data` to `null`. (2018/08/09)
                var text = event.data == null
                    ? event.dataTransfer.getData('text/plain')
                    : event.data;
                if (text == null) {
                    break;
                }
                editor.insertTextAtRange(range, text, selection.marks);
                // If the text was successfully inserted, and the selection had marks
                // on it, unset the selection's marks.
                if (selection.marks &&
                    value.document !== editor.value.document) {
                    editor.select({ marks: null });
                }
                break;
            }
        }
        next();
    };
    /**
     * On blur.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onBlur = function (event, editor, next) {
        debug('onBlur', { event: event });
        editor.blur();
        next();
    };
    /**
     * On click.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onClick = function (event, editor, next) {
        if (editor.readOnly)
            return next();
        var value = editor.value;
        var document = value.document;
        var path = editor.findPath(event.target);
        if (!path)
            return next();
        debug('onClick', { event: event });
        var node = document.getNode(path);
        var ancestors = document.getAncestors(path);
        var isVoid = node &&
            (editor.isVoid(node) || ancestors.some(function (a) { return editor.isVoid(a); }));
        if (isVoid) {
            // COMPAT: In Chrome & Safari, selections that are at the zero offset of
            // an inline node will be automatically replaced to be at the last offset
            // of a previous inline node, which screws us up, so we always want to set
            // it to the end of the node. (2016/11/29)
            editor.focus().moveToEndOfNode(node);
        }
        next();
    };
    /**
     * On copy.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onCopy = function (event, editor, next) {
        debug('onCopy', { event: event });
        cloneFragment(event, editor);
        next();
    };
    /**
     * On cut.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onCut = function (event, editor, next) {
        debug('onCut', { event: event });
        // Once the fake cut content has successfully been added to the clipboard,
        // delete the content in the current selection.
        cloneFragment(event, editor, function () {
            var e_1, _a;
            // If user cuts a void block node or a void inline node,
            // manually removes it since selection is collapsed in this case.
            var value = editor.value;
            var document = value.document, selection = value.selection;
            var end = selection.end, isCollapsed = selection.isCollapsed;
            var voidPath;
            if (isCollapsed) {
                try {
                    for (var _b = tslib_1.__values(document.ancestors(end.path)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var _d = tslib_1.__read(_c.value, 2), node = _d[0], path = _d[1];
                        if (editor.isVoid(node)) {
                            voidPath = path;
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            if (voidPath) {
                editor.removeNodeByKey(voidPath);
            }
            else {
                editor.delete();
            }
        });
        next();
    };
    /**
     * On drag end.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onDragEnd = function (event, editor, next) {
        debug('onDragEnd', { event: event });
        AfterPlugin.isDraggingInternally = null;
        next();
    };
    /**
     * On drag start.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onDragStart = function (event, editor, next) {
        debug('onDragStart', { event: event });
        AfterPlugin.isDraggingInternally = true;
        var value = editor.value;
        var document = value.document;
        var path = editor.findPath(event.target);
        var node = document.getNode(path);
        var ancestors = document.getAncestors(path);
        var isVoid = node &&
            (editor.isVoid(node) || ancestors.some(function (a) { return editor.isVoid(a); }));
        var selectionIncludesNode = value.blocks.some(function (block) { return block === node; });
        // If a void block is dragged and is not selected, select it (necessary for local drags).
        if (isVoid && !selectionIncludesNode) {
            editor.moveToRangeOfNode(node);
        }
        var fragment = editor.value.fragment;
        var encoded = Base64.serializeNode(fragment);
        setEventTransfer(event, 'fragment', encoded);
        next();
    };
    /**
     * On drop.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onDrop = function (event, editor, next) {
        var _a;
        var value = editor.value;
        var document = value.document, selection = value.selection;
        var window = getWindow(event.target);
        var target = editor.findEventRange(event);
        if (!target) {
            return next();
        }
        debug('onDrop', { event: event });
        var transfer = getEventTransfer(event);
        var type = transfer.type, fragment = transfer.fragment, text = transfer.text;
        editor.focus();
        // If the drag is internal and the target is after the selection, it
        // needs to account for the selection's content being deleted.
        if (AfterPlugin.isDraggingInternally &&
            selection.end.offset < target.end.offset &&
            selection.end.path.equals(target.end.path)) {
            target = target.moveForward(selection.start.path.equals(selection.end.path)
                ? 0 - selection.end.offset + selection.start.offset
                : 0 - selection.end.offset);
        }
        if (AfterPlugin.isDraggingInternally) {
            editor.delete();
        }
        editor.select(target);
        if (type === 'text' || type === 'html') {
            var anchor = target.anchor;
            var hasVoidParent = document.hasVoidParent(anchor.path, editor);
            if (hasVoidParent) {
                var p = anchor.path;
                var n = document.getNode(anchor.path);
                while (hasVoidParent) {
                    var _b = tslib_1.__read(document.texts({ path: p }), 1), nxt = _b[0];
                    if (!nxt) {
                        break;
                    }
                    _a = tslib_1.__read(nxt, 2), n = _a[0], p = _a[1];
                    hasVoidParent = document.hasVoidParent(p, editor);
                }
                if (n)
                    editor.moveToStartOfNode(n);
            }
            if (text) {
                text.split('\n').forEach(function (line, i) {
                    if (i > 0)
                        editor.splitBlock();
                    editor.insertText(line);
                });
            }
        }
        if (type === 'fragment') {
            editor.insertFragment(fragment);
        }
        // COMPAT: React's onSelect event breaks after an onDrop event
        // has fired in a node: https://github.com/facebook/react/issues/11379.
        // Until this is fixed in React, we dispatch a mouseup event on that
        // DOM node, since that will make it go back to normal.
        var el = editor.findDOMNode(target.focus.path);
        if (el) {
            el.dispatchEvent(new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        }
        next();
    };
    /**
     * On focus.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onFocus = function (event, editor, next) {
        debug('onFocus', { event: event });
        // COMPAT: If the focus event is a mouse-based one, it will be shortly
        // followed by a `selectionchange`, so we need to deselect here to prevent
        // the old selection from being set by the `updateSelection` of `<Content>`,
        // preventing the `selectionchange` from firing. (2018/11/07)
        if (AfterPlugin.isMouseDown && !IS_IE && !IS_EDGE) {
            editor.deselect().focus();
        }
        else {
            editor.focus();
        }
        next();
    };
    /**
     * On input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onInput = function (event, editor, next) {
        debug('onInput');
        var window = getWindow(event.target);
        var domSelection = window.getSelection();
        var selection = editor.findSelection(domSelection);
        if (selection) {
            editor.select(selection);
        }
        else {
            editor.blur();
        }
        var anchorNode = domSelection.anchorNode;
        editor.reconcileDOMNode(anchorNode);
        next();
    };
    /**
     * On key down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onKeyDown = function (event, editor, next) {
        debug('onKeyDown', { event: event });
        var value = editor.value;
        var document = value.document, selection = value.selection;
        var start = selection.start;
        var hasVoidParent = document.hasVoidParent(start.path, editor);
        // COMPAT: In iOS, some of these hotkeys are handled in the
        // `onNativeBeforeInput` handler of the `<Content>` component in order to
        // preserve native autocorrect behavior, so they shouldn't be handled here.
        if (Hotkeys.isSplitBlock(event) && !IS_IOS) {
            return hasVoidParent
                ? editor.moveToStartOfNextText()
                : editor.splitBlock();
        }
        if (Hotkeys.isDeleteBackward(event) && !IS_IOS) {
            return editor.deleteCharBackward();
        }
        if (Hotkeys.isDeleteForward(event) && !IS_IOS) {
            return editor.deleteCharForward();
        }
        if (Hotkeys.isDeleteLineBackward(event)) {
            return editor.deleteLineBackward();
        }
        if (Hotkeys.isDeleteLineForward(event)) {
            return editor.deleteLineForward();
        }
        if (Hotkeys.isDeleteWordBackward(event)) {
            return editor.deleteWordBackward();
        }
        if (Hotkeys.isDeleteWordForward(event)) {
            return editor.deleteWordForward();
        }
        if (Hotkeys.isRedo(event)) {
            return editor.redo();
        }
        if (Hotkeys.isUndo(event)) {
            return editor.undo();
        }
        // COMPAT: Certain browsers don't handle the selection updates properly. In
        // Chrome, the selection isn't properly extended. And in Firefox, the
        // selection isn't properly collapsed. (2017/10/17)
        if (Hotkeys.isMoveLineBackward(event)) {
            event.preventDefault();
            return editor.moveToStartOfBlock();
        }
        if (Hotkeys.isMoveLineForward(event)) {
            event.preventDefault();
            return editor.moveToEndOfBlock();
        }
        if (Hotkeys.isExtendLineBackward(event)) {
            event.preventDefault();
            return editor.moveFocusToStartOfBlock();
        }
        if (Hotkeys.isExtendLineForward(event)) {
            event.preventDefault();
            return editor.moveFocusToEndOfBlock();
        }
        // COMPAT: If a void node is selected, or a zero-width text node adjacent to
        // an inline is selected, we need to handle these hotkeys manually because
        // browsers won't know what to do.
        if (Hotkeys.isMoveBackward(event)) {
            event.preventDefault();
            if (!selection.isCollapsed) {
                return editor.moveToStart();
            }
            return editor.moveBackward();
        }
        if (Hotkeys.isMoveForward(event)) {
            event.preventDefault();
            if (!selection.isCollapsed) {
                return editor.moveToEnd();
            }
            return editor.moveForward();
        }
        if (Hotkeys.isMoveWordBackward(event)) {
            event.preventDefault();
            return editor.moveWordBackward();
        }
        if (Hotkeys.isMoveWordForward(event)) {
            event.preventDefault();
            return editor.moveWordForward();
        }
        if (Hotkeys.isExtendBackward(event)) {
            var startText = document.getNode(start.path);
            var _a = tslib_1.__read(document.texts({
                path: start.path,
                direction: 'backward'
            }), 1), prevEntry = _a[0];
            var isPrevInVoid = false;
            if (prevEntry) {
                var _b = tslib_1.__read(prevEntry, 2), prevPath = _b[1];
                isPrevInVoid = document.hasVoidParent(prevPath, editor);
            }
            if (hasVoidParent || isPrevInVoid || startText.text === '') {
                event.preventDefault();
                return editor.moveFocusBackward();
            }
        }
        if (Hotkeys.isExtendForward(event)) {
            var startText = document.getNode(start.path);
            var _c = tslib_1.__read(document.texts({ path: start.path }), 1), nextEntry = _c[0];
            var isNextInVoid = false;
            if (nextEntry) {
                var _d = tslib_1.__read(nextEntry, 2), nextPath = _d[1];
                isNextInVoid = document.hasVoidParent(nextPath, editor);
            }
            if (hasVoidParent || isNextInVoid || startText.text === '') {
                event.preventDefault();
                return editor.moveFocusForward();
            }
        }
        if (event.keyCode === TAB) {
            event.preventDefault();
            return editor.insertText(TAB_SPACE);
        }
        next();
    };
    /**
     * On mouse down.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onMouseDown = function (event, editor, next) {
        debug('onMouseDown', { event: event });
        AfterPlugin.isMouseDown = true;
        next();
    };
    /**
     * On mouse up.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onMouseUp = function (event, editor, next) {
        debug('onMouseUp', { event: event });
        AfterPlugin.isMouseDown = false;
        next();
    };
    /**
     * On paste.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onPaste = function (event, editor, next) {
        debug('onPaste', { event: event });
        var value = editor.value;
        var transfer = getEventTransfer(event);
        var type = transfer.type, fragment = transfer.fragment, text = transfer.text;
        if (type === 'fragment') {
            editor.insertFragment(fragment);
        }
        if (type === 'text' || type === 'html') {
            if (!text)
                return next();
            var document_1 = value.document, selection = value.selection, startBlock = value.startBlock;
            if (editor.isVoid(startBlock))
                return next();
            var defaultBlock = startBlock;
            var defaultMarks = document_1.getInsertMarksAtRange(selection);
            var frag = Plain.deserialize(text, { defaultBlock: defaultBlock, defaultMarks: defaultMarks })
                .document;
            editor.insertFragment(frag);
        }
        next();
    };
    /**
     * On select.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */
    AfterPlugin.onSelect = function (event, editor, next) {
        debug('onSelect', { event: event });
        var window = getWindow(event.target);
        var domSelection = window.getSelection();
        // slate-next fix select the range interrupted
        if (domSelection.rangeCount) {
            var range = editor.findRange(domSelection);
            if (range) {
                var selection = editor.findSelection(domSelection);
                editor.select(selection);
            }
        }
        else {
            editor.blur();
        }
        // COMPAT: reset the `AfterPlugin.isMouseDown` state here in case a `mouseup` event
        // happens outside the editor. This is needed for `onFocus` handling.
        AfterPlugin.isMouseDown = false;
        next();
    };
    AfterPlugin.isDraggingInternally = null;
    AfterPlugin.isMouseDown = false;
    return AfterPlugin;
}());
/**
 * Export.
 *
 * @type {Function}
 */
export default AfterPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXIuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJwbHVnaW5zL2RvbS9hZnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxNQUFNLE1BQU0seUJBQXlCLENBQUM7QUFDN0MsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sT0FBTyxNQUFNLGVBQWUsQ0FBQztBQUNwQyxPQUFPLEtBQUssTUFBTSx3QkFBd0IsQ0FBQztBQUMzQyxPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFL0QsT0FBTyxhQUFhLE1BQU0sNEJBQTRCLENBQUM7QUFDdkQsT0FBTyxnQkFBZ0IsTUFBTSxnQ0FBZ0MsQ0FBQztBQUM5RCxPQUFPLGdCQUFnQixNQUFNLGdDQUFnQyxDQUFDO0FBQzlELE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUM1QyxJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUM7QUFFekI7Ozs7R0FJRztBQUVILElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUVuQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXREO0lBQUE7SUFnc0JBLENBQUM7SUE1ckJHOzs7Ozs7T0FNRztJQUVJLHlCQUFhLEdBQXBCLFVBQXFCLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUM1QixJQUFBLG9CQUFLLENBQVk7UUFDekIsSUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFFeEMsaUNBQWlDO1FBQ2pDLDZCQUE2QjtRQUM3QixpREFBaUQ7UUFDakQsNEJBQTRCO1FBQzVCLFdBQVc7UUFDWCx3Q0FBd0M7UUFDeEMsaUVBQWlFO1FBQ2pFLFVBQVU7UUFD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LENBQUM7YUFDNUI7U0FDSjthQUFNO1lBQ0gsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2pCO1FBRUQsbUZBQW1GO1FBQ25GLHFFQUFxRTtRQUNyRSxXQUFXLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUNoQyxJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUM7SUE5ckJNLGdDQUFvQixHQUFHLElBQUksQ0FBQztJQUM1Qix1QkFBVyxHQUFHLEtBQUssQ0FBQztJQThyQi9CLGtCQUFDO0NBQUEsQUFoc0JELElBZ3NCQztBQUVEOzs7O0dBSUc7QUFFSCxlQUFlLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCYXNlNjQgZnJvbSAnc2xhdGUtYmFzZTY0LXNlcmlhbGl6ZXInO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBIb3RrZXlzIGZyb20gJ3NsYXRlLWhvdGtleXMnO1xuaW1wb3J0IFBsYWluIGZyb20gJ3NsYXRlLXBsYWluLXNlcmlhbGl6ZXInO1xuaW1wb3J0IGdldFdpbmRvdyBmcm9tICdnZXQtd2luZG93JztcbmltcG9ydCB7IElTX0lPUywgSVNfSUUsIElTX0VER0UgfSBmcm9tICdzbGF0ZS1kZXYtZW52aXJvbm1lbnQnO1xuXG5pbXBvcnQgY2xvbmVGcmFnbWVudCBmcm9tICcuLi8uLi91dGlscy9jbG9uZS1mcmFnbWVudCc7XG5pbXBvcnQgZ2V0RXZlbnRUcmFuc2ZlciBmcm9tICcuLi8uLi91dGlscy9nZXQtZXZlbnQtdHJhbnNmZXInO1xuaW1wb3J0IHNldEV2ZW50VHJhbnNmZXIgZnJvbSAnLi4vLi4vdXRpbHMvc2V0LWV2ZW50LXRyYW5zZmVyJztcbmltcG9ydCB7IFRBQiB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5jb25zdCBUQUJfU1BBQ0UgPSAnICAgICc7XG5cbi8qKlxuICogRGVidWcuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ3NsYXRlOmFmdGVyJyk7XG5cbmRlYnVnLmJlZm9yZUlucHV0ID0gRGVidWcoJ3NsYXRlOmFmdGVyLWJlZm9yZS1pbnB1dCcpO1xuXG5jbGFzcyBBZnRlclBsdWdpbiB7XG4gICAgc3RhdGljIGlzRHJhZ2dpbmdJbnRlcm5hbGx5ID0gbnVsbDtcbiAgICBzdGF0aWMgaXNNb3VzZURvd24gPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIE9uIGJlZm9yZSBpbnB1dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkJlZm9yZUlucHV0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCBpc1N5bnRoZXRpYyA9ICEhZXZlbnQubmF0aXZlRXZlbnQ7XG5cbiAgICAgICAgLy8gbGV0IG11c3RQcmV2ZW50TmF0aXZlID0gZmFsc2U7XG4gICAgICAgIC8vIGNvbnN0IGdsb2JhbFRoaXMgPSB3aW5kb3c7XG4gICAgICAgIC8vIGNvbnN0IG5hdGl2ZVNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgLy8gaWYgKCFtdXN0UHJldmVudE5hdGl2ZSkge1xuICAgICAgICAvLyAgICAgaWYgKFxuICAgICAgICAvLyAgICAgICAgIG5hdGl2ZVNlbGVjdGlvbi5hbmNob3JOb2RlICYmXG4gICAgICAgIC8vICAgICAgICAgbmF0aXZlU2VsZWN0aW9uLmFuY2hvck5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFXG4gICAgICAgIC8vICAgICApIHtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gbmF0aXZlU2VsZWN0aW9uLmFuY2hvck5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgLy8gICAgICAgICBtdXN0UHJldmVudE5hdGl2ZSA9XG4gICAgICAgIC8vICAgICAgICAgICAgIHBhcmVudE5vZGUubm9kZU5hbWUgPT09ICdTUEFOJyAmJlxuICAgICAgICAvLyAgICAgICAgICAgICBwYXJlbnROb2RlLmZpcnN0Q2hpbGQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFICYmXG4gICAgICAgIC8vICAgICAgICAgICAgICFlZGl0b3IudmFsdWUuYW5jaG9yVGV4dC50ZXh0ICYmXG4gICAgICAgIC8vICAgICAgICAgICAgICFlZGl0b3IudmFsdWUuZW5kVGV4dC50ZXh0O1xuICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgICBtdXN0UHJldmVudE5hdGl2ZSA9IHRydWU7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gSWYgdGhlIGV2ZW50IGlzIHN5bnRoZXRpYywgaXQncyBSZWFjdCdzIHBvbHlmaWxsIG9mIGBiZWZvcmVpbnB1dGAgdGhhdFxuICAgICAgICAvLyBpc24ndCBhIHRydWUgYGJlZm9yZWlucHV0YCBldmVudCB3aXRoIG1lYW5pbmdmdWwgaW5mb3JtYXRpb24uIEl0IG9ubHlcbiAgICAgICAgLy8gZ2V0cyB0cmlnZ2VyZWQgZm9yIGNoYXJhY3RlciBpbnNlcnRpb25zLCBzbyB3ZSBjYW4ganVzdCBpbnNlcnQgZGlyZWN0bHkuXG4gICAgICAgIGlmIChpc1N5bnRoZXRpYykge1xuICAgICAgICAgICAgZGVidWcuYmVmb3JlSW5wdXQoJ29uQmVmb3JlSW5wdXQnLCB7IGV2ZW50IH0pO1xuICAgICAgICAgICAgLy8gY2FuY2VsIHByZXZlbnREZWZhdWx0LCBwcmV2ZW50IGVtaXQgbmF0aXZlIHNlbGVjdGlvbmNoYW5nZSB0byBtb3ZlIGZvY3VzIG5leHQgY29tcG9uZW50XG4gICAgICAgICAgICBpZiAoZWRpdG9yLnZhbHVlLmFuY2hvclRleHQudGV4dCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmluc2VydFRleHQoZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50Lm5hdGl2ZUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChldmVudC5kYXRhKTtcbiAgICAgICAgICAgIC8vIGlmIChtdXN0UHJldmVudE5hdGl2ZSkge1xuICAgICAgICAgICAgLy8gICAgIGV2ZW50Lm5hdGl2ZUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAvLyAgICAgZWRpdG9yLmluc2VydFRleHQoZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgIC8vIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgLy8gICAgIGVkaXRvci5pbnNlcnRUZXh0KGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgLy8gICAgIC8vIH0pO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgY2FuIHVzZSB0aGUgaW5mb3JtYXRpb24gaW4gdGhlIGBiZWZvcmVpbnB1dGAgZXZlbnQgdG9cbiAgICAgICAgLy8gZmlndXJlIG91dCB0aGUgZXhhY3QgY2hhbmdlIHRoYXQgd2lsbCBvY2N1ciwgYW5kIHByZXZlbnQgaXQuXG4gICAgICAgIGNvbnN0IFt0YXJnZXRSYW5nZV0gPSBldmVudC5nZXRUYXJnZXRSYW5nZXMoKTtcbiAgICAgICAgaWYgKCF0YXJnZXRSYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCdvbkJlZm9yZUlucHV0JywgeyBldmVudCB9KTtcblxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IHsgZG9jdW1lbnQsIHNlbGVjdGlvbiB9ID0gdmFsdWU7XG4gICAgICAgIGNvbnN0IHJhbmdlID0gZWRpdG9yLmZpbmRSYW5nZSh0YXJnZXRSYW5nZSk7XG5cbiAgICAgICAgc3dpdGNoIChldmVudC5pbnB1dFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZUJ5RHJhZyc6XG4gICAgICAgICAgICBjYXNlICdkZWxldGVCeUN1dCc6XG4gICAgICAgICAgICBjYXNlICdkZWxldGVDb250ZW50JzpcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZUNvbnRlbnRCYWNrd2FyZCc6XG4gICAgICAgICAgICBjYXNlICdkZWxldGVDb250ZW50Rm9yd2FyZCc6IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGVsZXRlQXRSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZVdvcmRCYWNrd2FyZCc6IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGVsZXRlV29yZEJhY2t3YXJkQXRSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZVdvcmRGb3J3YXJkJzoge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kZWxldGVXb3JkRm9yd2FyZEF0UmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlICdkZWxldGVTb2Z0TGluZUJhY2t3YXJkJzpcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZUhhcmRMaW5lQmFja3dhcmQnOiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLmRlbGV0ZUxpbmVCYWNrd2FyZEF0UmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlICdkZWxldGVTb2Z0TGluZUZvcndhcmQnOlxuICAgICAgICAgICAgY2FzZSAnZGVsZXRlSGFyZExpbmVGb3J3YXJkJzoge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kZWxldGVMaW5lRm9yd2FyZEF0UmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlICdpbnNlcnRMaW5lQnJlYWsnOlxuICAgICAgICAgICAgY2FzZSAnaW5zZXJ0UGFyYWdyYXBoJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1ZvaWRQYXJlbnQgPSBkb2N1bWVudC5oYXNWb2lkUGFyZW50KFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24uc3RhcnQucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNWb2lkUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5tb3ZlVG9TdGFydE9mTmV4dFRleHQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc3BsaXRCbG9ja0F0UmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlICdpbnNlcnRGcm9tWWFuayc6XG4gICAgICAgICAgICBjYXNlICdpbnNlcnRSZXBsYWNlbWVudFRleHQnOlxuICAgICAgICAgICAgY2FzZSAnaW5zZXJ0VGV4dCc6IHtcbiAgICAgICAgICAgICAgICAvLyBDT01QQVQ6IGBkYXRhYCBzaG91bGQgaGF2ZSB0aGUgdGV4dCBmb3IgdGhlIGBpbnNlcnRUZXh0YCBpbnB1dCB0eXBlXG4gICAgICAgICAgICAgICAgLy8gYW5kIGBkYXRhVHJhbnNmZXJgIHNob3VsZCBoYXZlIHRoZSB0ZXh0IGZvciB0aGVcbiAgICAgICAgICAgICAgICAvLyBgaW5zZXJ0UmVwbGFjZW1lbnRUZXh0YCBpbnB1dCB0eXBlLCBidXQgU2FmYXJpIHVzZXMgYGluc2VydFRleHRgIGZvclxuICAgICAgICAgICAgICAgIC8vIHNwZWxsIGNoZWNrIHJlcGxhY2VtZW50cyBhbmQgc2V0cyBgZGF0YWAgdG8gYG51bGxgLiAoMjAxOC8wOC8wOSlcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID1cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuZGF0YSA9PSBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCd0ZXh0L3BsYWluJylcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQuZGF0YTtcblxuICAgICAgICAgICAgICAgIGlmICh0ZXh0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZWRpdG9yLmluc2VydFRleHRBdFJhbmdlKHJhbmdlLCB0ZXh0LCBzZWxlY3Rpb24ubWFya3MpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHRleHQgd2FzIHN1Y2Nlc3NmdWxseSBpbnNlcnRlZCwgYW5kIHRoZSBzZWxlY3Rpb24gaGFkIG1hcmtzXG4gICAgICAgICAgICAgICAgLy8gb24gaXQsIHVuc2V0IHRoZSBzZWxlY3Rpb24ncyBtYXJrcy5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5tYXJrcyAmJlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5kb2N1bWVudCAhPT0gZWRpdG9yLnZhbHVlLmRvY3VtZW50XG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5zZWxlY3QoeyBtYXJrczogbnVsbCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBibHVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQmx1cihldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkJsdXInLCB7IGV2ZW50IH0pO1xuICAgICAgICBlZGl0b3IuYmx1cigpO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gY2xpY2suXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25DbGljayhldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGlmIChlZGl0b3IucmVhZE9ubHkpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCB7IGRvY3VtZW50IH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgcGF0aCA9IGVkaXRvci5maW5kUGF0aChldmVudC50YXJnZXQpO1xuICAgICAgICBpZiAoIXBhdGgpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgZGVidWcoJ29uQ2xpY2snLCB7IGV2ZW50IH0pO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5nZXROb2RlKHBhdGgpO1xuICAgICAgICBjb25zdCBhbmNlc3RvcnMgPSBkb2N1bWVudC5nZXRBbmNlc3RvcnMocGF0aCk7XG4gICAgICAgIGNvbnN0IGlzVm9pZCA9XG4gICAgICAgICAgICBub2RlICYmXG4gICAgICAgICAgICAoZWRpdG9yLmlzVm9pZChub2RlKSB8fCBhbmNlc3RvcnMuc29tZShhID0+IGVkaXRvci5pc1ZvaWQoYSkpKTtcblxuICAgICAgICBpZiAoaXNWb2lkKSB7XG4gICAgICAgICAgICAvLyBDT01QQVQ6IEluIENocm9tZSAmIFNhZmFyaSwgc2VsZWN0aW9ucyB0aGF0IGFyZSBhdCB0aGUgemVybyBvZmZzZXQgb2ZcbiAgICAgICAgICAgIC8vIGFuIGlubGluZSBub2RlIHdpbGwgYmUgYXV0b21hdGljYWxseSByZXBsYWNlZCB0byBiZSBhdCB0aGUgbGFzdCBvZmZzZXRcbiAgICAgICAgICAgIC8vIG9mIGEgcHJldmlvdXMgaW5saW5lIG5vZGUsIHdoaWNoIHNjcmV3cyB1cyB1cCwgc28gd2UgYWx3YXlzIHdhbnQgdG8gc2V0XG4gICAgICAgICAgICAvLyBpdCB0byB0aGUgZW5kIG9mIHRoZSBub2RlLiAoMjAxNi8xMS8yOSlcbiAgICAgICAgICAgIGVkaXRvci5mb2N1cygpLm1vdmVUb0VuZE9mTm9kZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBjb3B5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ29weShldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkNvcHknLCB7IGV2ZW50IH0pO1xuICAgICAgICBjbG9uZUZyYWdtZW50KGV2ZW50LCBlZGl0b3IpO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gY3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ3V0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uQ3V0JywgeyBldmVudCB9KTtcblxuICAgICAgICAvLyBPbmNlIHRoZSBmYWtlIGN1dCBjb250ZW50IGhhcyBzdWNjZXNzZnVsbHkgYmVlbiBhZGRlZCB0byB0aGUgY2xpcGJvYXJkLFxuICAgICAgICAvLyBkZWxldGUgdGhlIGNvbnRlbnQgaW4gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgICAgICBjbG9uZUZyYWdtZW50KGV2ZW50LCBlZGl0b3IsICgpID0+IHtcbiAgICAgICAgICAgIC8vIElmIHVzZXIgY3V0cyBhIHZvaWQgYmxvY2sgbm9kZSBvciBhIHZvaWQgaW5saW5lIG5vZGUsXG4gICAgICAgICAgICAvLyBtYW51YWxseSByZW1vdmVzIGl0IHNpbmNlIHNlbGVjdGlvbiBpcyBjb2xsYXBzZWQgaW4gdGhpcyBjYXNlLlxuICAgICAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICAgICAgY29uc3QgeyBkb2N1bWVudCwgc2VsZWN0aW9uIH0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHsgZW5kLCBpc0NvbGxhcHNlZCB9ID0gc2VsZWN0aW9uO1xuICAgICAgICAgICAgbGV0IHZvaWRQYXRoO1xuXG4gICAgICAgICAgICBpZiAoaXNDb2xsYXBzZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtub2RlLCBwYXRoXSBvZiBkb2N1bWVudC5hbmNlc3RvcnMoZW5kLnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuaXNWb2lkKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b2lkUGF0aCA9IHBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZvaWRQYXRoKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnJlbW92ZU5vZGVCeUtleSh2b2lkUGF0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyYWcgZW5kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ0VuZChldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbkRyYWdFbmQnLCB7IGV2ZW50IH0pO1xuICAgICAgICBBZnRlclBsdWdpbi5pc0RyYWdnaW5nSW50ZXJuYWxseSA9IG51bGw7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBkcmFnIHN0YXJ0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uRHJhZ1N0YXJ0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uRHJhZ1N0YXJ0JywgeyBldmVudCB9KTtcblxuICAgICAgICBBZnRlclBsdWdpbi5pc0RyYWdnaW5nSW50ZXJuYWxseSA9IHRydWU7XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCB7IGRvY3VtZW50IH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgcGF0aCA9IGVkaXRvci5maW5kUGF0aChldmVudC50YXJnZXQpO1xuICAgICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQuZ2V0Tm9kZShwYXRoKTtcbiAgICAgICAgY29uc3QgYW5jZXN0b3JzID0gZG9jdW1lbnQuZ2V0QW5jZXN0b3JzKHBhdGgpO1xuICAgICAgICBjb25zdCBpc1ZvaWQgPVxuICAgICAgICAgICAgbm9kZSAmJlxuICAgICAgICAgICAgKGVkaXRvci5pc1ZvaWQobm9kZSkgfHwgYW5jZXN0b3JzLnNvbWUoYSA9PiBlZGl0b3IuaXNWb2lkKGEpKSk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbkluY2x1ZGVzTm9kZSA9IHZhbHVlLmJsb2Nrcy5zb21lKFxuICAgICAgICAgICAgYmxvY2sgPT4gYmxvY2sgPT09IG5vZGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBJZiBhIHZvaWQgYmxvY2sgaXMgZHJhZ2dlZCBhbmQgaXMgbm90IHNlbGVjdGVkLCBzZWxlY3QgaXQgKG5lY2Vzc2FyeSBmb3IgbG9jYWwgZHJhZ3MpLlxuICAgICAgICBpZiAoaXNWb2lkICYmICFzZWxlY3Rpb25JbmNsdWRlc05vZGUpIHtcbiAgICAgICAgICAgIGVkaXRvci5tb3ZlVG9SYW5nZU9mTm9kZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gZWRpdG9yLnZhbHVlLmZyYWdtZW50O1xuICAgICAgICBjb25zdCBlbmNvZGVkID0gQmFzZTY0LnNlcmlhbGl6ZU5vZGUoZnJhZ21lbnQpO1xuICAgICAgICBzZXRFdmVudFRyYW5zZmVyKGV2ZW50LCAnZnJhZ21lbnQnLCBlbmNvZGVkKTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGRyb3AuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25Ecm9wKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gZWRpdG9yO1xuICAgICAgICBjb25zdCB7IGRvY3VtZW50LCBzZWxlY3Rpb24gfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgbGV0IHRhcmdldCA9IGVkaXRvci5maW5kRXZlbnRSYW5nZShldmVudCk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1Zygnb25Ecm9wJywgeyBldmVudCB9KTtcblxuICAgICAgICBjb25zdCB0cmFuc2ZlciA9IGdldEV2ZW50VHJhbnNmZXIoZXZlbnQpO1xuICAgICAgICBjb25zdCB7IHR5cGUsIGZyYWdtZW50LCB0ZXh0IH0gPSB0cmFuc2ZlcjtcblxuICAgICAgICBlZGl0b3IuZm9jdXMoKTtcblxuICAgICAgICAvLyBJZiB0aGUgZHJhZyBpcyBpbnRlcm5hbCBhbmQgdGhlIHRhcmdldCBpcyBhZnRlciB0aGUgc2VsZWN0aW9uLCBpdFxuICAgICAgICAvLyBuZWVkcyB0byBhY2NvdW50IGZvciB0aGUgc2VsZWN0aW9uJ3MgY29udGVudCBiZWluZyBkZWxldGVkLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBBZnRlclBsdWdpbi5pc0RyYWdnaW5nSW50ZXJuYWxseSAmJlxuICAgICAgICAgICAgc2VsZWN0aW9uLmVuZC5vZmZzZXQgPCB0YXJnZXQuZW5kLm9mZnNldCAmJlxuICAgICAgICAgICAgc2VsZWN0aW9uLmVuZC5wYXRoLmVxdWFscyh0YXJnZXQuZW5kLnBhdGgpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0Lm1vdmVGb3J3YXJkKFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5zdGFydC5wYXRoLmVxdWFscyhzZWxlY3Rpb24uZW5kLnBhdGgpXG4gICAgICAgICAgICAgICAgICAgID8gMCAtIHNlbGVjdGlvbi5lbmQub2Zmc2V0ICsgc2VsZWN0aW9uLnN0YXJ0Lm9mZnNldFxuICAgICAgICAgICAgICAgICAgICA6IDAgLSBzZWxlY3Rpb24uZW5kLm9mZnNldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBZnRlclBsdWdpbi5pc0RyYWdnaW5nSW50ZXJuYWxseSkge1xuICAgICAgICAgICAgZWRpdG9yLmRlbGV0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZWRpdG9yLnNlbGVjdCh0YXJnZXQpO1xuXG4gICAgICAgIGlmICh0eXBlID09PSAndGV4dCcgfHwgdHlwZSA9PT0gJ2h0bWwnKSB7XG4gICAgICAgICAgICBjb25zdCB7IGFuY2hvciB9ID0gdGFyZ2V0O1xuICAgICAgICAgICAgbGV0IGhhc1ZvaWRQYXJlbnQgPSBkb2N1bWVudC5oYXNWb2lkUGFyZW50KGFuY2hvci5wYXRoLCBlZGl0b3IpO1xuXG4gICAgICAgICAgICBpZiAoaGFzVm9pZFBhcmVudCkge1xuICAgICAgICAgICAgICAgIGxldCBwID0gYW5jaG9yLnBhdGg7XG4gICAgICAgICAgICAgICAgbGV0IG4gPSBkb2N1bWVudC5nZXROb2RlKGFuY2hvci5wYXRoKTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChoYXNWb2lkUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtueHRdID0gZG9jdW1lbnQudGV4dHMoeyBwYXRoOiBwIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghbnh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIFtuLCBwXSA9IG54dDtcbiAgICAgICAgICAgICAgICAgICAgaGFzVm9pZFBhcmVudCA9IGRvY3VtZW50Lmhhc1ZvaWRQYXJlbnQocCwgZWRpdG9yKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobikgZWRpdG9yLm1vdmVUb1N0YXJ0T2ZOb2RlKG4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgIHRleHQuc3BsaXQoJ1xcbicpLmZvckVhY2goKGxpbmUsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAwKSBlZGl0b3Iuc3BsaXRCbG9jaygpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChsaW5lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSAnZnJhZ21lbnQnKSB7XG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0RnJhZ21lbnQoZnJhZ21lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBSZWFjdCdzIG9uU2VsZWN0IGV2ZW50IGJyZWFrcyBhZnRlciBhbiBvbkRyb3AgZXZlbnRcbiAgICAgICAgLy8gaGFzIGZpcmVkIGluIGEgbm9kZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy8xMTM3OS5cbiAgICAgICAgLy8gVW50aWwgdGhpcyBpcyBmaXhlZCBpbiBSZWFjdCwgd2UgZGlzcGF0Y2ggYSBtb3VzZXVwIGV2ZW50IG9uIHRoYXRcbiAgICAgICAgLy8gRE9NIG5vZGUsIHNpbmNlIHRoYXQgd2lsbCBtYWtlIGl0IGdvIGJhY2sgdG8gbm9ybWFsLlxuICAgICAgICBjb25zdCBlbCA9IGVkaXRvci5maW5kRE9NTm9kZSh0YXJnZXQuZm9jdXMucGF0aCk7XG5cbiAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICBlbC5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgICAgICAgIG5ldyBNb3VzZUV2ZW50KCdtb3VzZXVwJywge1xuICAgICAgICAgICAgICAgICAgICB2aWV3OiB3aW5kb3csXG4gICAgICAgICAgICAgICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBmb2N1cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbkZvY3VzKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uRm9jdXMnLCB7IGV2ZW50IH0pO1xuXG4gICAgICAgIC8vIENPTVBBVDogSWYgdGhlIGZvY3VzIGV2ZW50IGlzIGEgbW91c2UtYmFzZWQgb25lLCBpdCB3aWxsIGJlIHNob3J0bHlcbiAgICAgICAgLy8gZm9sbG93ZWQgYnkgYSBgc2VsZWN0aW9uY2hhbmdlYCwgc28gd2UgbmVlZCB0byBkZXNlbGVjdCBoZXJlIHRvIHByZXZlbnRcbiAgICAgICAgLy8gdGhlIG9sZCBzZWxlY3Rpb24gZnJvbSBiZWluZyBzZXQgYnkgdGhlIGB1cGRhdGVTZWxlY3Rpb25gIG9mIGA8Q29udGVudD5gLFxuICAgICAgICAvLyBwcmV2ZW50aW5nIHRoZSBgc2VsZWN0aW9uY2hhbmdlYCBmcm9tIGZpcmluZy4gKDIwMTgvMTEvMDcpXG4gICAgICAgIGlmIChBZnRlclBsdWdpbi5pc01vdXNlRG93biAmJiAhSVNfSUUgJiYgIUlTX0VER0UpIHtcbiAgICAgICAgICAgIGVkaXRvci5kZXNlbGVjdCgpLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGl0b3IuZm9jdXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBpbnB1dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvbklucHV0KGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uSW5wdXQnKTtcblxuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgY29uc3QgZG9tU2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IuZmluZFNlbGVjdGlvbihkb21TZWxlY3Rpb24pO1xuXG4gICAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGVkaXRvci5zZWxlY3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkaXRvci5ibHVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGFuY2hvck5vZGUgfSA9IGRvbVNlbGVjdGlvbjtcbiAgICAgICAgZWRpdG9yLnJlY29uY2lsZURPTU5vZGUoYW5jaG9yTm9kZSk7XG5cbiAgICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGtleSBkb3duLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uS2V5RG93bihldmVudCwgZWRpdG9yLCBuZXh0KSB7XG4gICAgICAgIGRlYnVnKCdvbktleURvd24nLCB7IGV2ZW50IH0pO1xuXG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IGVkaXRvcjtcbiAgICAgICAgY29uc3QgeyBkb2N1bWVudCwgc2VsZWN0aW9uIH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgeyBzdGFydCB9ID0gc2VsZWN0aW9uO1xuICAgICAgICBjb25zdCBoYXNWb2lkUGFyZW50ID0gZG9jdW1lbnQuaGFzVm9pZFBhcmVudChzdGFydC5wYXRoLCBlZGl0b3IpO1xuXG4gICAgICAgIC8vIENPTVBBVDogSW4gaU9TLCBzb21lIG9mIHRoZXNlIGhvdGtleXMgYXJlIGhhbmRsZWQgaW4gdGhlXG4gICAgICAgIC8vIGBvbk5hdGl2ZUJlZm9yZUlucHV0YCBoYW5kbGVyIG9mIHRoZSBgPENvbnRlbnQ+YCBjb21wb25lbnQgaW4gb3JkZXIgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgbmF0aXZlIGF1dG9jb3JyZWN0IGJlaGF2aW9yLCBzbyB0aGV5IHNob3VsZG4ndCBiZSBoYW5kbGVkIGhlcmUuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzU3BsaXRCbG9jayhldmVudCkgJiYgIUlTX0lPUykge1xuICAgICAgICAgICAgcmV0dXJuIGhhc1ZvaWRQYXJlbnRcbiAgICAgICAgICAgICAgICA/IGVkaXRvci5tb3ZlVG9TdGFydE9mTmV4dFRleHQoKVxuICAgICAgICAgICAgICAgIDogZWRpdG9yLnNwbGl0QmxvY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzRGVsZXRlQmFja3dhcmQoZXZlbnQpICYmICFJU19JT1MpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IuZGVsZXRlQ2hhckJhY2t3YXJkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0RlbGV0ZUZvcndhcmQoZXZlbnQpICYmICFJU19JT1MpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IuZGVsZXRlQ2hhckZvcndhcmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzRGVsZXRlTGluZUJhY2t3YXJkKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5kZWxldGVMaW5lQmFja3dhcmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzRGVsZXRlTGluZUZvcndhcmQoZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLmRlbGV0ZUxpbmVGb3J3YXJkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0RlbGV0ZVdvcmRCYWNrd2FyZChldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IuZGVsZXRlV29yZEJhY2t3YXJkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0RlbGV0ZVdvcmRGb3J3YXJkKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5kZWxldGVXb3JkRm9yd2FyZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEhvdGtleXMuaXNSZWRvKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5yZWRvKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc1VuZG8oZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLnVuZG8oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENPTVBBVDogQ2VydGFpbiBicm93c2VycyBkb24ndCBoYW5kbGUgdGhlIHNlbGVjdGlvbiB1cGRhdGVzIHByb3Blcmx5LiBJblxuICAgICAgICAvLyBDaHJvbWUsIHRoZSBzZWxlY3Rpb24gaXNuJ3QgcHJvcGVybHkgZXh0ZW5kZWQuIEFuZCBpbiBGaXJlZm94LCB0aGVcbiAgICAgICAgLy8gc2VsZWN0aW9uIGlzbid0IHByb3Blcmx5IGNvbGxhcHNlZC4gKDIwMTcvMTAvMTcpXG4gICAgICAgIGlmIChIb3RrZXlzLmlzTW92ZUxpbmVCYWNrd2FyZChldmVudCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm1vdmVUb1N0YXJ0T2ZCbG9jaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEhvdGtleXMuaXNNb3ZlTGluZUZvcndhcmQoZXZlbnQpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5tb3ZlVG9FbmRPZkJsb2NrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0V4dGVuZExpbmVCYWNrd2FyZChldmVudCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm1vdmVGb2N1c1RvU3RhcnRPZkJsb2NrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0V4dGVuZExpbmVGb3J3YXJkKGV2ZW50KSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZUZvY3VzVG9FbmRPZkJsb2NrKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IElmIGEgdm9pZCBub2RlIGlzIHNlbGVjdGVkLCBvciBhIHplcm8td2lkdGggdGV4dCBub2RlIGFkamFjZW50IHRvXG4gICAgICAgIC8vIGFuIGlubGluZSBpcyBzZWxlY3RlZCwgd2UgbmVlZCB0byBoYW5kbGUgdGhlc2UgaG90a2V5cyBtYW51YWxseSBiZWNhdXNlXG4gICAgICAgIC8vIGJyb3dzZXJzIHdvbid0IGtub3cgd2hhdCB0byBkby5cbiAgICAgICAgaWYgKEhvdGtleXMuaXNNb3ZlQmFja3dhcmQoZXZlbnQpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZVRvU3RhcnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5tb3ZlQmFja3dhcmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzTW92ZUZvcndhcmQoZXZlbnQpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZVRvRW5kKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZUZvcndhcmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzTW92ZVdvcmRCYWNrd2FyZChldmVudCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm1vdmVXb3JkQmFja3dhcmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzTW92ZVdvcmRGb3J3YXJkKGV2ZW50KSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZVdvcmRGb3J3YXJkKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSG90a2V5cy5pc0V4dGVuZEJhY2t3YXJkKGV2ZW50KSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRUZXh0ID0gZG9jdW1lbnQuZ2V0Tm9kZShzdGFydC5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IFtwcmV2RW50cnldID0gZG9jdW1lbnQudGV4dHMoe1xuICAgICAgICAgICAgICAgIHBhdGg6IHN0YXJ0LnBhdGgsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAnYmFja3dhcmQnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IGlzUHJldkluVm9pZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocHJldkVudHJ5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgWywgcHJldlBhdGhdID0gcHJldkVudHJ5O1xuICAgICAgICAgICAgICAgIGlzUHJldkluVm9pZCA9IGRvY3VtZW50Lmhhc1ZvaWRQYXJlbnQocHJldlBhdGgsIGVkaXRvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWb2lkUGFyZW50IHx8IGlzUHJldkluVm9pZCB8fCBzdGFydFRleHQudGV4dCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3IubW92ZUZvY3VzQmFja3dhcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIb3RrZXlzLmlzRXh0ZW5kRm9yd2FyZChldmVudCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGV4dCA9IGRvY3VtZW50LmdldE5vZGUoc3RhcnQucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBbbmV4dEVudHJ5XSA9IGRvY3VtZW50LnRleHRzKHsgcGF0aDogc3RhcnQucGF0aCB9KTtcbiAgICAgICAgICAgIGxldCBpc05leHRJblZvaWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKG5leHRFbnRyeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFssIG5leHRQYXRoXSA9IG5leHRFbnRyeTtcbiAgICAgICAgICAgICAgICBpc05leHRJblZvaWQgPSBkb2N1bWVudC5oYXNWb2lkUGFyZW50KG5leHRQYXRoLCBlZGl0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaGFzVm9pZFBhcmVudCB8fCBpc05leHRJblZvaWQgfHwgc3RhcnRUZXh0LnRleHQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yLm1vdmVGb2N1c0ZvcndhcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBUQUIpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLmluc2VydFRleHQoVEFCX1NQQUNFKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBtb3VzZSBkb3duLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKiBAcGFyYW0ge0VkaXRvcn0gZWRpdG9yXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICAgICAqL1xuXG4gICAgc3RhdGljIG9uTW91c2VEb3duKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uTW91c2VEb3duJywgeyBldmVudCB9KTtcbiAgICAgICAgQWZ0ZXJQbHVnaW4uaXNNb3VzZURvd24gPSB0cnVlO1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT24gbW91c2UgdXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25Nb3VzZVVwKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uTW91c2VVcCcsIHsgZXZlbnQgfSk7XG4gICAgICAgIEFmdGVyUGx1Z2luLmlzTW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBwYXN0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAgICogQHBhcmFtIHtFZGl0b3J9IGVkaXRvclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAgICAgKi9cblxuICAgIHN0YXRpYyBvblBhc3RlKGV2ZW50LCBlZGl0b3IsIG5leHQpIHtcbiAgICAgICAgZGVidWcoJ29uUGFzdGUnLCB7IGV2ZW50IH0pO1xuXG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IGVkaXRvcjtcbiAgICAgICAgY29uc3QgdHJhbnNmZXIgPSBnZXRFdmVudFRyYW5zZmVyKGV2ZW50KTtcbiAgICAgICAgY29uc3QgeyB0eXBlLCBmcmFnbWVudCwgdGV4dCB9ID0gdHJhbnNmZXI7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdmcmFnbWVudCcpIHtcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnRGcmFnbWVudChmcmFnbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gJ3RleHQnIHx8IHR5cGUgPT09ICdodG1sJykge1xuICAgICAgICAgICAgaWYgKCF0ZXh0KSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgY29uc3QgeyBkb2N1bWVudCwgc2VsZWN0aW9uLCBzdGFydEJsb2NrIH0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuaXNWb2lkKHN0YXJ0QmxvY2spKSByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgICAgICBjb25zdCBkZWZhdWx0QmxvY2sgPSBzdGFydEJsb2NrO1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdE1hcmtzID0gZG9jdW1lbnQuZ2V0SW5zZXJ0TWFya3NBdFJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgICAgICBjb25zdCBmcmFnID0gUGxhaW4uZGVzZXJpYWxpemUodGV4dCwgeyBkZWZhdWx0QmxvY2ssIGRlZmF1bHRNYXJrcyB9KVxuICAgICAgICAgICAgICAgIC5kb2N1bWVudDtcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnRGcmFnbWVudChmcmFnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbiBzZWxlY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqIEBwYXJhbSB7RWRpdG9yfSBlZGl0b3JcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAgICovXG5cbiAgICBzdGF0aWMgb25TZWxlY3QoZXZlbnQsIGVkaXRvciwgbmV4dCkge1xuICAgICAgICBkZWJ1Zygnb25TZWxlY3QnLCB7IGV2ZW50IH0pO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgY29uc3QgZG9tU2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICAvLyBzbGF0ZS1uZXh0IGZpeCBzZWxlY3QgdGhlIHJhbmdlIGludGVycnVwdGVkXG4gICAgICAgIGlmIChkb21TZWxlY3Rpb24ucmFuZ2VDb3VudCkge1xuICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZmluZFJhbmdlKGRvbVNlbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAocmFuZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IuZmluZFNlbGVjdGlvbihkb21TZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZWxlY3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkaXRvci5ibHVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IHJlc2V0IHRoZSBgQWZ0ZXJQbHVnaW4uaXNNb3VzZURvd25gIHN0YXRlIGhlcmUgaW4gY2FzZSBhIGBtb3VzZXVwYCBldmVudFxuICAgICAgICAvLyBoYXBwZW5zIG91dHNpZGUgdGhlIGVkaXRvci4gVGhpcyBpcyBuZWVkZWQgZm9yIGBvbkZvY3VzYCBoYW5kbGluZy5cbiAgICAgICAgQWZ0ZXJQbHVnaW4uaXNNb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBFeHBvcnQuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG5cbmV4cG9ydCBkZWZhdWx0IEFmdGVyUGx1Z2luO1xuIl19