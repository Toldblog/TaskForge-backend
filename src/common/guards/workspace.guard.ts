import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        let workspaceId = null;

        if (request.route.path.includes('/workspaces') && request.route.path.includes('/:id')) {
            workspaceId = request.params.id;
        }
        else if (request.route.path.includes(':workspaceId')) {
            workspaceId = request.params.workspaceId;
        }
        else if(Object.keys(request.body).includes('workspaceId')) {
            workspaceId = request.body.workspaceId;
        }

        const workspace = await this.prismaService.workspace.findUnique({
            where: { id: Number(workspaceId) }
        });
        if (!workspace) {
            throw new NotFoundException("Workspace not found");
        }

        // If ADMIN accesses the route, return true
        if (user.role === Role.ADMIN)
            return true;
        if (!workspace.adminIds.includes(user.id)) {
            throw new ForbiddenException("You are not the administrator of a workspace");
        }

        return true;
    }
}
