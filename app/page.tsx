import dynamic from "next/dynamic";

const Quiz = dynamic(() => import("@/components/Quiz"), { ssr: false });

export default function Page() {
  return <Quiz />;
}

