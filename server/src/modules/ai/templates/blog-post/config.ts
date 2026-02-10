import type { AiTemplateDefinition } from "../../ai.types.js";

const config: Omit<AiTemplateDefinition, "systemPrompt"> = {
  id: "blog-post",
  name: "Blog Post",
  description: "Generate an SEO-optimized blog post about Caucasus tourism.",
  type: "BLOG_CONTENT",
  creditCost: 5,
  maxOutputTokens: 4000,
  modelConfig: {
    temperature: 0.7,
  },
  fields: [
    {
      name: "topic",
      label: "Blog Topic",
      type: "textarea",
      required: true,
      placeholder: "e.g. Top 10 Hidden Gems in the Georgian Highlands",
    },
    {
      name: "targetLength",
      label: "Target Length",
      type: "select",
      required: true,
      options: [
        { value: "short", label: "Short (400-600 words)" },
        { value: "medium", label: "Medium (800-1200 words)" },
        { value: "long", label: "Long (1500-2500 words)" },
      ],
    },
    {
      name: "keywords",
      label: "SEO Keywords",
      type: "text",
      required: false,
      placeholder: "e.g. Georgia travel, Caucasus hiking, Tbilisi food",
    },
    {
      name: "tone",
      label: "Writing Tone",
      type: "select",
      required: false,
      defaultValue: "casual",
      options: [
        { value: "professional", label: "Professional & Informative" },
        { value: "casual", label: "Casual & Personal" },
        { value: "adventurous", label: "Adventurous & Exciting" },
      ],
    },
    {
      name: "targetAudience",
      label: "Target Audience",
      type: "text",
      required: false,
      placeholder: "e.g. budget travelers, luxury seekers, adventure enthusiasts",
    },
    {
      name: "outline",
      label: "Rough Outline (optional)",
      type: "textarea",
      required: false,
      placeholder: "e.g. 1. Introduction to the region 2. Best time to visit 3. Must-see places",
    },
  ],
};

export default config;
