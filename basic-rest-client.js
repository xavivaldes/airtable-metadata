import fetch from 'node-fetch';

class Service {
  constructor({client, operation}) {
    this.client = client;
    this.operation = operation;
  }

  r(id) {
    return new Service({client: this.client, operation: `${this.operation}/${id}`});
  }

  async retrieve() {
    return this.client.performCall({operation: this.operation});
  }

  async create(data) {
    return this.client.performCall({operation: this.operation, method: 'POST', body: data});
  }

  async update(data) {
    return this.client.performCall({operation: this.operation, method: 'PATCH', body: data});
  }

  async replace(data) {
    return this.client.performCall({operation: this.operation, method: 'PUT', body: data});
  }

  async delete() {
    return this.client.performCall({operation: this.operation, method: 'DELETE'});
  }
}

export class Client {
  constructor({endpoint, headers}) {
    this.endpoint = endpoint;
    this.headers = headers;
  }

  performCall({operation = '', method = 'GET', body}) {
    const url = `${this.endpoint}/${operation}`;
    return fetch(url, {
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      method,
      body: body ? JSON.stringify(body) : null
    })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(`Error calling ${method} ${url} body: ${JSON.stringify(body)}; Error: ${JSON.stringify(json.error)};`);
        return json;
      });
  }

  service(serviceName = '') {
    return new Service({client: this, operation: serviceName});
  }
}
