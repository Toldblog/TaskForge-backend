import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UtilService } from 'src/common/providers';
// import { AppGateway } from 'src/gateway/app.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilService,
    // private readonly appGateway: AppGateway
  ) { }

  async acceptInvitationLink(userId: number, token: string): Promise<any> {
    try {
      const workspace = await this.prismaService.workspace.findFirst({
        where: { inviteToken: token },
        include: { boards: true },
      });
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      // add new record to the BoardMember model if not exists
      await this.prismaService.workspaceMember.upsert({
        where: { id: { userId, workspaceId: workspace.id } },
        create: {
          userId,
          workspaceId: workspace.id,
        },
        update: {},
      });

      return {
        workspace: this.utilService.filterResponse(workspace),
      };
    } catch (error) {
      throw error;
    }
  }

  async leaveWorkspace(userId: number, workspaceId: number): Promise<any> {
    try {
      // check if the workspace has any admin after leaving
      const workspace = await this.prismaService.workspace.findUnique({
        where: { id: workspaceId },
      });
      const workspaceMember = await this.prismaService.workspaceMember.findMany(
        {
          where: {
            workspaceId,
          },
        },
      );

      if (workspaceMember.length == 1) {
        throw new BadRequestException('Can not leave this workspace');
      } else if (
        workspace.adminIds.length == 1 &&
        workspace.adminIds[0] === userId
      ) {
        throw new BadRequestException(
          'You should allow other workspace members to be a administrator before leaving.',
        );
      }

      await this.prismaService.workspaceMember.delete({
        where: {
          id: {
            userId,
            workspaceId,
          },
        },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  async removeWorkspaceMember(
    workspaceId: number,
    userId: number,
  ): Promise<any> {
    try {
      const workspace = await this.prismaService.workspace.findUnique({
        where: { id: workspaceId },
      });

      // remove the user out of workspace
      await this.prismaService.workspaceMember.delete({
        where: {
          id: {
            userId,
            workspaceId,
          },
        },
      });
      if (workspace.adminIds.includes(userId)) {
        await this.prismaService.workspace.update({
          where: { id: workspaceId },
          data: {
            adminIds: workspace.adminIds.filter((id) => id !== userId),
          },
        });
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  async addAdminToWorkspace(
    adminId: number,
    adminName: string,
    workspaceId: number,
    userId: number,
  ): Promise<any> {
    try {
      const workspace = await this.prismaService.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (workspace.adminIds.includes(userId)) {
        throw new BadRequestException(
          'The user is already an admin of the workspace',
        );
      }

      // check the user is already a member of the workspace
      const workspaceMember =
        await this.prismaService.workspaceMember.findUnique({
          where: {
            id: {
              userId,
              workspaceId,
            },
          },
        });
      if (!workspaceMember) {
        throw new BadRequestException(
          'The user is not a member of the workspace',
        );
      }

      // update workspace admins
      const updatedWorkspace = await this.prismaService.workspace.update({
        where: { id: workspaceId },
        data: {
          adminIds: [...workspace.adminIds, userId],
        },
      });
      // add new notification
      // await this.prismaService.notification.create({
      //   data: {
      //     type: 'ADD_ADMIN',
      //     senderId: adminId,
      //     receiverId: userId,
      //     workspaceId,
      //   },
      // });

      return {
        workspace: this.utilService.filterResponse(updatedWorkspace),
      };
    } catch (error) {
      throw error;
    }
  }

  async getWorkspaceMembers(workspaceId: number, search: string): Promise<any> {
    try {
      let users = await this.prismaService.user.findMany({
        where: {
          workspaceMembers: {
            some: {
              workspaceId,
            },
          },
          OR: [
            {
              name: {
                mode: 'insensitive',
                contains: search,
              },
            },
            {
              email: {
                mode: 'insensitive',
                contains: search,
              },
            },
          ],
        },
      });
      users = users.map((user) => this.utilService.filterUserResponse(user));

      return {
        results: users.length,
        users: users,
      };
    } catch (error) {
      throw error;
    }
  }
}
