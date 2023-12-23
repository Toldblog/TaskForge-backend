import { PrismaClient, Role, TemplateType } from "@prisma/client";
import templatesData from './dev-data/templates.json';
import usersData from './dev-data/users.json';

const prisma = new PrismaClient();

async function addTemplates() {
    const data = templatesData.map(template => ({
        ...template,
        type: TemplateType[template.type.toUpperCase()]
    }));
    await prisma.template.createMany({ data });
}

async function addUsers() {
    const data = usersData.map(user => ({
        ...user,
        role: Role[user.role.toUpperCase()]
    }));
    await prisma.user.createMany({ data });
}

async function main() {
    await addTemplates();
    await addUsers();
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

// yarn prisma db seed => insert data to models
// yarn reset-init-schema => reset schema, then insert data to models