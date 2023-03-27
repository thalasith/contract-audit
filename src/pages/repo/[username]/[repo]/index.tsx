import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { FaFolder, FaRegFile } from "react-icons/fa";
import Link from "next/link";

const Repo: NextPage = () => {
  const router = useRouter();
  const [username, setUserName] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const { data: repoData, isSuccess } = api.repos.getRepoFiles.useQuery({
    username: username,
    repoName: repo,
  });

  useEffect(() => {
    if (router.isReady) {
      setUserName((router.query.username || "")?.toString());
      setRepo((router.query.repo || "")?.toString());
    }

    if (isSuccess) {
      setFiles(repoData?.files || []);
      setFolders(repoData?.folders || []);
    }
  }, [router, repoData, isSuccess]);

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-grey-500 flex min-h-screen flex-col items-center justify-center text-gray-800">
        <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16">
          <h1>
            Viewing {username} / {repo}
          </h1>
          <div className="w-full rounded border-b border-gray-400">
            <div className=" flex border-x border-t border-gray-400 bg-gray-500 py-1 pl-2 text-white">
              {" "}
              Viewing {username} / {repo}
            </div>
            {folders.map((folder) => {
              return (
                <Link
                  key={folder}
                  className=" flex border-x border-t border-gray-400 bg-gray-200 py-1"
                  href={`/repo/${username}/${repo}/tree/main/${folder}`}
                >
                  <FaFolder className="mx-2 mt-1 text-gray-700" />
                  {folder}
                </Link>
              );
            })}
            {files.map((file) => {
              return (
                <div
                  key={file}
                  className=" flex border-x border-t border-gray-400 bg-gray-200 py-1"
                >
                  <FaRegFile className="mx-2 mt-1 text-gray-700" />
                  {file}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
};

export default Repo;
