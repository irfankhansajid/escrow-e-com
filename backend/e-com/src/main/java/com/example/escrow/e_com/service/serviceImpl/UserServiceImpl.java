package com.example.escrow.e_com.service.serviceImpl;

import com.example.escrow.e_com.Mapper.UserMapper;
import com.example.escrow.e_com.Role;
import com.example.escrow.e_com.dto.UpdateRequestDTO;
import com.example.escrow.e_com.dto.UserRegisterRequest;
import com.example.escrow.e_com.dto.UserResponse;
import com.example.escrow.e_com.entity.User;
import com.example.escrow.e_com.exception.AlreadyExistsException;
import com.example.escrow.e_com.exception.RoleAlreadyAssignedException;
import com.example.escrow.e_com.exception.UserNotFoundException;
import com.example.escrow.e_com.repository.UserRepository;
import com.example.escrow.e_com.service.UserService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;



    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;

        this.passwordEncoder = passwordEncoder;

    }

    @Transactional
    @Override
    public UserResponse registerUser(UserRegisterRequest dto) throws AlreadyExistsException {


        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new AlreadyExistsException("Email already exist");
        }

        User user = UserMapper.toEntity(dto);

        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        user.setRole(Role.CUSTOMER); // Default role assignment

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
    public UserResponse findByEmail(String email) throws UserNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Email not found"));
        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse findById(Long id) throws UserNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
        return UserMapper.toResponse(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    @Override
    public UserResponse updateUserProfile(Long userId, UpdateRequestDTO dto) throws UserNotFoundException {
       User updateUser = userRepository.findById(userId)
               .orElseThrow(() ->  new UserNotFoundException("User not found with id: " + userId));

        if (dto.getName() != null) updateUser.setName(dto.getName());
        if (dto.getEmail() != null) updateUser.setEmail(dto.getEmail());
        if (dto.getPassword() != null) updateUser.setPassword(passwordEncoder.encode(dto.getPassword()));


       userRepository.save(updateUser);

       return UserMapper.toResponse(updateUser);
    }

    @Override
    public boolean hasRole(User user, Role role) {
        return user != null && user.getRole().equals(role);
    }

    @Transactional
    @Override
    public UserResponse updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));


        if (!user.getRole().equals(newRole)) {
            user.setRole(newRole);
            userRepository.save(user);
        } else {
            throw new RoleAlreadyAssignedException("Role Already assign ");
        }

        return UserMapper.toResponse(user);
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.findById(id).orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }
}
