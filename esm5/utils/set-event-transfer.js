import TRANSFER_TYPES from '../constants/transfer-types';
/**
 * The default plain text transfer type.
 *
 * @type {String}
 */
var TEXT = TRANSFER_TYPES.TEXT;
/**
 * Set data with `type` and `content` on an `event`.
 *
 * COMPAT: In Edge, custom types throw errors, so embed all non-standard
 * types in text/plain compound object. (2017/7/12)
 *
 * @param {Event} event
 * @param {String} type
 * @param {String} content
 */
function setEventTransfer(event, type, content) {
    var mime = TRANSFER_TYPES[type.toUpperCase()];
    if (!mime) {
        throw new Error("Cannot set unknown transfer type \"" + mime + "\".");
    }
    if (event.nativeEvent) {
        event = event.nativeEvent;
    }
    var transfer = event.dataTransfer || event.clipboardData;
    try {
        transfer.setData(mime, content);
        // COMPAT: Safari needs to have the 'text' (and not 'text/plain') value in dataTransfer
        // to display the cursor while dragging internally.
        transfer.setData('text', transfer.getData('text'));
    }
    catch (err) {
        var prefix = 'SLATE-DATA-EMBED::';
        var text = transfer.getData(TEXT);
        var obj = {};
        // If the existing plain text data is prefixed, it's Slate JSON data.
        if (text.substring(0, prefix.length) === prefix) {
            try {
                obj = JSON.parse(text.substring(prefix.length));
            }
            catch (e) {
                throw new Error('Failed to parse Slate data from `DataTransfer` object.');
            }
        }
        else {
            // Otherwise, it's just set it as is.
            obj[TEXT] = text;
        }
        obj[mime] = content;
        var stringData = "" + prefix + JSON.stringify(obj);
        transfer.setData(TEXT, stringData);
    }
}
/**
 * Export.
 *
 * @type {Function}
 */
