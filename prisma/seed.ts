import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin User", email: "admin@example.com", role: "ADMIN" },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: { name: "Sam Member", email: "member@example.com", role: "MEMBER" },
  });

  const resources = [
    { name: "Boardroom", type: "Meeting Room", location: "Floor 3", capacity: 12, description: "Large room with projector" },
    { name: "Meeting Room A", type: "Meeting Room", location: "Floor 2", capacity: 6, description: "Small team meetings" },
    { name: "Training Hall", type: "Hall", location: "Ground Floor", capacity: 40, description: "Workshops and training" },
    { name: "Company Van", type: "Vehicle", location: "Parking", capacity: 8, description: "Shared transport" },
    { name: "Projector Kit", type: "Equipment", location: "IT Store", capacity: null, description: "Portable projector and screen" },
  ];

  for (const r of resources) {
    await prisma.resource.upsert({ where: { name: r.name }, update: {}, create: r });
  }

  // Reset reservations so the seed can be re-run safely
  await prisma.reservation.deleteMany();

  const boardroom = await prisma.resource.findUniqueOrThrow({ where: { name: "Boardroom" } });

  // Tomorrow 10:00-11:30 and 14:00-15:00
  const base = new Date();
  base.setDate(base.getDate() + 1);
  const at = (h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.reservation.createMany({
    data: [
      { resourceId: boardroom.id, userId: member.id, startTime: at(10), endTime: at(11, 30), purpose: "Project kickoff" },
      { resourceId: boardroom.id, userId: admin.id, startTime: at(14), endTime: at(15), purpose: "Management review" },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());