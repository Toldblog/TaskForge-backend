import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { GatewayModule } from 'src/gateway/gateway.module';
import { AppGateway } from 'src/gateway/app.gateway';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [GatewayModule, JwtModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, AppGateway],
})
export class WorkspacesModule { }
