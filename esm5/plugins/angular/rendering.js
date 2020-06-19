import { SlaPluginRenderService } from '../../core/render-plugin/plugin-render-service';
import { Injectable } from '@angular/core';
var Rendering = /** @class */ (function () {
    function Rendering(slaPluginRenderService) {
        var _this = this;
        this.slaPluginRenderService = slaPluginRenderService;
        this.renderBlock = function (config) {
            return _this.slaPluginRenderService.renderDom('div', config.children, config.attributes, { position: 'relative' });
        };
        this.renderDocument = function (config) {
            return _this.slaPluginRenderService.renderDom('div', config.children, config.attributes);
        };
        this.renderInline = function (config) {
            return _this.slaPluginRenderService.renderDom('span', config.children, config.attributes);
        };
    }
    Rendering.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    Rendering.ctorParameters = function () { return [
        { type: SlaPluginRenderService }
    ]; };
    return Rendering;
}());
export { Rendering };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyaW5nLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsicGx1Z2lucy9hbmd1bGFyL3JlbmRlcmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxnREFBZ0QsQ0FBQztBQUN4RixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDO0lBRUksbUJBQW9CLHNCQUE4QztRQUFsRSxpQkFBc0U7UUFBbEQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtRQUVsRSxnQkFBVyxHQUFHLFVBQUMsTUFBMkI7WUFDdEMsT0FBTyxLQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN0SCxDQUFDLENBQUM7UUFFRixtQkFBYyxHQUFHLFVBQUMsTUFBMkI7WUFDekMsT0FBTyxLQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1RixDQUFDLENBQUM7UUFFRixpQkFBWSxHQUFHLFVBQUMsTUFBMkI7WUFDdkMsT0FBTyxLQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3RixDQUFDLENBQUM7SUFabUUsQ0FBQzs7Z0JBRnpFLFVBQVU7Ozs7Z0JBSEYsc0JBQXNCOztJQWtCL0IsZ0JBQUM7Q0FBQSxBQWZELElBZUM7U0FkWSxTQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2xhTm9kZVJlbmRlckNvbmZpZyB9IGZyb20gJy4uLy4uL2NvcmUvcmVuZGVyLXBsdWdpbi9yZW5kZXItY29uZmlnJztcbmltcG9ydCB7IFNsYVBsdWdpblJlbmRlclNlcnZpY2UgfSBmcm9tICcuLi8uLi9jb3JlL3JlbmRlci1wbHVnaW4vcGx1Z2luLXJlbmRlci1zZXJ2aWNlJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFJlbmRlcmluZyB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBzbGFQbHVnaW5SZW5kZXJTZXJ2aWNlOiBTbGFQbHVnaW5SZW5kZXJTZXJ2aWNlKSB7fVxuXG4gICAgcmVuZGVyQmxvY2sgPSAoY29uZmlnOiBTbGFOb2RlUmVuZGVyQ29uZmlnKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnNsYVBsdWdpblJlbmRlclNlcnZpY2UucmVuZGVyRG9tKCdkaXYnLCBjb25maWcuY2hpbGRyZW4sIGNvbmZpZy5hdHRyaWJ1dGVzLCB7IHBvc2l0aW9uOiAncmVsYXRpdmUnIH0pO1xuICAgIH07XG5cbiAgICByZW5kZXJEb2N1bWVudCA9IChjb25maWc6IFNsYU5vZGVSZW5kZXJDb25maWcpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2xhUGx1Z2luUmVuZGVyU2VydmljZS5yZW5kZXJEb20oJ2RpdicsIGNvbmZpZy5jaGlsZHJlbiwgY29uZmlnLmF0dHJpYnV0ZXMpO1xuICAgIH07XG5cbiAgICByZW5kZXJJbmxpbmUgPSAoY29uZmlnOiBTbGFOb2RlUmVuZGVyQ29uZmlnKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnNsYVBsdWdpblJlbmRlclNlcnZpY2UucmVuZGVyRG9tKCdzcGFuJywgY29uZmlnLmNoaWxkcmVuLCBjb25maWcuYXR0cmlidXRlcyk7XG4gICAgfTtcbn1cbiJdfQ==