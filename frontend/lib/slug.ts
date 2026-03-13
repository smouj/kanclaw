import { prisma } from '@/lib/prisma';

const FALLBACK_SLUG = 'project';

export function toProjectSlug(input: string) {
  const sanitized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return sanitized || FALLBACK_SLUG;
}

export async function generateUniqueProjectSlug(input: string) {
  const baseSlug = toProjectSlug(input);
  const collisions = await prisma.project.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
    select: { slug: true },
  });

  const taken = new Set(collisions.map((project) => project.slug));
  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}
