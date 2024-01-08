import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../email/mail.module';
@Module({
  imports: [JwtModule, MailModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
