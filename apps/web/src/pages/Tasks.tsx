import { useState } from 'react';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskForm } from '../components/tasks/TaskForm';

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📋 Задачи</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Новая задача
        </button>
      </div>

      <TaskTable />

      {/* Модальное окно формы */}
      {showForm && (
        <TaskForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}