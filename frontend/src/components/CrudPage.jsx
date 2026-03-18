// src/components/CrudPage.jsx
// Generic table + modal CRUD page. Used by Colleges, Departments, Rooms, etc.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageHeader, Modal, Confirm, Empty, LoadingPage, Spinner } from './ui'
import clsx from 'clsx'

export default function CrudPage({
  title,
  subtitle,
  queryKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  columns,
  FormFields,
  defaultValues = {},
  icon: Icon,
  searchKey = 'name',
}) {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | { id, ...data }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(defaultValues)

  const { data = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: fetchFn })

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] })

  const createMut = useMutation({
    mutationFn: createFn,
    onSuccess: () => { toast.success('Created successfully'); setModal(null); invalidate() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateFn(id, data),
    onSuccess: () => { toast.success('Updated successfully'); setModal(null); invalidate() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => { toast.success('Deleted'); setDeleteTarget(null); invalidate() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Delete failed'),
  })

  const openCreate = () => { setForm(defaultValues); setModal('create') }
  const openEdit = (row) => { setForm(row); setModal(row) }

  const handleSubmit = () => {
    if (modal === 'create') createMut.mutate(form)
    else updateMut.mutate({ id: modal.id, data: form })
  }

  const filtered = data.filter((row) =>
    !search || String(row[searchKey] || '').toLowerCase().includes(search.toLowerCase())
  )

  const isEditing = modal && modal !== 'create'
  const isBusy = createMut.isPending || updateMut.isPending

  return (
    <div className="p-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add {title.replace(/s$/, '')}
          </button>
        }
      />

      {/* Search */}
      <div className="mb-4 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingPage />
      ) : filtered.length === 0 ? (
        <Empty
          icon={Icon}
          title={`No ${title.toLowerCase()} yet`}
          action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add first</button>}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row[c.key], row) : row[c.key]}
                    </td>
                  ))}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(row)}
                        className="btn-ghost p-1.5 text-gray-400 hover:text-sua-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isEditing ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
      >
        <div className="space-y-4">
          <FormFields form={form} setForm={setForm} isEditing={isEditing} />
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={isBusy}>
              {isBusy && <Spinner size="sm" />}
              {isEditing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?.id)}
        title={`Delete ${deleteTarget?.[searchKey] || 'this item'}?`}
        message="This action cannot be undone."
      />
    </div>
  )
}
