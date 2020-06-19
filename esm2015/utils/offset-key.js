/**
 * Offset key parser regex.
 *
 * @type {RegExp}
 */
const PARSER = /^([\w-]+)(?::(\d+))?$/;
/**
 * Parse an offset key `string`.
 *
 * @param {String} string
 * @return {Object}
 */
function parse(value) {
    const matches = PARSER.exec(value);
    if (!matches) {
        throw new Error(`Invalid offset key string "${value}".`);
    }
    const [original, key, index] = matches; // eslint-disable-line no-unused-vars
    return {
        key,
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
    return `${object.key}:${object.index}`;
}
/**
 * Export.
 *
 * @type {Object}
 */
export default {
    parse,
    stringify
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2Zmc2V0LWtleS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL0BuZ3gtc2xhdGUvY29yZS8iLCJzb3VyY2VzIjpbInV0aWxzL29mZnNldC1rZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUVILE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDO0FBRXZDOzs7OztHQUtHO0FBRUgsU0FBUyxLQUFLLENBQUMsS0FBYTtJQUN4QixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5DLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixLQUFLLElBQUksQ0FBQyxDQUFDO0tBQzVEO0lBRUQsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMscUNBQXFDO0lBQzdFLE9BQU87UUFDSCxHQUFHO1FBQ0gsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO0tBQzdCLENBQUM7QUFDTixDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUVILFNBQVMsU0FBUyxDQUFDLE1BQU07SUFDckIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNDLENBQUM7QUFFRDs7OztHQUlHO0FBRUgsZUFBZTtJQUNYLEtBQUs7SUFDTCxTQUFTO0NBQ1osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT2Zmc2V0IGtleSBwYXJzZXIgcmVnZXguXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xuXG5jb25zdCBQQVJTRVIgPSAvXihbXFx3LV0rKSg/OjooXFxkKykpPyQvO1xuXG4vKipcbiAqIFBhcnNlIGFuIG9mZnNldCBrZXkgYHN0cmluZ2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZ1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHZhbHVlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBtYXRjaGVzID0gUEFSU0VSLmV4ZWModmFsdWUpO1xuXG4gICAgaWYgKCFtYXRjaGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBvZmZzZXQga2V5IHN0cmluZyBcIiR7dmFsdWV9XCIuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgW29yaWdpbmFsLCBrZXksIGluZGV4XSA9IG1hdGNoZXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICByZXR1cm4ge1xuICAgICAgICBrZXksXG4gICAgICAgIGluZGV4OiBwYXJzZUludChpbmRleCwgMTApXG4gICAgfTtcbn1cblxuLyoqXG4gKiBTdHJpbmdpZnkgYW4gb2Zmc2V0IGtleSBgb2JqZWN0YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiAgIEBwcm9wZXJ0eSB7U3RyaW5nfSBrZXlcbiAqICAgQHByb3BlcnR5IHtOdW1iZXJ9IGluZGV4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gc3RyaW5naWZ5KG9iamVjdCkge1xuICAgIHJldHVybiBgJHtvYmplY3Qua2V5fToke29iamVjdC5pbmRleH1gO1xufVxuXG4vKipcbiAqIEV4cG9ydC5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBwYXJzZSxcbiAgICBzdHJpbmdpZnlcbn07XG4iXX0=