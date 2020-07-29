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
import Vue from 'vue';
import {
  SkillsConfiguration,
  SkillsReporter,
  SUCCESS_EVENT,
  FAILURE_EVENT,
  SkillsDisplayJS,
  SkillsLevelJS,
} from '@skilltree/skills-client-js';
import SkillsDirective from './directive/SkillsReporterDirective';
import SkillsDisplay from './component/SkillsDisplay.vue';
import SkillsLevel from './component/SkillsLevel.vue';

const install = (vue) => {
  vue.directive('skills', SkillsDirective);
};

if (window.Vue) {
  window.SkillsDirective = SkillsDirective;
  Vue.use(install);
}

SkillsDirective.install = install;
SkillsConfiguration.skillsClientVersion = '__skillsClientVersion__';

export {
  SkillsDirective,
  SkillsDisplay,
  SkillsLevel,
  SkillsConfiguration,
  SkillsReporter,
  SUCCESS_EVENT,
  FAILURE_EVENT,
  SkillsDisplayJS,
  SkillsLevelJS,
};
