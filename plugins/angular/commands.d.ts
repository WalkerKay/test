declare class CommandsPlugin {
    static reconcileNode(editor: any, node: any): void;
    static reconcileDOMNode(editor: any, domNode: any): void;
    static removeMarkOrigin(editor: any, mark: any): void;
    static removeMark(editor: any, mark: any): void;
    static addMark(editor: any, mark: any): void;
}
declare const _default: {
    commands: typeof CommandsPlugin;
};
export default _default;
