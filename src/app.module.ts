import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mysql',
                host: config.get<string>('DB_HOST'),
                port: parseInt(config.get<string>('DB_PORT'), 10),
                username: config.get<string>('DB_USER'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_DATABASE'),
                entities: [__dirname + '/**/*.entity.{js,ts}'],
                synchronize: true,
            }),
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
