import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { FolderKanban } from 'lucide-react';
import { ProjectForm } from '../components/projects/ProjectForm';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => get('/projects'),
  });

  if (isLoading) return <div className="p-4 text-gray-600">Загрузка...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">🏗️ Проекты</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Новый проект
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data?.map((project: any) => (
          <div key={project.id} className="card-hover">
            <div className="flex items-start gap-3">
              <div className="bg-primary-500 rounded-lg p-2">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{project.description || 'Нет описания'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Статус:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!data?.data || data.data.length === 0) && (
        <div className="card text-center py-12">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Проекты пока не созданы</p>
        </div>
      )}

      {showForm && (
        <ProjectForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}