package com.example.escrow.e_com.service;

import java.util.Optional;

import com.example.escrow.e_com.Role;
import com.example.escrow.e_com.dto.UpdateRequestDTO;
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
    UserResponse findByEmail(String email) throws UserNotFoundException;
    UserResponse findById(Long id) throws UserNotFoundException;
    boolean existsByEmail(String email);

    // Profile Management
    UserResponse updateUserProfile(Long userId, UpdateRequestDTO dto) throws UserNotFoundException;

    // Role Management
    boolean hasRole(User user, Role role);
    UserResponse updateUserRole(Long userId, Role newRole);


    void deleteUser(Long id);

}

