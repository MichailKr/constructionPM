import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserRole } from '@prisma/client';

// Валидация сложности пароля: мин 8 символов, минимум 1 буква и 1 цифра
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

export class AuthService {
  async register(email: string, password: string, name: string, requestedRole?: UserRole, creatorRole?: UserRole) {
    if (!PASSWORD_REGEX.test(password)) {
      throw new AppError('Password must be at least 8 characters and contain letters and numbers', 400, 'VALIDATION_ERROR');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Логика назначения ролей: только ADMIN может создавать ADMIN/MANAGER
    let role: UserRole = 'EMPLOYEE';
    if (requestedRole && creatorRole === 'ADMIN') {
      role = requestedRole;
    }

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role }
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Единое сообщение для защиты от user enumeration
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, isActive: true, createdAt: true }
    });

    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }
}