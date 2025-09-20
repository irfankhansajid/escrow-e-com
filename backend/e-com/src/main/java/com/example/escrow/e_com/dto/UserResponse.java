package com.example.escrow.e_com.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;

}
