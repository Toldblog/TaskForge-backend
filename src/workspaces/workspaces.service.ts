import { Injectable, BadRequestException } from '@nestjs/common';
import { UtilService } from 'src/common/providers';
import { AppGateway } from 'src/gateway/app.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly utilService: UtilService,
        private readonly appGateway: AppGateway
    ) { }

    async removeWorkspaceMember(
        ownerId: number, ownerName: string,
        workspaceId: number, userId: number
    ): Promise<any> {
        try {
            const workspace = await this.prismaService.workspace.findUnique({
                where: { id: workspaceId }
            });

            // remove the user out of workspace
            await this.prismaService.workspaceMember.delete({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId
                    }
                }
            });
            if (workspace.adminIds.includes(userId)) {
                await this.prismaService.workspace.update({
                    where: { id: workspaceId },
                    data: {
                        adminIds: workspace.adminIds.filter(id => id !== userId)
                    }
                });
            }

            // add new notification
            await this.prismaService.notification.create({
                data: {
                    type: 'REMOVE',
                    senderId: ownerId,
                    receiverId: userId,
                    workspaceId
                }
            });

            this.appGateway.server.emit(`removeWorkspaceMember-${userId}`, {
                adminName: ownerName,
                workspaceName: workspace.name
            });
        } catch (error) {
            throw error;
        }
    }

    async addAdminToWorkspace(
        ownerId: number, ownerName: string,
        workspaceId: number, userId: number
    ): Promise<any> {
        try {
            const workspace = await this.prismaService.workspace.findUnique({
                where: { id: workspaceId }
            });

            if (workspace.adminIds.includes(userId)) {
                throw new BadRequestException('The user is already an admin of the workspace')
            }

            // check the user is already a member of the workspace
            const workspaceMember = await this.prismaService.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId
                    }
                }
            });
            if (!workspaceMember) {
                throw new BadRequestException('The user is not a member of the workspace')
            }

            // update workspace admins
            const updatedWorkspace = await this.prismaService.workspace.update({
                where: { id: workspaceId },
                data: {
                    adminIds: [...workspace.adminIds, userId]
                }
            });
            // add new notification
            await this.prismaService.notification.create({
                data: {
                    type: 'ADD_ADMIN',
                    senderId: ownerId,
                    receiverId: userId,
                    workspaceId
                }
            });

            this.appGateway.server.emit(`addAdmin-${userId}`, {
                adminName: ownerName,
                workspaceName: workspace.name,
                workspaceId: workspace.id
            });

            return {
                workspace: this.utilService.filterResponse(updatedWorkspace)
            };
        } catch (error) {
            throw error;
        }
    }
}
