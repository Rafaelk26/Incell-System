import dynamic from "next/dynamic";

const RelatorioCelula = dynamic(
  () => import("./relatorioCelula"),
  { ssr: false }
);

export default function Page() {
  return <RelatorioCelula />;
}
