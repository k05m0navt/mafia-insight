import { DomainError } from './domain-error';

export class DomainNotFoundError extends DomainError {
  constructor(entity: string, identifier: string) {
    super(`${entity} with identifier "${identifier}" was not found.`);
    this.name = 'DomainNotFoundError';
  }
}
