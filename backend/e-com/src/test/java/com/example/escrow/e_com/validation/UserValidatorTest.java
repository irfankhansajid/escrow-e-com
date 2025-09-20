package com.example.escrow.e_com.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserValidatorTest {

    private final UserValidator userValidator = new UserValidator();

    @Test
    void validateEmail() {
        assertTrue(userValidator.validateEmail("irfankhansajid@gmail.com"));
    }

    @Test
    void invalidateEmail(){
        assertFalse(userValidator.validateEmail("wrong-email"));
    }

    @Test
    void validatePassword() {
        assertTrue(userValidator.validatePassword("Password123@."));
    }
    @Test
    void invalidatePassword() {
        assertFalse(userValidator.validatePassword("abc"));
    }
}