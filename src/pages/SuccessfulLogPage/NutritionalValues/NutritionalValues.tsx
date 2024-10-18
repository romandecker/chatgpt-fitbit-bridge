import {
  Amphora,
  Donut,
  Drumstick,
  Flame,
  Leaf,
  Popcorn,
  Tag,
  CalendarClock,
  EggFried,
  Sandwich,
  CookingPot,
  HandPlatter,
  Clock,
} from "lucide-react";

import { CreateFoodLogResponse } from "../../../fitbit";
import { differenceInDays } from "date-fns";

export type NutritionalValuesProps =
  CreateFoodLogResponse["foodLog"]["nutritionalValues"] & {
    foodName: string;
    mealTypeId: number;
    date: string;
  };

function Row({ children }: React.PropsWithChildren) {
  return <li className="flex flex-row justify-between gap-1">{children}</li>;
}

function LabelCol({ children }: React.PropsWithChildren) {
  return <span className="flex flex-row gap-1 mr-2">{children}</span>;
}

const mealTypeIcons = {
  1: EggFried,
  2: Sandwich,
  3: CookingPot,
  4: Donut,
  5: HandPlatter,
  7: Clock,
};

const rtf = new Intl.RelativeTimeFormat("en", {
  localeMatcher: "best fit", // other values: "lookup"
  numeric: "auto", // other values: "auto"
  style: "long", // other values: "short" or "narrow"
});

export function NutritionalValues(props: NutritionalValuesProps) {
  const MealType =
    mealTypeIcons[props.mealTypeId as keyof typeof mealTypeIcons] || Clock;

  return (
    <ul className="flex flex-col gap-1 max-w-md">
      <Row>
        <LabelCol>
          <CalendarClock /> Time:
        </LabelCol>
        <span className="flex flex-row gap-1">
          <MealType />
          {rtf.format(
            differenceInDays(new Date(props.date), new Date()),
            "day"
          )}
        </span>
      </Row>
      <Row>
        <LabelCol>
          <Tag /> Name:
        </LabelCol>
        <span>{props.foodName}</span>
      </Row>
      <Row>
        <LabelCol>
          <Flame className="stroke-red-400" /> Calories:{" "}
        </LabelCol>
        <span>{props.calories} kcal</span>
      </Row>
      <Row>
        <LabelCol>
          <Drumstick className="stroke-blue-400" /> Protein:{" "}
        </LabelCol>
        <span>{props.protein} g</span>
      </Row>
      <Row>
        <LabelCol>
          <Donut className="stroke-orange-400" /> Carbs:{" "}
        </LabelCol>
        <span>{props.carbs} g</span>
      </Row>
      <Row>
        <LabelCol>
          <Amphora className="stroke-yellow-400" /> Fat:{" "}
        </LabelCol>
        <span>{props.fat} g</span>
      </Row>
      <Row>
        <LabelCol>
          <Leaf className="stroke-green-400" /> Fiber:{" "}
        </LabelCol>
        <span>{props.fiber} g</span>
      </Row>
      <Row>
        <LabelCol>
          <Popcorn className="stroke-gray-500" /> Sodium:{" "}
        </LabelCol>
        <span>{props.sodium} mg</span>
      </Row>
    </ul>
  );
}
