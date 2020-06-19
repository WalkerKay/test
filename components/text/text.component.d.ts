import { OnInit, ElementRef, ChangeDetectorRef, NgZone, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { Node, Editor, Block, Decoration, Text, Annotation, Mark } from 'slate';
import { List } from 'immutable';
import { ChildNodeBase } from '../../core/child-node-base';
import { SlaLeafRenderConfig } from '../../core/render-plugin/render-config';
export declare const textBinding: any;
export declare class SlaTextComponent extends ChildNodeBase implements OnInit, OnChanges, DoCheck {
    private elementRef;
    private cdr;
    private ngZone;
    rootNode: HTMLElement;
    lastContentElement: HTMLElement;
    node: Text;
    leaves: List<any>;
    offsets: any[];
    editor: Editor;
    parent: Node;
    block: Block;
    slaTextNode: Text;
    offsetKey: any;
    isZeroWidthString: boolean;
    zeroWidthStringLength: number;
    isLineBreak: boolean;
    isTrailing: boolean;
    leafContainer: ElementRef;
    constructor(elementRef: ElementRef, cdr: ChangeDetectorRef, ngZone: NgZone);
    ngOnInit(): void;
    ngOnChanges(simpleChanges: SimpleChanges): void;
    renderLeaf(): void;
    detectTextTemplate(): void;
    private setZeroWidthElement;
    buildConfig(attributes: {
        [key: string]: string;
    }, children: HTMLElement, annotation?: Annotation, decoration?: Decoration, mark?: Mark): SlaLeafRenderConfig;
    ngDoCheck(): void;
}
