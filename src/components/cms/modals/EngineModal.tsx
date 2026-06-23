import React, { useState, useEffect } from 'react';
import { EngineData } from '@/data/engines';

interface EngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (engine: Partial<EngineData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Partial<EngineData> | null;
}

export default function EngineModal({ isOpen, onClose, onSave, onDelete, initialData }: EngineModalProps) {
  const [formData, setFormData] = useState<Partial<EngineData>>({
    id: `engine_${Date.now()}`,
    title: '',
    subtitle: '',
    description: '',
    category: 'Engines',
    media: { thumbnail: '/assets/store/store_combat.png' },
    components: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          id: `engine_${Date.now()}`,
          title: '',
          subtitle: '',
          description: '',
          category: 'Engines',
          media: { thumbnail: '/assets/store/store_combat.png' },
          components: []
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'thumbnail') {
      setFormData(prev => ({ ...prev, media: { thumbnail: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '20px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        width: '100%', maxWidth: '600px', background: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px', padding: '40px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', margin: '0 0 30px 0' }}>
          {initialData ? 'Edit Engine' : 'Add New Engine'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Title</label>
          <input required name="title" value={formData.title} onChange={handleChange} style={inputStyle} placeholder="E.g. Nexus Rendering Engine" />

          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Subtitle</label>
          <input required name="subtitle" value={formData.subtitle} onChange={handleChange} style={inputStyle} placeholder="E.g. A next-generation WebGL framework" />

          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Detail what this engine is used for..." />

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</label>
              <select required name="category" value={formData.category} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="Engines">Engines</option>
                <option value="Modules">Modules</option>
                <option value="Assets">Assets</option>
                <option value="Logic">Logic</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Thumbnail URL</label>
              <input required name="thumbnail" value={formData.media?.thumbnail} onChange={handleChange} style={inputStyle} placeholder="/assets/store/..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <div>
              {initialData && onDelete && (
                <button type="button" onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this engine? This cannot be undone.')) {
                    setIsSaving(true);
                    await onDelete(initialData.id!);
                    setIsSaving(false);
                    onClose();
                  }
                }} style={{
                  background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', color: '#ff6b6b', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)'}>
                  Delete
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button type="button" onClick={onClose} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Cancel
              </button>
              <button type="submit" disabled={isSaving} style={{
                background: '#fff', border: 'none', color: '#000', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', opacity: isSaving ? 0.7 : 1
              }} onMouseEnter={e => !isSaving && (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => !isSaving && (e.currentTarget.style.transform = 'scale(1)')}>
                {isSaving ? 'Saving...' : 'Save Engine'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
