import { IS_IE } from 'slate-dev-environment';
/**
 * Cross-browser remove all ranges from a `domSelection`.
 *
 * @param {Selection} domSelection
 */
function removeAllRanges(domSelection) {
    // COMPAT: In IE 11, if the selection contains nested tables, then
    // `removeAllRanges` will throw an error.
    if (IS_IE) {
        const range = window.document.body.createTextRange();
        range.collapse();
        range.select();
    }
    else {
        domSelection.removeAllRanges();
    }
}
/**
 * Export.
 *
 * @type {Function}
 */
export default removeAllRanges;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLWFsbC1yYW5nZXMuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9Abmd4LXNsYXRlL2NvcmUvIiwic291cmNlcyI6WyJ1dGlscy9yZW1vdmUtYWxsLXJhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFOUM7Ozs7R0FJRztBQUVILFNBQVMsZUFBZSxDQUFDLFlBQVk7SUFDakMsa0VBQWtFO0lBQ2xFLHlDQUF5QztJQUN6QyxJQUFJLEtBQUssRUFBRTtRQUNQLE1BQU0sS0FBSyxHQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzlELEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDbEI7U0FBTTtRQUNILFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUNsQztBQUNMLENBQUM7QUFFRDs7OztHQUlHO0FBRUgsZUFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJU19JRSB9IGZyb20gJ3NsYXRlLWRldi1lbnZpcm9ubWVudCc7XG5cbi8qKlxuICogQ3Jvc3MtYnJvd3NlciByZW1vdmUgYWxsIHJhbmdlcyBmcm9tIGEgYGRvbVNlbGVjdGlvbmAuXG4gKlxuICogQHBhcmFtIHtTZWxlY3Rpb259IGRvbVNlbGVjdGlvblxuICovXG5cbmZ1bmN0aW9uIHJlbW92ZUFsbFJhbmdlcyhkb21TZWxlY3Rpb24pIHtcbiAgICAvLyBDT01QQVQ6IEluIElFIDExLCBpZiB0aGUgc2VsZWN0aW9uIGNvbnRhaW5zIG5lc3RlZCB0YWJsZXMsIHRoZW5cbiAgICAvLyBgcmVtb3ZlQWxsUmFuZ2VzYCB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgIGlmIChJU19JRSkge1xuICAgICAgICBjb25zdCByYW5nZSA9ICh3aW5kb3cuZG9jdW1lbnQuYm9keSBhcyBhbnkpLmNyZWF0ZVRleHRSYW5nZSgpO1xuICAgICAgICByYW5nZS5jb2xsYXBzZSgpO1xuICAgICAgICByYW5nZS5zZWxlY3QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkb21TZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEV4cG9ydC5cbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgcmVtb3ZlQWxsUmFuZ2VzO1xuIl19