import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<string> {
    const { username, password } = dto;
    const expectedUser = process.env.ADMIN_USER;
    const expectedHash = process.env.ADMIN_PASS_HASH;

    if (!expectedUser || !expectedHash) {
      throw new UnauthorizedException('Credenciais de admin não configuradas');
    }

    const userMatch = username === expectedUser;
    const passMatch = await bcrypt.compare(password, expectedHash);

    if (!userMatch || !passMatch) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    return this.jwtService.sign({ sub: username, role: 'admin' });
  }
}
