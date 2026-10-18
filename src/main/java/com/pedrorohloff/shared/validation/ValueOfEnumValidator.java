package com.pedrorohloff.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ValueOfEnumValidator implements ConstraintValidator<ValueOfEnum, CharSequence> {
    private Class<? extends Enum<?>> enumClass;
    private List<String> acceptedValues;

    @Override
    public void initialize(ValueOfEnum annotation) {
        this.enumClass = annotation.enumClass();
        acceptedValues = Stream.of(annotation.enumClass().getEnumConstants())
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        if (value == null || enumClass == null) {
            return true;
        }

        String input = value.toString();
        for (Enum<?> constant : enumClass.getEnumConstants()) {
            if (constant.name().equalsIgnoreCase(input)) {
                return true;
            }
            try {
                Object displayValue = constant.getClass().getMethod("getValue").invoke(constant);
                if (displayValue != null && displayValue.toString().equalsIgnoreCase(input)) {
                    return true;
                }
            } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException ignored) {
                // The enum does not expose a public getValue() method; only constant names are accepted.
            }
        }
        return false;
    }
}
