package com.pedrorohloff.config;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

@Configuration
@ImportRuntimeHints(NativeHintsConfiguration.Hints.class)
class NativeHintsConfiguration {

  static class Hints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
      hints.reflection().registerTypeIfPresent(
          classLoader,
          "org.hibernate.validator.internal.util.logging.Log_$logger",
          MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS
          );
      hints.reflection().registerTypeIfPresent(
          classLoader,
          "org.hibernate.validator.internal.util.logging.Messages_$bundle",
          typeHint -> typeHint
              .withMembers(MemberCategory.INVOKE_DECLARED_METHODS)
              .withField("INSTANCE")
          );
    }
  }
}
