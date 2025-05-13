export class ExpectedIssue extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExpectedIssue';
  }
}