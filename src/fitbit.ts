import axios, { AxiosInstance } from "axios";
import { listTimeZones } from "timezone-support";
import { TokenSet } from "./auth/auth";
import { z } from "zod";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

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
  timestamp: z.coerce.date().optional(),
  tz: z
    .string()
    .default("Europe/Vienna")
    .refine((str) => listTimeZones().includes(str)),
  amount: z.coerce.number(),
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

  async createFoodLog({ tz, timestamp, ...payload }: FoodLogPayload) {
    if (!timestamp) {
      timestamp = toZonedTime(new Date(), tz);
    }

    const resp = await this.axios.post(`/user/-/foods/log.json`, undefined, {
      params: {
        ...payload,
        mealTypeId: getMealTypeId(timestamp),
        date: format(timestamp, "yyyy-MM-dd"),
        unitId: 304, // "servings"
      },
    });

    return createFoodLogResponseSchema.parse(resp.data);
  }
}

function getMealTypeId(timestamp: Date) {
  const formatted = format(timestamp, "HH:mm");

  if ("05:00" <= formatted && formatted < "10:00") {
    return 1;
  } else if ("10:00" <= formatted && formatted < "11:30") {
    return 2;
  } else if ("11:30" <= formatted && formatted < "14:00") {
    return 3;
  } else if ("14:00" <= formatted && formatted < "16:30") {
    return 4;
  } else if ("16:30" <= formatted && formatted < "21:00") {
    return 5;
  } else {
    return 7;
  }
}
