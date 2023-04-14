import { type NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { api } from "~/utils/api";

const DynamicSyntaxHighlighter = dynamic(
  async () => {
    const { Light: SyntaxHighlighter } = await import(
      "react-syntax-highlighter"
    );
    const { docco } = await import(
      "react-syntax-highlighter/dist/esm/styles/hljs"
    );
    const DynamicComponent = ({
      children,
      ...props
    }: SyntaxHighlighterProps) => (
      <SyntaxHighlighter {...props} style={docco}>
        {children}
      </SyntaxHighlighter>
    );
    DynamicComponent.displayName = "DynamicSyntaxHighlighter";
    return DynamicComponent;
  },
  {
    ssr: false,
  }
);

const File: NextPage = () => {
  const router = useRouter();
  const [username, setUserName] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [file, setFile] = useState<string>("");
  const [repoFile, setRepoFile] = useState<string>("");
  const [audit, setAudit] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { data: fileData, isSuccess } = api.repos.getFile.useQuery({
    username: username,
    repoName: repo,
    path: "/" + path,
  });

  useEffect(() => {
    if (router.isReady) {
      setUserName((router.query.username || "")?.toString());
      setRepo((router.query.repo || "")?.toString());
      if (Array.isArray(router.query.path)) {
        setPath(router.query.path.join("/"));
      } else {
        setPath(router.query.path || "");
      }
    }

    if (isSuccess) {
      setFile(fileData || "");
    }
  }, [router, fileData, isSuccess]);

  const keyPomPrompt = api.keypom.createAudit.useQuery(
    {
      username: username,
      repoName: repo,
      path: "/" + path,
    },
    { enabled: false }
  );

  type Audit = {
    github_name: string;
    audit_description: string;
  };
  const { data: auditData } = api.keypom.getAudit.useQuery({
    github_name: repo,
  }) as { data: Audit[] };

  const filteredAudit = auditData?.filter((audit: Audit) => {
    return audit.github_name === repo;
  })[0];

  const handleKeyPom = async () => {
    setLoading(true);
    setRepoFile(file);
    await keyPomPrompt.refetch().catch((err) => {
      console.log(err);
    });

    setLoading(false);
  };

  const handleClick = () => {
    void handleKeyPom();
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-grey-500 flex min-h-screen flex-col items-center justify-center text-gray-800">
        <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16">
          <button
            className="bg-gray-400 hover:bg-gray-600"
            onClick={handleClick}
          >
            Click me to Run ChatGPT!
          </button>
          {loading && <div>Loading...</div>}
          {keyPomPrompt.data && <div>{keyPomPrompt.data}</div>}
          {filteredAudit && (
            <div className=" flex flex-col items-center rounded-lg bg-gray-200 p-2 ">
              <h1 className="py-4 text-4xl">
                Below is the latest audit for your smart contract:{" "}
              </h1>
              <p className="whitespace-pre-line">
                {filteredAudit.audit_description}
              </p>
            </div>
          )}
          <h1>
            Viewing {username} / {repo} / {path}
          </h1>
          <div className="w-full rounded border-b border-gray-400">
            <div className=" flex border-x border-t border-gray-400 bg-gray-500 py-1 pl-2 text-white">
              {" "}
              Viewing {username} / {repo} / {path}
            </div>
            <div>
              {" "}
              <DynamicSyntaxHighlighter language="javascript">
                {file}
              </DynamicSyntaxHighlighter>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default File;
