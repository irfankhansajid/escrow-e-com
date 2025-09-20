package com.example.escrow.e_com.service.serviceImpl;

import com.example.escrow.e_com.Mapper.UserMapper;
import com.example.escrow.e_com.dto.UserRegisterRequest;
import com.example.escrow.e_com.dto.UserResponse;
import com.example.escrow.e_com.entity.User;
import com.example.escrow.e_com.exception.AlreadyExistsException;
import com.example.escrow.e_com.exception.UserNotFoundException;
import com.example.escrow.e_com.repository.UserRepository;
import com.example.escrow.e_com.service.UserService;
import com.example.escrow.e_com.validation.UserValidator;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserValidator userValidator;
    private final PasswordEncoder passwordEncoder;



    public UserServiceImpl(UserRepository userRepository, UserValidator userValidator, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userValidator = userValidator;
        this.passwordEncoder = passwordEncoder;

    }

    @Transactional
    @Override
    public UserResponse registerUser(UserRegisterRequest dto) throws AlreadyExistsException {

        userValidator.validateEmail(dto.getEmail());
        userValidator.validatePassword(dto.getPassword());

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new AlreadyExistsException("Email already exist");
        }

        User user = UserMapper.toEntity(dto);

        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        user.setRole("CUSTOMER"); // Default role assignment

        userRepository.save(user);
        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse authenticateUser(String email, String password) throws UserNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new UserNotFoundException("Invalid password");
            }
            return UserMapper.toResponse(user);
    }

    @Override
    public Optional<UserResponse> findByEmail(String email) {
        return Optional.empty();
    }

    @Override
    public Optional<UserResponse> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public boolean existsByEmail(String email) {
        return false;
    }

    @Override
    public UserResponse updateUserProfile(Long userId, String name) {
        return null;
    }

    @Override
    public boolean hasRole(User user, String role) {
        return false;
    }

    @Override
    public UserResponse updateUserRole(Long userId, String newRole) {
        return null;
    }

    @Override
    public boolean isVerifiedSeller(User user) {
        return false;
    }


}
