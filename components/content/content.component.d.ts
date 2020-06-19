import { OnInit, ElementRef, NgZone, OnDestroy, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { Document, Selection, Value } from 'slate';
import { Subject } from 'rxjs';
import { SlaNodeComponent } from '../node/node.component';
import { SlaEventService } from '../../core/event-service';
export declare class SlaContentComponent implements OnInit, OnDestroy, AfterViewChecked {
    ngZone: NgZone;
    private elementRef;
    private cdr;
    private slaEventService;
    nodeRef: SlaNodeComponent;
    $destroy: Subject<any>;
    rootNode: HTMLElement;
    hasSpaceKeypress: boolean;
    isComposing: boolean;
    isUpdateSelection: boolean;
    document: Document;
    selection: Selection;
    editorData: Value;
    readOnly: boolean;
    slaValue: Value;
    editor: any;
    slaEvent: (handle: string, event: any) => {};
    tmp: {
        isUpdatingSelection: boolean;
        contentKey: number;
    };
    constructor(ngZone: NgZone, elementRef: ElementRef, cdr: ChangeDetectorRef, slaEventService: SlaEventService);
    ngOnInit(): void;
    onEventHandle(handler: any, event: any): void;
    onNativeSelectionChange(event: any): void;
    ngOnDestroy(): void;
    /**
     * Update the native DOM selection to reflect the internal model.
     */
    updateSelection(): void;
    isInEditor(target: any): boolean;
    ngAfterViewChecked(): void;
}
