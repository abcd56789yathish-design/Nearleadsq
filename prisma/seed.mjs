import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@nearleadsq.app";
const DEMO_PASSWORD = "demo1234";

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash,
    },
  });

  let workspace = await db.workspace.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!workspace) {
    workspace = await db.workspace.create({
      data: { userId: user.id, name: "Demo workspace" },
    });
  }

  await db.template.upsert({
    where: { id: `${workspace.id}-intro` },
    update: {},
    create: {
      id: `${workspace.id}-intro`,
      userId: user.id,
      workspaceId: workspace.id,
      name: "Intro (WhatsApp)",
      body:
        "Hi {{business_name}}! 👋 I'm {{sender_name}} and I help local businesses get more customers. " +
        "Would you be open to a quick chat this week?",
      isDefault: true,
    },
  });

  const search = await db.search.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      query: "Austin, TX",
      lat: 30.2672,
      lng: -97.7431,
      countryCode: "US",
      category: "restaurants",
      radiusKm: 5,
    },
  });

  const leads = [
    {
      osmType: "node",
      osmId: "seed-1001",
      name: "Bluebonnet BBQ",
      category: "Restaurant",
      address: "612 E 6th St, Austin, TX",
      phone: "+1 512 555 0134",
      phoneE164: "+15125550134",
      website: "https://bluebonnetbbq.example.com",
      status: "CONTACTED",
      contactedAt: daysFromNow(-3),
    },
    {
      osmType: "node",
      osmId: "seed-1002",
      name: "Luna Verde Tacos",
      category: "Restaurant",
      address: "1900 E Cesar Chavez St, Austin, TX",
      phone: "+1 512 555 0177",
      phoneE164: "+15125550177",
      website: "https://lunaverde.example.com",
      email: "hello@lunaverde.example.com",
      emailSource: "https://lunaverde.example.com/contact",
      status: "REPLIED",
    },
    {
      osmType: "way",
      osmId: "seed-1003",
      name: "The Daily Grind Coffee",
      category: "Cafe",
      address: "2404 Manor Rd, Austin, TX",
      website: "https://dailygrind.example.com",
      status: "NEW",
    },
    {
      osmType: "node",
      osmId: "seed-1004",
      name: "Franklin's Fish Shack",
      category: "Seafood Restaurant",
      address: "1209 S Congress Ave, Austin, TX",
      phone: "+1 512 555 0102",
      phoneE164: "+15125550102",
      status: "NEW",
      followUpAt: daysFromNow(-1),
    },
    {
      osmType: "node",
      osmId: "seed-1005",
      name: "Pecan Street Pizzeria",
      category: "Pizzeria",
      address: "315 W 3rd St, Austin, TX",
      website: "https://pecanpizza.example.com",
      status: "WON",
      notes: "Signed up for the monthly promo package.",
    },
    {
      osmType: "way",
      osmId: "seed-1006",
      name: "Rainey Street Ramen",
      category: "Ramen Restaurant",
      address: "78 Rainey St, Austin, TX",
      phone: "+1 512 555 0198",
      phoneE164: "+15125550198",
      website: "https://raineyramen.example.com",
      status: "LOST",
      notes: "Already works with another agency.",
    },
  ];

  await Promise.all(
    leads.map((lead) =>
      db.lead.upsert({
        where: { userId_osmId: { userId: user.id, osmId: lead.osmId } },
        update: {},
        create: { ...lead, userId: user.id, workspaceId: workspace.id, searchId: search.id },
      })
    )
  );

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
