import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  X, Save, Trash2, Archive, Share2, Copy, Check,
  Bold, Italic, Strikethrough, List,
  Hash, Sparkles, ChevronUp, Loader2, Link2Off, Undo, Redo
} from 'lucide-react';
import api from '../api/axios';
import '../styles/noteEditor.css';

interface Tag { id: string; name: string; }
interface NoteData {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  shareId?: string;
  tags: Tag[];
  updatedAt: string;
}

interface Props {
  noteId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type AIAction = 'summary' | 'action-items' | 'title';
type ToastType = 'success' | 'error' | 'info';

const NoteEditor: React.FC<Props> = ({ noteId, onClose, onUpdate }) => {
  const [note, setNote] = useState<NoteData | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState<AIAction | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const remoteChangeRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your note...' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (remoteChangeRef.current) return;
      const html = editor.getHTML();
      socketRef.current?.emit('note-change', { noteId, delta: html });
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => handleSave(true), 2000);
    },
  });

  // Load note content into editor once both are ready
  useEffect(() => {
    if (!editor) return;
    api.get(`/notes/${noteId}`).then(({ data }) => {
      setNote(data);
      setTitle(data.title);
      setTags(data.tags);
      if (data.shareId) {
        setShareUrl(`${window.location.origin}/shared/${data.shareId}`);
      }
      editor.commands.setContent(data.content || '');
    });
  }, [noteId, editor]);

  // Socket.io real-time collaboration
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;
    socket.emit('join-note', noteId);

    socket.on('receive-note-change', (html: string) => {
      if (!editor) return;
      remoteChangeRef.current = true;
      const { from, to } = editor.state.selection;
      editor.commands.setContent(html, false);
      // Restore selection approximately
      try {
        editor.commands.setTextSelection({ from, to });
      } catch (_) { /* ignore if out of range */ }
      remoteChangeRef.current = false;
    });

    return () => {
      socket.emit('leave-note', noteId);
      socket.disconnect();
    };
  }, [noteId, editor]);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleSave = useCallback(async (silent = false) => {
    if (!editor) return;
    setSaving(true);
    try {
      await api.patch(`/notes/${noteId}`, {
        title,
        content: editor.getHTML(),
        newTags: tags.map(t => t.name),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate();
      if (!silent) showToast('Note saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [editor, noteId, title, tags, onUpdate, showToast]);

  const handleDelete = async () => {
    if (!confirm('Delete this note permanently?')) return;
    await api.delete(`/notes/${noteId}`);
    onUpdate();
    onClose();
  };

  const handleArchive = async () => {
    await api.patch(`/notes/${noteId}`, { isArchived: true });
    onUpdate();
    onClose();
    showToast('Note archived', 'info');
  };

  const handleShare = async () => {
    const { data } = await api.post(`/notes/${noteId}/share`);
    const url = `${window.location.origin}/shared/${data.shareId}`;
    setShareUrl(url);
    showToast('Share link created', 'success');
  };

  const handleUnshare = async () => {
    await api.delete(`/notes/${noteId}/share`);
    setShareUrl('');
    setCopied(false);
    showToast('Share link revoked', 'info');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const name = tagInput.trim().toLowerCase();
      if (!tags.find(t => t.name === name)) {
        setTags(prev => [...prev, { id: name, name }]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (name: string) => {
    setTags(prev => prev.filter(t => t.name !== name));
  };

  const handleAI = async (action: AIAction) => {
    setAiLoading(action);
    setAiResult('');
    setAiPanelOpen(true);
    try {
      const { data } = await api.post(`/ai/notes/${noteId}/${action}`);
      setAiResult(data.result);
      if (action === 'title') {
        setTitle(data.result);
        showToast('Title updated by AI', 'success');
      }
    } catch {
      setAiResult('AI request failed. Check your API key.');
    } finally {
      setAiLoading(null);
    }
  };

  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0;

  if (!note) {
    return (
      <div className="note-editor editor-loading">
        <Loader2 size={28} className="spin" />
      </div>
    );
  }

  return (
    <div className="note-editor">
      {/* Header */}
      <div className="editor-header">
        <input
          className="title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title..."
        />
        <div className="editor-actions">
          <button className="action-btn save-btn" onClick={() => handleSave()} title="Save (Ctrl+S)">
            {saving ? <Loader2 size={15} className="spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
            <span>{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}</span>
          </button>
          <button className="action-btn icon-btn" onClick={handleArchive} title="Archive">
            <Archive size={15} />
          </button>
          <button className="action-btn icon-btn danger" onClick={handleDelete} title="Delete">
            <Trash2 size={15} />
          </button>
          <button className="action-btn icon-btn" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="format-btns">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'active' : ''}
            title="Bold"
          ><Bold size={14} /></button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'active' : ''}
            title="Italic"
          ><Italic size={14} /></button>
          <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={editor?.isActive('strike') ? 'active' : ''}
            title="Strikethrough"
          ><Strikethrough size={14} /></button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          ><List size={14} /></button>
          <div className="toolbar-divider" />
          <button onClick={() => editor?.chain().focus().undo().run()} title="Undo">
            <Undo size={14} />
          </button>
          <button onClick={() => editor?.chain().focus().redo().run()} title="Redo">
            <Redo size={14} />
          </button>
          <div className="toolbar-divider" />
        </div>

        {/* AI Actions */}
        <div className="ai-btns">
          <button
            className={`ai-btn ${aiLoading === 'summary' ? 'loading' : ''}`}
            onClick={() => handleAI('summary')}
            disabled={!!aiLoading}
          >
            {aiLoading === 'summary' ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
            Summary
          </button>
          <button
            className={`ai-btn ${aiLoading === 'action-items' ? 'loading' : ''}`}
            onClick={() => handleAI('action-items')}
            disabled={!!aiLoading}
          >
            {aiLoading === 'action-items' ? <Loader2 size={12} className="spin" /> : <List size={12} />}
            Actions
          </button>
          <button
            className={`ai-btn ${aiLoading === 'title' ? 'loading' : ''}`}
            onClick={() => handleAI('title')}
            disabled={!!aiLoading}
          >
            {aiLoading === 'title' ? <Loader2 size={12} className="spin" /> : <Hash size={12} />}
            Auto Title
          </button>
        </div>

        {/* Share */}
        <div className="share-section">
          {!shareUrl ? (
            <button className="icon-btn" onClick={handleShare} title="Share note">
              <Share2 size={14} /> <span>Share</span>
            </button>
          ) : (
            <div className="share-url-row">
              <input readOnly value={shareUrl} className="share-input" />
              <button className="icon-btn" onClick={handleCopy} title="Copy link">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button className="icon-btn danger" onClick={handleUnshare} title="Revoke link">
                <Link2Off size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Result Panel */}
      {aiPanelOpen && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <span><Sparkles size={13} /> AI Result</span>
            <button onClick={() => setAiPanelOpen(false)}>
              <ChevronUp size={15} />
            </button>
          </div>
          <div className="ai-result">
            {aiLoading ? (
              <div className="ai-loading"><Loader2 size={18} className="spin" /> Generating…</div>
            ) : (
              <pre>{aiResult}</pre>
            )}
          </div>
        </div>
      )}

      {/* TipTap Editor */}
      <EditorContent editor={editor} className="editor-body" />

      {/* Footer: Tags + Word Count */}
      <div className="editor-footer">
        <div className="tags-row">
          {tags.map(t => (
            <span key={t.name} className="tag-chip">
              <Hash size={10} /> {t.name}
              <button onClick={() => handleRemoveTag(t.name)}><X size={9} /></button>
            </span>
          ))}
          <input
            className="tag-input"
            placeholder="Add tag + Enter"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>
        <span className="word-count">{wordCount} words · Ctrl+S to save</span>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`editor-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
};

export default NoteEditor;
