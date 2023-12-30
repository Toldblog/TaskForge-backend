import { PrismaClient, Role, TemplateType } from "@prisma/client";
import templatesData from './dev-data/templates.json';
import usersData from './dev-data/users.json';
import workspacesData from './dev-data/workspaces.json';
import workspaceMemberData from './dev-data/workspace_member.json';
import boardsData from './dev-data/boards.json';
import boardMemberData from './dev-data/board_member.json';
import listsData from './dev-data/lists.json';
import cardsData from './dev-data/cards.json';
import cardAssigneeData from './dev-data/card_assignee.json';

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

async function addWorkspaces() {
    await prisma.workspace.createMany({ data: workspacesData });
}

async function addWorkspaceMemberData() {
    await prisma.workspaceMember.createMany({ data: workspaceMemberData });
}

async function addBoardsData() {
    await prisma.board.createMany({ data: boardsData });
}

async function addBoardMemberData() {
    await prisma.boardMember.createMany({ data: boardMemberData });
}

async function addListsData() {
    await prisma.list.createMany({ data: listsData });
}

async function addCardsData() {
    await prisma.card.createMany({ data: cardsData });
}

async function addCardAssigneeData() {
    await prisma.cardAssignee.createMany({ data: cardAssigneeData });
}

async function main() {
    await addTemplates();
    await addUsers();
    await addWorkspaces();
    await addWorkspaceMemberData();
    await addBoardsData();
    await addBoardMemberData();
    await addListsData();
    await addCardsData();
    await addCardAssigneeData();
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