package com.pedrorohloff.auth;

import com.pedrorohloff.auth.dto.AuthResponseDTO;
import com.pedrorohloff.auth.dto.LoginRequestDTO;
import com.pedrorohloff.auth.dto.RegisterRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthAccountService authAccountService;

    public AuthController(AuthAccountService authAccountService) {
        this.authAccountService = authAccountService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponseDTO register(@RequestBody @Valid @NotNull RegisterRequestDTO request) {
        return authAccountService.register(request);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody @Valid @NotNull LoginRequestDTO request) {
        return authAccountService.login(request);
    }
}
