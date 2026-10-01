export class SigningCancelledByUser extends Error {
  constructor() {
    super('Signing was cancelled by the user');
    this.name = 'SigningCancelledByUser';
  }
}
