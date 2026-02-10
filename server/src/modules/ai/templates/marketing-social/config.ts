import type { AiTemplateDefinition } from "../../ai.types.js";

const config: Omit<AiTemplateDefinition, "systemPrompt"> = {
  id: "marketing-social",
  name: "Social Media Post",
  description: "Generate engaging social media copy for promoting your tour.",
  type: "MARKETING_COPY",
  creditCost: 2,
  maxOutputTokens: 500,
  modelConfig: {
    temperature: 0.8,
  },
  fields: [
    {
      name: "tourTitle",
      label: "Tour Name",
      type: "text",
      required: true,
      placeholder: "e.g. Svaneti Mountain Adventure",
    },
    {
      name: "platform",
      label: "Platform",
      type: "select",
      required: true,
      options: [
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
        { value: "twitter", label: "Twitter / X" },
        { value: "general", label: "General (any platform)" },
      ],
    },
    {
      name: "keyFeatures",
      label: "Key Features to Highlight",
      type: "textarea",
      required: true,
      placeholder: "e.g. stunning mountain views, traditional tower houses, local cuisine",
    },
    {
      name: "callToAction",
      label: "Call to Action",
      type: "text",
      required: false,
      placeholder: "e.g. Book now, Link in bio, DM us",
    },
    {
      name: "hashtags",
      label: "Must-Include Hashtags",
      type: "text",
      required: false,
      placeholder: "e.g. #Georgia #Caucasus #Travel",
    },
    {
      name: "tone",
      label: "Tone",
      type: "select",
      required: false,
      defaultValue: "adventurous",
      options: [
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual & Fun" },
        { value: "adventurous", label: "Adventurous & Exciting" },
        { value: "luxurious", label: "Luxurious & Premium" },
      ],
    },
  ],
};

export default config;
