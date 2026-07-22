export class LoadHistory {
  constructor(repository) { this.repository = repository; }
  execute() { return this.repository.load(); }
}
