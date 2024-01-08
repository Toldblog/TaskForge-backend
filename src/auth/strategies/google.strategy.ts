import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly prismaService: PrismaService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/api/auth/google/redirect`,
            scope: ['email', 'profile']
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<any> {
        const { name, emails, photos } = profile

        const user = await this.prismaService.user.findFirst({
            where: {
                email: emails[0].value,
            }
        });

        // if user does not exist, create a new user with profile information (** NOT set active for user)
        // 'active' attribute only changed when user is created by sign up or password is added
        if (!user) {
            // create a random username for the new user
            let username = `${name.familyName.substring(0, 2)}${name.givenName.split(" ").pop()}`;
            username = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            while (await this.prismaService.user.findFirst({
                where: { username }
            })) {
                const rand = Math.floor(Math.random() * 10000);
                username = `${username}${rand}`;
            }

            const newUser = await this.prismaService.user.create({
                data: {
                    email: emails[0].value,
                    username: username,
                    name: `${name.familyName} ${name.givenName}`,
                    avatar: photos[0].value,
                }
            });

            return newUser;
        }

        return user;
    }
}