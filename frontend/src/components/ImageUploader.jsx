import React, { useState, useRef, useCallback } from 'react'

const MAX_FILES = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Professional drag-and-drop image uploader.
 *
 * Props:
 *  - files: File[]                    controlled list of staged files
 *  - onFilesChange(files: File[])     called when files are added / removed
 *  - uploadedUrls: string[]           already-uploaded URLs (for edit mode)
 *  - onRemoveUrl(index: number)       called when user removes an already-uploaded image
 *  - uploading: boolean               shows progress overlay when true
 *  - uploadProgress: number           0-100
 *  - error: string | null
 */
export default function ImageUploader({
  files = [],
  onFilesChange,
  uploadedUrls = [],
  onRemoveUrl,
  uploading = false,
  uploadProgress = 0,
  error = null,
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const totalSlots = uploadedUrls.length + files.length
  const remaining = MAX_FILES - totalSlots

  function addFiles(incoming) {
    const valid = Array.from(incoming).filter(f => ACCEPTED.includes(f.type))
    if (valid.length === 0) return
    const toAdd = valid.slice(0, remaining)
    onFilesChange([...files, ...toAdd])
  }

  function removeStaged(index) {
    const next = files.filter((_, i) => i !== index)
    onFilesChange(next)
  }

  const onDragOver = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [files, remaining])

  return (
    <div style={s.root}>
      {/* Drop Zone */}
      {remaining > 0 && (
        <div
          style={{ ...s.dropZone, ...(dragging ? s.dropZoneDrag : {}) }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Upload product images"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = '' }}
          />

          <div style={s.dropIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div style={s.dropTitle}>
            {dragging ? 'Drop images here' : 'Drag & drop images here'}
          </div>
          <div style={s.dropSub}>
            or <span style={s.dropBrowse}>click to browse</span>
          </div>
          <div style={s.dropHint}>
            JPG, PNG, WEBP · Max 15 MB each · Up to {MAX_FILES} images
          </div>
          {remaining < MAX_FILES && (
            <div style={s.dropCount}>
              {remaining} more {remaining === 1 ? 'image' : 'images'} allowed
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div style={s.progressWrap}>
          <div style={s.progressLabel}>
            <span>Uploading to Cloudinary…</span>
            <span style={{ fontWeight: 700 }}>{uploadProgress}%</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <span style={{ marginRight: '0.5rem' }}>⚠</span>
          {error}
        </div>
      )}

      {/* Previews */}
      {(uploadedUrls.length > 0 || files.length > 0) && (
        <div style={s.previewGrid}>
          {/* Already-uploaded URLs (edit mode) */}
          {uploadedUrls.map((url, i) => (
            <div key={`url-${i}`} style={{ ...s.previewCard, ...(i === 0 ? s.previewCardFirst : {}) }}>
              <img src={url} alt={`uploaded-${i}`} style={s.previewImg} />
              {i === 0 && <div style={s.thumbnailBadge}>Thumbnail</div>}
              <button
                type="button"
                style={s.removeBtn}
                onClick={() => onRemoveUrl?.(i)}
                title="Remove image"
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Staged files (not yet uploaded) */}
          {files.map((file, i) => (
            <div key={`file-${i}`} style={{
              ...s.previewCard,
              ...(uploadedUrls.length === 0 && i === 0 ? s.previewCardFirst : {}),
            }}>
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={s.previewImg}
              />
              {uploadedUrls.length === 0 && i === 0 && (
                <div style={s.thumbnailBadge}>Thumbnail</div>
              )}
              <div style={s.fileNameBadge}>{file.name.length > 16 ? file.name.slice(0, 13) + '…' : file.name}</div>
              <button
                type="button"
                style={s.removeBtn}
                onClick={() => removeStaged(i)}
                title="Remove"
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Empty slot placeholders */}
          {Array.from({ length: Math.max(0, remaining) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={s.emptySlot}
              onClick={() => inputRef.current?.click()}
              title="Add image"
            >
              <span style={{ fontSize: '1.5rem', color: '#ccc' }}>+</span>
            </div>
          ))}
        </div>
      )}

      {totalSlots === 0 && !uploading && (
        <div style={s.noImages}>No images selected</div>
      )}
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },

  dropZone: {
    border: '2px dashed #d4c5a9',
    borderRadius: 14,
    padding: '2rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fafaf8',
    transition: 'all 0.2s ease',
    outline: 'none',
    userSelect: 'none',
  },
  dropZoneDrag: {
    border: '2px dashed #c8a96e',
    background: 'rgba(200,169,110,0.06)',
    transform: 'scale(1.01)',
  },
  dropIcon: {
    color: '#c8a96e',
    marginBottom: '0.75rem',
    display: 'flex',
    justifyContent: 'center',
  },
  dropTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#2d2d2d', marginBottom: '0.25rem' },
  dropSub: { fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' },
  dropBrowse: { color: '#c8a96e', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' },
  dropHint: { fontSize: '0.72rem', color: '#bbb', letterSpacing: '0.02em' },
  dropCount: {
    marginTop: '0.5rem', fontSize: '0.72rem',
    color: '#c8a96e', fontWeight: 600,
  },

  progressWrap: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 10, padding: '0.9rem 1rem',
  },
  progressLabel: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.82rem', color: '#15803d', marginBottom: '0.5rem',
  },
  progressTrack: {
    height: 8, background: '#dcfce7', borderRadius: 6, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #16a34a)',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },

  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, padding: '0.75rem 1rem',
    color: '#b91c1c', fontSize: '0.85rem',
    display: 'flex', alignItems: 'center',
  },

  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.65rem',
  },
  previewCard: {
    position: 'relative',
    aspectRatio: '3/4',
    borderRadius: 10,
    overflow: 'hidden',
    border: '2px solid #e0ddd8',
    background: '#f5f4f0',
    transition: 'border-color 0.2s',
  },
  previewCardFirst: {
    border: '2px solid #c8a96e',
    boxShadow: '0 0 0 3px rgba(200,169,110,0.2)',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbnailBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(200,169,110,0.9)',
    color: '#fff', fontSize: '0.6rem', fontWeight: 700,
    textAlign: 'center', padding: '3px 0',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  fileNameBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff', fontSize: '0.58rem',
    textAlign: 'center', padding: '3px 4px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22,
    background: 'rgba(0,0,0,0.65)', color: '#fff',
    border: 'none', borderRadius: '50%',
    fontSize: '0.65rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, transition: 'background 0.15s',
  },
  emptySlot: {
    aspectRatio: '3/4', borderRadius: 10,
    border: '2px dashed #e0ddd8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: '#fafaf8',
    transition: 'border-color 0.2s',
  },
  noImages: {
    fontSize: '0.8rem', color: '#bbb', textAlign: 'center', padding: '0.5rem 0',
  },
}
