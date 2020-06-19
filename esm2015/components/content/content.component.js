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
const FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;
//#region
const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
//#endregion
const debug = Debug('slate:content');
debug.update = Debug('slate:update');
debug.render = Debug('slate:content-render');
debug.track = Debug('slate:track');
export class SlaContentComponent {
    constructor(ngZone, elementRef, cdr, slaEventService) {
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
    set slaValue(value) {
        this.isUpdateSelection = true;
        debug.render('set: slateValue');
        this.editorData = value;
    }
    ngOnInit() {
        this.rootNode = this.elementRef.nativeElement;
        this.document = this.editor.value.document;
        this.selection = this.editor.value.selection;
        this.ngZone.runOutsideAngular(() => {
            this.slaEventService.fromSlaEvents(this.rootNode, this.$destroy).subscribe(({ event, eventEntity }) => {
                const target = event.target;
                if (target && target.closest) {
                    const isSkip = target.closest(SELECTORS.SKIP_EVENT);
                    if (isSkip) {
                        return;
                    }
                }
                if (eventEntity.isTriggerBeforeInput) {
                    const beforeInputEvent = BeforeInputEventPlugin.extractEvents(event.type, null, event, event.target);
                    if (beforeInputEvent) {
                        this.onEventHandle('onBeforeInput', beforeInputEvent);
                    }
                }
                if (eventEntity.handler) {
                    this.onEventHandle(eventEntity.handler, event);
                }
            });
            fromEvent(window.document, 'selectionchange')
                .pipe(throttle((value) => {
                return interval(100);
            }, { trailing: true, leading: true }), takeUntil(this.$destroy))
                .subscribe((event) => {
                this.onNativeSelectionChange(event);
            });
            // if (HAS_INPUT_EVENTS_LEVEL_2) {
            //     fromEvent(this.rootNode, 'beforeinput')
            //         .pipe(takeUntil(this.$destroy))
            //         .subscribe(event => {
            //             this.onEventHandle('onBeforeInput', event);
            //         });
            // }
        });
    }
    onEventHandle(handler, event) {
        debug('slaEvent', handler);
        const nativeEvent = event.nativeEvent || event;
        const isUndoRedo = event.type === 'keydown' && (Hotkeys.isUndo(nativeEvent) || Hotkeys.isRedo(nativeEvent));
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
            const { value } = this.editor;
            const { selection } = value;
            const window = getWindow(event.target);
            const domSelection = window.getSelection();
            const range = this.editor.findRange(domSelection);
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
            const closest = event.target.closest(SELECTORS.EDITOR);
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
            const target = event.target ? event.target : event.nativeEvent.target;
            if (!this.isInEditor(target)) {
                return;
            }
        }
        this.slaEvent(handler, event);
    }
    onNativeSelectionChange(event) {
        if (this.readOnly) {
            return;
        }
        const window = getWindow(event.target);
        const { activeElement } = window.document;
        debug.update('onNativeSelectionChange', {
            anchorOffset: window.getSelection().anchorOffset
        });
        if (activeElement !== this.rootNode) {
            return;
        }
        this.slaEvent('onSelect', event);
    }
    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }
    /**
     * Update the native DOM selection to reflect the internal model.
     */
    updateSelection() {
        const { value } = this.editor;
        const { selection } = value;
        const { isBackward } = selection;
        const window = getWindow(this.rootNode);
        const native = window.getSelection();
        const { activeElement } = window.document;
        if (debug.update.enabled) {
            debug.update('updateSelection', { selection: selection.toJSON() });
        }
        // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
        if (!native) {
            return;
        }
        const { rangeCount, anchorNode } = native;
        let updated = false;
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
            const current = !!native.rangeCount && native.getRangeAt(0);
            const range = this.editor.findDOMRange(selection);
            if (!range) {
                warning(false, 'Unable to find a native DOM range from the current selection.');
                return;
            }
            const { startContainer, startOffset, endContainer, endOffset } = range;
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
            setTimeout(() => {
                // COMPAT: In Firefox, it's not enough to create a range, you also need
                // to focus the contenteditable element too. (2016/11/16)
                if (IS_FIREFOX && this.rootNode) {
                    this.rootNode.focus();
                }
                this.tmp.isUpdatingSelection = false;
                debug.update('updateSelection:setTimeout', {
                    anchorOffset: window.getSelection().anchorOffset
                });
            });
            if (updated && (debug.enabled || debug.update.enabled)) {
                debug('updateSelection', { selection, native, activeElement });
                debug.update('updateSelection:applied', {
                    selection: selection.toJSON(),
                    native: {
                        anchorOffset: native.anchorOffset,
                        focusOffset: native.focusOffset
                    }
                });
            }
        }
    }
    isInEditor(target) {
        let el;
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
    }
    ngAfterViewChecked() {
        if (this.isUpdateSelection) {
            this.isUpdateSelection = false;
            this.ngZone.runOutsideAngular(() => {
                this.updateSelection();
            });
        }
    }
}
SlaContentComponent.decorators = [
    { type: Component, args: [{
                selector: 'sla-content,[slaContent]',
                template: "<sla-node\n    [editor]=\"editor\"\n    [node]=\"editorData.document\"\n    [selection]=\"editorData.selection\"\n    [readOnly]=\"readOnly\"\n></sla-node>\n",
                changeDetection: ChangeDetectionStrategy.OnPush
            }] }
];
/** @nocollapse */
SlaContentComponent.ctorParameters = () => [
    { type: NgZone },
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: SlaEventService }
];
SlaContentComponent.propDecorators = {
    nodeRef: [{ type: ViewChild, args: [SlaNodeComponent, { static: true },] }],
    readOnly: [{ type: Input }],
    slaValue: [{ type: Input }],
    editor: [{ type: Input }],
    slaEvent: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJjb21wb25lbnRzL2NvbnRlbnQvY29udGVudC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFDVCxLQUFLLEVBSUwsVUFBVSxFQUNWLE1BQU0sRUFNTix1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDWixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUF1QixLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFbkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFTLE1BQU0sTUFBTSxDQUFDO0FBQzNELE9BQU8sRUFBc0IsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3pFLE9BQU8sU0FBUyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLE9BQU8sTUFBTSxlQUFlLENBQUM7QUFDcEMsT0FBTyxPQUFPLE1BQU0sY0FBYyxDQUFDO0FBRW5DLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUE0QixNQUFNLHVCQUF1QixDQUFDO0FBQ3pGLE9BQU8sU0FBUyxNQUFNLDJCQUEyQixDQUFDO0FBRWxELE9BQU8saUJBQWlCLE1BQU0saUNBQWlDLENBQUM7QUFDaEUsT0FBTyxzQkFBc0IsTUFBTSxtREFBbUQsQ0FBQztBQUN2RixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFM0QsTUFBTSw4QkFBOEIsR0FBRyxpREFBaUQsQ0FBQztBQUN6RixTQUFTO0FBQ1QsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxZQUFZ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QyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1RyxDQUFDO0lBRUQsa0JBQWtCO1FBQ2QsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDeEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDOzs7WUEzV0osU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSwwQkFBMEI7Z0JBQ3BDLHlLQUF1QztnQkFDdkMsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE1BQU07YUFDbEQ7Ozs7WUE3Q0csTUFBTTtZQUROLFVBQVU7WUFRVixpQkFBaUI7WUFrQlosZUFBZTs7O3NCQXNCbkIsU0FBUyxTQUFDLGdCQUFnQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTt1QkFtQjVDLEtBQUs7dUJBR0wsS0FBSztxQkFPTCxLQUFLO3VCQUdMLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBJbnB1dCxcbiAgICBPbkluaXQsXG4gICAgSG9zdEJpbmRpbmcsXG4gICAgSG9zdExpc3RlbmVyLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgTmdab25lLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkNoYW5nZXMsXG4gICAgQWZ0ZXJWaWV3Q2hlY2tlZCxcbiAgICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICAgIFNpbXBsZUNoYW5nZXMsXG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gICAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgVmlld0NoaWxkXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IERvY3VtZW50LCBTZWxlY3Rpb24sIFZhbHVlIH0gZnJvbSAnc2xhdGUnO1xuaW1wb3J0IHsgTGlzdCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgeyBmcm9tRXZlbnQsIFN1YmplY3QsIGludGVydmFsLCB0aW1lciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVib3VuY2VUaW1lLCB0YWtlLCB0YWtlVW50aWwsIHRocm90dGxlIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IGdldFdpbmRvdyBmcm9tICdnZXQtd2luZG93JztcbmltcG9ydCBIb3RrZXlzIGZyb20gJ3NsYXRlLWhvdGtleXMnO1xuaW1wb3J0IHdhcm5pbmcgZnJvbSAndGlueS13YXJuaW5nJztcblxuaW1wb3J0IHsgSVNfQU5EUk9JRCwgSVNfRklSRUZPWCwgSEFTX0lOUFVUX0VWRU5UU19MRVZFTF8yIH0gZnJvbSAnc2xhdGUtZGV2LWVudmlyb25tZW50JztcbmltcG9ydCBTRUxFQ1RPUlMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL3NlbGVjdG9ycyc7XG5pbXBvcnQgcmVtb3ZlQWxsUmFuZ2VzIGZyb20gJy4uLy4uL3V0aWxzL3JlbW92ZS1hbGwtcmFuZ2VzJztcbmltcG9ydCBzY3JvbGxUb1NlbGVjdGlvbiBmcm9tICcuLi8uLi91dGlscy9zY3JvbGwtdG8tc2VsZWN0aW9uJztcbmltcG9ydCBCZWZvcmVJbnB1dEV2ZW50UGx1Z2luIGZyb20gJy4uLy4uL3BsdWdpbnMvY3VzdG9tLWV2ZW50L0JlZm9yZUlucHV0RXZlbnRQbHVnaW4nO1xuaW1wb3J0IHsgU2xhTm9kZUNvbXBvbmVudCB9IGZyb20gJy4uL25vZGUvbm9kZS5jb21wb25lbnQnO1xuaW1wb3J0IHsgU2xhRXZlbnRTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vY29yZS9ldmVudC1zZXJ2aWNlJztcblxuY29uc3QgRklSRUZPWF9OT0RFX1RZUEVfQUNDRVNTX0VSUk9SID0gL1Blcm1pc3Npb24gZGVuaWVkIHRvIGFjY2VzcyBwcm9wZXJ0eSBcIm5vZGVUeXBlXCIvO1xuLy8jcmVnaW9uXG5jb25zdCBTUEFDRUJBUl9DT0RFID0gMzI7XG5jb25zdCBTUEFDRUJBUl9DSEFSID0gU3RyaW5nLmZyb21DaGFyQ29kZShTUEFDRUJBUl9DT0RFKTtcbi8vI2VuZHJlZ2lvblxuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdzbGF0ZTpjb250ZW50Jyk7XG5cbmRlYnVnLnVwZGF0ZSA9IERlYnVnKCdzbGF0ZTp1cGRhdGUnKTtcblxuZGVidWcucmVuZGVyID0gRGVidWcoJ3NsYXRlOmNvbnRlbnQtcmVuZGVyJyk7XG5cbmRlYnVnLnRyYWNrID0gRGVidWcoJ3NsYXRlOnRyYWNrJyk7XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnc2xhLWNvbnRlbnQsW3NsYUNvbnRlbnRdJyxcbiAgICB0ZW1wbGF0ZVVybDogJy4vY29udGVudC5jb21wb25lbnQuaHRtbCcsXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcbn0pXG5leHBvcnQgY2xhc3MgU2xhQ29udGVudENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBBZnRlclZpZXdDaGVja2VkIHtcbiAgICBAVmlld0NoaWxkKFNsYU5vZGVDb21wb25lbnQsIHsgc3RhdGljOiB0cnVlIH0pXG4gICAgbm9kZVJlZjogU2xhTm9kZUNvbXBvbmVudDtcblxuICAgICRkZXN0cm95OiBTdWJqZWN0PGFueT4gPSBuZXcgU3ViamVjdCgpO1xuXG4gICAgcm9vdE5vZGU6IEhUTUxFbGVtZW50O1xuXG4gICAgaGFzU3BhY2VLZXlwcmVzcyA9IGZhbHNlO1xuXG4gICAgaXNDb21wb3NpbmcgPSBmYWxzZTtcblxuICAgIGlzVXBkYXRlU2VsZWN0aW9uID0gZmFsc2U7XG5cbiAgICBkb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgICBzZWxlY3Rpb246IFNlbGVjdGlvbjtcblxuICAgIGVkaXRvckRhdGE6IFZhbHVlO1xuXG4gICAgQElucHV0KClcbiAgICByZWFkT25seSA9IGZhbHNlO1xuXG4gICAgQElucHV0KClcbiAgICBzZXQgc2xhVmFsdWUodmFsdWU6IFZhbHVlKSB7XG4gICAgICAgIHRoaXMuaXNVcGRhdGVTZWxlY3Rpb24gPSB0cnVlO1xuICAgICAgICBkZWJ1Zy5yZW5kZXIoJ3NldDogc2xhdGVWYWx1ZScpO1xuICAgICAgICB0aGlzLmVkaXRvckRhdGEgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBASW5wdXQoKVxuICAgIGVkaXRvcjogYW55O1xuXG4gICAgQElucHV0KClcbiAgICBzbGFFdmVudDogKGhhbmRsZTogc3RyaW5nLCBldmVudDogYW55KSA9PiB7fTtcblxuICAgIHRtcCA9IHtcbiAgICAgICAgaXNVcGRhdGluZ1NlbGVjdGlvbjogZmFsc2UsXG4gICAgICAgIGNvbnRlbnRLZXk6IDBcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgICAgICBwcml2YXRlIGNkcjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgIHByaXZhdGUgc2xhRXZlbnRTZXJ2aWNlOiBTbGFFdmVudFNlcnZpY2VcbiAgICApIHt9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgICAgICB0aGlzLmRvY3VtZW50ID0gdGhpcy5lZGl0b3IudmFsdWUuZG9jdW1lbnQ7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gdGhpcy5lZGl0b3IudmFsdWUuc2VsZWN0aW9uO1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNsYUV2ZW50U2VydmljZS5mcm9tU2xhRXZlbnRzKHRoaXMucm9vdE5vZGUsIHRoaXMuJGRlc3Ryb3kpLnN1YnNjcmliZSgoeyBldmVudCwgZXZlbnRFbnRpdHkgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldDogYW55ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0LmNsb3Nlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTa2lwID0gdGFyZ2V0LmNsb3Nlc3QoU0VMRUNUT1JTLlNLSVBfRVZFTlQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTa2lwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RW50aXR5LmlzVHJpZ2dlckJlZm9yZUlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZUlucHV0RXZlbnQgPSBCZWZvcmVJbnB1dEV2ZW50UGx1Z2luLmV4dHJhY3RFdmVudHMoZXZlbnQudHlwZSwgbnVsbCwgZXZlbnQsIGV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiZWZvcmVJbnB1dEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXZlbnRIYW5kbGUoJ29uQmVmb3JlSW5wdXQnLCBiZWZvcmVJbnB1dEV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRFbnRpdHkuaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXZlbnRIYW5kbGUoZXZlbnRFbnRpdHkuaGFuZGxlciwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZnJvbUV2ZW50KHdpbmRvdy5kb2N1bWVudCwgJ3NlbGVjdGlvbmNoYW5nZScpXG4gICAgICAgICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgIHRocm90dGxlKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlOiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcnZhbCgxMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdHJhaWxpbmc6IHRydWUsIGxlYWRpbmc6IHRydWUgfVxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICB0YWtlVW50aWwodGhpcy4kZGVzdHJveSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTmF0aXZlU2VsZWN0aW9uQ2hhbmdlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gaWYgKEhBU19JTlBVVF9FVkVOVFNfTEVWRUxfMikge1xuICAgICAgICAgICAgLy8gICAgIGZyb21FdmVudCh0aGlzLnJvb3ROb2RlLCAnYmVmb3JlaW5wdXQnKVxuICAgICAgICAgICAgLy8gICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy4kZGVzdHJveSkpXG4gICAgICAgICAgICAvLyAgICAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdGhpcy5vbkV2ZW50SGFuZGxlKCdvbkJlZm9yZUlucHV0JywgZXZlbnQpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25FdmVudEhhbmRsZShoYW5kbGVyLCBldmVudCkge1xuICAgICAgICBkZWJ1Zygnc2xhRXZlbnQnLCBoYW5kbGVyKTtcblxuICAgICAgICBjb25zdCBuYXRpdmVFdmVudCA9IGV2ZW50Lm5hdGl2ZUV2ZW50IHx8IGV2ZW50O1xuICAgICAgICBjb25zdCBpc1VuZG9SZWRvID0gZXZlbnQudHlwZSA9PT0gJ2tleWRvd24nICYmIChIb3RrZXlzLmlzVW5kbyhuYXRpdmVFdmVudCkgfHwgSG90a2V5cy5pc1JlZG8obmF0aXZlRXZlbnQpKTtcblxuICAgICAgICAvLyBJZ25vcmUgYG9uQmx1cmAsIGBvbkZvY3VzYCBhbmQgYG9uU2VsZWN0YCBldmVudHMgZ2VuZXJhdGVkXG4gICAgICAgIC8vIHByb2dyYW1tYXRpY2FsbHkgd2hpbGUgdXBkYXRpbmcgc2VsZWN0aW9uLlxuICAgICAgICBpZiAoKHRoaXMudG1wLmlzVXBkYXRpbmdTZWxlY3Rpb24gfHwgaXNVbmRvUmVkbykgJiYgKGhhbmRsZXIgPT09ICdvblNlbGVjdCcgfHwgaGFuZGxlciA9PT0gJ29uQmx1cicgfHwgaGFuZGxlciA9PT0gJ29uRm9jdXMnKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBUaGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhIHNlbGVjdCBldmVudCB3aWxsIGZpcmUgd2l0aCBhIG5ld1xuICAgICAgICAvLyBuYXRpdmUgc2VsZWN0aW9uIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHNhbWUgaW50ZXJuYWwgcG9zaXRpb24uIEluIHRob3NlXG4gICAgICAgIC8vIGNhc2VzIHdlIGRvbid0IG5lZWQgdG8gdHJpZ2dlciBhbnkgY2hhbmdlcywgc2luY2Ugb3VyIGludGVybmFsIG1vZGVsIGlzXG4gICAgICAgIC8vIGFscmVhZHkgdXAgdG8gZGF0ZSwgYnV0IHdlIGRvIHdhbnQgdG8gdXBkYXRlIHRoZSBuYXRpdmUgc2VsZWN0aW9uIGFnYWluXG4gICAgICAgIC8vIHRvIG1ha2Ugc3VyZSBpdCBpcyBpbiBzeW5jLiAoMjAxNy8xMC8xNilcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQU5EUk9JRDogVGhlIHVwZGF0ZVNlbGVjdGlvbiBjYXVzZXMgaXNzdWVzIGluIEFuZHJvaWQgd2hlbiB5b3UgYXJlXG4gICAgICAgIC8vIGF0IHRoZSBlbmQgb2YgYSBibG9jay4gVGhlIHNlbGVjdGlvbiBlbmRzIHVwIHRvIHRoZSBsZWZ0IG9mIHRoZSBpbnNlcnRlZFxuICAgICAgICAvLyBjaGFyYWN0ZXIgaW5zdGVhZCBvZiB0byB0aGUgcmlnaHQuIFRoaXMgYmVoYXZpb3IgY29udGludWVzIGV2ZW4gaWZcbiAgICAgICAgLy8geW91IGVudGVyIG1vcmUgdGhhbiBvbmUgY2hhcmFjdGVyLiAoMjAxOS8wMS8wMylcbiAgICAgICAgaWYgKCFJU19BTkRST0lEICYmIGhhbmRsZXIgPT09ICdvblNlbGVjdCcpIHtcbiAgICAgICAgICAgIC8vIGNvbnN0IHsgZWRpdG9yIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gdGhpcy5lZGl0b3I7XG4gICAgICAgICAgICBjb25zdCB7IHNlbGVjdGlvbiB9ID0gdmFsdWU7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3cgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGRvbVNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5lZGl0b3IuZmluZFJhbmdlKGRvbVNlbGVjdGlvbik7XG5cbiAgICAgICAgICAgIGlmIChyYW5nZSAmJiByYW5nZS5lcXVhbHMoc2VsZWN0aW9uLnRvUmFuZ2UoKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvbid0IGhhbmRsZSBkcmFnIGFuZCBkcm9wIGV2ZW50cyBjb21pbmcgZnJvbSBlbWJlZGRlZCBlZGl0b3JzLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25EcmFnRW5kJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uRHJhZ0VudGVyJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uRHJhZ0V4aXQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25EcmFnTGVhdmUnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25EcmFnT3ZlcicgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkRyYWdTdGFydCcgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkRyb3AnXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgY2xvc2VzdCA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KFNFTEVDVE9SUy5FRElUT1IpO1xuXG4gICAgICAgICAgICBpZiAoY2xvc2VzdCAhPT0gdGhpcy5yb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNvbWUgZXZlbnRzIHJlcXVpcmUgYmVpbmcgaW4gZWRpdGFibGUgaW4gdGhlIGVkaXRvciwgc28gaWYgdGhlIGV2ZW50XG4gICAgICAgIC8vIHRhcmdldCBpc24ndCwgaWdub3JlIHRoZW0uXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkJlZm9yZUlucHV0JyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uQmx1cicgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkNvbXBvc2l0aW9uRW5kJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uQ29tcG9zaXRpb25TdGFydCcgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbkNvcHknIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25DdXQnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25Gb2N1cycgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbklucHV0JyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uS2V5RG93bicgfHxcbiAgICAgICAgICAgIGhhbmRsZXIgPT09ICdvbktleVVwJyB8fFxuICAgICAgICAgICAgaGFuZGxlciA9PT0gJ29uUGFzdGUnIHx8XG4gICAgICAgICAgICBoYW5kbGVyID09PSAnb25TZWxlY3QnXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0ID8gZXZlbnQudGFyZ2V0IDogZXZlbnQubmF0aXZlRXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5FZGl0b3IodGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2xhRXZlbnQoaGFuZGxlciwgZXZlbnQpO1xuICAgIH1cblxuICAgIG9uTmF0aXZlU2VsZWN0aW9uQ2hhbmdlKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVhZE9ubHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICAgICAgICBjb25zdCB7IGFjdGl2ZUVsZW1lbnQgfSA9IHdpbmRvdy5kb2N1bWVudDtcblxuICAgICAgICBkZWJ1Zy51cGRhdGUoJ29uTmF0aXZlU2VsZWN0aW9uQ2hhbmdlJywge1xuICAgICAgICAgICAgYW5jaG9yT2Zmc2V0OiB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuYW5jaG9yT2Zmc2V0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChhY3RpdmVFbGVtZW50ICE9PSB0aGlzLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNsYUV2ZW50KCdvblNlbGVjdCcsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kZGVzdHJveS5uZXh0KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kuY29tcGxldGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdGhlIG5hdGl2ZSBET00gc2VsZWN0aW9uIHRvIHJlZmxlY3QgdGhlIGludGVybmFsIG1vZGVsLlxuICAgICAqL1xuXG4gICAgdXBkYXRlU2VsZWN0aW9uKCkge1xuICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSB0aGlzLmVkaXRvcjtcbiAgICAgICAgY29uc3QgeyBzZWxlY3Rpb24gfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCB7IGlzQmFja3dhcmQgfSA9IHNlbGVjdGlvbjtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gZ2V0V2luZG93KHRoaXMucm9vdE5vZGUpO1xuICAgICAgICBjb25zdCBuYXRpdmUgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IHsgYWN0aXZlRWxlbWVudCB9ID0gd2luZG93LmRvY3VtZW50O1xuXG4gICAgICAgIGlmIChkZWJ1Zy51cGRhdGUuZW5hYmxlZCkge1xuICAgICAgICAgICAgZGVidWcudXBkYXRlKCd1cGRhdGVTZWxlY3Rpb24nLCB7IHNlbGVjdGlvbjogc2VsZWN0aW9uLnRvSlNPTigpIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ09NUEFUOiBJbiBGaXJlZm94LCB0aGVyZSdzIGEgYnV0IHdoZXJlIGBnZXRTZWxlY3Rpb25gIGNhbiByZXR1cm4gYG51bGxgLlxuICAgICAgICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD04Mjc1ODUgKDIwMTgvMTEvMDcpXG4gICAgICAgIGlmICghbmF0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHJhbmdlQ291bnQsIGFuY2hvck5vZGUgfSA9IG5hdGl2ZTtcbiAgICAgICAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBJZiB0aGUgU2xhdGUgc2VsZWN0aW9uIGlzIGJsdXJyZWQsIGJ1dCB0aGUgRE9NJ3MgYWN0aXZlIGVsZW1lbnQgaXMgc3RpbGxcbiAgICAgICAgLy8gdGhlIGVkaXRvciwgd2UgbmVlZCB0byBibHVyIGl0LlxuICAgICAgICBpZiAoc2VsZWN0aW9uLmlzQmx1cnJlZCAmJiBhY3RpdmVFbGVtZW50ID09PSB0aGlzLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3ROb2RlLmJsdXIoKTtcbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIFNsYXRlIHNlbGVjdGlvbiBpcyB1bnNldCwgYnV0IHRoZSBET00gc2VsZWN0aW9uIGhhcyBhIHJhbmdlXG4gICAgICAgIC8vIHNlbGVjdGVkIGluIHRoZSBlZGl0b3IsIHdlIG5lZWQgdG8gcmVtb3ZlIHRoZSByYW5nZS5cbiAgICAgICAgaWYgKHNlbGVjdGlvbi5pc1Vuc2V0ICYmIHJhbmdlQ291bnQgJiYgdGhpcy5pc0luRWRpdG9yKGFuY2hvck5vZGUpKSB7XG4gICAgICAgICAgICAvLyByZW1vdmVBbGxSYW5nZXMobmF0aXZlKTtcbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIFNsYXRlIHNlbGVjdGlvbiBpcyBmb2N1c2VkLCBidXQgdGhlIERPTSdzIGFjdGl2ZSBlbGVtZW50IGlzIG5vdFxuICAgICAgICAvLyB0aGUgZWRpdG9yLCB3ZSBuZWVkIHRvIGZvY3VzIGl0LiBXZSBwcmV2ZW50IHNjcm9sbGluZyBiZWNhdXNlIHdlIGhhbmRsZVxuICAgICAgICAvLyBzY3JvbGxpbmcgdG8gdGhlIGNvcnJlY3Qgc2VsZWN0aW9uLlxuICAgICAgICBpZiAoc2VsZWN0aW9uLmlzRm9jdXNlZCAmJiBhY3RpdmVFbGVtZW50ICE9PSB0aGlzLnJvb3ROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3ROb2RlLmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBmaWd1cmUgb3V0IHdoaWNoIERPTSBub2RlcyBzaG91bGQgYmUgc2VsZWN0ZWQuLi5cbiAgICAgICAgaWYgKHNlbGVjdGlvbi5pc0ZvY3VzZWQgJiYgc2VsZWN0aW9uLmlzU2V0KSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gISFuYXRpdmUucmFuZ2VDb3VudCAmJiBuYXRpdmUuZ2V0UmFuZ2VBdCgwKTtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlOiBSYW5nZSA9ICh0aGlzLmVkaXRvciBhcyBhbnkpLmZpbmRET01SYW5nZShzZWxlY3Rpb24pIGFzIGFueTtcblxuICAgICAgICAgICAgaWYgKCFyYW5nZSkge1xuICAgICAgICAgICAgICAgIHdhcm5pbmcoZmFsc2UsICdVbmFibGUgdG8gZmluZCBhIG5hdGl2ZSBET00gcmFuZ2UgZnJvbSB0aGUgY3VycmVudCBzZWxlY3Rpb24uJyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgc3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0LCBlbmRDb250YWluZXIsIGVuZE9mZnNldCB9ID0gcmFuZ2U7XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBuZXcgcmFuZ2UgbWF0Y2hlcyB0aGUgY3VycmVudCBzZWxlY3Rpb24sIHRoZXJlIGlzIG5vdGhpbmcgdG8gZml4LlxuICAgICAgICAgICAgLy8gQ09NUEFUOiBUaGUgbmF0aXZlIGBSYW5nZWAgb2JqZWN0IGFsd2F5cyBoYXMgaXQncyBcInN0YXJ0XCIgZmlyc3QgYW5kIFwiZW5kXCJcbiAgICAgICAgICAgIC8vIGxhc3QgaW4gdGhlIERPTS4gSXQgaGFzIG5vIGNvbmNlcHQgb2YgXCJiYWNrd2FyZHMvZm9yd2FyZHNcIiwgc28gd2UgaGF2ZVxuICAgICAgICAgICAgLy8gdG8gY2hlY2sgYm90aCBvcmllbnRhdGlvbnMgaGVyZS4gKDIwMTcvMTAvMzEpXG4gICAgICAgICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKHN0YXJ0Q29udGFpbmVyID09PSBjdXJyZW50LnN0YXJ0Q29udGFpbmVyICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydE9mZnNldCA9PT0gY3VycmVudC5zdGFydE9mZnNldCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kQ29udGFpbmVyID09PSBjdXJyZW50LmVuZENvbnRhaW5lciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kT2Zmc2V0ID09PSBjdXJyZW50LmVuZE9mZnNldCkgfHxcbiAgICAgICAgICAgICAgICAgICAgKHN0YXJ0Q29udGFpbmVyID09PSBjdXJyZW50LmVuZENvbnRhaW5lciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRPZmZzZXQgPT09IGN1cnJlbnQuZW5kT2Zmc2V0ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRDb250YWluZXIgPT09IGN1cnJlbnQuc3RhcnRDb250YWluZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZE9mZnNldCA9PT0gY3VycmVudC5zdGFydE9mZnNldClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBzZXQgdGhlIGBpc1VwZGF0aW5nU2VsZWN0aW9uYCBmbGFnIGFuZCB1cGRhdGUgdGhlIHNlbGVjdGlvbi5cbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy50bXAuaXNVcGRhdGluZ1NlbGVjdGlvbiA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZUFsbFJhbmdlcyhuYXRpdmUpO1xuXG4gICAgICAgICAgICAvLyBDT01QQVQ6IElFIDExIGRvZXMgbm90IHN1cHBvcnQgYHNldEJhc2VBbmRFeHRlbnRgLiAoMjAxOC8xMS8wNylcbiAgICAgICAgICAgIGlmIChuYXRpdmUuc2V0QmFzZUFuZEV4dGVudCkge1xuICAgICAgICAgICAgICAgIC8vIENPTVBBVDogU2luY2UgdGhlIERPTSByYW5nZSBoYXMgbm8gY29uY2VwdCBvZiBiYWNrd2FyZHMvZm9yd2FyZHNcbiAgICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGNoZWNrIGFuZCBkbyB0aGUgcmlnaHQgdGhpbmcgaGVyZS5cbiAgICAgICAgICAgICAgICBpZiAoaXNCYWNrd2FyZCkge1xuICAgICAgICAgICAgICAgICAgICBuYXRpdmUuc2V0QmFzZUFuZEV4dGVudChyYW5nZS5lbmRDb250YWluZXIsIHJhbmdlLmVuZE9mZnNldCwgcmFuZ2Uuc3RhcnRDb250YWluZXIsIHJhbmdlLnN0YXJ0T2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuYXRpdmUuc2V0QmFzZUFuZEV4dGVudChyYW5nZS5zdGFydENvbnRhaW5lciwgcmFuZ2Uuc3RhcnRPZmZzZXQsIHJhbmdlLmVuZENvbnRhaW5lciwgcmFuZ2UuZW5kT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5hdGl2ZS5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlYnVnLnRyYWNrKCd0cmFjayBlbmQgOiB1cGRhdGVTZWxlY3Rpb24nKTtcblxuICAgICAgICAgICAgLy8gU2Nyb2xsIHRvIHRoZSBzZWxlY3Rpb24sIGluIGNhc2UgaXQncyBvdXQgb2Ygdmlldy5cbiAgICAgICAgICAgIHNjcm9sbFRvU2VsZWN0aW9uKG5hdGl2ZSk7XG5cbiAgICAgICAgICAgIC8vIC8vIFRoZW4gdW5zZXQgdGhlIGBpc1VwZGF0aW5nU2VsZWN0aW9uYCBmbGFnIGFmdGVyIGEgZGVsYXkuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBDT01QQVQ6IEluIEZpcmVmb3gsIGl0J3Mgbm90IGVub3VnaCB0byBjcmVhdGUgYSByYW5nZSwgeW91IGFsc28gbmVlZFxuICAgICAgICAgICAgICAgIC8vIHRvIGZvY3VzIHRoZSBjb250ZW50ZWRpdGFibGUgZWxlbWVudCB0b28uICgyMDE2LzExLzE2KVxuICAgICAgICAgICAgICAgIGlmIChJU19GSVJFRk9YICYmIHRoaXMucm9vdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb290Tm9kZS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudG1wLmlzVXBkYXRpbmdTZWxlY3Rpb24gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGRlYnVnLnVwZGF0ZSgndXBkYXRlU2VsZWN0aW9uOnNldFRpbWVvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgIGFuY2hvck9mZnNldDogd2luZG93LmdldFNlbGVjdGlvbigpLmFuY2hvck9mZnNldFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh1cGRhdGVkICYmIChkZWJ1Zy5lbmFibGVkIHx8IGRlYnVnLnVwZGF0ZS5lbmFibGVkKSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCd1cGRhdGVTZWxlY3Rpb24nLCB7IHNlbGVjdGlvbiwgbmF0aXZlLCBhY3RpdmVFbGVtZW50IH0pO1xuXG4gICAgICAgICAgICAgICAgZGVidWcudXBkYXRlKCd1cGRhdGVTZWxlY3Rpb246YXBwbGllZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb24udG9KU09OKCksXG4gICAgICAgICAgICAgICAgICAgIG5hdGl2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5jaG9yT2Zmc2V0OiBuYXRpdmUuYW5jaG9yT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9jdXNPZmZzZXQ6IG5hdGl2ZS5mb2N1c09mZnNldFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0luRWRpdG9yKHRhcmdldCkge1xuICAgICAgICBsZXQgZWw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENPTVBBVDogVGV4dCBub2RlcyBkb24ndCBoYXZlIGBpc0NvbnRlbnRFZGl0YWJsZWAgcHJvcGVydHkuIFNvLCB3aGVuXG4gICAgICAgICAgICAvLyBgdGFyZ2V0YCBpcyBhIHRleHQgbm9kZSB1c2UgaXRzIHBhcmVudCBub2RlIGZvciBjaGVjay5cbiAgICAgICAgICAgIGVsID0gdGFyZ2V0Lm5vZGVUeXBlID09PSAzID8gdGFyZ2V0LnBhcmVudE5vZGUgOiB0YXJnZXQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gQ09NUEFUOiBJbiBGaXJlZm94LCBgdGFyZ2V0Lm5vZGVUeXBlYCB3aWxsIHRocm93IGFuIGVycm9yIGlmIHRhcmdldCBpc1xuICAgICAgICAgICAgLy8gb3JpZ2luYXRpbmcgZnJvbSBhbiBpbnRlcm5hbCBcInJlc3RyaWN0ZWRcIiBlbGVtZW50IChlLmcuIGEgc3RlcHBlclxuICAgICAgICAgICAgLy8gYXJyb3cgb24gYSBudW1iZXIgaW5wdXQpXG4gICAgICAgICAgICAvLyBzZWUgZ2l0aHViLmNvbS9pYW5zdG9ybXRheWxvci9zbGF0ZS9pc3N1ZXMvMTgxOVxuICAgICAgICAgICAgaWYgKElTX0ZJUkVGT1ggJiYgRklSRUZPWF9OT0RFX1RZUEVfQUNDRVNTX0VSUk9SLnRlc3QoZXJyLm1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWwuaXNDb250ZW50RWRpdGFibGUgJiYgKGVsID09PSB0aGlzLnJvb3ROb2RlIHx8IGVsLmNsb3Nlc3QoU0VMRUNUT1JTLkVESVRPUikgPT09IHRoaXMucm9vdE5vZGUpO1xuICAgIH1cblxuICAgIG5nQWZ0ZXJWaWV3Q2hlY2tlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNVcGRhdGVTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuaXNVcGRhdGVTZWxlY3Rpb24gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=