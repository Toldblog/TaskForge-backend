import { PrismaClient } from "@prisma/client";
import templatesData from './dev-data/templates.json';

const prisma = new PrismaClient();

async function main() {
    await prisma.template.createMany({ data: templatesData });
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