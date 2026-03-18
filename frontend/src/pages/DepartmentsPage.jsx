// src/pages/DepartmentsPage.jsx
import { useQuery } from '@tanstack/react-query'
import CrudPage from '../components/CrudPage'
import { api } from '../api/client'
import { Field, Input, Select } from '../components/ui'
import { Building2 } from 'lucide-react'

function DeptForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const { data: colleges = [] } = useQuery({ queryKey: ['colleges'], queryFn: () => api.colleges.list().then(r => r.data) })
  return (
    <>
      <Field label="Department Name" required>
        <Input placeholder="e.g. Crop Science" value={form.name || ''} onChange={set('name')} />
      </Field>
      <Field label="Code" required>
        <Input placeholder="e.g. CRSC" value={form.code || ''} onChange={set('code')} />
      </Field>
      <Field label="College" required>
        <Select value={form.college_id || ''} onChange={(e) => setForm({ ...form, college_id: Number(e.target.value) })}>
          <option value="">Select college…</option>
          {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
    </>
  )
}

export function DepartmentsPage() {
  const { data: colleges = [] } = useQuery({ queryKey: ['colleges'], queryFn: () => api.colleges.list().then(r => r.data) })
  return (
    <CrudPage
      title="Departments"
      subtitle="Manage academic departments"
      queryKey="departments"
      fetchFn={() => api.departments.list().then(r => r.data)}
      createFn={(d) => api.departments.create(d)}
      updateFn={(id, d) => api.departments.update(id, d)}
      deleteFn={(id) => api.departments.delete(id)}
      icon={Building2}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Department' },
        { key: 'college', label: 'College', render: (_, row) => row.college?.name || '—' },
        { key: 'is_active', label: 'Status', render: (v) => <span className={v ? 'badge-green' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
      ]}
      FormFields={DeptForm}
      defaultValues={{ name: '', code: '', college_id: '' }}
    />
  )
}

export default DepartmentsPage
