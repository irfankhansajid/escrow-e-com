package com.example.escrow.e_com.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class UserRegisterRequest {

    private Long id;
    private String name;
    private String email;
    private String password;
    private String role;


}
