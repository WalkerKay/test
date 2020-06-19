import { Component, Input, ElementRef, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import Debug from 'debug';
import { Value } from 'slate';
import { fromEvent, Subject, interval } from 'rxjs';
import { takeUntil, throttle } from 'rxjs/operators';
import getWindow from 'get-window';
import Hotkeys from 'slate-hotkeys';
import warning from 'tiny-warning';
import { IS_ANDROID, IS_FIREFOX } from 'slate-dev-environment';
import SELECTORS from '../../constants/selectors';
import scrollToSelection from '../../utils/scroll-to-selection';
import BeforeInputEventPlugin from '../../plugins/custom-event/BeforeInputEventPlugin';
import { SlaNodeComponent } from '../node/node.component';
import { SlaEventService } from '../../core/event-service';
var FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;
//#region
var SPACEBAR_CODE = 32;
var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
//#endregion
var debug = Debug('slate:content');
debug.update = Debug('slate:update');
debug.render = Debug('slate:content-render');
debug.track = Debug('slate:track');
var SlaContentComponent = /** @class */ (function () {
    function SlaContentComponent(ngZone, elementRef, cdr, slaEventService) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        this.cdr = cdr;
        this.slaEventService = slaEventService;
        this.$destroy = new Subject();
        this.hasSpaceKeypress = false;
        this.isComposing = false;
        this.isUpdateSelection = false;
        this.readOnly = false;
        this.tmp = {
            isUpdatingSelection: false,
            contentKey: 0
        };
    }
    Object.defineProperty(SlaContentComponent.prototype, "slaValue", {
        set: function (value) {
            this.isUpdateSelection = true;
            debug.render('set: slateValue');
            this.editorData = value;
        },
        enumerable: true,
        configurable: true
    });
    SlaContentComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.rootNode = this.elementRef.nativeElement;
        this.document = this.editor.value.document;
        this.selection = this.editor.value.selection;
        this.ngZone.runOutsideAngular(function () {
            _this.slaEventService.fromSlaEvents(_this.rootNode, _this.$destroy).subscribe(function (_a) {
                var event = _a.event, eventEntity = _a.eventEntity;
                var target = event.target;
                if (target && target.closest) {
                    var isSkip = target.closest(SELECTORS.SKIP_EVENT);
                    if (isSkip) {
                        return;
                    }
                }
                if (eventEntity.isTriggerBeforeInput) {
                    var beforeInputEvent = BeforeInputEventPlugin.extractEvents(event.type, null, event, event.target);
                    if (beforeInputEvent) {
                        _this.onEventHandle('onBeforeInput', beforeInputEvent);
                    }
                }
                if (eventEntity.handler) {
                    _this.onEventHandle(eventEntity.handler, event);
                }
            });
            fromEvent(window.document, 'selectionchange')
                .pipe(throttle(function (value) {
                return interval(100);
            }, { trailing: true, leading: true }), takeUntil(_this.$destroy))
                .subscribe(function (event) {
                _this.onNativeSelectionChange(event);
            });
            // if (HAS_INPUT_EVENTS_LEVEL_2) {
            //     fromEvent(this.rootNode, 'beforeinput')
            //         .pipe(takeUntil(this.$destroy))
            //         .subscribe(event => {
            //             this.onEventHandle('onBeforeInput', event);
            //         });
            // }
        });
    };
    SlaContentComponent.prototype.onEventHandle = function (handler, event) {
        debug('slaEvent', handler);
        var nativeEvent = event.nativeEvent || event;
        var isUndoRedo = event.type === 'keydown' && (Hotkeys.isUndo(nativeEvent) || Hotkeys.isRedo(nativeEvent));
        // Ignore `onBlur`, `onFocus` and `onSelect` events generated
        // programmatically while updating selection.
        if ((this.tmp.isUpdatingSelection || isUndoRedo) && (handler === 'onSelect' || handler === 'onBlur' || handler === 'onFocus')) {
            return;
        }
        // COMPAT: There are situations where a select event will fire with a new
        // native selection that resolves to the same internal position. In those
        // cases we don't need to trigger any changes, since our internal model is
        // already up to date, but we do want to update the native selection again
        // to make sure it is in sync. (2017/10/16)
        //
        // ANDROID: The updateSelection causes issues in Android when you are
        // at the end of a block. The selection ends up to the left of the inserted
        // character instead of to the right. This behavior continues even if
        // you enter more than one character. (2019/01/03)
        if (!IS_ANDROID && handler === 'onSelect') {
            // const { editor } = this.props;
            var value = this.editor.value;
            var selection = value.selection;
            var window_1 = getWindow(event.target);
            var domSelection = window_1.getSelection();
            var range = this.editor.findRange(domSelection);
            if (range && range.equals(selection.toRange())) {
                this.updateSelection();
                return;
            }
        }
        // Don't handle drag and drop events coming from embedded editors.
        if (handler === 'onDragEnd' ||
            handler === 'onDragEnter' ||
            handler === 'onDragExit' ||
            handler === 'onDragLeave' ||
            handler === 'onDragOver' ||
            handler === 'onDragStart' ||
            handler === 'onDrop') {
            var closest = event.target.closest(SELECTORS.EDITOR);
            if (closest !== this.rootNode) {
                return;
            }
        }
        // Some events require being in editable in the editor, so if the event
        // target isn't, ignore them.
        if (handler === 'onBeforeInput' ||
            handler === 'onBlur' ||
            handler === 'onCompositionEnd' ||
            handler === 'onCompositionStart' ||
            handler === 'onCopy' ||
            handler === 'onCut' ||
            handler === 'onFocus' ||
            handler === 'onInput' ||
            handler === 'onKeyDown' ||
            handler === 'onKeyUp' ||
            handler === 'onPaste' ||
            handler === 'onSelect') {
            var target = event.target ? event.target : event.nativeEvent.target;
            if (!this.isInEditor(target)) {
                return;
            }
        }
        this.slaEvent(handler, event);
    };
    SlaContentComponent.prototype.onNativeSelectionChange = function (event) {
        if (this.readOnly) {
            return;
        }
        var window = getWindow(event.target);
        var activeElement = window.document.activeElement;
        debug.update('onNativeSelectionChange', {
            anchorOffset: window.getSelection().anchorOffset
        });
        if (activeElement !== this.rootNode) {
            return;
        }
        this.slaEvent('onSelect', event);
    };
    SlaContentComponent.prototype.ngOnDestroy = function () {
        this.$destroy.next();
        this.$destroy.complete();
    };
    /**
     * Update the native DOM selection to reflect the internal model.
     */
    SlaContentComponent.prototype.updateSelection = function () {
        var _this = this;
        var value = this.editor.value;
        var selection = value.selection;
        var isBackward = selection.isBackward;
        var window = getWindow(this.rootNode);
        var native = window.getSelection();
        var activeElement = window.document.activeElement;
        if (debug.update.enabled) {
            debug.update('updateSelection', { selection: selection.toJSON() });
        }
        // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
        if (!native) {
            return;
        }
        var rangeCount = native.rangeCount, anchorNode = native.anchorNode;
        var updated = false;
        // If the Slate selection is blurred, but the DOM's active element is still
        // the editor, we need to blur it.
        if (selection.isBlurred && activeElement === this.rootNode) {
            this.rootNode.blur();
            updated = true;
        }
        // If the Slate selection is unset, but the DOM selection has a range
        // selected in the editor, we need to remove the range.
        if (selection.isUnset && rangeCount && this.isInEditor(anchorNode)) {
            // removeAllRanges(native);
            updated = true;
        }
        // If the Slate selection is focused, but the DOM's active element is not
        // the editor, we need to focus it. We prevent scrolling because we handle
        // scrolling to the correct selection.
        if (selection.isFocused && activeElement !== this.rootNode) {
            this.rootNode.focus({ preventScroll: true });
            updated = true;
        }
        // Otherwise, figure out which DOM nodes should be selected...
        if (selection.isFocused && selection.isSet) {
            var current = !!native.rangeCount && native.getRangeAt(0);
            var range = this.editor.findDOMRange(selection);
            if (!range) {
                warning(false, 'Unable to find a native DOM range from the current selection.');
                return;
            }
            var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;
            // If the new range matches the current selection, there is nothing to fix.
            // COMPAT: The native `Range` object always has it's "start" first and "end"
            // last in the DOM. It has no concept of "backwards/forwards", so we have
            // to check both orientations here. (2017/10/31)
            if (current) {
                if ((startContainer === current.startContainer &&
                    startOffset === current.startOffset &&
                    endContainer === current.endContainer &&
                    endOffset === current.endOffset) ||
                    (startContainer === current.endContainer &&
                        startOffset === current.endOffset &&
                        endContainer === current.startContainer &&
                        endOffset === current.startOffset)) {
                    return;
                }
            }
            // Otherwise, set the `isUpdatingSelection` flag and update the selection.
            updated = true;
            this.tmp.isUpdatingSelection = true;
            // removeAllRanges(native);
            // COMPAT: IE 11 does not support `setBaseAndExtent`. (2018/11/07)
            if (native.setBaseAndExtent) {
                // COMPAT: Since the DOM range has no concept of backwards/forwards
                // we need to check and do the right thing here.
                if (isBackward) {
                    native.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);
                }
                else {
                    native.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
                }
            }
            else {
                native.addRange(range);
            }
            debug.track('track end : updateSelection');
            // Scroll to the selection, in case it's out of view.
            scrollToSelection(native);
            // // Then unset the `isUpdatingSelection` flag after a delay.
            setTimeout(function () {
                // COMPAT: In Firefox, it's not enough to create a range, you also need
                // to focus the contenteditable element too. (2016/11/16)
                if (IS_FIREFOX && _this.rootNode) {
                    _this.rootNode.focus();
                }
                _this.tmp.isUpdatingSelection = false;
                debug.update('updateSelection:setTimeout', {
                    anchorOffset: window.getSelection().anchorOffset
                });
            });
            if (updated && (debug.enabled || debug.update.enabled)) {
                debug('updateSelection', { selection: selection, native: native, activeElement: activeElement });
                debug.update('updateSelection:applied', {
                    selection: selection.toJSON(),
                    native: {
                        anchorOffset: native.anchorOffset,
                        focusOffset: native.focusOffset
                    }
                });
            }
        }
    };
    SlaContentComponent.prototype.isInEditor = function (target) {
        var el;
        try {
            // COMPAT: Text nodes don't have `isContentEditable` property. So, when
            // `target` is a text node use its parent node for check.
            el = target.nodeType === 3 ? target.parentNode : target;
        }
        catch (err) {
            // COMPAT: In Firefox, `target.nodeType` will throw an error if target is
            // originating from an internal "restricted" element (e.g. a stepper
            // arrow on a number input)
            // see github.com/ianstormtaylor/slate/issues/1819
            if (IS_FIREFOX && FIREFOX_NODE_TYPE_ACCESS_ERROR.test(err.message)) {
                return false;
            }
            throw err;
        }
        return el.isContentEditable && (el === this.rootNode || el.closest(SELECTORS.EDITOR) === this.rootNode);
    };
    SlaContentComponent.prototype.ngAfterViewChecked = function () {
        var _this = this;
        if (this.isUpdateSelection) {
            this.isUpdateSelection = false;
            this.ngZone.runOutsideAngular(function () {
                _this.updateSelection();
            });
        }
    };
    SlaContentComponent.decorators = [
        { type: Component, args: [{
                    selector: 'sla-content,[slaContent]',
                    template: "<sla-node\n    [editor]=\"editor\"\n    [node]=\"editorData.document\"\n    [selection]=\"editorData.selection\"\n    [readOnly]=\"readOnly\"\n></sla-node>\n",
                    changeDetection: ChangeDetectionStrategy.OnPush
                }] }
    ];
    /** @nocollapse */
    SlaContentComponent.ctorParameters = function () { return [
        { type: NgZone },
        { type: ElementRef },
        { type: ChangeDetectorRef },
        { type: SlaEventService }
    ]; };
    SlaContentComponent.propDecorators = {
        nodeRef: [{ type: ViewChild, args: [SlaNodeComponent, { static: true },] }],
        readOnly: [{ type: Input }],
        slaValue: [{ type: Input }],
        editor: [{ type: Input }],
        slaEvent: [{ type: Input }]
    };
    return SlaContentComponent;
}());
export { SlaContentComponent };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL2NvbnRlbnQvY29udGVudC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFDVCxLQUFLLEVBSUwsVUFBVSxFQUNWLE1BQU0sRUFNTix1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDWixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUF1QixLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFbkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFTLE1BQU0sTUFBTSxDQUFDO0FBQzNELE9BQU8sRUFBc0IsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3pFLE9BQU8sU0FBUyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLE9BQU8sTUFBTSxlQUFlLENBQUM7QUFDcEMsT0FBTyxPQUFPLE1BQU0sY0FBYyxDQUFDO0FBRW5DLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUE0QixNQUFNLHVCQUF1QixDQUFDO0FBQ3pGLE9BQU8sU0FBUyxNQUFNLDJCQUEyQixDQUFDO0FBRWxELE9BQU8saUJBQWlCLE1BQU0saUNBQWlDLENBQUM7QUFDaEUsT0FBTyxzQkFBc0IsTUFBTSxtREFBbUQsQ0FBQztBQUN2RixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFM0QsSUFBTSw4QkFBOEIsR0FBRyxpREFBaUQsQ0FBQztBQUN6RixTQUFTO0FBQ1QsSUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxZQUFZ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QixDQUFDO2dCQUMxQixLQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7U0FDTjtJQUNMLENBQUM7O2dCQTNXSixTQUFTLFNBQUM7b0JBQ1AsUUFBUSxFQUFFLDBCQUEwQjtvQkFDcEMseUtBQXVDO29CQUN2QyxlQUFlLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtpQkFDbEQ7Ozs7Z0JBN0NHLE1BQU07Z0JBRE4sVUFBVTtnQkFRVixpQkFBaUI7Z0JBa0JaLGVBQWU7OzswQkFzQm5CLFNBQVMsU0FBQyxnQkFBZ0IsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7MkJBbUI1QyxLQUFLOzJCQUdMLEtBQUs7eUJBT0wsS0FBSzsyQkFHTCxLQUFLOztJQXNVViwwQkFBQztDQUFBLEFBNVdELElBNFdDO1NBdldZLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQ29tcG9uZW50LFxuICAgIElucHV0LFxuICAgIE9uSW5pdCxcbiAgICBIb3N0QmluZGluZyxcbiAgICBIb3N0TGlzdGVuZXIsXG4gICAgRWxlbWVudFJlZixcbiAgICBOZ1pvbmUsXG4gICAgT25EZXN0cm95LFxuICAgIE9uQ2hhbmdlcyxcbiAgICBBZnRlclZpZXdDaGVja2VkLFxuICAgIEFmdGVyQ29udGVudENoZWNrZWQsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBWaWV3Q2hpbGRcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgRGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHsgRG9jdW1lbnQsIFNlbGVjdGlvbiwgVmFsdWUgfSBmcm9tICdzbGF0ZSc7XG5pbXBvcnQgeyBMaXN0IH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCB7IGZyb21FdmVudCwgU3ViamVjdCwgaW50ZXJ2YWwsIHRpbWVyIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUsIHRha2UsIHRha2VVbnRpbCwgdGhyb3R0bGUgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgZ2V0V2luZG93IGZyb20gJ2dldC13aW5kb3cnO1xuaW1wb3J0IEhvdGtleXMgZnJvbSAnc2xhdGUtaG90a2V5cyc7XG5pbXBvcnQgd2FybmluZyBmcm9tICd0aW55LXdhcm5pbmcnO1xuXG5pbXBvcnQgeyBJU19BTkRST0lELCBJU19GSVJFRk9YLCBIQVNfSU5QVVRfRVZFTlRTX0xFVkVMXzIgfSBmcm9tICdzbGF0ZS1kZXYtZW52aXJvbm1lbnQnO1xuaW1wb3J0IFNFTEVDVE9SUyBmcm9tICcuLi8uLi9jb25zdGFudHMvc2VsZWN0b3JzJztcbmltcG9ydCByZW1vdmVBbGxSYW5nZXMgZnJvbSAnLi4vLi4vdXRpbHMvcmVtb3ZlLWFsbC1yYW5nZXMnO1xuaW1wb3J0IHNjcm9sbFRvU2VsZWN0aW9uIGZyb20gJy4uLy4uL3V0aWxzL3Njcm9sbC10by1zZWxlY3Rpb24nO1xuaW1wb3J0IEJlZm9yZUlucHV0RXZlbnRQbHVnaW4gZnJvbSAnLi4vLi4vcGx1Z2lucy9jdXN0b20tZXZlbnQvQmVmb3JlSW5wdXRFdmVudFBsdWdpbic7XG5pbXBvcnQgeyBTbGFOb2RlQ29tcG9uZW50IH0gZnJvbSAnLi4vbm9kZS9ub2RlLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBTbGFFdmVudFNlcnZpY2UgfSBmcm9tICcuLi8uLi9jb3JlL2V2ZW50LXNlcnZpY2UnO1xuXG5jb25zdCBGSVJFRk9YX05PREVfVFlQRV9BQ0NFU1NfRVJST1IgPSAvUGVybWlzc2lvbiBkZW5pZWQgdG8gYWNjZXNzIHByb3BlcnR5IFwibm9kZVR5cGVcIi87XG4vLyNyZWdpb25cbmNvbnN0IFNQQUNFQkFSX0NPREUgPSAzMjtcbmNvbnN0IFNQQUNFQkFSX0NIQVIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFNQQUNFQkFSX0NPREUpO1xuLy8jZW5kcmVnaW9uXG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ3NsYXRlOmNvbnRlbnQnKTtcblxuZGVidWcudXBkYXRlID0gRGVidWcoJ3NsYXRlOnVwZGF0ZScpO1xuXG5kZWJ1Zy5yZW5kZXIgPSBEZWJ1Zygnc2xhdGU6Y29udGVudC1yZW5kZXInKTtcblxuZGVidWcudHJhY2sgPSBEZWJ1Zygnc2xhdGU6dHJhY2snKTtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdzbGEtY29udGVudCxbc2xhQ29udGVudF0nLFxuICAgIHRlbXBsYXRlVXJsOiAnLi9jb250ZW50LmNvbXBvbmVudC5odG1sJyxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBTbGFDb250ZW50Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIEFmdGVyVmlld0NoZWNrZWQge1xuICAgIEBWaWV3Q2hpbGQoU2xhTm9kZUNvbXBvbmVudCwgeyBzdGF0aWM6IHRydWUgfSlcbiAgICBub2RlUmVmOiBTbGFOb2RlQ29tcG9uZW50O1xuXG4gICAgJGRlc3Ryb3k6IFN1YmplY3Q8YW55PiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgICByb290Tm9kZTogSFRNTEVsZW1lbnQ7XG5cbiAgICBoYXNTcGFjZUtleXByZXNzID0gZmFsc2U7XG5cbiAgICBpc0NvbXBvc2luZyA9IGZhbHNlO1xuXG4gICAgaXNVcGRhdGVTZWxlY3Rpb24gPSBmYWxzZTtcblxuICAgIGRvY3VtZW50OiBEb2N1bWVudDtcblxuICAgIHNlbGVjdGlvbjogU2VsZWN0aW9uO1xuXG4gICAgZWRpdG9yRGF0YTogVmFsdWU7XG5cbiAgICBASW5wdXQoKVxuICAgIHJlYWRPbmx5ID0gZmFsc2U7XG5cbiAgICBASW5wdXQoKVxuICAgIHNldCBzbGFWYWx1ZSh2YWx1ZTogVmFsdWUpIHtcbiAgICAgICAgdGhpcy5pc1VwZGF0ZVNlbGVjdGlvbiA9IHRydWU7XG4gICAgICAgIGRlYnVnLnJlbmRlcignc2V0OiBzbGF0ZVZhbHVlJyk7XG4gICAgICAgIHRoaXMuZWRpdG9yRGF0YSA9IHZhbHVlO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgZWRpdG9yOiBhbnk7XG5cbiAgICBASW5wdXQoKVxuICAgIHNsYUV2ZW50OiAoaGFuZGxlOiBzdHJpbmcsIGV2ZW50OiBhbnkpID0+IHt9O1xuXG4gICAgdG1wID0ge1xuICAgICAgICBpc1VwZGF0aW5nU2VsZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgY29udGVudEtleTogMFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHVibGljIG5nWm9uZTogTmdab25lLFxuICAgICAgICBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgICAgIHByaXZhdGUgY2RyOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgICAgcHJpdmF0ZSBzbGFFdmVudFNlcnZpY2U6IFNsYUV2ZW50U2VydmljZVxuICAgICkge31cblxuICAgIG5nT25Jbml0KCkge1xuICAgICAgICB0aGlzLnJvb3ROb2RlID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIHRoaXMuZG9jdW1lbnQgPSB0aGlzLmVkaXRvci52YWx1ZS5kb2N1bWVudDtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSB0aGlzLmVkaXRvci52YWx1ZS5zZWxlY3Rpb247XG4gICAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2xhRXZlbnRTZXJ2aWNlLmZyb21TbGFFdmVudHModGhpcy5yb290Tm9kZSwgdGhpcy4kZGVzdHJveSkuc3Vic2NyaWJlKCh7IGV2ZW50LCBldmVudEVudGl0eSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0OiBhbnkgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuY2xvc2VzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1NraXAgPSB0YXJnZXQuY2xvc2VzdChTRUxFQ1RPUlMuU0tJUF9FVkVOVCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1NraXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRFbnRpdHkuaXNUcmlnZ2VyQmVmb3JlSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlSW5wdXRFdmVudCA9IEJlZm9yZUlucHV0RXZlbnRQbHVnaW4uZXh0cmFjdEV2ZW50cyhldmVudC50eXBlLCBudWxsLCBldmVudCwgZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJlZm9yZUlucHV0RXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FdmVudEhhbmRsZSgnb25CZWZvcmVJbnB1dCcsIGJlZm9yZUlucHV0RXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChldmVudEVudGl0eS5oYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25FdmVudEhhbmRsZShldmVudEVudGl0eS5oYW5kbGVyLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmcm9tRXZlbnQod2luZG93LmRvY3VtZW50LCAnc2VsZWN0aW9uY2hhbmdlJylcbiAgICAgICAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgICAgICAgdGhyb3R0bGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAodmFsdWU6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludGVydmFsKDEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0cmFpbGluZzogdHJ1ZSwgbGVhZGluZzogdHJ1ZSB9XG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIHRha2VVbnRpbCh0aGlzLiRkZXN0cm95KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChldmVudDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25OYXRpdmVTZWxlY3Rpb25DaGFuZ2UoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBpZiAoSEFTX0lOUFVUX0VWRU5UU19MRVZFTF8yKSB7XG4gICAgICAgICAgICAvLyAgICAgZnJvbUV2ZW50KHRoaXMucm9vdE5vZGUsICdiZWZvcmVpbnB1dCcpXG4gICAgICAgICAgICAvLyAgICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLiRkZXN0cm95KSlcbiAgICAgICAgICAgIC8vICAgICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aGlzLm9uRXZlbnRIYW5kbGUoJ29uQmVmb3JlSW5wdXQnLCBldmVudCk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkV2ZW50SGFuZGxlKGhhbmRsZXIsIGV2ZW50KSB7XG4gICAgICAgIGRlYnVnKCdzbGFFdmVudCcsIGhhbmRsZXIpO1xuXG4gICAgICAgIGNvbnN0IG5hdGl2ZUV2ZW50ID0gZXZlbnQubmF0aXZlRXZlbnQgfHwgZXZlbnQ7XG4gICAgICAgIGNvbnN0IGlzVW5kb1JlZG8gPSBldmVudC50eXBlID09PSAna2V5ZG93bicgJiYgKEhvdGtleXMuaXNVbmRvKG5hdGl2ZUV2ZW50KSB8fCBIb3RrZXlzLmlzUmVkbyhuYXRpdmVFdmVudCkpO1xuXG4gICAgICAgIC8vIElnbm9yZSBgb25CbHVyYCwgYG9uRm9jdXNgIGFuZCBgb25TZWxlY3RgIGV2ZW50cyBnZW5lcmF0ZWRcbiAgICAgICAgLy8gcHJvZ3JhbW1hdGljYWxseSB3aGlsZSB1cGRhdGluZyBzZWxlY3Rpb24uXG4gICAgICAgIGlmICgodGhpcy50bXAuaXNVcGRhdGluZ1NlbGVjdGlvbiB8fCBpc1VuZG9SZWRvKSAmJiAoaGFuZGxlciA9PT0gJ29uU2VsZWN0JyB8fCBoYW5kbGVyID09PSAnb25CbHVyJyB8fCBoYW5kbGVyID09PSAnb25Gb2N1cycpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IFRoZXJlIGFyZSBzaXR1YXRpb25zIHdoZXJlIGEgc2VsZWN0IGV2ZW50IHdpbGwgZmlyZSB3aXRoIGEgbmV3XG4gICAgICAgIC8vIG5hdGl2ZSBzZWxlY3Rpb24gdGhhdCByZXNvbHZlcyB0byB0aGUgc2FtZSBpbnRlcm5hbCBwb3NpdGlvbi4gSW4gdGhvc2VcbiAgICAgICAgLy8gY2FzZXMgd2UgZG9uJ3QgbmVlZCB0byB0cmlnZ2VyIGFueSBjaGFuZ2VzLCBzaW5jZSBvdXIgaW50ZXJuYWwgbW9kZWwgaXNcbiAgICAgICAgLy8gYWxyZWFkeSB1cCB0byBkYXRlLCBidXQgd2UgZG8gd2FudCB0byB1cGRhdGUgdGhlIG5hdGl2ZSBzZWxlY3Rpb24gYWdhaW5cbiAgICAgICAgLy8gdG8gbWFrZSBzdXJlIGl0IGlzIGluIHN5bmMuICgyMDE3LzEwLzE2KVxuICAgICAgICAvL1xuICAgICAgICAvLyBBTkRST0lEOiBUaGUgdXBkYXRlU2VsZWN0aW9uIGNhdXNlcyBpc3N1ZXMgaW4gQW5kcm9pZCB3aGVuIHlvdSBhcmVcbiAgICAgICAgLy8gYXQgdGhlIGVuZCBvZiBhIGJsb2NrLiBUaGUgc2VsZWN0aW9uIGVuZHMgdXAgdG8gdGhlIGxlZnQgb2YgdGhlIGluc2VydGVkXG4gICAgICAgIC8vIGNoYXJhY3RlciBpbnN0ZWFkIG9mIHRvIHRoZSByaWdodC4gVGhpcyBiZWhhdmlvciBjb250aW51ZXMgZXZlbiBpZlxuICAgICAgICAvLyB5b3UgZW50ZXIgbW9yZSB0aGFuIG9uZSBjaGFyYWN0ZXIuICgyMDE5LzAxLzAzKVxuICAgICAgICBpZiAoIUlTX0FORFJPSUQgJiYgaGFuZGxlciA9PT0gJ29uU2VsZWN0Jykge1xuICAgICAgICAgICAgLy8gY29uc3QgeyBlZGl0b3IgfSA9IHRoaXMucHJvcHM7XG4gICAgICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSB0aGlzLmVkaXRvcjtcbiAgICAgICAgICAgIGNvbnN0IHsgc2VsZWN0aW9uIH0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICAgICAgY29uc3QgZG9tU2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLmVkaXRvci5maW5kUmFuZ2UoZG9tU2VsZWN0aW9uKTtcblxuICAgICAgICAgICAgaWYgKHJhbmdlICYmIHJhbmdlLmVxdWFscyhzZWxlY3Rpb24udG9SYW5nZSgpKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG9uJ3QgaGFuZGxlIGRyYWcgYW5kIGRyb3AgZXZlbnRzIGNvbWluZyBmcm9tIGVtYmVkZGVkIGVkaXRvcnMuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkRyYWdFbmQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25EcmFnRW50ZXInIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25EcmFnRXhpdCcgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkRyYWdMZWF2ZScgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkRyYWdPdmVyJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uRHJhZ1N0YXJ0JyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uRHJvcCdcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBjbG9zZXN0ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoU0VMRUNUT1JTLkVESVRPUik7XG5cbiAgICAgICAgICAgIGlmIChjbG9zZXN0ICE9PSB0aGlzLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU29tZSBldmVudHMgcmVxdWlyZSBiZWluZyBpbiBlZGl0YWJsZSBpbiB0aGUgZWRpdG9yLCBzbyBpZiB0aGUgZXZlbnRcbiAgICAgICAgLy8gdGFyZ2V0IGlzbid0LCBpZ25vcmUgdGhlbS5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uQmVmb3JlSW5wdXQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25CbHVyJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uQ29tcG9zaXRpb25FbmQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25Db21wb3NpdGlvblN0YXJ0JyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uQ29weScgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkN1dCcgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkZvY3VzJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uSW5wdXQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25LZXlEb3duJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uS2V5VXAnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25QYXN0ZScgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvblNlbGVjdCdcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgPyBldmVudC50YXJnZXQgOiBldmVudC5uYXRpdmVFdmVudC50YXJnZXQ7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbkVkaXRvcih0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zbGFFdmVudChoYW5kbGVyLCBldmVudCk7XG4gICAgfVxuXG4gICAgb25OYXRpdmVTZWxlY3Rpb25DaGFuZ2UoZXZlbnQ6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5yZWFkT25seSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd2luZG93ID0gZ2V0V2luZG93KGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGNvbnN0IHsgYWN0aXZlRWxlbWVudCB9ID0gd2luZG93LmRvY3VtZW50O1xuXG4gICAgICAgIGRlYnVnLnVwZGF0ZSgnb25OYXRpdmVTZWxlY3Rpb25DaGFuZ2UnLCB7XG4gICAgICAgICAgICBhbmNob3JPZmZzZXQ6IHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5hbmNob3JPZmZzZXRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQgIT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2xhRXZlbnQoJ29uU2VsZWN0JywgZXZlbnQpO1xuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRkZXN0cm95Lm5leHQoKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveS5jb21wbGV0ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgbmF0aXZlIERPTSBzZWxlY3Rpb24gdG8gcmVmbGVjdCB0aGUgaW50ZXJuYWwgbW9kZWwuXG4gICAgICovXG5cbiAgICB1cGRhdGVTZWxlY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHsgdmFsdWUgfSA9IHRoaXMuZWRpdG9yO1xuICAgICAgICBjb25zdCB7IHNlbGVjdGlvbiB9ID0gdmFsdWU7XG4gICAgICAgIGNvbnN0IHsgaXNCYWNrd2FyZCB9ID0gc2VsZWN0aW9uO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3codGhpcy5yb290Tm9kZSk7XG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgY29uc3QgeyBhY3RpdmVFbGVtZW50IH0gPSB3aW5kb3cuZG9jdW1lbnQ7XG5cbiAgICAgICAgaWYgKGRlYnVnLnVwZGF0ZS5lbmFibGVkKSB7XG4gICAgICAgICAgICBkZWJ1Zy51cGRhdGUoJ3VwZGF0ZVNlbGVjdGlvbicsIHsgc2VsZWN0aW9uOiBzZWxlY3Rpb24udG9KU09OKCkgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDT01QQVQ6IEluIEZpcmVmb3gsIHRoZXJlJ3MgYSBidXQgd2hlcmUgYGdldFNlbGVjdGlvbmAgY2FuIHJldHVybiBgbnVsbGAuXG4gICAgICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTgyNzU4NSAoMjAxOC8xMS8wNylcbiAgICAgICAgaWYgKCFuYXRpdmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgcmFuZ2VDb3VudCwgYW5jaG9yTm9kZSB9ID0gbmF0aXZlO1xuICAgICAgICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIElmIHRoZSBTbGF0ZSBzZWxlY3Rpb24gaXMgYmx1cnJlZCwgYnV0IHRoZSBET00ncyBhY3RpdmUgZWxlbWVudCBpcyBzdGlsbFxuICAgICAgICAvLyB0aGUgZWRpdG9yLCB3ZSBuZWVkIHRvIGJsdXIgaXQuXG4gICAgICAgIGlmIChzZWxlY3Rpb24uaXNCbHVycmVkICYmIGFjdGl2ZUVsZW1lbnQgPT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdE5vZGUuYmx1cigpO1xuICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgU2xhdGUgc2VsZWN0aW9uIGlzIHVuc2V0LCBidXQgdGhlIERPTSBzZWxlY3Rpb24gaGFzIGEgcmFuZ2VcbiAgICAgICAgLy8gc2VsZWN0ZWQgaW4gdGhlIGVkaXRvciwgd2UgbmVlZCB0byByZW1vdmUgdGhlIHJhbmdlLlxuICAgICAgICBpZiAoc2VsZWN0aW9uLmlzVW5zZXQgJiYgcmFuZ2VDb3VudCAmJiB0aGlzLmlzSW5FZGl0b3IoYW5jaG9yTm9kZSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZUFsbFJhbmdlcyhuYXRpdmUpO1xuICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgU2xhdGUgc2VsZWN0aW9uIGlzIGZvY3VzZWQsIGJ1dCB0aGUgRE9NJ3MgYWN0aXZlIGVsZW1lbnQgaXMgbm90XG4gICAgICAgIC8vIHRoZSBlZGl0b3IsIHdlIG5lZWQgdG8gZm9jdXMgaXQuIFdlIHByZXZlbnQgc2Nyb2xsaW5nIGJlY2F1c2Ugd2UgaGFuZGxlXG4gICAgICAgIC8vIHNjcm9sbGluZyB0byB0aGUgY29ycmVjdCBzZWxlY3Rpb24uXG4gICAgICAgIGlmIChzZWxlY3Rpb24uaXNGb2N1c2VkICYmIGFjdGl2ZUVsZW1lbnQgIT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdE5vZGUuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdGhlcndpc2UsIGZpZ3VyZSBvdXQgd2hpY2ggRE9NIG5vZGVzIHNob3VsZCBiZSBzZWxlY3RlZC4uLlxuICAgICAgICBpZiAoc2VsZWN0aW9uLmlzRm9jdXNlZCAmJiBzZWxlY3Rpb24uaXNTZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSAhIW5hdGl2ZS5yYW5nZUNvdW50ICYmIG5hdGl2ZS5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgY29uc3QgcmFuZ2U6IFJhbmdlID0gKHRoaXMuZWRpdG9yIGFzIGFueSkuZmluZERPTVJhbmdlKHNlbGVjdGlvbikgYXMgYW55O1xuXG4gICAgICAgICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgICAgICAgICAgd2FybmluZyhmYWxzZSwgJ1VuYWJsZSB0byBmaW5kIGEgbmF0aXZlIERPTSByYW5nZSBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGlvbi4nKTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQsIGVuZENvbnRhaW5lciwgZW5kT2Zmc2V0IH0gPSByYW5nZTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIG5ldyByYW5nZSBtYXRjaGVzIHRoZSBjdXJyZW50IHNlbGVjdGlvbiwgdGhlcmUgaXMgbm90aGluZyB0byBmaXguXG4gICAgICAgICAgICAvLyBDT01QQVQ6IFRoZSBuYXRpdmUgYFJhbmdlYCBvYmplY3QgYWx3YXlzIGhhcyBpdCdzIFwic3RhcnRcIiBmaXJzdCBhbmQgXCJlbmRcIlxuICAgICAgICAgICAgLy8gbGFzdCBpbiB0aGUgRE9NLiBJdCBoYXMgbm8gY29uY2VwdCBvZiBcImJhY2t3YXJkcy9mb3J3YXJkc1wiLCBzbyB3ZSBoYXZlXG4gICAgICAgICAgICAvLyB0byBjaGVjayBib3RoIG9yaWVudGF0aW9ucyBoZXJlLiAoMjAxNy8xMC8zMSlcbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoc3RhcnRDb250YWluZXIgPT09IGN1cnJlbnQuc3RhcnRDb250YWluZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0T2Zmc2V0ID09PSBjdXJyZW50LnN0YXJ0T2Zmc2V0ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRDb250YWluZXIgPT09IGN1cnJlbnQuZW5kQ29udGFpbmVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRPZmZzZXQgPT09IGN1cnJlbnQuZW5kT2Zmc2V0KSB8fFxuICAgICAgICAgICAgICAgICAgICAoc3RhcnRDb250YWluZXIgPT09IGN1cnJlbnQuZW5kQ29udGFpbmVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldCA9PT0gY3VycmVudC5lbmRPZmZzZXQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZENvbnRhaW5lciA9PT0gY3VycmVudC5zdGFydENvbnRhaW5lciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kT2Zmc2V0ID09PSBjdXJyZW50LnN0YXJ0T2Zmc2V0KVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHNldCB0aGUgYGlzVXBkYXRpbmdTZWxlY3Rpb25gIGZsYWcgYW5kIHVwZGF0ZSB0aGUgc2VsZWN0aW9uLlxuICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnRtcC5pc1VwZGF0aW5nU2VsZWN0aW9uID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gcmVtb3ZlQWxsUmFuZ2VzKG5hdGl2ZSk7XG5cbiAgICAgICAgICAgIC8vIENPTVBBVDogSUUgMTEgZG9lcyBub3Qgc3VwcG9ydCBgc2V0QmFzZUFuZEV4dGVudGAuICgyMDE4LzExLzA3KVxuICAgICAgICAgICAgaWYgKG5hdGl2ZS5zZXRCYXNlQW5kRXh0ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gQ09NUEFUOiBTaW5jZSB0aGUgRE9NIHJhbmdlIGhhcyBubyBjb25jZXB0IG9mIGJhY2t3YXJkcy9mb3J3YXJkc1xuICAgICAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgYW5kIGRvIHRoZSByaWdodCB0aGluZyBoZXJlLlxuICAgICAgICAgICAgICAgIGlmIChpc0JhY2t3YXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5zZXRCYXNlQW5kRXh0ZW50KHJhbmdlLmVuZENvbnRhaW5lciwgcmFuZ2UuZW5kT2Zmc2V0LCByYW5nZS5zdGFydENvbnRhaW5lciwgcmFuZ2Uuc3RhcnRPZmZzZXQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5zZXRCYXNlQW5kRXh0ZW50KHJhbmdlLnN0YXJ0Q29udGFpbmVyLCByYW5nZS5zdGFydE9mZnNldCwgcmFuZ2UuZW5kQ29udGFpbmVyLCByYW5nZS5lbmRPZmZzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmF0aXZlLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVidWcudHJhY2soJ3RyYWNrIGVuZCA6IHVwZGF0ZVNlbGVjdGlvbicpO1xuXG4gICAgICAgICAgICAvLyBTY3JvbGwgdG8gdGhlIHNlbGVjdGlvbiwgaW4gY2FzZSBpdCdzIG91dCBvZiB2aWV3LlxuICAgICAgICAgICAgc2Nyb2xsVG9TZWxlY3Rpb24obmF0aXZlKTtcblxuICAgICAgICAgICAgLy8gLy8gVGhlbiB1bnNldCB0aGUgYGlzVXBkYXRpbmdTZWxlY3Rpb25gIGZsYWcgYWZ0ZXIgYSBkZWxheS5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENPTVBBVDogSW4gRmlyZWZveCwgaXQncyBub3QgZW5vdWdoIHRvIGNyZWF0ZSBhIHJhbmdlLCB5b3UgYWxzbyBuZWVkXG4gICAgICAgICAgICAgICAgLy8gdG8gZm9jdXMgdGhlIGNvbnRlbnRlZGl0YWJsZSBlbGVtZW50IHRvby4gKDIwMTYvMTEvMTYpXG4gICAgICAgICAgICAgICAgaWYgKElTX0ZJUkVGT1ggJiYgdGhpcy5yb290Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb3ROb2RlLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy50bXAuaXNVcGRhdGluZ1NlbGVjdGlvbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgZGVidWcudXBkYXRlKCd1cGRhdGVTZWxlY3Rpb246c2V0VGltZW91dCcsIHtcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yT2Zmc2V0OiB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuYW5jaG9yT2Zmc2V0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHVwZGF0ZWQgJiYgKGRlYnVnLmVuYWJsZWQgfHwgZGVidWcudXBkYXRlLmVuYWJsZWQpKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ3VwZGF0ZVNlbGVjdGlvbicsIHsgc2VsZWN0aW9uLCBuYXRpdmUsIGFjdGl2ZUVsZW1lbnQgfSk7XG5cbiAgICAgICAgICAgICAgICBkZWJ1Zy51cGRhdGUoJ3VwZGF0ZVNlbGVjdGlvbjphcHBsaWVkJywge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvbi50b0pTT04oKSxcbiAgICAgICAgICAgICAgICAgICAgbmF0aXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmNob3JPZmZzZXQ6IG5hdGl2ZS5hbmNob3JPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1c09mZnNldDogbmF0aXZlLmZvY3VzT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzSW5FZGl0b3IodGFyZ2V0KSB7XG4gICAgICAgIGxldCBlbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ09NUEFUOiBUZXh0IG5vZGVzIGRvbid0IGhhdmUgYGlzQ29udGVudEVkaXRhYmxlYCBwcm9wZXJ0eS4gU28sIHdoZW5cbiAgICAgICAgICAgIC8vIGB0YXJnZXRgIGlzIGEgdGV4dCBub2RlIHVzZSBpdHMgcGFyZW50IG5vZGUgZm9yIGNoZWNrLlxuICAgICAgICAgICAgZWwgPSB0YXJnZXQubm9kZVR5cGUgPT09IDMgPyB0YXJnZXQucGFyZW50Tm9kZSA6IHRhcmdldDtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBDT01QQVQ6IEluIEZpcmVmb3gsIGB0YXJnZXQubm9kZVR5cGVgIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGFyZ2V0IGlzXG4gICAgICAgICAgICAvLyBvcmlnaW5hdGluZyBmcm9tIGFuIGludGVybmFsIFwicmVzdHJpY3RlZFwiIGVsZW1lbnQgKGUuZy4gYSBzdGVwcGVyXG4gICAgICAgICAgICAvLyBhcnJvdyBvbiBhIG51bWJlciBpbnB1dClcbiAgICAgICAgICAgIC8vIHNlZSBnaXRodWIuY29tL2lhbnN0b3JtdGF5bG9yL3NsYXRlL2lzc3Vlcy8xODE5XG4gICAgICAgICAgICBpZiAoSVNfRklSRUZPWCAmJiBGSVJFRk9YX05PREVfVFlQRV9BQ0NFU1NfRVJST1IudGVzdChlcnIubWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbC5pc0NvbnRlbnRFZGl0YWJsZSAmJiAoZWwgPT09IHRoaXMucm9vdE5vZGUgfHwgZWwuY2xvc2VzdChTRUxFQ1RPUlMuRURJVE9SKSA9PT0gdGhpcy5yb290Tm9kZSk7XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdDaGVja2VkKCkge1xuICAgICAgICBpZiAodGhpcy5pc1VwZGF0ZVNlbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5pc1VwZGF0ZVNlbGVjdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==