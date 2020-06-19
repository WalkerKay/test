import EditorPropsPlugin from './editor-props';
import DOMPlugin from '../dom';
import CommandsPlugin from './commands';
import QueriesPlugin from './queries';
/**
 * A plugin that adds the React-specific rendering logic to the editor.
 *
 * @param {Object} options
 * @return {Object}
 */
function AngularPlugin(options = {}) {
    const editorPropsPlugin = EditorPropsPlugin(options);
    const domPlugin = DOMPlugin(options);
    return [editorPropsPlugin, domPlugin, CommandsPlugin, QueriesPlugin];
}
/**
 * Export.
 *
 * @type {Function}
 */
export default AngularPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJwbHVnaW5zL2FuZ3VsYXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxpQkFBaUIsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvQyxPQUFPLFNBQVMsTUFBTSxRQUFRLENBQUM7QUFDL0IsT0FBTyxjQUFjLE1BQU0sWUFBWSxDQUFDO0FBQ3hDLE9BQU8sYUFBYSxNQUFNLFdBQVcsQ0FBQztBQUV0Qzs7Ozs7R0FLRztBQUVILFNBQVMsYUFBYSxDQUFDLE9BQU8sR0FBRyxFQUFFO0lBQy9CLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3pFLENBQUM7QUFFRDs7OztHQUlHO0FBRUgsZUFBZSxhQUFhLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRWRpdG9yUHJvcHNQbHVnaW4gZnJvbSAnLi9lZGl0b3ItcHJvcHMnO1xuaW1wb3J0IERPTVBsdWdpbiBmcm9tICcuLi9kb20nO1xuaW1wb3J0IENvbW1hbmRzUGx1Z2luIGZyb20gJy4vY29tbWFuZHMnO1xuaW1wb3J0IFF1ZXJpZXNQbHVnaW4gZnJvbSAnLi9xdWVyaWVzJztcblxuLyoqXG4gKiBBIHBsdWdpbiB0aGF0IGFkZHMgdGhlIFJlYWN0LXNwZWNpZmljIHJlbmRlcmluZyBsb2dpYyB0byB0aGUgZWRpdG9yLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gQW5ndWxhclBsdWdpbihvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBlZGl0b3JQcm9wc1BsdWdpbiA9IEVkaXRvclByb3BzUGx1Z2luKG9wdGlvbnMpO1xuICAgIGNvbnN0IGRvbVBsdWdpbiA9IERPTVBsdWdpbihvcHRpb25zKTtcbiAgICByZXR1cm4gW2VkaXRvclByb3BzUGx1Z2luLCBkb21QbHVnaW4sIENvbW1hbmRzUGx1Z2luLCBRdWVyaWVzUGx1Z2luXTtcbn1cblxuLyoqXG4gKiBFeHBvcnQuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG5cbmV4cG9ydCBkZWZhdWx0IEFuZ3VsYXJQbHVnaW47XG4iXX0=