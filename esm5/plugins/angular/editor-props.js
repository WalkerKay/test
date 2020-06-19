import * as tslib_1 from "tslib";
import EVENT_HANDLERS from '../../constants/event-handlers';
var PROPS = tslib_1.__spread(EVENT_HANDLERS, [
    'commands',
    'decorateNode',
    'queries',
    'renderAnnotation',
    'renderBlock',
    'renderDecoration',
    'renderDocument',
    'renderEditor',
    'renderInline',
    'renderMark',
    'schema'
]);
function EditorPropsPlugin(options) {
    if (options === void 0) { options = {}; }
    var plugin = PROPS.reduce(function (memo, prop) {
        if (prop in options) {
            if (options[prop]) {
                memo[prop] = options[prop];
            }
        }
        return memo;
    }, {});
    return plugin;
}
export default EditorPropsPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLXByb3BzLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsicGx1Z2lucy9hbmd1bGFyL2VkaXRvci1wcm9wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxjQUFjLE1BQU0sZ0NBQWdDLENBQUM7QUFFNUQsSUFBTSxLQUFLLG9CQUNKLGNBQWM7SUFDakIsVUFBVTtJQUNWLGNBQWM7SUFDZCxTQUFTO0lBQ1Qsa0JBQWtCO0lBQ2xCLGFBQWE7SUFDYixrQkFBa0I7SUFDbEIsZ0JBQWdCO0lBQ2hCLGNBQWM7SUFDZCxjQUFjO0lBQ2QsWUFBWTtJQUNaLFFBQVE7RUFDWCxDQUFDO0FBRUYsU0FBUyxpQkFBaUIsQ0FBQyxPQUFZO0lBQVosd0JBQUEsRUFBQSxZQUFZO0lBQ25DLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLEVBQUUsSUFBSTtRQUNuQyxJQUFJLElBQUksSUFBSSxPQUFPLEVBQUU7WUFDakIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM5QjtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQUVELGVBQWUsaUJBQWlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRVZFTlRfSEFORExFUlMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL2V2ZW50LWhhbmRsZXJzJztcblxuY29uc3QgUFJPUFMgPSBbXG4gICAgLi4uRVZFTlRfSEFORExFUlMsXG4gICAgJ2NvbW1hbmRzJyxcbiAgICAnZGVjb3JhdGVOb2RlJyxcbiAgICAncXVlcmllcycsXG4gICAgJ3JlbmRlckFubm90YXRpb24nLFxuICAgICdyZW5kZXJCbG9jaycsXG4gICAgJ3JlbmRlckRlY29yYXRpb24nLFxuICAgICdyZW5kZXJEb2N1bWVudCcsXG4gICAgJ3JlbmRlckVkaXRvcicsXG4gICAgJ3JlbmRlcklubGluZScsXG4gICAgJ3JlbmRlck1hcmsnLFxuICAgICdzY2hlbWEnXG5dO1xuXG5mdW5jdGlvbiBFZGl0b3JQcm9wc1BsdWdpbihvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBwbHVnaW4gPSBQUk9QUy5yZWR1Y2UoKG1lbW8sIHByb3ApID0+IHtcbiAgICAgICAgaWYgKHByb3AgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNbcHJvcF0pIHtcbiAgICAgICAgICAgICAgICBtZW1vW3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9LCB7fSk7XG5cbiAgICByZXR1cm4gcGx1Z2luO1xufVxuXG5leHBvcnQgZGVmYXVsdCBFZGl0b3JQcm9wc1BsdWdpbjtcbiJdfQ==