// src/pages/ProgramsPage.jsx
import { useQuery } from '@tanstack/react-query'
import CrudPage from '../components/CrudPage'
import { api } from '../api/client'
import { Field, Input, Select } from '../components/ui'
import { GraduationCap } from 'lucide-react'

function ProgramForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setN = (k) => (e) => setForm({ ...form, [k]: Number(e.target.value) })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.departments.list().then(r => r.data) })
  return (
    <>
      <Field label="Program Name" required>
        <Input placeholder="e.g. BSc Agronomy" value={form.name || ''} onChange={set('name')} />
      </Field>
      <Field label="Code" required>
        <Input placeholder="e.g. BSAGR" value={form.code || ''} onChange={set('code')} />
      </Field>
      <Field label="Department" required>
        <Select value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}>
          <option value="">Select department…</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity">
          <Input type="number" min={0} value={form.capacity ?? 0} onChange={setN('capacity')} />
        </Field>
        <Field label="Current Enrollment">
          <Input type="number" min={0} value={form.current_enrollment ?? 0} onChange={setN('current_enrollment')} />
        </Field>
      </div>
      <Field label="Year of Study">
        <Select value={form.year_of_study ?? 1} onChange={(e) => setForm({ ...form, year_of_study: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
        </Select>
      </Field>
    </>
  )
}

export default function ProgramsPage() {
  return (
    <CrudPage
      title="Programs"
      subtitle="Manage academic programs and their enrollments"
      queryKey="programs"
      fetchFn={() => api.programs.list().then(r => r.data)}
      createFn={(d) => api.programs.create(d)}
      updateFn={(id, d) => api.programs.update(id, d)}
      deleteFn={(id) => api.programs.delete(id)}
      icon={GraduationCap}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Program' },
        { key: 'year_of_study', label: 'Year', render: (v) => `Year ${v}` },
        { key: 'current_enrollment', label: 'Enrolled' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'is_active', label: 'Status', render: (v) => <span className={v ? 'badge-green' : 'badge-gray'}>{v ? 'Active' : 'Inactive'}</span> },
      ]}
      FormFields={ProgramForm}
      defaultValues={{ name: '', code: '', department_id: '', capacity: 0, current_enrollment: 0, year_of_study: 1 }}
    />
  )
}
