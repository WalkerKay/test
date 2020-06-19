import * as tslib_1 from "tslib";
import AfterPlugin from './after';
import BeforePlugin from './before';
function DOMPlugin(options) {
    if (options === void 0) { options = {}; }
    var _a = options.plugins, plugins = _a === void 0 ? [] : _a;
    // COMPAT: Add Android specific handling separately before it gets to the
    // other plugins because it is specific (other browser don't need it) and
    // finicky (it has to come before other plugins to work).
    // const androidPlugins = IS_ANDROID
    //   ? [AndroidPlugin(options), NoopPlugin(options)]
    //   : [];
    return tslib_1.__spread([BeforePlugin], plugins, [AfterPlugin]);
}
export default DOMPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJwbHVnaW5zL2RvbS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxXQUFXLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLFVBQVUsQ0FBQztBQUVwQyxTQUFTLFNBQVMsQ0FBQyxPQUFpQjtJQUFqQix3QkFBQSxFQUFBLFlBQWlCO0lBQ3hCLElBQUEsb0JBQVksRUFBWixpQ0FBWSxDQUFhO0lBQ2pDLHlFQUF5RTtJQUN6RSx5RUFBeUU7SUFDekUseURBQXlEO0lBQ3pELG9DQUFvQztJQUNwQyxvREFBb0Q7SUFDcEQsVUFBVTtJQUVWLHlCQUFRLFlBQVksR0FBSyxPQUFPLEdBQUUsV0FBVyxHQUFFO0FBQ25ELENBQUM7QUFFRCxlQUFlLFNBQVMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBZnRlclBsdWdpbiBmcm9tICcuL2FmdGVyJztcbmltcG9ydCBCZWZvcmVQbHVnaW4gZnJvbSAnLi9iZWZvcmUnO1xuXG5mdW5jdGlvbiBET01QbHVnaW4ob3B0aW9uczogYW55ID0ge30pIHtcbiAgICBjb25zdCB7IHBsdWdpbnMgPSBbXSB9ID0gb3B0aW9ucztcbiAgICAvLyBDT01QQVQ6IEFkZCBBbmRyb2lkIHNwZWNpZmljIGhhbmRsaW5nIHNlcGFyYXRlbHkgYmVmb3JlIGl0IGdldHMgdG8gdGhlXG4gICAgLy8gb3RoZXIgcGx1Z2lucyBiZWNhdXNlIGl0IGlzIHNwZWNpZmljIChvdGhlciBicm93c2VyIGRvbid0IG5lZWQgaXQpIGFuZFxuICAgIC8vIGZpbmlja3kgKGl0IGhhcyB0byBjb21lIGJlZm9yZSBvdGhlciBwbHVnaW5zIHRvIHdvcmspLlxuICAgIC8vIGNvbnN0IGFuZHJvaWRQbHVnaW5zID0gSVNfQU5EUk9JRFxuICAgIC8vICAgPyBbQW5kcm9pZFBsdWdpbihvcHRpb25zKSwgTm9vcFBsdWdpbihvcHRpb25zKV1cbiAgICAvLyAgIDogW107XG5cbiAgICByZXR1cm4gW0JlZm9yZVBsdWdpbiwgLi4ucGx1Z2lucywgQWZ0ZXJQbHVnaW5dO1xufVxuXG5leHBvcnQgZGVmYXVsdCBET01QbHVnaW47XG4iXX0=