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

class SpannerApp {
    /**
     * Unique ID to prevent namespace collisions across multiple iPython cells
     * @type {number}
     */
    id = 0;

    /**
     * @type {HTMLDivElement}
     */
    mount = null;

    /**
     * @type {GraphServer}
     */
    server = null;
    /**
     * @type {GraphStore}
     */
    store = null;
    /**
     * @type {Sidebar}
     */
    sidebar = null;
    /**
     * @type {GraphVisualization}
     */
    graph = null;

    lastQuery = '';

    constructor({id, url, project, instance, database, mock, mount, query}) {
        this.id = id;
        this.lastQuery = query;

        // mount must be valid
        if (!mount) {
            throw Error("Must have a valid HTML element to mount the app");
        }
        this.mount = mount;

        this.server = new GraphServer(url, project, instance, database, mock);
        this.server.query(query)
            .then(({error, response}) => {
                this.loaderElement.classList.add('hidden');

                if (error || !response) {
                    if (!error) {
                        error = 'An error has occurred';
                    }

                    this.errorElement.textContent = error;
                    this.errorElement.classList.remove('hidden');
                    return;
                }

                const {
                    nodes,
                    edges,
                    rows,
                    schema
                } = response;

                const fixedEdges = edges.map(edge => ({
                    ...edge,
                    to: edge.to instanceof Number ? edge.to : edge.target,
                    from: edge.from instanceof Number ? edge.from : edge.source
                }));

                const graphConfig = new GraphConfig({
                    nodesData: nodes,
                    edgesData: fixedEdges,
                    colorScheme: GraphConfig.ColorScheme.LABEL,
                    rowsData: rows,
                    schemaData: schema
                });

                this.store = new GraphStore(graphConfig);
                this.sidebar = new Sidebar(this.store, this.mount.querySelector(`#sidebar-${this.id}`));
                this.graph = new GraphVisualization(this.store,
                    this.mount.querySelector(`#force-graph-${this.id}`),
                    this.mount.querySelector(`#graph-menu-${this.id}`));

                const graphContainer = this.mount.querySelector(`#graph-container-${this.id}`);
                graphContainer.className =
                    this.store.viewMode === GraphStore.ViewModes.DEFAULT ? 'dots' : '';

                this.store.addEventListener(GraphStore.EventTypes.VIEW_MODE_CHANGE,
                    (viewMode, config) => {
                        graphContainer.className = viewMode === GraphStore.ViewModes.DEFAULT ? 'dots' : '';
                    });
            });

        this.scaffold();
    }

    scaffold() {
        if (!this.mount) {
            throw Error("Must have a valid HTML element to mount the app");
        }

        this.mount.className = `${this.mount.className} container`;
        this.mount.innerHTML = `
            <style>
                .container {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
            
                    margin: 0;
                    padding: 0;
                    font-family: 'Google Sans', Roboto, Arial, sans-serif;
                    overflow: hidden;
                }
            
                .container .content {
                    border-radius: 0 0 8px 8px;
                    display: flex;
                    flex: 1;
                    height: 616px;
                    width: 100%;
                    overflow: hidden;
                    position: relative;
                }
            
                #graph-container-${this.id} {
                    background-color: #FBFDFF;
                    width: 100%;
                }
            
                #force-graph-${this.id} {
                    width: 100%;
                    height: 616px;
                    position: relative;
                }
            
                .error  {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    font-family: 'Google Sans', Roboto, Arial, sans-serif;
                    font-size: 18px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    
                    background-color: #f8d7da;
                    border: 1px solid #f5c6cb;
                    border-radius: .25rem;
                    padding: .75rem 1.25rem;
                    color: #721c24;
                }
                
                .error.hidden,
                .loader-container.hidden {
                    display: none;
                }
                
                .loader-container {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    
                }
                
                .loader {
                  width: 48px;
                  height: 48px;
                  border: 5px solid rgba(0, 0, 0, 0);
                  border-bottom-color: #3498db;
                  border-radius: 50%;
                  display: inline-block;
                  box-sizing: border-box;
                  animation: rotation 1s linear infinite;
                  margin-right: 2rem;
                }
                
                @keyframes rotation {
                  0% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg);
                  }
                }
            </style>
            <div class="container">
                <header id="graph-menu-${this.id}"></header>
                <div class="content">
                    <div class="error hidden"></div>
                    <div class="loader-container">
                        <div class="loader"></div>
                    </div>
                    <div id="graph-container-${this.id}">
                        <div id="force-graph-${this.id}">
                        </div>
                    </div>
                    <div id="sidebar-${this.id}"></div>
                </div>
            </div>
        `;

        this.loaderElement = this.mount.querySelector('.loader-container');
        this.errorElement = this.mount.querySelector('.error');
    }
}