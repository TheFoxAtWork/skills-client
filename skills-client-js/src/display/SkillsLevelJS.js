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
import axios from 'axios';

import SkillsConfiguration from '../config/SkillsConfiguration';
import { SkillsReporter } from '../reporter/SkillsReporter';

const emptyArrayIfNull = (value) => (value || []);

export default class SkillsLevelJS {
  constructor(projectId) {
    if (!SkillsConfiguration.wasConfigureCalled()) {
      throw new Error('SkillsConfiguration.configure must be called before invoking SkillsLevelJS constructor.');
    }
    this._projectId = projectId;
  }

  attachTo(selectorOrElement) {
    let skillLevelElement = selectorOrElement;
    if (typeof selectorOrElement === 'string') {
      skillLevelElement = document.querySelector(selectorOrElement);
    }
    if (!skillLevelElement) {
      throw new Error(`Can't find element with selector='${selectorOrElement}'`);
    }

    this._skillLevelElement = skillLevelElement;


    // load initial skill level
    SkillsConfiguration.afterConfigure()
      .then(() => {
        if (!this._projectId) {
          this._projectId = SkillsConfiguration.getProjectId();
        }
        const authToken = SkillsConfiguration.getAuthToken();
        axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
        axios.get(`${SkillsConfiguration.getServiceUrl()}/api/projects/${this._projectId}/level`, { withCredentials: true })
          .then((result) => {
            this.setSkillLevel(result.data);
            SkillsReporter.addSuccessHandler(this.update.bind(this));
          });
      });
  }

  update(details) {
    const completed = emptyArrayIfNull(details.completed);
    this._skillLevel = completed.filter((message) => message.id === 'OVERALL').reduce((maxLevel, currentLevelUpdateObject) => {
      const levelUpdate = currentLevelUpdateObject.level;
      return maxLevel < levelUpdate ? levelUpdate : maxLevel;
    }, this._skillLevel);
    this.setSkillLevel(this._skillLevel);
  }

  setSkillLevel(skillLevel) {
    this._skillLevel = skillLevel;
    this._skillLevelElement.innerText = `Level ${skillLevel}`;
  }

  get projectId() {
    return this._projectId;
  }

  get skillLevel() {
    return this._skillLevel;
  }
}
