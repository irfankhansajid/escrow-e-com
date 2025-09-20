package com.example.escrow.e_com.service;

import java.util.Optional;

import com.example.escrow.e_com.dto.UserRegisterRequest;
import com.example.escrow.e_com.dto.UserResponse;
import com.example.escrow.e_com.entity.User;
import com.example.escrow.e_com.exception.AlreadyExistsException;
import com.example.escrow.e_com.exception.UserNotFoundException;

public interface UserService {

    // Registration & Auth
    UserResponse registerUser(UserRegisterRequest dto) throws AlreadyExistsException;
    UserResponse authenticateUser(String email, String password) throws UserNotFoundException;

    // User Management
    Optional<UserResponse> findByEmail(String email);
    Optional<UserResponse> findById(Long id);
    boolean existsByEmail(String email);

    // Profile Management
    UserResponse updateUserProfile(Long userId, String name);

    // Role Management
    boolean hasRole(User user, String role);
    UserResponse updateUserRole(Long userId, String newRole);

    // Seller specific
    boolean isVerifiedSeller(User user);
}

