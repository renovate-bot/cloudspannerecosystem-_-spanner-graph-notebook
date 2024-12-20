/**
 * Copyright 2024 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class GraphServer {
    defaultPort = 8195
    defaultHost = 'http://localhost'
    url = `${this.defaultHost}:${this.defaultPort}`
    isFetching = false;

    endpoints = {
        getPing: '/get_ping',
        postQuery: '/post_query',
    };

    buildRoute(endpoint) {
        return `${this.url}${endpoint}`;
    }
    
    constructor(url, project, instance, database, mock) {
        if (url) {
            this.url = url;
        }

        this.project = project;
        this.instance = instance;
        this.database = database;
        this.mock = mock;
    }
    
    query(queryString) {
        const request = {
            query: queryString,
            project: this.project,
            instance: this.instance,
            database: this.database,
            mock: this.mock
        };

        this.isFetching = true;

        if (typeof google !== 'undefined') {
            return google.colab.kernel.invokeFunction('spanner.Query', [], request)
                .then(result => result.data['application/json'])
                .finally(() => this.isFetching = false);
        }

        return fetch(this.buildRoute(this.endpoints.postQuery), {
            method: 'POST',
            body: JSON.stringify(request)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Assuming JSON response
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            })
            .finally(() => this.isFetching = false);
    }

    ping() {
        this.promise = fetch(this.buildRoute(this.endpoints.getPing))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Assuming JSON response
            })
            .then(data => {
                console.log(data); // Process the received data
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
}