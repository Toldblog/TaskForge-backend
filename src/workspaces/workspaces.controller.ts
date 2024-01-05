import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards';
import { Role, Roles, RolesGuard, WorkspaceGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { CRUDService } from 'src/common/providers';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dtos';
import * as crypto from 'crypto';
import { MailService } from 'src/email/mail.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class WorkspacesController {
    constructor(
        private workspaceService: WorkspacesService,
        private mailService: MailService,
        private crudService: CRUDService
    ) { }

    @Get()
    @Roles(Role.ADMIN)
    async getAllWorkspaces(@Query() options: any): Promise<any> {
        try {
            const result = await this.crudService.getAll('workspace', options, {
                boards: true
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get('my-workspaces')
    async getMyWorkspaces(@GetUser() user: User): Promise<any> {
        try {
            const result = await this.crudService.getAll('workspaceMember', {
                userId: user.id
            }, {
                workspace: {
                    include: {
                        boards: {
                            include: {
                                boardMembers: true
                            }
                        }
                    }
                }
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get(':id')
    @UseGuards(WorkspaceGuard)
    async getWorkspace(@Param('id', ParseIntPipe) id: number): Promise<any> {
        try {
            const result = await this.crudService.getOne('workspace', id, {
                boards: true
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get(":id/members")
    @UseGuards(WorkspaceGuard)
    getWorkspaceMembers(@Param('id', ParseIntPipe) id: number, @Query('search') search: string): any {
        return this.workspaceService.getWorkspaceMembers(id, search ? search : '');
    }

    @Post()
    async createWorkspace(@GetUser() user: User, @Body() body: CreateWorkspaceDto): Promise<any> {
        try {
            const { workspace } = await this.crudService.createOne('workspace', {
                ...body,
                adminIds: [user.id]
            });

            const hash = crypto.createHash('sha256');
            const inviteToken = hash.update(String(workspace.id)).digest('hex');

            const result = await this.crudService.updateOne("workspace", workspace.id, { inviteToken });
            // create new workspace member row
            await this.crudService.createOne("workspaceMember", {
                userId: user.id,
                workspaceId: workspace.id
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    @Patch(':id')
    @UseGuards(WorkspaceGuard)
    async updateWorkspace(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateWorkspaceDto): Promise<any> {
        try {
            const result = await this.crudService.updateOne("workspace", id, body, {
                boards: true
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Delete(':id')
    @UseGuards(WorkspaceGuard)
    async deleteWorkspace(@Param('id', ParseIntPipe) id: number): Promise<any> {
        try {
            const result = await this.crudService.deleteOne("workspace", id);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Post(':workspaceId/send-invitation/:userId')
    @UseGuards(WorkspaceGuard)
    async sendInvitation(
        @GetUser() sender: User,
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('userId', ParseIntPipe) userId: number
    ): Promise<any> {
        try {
            await this.crudService.createOne('workspaceMember', {
                workspaceId, userId
            });

            // send workspace invitation mail
            const { user } = await this.crudService.getOne('user', userId);
            const { workspace } = await this.crudService.getOne('workspace', workspaceId);

            await this.mailService.sendWorkspaceInvitation(user.email, sender.name, workspace);

            return null;
        } catch (error) {
            throw error;
        }
    }

    @Post('accept-invitation-link/:token')
    acceptInvitationLink(@GetUser() user: User, @Param('token') token: string): any {
        return this.workspaceService.acceptInvitationLink(user.id, token);
    }

    @Delete('leave-workspace/:id')
    @UseGuards(WorkspaceGuard)
    leaveWorkspace(@GetUser() user: User, @Param('id', ParseIntPipe) id: number): any {
        return this.workspaceService.leaveWorkspace(user.id, id);
    }

    @Delete(':workspaceId/remove-workspace-member/:userId')
    @UseGuards(WorkspaceGuard)
    removeWorkspaceMember(
        @GetUser() admin: User,
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('userId', ParseIntPipe) userId: number
    ): any {
        return this.workspaceService.removeWorkspaceMember(workspaceId, userId);
    }

    @Patch(':workspaceId/add-admin/:userId')
    @UseGuards(WorkspaceGuard)
    addAdmin(
        @GetUser() admin: User,
        @Param('workspaceId', ParseIntPipe) workspaceId: number,
        @Param('userId', ParseIntPipe) userId: number
    ): any {
        return this.workspaceService.addAdminToWorkspace(admin.id, admin.name, workspaceId, userId);
    }
}
