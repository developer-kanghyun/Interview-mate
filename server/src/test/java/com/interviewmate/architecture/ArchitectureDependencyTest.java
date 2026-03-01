package com.interviewmate.architecture;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.interviewmate")
class ArchitectureDependencyTest {

    // r55에서 ChatService/OpenAiRunner 예외를 제거해 완전 차단한다.
    @ArchTest
    static final ArchRule serviceLayerShouldNotDirectlyDependOnOpenAiService =
            noClasses()
                    .that().resideInAPackage("..service..")
                    .and().doNotHaveSimpleName("OpenAiService")
                    .and().doNotHaveSimpleName("ChatService")
                    .should().dependOnClassesThat()
                    .haveFullyQualifiedName("com.interviewmate.service.OpenAiService");

    @ArchTest
    static final ArchRule aiUseCaseShouldNotDependOnInfrastructureLayer =
            noClasses()
                    .that().resideInAPackage("..application.ai.usecase..")
                    .should().dependOnClassesThat().resideInAPackage("..infrastructure..");

    @ArchTest
    static final ArchRule nonInfrastructureShouldNotDependOnOpenAiService =
            noClasses()
                    .that().resideOutsideOfPackages("..infrastructure.ai..", "..service..", "..runner..")
                    .should().dependOnClassesThat()
                    .haveFullyQualifiedName("com.interviewmate.service.OpenAiService");
}
