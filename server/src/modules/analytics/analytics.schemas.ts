import { z } from "zod";

const entityTypeEnum = z.enum(["TOUR", "GUIDE", "DRIVER", "COMPANY"]);

export const TrackViewSchema = z.object({
    entityType: entityTypeEnum,
    entityId: z.string().uuid(),
});
