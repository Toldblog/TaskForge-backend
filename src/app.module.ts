import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { MailModule } from './email/mail.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CardsModule,
    CommentsModule,
    BoardsModule,
    ListsModule,
    UsersModule,
    WorkspacesModule,
    MailModule,
    NotificationsModule,
    CommonModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GatewayModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
