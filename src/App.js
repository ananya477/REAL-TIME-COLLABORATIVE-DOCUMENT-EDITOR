import './styles/global.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import DocumentList from './components/DocumentList';
import Editor from './components/Editor';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/register" />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/documents" element={<DocumentList />} />
                <Route path="/documents/:id" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;