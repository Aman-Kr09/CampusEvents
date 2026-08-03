import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Upload, Search, Filter, Download, Bookmark, BookmarkCheck,
  Eye, X, ChevronDown, FileText, Image, Loader2, AlertCircle, Plus,
  Calendar, Tag, GraduationCap, BookMarked, Layers, Clock, CheckCircle2,
  FolderOpen, SlidersHorizontal, Trash2
} from 'lucide-react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7];
const EXAM_TYPES = ['Mid Semester', 'End Semester', 'Quiz', 'Assignment'];
const ACADEMIC_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20'];

// ─── Utility: generate academic years list ───────────────────────────────────
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } }
};

// ─── Badge helpers ─────────────────────────────────────────────────────────
const EXAM_TYPE_COLORS = {
  'Mid Semester': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'End Semester': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Quiz': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Assignment': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
};

const SemBadge = ({ sem }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
    Sem {sem}
  </span>
);

const ExamBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${EXAM_TYPE_COLORS[type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
    {type}
  </span>
);

// ─── PYQ Card ─────────────────────────────────────────────────────────────────
const PYQCard = ({ pyq, index, userId, onPreview, onBookmark, onDelete, onDownload }) => {
  const isBookmarked = pyq.bookmarkedBy?.some(id =>
    (typeof id === 'object' ? id._id || id : id).toString() === userId
  );
  const isPDF = pyq.fileType === 'pdf';
  const isUploader = pyq.uploadedBy?._id?.toString() === userId;

  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="relative group flex flex-col gap-3 p-5 rounded-2xl border border-[#D6EAF8] bg-white hover:border-cyan-400 shadow-sm transition-all duration-300 overflow-hidden"
    >
      {/* Semester & Exam Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <SemBadge sem={pyq.semester} />
        <ExamBadge type={pyq.examType} />
      </div>

      {/* Subject info */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">{pyq.subjectName}</h3>
        <p className="text-xs text-cyan-800 font-mono font-bold mt-1">{pyq.courseCode}</p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-700 font-semibold">
        <span>{pyq.department}</span>
        <span>&bull; {pyq.academicYear}</span>
        <span>&bull; {pyq.uploadedBy?.name || 'Unknown'}</span>
      </div>

      {/* Upload date */}
      <p className="text-xs text-slate-500 font-medium">
        {new Date(pyq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          onClick={() => onPreview(pyq)}
          className="flex-1 py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition-all duration-200 text-center"
          title="Preview"
        >
          Preview
        </button>
        <button
          onClick={() => onDownload(pyq)}
          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all duration-200"
          title="Download"
        >
          Download
        </button>
        <button
          onClick={() => onBookmark(pyq._id)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${isBookmarked
            ? 'bg-amber-100 text-amber-900 border-amber-300'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked ? 'Saved' : 'Save'}
        </button>
        {isUploader && (
          <button
            onClick={() => onDelete(pyq._id)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all duration-200"
            title="Delete"
          >
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Preview Modal ────────────────────────────────────────────────────────────
const PreviewModal = ({ pyq, onClose, onDownload }) => {
  const [iframeError, setIframeError] = useState(false);

  const token = localStorage.getItem('campusevents_token') || '';
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const viewUrl = pyq ? `${apiBase}/pyq/${pyq._id}/view?token=${token}` : '';

  // Reset error state when a different PYQ is opened
  React.useEffect(() => {
    setIframeError(false);
  }, [pyq?._id]);

  if (!pyq) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#D6EAF8] bg-white shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900">{pyq.subjectName}</h3>
              <p className="text-xs text-cyan-700 font-mono">{pyq.courseCode} · {pyq.department} · Sem {pyq.semester}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(viewUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition-all"
                title="Open in new tab"
              >
                <span>Open</span>
              </button>
              <button
                onClick={() => onDownload(pyq)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all"
              >
                <span>Download</span>
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-[500px] relative bg-slate-50 flex items-center justify-center">
            {pyq.fileType === 'pdf' ? (
              iframeError ? (
                /* Fallback when iframe fails */
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <p className="text-sm text-slate-600">Preview unavailable. Open the PDF directly.</p>
                  <button
                    onClick={() => window.open(viewUrl, '_blank')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-sm font-bold border border-cyan-200 transition-all"
                  >
                    <span>Open PDF</span>
                  </button>
                </div>
              ) : (
                <iframe
                  key={viewUrl}
                  src={viewUrl}
                  title={pyq.subjectName}
                  className="w-full border-none"
                  style={{ height: 'calc(90vh - 80px)' }}
                  onError={() => setIframeError(true)}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full p-6 overflow-auto" style={{ minHeight: 500 }}>
                <img
                  src={viewUrl}
                  alt={pyq.subjectName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={() => setIframeError(true)}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Upload Modal ─────────────────────────────────────────────────────────────
const UploadModal = ({ departments, academicYears, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    subjectName: '', courseCode: '', semester: '1', department: '',
    academicYear: '', examType: ''
  });
  const [file, setFile] = useState(null);
  const [dragging, setDrag] = useState(false);
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [showCustomYear, setShowCY] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) { setError('Only PDF, JPG, JPEG, PNG allowed.'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError(''); setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please attach a file.'); return; }
    const dept = showCustom ? customDept.trim() : form.department;
    if (!dept) { setError('Please select or enter a department.'); return; }
    const year = showCustomYear ? customYear.trim() : form.academicYear;
    if (!year) { setError('Please select or enter an academic year.'); return; }

    setLoad(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subjectName', form.subjectName);
      fd.append('courseCode', form.courseCode);
      fd.append('semester', form.semester);
      fd.append('department', dept);
      fd.append('academicYear', year);
      fd.append('examType', form.examType);

      const res = await api.post('/pyq', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        onSuccess(res.data.pyq);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoad(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-xl rounded-2xl border border-[#D6EAF8] bg-white shadow-2xl my-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload PYQ</h2>
              <p className="text-xs text-slate-500">Share question papers with your college</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* File Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed transition-all duration-200 ${dragging
                ? 'border-cyan-500 bg-cyan-50'
                : file
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-cyan-400 bg-slate-50'
                }`}
            >
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => validateAndSetFile(e.target.files[0])} />
              {file ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Drop image or file here or <span className="text-cyan-700 font-bold">click to browse</span></p>
                  <p className="text-xs text-slate-500">JPG, JPEG, PNG, PDF — max 10 MB</p>
                </>
              )}
            </div>

            {/* Form fields — 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Subject Name *</label>
                <input className={inputCls} placeholder="e.g. Data Structures and Algorithms" required value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Course Code *</label>
                <input className={inputCls} placeholder="e.g. CS301" required value={form.courseCode} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Semester *</label>
                <select className={inputCls} required value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Department / Branch *</label>
                {!showCustom ? (
                  <div className="flex gap-2">
                    <select className={`${inputCls} flex-1`} required={!showCustom} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">Select branch</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCustom(true)} className="px-2 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-cyan-700 transition-all" title="Add custom branch">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="Enter branch name" value={customDept} onChange={e => setCustomDept(e.target.value)} />
                    <button type="button" onClick={() => { setShowCustom(false); setCustomDept(''); }} className="px-2 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Academic Year *</label>
                {!showCustomYear ? (
                  <div className="flex gap-2">
                    <select className={`${inputCls} flex-1`} required={!showCustomYear} value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}>
                      <option value="">Select year</option>
                      {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCY(true)} className="px-2 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-cyan-700 transition-all" title="Add custom year">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder="e.g. 2025-26"
                      value={customYear}
                      onChange={e => setCustomYear(e.target.value)}
                    />
                    <button type="button" onClick={() => { setShowCY(false); setCustomYear(''); }} className="px-2 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Exam Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_TYPES.map(type => (
                    <button
                      key={type} type="button"
                      onClick={() => setForm(f => ({ ...f, examType: type }))}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${form.examType === type
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass-button-primary font-bold text-sm transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Uploading…' : 'Upload PYQ'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main PYQ Page ────────────────────────────────────────────────────────────
export default function PYQ() {
  const { user } = useAuth();

  // Data
  const [pyqs, setPyqs] = useState([]);
  const [departments, setDepts] = useState(['CSE', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'VLSI']);
  const [academicYears, setAcYears] = useState(['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [activeSem, setActiveSem] = useState(1);
  const [activeDept, setActiveDept] = useState('All');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [showBookmarks, setShowBM] = useState(false);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [previewPYQ, setPreview] = useState(null);

  // ── Fetch metadata (departments & academic years) ──────────────────────────
  const fetchMetadata = useCallback(async () => {
    try {
      const [deptRes, yearRes] = await Promise.all([
        api.get('/pyq/departments'),
        api.get('/pyq/academic-years')
      ]);
      if (deptRes.data.success) setDepts(deptRes.data.departments);
      if (yearRes.data.success) setAcYears(yearRes.data.academicYears);
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // ── Fetch PYQs ───────────────────────────────────────────────────────────
  const fetchPYQs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const endpoint = showBookmarks ? '/pyq/bookmarks' : '/pyq';
      const params = showBookmarks
        ? {}
        : {
          semester: activeSem,
          ...(activeDept !== 'All' && { department: activeDept }),
          ...(search && { search }),
          ...(yearFilter && { academicYear: yearFilter }),
          ...(examFilter && { examType: examFilter })
        };

      const res = await api.get(endpoint, { params });
      if (res.data.success) setPyqs(res.data.pyqs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load PYQs.');
    } finally {
      setLoading(false);
    }
  }, [activeSem, activeDept, search, yearFilter, examFilter, showBookmarks]);

  useEffect(() => { fetchPYQs(); }, [fetchPYQs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBookmark = async (id) => {
    try {
      const res = await api.put(`/pyq/${id}/bookmark`);
      if (res.data.success) {
        setPyqs(prev => prev.map(p => {
          if (p._id !== id) return p;
          const uid = user._id?.toString();
          const already = p.bookmarkedBy?.some(bid => (typeof bid === 'object' ? bid._id || bid : bid).toString() === uid);
          return {
            ...p,
            bookmarkedBy: already
              ? p.bookmarkedBy.filter(bid => (typeof bid === 'object' ? bid._id || bid : bid).toString() !== uid)
              : [...(p.bookmarkedBy || []), uid]
          };
        }));
        if (showBookmarks) {
          setPyqs(prev => prev.filter(p => p._id !== id));
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PYQ? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/pyq/${id}`);
      if (res.data.success) setPyqs(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleUploadSuccess = (newPyq) => {
    // Refresh current view if the new PYQ matches the active semester
    if (!showBookmarks && newPyq.semester === activeSem) {
      setPyqs(prev => [newPyq, ...prev]);
    }
    // Refresh metadata list to ensure newly added custom department/year is present without duplicates
    fetchMetadata();
  };

  // ── Filtered pyqs for bookmark view ──────────────────────────────────────
  const displayedPyqs = showBookmarks
    ? pyqs.filter(p => {
      const matchSem = !false; // bookmarks show all semesters
      const matchDept = activeDept === 'All' || p.department === activeDept;
      const matchY = !yearFilter || p.academicYear === yearFilter;
      const matchE = !examFilter || p.examType === examFilter;
      const matchS = !search || p.subjectName.toLowerCase().includes(search.toLowerCase()) || p.courseCode.toLowerCase().includes(search.toLowerCase());
      return matchSem && matchDept && matchY && matchE && matchS;
    })
    : pyqs;

  const handleDownload = (pyq) => {
    const token = localStorage.getItem('campusevents_token') || '';
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const downloadUrl = `${apiBase}/pyq/${pyq._id}/download?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F6FBFF] text-slate-900">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              PYQ Repository
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Previous Year Question Papers · {user?.college?.name || 'Your College'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setShowBM(b => !b); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${showBookmarks
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <span>{showBookmarks ? 'All PYQs' : 'Bookmarks'}</span>
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="glass-button-primary text-sm py-2 px-4 font-bold"
            >
              Upload PYQ
            </button>
          </div>
        </div>

        {/* ── Semester Tabs ───────────────────────────────────────────────── */}
        {!showBookmarks && (
          <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-white border border-[#D6EAF8] shadow-xs overflow-x-auto">
            {SEMESTERS.map(s => (
              <button
                key={s}
                onClick={() => { setActiveSem(s); setActiveDept('All'); }}
                className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSem === s
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <span>Semester {s}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Branch Filters ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex-shrink-0 text-xs text-slate-500 font-semibold">
            Branch:
          </span>
          {['All', ...departments].map(d => (
            <button
              key={d}
              onClick={() => setActiveDept(d)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${activeDept === d
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-cyan-50'
                }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by subject or course code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full glass-input text-sm px-4"
            />
          </div>

          {/* Academic Year filter */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="glass-input text-sm pr-8 min-w-[130px]"
            >
              <option value="">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Exam type filter */}
          <div className="relative">
            <select
              value={examFilter}
              onChange={e => setExamFilter(e.target.value)}
              className="glass-input text-sm pr-8 min-w-[140px]"
            >
              <option value="">All Exam Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* ── Results header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {showBookmarks
              ? `${displayedPyqs.length} bookmarked question paper${displayedPyqs.length !== 1 ? 's' : ''}`
              : `${displayedPyqs.length} result${displayedPyqs.length !== 1 ? 's' : ''} for Semester ${activeSem}${activeDept !== 'All' ? ` · ${activeDept}` : ''}`
            }
          </p>
          {(search || yearFilter || examFilter || activeDept !== 'All') && (
            <button
              onClick={() => { setSearch(''); setYearFilter(''); setExamFilter(''); setActiveDept('All'); }}
              className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 transition-colors font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Content area ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-gray-500">Loading question papers…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={fetchPYQs} className="text-xs text-indigo-400 hover:underline">Try again</button>
          </div>
        ) : displayedPyqs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
              <FolderOpen className="w-12 h-12 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-400">
                {showBookmarks ? 'No bookmarked PYQs yet' : 'No question papers found'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {showBookmarks
                  ? 'Bookmark papers from the main view to find them here.'
                  : 'Be the first to upload a PYQ for this semester and branch!'}
              </p>
            </div>
            {!showBookmarks && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm font-semibold border border-indigo-500/30 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload First PYQ
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {displayedPyqs.map((pyq, i) => (
                <PYQCard
                  key={pyq._id}
                  pyq={pyq}
                  index={i}
                  userId={user?._id?.toString()}
                  onPreview={setPreview}
                  onBookmark={handleBookmark}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showUpload && (
        <UploadModal
          departments={departments}
          academicYears={academicYears}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
      {previewPYQ && (
        <PreviewModal
          pyq={previewPYQ}
          onClose={() => setPreview(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
