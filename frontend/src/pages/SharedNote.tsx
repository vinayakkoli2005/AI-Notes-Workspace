import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, User, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import '../styles/sharedNote.css';

interface SharedNoteData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string };
}

const SharedNote: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [note, setNote] = useState<SharedNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareId) return;
    api.get(`/notes/shared/${shareId}`)
      .then(({ data }) => setNote(data))
      .catch(() => setError('This note does not exist or the link has expired.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="shared-page">
        <div className="shared-loading">
          <div className="pulse-ring" />
          <p>Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="shared-page">
        <motion.div
          className="shared-error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={40} />
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <Link to="/auth" className="shared-cta">Sign in to Peblo</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="shared-page">
      <div className="shared-banner">
        <span className="shared-brand">Peblo Universe</span>
        <Link to="/auth" className="shared-signup-btn">
          <ExternalLink size={14} /> Sign up free
        </Link>
      </div>

      <motion.div
        className="shared-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="shared-meta">
          <div className="shared-meta-item">
            <User size={14} />
            <span>{note.author.name}</span>
          </div>
          <div className="shared-meta-item">
            <Calendar size={14} />
            <span>Updated {new Date(note.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}</span>
          </div>
          <span className="readonly-badge">Read-only</span>
        </div>

        <h1 className="shared-title">{note.title}</h1>

        <div
          className="shared-content"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />

        <div className="shared-footer">
          <p>Created with <strong>Peblo Universe</strong> — your AI-powered notes workspace.</p>
          <Link to="/auth" className="shared-cta">Start taking notes for free →</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SharedNote;
