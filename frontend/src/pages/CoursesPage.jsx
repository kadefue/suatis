// src/pages/CoursesPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react'
import { api } from '../api/client'
import { PageHeader, Modal, Confirm, Empty, LoadingPage, Spinner, Field, Input } from '../components/ui'

function CourseForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setN = (k) => (e) => setForm({ ...form, [k]: Number(e.target.value) })
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => api.programs.list().then(r => r.data) })
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: () => api.instructors.list().then(r => r.data) })

  const toggleArr = (key, id) => {
    const arr = form[key] || []
    setForm({ ...form, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Course Code" required>
          <Input placeholder="e.g. AG 201" value={form.code || ''} onChange={set('code')} />
        </Field>
        <Field label="Credit Hours">
          <Input type="number" step={0.5} min={1} value={form.credit_hours ?? 3} onChange={(e) => setForm({ ...form, credit_hours: parseFloat(e.target.value) })} />
        </Field>
      </div>
      <Field label="Course Name" required>
        <Input placeholder="e.g. Introduction to Agronomy" value={form.name || ''} onChange={set('name')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lecture Slots/Week">
          <Input type="number" min={0} value={form.lecture_hours ?? 0} onChange={setN('lecture_hours')} />
        </Field>
        <Field label="Practical Slots/Week">
          <Input type="number" min={0} value={form.practical_hours ?? 0} onChange={setN('practical_hours')} />
        </Field>
      </div>
      <Field label="Description">
        <textarea className="input h-16 resize-none" value={form.description || ''} onChange={set('description')} />
      </Field>
      {/* Programs */}
      <Field label="Assigned Programs">
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
          {programs.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <input type="checkbox" checked={(form.program_ids || []).includes(p.id)} onChange={() => toggleArr('program_ids', p.id)} />
              <span>{p.code} – {p.name}</span>
            </label>
          ))}
        </div>
      </Field>
      {/* Instructors */}
      <Field label="Assigned Instructors">
        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
          {instructors.map(i => (
            <label key={i.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <input type="checkbox" checked={(form.instructor_ids || []).includes(i.id)} onChange={() => toggleArr('instructor_ids', i.id)} />
              <span>{i.first_name} {i.last_name}</span>
            </label>
          ))}
        </div>
      </Field>
    </>
  )
}

export default function CoursesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({})

  const { data = [], isLoading } = useQuery({ queryKey: ['courses'], queryFn: () => api.courses.list().then(r => r.data) })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['courses'] })

  const createMut = useMutation({
    mutationFn: (d) => api.courses.create(d),
    onSuccess: () => { toast.success('Course created'); setModal(null); invalidate() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.courses.update(id, data),
    onSuccess: () => { toast.success('Course updated'); setModal(null); invalidate() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => api.courses.delete(id),
    onSuccess: () => { toast.success('Deleted'); setDeleteTarget(null); invalidate() },
  })

  const openCreate = () => { setForm({ code: '', name: '', lecture_hours: 2, practical_hours: 0, credit_hours: 3, program_ids: [], instructor_ids: [] }); setModal('create') }
  const openEdit = (row) => {
    setForm({
      ...row,
      program_ids: row.programs?.map(p => p.id) || [],
      instructor_ids: row.instructors?.map(i => i.id) || [],
    })
    setModal(row)
  }

  const handleSubmit = () => {
    if (modal === 'create') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: form })
  }

  const filtered = data.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-8">
      <PageHeader
        title="Courses"
        subtitle="Manage course catalog with lecture and practical requirements"
        action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Course</button>}
      />
      <div className="mb-4 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by code or name…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? <LoadingPage /> : filtered.length === 0 ? (
        <Empty icon={BookOpen} title="No courses yet" action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add first course</button>} />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
                <th>Lecture Slots</th>
                <th>Practical Slots</th>
                <th>Programs</th>
                <th>Instructors</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span></td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.credit_hours}</td>
                  <td>{c.lecture_hours}</td>
                  <td>{c.practical_hours}</td>
                  <td><span className="badge-blue">{c.programs?.length || 0}</span></td>
                  <td><span className="badge-purple">{c.instructors?.length || 0}</span></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 text-gray-400 hover:text-sua-600"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New Course' : 'Edit Course'} size="lg">
        <div className="space-y-4">
          <CourseForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Spinner size="sm" />}
              {modal === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?.id)}
        title={`Delete ${deleteTarget?.name}?`}
        message="All timetable entries for this course will also be removed."
      />
    </div>
  )
}
