export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ApplicationValidationError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationValidationError';
  }
}

export class ApplicationNotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationNotFoundError';
  }
}
