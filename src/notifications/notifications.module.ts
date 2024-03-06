import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service';
import { JwtModule } from '@nestjs/jwt';
import { CRUDService } from 'src/common/providers';
import { NotificationsController } from './notifications.controller';

@Module({
    imports: [JwtModule],
    providers: [NotificationsService, CRUDService],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule { }