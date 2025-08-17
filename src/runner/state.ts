export type StepType = "manual" | "instruction" | "generator";
export type StepStatus = "ready" | "done" | "skipped";

export interface RunStep {
  id: string;
  runId: string;
  idx: number;
  type: StepType;
  status: StepStatus;
  input?: any;
  output?: any;
  notes?: string;
  checked?: boolean;
}

export async function startRun(runId: string) {
  // no-op: steps already 'ready'
}

export async function completeStep(step: RunStep, output?: any) {
  if (step.status !== "ready") return step;
  step.output = output ?? step.output;
  step.status = "done";
  await save(step);
  return step;
}

export async function skipStep(step: RunStep) {
  if (step.status !== "ready") return step;
  step.status = "skipped";
  await save(step);
  return step;
}

export async function undoTo(runId: string, idxInclusive: number) {
  const steps = await loadSteps(runId);
  for (const s of steps)
    if (s.idx >= idxInclusive) {
      s.status = "ready";
      s.checked = false;
      await save(s);
    }
  return steps;
}

async function save(s: RunStep) {
  /* persist to run_steps */
}
async function loadSteps(runId: string) {
  /* select * from run_steps order by idx */ return [];
}
