import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ select: { id: true, name: true, email: true } });

  for (const user of users) {
    let workspace = await db.workspace.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!workspace) {
      const name = user.name ? `${user.name.split(" ")[0]}'s workspace` : "My workspace";
      workspace = await db.workspace.create({ data: { userId: user.id, name } });
      console.log(`Created workspace "${name}" for ${user.email}`);
    }

    const [searches, leads, templates] = await Promise.all([
      db.search.updateMany({ where: { userId: user.id, workspaceId: null }, data: { workspaceId: workspace.id } }),
      db.lead.updateMany({ where: { userId: user.id, workspaceId: null }, data: { workspaceId: workspace.id } }),
      db.template.updateMany({ where: { userId: user.id, workspaceId: null }, data: { workspaceId: workspace.id } }),
    ]);
    console.log(
      `${user.email}: assigned ${searches.count} searches, ${leads.count} leads, ${templates.count} templates`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
