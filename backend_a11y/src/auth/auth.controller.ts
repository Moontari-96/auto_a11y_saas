import { Controller, Post, Body, UnauthorizedException,  UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './public.decorator';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: '로그인', description: '이메일과 비밀번호로 로그인합니다.' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입', description: '새로운 사용자를 등록합니다.' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('seed')
  @ApiOperation({ summary: '개발용 초기 사용자 생성', description: '기본 관리자 계정을 생성합니다 (개발 환경에서만 사용).' })
  async seedUser() {
    const email = 'admin@example.com';
    const password = 'password'; // Use a strong password in production!
    const name = 'Admin User';

    try {
      const user = await this.authService.register({ email, password, name });
      return { success: true, message: '기본 관리자 계정이 생성되었습니다.', user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return { success: false, message: error.message };
      }
      throw error;
    }
  }
}
