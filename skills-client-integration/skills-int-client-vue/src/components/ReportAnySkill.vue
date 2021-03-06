/*
Copyright 2020 SkillTree

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
<template>
    <div>
        <code-example-layout :title="title" :sample-code="sampleCode" code-type="javascript">
            <div slot="code">
                <multiselect v-model="skill" :options="available" placeholder="Select a skill id" :taggable="true" @tag="addTag"/>

                <button
                  :disabled="!hasSelectedSkill"
                  :title="buttonTitle"
                  :class="!hasSelectedSkill ? 'disabled' : ''"
                  class="btn btn-outline-primary mt-2"
                  type="button"
                  @click="reportSkill">Report Skill</button>
            </div>
            <span slot="res">{{reportResult}}</span>
        </code-example-layout>
    </div>
</template>

<script>
    import axios from 'axios';
    import { SkillsReporter } from '@skilltree/skills-client-vue';
    import CodeExampleLayout from "./CodeExampleLayout";

    const beautify = require('js-beautify').js;

    export default {
        name: "ReportAnySkill",
        components: {CodeExampleLayout},
        data() {
            return {
                title: 'Pure JS - Report Any Skill',
                reportResult: '',
                sampleCode: beautify(
                    `SkillsReporter.reportSkill(this.skill)
                        .then((res) => {
                            this.reportResult = res;
                        });`, { indent_size: 2, indent_level: 1, end_with_newline: false }),
                skill: '',
                available: [],
            };
        },
        computed: {
            hasSelectedSkill() {
                return this.skill && this.skill !== '';
            },

            buttonTitle() {
                return this.hasSelectedSkill ? '' : 'Select a Skill to report from the dropdown';
            },
        },
        mounted() {
            axios.get("/api/skills")
                .then((result) => {
                    this.available = result.data;
                });
        },
        methods: {
            reportSkill() {
                SkillsReporter.reportSkill(this.skill)
                    .then((res) => {
                        this.reportResult = res;
                    })
                    .catch((res) => {
                        this.reportResult = res;
                    });
            },
            addTag(newTag) {
                this.available.push(newTag);
                this.skill = newTag;
            }
        },
    }
</script>

<style scoped>

</style>
