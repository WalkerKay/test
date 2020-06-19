/**
 * Offset key parser regex.
 *
 * @type {RegExp}
 */
import * as tslib_1 from "tslib";
var PARSER = /^([\w-]+)(?::(\d+))?$/;
/**
 * Parse an offset key `string`.
 *
 * @param {String} string
 * @return {Object}
 */
function parse(value) {
    var matches = PARSER.exec(value);
    if (!matches) {
        throw new Error("Invalid offset key string \"" + value + "\".");
    }
    var _a = tslib_1.__read(matches, 3), original = _a[0], key = _a[1], index = _a[2]; // eslint-disable-line no-unused-vars
    return {
        key: key,
        index: parseInt(index, 10)
    };
}
/**
 * Stringify an offset key `object`.
 *
 * @param {Object} object
 *   @property {String} key
 *   @property {Number} index
 * @return {String}
 */
function stringify(object) {
    return object.key + ":" + object.index;
}
/**
 * Export.
 *
 * @type {Object}
 */
export default {
    parse: parse,
    stringify: stringify
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2Zmc2V0LWtleS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInV0aWxzL29mZnNldC1rZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRzs7QUFFSCxJQUFNLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQztBQUV2Qzs7Ozs7R0FLRztBQUVILFNBQVMsS0FBSyxDQUFDLEtBQWE7SUFDeEIsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBOEIsS0FBSyxRQUFJLENBQUMsQ0FBQztLQUM1RDtJQUVLLElBQUEsK0JBQWdDLEVBQS9CLGdCQUFRLEVBQUUsV0FBRyxFQUFFLGFBQWdCLENBQUMsQ0FBQyxxQ0FBcUM7SUFDN0UsT0FBTztRQUNILEdBQUcsS0FBQTtRQUNILEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztLQUM3QixDQUFDO0FBQ04sQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFFSCxTQUFTLFNBQVMsQ0FBQyxNQUFNO0lBQ3JCLE9BQVUsTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsS0FBTyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7OztHQUlHO0FBRUgsZUFBZTtJQUNYLEtBQUssT0FBQTtJQUNMLFNBQVMsV0FBQTtDQUNaLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9mZnNldCBrZXkgcGFyc2VyIHJlZ2V4LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cblxuY29uc3QgUEFSU0VSID0gL14oW1xcdy1dKykoPzo6KFxcZCspKT8kLztcblxuLyoqXG4gKiBQYXJzZSBhbiBvZmZzZXQga2V5IGBzdHJpbmdgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IFBBUlNFUi5leGVjKHZhbHVlKTtcblxuICAgIGlmICghbWF0Y2hlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgb2Zmc2V0IGtleSBzdHJpbmcgXCIke3ZhbHVlfVwiLmApO1xuICAgIH1cblxuICAgIGNvbnN0IFtvcmlnaW5hbCwga2V5LCBpbmRleF0gPSBtYXRjaGVzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgcmV0dXJuIHtcbiAgICAgICAga2V5LFxuICAgICAgICBpbmRleDogcGFyc2VJbnQoaW5kZXgsIDEwKVxuICAgIH07XG59XG5cbi8qKlxuICogU3RyaW5naWZ5IGFuIG9mZnNldCBrZXkgYG9iamVjdGAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICogICBAcHJvcGVydHkge1N0cmluZ30ga2V5XG4gKiAgIEBwcm9wZXJ0eSB7TnVtYmVyfSBpbmRleFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZ2lmeShvYmplY3QpIHtcbiAgICByZXR1cm4gYCR7b2JqZWN0LmtleX06JHtvYmplY3QuaW5kZXh9YDtcbn1cblxuLyoqXG4gKiBFeHBvcnQuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgcGFyc2UsXG4gICAgc3RyaW5naWZ5XG59O1xuIl19