package com.example.escrow.e_com.controller;

import com.example.escrow.e_com.dto.AuthRequest;
import com.example.escrow.e_com.dto.UpdateRequestDTO;
import com.example.escrow.e_com.dto.UserRegisterRequest;
import com.example.escrow.e_com.dto.UserResponse;
import com.example.escrow.e_com.entity.User;
import com.example.escrow.e_com.exception.AlreadyExistsException;
import com.example.escrow.e_com.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // User Management
    @GetMapping("/id/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {

        return ResponseEntity.ok().body(userService.findById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok().body(userService.findByEmail(email));
    }

    @PostMapping("/create")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRegisterRequest dto) throws AlreadyExistsException {
        UserResponse userResponse = userService.registerUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    @PostMapping("/auth")
    public ResponseEntity<UserResponse> authentication(@Valid @RequestBody AuthRequest authRequest) {
        UserResponse userResponse = userService.authenticateUser(authRequest.getEmail(), authRequest.getPassword());
        return ResponseEntity.status(HttpStatus.OK).body(userResponse);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<UserResponse> deleteUser(@Valid @PathVariable Long id,
                                                   @RequestBody UpdateRequestDTO updateRequestDTO) {

        UserResponse updateUserResponse = userService.updateUserProfile(id, updateRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(updateUserResponse);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }


}
