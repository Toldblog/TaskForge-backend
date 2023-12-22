import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
// import { GatewayModule } from 'src/gateway/gateway.module';
import { JwtModule } from '@nestjs/jwt';
// import { AppGateway } from 'src/gateway/app.gateway';

@Module({
  imports: [JwtModule],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}
