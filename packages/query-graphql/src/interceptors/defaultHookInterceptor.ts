import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';

export class DefaultHookInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		return next.handle();
	}
}