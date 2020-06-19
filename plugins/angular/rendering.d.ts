import { SlaNodeRenderConfig } from '../../core/render-plugin/render-config';
import { SlaPluginRenderService } from '../../core/render-plugin/plugin-render-service';
export declare class Rendering {
    private slaPluginRenderService;
    constructor(slaPluginRenderService: SlaPluginRenderService);
    renderBlock: (config: SlaNodeRenderConfig) => HTMLElement;
    renderDocument: (config: SlaNodeRenderConfig) => HTMLElement;
    renderInline: (config: SlaNodeRenderConfig) => HTMLElement;
}
