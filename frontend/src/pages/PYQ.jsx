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
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
    <Layers className="w-2.5 h-2.5" /> Sem {sem}
  </span>
);

const ExamBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${EXAM_TYPE_COLORS[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
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
      className="relative group flex flex-col gap-3 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />

      {/* File-type icon strip */}
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2.5 rounded-xl ${isPDF ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'}`}>
          {isPDF ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <SemBadge sem={pyq.semester} />
          <ExamBadge type={pyq.examType} />
        </div>
      </div>

      {/* Subject info */}
      <div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{pyq.subjectName}</h3>
        <p className="text-xs text-indigo-400 font-mono mt-0.5">{pyq.courseCode}</p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-cyan-500" />
          {pyq.department}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-emerald-500" />
          {pyq.academicYear}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3 h-3 text-amber-500" />
          {pyq.uploadedBy?.name || 'Unknown'}
        </span>
      </div>

      {/* Upload date */}
      <p className="text-[10px] text-gray-600 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {new Date(pyq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={() => onPreview(pyq)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all duration-200"
          title="Preview"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button
          onClick={() => onDownload(pyq)}
          className="flex items-center justify-center p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/20 transition-all duration-200"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onBookmark(pyq._id)}
          className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 ${isBookmarked
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
        {isUploader && (
          <button
            onClick={() => onDelete(pyq._id)}
            className="flex items-center justify-center p-2 rounded-xl bg-red-600/10 hover:bg-red-600/30 text-red-400 border border-red-500/20 transition-all duration-200"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1a] shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">{pyq.subjectName}</h3>
              <p className="text-xs text-indigo-400 font-mono">{pyq.courseCode} · {pyq.department} · Sem {pyq.semester}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(viewUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all"
                title="Open in new tab"
              >
                <Eye className="w-3.5 h-3.5" /> Open
              </button>
              <button
                onClick={() => onDownload(pyq)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-[500px] relative bg-[#080812] flex items-center justify-center">
            {pyq.fileType === 'pdf' ? (
              iframeError ? (
                /* Fallback when iframe fails */
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <AlertCircle className="w-12 h-12 text-amber-400" />
                  <p className="text-sm text-gray-400">Preview unavailable. Open the PDF directly.</p>
                  <button
                    onClick={() => window.open(viewUrl, '_blank')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm font-semibold border border-indigo-500/30 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Open PDF
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

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-[#0d0d1a] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all";
  const labelCls = "block text-xs font-semibold text-gray-400 mb-1.5";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d0d1a] shadow-2xl my-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Upload PYQ</h2>
                <p className="text-xs text-gray-500">Share question papers with your college</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
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
                ? 'border-indigo-500/70 bg-indigo-500/10'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.03]'
                }`}
            >
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => validateAndSetFile(e.target.files[0])} />
              {file ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-300">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-white/5">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">Drop image or file here or <span className="text-indigo-400">click to browse</span></p>
                  <p className="text-xs text-gray-500">JPG, JPEG, PNG, PDF — max 10 MB</p>
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
                    <button type="button" onClick={() => setShowCustom(true)} className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-indigo-400 transition-all" title="Add custom branch">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="Enter branch name" value={customDept} onChange={e => setCustomDept(e.target.value)} />
                    <button type="button" onClick={() => { setShowCustom(false); setCustomDept(''); }} className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 transition-all">
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
                    <button type="button" onClick={() => setShowCY(true)} className="px-2 py-2 rounded-xl bg-[#0d0d1a] border border-white/10 text-gray-400 hover:text-indigo-400 transition-all" title="Add custom year">
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
                    <button type="button" onClick={() => { setShowCY(false); setCustomYear(''); }} className="px-2 py-2 rounded-xl bg-[#0d0d1a] border border-white/10 text-gray-400 hover:text-red-400 transition-all">
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
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-indigo-500/30 hover:text-white'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload PYQ</>}
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
    <div className="min-h-screen bg-[#080812] text-white">
      {/* ── Background decoration ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-purple-600/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-cyan-600/6 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              PYQ Repository
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Previous Year Question Papers · {user?.college?.name || 'Your College'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setShowBM(b => !b); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${showBookmarks
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-amber-300 hover:border-amber-500/30'
                }`}
            >
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">{showBookmarks ? 'All PYQs' : 'Bookmarks'}</span>
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Upload PYQ
            </button>
          </div>
        </div>

        {/* ── Semester Tabs ───────────────────────────────────────────────── */}
        {!showBookmarks && (
          <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto scrollbar-hide">
            {SEMESTERS.map(s => (
              <button
                key={s}
                onClick={() => { setActiveSem(s); setActiveDept('All'); }}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSem === s
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {activeSem === s && (
                  <motion.div
                    layoutId="sem-tab-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-600/50 to-purple-600/50 border border-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">Semester {s}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Branch Filters ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Branch:
          </span>
          {['All', ...departments].map(d => (
            <button
              key={d}
              onClick={() => setActiveDept(d)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${activeDept === d
                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-indigo-500/30 hover:text-white'
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by subject or course code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Academic Year filter */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-[#0d0d1a] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all min-w-[130px]"
            >
              <option value="">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>

          {/* Exam type filter */}
          <div className="relative">
            <select
              value={examFilter}
              onChange={e => setExamFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-[#0d0d1a] border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all min-w-[140px]"
            >
              <option value="">All Exam Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* ── Results header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {showBookmarks
              ? `${displayedPyqs.length} bookmarked question paper${displayedPyqs.length !== 1 ? 's' : ''}`
              : `${displayedPyqs.length} result${displayedPyqs.length !== 1 ? 's' : ''} for Semester ${activeSem}${activeDept !== 'All' ? ` · ${activeDept}` : ''}`
            }
          </p>
          {(search || yearFilter || examFilter || activeDept !== 'All') && (
            <button
              onClick={() => { setSearch(''); setYearFilter(''); setExamFilter(''); setActiveDept('All'); }}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
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
