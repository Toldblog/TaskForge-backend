import { Controller, Delete, Param, ParseIntPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class WorkspacesController {
    constructor(private workspaceService: WorkspacesService) { }

    @Delete(':workspaceId/remove-workspace-member/:userId')
    removeWorkspaceMember(
        @GetUser() owner: User,
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('userId', ParseIntPipe) userId: number
    ): any {
        return this.workspaceService.removeWorkspaceMember(owner.id, owner.name, workspaceId, userId);
    }

    @Post(':workspaceId/add-admin/:userId')
    addAdmin(
        @GetUser() owner: User,
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('userId', ParseIntPipe) userId: number
    ): any {
        return this.workspaceService.addAdminToWorkspace(owner.id, owner.name, workspaceId, userId);
    }
}
