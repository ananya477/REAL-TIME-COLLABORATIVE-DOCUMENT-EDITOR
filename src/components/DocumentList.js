import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DocumentList() {
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                console.log('Fetching documents with token:', token);
                const response = await fetch('http://localhost:5002/api/documents', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch documents');
                }

                console.log('Documents fetched:', data);
                setDocuments(data);
                setError(''); // Clear any existing errors
            } catch (error) {
                console.error('Fetch error:', error);
                if (error.message.includes('token')) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    setError('Failed to load documents. Please try again.');
                }
            }
        };

        fetchDocuments();
    }, [navigate]);

    const createNewDocument = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5002/api/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create document');
            }

            const newDoc = await response.json();
            navigate(`/documents/${newDoc._id}`);
        } catch (error) {
            setError('Failed to create document');
        }
    };

    const handleDelete = async (e, docId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            console.log('Deleting document:', docId);
            const response = await fetch(`http://localhost:5002/api/documents/${docId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== docId));
            setError('');
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete document. Please try again.');
        }
    };

    return (
        <div className="document-list">
            <h2>My Documents</h2>
            {error && <div className="error-message">{error}</div>}
            <button className="create-doc-button" onClick={createNewDocument}>
                <span>+</span> Create New Document
            </button>
            <div className="documents-grid">
                {documents.map(doc => (
                    <div key={doc._id} className="document-card">
                        <div 
                            className="card-content"
                            onClick={() => navigate(`/documents/${doc._id}`)}
                        >
                            <h3>{doc.title || 'Untitled Document'}</h3>
                            <p>Last modified: {new Date(doc.lastModified).toLocaleDateString()}</p>
                        </div>
                        <button 
                            className="delete-button"
                            onClick={(e) => handleDelete(e, doc._id)}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DocumentList;