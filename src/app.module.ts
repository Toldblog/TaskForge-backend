import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
// import { CardsModule } from './cards/cards.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { MailModule } from './email/mail.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    // CardsModule,
    BoardsModule,
    ListsModule,
    UsersModule,
    WorkspacesModule,
    MailModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
