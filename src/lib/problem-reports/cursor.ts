type CursorGitBranch = {
  repoUrl: string;
  branch?: string;
  prUrl?: string;
};

type CursorAgent = {
  id: string;
  latestRunId?: string;
};

type CursorRun = {
  id: string;
  agentId: string;
  status: string;
  result?: string;
  git?: {
    branches?: CursorGitBranch[];
  };
};

type CreateCursorAgentResponse = {
  agent: CursorAgent;
  run: CursorRun;
};

class CursorRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "CursorRequestError";
    this.retryable = retryable;
  }
}

function cursorAuthorization(): string {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) throw new Error("Cursor Cloud Agents is not configured.");
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function cursorRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.cursor.com${path}`, {
    ...init,
    headers: {
      Authorization: cursorAuthorization(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}

async function cursorError(response: Response): Promise<CursorRequestError> {
  let message = `Cursor Cloud Agents request failed (${response.status}).`;
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    message = data.message || data.error || message;
  } catch {
    // Use the status-based message when the response is not JSON.
  }
  return new CursorRequestError(
    message,
    response.status === 408 || response.status === 429 || response.status >= 500
  );
}

export function isRetryableCursorError(error: unknown): boolean {
  return (
    (error instanceof CursorRequestError && error.retryable) ||
    (error instanceof TypeError && error.message.toLowerCase().includes("fetch"))
  );
}

export async function ensureCursorAgent(input: {
  agentId: string;
  prompt: string;
}): Promise<{ agentId: string; runId: string }> {
  const repoUrl =
    process.env.CURSOR_REPO_URL?.trim() || "https://github.com/log-wade/lc-tc-command";
  const response = await cursorRequest("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      agentId: input.agentId,
      prompt: { text: input.prompt },
      repos: [{ url: repoUrl, startingRef: "main" }],
      mode: "agent",
      autoCreatePR: true,
      skipReviewerRequest: true,
    }),
  });

  if (response.ok) {
    const data = (await response.json()) as CreateCursorAgentResponse;
    return {
      agentId: data.agent.id,
      runId: data.run.id,
    };
  }

  if (response.status !== 409) throw await cursorError(response);

  const existingResponse = await cursorRequest(`/v1/agents/${encodeURIComponent(input.agentId)}`);
  if (!existingResponse.ok) throw await cursorError(existingResponse);
  const existing = (await existingResponse.json()) as CursorAgent;
  if (!existing.latestRunId) {
    throw new Error("The existing Cursor agent has no implementation run.");
  }
  return {
    agentId: existing.id,
    runId: existing.latestRunId,
  };
}

export async function getCursorRun(agentId: string, runId: string): Promise<CursorRun> {
  const response = await cursorRequest(
    `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`
  );
  if (!response.ok) throw await cursorError(response);
  return (await response.json()) as CursorRun;
}
