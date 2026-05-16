import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import '../styles/dashboard.css';
import { LogOut, Search, Plus, Hash, Sun, Moon, FileText, Archive, RotateCcw } from 'lucide-react';
import NoteEditor from '../components/NoteEditor';

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-line short" />
  </div>
);

type View = 'notes' | 'archive';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [view, setView] = useState<View>('notes');

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const { data: notes = [], isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', searchQuery, activeTag, view],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeTag) params.append('tag', activeTag);
      if (view === 'archive') params.append('archived', 'true');
      const res = await api.get(`/notes?${params.toString()}`);
      return res.data;
    }
  });

  const { data: insights, refetch: refetchInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await api.get('/insights');
      return res.data;
    }
  });

  const handleRefresh = () => {
    refetchNotes();
    refetchInsights();
  };

  const handleCreateNote = async () => {
    const res = await api.post('/notes', { title: 'Untitled Note', content: '' });
    handleRefresh();
    setActiveNoteId(res.data.id);
  };

  const handleUnarchive = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await api.patch(`/notes/${noteId}`, { isArchived: false });
    handleRefresh();
  };

  const switchView = (v: View) => {
    setView(v);
    setActiveTag(null);
    setSearchQuery('');
    setActiveNoteId(null);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Peblo Notes</h2>
          {view === 'notes' && (
            <button className="new-note-btn" onClick={handleCreateNote}>
              <Plus size={16} /> New Note
            </button>
          )}
        </div>

        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder={view === 'archive' ? 'Search archive...' : 'Search notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sidebar-nav">
          {/* View switcher */}
          <div className="nav-section">
            <h3>Views</h3>
            <ul className="tag-list">
              <li
                className={view === 'notes' ? 'active' : ''}
                onClick={() => switchView('notes')}
              >
                <FileText size={14} /> All Notes
              </li>
              <li
                className={view === 'archive' ? 'active' : ''}
                onClick={() => switchView('archive')}
              >
                <Archive size={14} /> Archive
              </li>
            </ul>
          </div>

          {view === 'notes' && (
            <>
              <div className="nav-section">
                <h3>Insights</h3>
                {insights ? (
                  <div className="insights-mini">
                    <div className="insight-item">
                      <span>Total Notes</span>
                      <strong>{insights.totalNotes}</strong>
                    </div>
                    <div className="insight-item">
                      <span>AI Actions</span>
                      <strong>{insights.aiUsage}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="insights-mini">
                    <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
                    <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
                  </div>
                )}
              </div>

              <div className="nav-section">
                <h3>Popular Tags</h3>
                <ul className="tag-list">
                  <li
                    className={activeTag === null ? 'active' : ''}
                    onClick={() => setActiveTag(null)}
                  >
                    <Hash size={14} /> All Notes
                  </li>
                  {insights?.mostUsedTags.map((tag: any) => (
                    <li
                      key={tag.name}
                      className={activeTag === tag.name ? 'active' : ''}
                      onClick={() => setActiveTag(tag.name)}
                    >
                      <Hash size={14} /> {tag.name} <span>({tag.count})</span>
                    </li>
                  ))}
                </ul>
              </div>

              {insights?.recentlyEdited?.length > 0 && (
                <div className="nav-section">
                  <h3>Recently Edited</h3>
                  <ul className="tag-list">
                    {insights.recentlyEdited.slice(0, 3).map((n: any) => (
                      <li key={n.id} onClick={() => setActiveNoteId(n.id)}>
                        <FileText size={14} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name.charAt(0).toUpperCase()}</div>
            <span>{user?.name}</span>
          </div>
          <div className="sidebar-actions">
            <button
              className="theme-btn"
              onClick={() => setIsDark(d => !d)}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeNoteId && view === 'notes' ? (
          <NoteEditor
            noteId={activeNoteId}
            onClose={() => setActiveNoteId(null)}
            onUpdate={handleRefresh}
          />
        ) : (
          <>
            {view === 'archive' && (
              <div className="view-header">
                <Archive size={18} />
                <h2>Archived Notes</h2>
                <span className="view-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="notes-grid">
              {notesLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : notes.length === 0 ? (
                <div className="empty-state">
                  {view === 'archive' ? <Archive size={48} /> : <FileText size={48} />}
                  <p>
                    {view === 'archive'
                      ? 'No archived notes.'
                      : searchQuery || activeTag
                        ? 'No notes match your search.'
                        : 'No notes yet. Create your first one!'}
                  </p>
                  {view === 'notes' && !searchQuery && !activeTag && (
                    <button onClick={handleCreateNote}>
                      <Plus size={16} /> Create Note
                    </button>
                  )}
                </div>
              ) : (
                notes.map((note: any) => (
                  <div
                    key={note.id}
                    className={`note-card ${view === 'archive' ? 'archived' : ''}`}
                    onClick={() => view === 'notes' && setActiveNoteId(note.id)}
                  >
                    <h3>{note.title}</h3>
                    <p className="note-preview">
                      {note.content.replace(/<[^>]+>/g, '').substring(0, 120) || 'Empty note...'}
                    </p>
                    <div className="note-meta">
                      <span className="date">
                        {new Date(note.updatedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        })}
                      </span>
                      <div className="tags-preview">
                        {note.tags.slice(0, 2).map((t: any) => (
                          <span key={t.name} className="tag-pill">{t.name}</span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="tag-pill">+{note.tags.length - 2}</span>
                        )}
                        {view === 'archive' && (
                          <button
                            className="unarchive-btn"
                            onClick={(e) => handleUnarchive(e, note.id)}
                            title="Restore note"
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
