import { ComponentFactoryResolver } from '@angular/core';
import { SlaNodeRenderConfig, SlaNestedNodeRef } from './render-config';
import { ComponentType } from '@angular/cdk/portal';
export declare class SlaPluginRenderService {
    private cfr;
    constructor(cfr: ComponentFactoryResolver);
    renderDom(tagName: string, children: any, attributes: {
        [key: string]: string;
    }, styles?: {
        [key: string]: string;
    }): HTMLElement;
    renderComponent(componentType: ComponentType<any>, config: SlaNodeRenderConfig): SlaNestedNodeRef;
    private setNodeAttributes;
    private setNodeStyles;
    private getComponentRootNode;
}
