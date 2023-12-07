import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async findRecentNotifications(userId: number): Promise<any> {
        const res = await this.prismaService.notification.findMany({
            where: {
                receiverId: userId
            }
        });

        return res;
    }
}