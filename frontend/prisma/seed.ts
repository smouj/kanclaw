import { PrismaClient } from '@prisma/client';
import { createProjectFolders } from '../utils/fs';

const prisma = new PrismaClient();

async function main() {
  const slug = 'flickclaw';
  const exists = await prisma.project.findUnique({ where: { slug } });
  if (exists) {
    console.log('Seed skipped: project already exists.');
    return;
  }

  const agents = [
    { name: 'ClipAgent', role: 'Generate video clips' },
    { name: 'SubtitleAgent', role: 'Create subtitles' },
    { name: 'UploadAgent', role: 'Upload clips to platform' },
  ];

  await prisma.project.create({
    data: {
      slug,
      name: 'FlickClaw',
      description: 'Demo project for clip generation and upload',
      agents: {
        create: agents,
      },
    },
  });

  await createProjectFolders(slug, agents.map((agent) => agent.name));
  console.log('Seed completed: FlickClaw created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });