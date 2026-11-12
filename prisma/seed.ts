import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.POSTGRESS_DB_URL;

if (!connectionString) {
  throw new Error('POSTGRESS_DB_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  let inviter = await prisma.user.findUnique({
    where: {
      email: 'admin@example.com',
    },
    select: {
      id: true,
    },
  });

  if (!inviter) {
    const password = randomBytes(32).toString('base64url');
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    inviter = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Seed Admin',
        password: passwordHash,
      },
      select: {
        id: true,
      },
    });
  }

  const result = await prisma.invitation.createMany({
    data: [
      {
        email: 'pryatko.oleg@gmail.com',
        userId: inviter.id,
      },
      {
        email: 'bob@example.com',
        userId: inviter.id,
      },
      {
        email: 'charlie@example.com',
        userId: inviter.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${result.count} invitations`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
