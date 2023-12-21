import { PrismaClient } from "@prisma/client";
import templatesData from './dev-data/templates.json';
import usersData from './dev-data/users.json';

const prisma = new PrismaClient();

// async function cleanModel(model: string) {
//     await prisma[model].deleteMany({})
// }

async function main() {
    await prisma.template.createMany({ data: templatesData });
    await prisma.user.createMany({ data: usersData });
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

// yarn prisma db seed
// yarn reset-init-schema