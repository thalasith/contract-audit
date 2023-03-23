export interface RepoData {
  id: number;
  name: string;
  owner: string;
  repoName: string;
  homePage: string;
  github_link: string;
}

export interface gitHubData {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}
