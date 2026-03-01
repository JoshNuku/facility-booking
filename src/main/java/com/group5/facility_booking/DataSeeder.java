package com.group5.facility_booking;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.group5.facility_booking.model.Role;
import com.group5.facility_booking.model.User;
import com.group5.facility_booking.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@campus.edu";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail(adminEmail);
            admin.setPassword("admin123");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            System.out.println(">> Seeded default admin account");
        }
    }
}
