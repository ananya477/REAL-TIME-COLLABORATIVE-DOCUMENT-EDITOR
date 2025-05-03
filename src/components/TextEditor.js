import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function TextEditor({ content, onChange }) {
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, 3, false] }],
            ['clean']
        ]
    };

    return (
        <div className="editor-container">
            <ReactQuill
                theme="snow"
                value={content}
                onChange={onChange}
                modules={modules}
                className="quill-editor"
            />
        </div>
    );
}

export default TextEditor;