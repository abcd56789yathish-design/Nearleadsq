import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log(
    "Seeding is disabled: NearLeadsQ uses Google-only sign-in. " +
      "Accounts (with a default workspace and templates) are created " +
      "automatically on first Google login."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());