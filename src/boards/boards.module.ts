import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { JwtModule } from '@nestjs/jwt';
import { CRUDService } from 'src/common/providers';
import { AppGateway } from 'src/gateway/app.gateway';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [GatewayModule, JwtModule],
  controllers: [BoardsController],
  providers: [BoardsService, CRUDService, AppGateway]
})
export class BoardsModule { }
