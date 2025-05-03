import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Editor() {
    const { id: documentId } = useParams();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const quillRef = useRef(null);

    useEffect(() => {
        const loadDocument = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5002/api/documents/${documentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) throw new Error('Failed to load document');
                const doc = await response.json();
                setTitle(doc.title || 'Untitled Document');
                setContent(doc.content || '');
            } catch (error) {
                console.error('Load error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (documentId) {
            loadDocument();
        }
    }, [documentId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5002/api/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title || 'Untitled Document',
                    content: content || ''
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save document');
            }

            const data = await response.json();
            setTitle(data.title);
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    // Add debounced auto-save
    const autoSave = async (content, title) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5002/api/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title || 'Untitled Document',
                    content: content || ''
                })
            });

            if (!response.ok) {
                throw new Error('Auto-save failed');
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    };

    // Add debounced content change handler
    const debouncedSave = useRef(null);
    
    useEffect(() => {
        if (content || title) {
            if (debouncedSave.current) clearTimeout(debouncedSave.current);
            debouncedSave.current = setTimeout(() => {
                autoSave(content, title);
            }, 1000); // Save after 1 second of no changes
        }
        return () => {
            if (debouncedSave.current) clearTimeout(debouncedSave.current);
        };
    }, [content, title]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        setSaving(true);
        // Status will be updated by the auto-save
    };

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        setSaving(true);
        // Status will be updated by the auto-save
    };

    return (
        <div className="document-container">
            <div className="document-header">
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    className="document-title-input"
                    placeholder="Untitled Document"
                />
                <div className="save-status">
                    {saving ? 'Saving...' : 'All changes saved'}
                </div>
                <button 
                    className="save-button" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleContentChange}
                modules={{
                    toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'header': [1, 2, 3, false] }],
                        ['clean']
                    ]
                }}
            />
        </div>
    );
}

export default Editor;