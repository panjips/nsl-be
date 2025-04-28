import { z } from "zod";

const CreateCategoryDTO = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

const UpdateCategoryDTO = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
});

type CreateCategoryDTOType = z.infer<typeof CreateCategoryDTO>;
type UpdateCategoryDTOType = z.infer<typeof UpdateCategoryDTO>;

export { CreateCategoryDTO, UpdateCategoryDTO };
export type { CreateCategoryDTOType, UpdateCategoryDTOType };
