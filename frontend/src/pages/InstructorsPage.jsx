// src/pages/InstructorsPage.jsx
import { useQuery } from '@tanstack/react-query'
import CrudPage from '../components/CrudPage'
import { api } from '../api/client'
import { Field, Input, Select } from '../components/ui'
import { Users } from 'lucide-react'

function InstructorForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.departments.list().then(r => r.data) })
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required>
          <Input placeholder="John" value={form.first_name || ''} onChange={set('first_name')} />
        </Field>
        <Field label="Last Name" required>
          <Input placeholder="Doe" value={form.last_name || ''} onChange={set('last_name')} />
        </Field>
      </div>
      <Field label="Email" required>
        <Input type="email" placeholder="john.doe@sua.ac.tz" value={form.email || ''} onChange={set('email')} />
      </Field>
      <Field label="Staff ID" required>
        <Input placeholder="SUA/STAFF/001" value={form.staff_id || ''} onChange={set('staff_id')} />
      </Field>
      <Field label="Department">
        <Select value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: e.target.value ? Number(e.target.value) : null })}>
          <option value="">None</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </Field>
      <Field label="Max Load Hours / Week">
        <Input type="number" min={1} max={40} value={form.max_load_hours ?? 20} onChange={(e) => setForm({ ...form, max_load_hours: Number(e.target.value) })} />
      </Field>
    </>
  )
}

export default function InstructorsPage() {
  return (
    <CrudPage
      title="Instructors"
      subtitle="Manage academic staff"
      queryKey="instructors"
      fetchFn={() => api.instructors.list().then(r => r.data)}
      createFn={(d) => api.instructors.create(d)}
      updateFn={(id, d) => api.instructors.update(id, d)}
      deleteFn={(id) => api.instructors.delete(id)}
      icon={Users}
      searchKey="last_name"
      columns={[
        { key: 'staff_id', label: 'Staff ID' },
        { key: 'first_name', label: 'Name', render: (_, row) => `${row.first_name} ${row.last_name}` },
        { key: 'email', label: 'Email' },
        { key: 'max_load_hours', label: 'Max Hrs/Wk' },
        { key: 'is_active', label: 'Status', render: (v) => <span className={v ? 'badge-green' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
      ]}
      FormFields={InstructorForm}
      defaultValues={{ first_name: '', last_name: '', email: '', staff_id: '', department_id: null, max_load_hours: 20 }}
    />
  )
}
