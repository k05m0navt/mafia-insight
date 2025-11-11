import { DomainError } from './domain-error';

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}
