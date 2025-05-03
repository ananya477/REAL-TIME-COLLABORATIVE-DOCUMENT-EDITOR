import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Document() {
    const { id } = useParams();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('Untitled Document');

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, 3, false] }],
            ['clean']
        ]
    };

    const formats = [
        'bold', 'italic', 'underline',
        'header'
    ];

    return (
        <div className="document-container">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="document-title"
            />
            <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
            />
        </div>
    );
}

export default Document;