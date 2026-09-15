package com.jobtracker.service;

import com.jobtracker.dto.request.LoginRequest;
import com.jobtracker.dto.request.RegisterRequest;
import com.jobtracker.dto.response.AuthResponse;
import com.jobtracker.entity.Role;
import com.jobtracker.entity.User;
import com.jobtracker.exception.BadRequestException;
import com.jobtracker.exception.ResourceNotFoundException;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setName("Sahil");
        registerRequest.setEmail("sahil@example.com");
        registerRequest.setPassword("password123");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("sahil@example.com");
        loginRequest.setPassword("password123");

        user = User.builder()
                .id(1L)
                .name("Sahil")
                .email("sahil@example.com")
                .password("encoded-password")
                .role(Role.STUDENT)
                .build();
    }

    @Test
    void register_shouldCreateUserAndReturnAuthResponse() {
        when(userRepository.existsByEmail("sahil@example.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("password123"))
                .thenReturn("encoded-password");

        doAnswer(invocation -> {
    User savedUser = invocation.getArgument(0);
    savedUser.setId(1L);
    return savedUser;
}).when(userRepository).save(any(User.class));

        when(jwtTokenProvider.generateToken(any(User.class)))
                .thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getName()).isEqualTo("Sahil");
        assertThat(response.getEmail()).isEqualTo("sahil@example.com");
        assertThat(response.getRole()).isEqualTo("STUDENT");

        verify(userRepository).existsByEmail("sahil@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
        verify(jwtTokenProvider).generateToken(any(User.class));
    }

    @Test
    void register_shouldCreateStudentWithEncodedPassword() {
        when(userRepository.existsByEmail("sahil@example.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("password123"))
                .thenReturn("encoded-password");

        doAnswer(invocation -> {
    User savedUser = invocation.getArgument(0);
    savedUser.setId(1L);
    return savedUser;
}).when(userRepository).save(any(User.class));

        when(jwtTokenProvider.generateToken(any(User.class)))
                .thenReturn("jwt-token");

        authService.register(registerRequest);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getName()).isEqualTo("Sahil");
        assertThat(savedUser.getEmail()).isEqualTo("sahil@example.com");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(savedUser.getRole()).isEqualTo(Role.STUDENT);
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        when(userRepository.existsByEmail("sahil@example.com"))
                .thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already registered");

        verify(userRepository).existsByEmail("sahil@example.com");
        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(anyString());
        verify(jwtTokenProvider, never()).generateToken(any(User.class));
    }

    @Test
    void login_shouldAuthenticateAndReturnAuthResponse() {
        when(authenticationManager.authenticate(any(
                UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);

        when(userRepository.findByEmail("sahil@example.com"))
                .thenReturn(Optional.of(user));

        when(jwtTokenProvider.generateToken(user))
                .thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getName()).isEqualTo("Sahil");
        assertThat(response.getEmail()).isEqualTo("sahil@example.com");
        assertThat(response.getRole()).isEqualTo("STUDENT");

        verify(authenticationManager).authenticate(any(
                UsernamePasswordAuthenticationToken.class));

        verify(userRepository).findByEmail("sahil@example.com");
        verify(jwtTokenProvider).generateToken(user);
    }

    @Test
    void login_shouldPassEmailAndPasswordToAuthenticationManager() {
        when(authenticationManager.authenticate(any(
                UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);

        when(userRepository.findByEmail("sahil@example.com"))
                .thenReturn(Optional.of(user));

        when(jwtTokenProvider.generateToken(user))
                .thenReturn("jwt-token");

        authService.login(loginRequest);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);

        verify(authenticationManager).authenticate(captor.capture());

        UsernamePasswordAuthenticationToken authenticationToken =
                captor.getValue();

        assertThat(authenticationToken.getPrincipal())
                .isEqualTo("sahil@example.com");

        assertThat(authenticationToken.getCredentials())
                .isEqualTo("password123");
    }

    @Test
    void login_shouldThrowWhenUserDoesNotExist() {
        when(authenticationManager.authenticate(any(
                UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);

        when(userRepository.findByEmail("sahil@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");

        verify(authenticationManager).authenticate(any(
                UsernamePasswordAuthenticationToken.class));

        verify(userRepository).findByEmail("sahil@example.com");
        verify(jwtTokenProvider, never()).generateToken(any(User.class));
    }

    @Test
    void login_shouldNotQueryUserWhenAuthenticationFails() {
        RuntimeException authenticationException =
                new RuntimeException("Authentication failed");

        when(authenticationManager.authenticate(any(
                UsernamePasswordAuthenticationToken.class)))
                .thenThrow(authenticationException);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isSameAs(authenticationException);

        verify(authenticationManager).authenticate(any(
                UsernamePasswordAuthenticationToken.class));

        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtTokenProvider, never()).generateToken(any(User.class));
    }
}