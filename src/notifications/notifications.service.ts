import { PrismaService } from "src/prisma/prisma.service";
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from "./dtos";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async createNotification(userId: number, body: CreateNotificationDto): Promise<any> {
        try {
            const checkReceiver = await this.prismaService.user.findUnique({
                where: { id: body.receiverId }
            });
            if (!checkReceiver) {
                throw new NotFoundException("The notification receiver not found");
            }

            // create notification
            const notification = await this.prismaService.notification.create({
                data: {
                    ...body,
                    senderId: userId,
                    type: NotificationType[body.type.toUpperCase()]
                }
            });

            return { notification }
        } catch (error) {
            throw error;
        }
    }

    async deleteNotification(userId: number, notificationId: number): Promise<any> {
        try {
            // check notification
            const notification = await this.prismaService.notification.findUnique({
                where: { id: notificationId }
            });
            if (!notification) {
                throw new NotFoundException('Notification not found');
            }

            // check user permission
            if (notification.receiverId !== userId) {
                throw new ForbiddenException("You are not allowed to delete this notification");
            }

            // delete notification
            await this.prismaService.notification.delete({
                where: { id: notificationId }
            });

            return null;
        } catch (error) {
            throw error;
        }
    }

    async getRecentNotifications(userId: number): Promise<any> {
        const res = await this.prismaService.notification.findMany({
            where: {
                receiverId: userId
            },
            take: 5,
        });

        return res;
    }
}