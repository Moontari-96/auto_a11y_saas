import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // configService.get 뒤에 '!'를 붙여서 무조건 값이 있다고 확신시키거나, 
      // 뒤에 || 'default_secret' 처럼 기본값을 제공하세요.
      secretOrKey: configService.get<string>('JWT_SECRET')!, 
    });
  }

  async validate(payload: any) {
    // payload는 JWT 토큰에 담긴 정보 (예: { email: 'test@example.com', sub: 'uuid' })
    // 이 정보를 기반으로 사용자 객체를 구성하여 반환
    // 반환된 객체는 @Request() req.user 에 주입됨
    return { userId: payload.sub, email: payload.email };
  }
}
