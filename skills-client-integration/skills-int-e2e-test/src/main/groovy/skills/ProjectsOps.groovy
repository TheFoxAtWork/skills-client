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
package skills

//import callStack.profiler.Profile
import groovy.util.logging.Slf4j
import org.apache.commons.io.FileUtils

@Slf4j
class ProjectsOps {

    File workDir

    // private
    TitlePrinter titlePrinter = new TitlePrinter()
    private List<NpmProj> allProjCached

    List<NpmProj> getAllProj() {
        if (!allProjCached) {
            allProjCached = new NpmProjBuilder(loc: skillsClient).build()
        }
        return allProjCached
    }

    File getSkillsClient(){
        new File(workDir, "skills-client")
    }

//    @Profile
    private void clearWorkDir() {
        log.info("releaseDir is [${workDir.absolutePath}]")
        if (workDir.exists()) {
            FileUtils.deleteDirectory(workDir)
            log.info("removed previous release dir [{}]", workDir.absolutePath)
        }

        assert !workDir.exists()
        workDir.mkdirs()
    }

//    @Profile
    void checkoutLinkedNpmLibs(String switchToBranch = null) {
        clearWorkDir()
        titlePrinter.printTitle("Checkout skills-client")

        new ProcessRunner(loc: workDir).run("git clone git@gitlab.evoforge.org:skills/skills-client.git")
        if (switchToBranch && switchToBranch != "master") {
            new ProcessRunner(loc: workDir).run("git checkout ${switchToBranch}")
        }
    }

    boolean hasUnreleasedChanges(){
        // TODO: check specific projects using 'git diff'
        return true
    }


//    @Profile
    void buildClientIntApp() {
        titlePrinter.printTitle("Building Client Examples App")
        File loc = new File(skillsClient, "skills-client-integration")
        new ProcessRunner(loc: loc).run("mvn --batch-mode clean package")
    }


//    @Profile
    void runCypressTests(File location, String msg, List<String> cypressEnv = [], String npmIntegrationNamespace = "integration") {
        titlePrinter.printTitle("Running cypress tests: [${msg}]")
        killServerProcesses()
        try {
            new ProcessRunner(loc: location, waitForOutput: false).run("npm run backend:start:release &")
            new ProcessRunner(loc: location, waitForOutput: false).run("npm run ${npmIntegrationNamespace}:start:release &")
            // this will install cypress, can do that while servers are starting
            new ProcessRunner(loc: location).run("npm install")
            new ProcessRunner(loc: location).run("npm run backend:waitToStart")
            new ProcessRunner(loc: location).run("npm run ${npmIntegrationNamespace}:waitToStart")

            titlePrinter.printSubTitle("Starting Cypress tests [${msg}]")

            String env = cypressEnv ? " --env ${cypressEnv.join(",")}" : ""
            new ProcessRunner(loc: location).run("npx cypress run${env}")
        } finally {
            killServerProcesses()
        }
    }

    private void killServerProcesses() {
        new ProcessUtils().killProcessIfContainsStr(":serverConfigs/integration_application.properties")
        new ProcessUtils().killProcessIfContainsStr(":serverConfigs/backend_application.properties")
        new ProcessUtils().killProcessIfContainsStr(":serverConfigs/examples_application.properties")
    }

}
