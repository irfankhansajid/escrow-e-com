package com.example.escrow.e_com.Mapper;

import com.example.escrow.e_com.dto.UserRegisterRequest;
import com.example.escrow.e_com.dto.UserResponse;
import com.example.escrow.e_com.entity.User;

import org.springframework.stereotype.Component;


@Component
public class UserMapper {

    public static UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        return response;
    }

    public static User toEntity(UserRegisterRequest dto) {
        User user = new User();
        user.setId(dto.getId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());

        return user;
    }
}
