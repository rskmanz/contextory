'use client';

import React, { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { AddCardButton } from '@/components/dashboard/AddCardButton';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { MetaSidebar } from '@/components/layout/MetaSidebar';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { useStore } from '@/lib/store';
import { Project } from '@/types';

export default function Home() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [addProjectCategory, setAddProjectCategory] = useState('Side Projects');
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const projects = useStore((state) => state.projects);
  const workspaces = useStore((state) => state.workspaces);
  const loadData = useStore((state) => state.loadData);
  const isLoaded = useStore((state) => state.isLoaded);
  const deleteProject = useStore((state) => state.deleteProject);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectsByCategory = projects.reduce((acc, project) => {
    if (!acc[project.category]) {
      acc[project.category] = [];
    }
    acc[project.category].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  const getProjectWorkspaces = (projectId: string) => {
    return workspaces.filter(w => w.projectId === projectId);
  };

  const handleAddProject = (category: string) => {
    setAddProjectCategory(category);
    setIsAddProjectOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    'Side Projects': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    ),
    'VCs': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    ),
    'Main': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  };

  const categorySubtitles: Record<string, string> = {
    'Side Projects': 'Personal and freelance projects',
    'VCs': 'Venture capital related projects',
    'Main': 'Core business projects',
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <MetaSidebar activePage="home" />

      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      ) : (
        <div className="flex-1 h-screen overflow-y-auto">
          {/* Header with Breadcrumb */}
          <div className="sticky top-0 bg-white border-b border-zinc-100 px-8 sm:px-12 py-3 z-10">
            <Breadcrumb items={[{ label: 'Home' }]} />
          </div>

          <div className="p-8 sm:p-12 relative">
            <div className="mx-auto max-w-[1600px] relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-12">
                <h1 className="text-3xl font-bold text-zinc-800">
                  Projects
                </h1>
              </div>

              {Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
                <DashboardSection
                  key={category}
                  title={category}
                  subtitle={categorySubtitles[category] || ''}
                  icon={categoryIcons[category] || categoryIcons['Main']}
                >
                  {categoryProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      title={project.name}
                      gradient={project.gradient}
                      icon={<span>{project.icon}</span>}
                      workspaces={getProjectWorkspaces(project.id).map(w => ({ id: w.id, name: w.name }))}
                      projectId={project.id}
                      onEdit={() => handleEditProject(project)}
                      onDelete={() => handleDeleteProject(project)}
                    />
                  ))}
                  <AddCardButton onClick={() => handleAddProject(category)} />
                </DashboardSection>
              ))}
            </div>
          </div>
        </div>
      )}

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        defaultCategory={addProjectCategory}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingProject(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This will also delete all associated workspaces.`}
      />
    </div>
  );
}
