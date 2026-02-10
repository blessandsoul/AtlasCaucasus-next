import type { AiTemplateDefinition } from "../../ai.types.js";

const config: Omit<AiTemplateDefinition, "systemPrompt"> = {
  id: "tour-description",
  name: "Tour Description",
  description: "Generate a professional, SEO-friendly tour description for your listing.",
  type: "TOUR_DESCRIPTION",
  creditCost: 2,
  maxOutputTokens: 1000,
  modelConfig: {
    temperature: 0.7,
  },
  fields: [
    {
      name: "tourTitle",
      label: "Tour Title",
      type: "text",
      required: true,
      placeholder: "e.g. Svaneti Mountain Adventure",
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
        { value: "city", label: "City Tour" },
        { value: "multi_day", label: "Multi-Day Trip" },
        { value: "photography", label: "Photography Tour" },
      ],
    },
    {
      name: "locations",
      label: "Locations Visited",
      type: "text",
      required: true,
      placeholder: "e.g. Mestia, Ushguli, Enguri Dam",
    },
    {
      name: "duration",
      label: "Duration",
      type: "text",
      required: true,
      placeholder: "e.g. 3 days / 6 hours",
    },
    {
      name: "highlights",
      label: "Key Highlights",
      type: "textarea",
      required: false,
      placeholder: "e.g. UNESCO sites, traditional Svan towers, glacier views",
    },
    {
      name: "targetAudience",
      label: "Target Audience",
      type: "text",
      required: false,
      placeholder: "e.g. families, adventure seekers, couples",
    },
    {
      name: "tone",
      label: "Writing Tone",
      type: "select",
      required: false,
      defaultValue: "professional",
      options: [
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual & Friendly" },
        { value: "adventurous", label: "Adventurous & Exciting" },
        { value: "luxurious", label: "Luxurious & Premium" },
      ],
    },
  ],
};

export default config;
