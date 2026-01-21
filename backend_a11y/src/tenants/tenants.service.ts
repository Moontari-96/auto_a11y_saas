import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  findAll() {
    return `This action returns all tenants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tenant`;
  }
}
