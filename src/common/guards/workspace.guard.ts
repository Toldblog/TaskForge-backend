import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from './roles.enum';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    let workspaceId = null;

    if (request.route.path.includes('/workspaces') && request.route.path.includes('/:id')) {
      workspaceId = request.params.id;
    } else if (request.route.path.includes(':workspaceId')) {
      workspaceId = request.params.workspaceId;
    } else if (Object.keys(request.body).includes('workspaceId')) {
      workspaceId = request.body.workspaceId;
    }
    if (!workspaceId) return true;

    const workspace = await this.prismaService.workspace.findUnique({
      where: { id: Number(workspaceId) },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // If ADMIN accesses the route, return true
    if (user.role === Role.ADMIN) return true;

    const workspaceMember = await this.prismaService.workspaceMember.findUnique({
      where: {
        id: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
    });
    if (request.method === 'GET') {
      if (workspaceMember) return true;
      else throw new ForbiddenException('The workspace is only accessed by its members');
    } else if (request.method === 'DELETE' && request.route.path.includes('/leave-workspace')) {
      if (workspaceMember) return true;
      else throw new ForbiddenException('You are not a member of the workspace');
    } else {
      if (!workspaceMember) {
        throw new ForbiddenException('You are not a member of the workspace');
      }
      if (!workspace.adminIds.includes(user.id)) {
        throw new ForbiddenException('You are not the administrator of a workspace');
      }
    }

    return true;
  }
}
