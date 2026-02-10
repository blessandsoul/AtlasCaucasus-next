import type { AiTemplateDefinition } from "../../ai.types.js";

const config: Omit<AiTemplateDefinition, "systemPrompt"> = {
  id: "tour-itinerary",
  name: "Tour Itinerary",
  description: "Generate a detailed day-by-day itinerary for your tour.",
  type: "TOUR_ITINERARY",
  creditCost: 5,
  maxOutputTokens: 3000,
  modelConfig: {
    temperature: 0.7,
  },
  fields: [
    {
      name: "tourTitle",
      label: "Tour Title",
      type: "text",
      required: true,
      placeholder: "e.g. Grand Georgian Adventure",
    },
    {
      name: "locations",
      label: "Locations to Visit",
      type: "textarea",
      required: true,
      placeholder: "e.g. Tbilisi, Kazbegi, Kakheti wine region",
    },
    {
      name: "durationDays",
      label: "Number of Days",
      type: "number",
      required: true,
      placeholder: "e.g. 5",
    },
    {
      name: "tourType",
      label: "Tour Type",
      type: "select",
      required: true,
      options: [
        { value: "cultural", label: "Cultural & Historical" },
        { value: "adventure", label: "Adventure & Outdoor" },
        { value: "food_wine", label: "Food & Wine" },
        { value: "nature", label: "Nature & Wildlife" },
        { value: "mixed", label: "Mixed / Comprehensive" },
      ],
    },
    {
      name: "includeMeals",
      label: "Include Meal Suggestions",
      type: "select",
      required: false,
      defaultValue: "yes",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      name: "activityLevel",
      label: "Activity Level",
      type: "select",
      required: false,
      defaultValue: "moderate",
      options: [
        { value: "easy", label: "Easy / Relaxed" },
        { value: "moderate", label: "Moderate" },
        { value: "challenging", label: "Active / Challenging" },
      ],
    },
    {
      name: "specialInterests",
      label: "Special Interests",
      type: "textarea",
      required: false,
      placeholder: "e.g. wine tasting, hiking, photography, ancient churches",
    },
  ],
};

export default config;
