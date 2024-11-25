import { Class, QueryService } from '@rezonate/nestjs-query-core';

import { getRelations } from '../../decorators';
import { BaseResolverOptions } from '../../decorators/resolver-method.decorator';
import { ReadRelationsResolver } from '../relations';
import { ServiceResolver } from '../resolver.interface';

export const FederationResolver = <DTO, QS extends QueryService<DTO> = QueryService<DTO>>(
  DTOClass: Class<DTO>,
  opts: BaseResolverOptions = {},
): Class<ServiceResolver<DTO, QS>> => ReadRelationsResolver(DTOClass, getRelations(DTOClass, opts));
