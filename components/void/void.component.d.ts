import { OnInit, ElementRef, ViewContainerRef, QueryList } from '@angular/core';
import { Document, Selection, Editor, Block, Inline, Decoration, Annotation } from 'slate';
import { List, Map } from 'immutable';
import { SlaNestedNodeRef } from '../../core/render-plugin/render-config';
export declare class SlaVoidComponent implements OnInit {
    private viewContainerRef;
    private elementRef;
    internalNode: any;
    nodeComponentRef: SlaNestedNodeRef;
    editor: Editor;
    selection: Selection;
    parent: Document | Block | Inline;
    block: Block;
    decorations: List<Decoration>;
    annotations: Map<string, Annotation>;
    children: HTMLElement;
    nodeRef: (nodeRef: any) => {};
    readOnly: boolean;
    nodeRefs: QueryList<any>;
    node: any;
    void: string;
    key: string;
    constructor(viewContainerRef: ViewContainerRef, elementRef: ElementRef<any>);
    ngOnInit(): void;
    createElement(): HTMLDivElement | HTMLSpanElement;
    render(): void;
    renderSpacer(): HTMLDivElement | HTMLSpanElement;
    renderContent(): HTMLDivElement | HTMLSpanElement;
}
