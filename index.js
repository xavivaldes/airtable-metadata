const { Client } = require('./basic-rest-client.js');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_ENDPOINT = 'https://api.airtable.com';
const AIRTABLE_SERVICE_NAME = 'v0/meta';

class Table {
  constructor(schema, service) {
    this.schema = schema;
    this.service = service;
  }

  async listFields() {
    return this.schema.fields;
  }

  async getField(fieldId) {
    return this.schema.fields.find((f) => f.id === fieldId);
  }

  async createField(field) {
    const service = this.service.r('fields');
    return service.create(field);
  }

  async updateField(fieldId, field) {
    const service = this.service.r('fields').r(fieldId);
    return service.update(field);
  }

  async renameField(fieldId, newName) {
    const service = this.service.r('fields').r(fieldId);
    return service.update({ name: newName });
  }
}

class Base {
  constructor(schema, service) {
    this.schema = schema;
    this.service = service;
    this.tables = [];
    this.tablesMap = new Map();
  }

  async retrieveTables() {
    if (this.tables.size > 0) return;
    const service = this.service.r('tables');
    this.tables = await service
      .retrieve()
      .then((ss) => ss.tables.map((s) => new Table(s, service.r(s.id))));
    this.tablesMap = new Map(
      this.tables.reduce((a, t) => [...a, [t.schema.id, t]], [])
    );
  }

  async listTables() {
    await this.retrieveTables();
    return this.tables;
  }

  async getTable(tableId) {
    await this.retrieveTables();
    return this.tablesMap.get(tableId);
  }

  async createTable({
    name,
    fields = [{ type: 'singleLineText', name: 'name' }],
  }) {
    return new Table(
      await performCall({
        operation: `bases/${this.schema.id}/tables`,
        method: 'POST',
        body: { name, fields },
      }),
      this.schema.id
    );
  }
}

class AirtableMetadata {
  constructor({
    endpoint = AIRTABLE_ENDPOINT,
    service = AIRTABLE_SERVICE_NAME,
    apiKey = AIRTABLE_API_KEY,
  } = {}) {
    this.service = new Client({
      endpoint,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }).service(service);
  }

  async listBases() {
    const service = this.service.r('bases');
    return baseService
      .retrieve()
      .then((ss) => ss.bases.map((s) => new Base(s, service.r(s.id))));
  }

  async getBase(baseId) {
    const service = this.service.r('bases').r(baseId);
    return service.retrieve().then((s) => new Base(s, service));
  }
}

// const fieldTypes = [
//   'formula',
//   'singleSelect',
//   'multipleLookupValues',
//   'multipleSelects',
//   'date',
//   'singleLineText',
//   'createdTime',
//   'richText',
//   'multipleAttachments',
//   'multipleRecordLinks',
//   'singleCollaborator',
//   'multipleCollaborators',
//   'url',
//   'autoNumber',
//   'singleLineText',
//   'number',
//   'multilineText',
//   'dateTime',
//   'rollup',
//   'button',
//   'currency',
//   'lastModifiedTime',
//   'phoneNumber'
// ];

module.exports.AirtableMetadata = AirtableMetadata;
