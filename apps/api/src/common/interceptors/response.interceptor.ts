import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && data.__paginated) {
          const { items, meta } = data;
          return { success: true, data: items, meta, timestamp: new Date().toISOString() };
        }
        return { success: true, data, timestamp: new Date().toISOString() };
      }),
    );
  }
}
