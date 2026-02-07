'use client';

import React, { useState } from 'react';
import { Workflow, WorkflowStep, WorkflowStepType, WORKFLOW_STEP_TYPES, WORKFLOW_STEP_INFO } from '@/types';
import { useStore } from '@/lib/store';
import { generateId } from '@/lib/utils';

interface WorkflowEditorProps {
  workflow?: Workflow;
  workspaceId: string;
  projectId?: string;
  onSave: () => void;
  onCancel: () => void;
}

const createEmptyStep = (): WorkflowStep => ({
  id: generateId(),
  type: 'research',
  name: 'Research',
  config: {},
});

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  workspaceId,
  projectId,
  onSave,
  onCancel,
}) => {
  const addWorkflow = useStore((state) => state.addWorkflow);
  const updateWorkflow = useStore((state) => state.updateWorkflow);
  const objects = useStore((state) => state.objects);
  const contexts = useStore((state) => state.contexts);

  const [name, setName] = useState(workflow?.name || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(
    workflow?.steps?.length ? workflow.steps : [createEmptyStep()]
  );

  const handleStepTypeChange = (stepId: string, type: WorkflowStepType) => {
    const info = WORKFLOW_STEP_INFO[type];
    setSteps(prev =>
      prev.map(s => s.id === stepId ? { ...s, type, name: info.label, config: {} } : s)
    );
  };

  const handleStepConfigChange = (stepId: string, key: string, value: string) => {
    setSteps(prev =>
      prev.map(s =>
        s.id === stepId ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    );
  };

  const addStep = () => {
    setSteps(prev => [...prev, createEmptyStep()]);
  };

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleSave = async () => {
    if (!name.trim() || steps.length === 0) return;

    if (workflow) {
      await updateWorkflow(workflow.id, { name: name.trim(), steps });
    } else {
      await addWorkflow({
        name: name.trim(),
        icon: '',
        scope: projectId ? 'project' : 'workspace',
        workspaceId,
        projectId,
        steps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    onSave();
  };

  const renderStepConfig = (step: WorkflowStep, index: number) => {
    switch (step.type) {
      case 'research':
        return (
          <input
            type="text"
            value={step.config.topic || ''}
            onChange={(e) => handleStepConfigChange(step.id, 'topic', e.target.value)}
            placeholder="Research topic..."
            className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300 placeholder:text-zinc-400"
          />
        );
      case 'summarize':
        return (
          <p className="text-[10px] text-zinc-400 italic">
            {index > 0 ? 'Auto-summarizes step ' + index + ' output' : 'Provide text input'}
          </p>
        );
      case 'create_item':
        return (
          <select
            value={step.config.objectId || ''}
            onChange={(e) => handleStepConfigChange(step.id, 'objectId', e.target.value)}
            className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300"
          >
            <option value="">Select object...</option>
            {objects.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.icon} {obj.name}</option>
            ))}
          </select>
        );
      case 'add_resource':
        return (
          <p className="text-[10px] text-zinc-400 italic">
            Saves output as a {projectId ? 'project' : 'workspace'} resource
          </p>
        );
      case 'generate_context':
        return (
          <select
            value={step.config.contextId || ''}
            onChange={(e) => handleStepConfigChange(step.id, 'contextId', e.target.value)}
            className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300"
          >
            <option value="">Select context...</option>
            {contexts
              .filter(c => c.projectId === projectId || c.workspaceId === workspaceId)
              .map(ctx => (
                <option key={ctx.id} value={ctx.id}>{ctx.icon} {ctx.name}</option>
              ))}
          </select>
        );
      case 'custom_prompt':
        return (
          <textarea
            value={step.config.prompt || ''}
            onChange={(e) => handleStepConfigChange(step.id, 'prompt', e.target.value)}
            placeholder="Enter prompt... Use {{input}} for previous step output"
            className="w-full text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300 placeholder:text-zinc-400 resize-none"
            rows={2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workflow name..."
        className="w-full text-xs font-medium px-2 py-1.5 bg-zinc-50 border border-zinc-100 rounded-md outline-none focus:border-zinc-300 placeholder:text-zinc-400"
      />

      <div className="space-y-2">
        {steps.map((step, index) => {
          const info = WORKFLOW_STEP_INFO[step.type];
          return (
            <div key={step.id} className="flex gap-2 items-start">
              <span className="text-[10px] text-zinc-400 mt-1.5 w-4 text-right shrink-0">
                {index + 1}.
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <select
                    value={step.type}
                    onChange={(e) => handleStepTypeChange(step.id, e.target.value as WorkflowStepType)}
                    className="flex-1 text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-zinc-300"
                  >
                    {WORKFLOW_STEP_TYPES.map(type => (
                      <option key={type} value={type}>
                        {WORKFLOW_STEP_INFO[type].icon} {WORKFLOW_STEP_INFO[type].label}
                      </option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded transition-colors"
                      title="Remove step"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
                {renderStepConfig(step, index)}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addStep}
        className="w-full text-[11px] text-zinc-500 py-1.5 border border-dashed border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-zinc-300 transition-all"
      >
        + Add Step
      </button>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim() || steps.length === 0}
          className="px-3 py-1.5 text-[11px] font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-30 transition-all"
        >
          {workflow ? 'Update' : 'Save Workflow'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
