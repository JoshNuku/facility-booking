package com.group5.facility_booking.service;

import com.group5.facility_booking.dto.UserRequest;
import com.group5.facility_booking.exception.ResourceNotFoundException;
import com.group5.facility_booking.model.User;
import com.group5.facility_booking.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Integer userId) {
        Integer safeUserId = Objects.requireNonNull(userId, "userId must not be null");
        return userRepository.findById(safeUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public User createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        return userRepository.save(user);
    }

    public User updateUser(Integer userId, UserRequest request) {
        User existingUser = getUserById(userId);

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), existingUser.getId())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        existingUser.setName(request.getName());
        existingUser.setEmail(request.getEmail());
        existingUser.setRole(request.getRole());
        return userRepository.save(existingUser);
    }

    public void deleteUser(Integer userId) {
        Integer safeUserId = Objects.requireNonNull(userId, "userId must not be null");
        if (!userRepository.existsById(safeUserId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(safeUserId);
    }
}
