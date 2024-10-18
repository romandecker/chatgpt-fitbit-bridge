import { CircleCheckBig } from "lucide-react";
import { Layout } from "../Layout";
import {
  NutritionalValues,
  NutritionalValuesProps,
} from "./NutritionalValues/NutritionalValues";

export type SuccessfulLogPageProps = NutritionalValuesProps;

export function SuccessfulLogPage(props: SuccessfulLogPageProps) {
  return (
    <Layout>
      <div className="max-w-md gap-2 flex flex-col items-center">
        <h1 className="flex flex-row gap-2 font-bold justify-center">
          <CircleCheckBig color="green" /> Logged with FitBit{" "}
        </h1>
        <NutritionalValues {...props} />
      </div>
    </Layout>
  );
}
