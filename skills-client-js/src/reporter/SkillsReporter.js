/*
 * Copyright 2020 SkillTree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import SkillsConfiguration from '../config/SkillsConfiguration';

const SUCCESS_EVENT = 'skills-report-success';
const FAILURE_EVENT = 'skills-report-error';

const successHandlerCache = new Set();
const errorHandlerCache = new Set();

const callSuccessHandlers = (event) => {
  successHandlerCache.forEach((it) => it(event));
};

const callErrorHandlers = (event) => {
  errorHandlerCache.forEach((it) => it(event));
};

const connectWebsocket = (serviceUrl) => {
  const socket = new SockJS(`${serviceUrl}/skills-websocket`);
  const stompClient = Stomp.over(socket);
  stompClient.debug = () => {};
  let headers = {};
  if (!SkillsConfiguration.isPKIMode()) {
    headers = { Authorization: `Bearer ${SkillsConfiguration.getAuthToken()}` };
  }
  if (!stompClient.connected) {
    stompClient.connect(headers, () => {
      const topic = `/user/queue/${SkillsConfiguration.getProjectId()}-skill-updates`;
      stompClient.subscribe(topic, (update) => {
        callSuccessHandlers(JSON.parse(update.body));
      });
      window.postMessage({ skillsWebsocketConnected: true }, window.location.origin);
    });
  }
};

const getAuthenticationToken = function getAuthenticationToken() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', SkillsConfiguration.getAuthenticator());

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
          reject(new Error('Unable to authenticate'));
        } else {
          const response = JSON.parse(xhr.response);
          if (!response.access_token) {
            reject(new Error('Unable to authenticate'));
          } else {
            resolve(response.access_token);
          }
        }
      }
    };

    xhr.send();
  });
};

const authenticateAndRetry = function authenticateAndRetry(userSkillId, attemptCount, resolve, reject) {
  getAuthenticationToken()
    .then((token) => {
      SkillsConfiguration.setAuthToken(token);
      this.reportSkill(userSkillId, attemptCount + 1)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    })
    .catch((error) => {
      reject(error);
    });
};

const SkillsReporter = {
  configure({
    notifyIfSkillNotApplied,
  }) {
    this.notifyIfSkillNotApplied = notifyIfSkillNotApplied;
  },

  addSuccessHandler(handler) {
    if (!this.websocketConnected) {
      SkillsConfiguration.afterConfigure()
        .then(() => {
          connectWebsocket(SkillsConfiguration.getServiceUrl());
        });
      this.websocketConnected = true;
    }
    successHandlerCache.add(handler);
  },
  addErrorHandler(handler) {
    errorHandlerCache.add(handler);
  },
  reportSkill(userSkillId, count = undefined) {
    SkillsConfiguration.validate();
    if (count >= 25) {
      throw new Error('Unable to authenticate after 25 attempts');
    }

    let countInternal = 0;
    if (count !== undefined) {
      countInternal = count;
    }

    const promise = new Promise((resolve, reject) => {
      if (!SkillsConfiguration.getAuthToken() && !SkillsConfiguration.isPKIMode()) {
        authenticateAndRetry.call(this, userSkillId, countInternal, resolve, reject);
      } else {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', `${SkillsConfiguration.getServiceUrl()}/api/projects/${SkillsConfiguration.getProjectId()}/skills/${userSkillId}`);
        xhr.withCredentials = true;
        if (!SkillsConfiguration.isPKIMode()) {
          xhr.setRequestHeader('Authorization', `Bearer ${SkillsConfiguration.getAuthToken()}`);
        }

        xhr.onreadystatechange = () => {
          // some browsers don't understand XMLHttpRequest.Done, which should be 4
          if (xhr.readyState === 4) {
            if (xhr.status !== 200 && xhr.status !== 0 && xhr.status !== 401) {
              reject(JSON.parse(xhr.response));
            } else if ((xhr.status === 401 || xhr.status === 0) && !SkillsConfiguration.isPKIMode()) {
              authenticateAndRetry.call(this, userSkillId, countInternal, resolve, reject);
            } else {
              resolve(JSON.parse(xhr.response));
            }
          }
        };

        if (this.notifyIfSkillNotApplied) {
          const body = JSON.stringify({ notifyIfSkillNotApplied: this.notifyIfSkillNotApplied });
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          xhr.send(body);
        } else {
          xhr.send();
        }
      }
    });

    promise.catch((error) => {
      callErrorHandlers(error);
    });

    return promise;
  },

  getConf() {
    return SkillsConfiguration;
  },
};

export {
  SkillsReporter,
  SUCCESS_EVENT,
  FAILURE_EVENT,
};
