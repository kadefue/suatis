// src/pages/CollegesPage.jsx
import CrudPage from '../components/CrudPage'
import { api } from '../api/client'
import { Field, Input } from '../components/ui'
import { University } from 'lucide-react'

function CollegeForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <>
      <Field label="College Name" required>
        <Input placeholder="e.g. College of Agriculture" value={form.name || ''} onChange={set('name')} />
      </Field>
      <Field label="Code" required>
        <Input placeholder="e.g. CAGR" value={form.code || ''} onChange={set('code')} />
      </Field>
      <Field label="Description">
        <textarea className="input h-20 resize-none" placeholder="Optional description" value={form.description || ''} onChange={set('description')} />
      </Field>
    </>
  )
}

export default function CollegesPage() {
  return (
    <CrudPage
      title="Colleges"
      subtitle="Manage SUA colleges"
      queryKey="colleges"
      fetchFn={() => api.colleges.list().then(r => r.data)}
      createFn={(d) => api.colleges.create(d)}
      updateFn={(id, d) => api.colleges.update(id, d)}
      deleteFn={(id) => api.colleges.delete(id)}
      icon={University}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'is_active', label: 'Status', render: (v) => <span className={v ? 'badge-green' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
      ]}
      FormFields={CollegeForm}
      defaultValues={{ name: '', code: '', description: '' }}
    />
  )
}
