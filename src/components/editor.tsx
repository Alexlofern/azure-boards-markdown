import * as React from "react";
import * as ReactDOM from "react-dom";

import * as Dropzone from "react-dropzone";

import { ActionsCreator } from "../actions/actionsCreators";
import { SizeMode } from "../model/model";

export interface IEditorProps {
    actionsCreator: ActionsCreator;

    markdownContent: string;
    sizeMode: SizeMode;
    canGrow: boolean;

    selection: [number, number];
}

export interface IEditorState {
}

const heightAdjustmentInPx = 20;

export class EditorComponent extends React.Component<IEditorProps, IEditorState> {
    private _value: string;

    private _textarea: HTMLTextAreaElement;
    private _resolveTextarea = (el: HTMLTextAreaElement) => {
        this._textarea = el;
    }

    private _dropZone: any;
    private _resolveDropZone = (dropZone: any) => {
        this._dropZone = dropZone;
    }

    private _lastHeight: number;

    constructor(props: IEditorProps) {
        super(props);

        this.state = {};
    }

    public render(): JSX.Element {
        return <div className="editor">
            <Dropzone
                onDrop={this._onDrop}
                disableClick={true}
                disablePreview={true}
                style={{}}
                className="drop-zone"
                activeClassName="drop-active"
                accept="image/*"
                ref={this._resolveDropZone}>
                <textarea
                    value={this.props.markdownContent}
                    onChange={this._onChange}
                    onSelect={this._onSelect}
                    onPaste={this._onPaste}
                    ref={this._resolveTextarea}></textarea>
                <div className="upload-hint">Drop to upload and insert images</div>
            </Dropzone>
        </div>;
    }

    public openFileSelector() {
        if (this._dropZone) {
            (this._dropZone as any).open();
        }
    }

    public componentDidMount() {
        this._onSizeChange();
    }

    public componentWillReceiveProps(nextProps: IEditorProps) {
        if (this.props.sizeMode !== nextProps.sizeMode && nextProps.sizeMode === SizeMode.AutoGrow) {
            this._onSizeChange(true);
        }
    }

    public shouldComponentUpdate(nextProps: IEditorProps): boolean {
        return this.props.markdownContent !== nextProps.markdownContent
            || this.props.sizeMode !== nextProps.sizeMode
            || this.props.canGrow !== nextProps.canGrow
            || this.props.actionsCreator !== nextProps.actionsCreator            
            || (EditorComponent._isValidSelection(nextProps.selection) && this._textarea && this._textarea.selectionStart !== nextProps.selection[0] && this._textarea.selectionEnd !== nextProps[1]);
    }

    private static _isValidSelection(selection: [number, number]): boolean {
        return selection && selection[0] != null && selection[1] != null && selection[0] !== selection[1];
    }

    public componentDidUpdate() {
        // Restore selection if requested    
        if (this.props.selection && this._textarea) {
            let [selectionStart, selectionEnd] = this.props.selection;

            if (selectionStart != null && selectionEnd != null && selectionEnd - selectionStart > 0) {
                this._textarea.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }

    private _onDrop = (files) => {
        this.props.actionsCreator.upload(files.map(file => ({
            fileName: file.name,
            filePath: file.path,
            file: file
        })));
    }

    private _onSizeChange(force?: boolean) {
        if (force || this.props.sizeMode === SizeMode.AutoGrow) {
            if (this._textarea) {
                // To force the textarea to resize, set height to auto, let it resize, grab scrollheight, and then back
                // to default
                const oldHeight = this._textarea.style.height;
                this._textarea.style.height = "auto";
                // Hide vertical scrollbar, otherwise we might get different line-breaks than in the full view
                this._textarea.style.overflow = "hidden";
                const scrollHeight = this._textarea.scrollHeight + heightAdjustmentInPx;
                this._textarea.style.height = oldHeight;
                // Reset vertical scrolling behavior
                this._textarea.style.overflow = "";

                if (force || !this._lastHeight || this._lastHeight !== scrollHeight) {
                    // Fire action if something changed
                    this.props.actionsCreator.resize(scrollHeight);
                    this._lastHeight = scrollHeight;
                }
            }
        } else {
            this._lastHeight = null;
        }
    }

    private _onChange = (event) => {
        this.props.actionsCreator.setMarkdownContent(event.target.value);

        this._fireSelection();

        this._onSizeChange();
    };

    private _fireSelection() {
        const selectionStart = this._textarea.selectionStart;
        const selectionEnd = this._textarea.selectionEnd;

        if (this._textarea) {
            if (this.props.selection[0] !== selectionStart || this.props.selection[1] !== selectionEnd) {
                this.props.actionsCreator.changeSelection(selectionStart, selectionEnd);
            }
        }
    }

    private _onSelect = () => {
        this._fireSelection();
    }

    private _onPaste = () => {
        if (this._textarea) {
            // Change seletion to be single char
            this.props.actionsCreator.changeSelection(this._textarea.selectionEnd, this._textarea.selectionEnd);
        }
    }
}