export default setEventTransfer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0LWV2ZW50LXRyYW5zZmVyLmpzIiwic291cmNlUm9vdCI6Im5nOi8vQG5neC1zbGF0ZS9jb3JlLyIsInNvdXJjZXMiOlsidXRpbHMvc2V0LWV2ZW50LXRyYW5zZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sY0FBYyxNQUFNLDZCQUE2QixDQUFDO0FBRXpEOzs7O0dBSUc7QUFFSyxJQUFBLDBCQUFJLENBQW9CO0FBRWhDOzs7Ozs7Ozs7R0FTRztBQUVILFNBQVMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPO0lBQzFDLElBQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUVoRCxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBcUMsSUFBSSxRQUFJLENBQUMsQ0FBQztLQUNsRTtJQUVELElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtRQUNuQixLQUFLLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztLQUM3QjtJQUVELElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQztJQUUzRCxJQUFJO1FBQ0EsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEMsdUZBQXVGO1FBQ3ZGLG1EQUFtRDtRQUNuRCxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDdEQ7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLElBQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDO1FBQ3BDLElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBRWIscUVBQXFFO1FBQ3JFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLE1BQU0sRUFBRTtZQUM3QyxJQUFJO2dCQUNBLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDbkQ7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixNQUFNLElBQUksS0FBSyxDQUNYLHdEQUF3RCxDQUMzRCxDQUFDO2FBQ0w7U0FDSjthQUFNO1lBQ0gscUNBQXFDO1lBQ3JDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDcEI7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3BCLElBQU0sVUFBVSxHQUFHLEtBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLENBQUM7UUFDckQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdEM7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUVILGVBQWUsZ0JBQWdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVFJBTlNGRVJfVFlQRVMgZnJvbSAnLi4vY29uc3RhbnRzL3RyYW5zZmVyLXR5cGVzJztcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBwbGFpbiB0ZXh0IHRyYW5zZmVyIHR5cGUuXG4gKlxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuXG5jb25zdCB7IFRFWFQgfSA9IFRSQU5TRkVSX1RZUEVTO1xuXG4vKipcbiAqIFNldCBkYXRhIHdpdGggYHR5cGVgIGFuZCBgY29udGVudGAgb24gYW4gYGV2ZW50YC5cbiAqXG4gKiBDT01QQVQ6IEluIEVkZ2UsIGN1c3RvbSB0eXBlcyB0aHJvdyBlcnJvcnMsIHNvIGVtYmVkIGFsbCBub24tc3RhbmRhcmRcbiAqIHR5cGVzIGluIHRleHQvcGxhaW4gY29tcG91bmQgb2JqZWN0LiAoMjAxNy83LzEyKVxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtTdHJpbmd9IGNvbnRlbnRcbiAqL1xuXG5mdW5jdGlvbiBzZXRFdmVudFRyYW5zZmVyKGV2ZW50LCB0eXBlLCBjb250ZW50KSB7XG4gICAgY29uc3QgbWltZSA9IFRSQU5TRkVSX1RZUEVTW3R5cGUudG9VcHBlckNhc2UoKV07XG5cbiAgICBpZiAoIW1pbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgc2V0IHVua25vd24gdHJhbnNmZXIgdHlwZSBcIiR7bWltZX1cIi5gKTtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnQubmF0aXZlRXZlbnQpIHtcbiAgICAgICAgZXZlbnQgPSBldmVudC5uYXRpdmVFdmVudDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2ZlciA9IGV2ZW50LmRhdGFUcmFuc2ZlciB8fCBldmVudC5jbGlwYm9hcmREYXRhO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGF0YShtaW1lLCBjb250ZW50KTtcbiAgICAgICAgLy8gQ09NUEFUOiBTYWZhcmkgbmVlZHMgdG8gaGF2ZSB0aGUgJ3RleHQnIChhbmQgbm90ICd0ZXh0L3BsYWluJykgdmFsdWUgaW4gZGF0YVRyYW5zZmVyXG4gICAgICAgIC8vIHRvIGRpc3BsYXkgdGhlIGN1cnNvciB3aGlsZSBkcmFnZ2luZyBpbnRlcm5hbGx5LlxuICAgICAgICB0cmFuc2Zlci5zZXREYXRhKCd0ZXh0JywgdHJhbnNmZXIuZ2V0RGF0YSgndGV4dCcpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgcHJlZml4ID0gJ1NMQVRFLURBVEEtRU1CRUQ6Oic7XG4gICAgICAgIGNvbnN0IHRleHQgPSB0cmFuc2Zlci5nZXREYXRhKFRFWFQpO1xuICAgICAgICBsZXQgb2JqID0ge307XG5cbiAgICAgICAgLy8gSWYgdGhlIGV4aXN0aW5nIHBsYWluIHRleHQgZGF0YSBpcyBwcmVmaXhlZCwgaXQncyBTbGF0ZSBKU09OIGRhdGEuXG4gICAgICAgIGlmICh0ZXh0LnN1YnN0cmluZygwLCBwcmVmaXgubGVuZ3RoKSA9PT0gcHJlZml4KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIG9iaiA9IEpTT04ucGFyc2UodGV4dC5zdWJzdHJpbmcocHJlZml4Lmxlbmd0aCkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBwYXJzZSBTbGF0ZSBkYXRhIGZyb20gYERhdGFUcmFuc2ZlcmAgb2JqZWN0LidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdzIGp1c3Qgc2V0IGl0IGFzIGlzLlxuICAgICAgICAgICAgb2JqW1RFWFRdID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialttaW1lXSA9IGNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHN0cmluZ0RhdGEgPSBgJHtwcmVmaXh9JHtKU09OLnN0cmluZ2lmeShvYmopfWA7XG4gICAgICAgIHRyYW5zZmVyLnNldERhdGEoVEVYVCwgc3RyaW5nRGF0YSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEV4cG9ydC5cbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgc2V0RXZlbnRUcmFuc2ZlcjtcbiJdfQ==