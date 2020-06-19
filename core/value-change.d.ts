import { Operation, Value } from 'slate';
import { List } from 'immutable';
export declare class ValueChange {
    operations: List<Operation>;
    value: Value;
}
