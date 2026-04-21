const { z } = require("zod");

const createLinkSchema = z.object({
  body: z.object({
    url: z.string().url("Invalid URL format"),
    title: z.string().optional(),
    category: z.string().optional(),
    note: z.string().optional(),
    vault: z.string().optional() // MongoDB ObjectId string
  })
});

const updateLinkSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    isPinned: z.boolean().optional(),
    vault: z.string().optional().nullable()
  }),
  params: z.object({
    id: z.string()
  })
});

module.exports = {
  createLinkSchema,
  updateLinkSchema
};