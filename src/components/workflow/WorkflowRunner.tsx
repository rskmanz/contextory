'use client';

import React, { useState, useRef } from 'react';
import { Workflow, WORKFLOW_STEP_INFO } from '@/types';
import { useStore } from '@/lib/store';
import { executeWorkflow } from '@/lib/workflow-executor';

interface WorkflowRunnerProps {
  workflow: Workflow;
  onDone: () => void;
  onMessage: (content: string) => void;
}

interface StepProgress {
  stepId: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({
  workflow,
  onDone,
  onMessage,
}) => {
  const aiSettings = useStore((state) => state.aiSettings);
  const [stepProgress, setStepProgress] = useState<StepProgress[]>(
    workflow.steps.map((s) => ({ stepId: s.id, status: 'pending', message: '' }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    if (!aiSettings?.apiKey) {
      onMessage('Set API key in settings to run workflows.');
      return;
    }

    setIsRunning(true);
    setIsDone(false);
    setStepProgress(workflow.steps.map((s) => ({ stepId: s.id, status: 'pending', message: '' })));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await executeWorkflow(
        workflow,
        {
          apiSettings: {
            provider: aiSettings.provider || 'openai',
            model: aiSettings.model,
            apiKey: aiSettings.apiKey,
          },
          workspaceId: workflow.workspaceId || '',
          projectId: workflow.projectId,
        },
        (stepId, status, message) => {
          setStepProgress((prev) =>
            prev.map((sp) =>
              sp.stepId === stepId ? { ...sp, status, message } : sp
            )
          );
        },
        controller.signal
      );

      setIsDone(true);

      // Send final summary to chat
      const completedSteps = workflow.steps.length;
      onMessage(`Workflow "${workflow.name}" completed (${completedSteps} steps).`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        onMessage(`Workflow "${workflow.name}" was cancelled.`);
      } else {
        onMessage(`Workflow "${workflow.name}" failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const getStatusIcon = (status: StepProgress['status']) => {
    switch (status) {
      case 'pending': return '\u{23F3}';
      case 'running': return '\u{1F504}';
      case 'done': return '\u{2705}';
      case 'error': return '\u{274C}';
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700">
          {isDone ? 'Completed' : isRunning ? 'Running...' : 'Ready to run'}
        </p>
        {!isRunning && !isDone && (
          <button
            onClick={handleRun}
            className="px-3 py-1 text-[11px] font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-all"
          >
            Run
          </button>
        )}
        {isRunning && (
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-[11px] font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-all"
          >
            Cancel
          </button>
        )}
        {isDone && (
          <button
            onClick={onDone}
            className="px-3 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {workflow.steps.map((step, index) => {
          const progress = stepProgress.find((sp) => sp.stepId === step.id);
          const info = WORKFLOW_STEP_INFO[step.type];
          return (
            <div key={step.id} className="flex items-start gap-2">
              <span className="text-xs mt-0.5 w-5 text-center shrink-0">
                {getStatusIcon(progress?.status || 'pending')}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-medium ${
                  progress?.status === 'error' ? 'text-red-600' :
                  progress?.status === 'done' ? 'text-zinc-700' :
                  progress?.status === 'running' ? 'text-zinc-900' :
                  'text-zinc-400'
                }`}>
                  {index + 1}. {info.icon} {step.name}
                </p>
                {progress?.message && progress.status !== 'pending' && (
                  <p className={`text-[10px] mt-0.5 truncate ${
                    progress.status === 'error' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {progress.message.slice(0, 120)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
