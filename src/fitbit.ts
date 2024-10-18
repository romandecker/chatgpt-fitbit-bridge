import axios, { AxiosInstance } from "axios";
import { TokenSet } from "./auth/auth";
import { z } from "zod";

export const mealTypes = {
  1: "Breakfast",
  2: "Morning Snack",
  3: "Lunch",
  4: "Afternoon Snack",
  5: "Dinner",
  7: "Anytime",
};

export const createFoodLogSchema = z.object({
  foodName: z.string(),
  mealTypeId: z.union([
    z.literal("1").describe("Breakfast"),
    z.literal("2").describe("Morning Snack"),
    z.literal("3").describe("Lunch"),
    z.literal("4").describe("Afternoon Snack"),
    z.literal("5").describe("Dinner"),
    z.literal("7").describe("Anytime"),
  ]),
  amount: z.coerce.number(),
  date: z.string(),
  brandName: z.string().optional(),
  calories: z.coerce.number(),
  totalCarbohydrate: z.coerce.number().optional(),
  totalFat: z.coerce.number().optional().describe("in grams"),
  dietaryFiber: z.coerce.number().optional().describe("in grams"),
  protein: z.coerce.number().optional().describe("in grams"),
  sodium: z.coerce.number().optional().describe("in milligrams"),
});

export const createFoodLogResponseSchema = z.object({
  foodDay: z.object({
    date: z.coerce.date().transform((dt) => dt.toISOString()),
    summary: z.object({
      calories: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
      protein: z.number(),
      sodium: z.number(),
      water: z.number(),
    }),
  }),
  foodLog: z.object({
    isFavorite: z.boolean(),
    logDate: z.coerce.date().transform((dt) => dt.toISOString()),
    logId: z.number(),
    loggedFood: z.object({
      accessLevel: z.enum(["PRIVATE", "PUBLIC"]),
      amount: z.number(),
      brand: z.string(),
      calories: z.number(),
      foodId: z.number(),
      mealTypeId: z.number(),
      name: z.string(),
      unit: z.any(),
      units: z.any(),
    }),
    nutritionalValues: z.object({
      calories: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
      protein: z.number(),
      sodium: z.number(),
    }),
  }),
});

export type CreateFoodLogResponse = z.infer<typeof createFoodLogResponseSchema>;

export type FoodLogPayload = z.infer<typeof createFoodLogSchema>;

export class FitBitApi {
  protected axios: AxiosInstance;

  constructor(readonly tokenSet: TokenSet) {
    this.axios = axios.create({
      baseURL: "https://api.fitbit.com/1",
      headers: {
        Authorization: `Bearer ${tokenSet.access_token}`,
        Accept: "application/json",
      },
    });
  }

  async searchFoods(query: string) {
    const resp = await this.axios.get("/foods/search.json", {
      params: { query },
    });
    return resp.data;
  }

  async getFoodUnits() {
    const resp = await this.axios.get("/foods/units.json");
    return resp.data;
  }

  async createFoodLog(payload: FoodLogPayload) {
    const resp = await this.axios.post(`/user/-/foods/log.json`, undefined, {
      params: {
        ...payload,
        unitId: 304, // "servings"
      },
    });

    return createFoodLogResponseSchema.parse(resp.data);
  }
}
