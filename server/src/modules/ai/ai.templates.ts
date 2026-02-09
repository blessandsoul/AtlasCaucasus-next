import type { AiTemplate } from "./ai.types.js";

const TEMPLATES: AiTemplate[] = [
  {
    id: "tour-description",
    name: "Tour Description",
    description: "Generate a professional, SEO-friendly tour description for your listing.",
    type: "TOUR_DESCRIPTION",
    creditCost: 2,
    maxOutputTokens: 1000,
    systemPrompt: `You are an expert tourism copywriter specializing in the Caucasus region (Georgia, Armenia, Azerbaijan). Write a compelling, SEO-friendly tour description that:
- Uses vivid, sensory language to bring the experience to life
- Highlights unique cultural, natural, and historical aspects of the Caucasus
- Includes practical details naturally woven into the narrative
- Maintains a warm, inviting tone that builds excitement
- Is structured with clear paragraphs for easy reading
- Avoids cliches and generic tourism phrases
- Does NOT use markdown formatting — output plain text with paragraph breaks only`,
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
  },
  {
    id: "tour-itinerary",
    name: "Tour Itinerary",
    description: "Generate a detailed day-by-day itinerary for your tour.",
    type: "TOUR_ITINERARY",
    creditCost: 5,
    maxOutputTokens: 3000,
    systemPrompt: `You are an expert tour planner specializing in the Caucasus region. Generate a detailed, realistic itinerary that:
- Has one entry per day with a clear title and detailed description
- Includes realistic timing and logistics for the Caucasus region
- Mentions specific landmarks, restaurants, and experiences where appropriate
- Considers altitude, road conditions, and seasonal factors
- Balances activity with rest periods
- Includes local food and cultural experiences

CRITICAL: You MUST respond with a valid JSON array. Each element must be an object with exactly two keys: "title" (string) and "description" (string).
Example format:
[{"title":"Day 1: Arrival in Tbilisi","description":"Arrive at Tbilisi International Airport..."}]

Do NOT wrap the JSON in markdown code fences. Output ONLY the raw JSON array.`,
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
  },
  {
    id: "marketing-social",
    name: "Social Media Post",
    description: "Generate engaging social media copy for promoting your tour.",
    type: "MARKETING_COPY",
    creditCost: 2,
    maxOutputTokens: 500,
    systemPrompt: `You are a social media marketing expert for tourism in the Caucasus region. Create engaging, platform-appropriate social media content that:
- Matches the conventions and character limits of the specified platform
- Uses relevant emojis naturally (not excessively)
- Includes a compelling hook in the first line
- Creates urgency or curiosity
- Includes a clear call-to-action
- Uses relevant hashtags for discoverability

Platform guidelines:
- Instagram: Up to 2200 chars, visual storytelling, 20-30 hashtags in a separate section
- Facebook: 1-3 short paragraphs, conversational tone, 3-5 hashtags
- Twitter/X: Under 280 chars, punchy and direct, 2-3 hashtags
- General: Versatile copy adaptable to any platform

Do NOT use markdown formatting. Output plain text only.`,
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
  },
  {
    id: "blog-post",
    name: "Blog Post",
    description: "Generate an SEO-optimized blog post about Caucasus tourism.",
    type: "BLOG_CONTENT",
    creditCost: 5,
    maxOutputTokens: 4000,
    systemPrompt: `You are an expert travel blogger and SEO content writer specializing in the Caucasus region (Georgia, Armenia, Azerbaijan). Write a compelling blog post that:
- Has an attention-grabbing title and introduction
- Is well-structured with clear sections and subheadings
- Includes specific, accurate information about the Caucasus region
- Weaves in practical tips and local insights
- Uses natural keyword placement for SEO
- Has a clear conclusion with a call-to-action
- Maintains an authentic, personal voice

Target lengths:
- Short: 400-600 words
- Medium: 800-1200 words
- Long: 1500-2500 words

Do NOT use markdown formatting for the body — use plain text with clear paragraph breaks and section headings in ALL CAPS.`,
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
  },
];

/**
 * Get all available templates (for the public listing endpoint).
 */
export function getAllTemplates(): AiTemplate[] {
  return TEMPLATES;
}

/**
 * Get a specific template by ID. Returns undefined if not found.
 */
export function getTemplate(templateId: string): AiTemplate | undefined {
  return TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Build a user prompt from template + user inputs.
 * Combines the user's field values into a structured prompt for the AI model.
 */
export function buildPrompt(template: AiTemplate, userInputs: Record<string, string>): string {
  const parts: string[] = [];

  for (const field of template.fields) {
    const value = userInputs[field.name];
    if (value && value.trim()) {
      parts.push(`${field.label}: ${value.trim()}`);
    }
  }

  return parts.join("\n");
}
