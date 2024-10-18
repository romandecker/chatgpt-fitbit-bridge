import type { Meta, StoryObj } from "@storybook/react";

import { NutritionalValues } from "./NutritionalValues";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "NutritionalValues",
  component: NutritionalValues,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  // args: { onClick: fn() },
} satisfies Meta<typeof NutritionalValues>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    calories: 323,
    carbs: 20,
    fat: 10,
    fiber: 4,
    foodName: "Testfood with some longer description",
    protein: 15,
    sodium: 20,
    date: new Date().toISOString(),
    mealTypeId: 3,
  },
};
