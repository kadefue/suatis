// src/pages/RoomsPage.jsx
import CrudPage from '../components/CrudPage'
import { api } from '../api/client'
import { Field, Input, Select } from '../components/ui'
import { DoorOpen } from 'lucide-react'

function RoomForm({ form, setForm }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setB = (k) => (e) => setForm({ ...form, [k]: e.target.checked })
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Room Name" required>
          <Input placeholder="Lecture Hall A" value={form.name || ''} onChange={set('name')} />
        </Field>
        <Field label="Code" required>
          <Input placeholder="LH-A" value={form.code || ''} onChange={set('code')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity" required>
          <Input type="number" min={1} value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </Field>
        <Field label="Floor">
          <Input type="number" min={0} value={form.floor ?? ''} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Usage Type" required>
          <Select value={form.usage_type || 'LECTURE'} onChange={set('usage_type')}>
            <option value="LECTURE">Lecture Only</option>
            <option value="LAB">Lab Only</option>
            <option value="BOTH">Lecture & Lab</option>
          </Select>
        </Field>
        <Field label="Campus" required>
          <Select value={form.campus || 'MAIN'} onChange={set('campus')}>
            <option value="MAIN">Main Campus</option>
            <option value="MAZIMBU">Mazimbu Campus</option>
          </Select>
        </Field>
      </div>
      <Field label="Building">
        <Input placeholder="e.g. Block A" value={form.building || ''} onChange={set('building')} />
      </Field>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!form.has_projector} onChange={setB('has_projector')} />
          Has Projector
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!form.has_ac} onChange={setB('has_ac')} />
          Has AC
        </label>
      </div>
    </>
  )
}

const USAGE_BADGE = {
  LECTURE: <span className="badge-blue">Lecture</span>,
  LAB: <span className="badge-purple">Lab</span>,
  BOTH: <span className="badge-green">Lecture + Lab</span>,
}

export default function RoomsPage() {
  return (
    <CrudPage
      title="Rooms & Labs"
      subtitle="Manage classrooms and laboratory spaces"
      queryKey="rooms"
      fetchFn={() => api.rooms.list().then(r => r.data)}
      createFn={(d) => api.rooms.create(d)}
      updateFn={(id, d) => api.rooms.update(id, d)}
      deleteFn={(id) => api.rooms.delete(id)}
      icon={DoorOpen}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Room' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'usage_type', label: 'Type', render: (v) => USAGE_BADGE[v] || v },
        { key: 'campus', label: 'Campus', render: (v) => <span className={v === 'MAIN' ? 'badge-blue' : 'badge-amber'}>{v}</span> },
        { key: 'has_projector', label: 'Proj.', render: (v) => v ? '✓' : '—' },
      ]}
      FormFields={RoomForm}
      defaultValues={{ name: '', code: '', capacity: 30, usage_type: 'LECTURE', campus: 'MAIN', building: '', floor: 0, has_projector: false, has_ac: false }}
    />
  )
}
