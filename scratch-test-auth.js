const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module.js');
const { PrismaService } = require('./dist/src/lib/prisma/prisma.service.js');
const { AuthService } = require('./dist/src/auth/auth.service.js');

async function bootstrap() {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/velvet_iron_dev?schema=public';
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const prisma = app.get(PrismaService);
  
  try {
    let user = await prisma.client.user.findFirst();
    if (!user) {
      user = await prisma.client.user.create({
        data: {
          email: 'test' + Date.now() + '@example.com',
          password: 'pass',
          name: 'Test'
        }
      });
    }

    console.log('Generating tokens...');
    const tokens = await authService.generateTokens(user);
    console.log('Generated Refresh Token:', tokens.refresh_token.substring(0, 20) + '...');
    
    console.log('Testing refreshToken endpoint...');
    const result = await authService.refreshToken(tokens.refresh_token);
    console.log('Success!', result.access_token ? 'Got access token' : 'No access token');
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await app.close();
  }
}
bootstrap();
