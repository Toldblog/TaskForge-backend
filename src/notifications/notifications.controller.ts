import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CRUDService } from 'src/common/providers';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { CreateNotificationDto } from './dtos';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly crudService: CRUDService,
    ) { }

    @Post()
    createNotification(@GetUser() user: User, @Body() body: CreateNotificationDto): any {
        return this.notificationsService.createNotification(user.id, body);
    }

    @Delete(':id')
    deleteNotification(@GetUser() user: User, @Param('id', ParseIntPipe) notificationId: number): any {
        return this.notificationsService.deleteNotification(user.id, notificationId);
    }

    @Get('my-notifications')
    async getMyNotifications(@GetUser() user: User): Promise<any> {
        try {
            const result = await this.crudService.getAll('notification', {
                receiverId: user.id,
                sort: "-createdAt"
            }, { board: true, workspace: true, card: true });

            return result;
        } catch (error) {
            throw error;
        }
    }
}
