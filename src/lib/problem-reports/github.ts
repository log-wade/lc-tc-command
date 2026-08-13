type PullRequestDetails = {
  merged: boolean;
  state: string;
  draft: boolean;
  mergeable: boolean | null;
  base: { ref: string };
  head: { ref: string };
};

type MergeResponse = {
  merged: boolean;
  message?: string;
  sha?: string;
};

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("GitHub automatic merge is not configured.");
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function parsePullRequestUrl(prUrl: string): {
  owner: string;
  repo: string;
  pullNumber: number;
} {
  const url = new URL(prUrl);
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
  if (url.hostname !== "github.com" || !match) {
    throw new Error("Cursor returned an invalid GitHub pull request URL.");
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
    pullNumber: Number(match[3]),
  };
}

function expectedRepository(): { owner: string; repo: string } {
  const configured =
    process.env.CURSOR_REPO_URL?.trim() || "https://github.com/log-wade/lc-tc-command";
  const url = new URL(configured);
  const [owner, repo] = url.pathname.replace(/^\/|\/$/g, "").split("/");
  if (url.hostname !== "github.com" || !owner || !repo) {
    throw new Error("CURSOR_REPO_URL must be a GitHub repository URL.");
  }
  return { owner, repo: repo.replace(/\.git$/i, "") };
}

async function githubError(response: Response): Promise<Error> {
  let message = `GitHub request failed (${response.status}).`;
  try {
    const data = (await response.json()) as { message?: string };
    message = data.message || message;
  } catch {
    // Use the status-based message when the response is not JSON.
  }
  return new Error(message);
}

export async function mergePullRequest(prUrl: string): Promise<{ sha?: string }> {
  const parsed = parsePullRequestUrl(prUrl);
  const expected = expectedRepository();
  if (
    parsed.owner.toLowerCase() !== expected.owner.toLowerCase() ||
    parsed.repo.toLowerCase() !== expected.repo.toLowerCase()
  ) {
    throw new Error("Refusing to merge a pull request from an unexpected repository.");
  }

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/pulls/${parsed.pullNumber}`;
  const detailsResponse = await fetch(endpoint, {
    headers: githubHeaders(),
    cache: "no-store",
  });
  if (!detailsResponse.ok) throw await githubError(detailsResponse);
  const details = (await detailsResponse.json()) as PullRequestDetails;

  if (details.merged) return {};
  if (details.state !== "open" || details.draft) {
    throw new Error("The implementation pull request is not open and ready to merge.");
  }
  if (details.base.ref !== "main" || !details.head.ref.startsWith("cursor/")) {
    throw new Error("Refusing to merge a pull request outside the approved Cursor-to-main flow.");
  }
  if (details.mergeable === false) {
    throw new Error("The implementation pull request has merge conflicts.");
  }
  if (details.mergeable === null) {
    throw new Error("GitHub is still checking whether the implementation can be merged.");
  }

  const mergeResponse = await fetch(`${endpoint}/merge`, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({ merge_method: "squash" }),
    cache: "no-store",
  });
  const merge = (await mergeResponse.json()) as MergeResponse;
  if (!mergeResponse.ok || !merge.merged) {
    throw new Error(merge.message || `GitHub could not merge the pull request.`);
  }
  return { sha: merge.sha };
}
